import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { B, bodyFont } from '../lib/theme'

// Reads organizations.subscription_status directly (not cached on profile)
// so it always reflects whatever the stripe-webhook edge function last
// wrote. Those columns are locked to service-role writes only -- see
// migration add_subscription_billing_columns_and_lock -- so this banner
// can only ever show real Stripe state, never something a client faked.
//
// Intentionally non-blocking for now: it nudges toward Subscribe but does
// not lock the rest of the app. Turning this into a hard paywall (hiding
// DashboardPage entirely when unpaid) is a follow-up decision, not baked
// in here.
export default function BillingBanner() {
  const { profile } = useAuth()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile?.org_id) return
    let cancelled = false
    supabase
      .from('organizations')
      .select('subscription_status, trial_ends_at, current_period_end')
      .eq('id', profile.org_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setOrg(data)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [profile?.org_id])

  const handleSubscribe = async () => {
    setCheckoutLoading(true)
    setError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
        }
      )
      const body = await res.json()
      if (!res.ok || !body.url) {
        throw new Error(body.error || 'Could not start checkout.')
      }
      window.location.href = body.url
    } catch (err) {
      setError(err.message)
      setCheckoutLoading(false)
    }
  }

  if (loading || !org) return null

  const activeStatuses = ['active', 'trialing']
  if (activeStatuses.includes(org.subscription_status)) return null

  return (
    <div style={styles.banner}>
      <span style={styles.text}>
        {org.subscription_status === 'past_due'
          ? "Your last payment didn't go through — update billing to keep using EVENToPOINT.ops."
          : 'Subscribe to EVENToPOINT.ops to keep using the app — $29/mo.'}
      </span>
      <button type="button" style={styles.button} onClick={handleSubscribe} disabled={checkoutLoading}>
        {checkoutLoading ? 'Redirecting…' : 'Subscribe'}
      </button>
      {error && <span style={styles.error}>{error}</span>}
    </div>
  )
}

const styles = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 16px',
    background: B.bgOff,
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    marginBottom: 20,
    fontFamily: bodyFont,
    fontSize: 13,
    flexWrap: 'wrap',
  },
  text: { color: B.inkMid },
  button: {
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  error: { color: B.red, fontSize: 12, width: '100%' },
}
