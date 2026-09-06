import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { logError } from '../lib/logError'
import { B, displayFont, bodyFont } from '../lib/theme'

// Account screen: who you're signed in as, sign out, and permanent
// account deletion.
//
// The delete path exists because App Store Review Guideline 5.1.1(v)
// requires any app offering account creation to let the user initiate
// deleting that account from inside the app -- not by emailing support.
// It calls the delete-account edge function, which does the real work
// with the service-role key.
//
// Deliberately gated behind typing DELETE: this is irreversible and, for
// a sole org member, takes every event, task, vendor and file with it.
const CONFIRM_WORD = 'DELETE'

export default function AccountModal({ onClose }) {
  const { user, signOut } = useAuth()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Your session expired. Sign in again and retry.')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
        }
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.ok) {
        throw new Error(body.error || 'Could not delete your account.')
      }

      // The auth user no longer exists, so the stored session is dead.
      // Clear it locally and drop back to the sign-in screen.
      await supabase.auth.signOut()
      await signOut()
    } catch (err) {
      logError(err, 'AccountModal.handleDelete')
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Account</h2>

        <div style={styles.row}>
          <span style={styles.label}>Signed in as</span>
          <span style={styles.value}>{user?.email || '—'}</span>
        </div>

        <button type="button" style={styles.secondaryButton} onClick={signOut}>
          Sign out
        </button>

        <hr style={styles.rule} />

        <h3 style={styles.dangerTitle}>Delete account</h3>
        <p style={styles.dangerCopy}>
          This permanently deletes your account. If you are the only person in
          your organization, every event, run-of-show task, team member,
          vendor and uploaded file belonging to it is deleted too, and any
          active subscription is cancelled. This cannot be undone.
        </p>

        {!showConfirm ? (
          <button
            type="button"
            style={styles.dangerButton}
            onClick={() => setShowConfirm(true)}
          >
            Delete my account
          </button>
        ) : (
          <>
            <label style={styles.confirmLabel} htmlFor="delete-confirm">
              Type {CONFIRM_WORD} to confirm
            </label>
            <input
              id="delete-confirm"
              style={styles.input}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder={CONFIRM_WORD}
            />
            <button
              type="button"
              style={{
                ...styles.dangerButton,
                opacity: confirmText === CONFIRM_WORD && !deleting ? 1 : 0.45,
              }}
              disabled={confirmText !== CONFIRM_WORD || deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting…' : 'Permanently delete my account'}
            </button>
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button type="button" style={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(13,13,13,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000,
  },
  modal: {
    background: B.bg,
    border: `1px solid ${B.border}`,
    borderRadius: 6,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90vh',
    overflowY: 'auto',
    fontFamily: bodyFont,
  },
  title: {
    fontFamily: displayFont,
    fontSize: 26,
    margin: '0 0 16px',
    color: B.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 },
  label: { fontSize: 11, color: B.inkLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 14, color: B.ink },
  secondaryButton: {
    width: '100%',
    background: B.bg,
    color: B.ink,
    border: `1px solid ${B.ink}`,
    borderRadius: 4,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: bodyFont,
  },
  rule: { border: 'none', borderTop: `1px solid ${B.border}`, margin: '24px 0 16px' },
  dangerTitle: {
    fontFamily: displayFont,
    fontSize: 18,
    margin: '0 0 8px',
    color: B.red,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerCopy: { fontSize: 13, lineHeight: 1.5, color: B.inkMid, margin: '0 0 16px' },
  dangerButton: {
    width: '100%',
    background: B.red,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 4,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: bodyFont,
    marginTop: 8,
  },
  confirmLabel: {
    display: 'block',
    fontSize: 11,
    color: B.inkLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: bodyFont,
  },
  error: {
    background: B.redBg,
    color: B.red,
    fontSize: 13,
    padding: '8px 12px',
    borderRadius: 4,
    margin: '12px 0 0',
  },
  closeButton: {
    width: '100%',
    background: 'transparent',
    color: B.inkMid,
    border: 'none',
    padding: '12px 0 0',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: bodyFont,
  },
}
