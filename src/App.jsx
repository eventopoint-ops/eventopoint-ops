import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import './App.css'

// This is Phase 1 of the EVENToPOINT.ops rebuild: a clean, readable,
// version-controlled foundation to replace the old minified-bundle-only
// build. It intentionally does NOT yet replicate every screen of the live
// app — that's Phase 2. This screen exists to prove the pipeline works:
// real source -> git -> Supabase connection -> (soon) Netlify deploy.

export default function App() {
  const [status, setStatus] = useState('checking')
  const [errorDetail, setErrorDetail] = useState(null)

  useEffect(() => {
    let cancelled = false

    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (cancelled) return
        if (error) {
          setStatus('error')
          setErrorDetail(error.message)
        } else {
          setStatus('connected')
        }
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setErrorDetail(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app-shell">
      <h1>EVENToPOINT.ops</h1>
      <p className="subtitle">Rebuild in progress — Phase 1</p>

      <div className={`status-card status-${status}`}>
        {status === 'checking' && <p>Checking Supabase connection…</p>}
        {status === 'connected' && <p>✓ Supabase connection working.</p>}
        {status === 'error' && (
          <>
            <p>Supabase connection failed.</p>
            <p className="error-detail">{errorDetail}</p>
          </>
        )}
      </div>

      <p className="note">
        This screen is intentionally minimal. Real screens (dashboard,
        calendar, event detail, AI import, team &amp; vendor management)
        come in Phase 2, rebuilt here as readable components instead of
        patched minified code.
      </p>
    </div>
  )
}
