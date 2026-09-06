import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isNativePlatform } from '../lib/platform'
import { B, displayFont, bodyFont } from '../lib/theme'

// Login / signup screen. Supports email+password (the reliable path
// throughout the old build's history) and Google OAuth.
export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [status, setStatus] = useState('idle') // idle | working | error | check-email | reset-sent
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('working')
    setErrorMessage('')

    if (mode === 'forgot') {
      // The recovery link has to land somewhere that can run the app. In
      // the native builds window.location.origin is a capacitor:// or
      // file:// origin the email client can't open, so those are sent to
      // the web app instead -- reset there, then sign in here with the
      // new password.
      const redirectTo = isNativePlatform() ? 'https://eventopoint.app' : window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) {
        setStatus('error')
        setErrorMessage(error.message)
        return
      }
      setStatus('reset-sent')
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setStatus('error')
        setErrorMessage(error.message)
        return
      }
      setStatus('check-email')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }
    // On success, onAuthStateChange in useAuth picks this up automatically.
  }

  const switchMode = (next) => {
    setMode(next)
    setStatus('idle')
    setErrorMessage('')
  }

  const handleGoogle = async () => {
    setStatus('working')
    setErrorMessage('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
    }
    // Successful case redirects the browser away, so nothing else to do here.
  }

  return (
    <div style={styles.shell}>
      <h1 style={styles.logo}>EVENToPOINT.ops</h1>
      <p style={styles.tagline}>Real-time event operations OS.</p>

      <div style={styles.card}>
        <div style={styles.tabRow}>
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={mode === 'login' || mode === 'forgot' ? styles.tabActive : styles.tab}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            style={mode === 'signup' ? styles.tabActive : styles.tab}
          >
            Create account
          </button>
        </div>

        {status === 'check-email' ? (
          <p style={styles.note}>
            Check your inbox for a confirmation link, then come back and log in.
          </p>
        ) : status === 'reset-sent' ? (
          <>
            <p style={styles.note}>
              If an account exists for {email}, a password reset link is on its
              way. The link expires in an hour.
            </p>
            <button
              type="button"
              style={styles.linkButton}
              onClick={() => switchMode('login')}
            >
              Back to log in
            </button>
          </>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleSubmit}>
            <p style={styles.note}>
              Enter your email and we'll send you a link to set a new password.
            </p>
            <input
              style={{ ...styles.input, marginTop: 16 }}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {status === 'error' && <p style={styles.error}>{errorMessage}</p>}

            <button type="submit" style={styles.primaryButton} disabled={status === 'working'}>
              {status === 'working' ? 'Sending…' : 'Send reset link'}
            </button>
            <button
              type="button"
              style={styles.linkButton}
              onClick={() => switchMode('login')}
            >
              Back to log in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <input
                style={styles.input}
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <input
              style={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {status === 'error' && <p style={styles.error}>{errorMessage}</p>}

            <button type="submit" style={styles.primaryButton} disabled={status === 'working'}>
              {status === 'working' ? 'Working…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                style={styles.linkButton}
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>
            )}
          </form>
        )}

        <div style={styles.divider}>or</div>

        <button type="button" style={styles.googleButton} onClick={handleGoogle}>
          Continue with Google
        </button>
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
  tabRow: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: {
    flex: 1,
    padding: '8px 0',
    background: 'transparent',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    cursor: 'pointer',
    color: B.inkLight,
    fontSize: 13,
  },
  tabActive: {
    flex: 1,
    padding: '8px 0',
    background: B.ink,
    border: `1px solid ${B.ink}`,
    borderRadius: 4,
    cursor: 'pointer',
    color: B.bg,
    fontSize: 13,
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
  linkButton: {
    display: 'block',
    width: '100%',
    marginTop: 12,
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: B.inkMid,
    fontSize: 13,
    textDecoration: 'underline',
    cursor: 'pointer',
    fontFamily: bodyFont,
  },
  error: { color: B.red, fontSize: 13, marginBottom: 12 },
  note: { color: B.inkMid, fontSize: 14, lineHeight: 1.5 },
  divider: { textAlign: 'center', color: B.inkLight, fontSize: 12, margin: '20px 0' },
  googleButton: {
    width: '100%',
    padding: '12px 0',
    background: B.bg,
    color: B.ink,
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
  },
}
