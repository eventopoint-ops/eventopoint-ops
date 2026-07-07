import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { B, displayFont, bodyFont } from '../lib/theme'

// First-run flow: create the organization and link it to the profile.
// The old build had a nasty bug class here — org creation could silently
// fail, leaving profile.org_id NULL, which then broke event creation
// invisibly. This version does both steps in sequence and surfaces any
// failure immediately instead of assuming success.
export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const [orgName, setOrgName] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!orgName.trim()) return
    setStatus('working')
    setErrorMessage('')

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName.trim(), type: 'agency' })
      .select()
      .single()

    if (orgError || !org) {
      setStatus('error')
      setErrorMessage(orgError?.message || 'Could not create organization.')
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ org_id: org.id, onboarding_complete: true })
      .eq('id', user.id)

    if (profileError) {
      setStatus('error')
      setErrorMessage(
        `Organization was created, but linking it to your profile failed: ${profileError.message}. Contact support with this message — don't try to sign up again.`
      )
      return
    }

    setStatus('done')
    await refreshProfile()
  }

  return (
    <div style={styles.shell}>
      <h1 style={styles.title}>You're almost set up</h1>
      <p style={styles.subtitle}>What's the name of your event company or team?</p>

      <form onSubmit={handleSubmit}>
        <input
          style={styles.input}
          placeholder="e.g. EVENToPOINT"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          required
        />
        {status === 'error' && <p style={styles.error}>{errorMessage}</p>}
        <button type="submit" style={styles.button} disabled={status === 'working'}>
          {status === 'working' ? 'Setting up…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  shell: { maxWidth: 400, margin: '100px auto', padding: '0 24px', fontFamily: bodyFont },
  title: {
    fontFamily: displayFont,
    fontWeight: 900,
    textTransform: 'uppercase',
    fontSize: 28,
    margin: 0,
  },
  subtitle: { color: B.inkMid, fontSize: 14, marginTop: 8, marginBottom: 24 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    marginBottom: 16,
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: bodyFont,
  },
  button: {
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
  error: { color: B.red, fontSize: 13, marginBottom: 12, lineHeight: 1.4 },
}
