import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { B, bodyFont } from '../lib/theme'

// Vendors tab: list + add vendors for this event.
export default function VendorsTab({ event, vendors, onVendorsChange }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('vendors')
      .insert({ event_id: event.id, name: name.trim(), contact: contact.trim() || null })
      .select()
      .single()

    setSubmitting(false)

    if (error) {
      setErrorMessage(`Could not add vendor: ${error.message}`)
      return
    }

    onVendorsChange([...vendors, data])
    setName('')
    setContact('')
  }

  return (
    <div style={{ fontFamily: bodyFont }}>
      {vendors.length === 0 && <p style={styles.note}>No vendors added yet.</p>}
      {vendors.map((vendor) => (
        <div key={vendor.id} style={styles.row}>
          <span style={styles.name}>{vendor.name}</span>
          {vendor.contact && <span style={styles.contact}>{vendor.contact}</span>}
        </div>
      ))}

      <form onSubmit={handleAdd} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Vendor name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Contact (email/phone)"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <button type="submit" style={styles.button} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add'}
        </button>
      </form>
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
    </div>
  )
}

const styles = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 14px',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    marginBottom: 6,
  },
  name: { fontWeight: 600, fontSize: 14 },
  contact: { color: B.inkLight, fontSize: 13 },
  note: { color: B.inkLight, fontSize: 14, marginBottom: 16 },
  form: { display: 'flex', gap: 8, marginTop: 16 },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: bodyFont,
  },
  button: {
    padding: '10px 16px',
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: { color: B.red, fontSize: 13, marginTop: 8 },
}
