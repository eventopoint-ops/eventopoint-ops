import { supabase } from './supabaseClient'

// Best-effort error logging to the `error_logs` table (see migration
// create_error_logs_table.sql). Never throws — logging a failure must
// never itself become a second failure or an infinite loop. Also mirrors
// to the console so nothing is hidden during local dev, in keeping with
// this project's "fail loudly" rule.
export async function logError(error, context) {
  const message = error?.message || String(error)
  const stack = error?.stack || null

  // eslint-disable-next-line no-console
  console.error(context ? `[${context}]` : '[error]', error)

  try {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id || null

    let orgId = null
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', userId)
        .maybeSingle()
      orgId = profile?.org_id || null
    }

    await supabase.from('error_logs').insert({
      org_id: orgId,
      user_id: userId,
      message: message?.slice(0, 2000) || 'Unknown error',
      stack: stack?.slice(0, 8000) || null,
      context: context || null,
      url: typeof window !== 'undefined' ? window.location.href : null,
    })
  } catch {
    // Swallow — logging is best-effort. The console.error above already
    // ensures the error isn't silently lost during development.
  }
}

// Installs global handlers for uncaught exceptions and unhandled promise
// rejections. Called once from main.jsx. These catch errors that happen
// outside React's render cycle (event handlers, async code, etc.) — the
// ErrorBoundary component handles render-time errors separately.
export function installGlobalErrorLogging() {
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'window.onerror')
  })

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'unhandledrejection')
  })
}
