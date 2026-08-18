import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { B, bodyFont } from '../lib/theme'

const STAGES = [
  { key: 'before', label: 'Before' },
  { key: 'during', label: 'During' },
  { key: 'after', label: 'After' },
]

// Post-event wrap-up: quick notes at any stage, overall/guest-feedback/
// improvements text, per-person ratings for staff and vendors on this
// event, and an AI-generated conclusion + suggestions on top of all of it.
// Ratings are keyed to (event_id, team_member_id/vendor_id) with a unique
// constraint, so saving a rating is an upsert -- editable, one per person
// per event. Staff/vendors are currently per-event rows (not a shared
// roster), so ratings don't roll up across events for the "same" person
// by identity yet -- only by name if you want to eyeball it manually.
export default function WrapUpTab({ event, teamMembers, vendors, notes, review, staffRatings, vendorRatings, onDataChange }) {
  const [noteText, setNoteText] = useState('')
  const [noteStage, setNoteStage] = useState('during')
  const [addingNote, setAddingNote] = useState(false)
  const [overallNotes, setOverallNotes] = useState(review?.overall_notes || '')
  const [guestFeedback, setGuestFeedback] = useState(review?.guest_feedback || '')
  const [improvementsNeeded, setImprovementsNeeded] = useState(review?.improvements_needed || '')
  const [savingReview, setSavingReview] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const staffRatingByMember = Object.fromEntries(staffRatings.map((r) => [r.team_member_id, r]))
  const vendorRatingByVendor = Object.fromEntries(vendorRatings.map((r) => [r.vendor_id, r]))

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setAddingNote(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('event_notes')
      .insert({ event_id: event.id, stage: noteStage, note: noteText.trim() })
      .select()
      .single()

    setAddingNote(false)

    if (error) {
      setErrorMessage(`Could not add note: ${error.message}`)
      return
    }

    onDataChange({ notes: [data, ...notes] })
    setNoteText('')
  }

  const handleSaveReview = async () => {
    setSavingReview(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('event_reviews')
      .upsert(
        {
          event_id: event.id,
          overall_notes: overallNotes.trim() || null,
          guest_feedback: guestFeedback.trim() || null,
          improvements_needed: improvementsNeeded.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'event_id' }
      )
      .select()
      .single()

    setSavingReview(false)

    if (error) {
      setErrorMessage(`Could not save: ${error.message}`)
      return
    }

    onDataChange({ review: data })
  }

  const handleRateStaff = async (teamMemberId, rating) => {
    setErrorMessage('')
    const { data, error } = await supabase
      .from('staff_ratings')
      .upsert(
        { event_id: event.id, team_member_id: teamMemberId, rating },
        { onConflict: 'event_id,team_member_id' }
      )
      .select()
      .single()

    if (error) {
      setErrorMessage(`Could not save rating: ${error.message}`)
      return
    }

    onDataChange({
      staffRatings: [...staffRatings.filter((r) => r.team_member_id !== teamMemberId), data],
    })
  }

  const handleRateVendor = async (vendorId, rating) => {
    setErrorMessage('')
    const { data, error } = await supabase
      .from('vendor_ratings')
      .upsert({ event_id: event.id, vendor_id: vendorId, rating }, { onConflict: 'event_id,vendor_id' })
      .select()
      .single()

    if (error) {
      setErrorMessage(`Could not save rating: ${error.message}`)
      return
    }

    onDataChange({
      vendorRatings: [...vendorRatings.filter((r) => r.vendor_id !== vendorId), data],
    })
  }

  const handleGenerateSummary = async () => {
    setGenerating(true)
    setErrorMessage('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-post-event-summary`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event_id: event.id }),
        }
      )
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not generate summary.')
      onDataChange({ review: body })
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const RatingRow = ({ label, value, onRate }) => (
    <div style={styles.ratingRow}>
      <span style={styles.ratingLabel}>{label}</span>
      <div style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            style={value === n ? styles.starActive : styles.star}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: bodyFont }}>
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}

      <section style={styles.section}>
        <h3 style={styles.heading}>AI Conclusion</h3>
        <button type="button" style={styles.aiButton} onClick={handleGenerateSummary} disabled={generating}>
          {generating ? 'Generating…' : review?.ai_summary ? 'Regenerate summary' : 'Generate AI summary'}
        </button>
        {review?.ai_summary && (
          <div style={styles.aiBox}>
            <p style={styles.aiSummary}>{review.ai_summary}</p>
            {review.ai_suggestions && (
              <>
                <p style={styles.aiSuggestionsLabel}>Suggestions</p>
                <p style={styles.aiSuggestions}>{review.ai_suggestions}</p>
              </>
            )}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.heading}>Quick Notes</h3>
        <form onSubmit={handleAddNote} style={styles.noteForm}>
          <div style={styles.stageRow}>
            {STAGES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setNoteStage(s.key)}
                style={noteStage === s.key ? styles.stageActive : styles.stageButton}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div style={styles.noteInputRow}>
            <input
              style={styles.input}
              placeholder="Quick note…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <button type="submit" style={styles.button} disabled={addingNote}>
              {addingNote ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
        {notes.length === 0 && <p style={styles.note}>No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} style={styles.noteRow}>
            <span style={styles.noteStage}>{n.stage}</span>
            <span style={styles.noteText}>{n.note}</span>
          </div>
        ))}
      </section>

      <section style={styles.section}>
        <h3 style={styles.heading}>Wrap-Up</h3>
        <label style={styles.fieldLabel}>Overall notes</label>
        <textarea
          style={styles.textarea}
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
        />
        <label style={styles.fieldLabel}>Guest feedback</label>
        <textarea
          style={styles.textarea}
          value={guestFeedback}
          onChange={(e) => setGuestFeedback(e.target.value)}
        />
        <label style={styles.fieldLabel}>Improvements needed</label>
        <textarea
          style={styles.textarea}
          value={improvementsNeeded}
          onChange={(e) => setImprovementsNeeded(e.target.value)}
        />
        <button type="button" style={styles.button} onClick={handleSaveReview} disabled={savingReview}>
          {savingReview ? 'Saving…' : 'Save'}
        </button>
      </section>

      <section style={styles.section}>
        <h3 style={styles.heading}>Staff Ratings</h3>
        {teamMembers.length === 0 && <p style={styles.note}>No staff on this event.</p>}
        {teamMembers.map((m) => (
          <RatingRow
            key={m.id}
            label={m.name}
            value={staffRatingByMember[m.id]?.rating}
            onRate={(n) => handleRateStaff(m.id, n)}
          />
        ))}
      </section>

      <section style={styles.section}>
        <h3 style={styles.heading}>Vendor Ratings</h3>
        {vendors.length === 0 && <p style={styles.note}>No vendors on this event.</p>}
        {vendors.map((v) => (
          <RatingRow
            key={v.id}
            label={v.name}
            value={vendorRatingByVendor[v.id]?.rating}
            onRate={(n) => handleRateVendor(v.id, n)}
          />
        ))}
      </section>
    </div>
  )
}

