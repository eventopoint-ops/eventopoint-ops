import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Central place for "who is signed in, and what org do they belong to."
// The old build re-fetched this ad-hoc in multiple components with no
// shared source of truth, which is part of why the org_id-is-null bug
// class was so hard to track down originally. One provider, one fetch.

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // True while the user is arriving from a password-recovery email. The
  // recovery token creates a real (short-lived) session, so without this
  // flag App would drop them straight into the dashboard and they'd never
  // reach the "set a new password" screen. Seeded from the URL as well as
  // the auth event, because supabase-js consumes and strips the hash
  // before onAuthStateChange fires in some flows.
  const [recoveryMode, setRecoveryMode] = useState(() => {
    if (typeof window === 'undefined') return false
    const hash = window.location.hash || ''
    const search = window.location.search || ''
    return hash.includes('type=recovery') || search.includes('type=recovery')
  })

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      // Surface it — silent profile-load failures were a recurring bug
      // pattern in the old build (e.g. org_id NULL going unnoticed).
      setError(`Could not load profile: ${profileError.message}`)
      setProfile(null)
      return
    }
    setProfile(data)
  }, [])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (cancelled) return
      if (sessionError) {
        setError(sessionError.message)
        setLoading(false)
        return
      }
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      if (!cancelled) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
      setSession(newSession)
      await loadProfile(newSession?.user?.id)
    })

    return () => {
      cancelled = true
      listener?.subscription?.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = useCallback(() => loadProfile(session?.user?.id), [loadProfile, session])

  const signOut = useCallback(async () => {
    setRecoveryMode(false)
    await supabase.auth.signOut()
  }, [])

  // Called once a new password has actually been saved, so the app stops
  // holding the user on the recovery screen. Also clears the recovery
  // fragment out of the address bar so a refresh doesn't re-trigger it.
  const clearRecoveryMode = useCallback(() => {
    setRecoveryMode(false)
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    error,
    refreshProfile,
    signOut,
    recoveryMode,
    clearRecoveryMode,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
