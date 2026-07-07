import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { B, bodyFont } from '../lib/theme'

// Team Access tab: list + add team members for this event. Team members
// are scoped per-event (not per-org) — matches the original schema,
// where `team_members.event_id` is the foreign key.
export default function TeamTab({ event, teamMembers, onTeamMembersChange }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('team_members')
      .insert({ event_id: event.id, name: name.trim(), role: role.trim() || null })
      .select()
      .single()

    setSubmitting(false)

    if (error) {
      setErrorMessage(`Could not add team member: ${error.message}`)
      return
    }

    onTeamMembersChange([...teamMembers, data])
    setName('')
    setRole('')
  }

  return (
    <div style={{ fontFamily: bodyFont }}>
      {teamMembers.length === 0 && <p style={styles.note}>No team members added yet.</p>}
      {teamMembers.map((member) => (
        <div key={member.id} style={styles.row}>
          <span style={styles.name}>{member.name}</span>
          {member.role && <span style={styles.role}>{member.role}</span>}
        </div>
      ))}

      <form onSubmit={handleAdd} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Role (optional)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <button type="submit" style={styles.button} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add'}
        </button>
      </form>
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
    </div>
  )
}

const styles = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 14px',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    marginBottom: 6,
  },
  name: { fontWeight: 600, fontSize: 14 },
  role: { color: B.inkLight, fontSize: 13 },
  note: { color: B.inkLight, fontSize: 14, marginBottom: 16 },
  form: { display: 'flex', gap: 8, marginTop: 16 },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: bodyFont,
  },
  button: {
    padding: '10px 16px',
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: { color: B.red, fontSize: 13, marginTop: 8 },
}
