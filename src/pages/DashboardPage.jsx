import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { buildMonthGrid, MONTH_NAMES, WEEKDAY_LABELS, toDateString, todayString } from '../lib/calendar'
import CreateEventModal from '../components/CreateEventModal'
import { B, displayFont, bodyFont } from '../lib/theme'

// Dashboard: month calendar + full event list. Clicking an empty day
// opens the create-event modal pre-filled with that date; clicking a day
// that already has an event opens that event instead.
export default function DashboardPage({ onOpenEvent }) {
  const { profile, signOut } = useAuth()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [modalPrefillDate, setModalPrefillDate] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      setErrorMessage(`Could not load events: ${error.message}`)
      setLoading(false)
      return
    }
    setEvents(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const evt of events) {
      if (!map[evt.event_date]) map[evt.event_date] = []
      map[evt.event_date].push(evt)
    }
    return map
  }, [events])

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])
  const today = todayString()

  const handleDayClick = (date) => {
    if (!date) return
    const dateStr = toDateString(date)
    const dayEvents = eventsByDate[dateStr]
    if (dayEvents && dayEvents.length === 1) {
      onOpenEvent(dayEvents[0])
      return
    }
    if (dayEvents && dayEvents.length > 1) {
      // Multiple events on one day: just open the first for now — a
      // dedicated "day view" is a reasonable Phase 3 addition if this
      // becomes a common case.
      onOpenEvent(dayEvents[0])
      return
    }
    setModalPrefillDate(dateStr)
    setShowModal(true)
  }

  const goToMonth = (delta) => {
    setCursor((prev) => {
      let month = prev.month + delta
      let year = prev.year
      if (month < 0) { month = 11; year -= 1 }
      if (month > 11) { month = 0; year += 1 }
      return { year, month }
    })
  }

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <h1 style={styles.logo}>EVENToPOINT.ops</h1>
        <button type="button" style={styles.signOutButton} onClick={signOut}>
          Sign out
        </button>
      </header>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}

      <div style={styles.calendarCard}>
        <div style={styles.calendarHeader}>
          <button type="button" style={styles.navButton} onClick={() => goToMonth(-1)}>‹</button>
          <span style={styles.monthLabel}>
            {MONTH_NAMES[cursor.month]} {cursor.year}
          </span>
          <button type="button" style={styles.navButton} onClick={() => goToMonth(1)}>›</button>
        </div>

        <div style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} style={styles.weekdayCell}>{label}</div>
          ))}
        </div>

        <div style={styles.grid}>
          {grid.map((date, i) => {
            if (!date) return <div key={i} style={styles.emptyCell} />
            const dateStr = toDateString(date)
            const dayEvents = eventsByDate[dateStr] || []
            const isToday = dateStr === today
            return (
              <button
                type="button"
                key={i}
                onClick={() => handleDayClick(date)}
                style={{
                  ...styles.dayCell,
                  ...(isToday ? styles.dayCellToday : {}),
                }}
                title={dayEvents.map((e) => e.name).join(', ')}
              >
                <span>{date.getDate()}</span>
                {dayEvents.length > 0 && <span style={styles.eventDot} />}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        style={styles.createButton}
        onClick={() => { setModalPrefillDate(null); setShowModal(true) }}
      >
        + Create Event
      </button>

      <section style={styles.listSection}>
        <h2 style={styles.listTitle}>All Events</h2>
        {loading && <p style={styles.note}>Loading…</p>}
        {!loading && events.length === 0 && (
          <p style={styles.note}>No events yet — create your first one above.</p>
        )}
        {events.map((evt) => (
          <button
            type="button"
            key={evt.id}
            style={styles.eventRow}
            onClick={() => onOpenEvent(evt)}
          >
            <span style={styles.eventRowDate}>{evt.event_date}</span>
            <span style={styles.eventRowName}>{evt.name}</span>
            {evt.venue && <span style={styles.eventRowVenue}>{evt.venue}</span>}
          </button>
        ))}
      </section>

      {showModal && (
        <CreateEventModal
          prefillDate={modalPrefillDate}
          onClose={() => setShowModal(false)}
          onCreated={(newEvent) => {
            setShowModal(false)
            setEvents((prev) => [...prev, newEvent].sort((a, b) => a.event_date.localeCompare(b.event_date)))
            onOpenEvent(newEvent)
          }}
        />
      )}
    </div>
  )
}

const styles = {
  shell: { maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px', fontFamily: bodyFont },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontFamily: displayFont,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 24,
    margin: 0,
  },
  signOutButton: {
    background: 'transparent',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 12,
    color: B.inkLight,
    cursor: 'pointer',
  },
  error: { color: B.red, fontSize: 13, marginBottom: 16 },
  calendarCard: { border: `1px solid ${B.border}`, borderRadius: 4, padding: 20, marginBottom: 20 },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: { fontFamily: displayFont, fontWeight: 700, fontSize: 18, textTransform: 'uppercase' },
  navButton: {
    background: 'transparent',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: B.ink,
    padding: '0 8px',
  },
  weekdayRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 },
  weekdayCell: { textAlign: 'center', fontSize: 11, color: B.inkLight, padding: '4px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  emptyCell: { aspectRatio: '1', },
  dayCell: {
    aspectRatio: '1',
    border: `1px solid ${B.border}`,
    background: B.bg,
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    gap: 2,
  },
  dayCellToday: { borderColor: B.ink, borderWidth: 2, fontWeight: 700 },
  eventDot: { width: 5, height: 5, borderRadius: '50%', background: B.ink, display: 'block' },
  createButton: {
    width: '100%',
    padding: '14px 0',
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 32,
  },
  listSection: {},
  listTitle: { fontFamily: displayFont, fontWeight: 700, fontSize: 16, textTransform: 'uppercase', marginBottom: 12 },
  note: { color: B.inkLight, fontSize: 14 },
  eventRow: {
    width: '100%',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: '12px 14px',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    marginBottom: 8,
    background: B.bg,
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 14,
    fontFamily: bodyFont,
  },
  eventRowDate: { color: B.inkLight, fontSize: 12, minWidth: 90 },
  eventRowName: { fontWeight: 600, flex: 1 },
  eventRowVenue: { color: B.inkLight, fontSize: 12 },
}
