import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { PHASES, CATEGORIES } from '../lib/phases'
import { todayString } from '../lib/calendar'
import { B, bodyFont } from '../lib/theme'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const emptyForm = { time: '', task: '', ownerId: '', category: CATEGORIES[0], phase: PHASES[1].key }

// The Run of Show tab: task list grouped by phase, a manual add-task
// form, and status toggling. This replaces the old build's `ue` (manual
// add) and `ce` (status update) handlers with the same behavior, but
// with validation errors shown to the user instead of failing silently —
// that silent-failure pattern was the root cause of the "nothing added"
// and "nothing changed" bugs reported repeatedly against the old build.
export default function RunOfShowTab({ event, tasks, teamMembers, onTasksChange }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Which existing task's owner is currently being reassigned (null = none).
  // This was missing entirely in the rebuild — the only place you could set
  // an owner was the "Add Task" form, so there was no way to assign or
  // change the owner on a task that already existed.
  const [editingOwnerTaskId, setEditingOwnerTaskId] = useState(null)
  const [assignError, setAssignError] = useState('')

  const memberName = (id) => teamMembers.find((m) => m.id === id)?.name || 'Unassigned'

  const handleAssignOwner = async (task, newOwnerId) => {
    const ownerId = newOwnerId || null
    const { error } = await supabase
      .from('tasks')
      .update({ assigned_team_member_id: ownerId })
      .eq('id', task.id)

    if (error) {
      setAssignError(`Could not assign team member: ${error.message}`)
      return
    }

    setAssignError('')
    setEditingOwnerTaskId(null)
    onTasksChange(tasks.map((t) => (t.id === task.id ? { ...t, assigned_team_member_id: ownerId } : t)))
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!form.time || !form.task.trim()) {
      setFormError('Please fill in both a time and a task description.')
      return
    }
    setSubmitting(true)
    setFormError('')

    const ownerId = UUID_RE.test(form.ownerId) ? form.ownerId : null

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        event_id: event.id,
        time: form.time,
        task: form.task.trim(),
        assigned_team_member_id: ownerId,
        status: 'pending',
        category: form.category,
        phase: form.phase,
      })
      .select()
      .single()

    setSubmitting(false)

    if (error) {
      setFormError(`Could not save task: ${error.message}`)
      return
    }

    onTasksChange([...tasks, data].sort((a, b) => a.time.localeCompare(b.time)))
    setForm(emptyForm)
    setShowForm(false)
  }

  const cycleStatus = async (task) => {
    const next = task.status === 'pending' ? 'done' : task.status === 'done' ? 'issue' : 'pending'
    const { error } = await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    if (error) {
      window.alert(`Could not update task status: ${error.message}`)
      return
    }
    onTasksChange(tasks.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
  }

  const isOverdue = (task) => {
    if (task.status === 'done') return false
    if (event.event_date !== todayString()) return false
    const nowStr = new Date().toTimeString().slice(0, 5)
    return nowStr > task.time
  }

  return (
    <div style={styles.wrap}>
      {PHASES.map((phase) => {
        const phaseTasks = tasks.filter((t) => t.phase === phase.key)
        if (phaseTasks.length === 0) return null
        return (
          <div key={phase.key} style={styles.phaseGroup}>
            <div style={styles.phaseHeader}>
              <span style={{ ...styles.phaseLabel, color: phase.color }}>{phase.label}</span>
              <div style={styles.phaseLine} />
            </div>
            {phaseTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  ...styles.taskRow,
                  ...(task.status === 'issue' ? styles.taskRowIssue : {}),
                }}
              >
                <div style={styles.taskMain}>
                  <div style={styles.taskTopLine}>
                    <span style={styles.taskTime}>{task.time}</span>
                    <span style={styles.categoryTag}>{task.category}</span>
                    {isOverdue(task) && <span style={styles.overdueBadge}>Overdue</span>}
                  </div>
                  <div style={styles.taskText}>{task.task}</div>
                  {editingOwnerTaskId === task.id ? (
                    <select
                      autoFocus
                      value={task.assigned_team_member_id || ''}
                      onChange={(e) => handleAssignOwner(task, e.target.value)}
                      onBlur={() => setEditingOwnerTaskId(null)}
                      style={styles.ownerSelect}
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  ) : (
                    <button
                      type="button"
                      style={styles.taskOwner}
                      onClick={() => { setAssignError(''); setEditingOwnerTaskId(task.id) }}
                    >
                      {memberName(task.assigned_team_member_id)} · change
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  style={{
                    ...styles.statusButton,
                    ...(task.status === 'done' ? styles.statusDone : {}),
                    ...(task.status === 'issue' ? styles.statusIssue : {}),
                  }}
                  onClick={() => cycleStatus(task)}
                >
                  {task.status}
                </button>
              </div>
            ))}
          </div>
        )
      })}

      {tasks.length === 0 && <p style={styles.note}>No tasks yet — add one manually below, or use AI Import.</p>}
      {assignError && <p style={styles.error}>{assignError}</p>}

      {showForm ? (
        <form onSubmit={handleAddTask} style={styles.form}>
          <div style={styles.formRow}>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              style={styles.input}
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={styles.input}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={form.phase}
              onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}
              style={styles.input}
            >
              {PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <input
            placeholder="Task description"
            value={form.task}
            onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
            style={{ ...styles.input, width: '100%', boxSizing: 'border-box', marginTop: 8 }}
          />
          <select
            value={form.ownerId}
            onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
            style={{ ...styles.input, width: '100%', boxSizing: 'border-box', marginTop: 8 }}
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          {formError && <p style={styles.error}>{formError}</p>}

          <div style={styles.formButtonRow}>
            <button type="button" style={styles.secondaryButton} onClick={() => { setShowForm(false); setFormError('') }}>
              Cancel
            </button>
            <button type="submit" style={styles.primaryButton} disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" style={styles.addButton} onClick={() => setShowForm(true)}>
          + Add Task Manually
        </button>
      )}
    </div>
  )
}

