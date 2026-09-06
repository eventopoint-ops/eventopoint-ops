import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { logError } from '../lib/logError'
import { B, displayFont, bodyFont } from '../lib/theme'

// Where a password-recovery email link lands.
//
// Supabase turns the token in that link into a short-lived session and
// fires a PASSWORD_RECOVERY auth event. useAuth catches that event and
// flags recovery mode, which App renders as this screen -- otherwise the
// temporary session would drop the user straight into the dashboard and
// they'd never get to set a new password.
export default function UpdatePasswordPage({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('idle') // idle | working | error | done
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setStatus('error')
      setErrorMessage('The two passwords do not match.')
      return
    }
    setStatus('working')
    setErrorMessage('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      logError(error, 'UpdatePasswordPage.updateUser')
      setStatus('error')
      // Supabase returns a specific message when leaked-password
      // protection rejects the choice; surfacing it verbatim is more
      // useful than a generic failure.
      setErrorMessage(error.message)
      return
    }

    setStatus('done')
    onDone?.()
  }

  return (
    <div style={styles.shell}>
      <h1 style={styles.logo}>EVENToPOINT.ops</h1>
      <p style={styles.tagline}>Choose a new password.</p>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          {status === 'error' && <p style={styles.error}>{errorMessage}</p>}

          <button type="submit" style={styles.primaryButton} disabled={status === 'working'}>
            {status === 'working' ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  shell: {
    maxWidth: 400,
    margin: '80px auto',
    padding: '0 24px',
    textAlign: 'center',
    fontFamily: bodyFont,
  },
  logo: {
    fontFamily: displayFont,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 32,
    margin: 0,
  },
  tagline: { color: B.inkLight, fontSize: 13, marginTop: 4, marginBottom: 32 },
  card: {
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    padding: 24,
    textAlign: 'left',
  },
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
  primaryButton: {
    width: '100%',
    padding: '12px 0',
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: { color: B.red, fontSize: 13, marginBottom: 12 },
}
