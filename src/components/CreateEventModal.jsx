import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { B, bodyFont } from '../lib/theme'

// Modal for creating a new event. Accepts an optional prefilled date so
// the calendar's "click an empty day" interaction can open this
// pre-populated, per the feature she asked for.
export default function CreateEventModal({ prefillDate, onClose, onCreated }) {
  const { profile } = useAuth()
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [eventDate, setEventDate] = useState(prefillDate || '')
  const [guestCount, setGuestCount] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (prefillDate) setEventDate(prefillDate)
  }, [prefillDate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !eventDate) return
    setStatus('working')
    setErrorMessage('')

    const { data, error } = await supabase
      .from('events')
      .insert({
        org_id: profile?.org_id,
        name: name.trim(),
        venue: venue.trim() || null,
        event_date: eventDate,
        guest_count: guestCount ? Number(guestCount) : null,
      })
      .select()
      .single()

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    onCreated(data)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>New Event</h2>
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            placeholder="Event name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            style={styles.input}
            placeholder="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
          <input
            style={styles.input}
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="number"
            placeholder="Guest count (optional)"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            min="0"
          />

          {status === 'error' && <p style={styles.error}>{errorMessage}</p>}

          <div style={styles.buttonRow}>
            <button type="button" style={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.primaryButton} disabled={status === 'working'}>
              {status === 'working' ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: B.bg,
    borderRadius: 4,
    padding: 28,
    width: 360,
    fontFamily: bodyFont,
  },
  title: { fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 16 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    marginBottom: 12,
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: bodyFont,
  },
  buttonRow: { display: 'flex', gap: 8, marginTop: 4 },
  primaryButton: {
    flex: 1,
    padding: '10px 0',
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
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
    fontSize: 14,
    cursor: 'pointer',
  },
  error: { color: B.red, fontSize: 13, marginBottom: 12 },
}