const styles = {
  wrap: { fontFamily: bodyFont },
  phaseGroup: { marginBottom: 24 },
  phaseHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  phaseLabel: { fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' },
  phaseLine: { flex: 1, height: 1, background: B.border },
  taskRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    border: `1px solid ${B.border}`,
    borderLeft: `3px solid ${B.ink}`,
    marginBottom: 6,
    borderRadius: 4,
  },
  taskRowIssue: { background: B.redBg, borderLeftColor: B.red },
  taskMain: { flex: 1 },
  taskTopLine: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  taskTime: { fontWeight: 700, fontSize: 14 },
  categoryTag: {
    fontSize: 10,
    padding: '2px 6px',
    border: `1px solid ${B.border}`,
    borderRadius: 3,
    color: B.inkLight,
    textTransform: 'uppercase',
  },
  overdueBadge: {
    fontSize: 9,
    color: B.bg,
    background: B.red,
    padding: '2px 6px',
    letterSpacing: 1,
    fontWeight: 700,
    textTransform: 'uppercase',
    borderRadius: 2,
  },
  taskText: { fontSize: 14, marginBottom: 2 },
  taskOwner: {
    fontSize: 12,
    color: B.inkLight,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
    fontFamily: bodyFont,
  },
  ownerSelect: {
    fontSize: 12,
    padding: '4px 6px',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontFamily: bodyFont,
  },
  statusButton: {
    fontSize: 11,
    textTransform: 'uppercase',
    padding: '6px 10px',
    borderRadius: 3,
    border: `1px solid ${B.border}`,
    background: B.bg,
    cursor: 'pointer',
  },
  statusDone: { background: '#EAF7EE', borderColor: '#1A7F37', color: '#1A7F37' },
  statusIssue: { background: B.redBg, borderColor: B.red, color: B.red },
  note: { color: B.inkLight, fontSize: 14, marginBottom: 20 },
  addButton: {
    width: '100%',
    padding: '12px 0',
    background: 'transparent',
    border: `1px dashed ${B.border}`,
    borderRadius: 4,
    color: B.inkMid,
    fontSize: 14,
    cursor: 'pointer',
  },
  form: { border: `1px solid ${B.border}`, borderRadius: 4, padding: 16, marginTop: 8 },
  formRow: { display: 'flex', gap: 8 },
  input: {
    padding: '8px 10px',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: bodyFont,
    flex: 1,
  },
  formButtonRow: { display: 'flex', gap: 8, marginTop: 12 },
  primaryButton: {
    flex: 1,
    padding: '10px 0',
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    flex: 1,
    padding: '10px 0',
    background: B.bg,
    color: B.ink,
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 13,
    cursor: 'pointer',
  },
  error: { color: B.red, fontSize: 13, marginTop: 8 },
}
