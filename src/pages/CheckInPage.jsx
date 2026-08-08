import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { B, displayFont, bodyFont } from '../lib/theme'

// Public check-in page. No login required — reached via a per-person
// token link (e.g. eventopoint.app/checkin/<token>) that a manager shares
// with each team member before an event. Both RPCs it calls
// (get_checkin_info / check_in_team_member) are token-scoped
// SECURITY DEFINER functions: they only ever touch the single team_members
// row matching the token, never anything broader. See migration
// 20260704184340_harden_definer_functions_and_drop_stale_policy.sql for
// why the old direct-table-policy version of this was removed.
export default function CheckInPage({ token }) {
  const [status, setStatus] = useState('loading') // loading | not_found | ready | checking_in | done | error
  const [info, setInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadInfo() {
      if (!token) {
        setStatus('not_found')
        return
      }

      const { data, error } = await supabase.rpc('get_checkin_info', { p_token: token })

      if (cancelled) return

      if (error) {
        setStatus('error')
        setErrorMessage(error.message)
        return
      }

      const row = Array.isArray(data) ? data[0] : data

      if (!row) {
        setStatus('not_found')
        return
      }

      setInfo(row)
      setStatus(row.checked_in ? 'done' : 'ready')
    }

    loadInfo()
    return () => {
      cancelled = true
    }
  }, [token])

  const handleCheckIn = async () => {
    setStatus('checking_in')
    setErrorMessage('')

    const { data, error } = await supabase.rpc('check_in_team_member', { p_token: token })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    const row = Array.isArray(data) ? data[0] : data
    setInfo((prev) => ({ ...prev, checked_in: row?.checked_in ?? true, checked_in_at: row?.checked_in_at }))
    setStatus('done')
  }

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        {status === 'loading' && <p style={styles.note}>Loading…</p>}

        {status === 'not_found' && (
          <>
            <h1 style={styles.title}>Link not recognized</h1>
            <p style={styles.note}>
              This check-in link isn't valid. Double check the link your event manager sent you,
              or ask them to resend it.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.errorText}>{errorMessage}</p>
            <button style={styles.button} onClick={handleCheckIn}>
              Try again
            </button>
          </>
        )}

        {(status === 'ready' || status === 'checking_in') && info && (
          <>
            <p style={styles.eyebrow}>You're checking in for</p>
            <h1 style={styles.title}>{info.event_name}</h1>
            {info.venue && <p style={styles.meta}>{info.venue}</p>}
            {info.event_date && <p style={styles.meta}>{info.event_date}</p>}
            <div style={styles.divider} />
            <p style={styles.meta}>
              {info.member_name}
              {info.member_role ? ` — ${info.member_role}` : ''}
            </p>
            <button
              style={styles.button}
              onClick={handleCheckIn}
              disabled={status === 'checking_in'}
            >
              {status === 'checking_in' ? 'Checking in…' : 'Check In'}
            </button>
          </>
        )}

        {status === 'done' && info && (
          <>
            <p style={styles.eyebrow}>Checked in</p>
            <h1 style={styles.title}>You're all set, {info.member_name}</h1>
            {info.event_name && <p style={styles.meta}>{info.event_name}</p>}
            {info.checked_in_at && (
              <p style={styles.meta}>{new Date(info.checked_in_at).toLocaleTimeString()}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: B.bgOff,
    fontFamily: bodyFont,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: B.bg,
    border: `1px solid ${B.border}`,
    borderRadius: 8,
    padding: '40px 32px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: B.inkLight,
    marginBottom: 8,
  },
  title: {
    fontFamily: displayFont,
    fontWeight: 900,
    textTransform: 'uppercase',
    fontSize: 26,
    lineHeight: 1.15,
    margin: '0 0 12px',
  },
  meta: { color: B.inkMid, fontSize: 14, margin: '4px 0' },
  note: { color: B.inkMid, fontSize: 14, lineHeight: 1.5 },
  errorText: { color: B.red, fontSize: 14, marginBottom: 16 },
  divider: { height: 1, background: B.border, margin: '20px 0' },
  button: {
    marginTop: 24,
    width: '100%',
    padding: '14px 0',
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