const styles = {
  section: { marginBottom: 28 },
  heading: { fontSize: 14, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10, color: B.ink },
  error: { color: B.red, fontSize: 13, marginBottom: 12 },
  note: { color: B.inkLight, fontSize: 14 },

  aiButton: {
    padding: '10px 16px',
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  aiBox: {
    marginTop: 14,
    padding: 14,
    background: B.bgOff,
    border: `1px solid ${B.border}`,
    borderRadius: 4,
  },
  aiSummary: { fontSize: 14, color: B.inkMid, margin: 0, lineHeight: 1.5 },
  aiSuggestionsLabel: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginTop: 12, marginBottom: 4, color: B.inkLight },
  aiSuggestions: { fontSize: 14, color: B.inkMid, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5 },

  noteForm: { marginBottom: 12 },
  stageRow: { display: 'flex', gap: 6, marginBottom: 8 },
  stageButton: {
    padding: '5px 12px',
    background: 'transparent',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 12,
    color: B.inkMid,
    cursor: 'pointer',
  },
  stageActive: {
    padding: '5px 12px',
    background: B.ink,
    border: `1px solid ${B.ink}`,
    borderRadius: 4,
    fontSize: 12,
    color: B.bg,
    cursor: 'pointer',
  },
  noteInputRow: { display: 'flex', gap: 8 },
  noteRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'baseline',
    padding: '8px 0',
    borderBottom: `1px solid ${B.border}`,
    fontSize: 14,
  },
  noteStage: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: B.inkLight,
    minWidth: 46,
  },
  noteText: { color: B.inkMid },

  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 600, color: B.inkLight, marginBottom: 4, marginTop: 12 },
  textarea: {
    width: '100%',
    minHeight: 60,
    padding: '10px 12px',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: bodyFont,
    resize: 'vertical',
    boxSizing: 'border-box',
  },

  ratingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: `1px solid ${B.border}`,
  },
  ratingLabel: { fontSize: 14, fontWeight: 600 },
  stars: { display: 'flex', gap: 4 },
  star: {
    width: 26,
    height: 26,
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    background: B.bg,
    color: B.inkLight,
    fontSize: 12,
    cursor: 'pointer',
  },
  starActive: {
    width: 26,
    height: 26,
    border: `1px solid ${B.ink}`,
    borderRadius: 4,
    background: B.ink,
    color: B.bg,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 700,
  },

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
    marginTop: 10,
  },
}
