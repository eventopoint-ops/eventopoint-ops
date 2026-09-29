import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import RunOfShowTab from '../components/RunOfShowTab'
import TeamTab from '../components/TeamTab'
import VendorsTab from '../components/VendorsTab'
import WrapUpTab from '../components/WrapUpTab'
import AiImportModal from '../components/AiImportModal'
import { B, displayFont, bodyFont } from '../lib/theme'

const TABS = [
  { key: 'runofshow', label: 'Run of Show' },
  { key: 'team', label: 'Team' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'wrapup', label: 'Wrap-Up' },
]

// Event detail shell: header with back navigation, tab switcher, and the
// four data-backed tabs. All of it is fetched once here and passed down,
// rather than each tab independently re-querying — simpler to reason
// about and avoids redundant network calls.
export default function EventDetailPage({ event, onBack }) {
  const [tab, setTab] = useState('runofshow')
  const [tasks, setTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [vendors, setVendors] = useState([])
  const [eventNotes, setEventNotes] = useState([])
  const [eventReview, setEventReview] = useState(null)
  const [staffRatings, setStaffRatings] = useState([])
  const [vendorRatings, setVendorRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [showAiImport, setShowAiImport] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const [tasksRes, teamRes, vendorsRes, notesRes, reviewRes, staffRatingsRes, vendorRatingsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('event_id', event.id).order('time', { ascending: true }),
      supabase.from('team_members').select('*').eq('event_id', event.id),
      supabase.from('vendors').select('*').eq('event_id', event.id),
      supabase.from('event_notes').select('*').eq('event_id', event.id).order('created_at', { ascending: false }),
      supabase.from('event_reviews').select('*').eq('event_id', event.id).maybeSingle(),
      supabase.from('staff_ratings').select('*').eq('event_id', event.id),
      supabase.from('vendor_ratings').select('*').eq('event_id', event.id),
    ])

    const firstError =
      tasksRes.error || teamRes.error || vendorsRes.error || notesRes.error || reviewRes.error ||
      staffRatingsRes.error || vendorRatingsRes.error
    if (firstError) {
      setErrorMessage(`Could not load event data: ${firstError.message}`)
      setLoading(false)
      return
    }

    setTasks(tasksRes.data || [])
    setTeamMembers(teamRes.data || [])
    setVendors(vendorsRes.data || [])
    setEventNotes(notesRes.data || [])
    setEventReview(reviewRes.data || null)
    setStaffRatings(staffRatingsRes.data || [])
    setVendorRatings(vendorRatingsRes.data || [])
    setLoading(false)
  }, [event.id])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  return (
    <div style={styles.shell}>
      <button type="button" style={styles.backButton} onClick={onBack}>← All Events</button>

      <header style={styles.header}>
        <h1 style={styles.title}>{event.name}</h1>
        <p style={styles.meta}>
          {event.event_date}
          {event.venue ? ` · ${event.venue}` : ''}
          {event.guest_count ? ` · ${event.guest_count} guests` : ''}
        </p>
      </header>

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}

      <div style={styles.tabRow}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={tab === t.key ? styles.tabActive : styles.tab}
          >
            {t.label}
          </button>
        ))}
        {tab === 'runofshow' && (
          <button type="button" style={styles.aiButton} onClick={() => setShowAiImport(true)}>
            AI Import
          </button>
        )}
      </div>

      {loading ? (
        <p style={styles.note}>Loading…</p>
      ) : (
        <>
          {tab === 'runofshow' && (
            <RunOfShowTab event={event} tasks={tasks} teamMembers={teamMembers} onTasksChange={setTasks} />
          )}
          {tab === 'team' && (
            <TeamTab event={event} teamMembers={teamMembers} onTeamMembersChange={setTeamMembers} />
          )}
          {tab === 'vendors' && (
            <VendorsTab event={event} vendors={vendors} onVendorsChange={setVendors} />
          )}
          {tab === 'wrapup' && (
            <WrapUpTab
              event={event}
              teamMembers={teamMembers}
              vendors={vendors}
              notes={eventNotes}
              review={eventReview}
              staffRatings={staffRatings}
              vendorRatings={vendorRatings}
              onDataChange={(patch) => {
                if (patch.notes) setEventNotes(patch.notes)
                if (patch.review) setEventReview(patch.review)
                if (patch.staffRatings) setStaffRatings(patch.staffRatings)
                if (patch.vendorRatings) setVendorRatings(patch.vendorRatings)
              }}
            />
          )}
        </>
      )}

      {showAiImport && (
        <AiImportModal
          event={event}
          teamMembers={teamMembers}
          onClose={() => setShowAiImport(false)}
          onImported={(newTasks) => {
            setTasks((prev) => [...prev, ...newTasks].sort((a, b) => a.time.localeCompare(b.time)))
            setShowAiImport(false)
            setTab('runofshow')
          }}
        />
      )}
    </div>
  )
}

const styles = {
  shell: { maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px', fontFamily: bodyFont },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: B.inkLight,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 16,
  },
  header: { marginBottom: 20 },
  title: {
    fontFamily: displayFont,
    fontWeight: 900,
    textTransform: 'uppercase',
    fontSize: 28,
    margin: 0,
  },
  meta: { color: B.inkLight, fontSize: 13, marginTop: 4 },
  error: { color: B.red, fontSize: 13, marginBottom: 16 },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' },
  tab: {
    padding: '8px 14px',
    background: 'transparent',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    color: B.inkMid,
  },
  tabActive: {
    padding: '8px 14px',
    background: B.ink,
    border: `1px solid ${B.ink}`,
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    color: B.bg,
  },
  aiButton: {
    marginLeft: 'auto',
    padding: '8px 14px',
    background: B.bg,
    border: `1px solid ${B.ink}`,
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    color: B.ink,
    fontWeight: 600,
  },
  note: { color: B.inkLight, fontSize: 14 },
}
