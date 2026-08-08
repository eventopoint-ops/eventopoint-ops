import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { B, bodyFont } from '../lib/theme'

// Vendors tab: list + add vendors for this event, plus file attachments
// per vendor (contracts, insurance certs, floor plans). Files go to the
// private 'vendor-files' Storage bucket, scoped by org via storage RLS
// policies (see migration create_vendor_files_storage_bucket.sql) — not
// the local-base64 approach this used to have. `file_url` in vendor_files
// stores the Storage *path*, not a public URL, since the bucket is
// private; we mint a short-lived signed URL on demand when someone
// clicks to open a file.
export default function VendorsTab({ event, vendors, onVendorsChange }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filesByVendor, setFilesByVendor] = useState({})
  const [loadingFilesFor, setLoadingFilesFor] = useState(null)
  const [uploadingFor, setUploadingFor] = useState(null)
  const [fileError, setFileError] = useState('')

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

  const loadFiles = async (vendorId) => {
    setLoadingFilesFor(vendorId)
    const { data, error } = await supabase
      .from('vendor_files')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('uploaded_at', { ascending: false })

    setLoadingFilesFor(null)

    if (error) {
      setFileError(`Could not load files: ${error.message}`)
      return
    }

    setFilesByVendor((prev) => ({ ...prev, [vendorId]: data || [] }))
  }

  const handleToggleFiles = (vendorId) => {
    if (filesByVendor[vendorId]) {
      setFilesByVendor((prev) => {
        const next = { ...prev }
        delete next[vendorId]
        return next
      })
      return
    }
    loadFiles(vendorId)
  }

  const handleUpload = async (vendor, fileList) => {
    const file = fileList?.[0]
    if (!file) return

    setUploadingFor(vendor.id)
    setFileError('')

    const path = `${event.id}/${vendor.id}/${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from('vendor-files').upload(path, file)

    if (uploadError) {
      setUploadingFor(null)
      setFileError(`Upload failed: ${uploadError.message}`)
      return
    }

    const { data: row, error: insertError } = await supabase
      .from('vendor_files')
      .insert({ vendor_id: vendor.id, name: file.name, file_url: path, file_type: file.type || null })
      .select()
      .single()

    setUploadingFor(null)

    if (insertError) {
      setFileError(`File uploaded but couldn't be recorded: ${insertError.message}`)
      return
    }

    setFilesByVendor((prev) => ({
      ...prev,
      [vendor.id]: [row, ...(prev[vendor.id] || [])],
    }))
  }

  const handleOpenFile = async (file) => {
    setFileError('')
    const { data, error } = await supabase.storage
      .from('vendor-files')
      .createSignedUrl(file.file_url, 60)

    if (error) {
      setFileError(`Could not open file: ${error.message}`)
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDeleteFile = async (vendorId, file) => {
    setFileError('')
    const { error: storageError } = await supabase.storage.from('vendor-files').remove([file.file_url])
    if (storageError) {
      setFileError(`Could not delete file: ${storageError.message}`)
      return
    }

    const { error: dbError } = await supabase.from('vendor_files').delete().eq('id', file.id)
    if (dbError) {
      setFileError(`File removed from storage but the record couldn't be deleted: ${dbError.message}`)
      return
    }

    setFilesByVendor((prev) => ({
      ...prev,
      [vendorId]: (prev[vendorId] || []).filter((f) => f.id !== file.id),
    }))
  }

  return (
    <div style={{ fontFamily: bodyFont }}>
      {vendors.length === 0 && <p style={styles.note}>No vendors added yet.</p>}
      {vendors.map((vendor) => (
        <div key={vendor.id} style={styles.card}>
          <div style={styles.row}>
            <div>
              <span style={styles.name}>{vendor.name}</span>
              {vendor.contact && <span style={styles.contact}>{vendor.contact}</span>}
            </div>
            <button type="button" style={styles.filesToggle} onClick={() => handleToggleFiles(vendor.id)}>
              {filesByVendor[vendor.id] ? 'Hide files' : 'Files'}
            </button>
          </div>

          {filesByVendor[vendor.id] && (
            <div style={styles.filesPanel}>
              {loadingFilesFor === vendor.id && <p style={styles.note}>Loading files…</p>}

              {filesByVendor[vendor.id].length === 0 && loadingFilesFor !== vendor.id && (
                <p style={styles.note}>No files uploaded yet.</p>
              )}

              {filesByVendor[vendor.id].map((file) => (
                <div key={file.id} style={styles.fileRow}>
                  <button type="button" style={styles.fileLink} onClick={() => handleOpenFile(file)}>
                    {file.name}
                  </button>
                  <button
                    type="button"
                    style={styles.fileRemove}
                    onClick={() => handleDeleteFile(vendor.id, file)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <label style={styles.uploadLabel}>
                {uploadingFor === vendor.id ? 'Uploading…' : 'Upload file'}
                <input
                  type="file"
                  style={styles.hiddenInput}
                  disabled={uploadingFor === vendor.id}
                  onChange={(e) => {
                    handleUpload(vendor, e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          )}
        </div>
      ))}

      {fileError && <p style={styles.error}>{fileError}</p>}

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
  card: {
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    gap: 12,
  },
  name: { fontWeight: 600, fontSize: 14, marginRight: 8 },
  contact: { color: B.inkLight, fontSize: 13 },
  note: { color: B.inkLight, fontSize: 14, marginBottom: 16 },
  filesToggle: {
    flexShrink: 0,
    padding: '6px 12px',
    background: 'transparent',
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 12,
    color: B.inkMid,
    cursor: 'pointer',
  },
  filesPanel: {
    borderTop: `1px solid ${B.border}`,
    padding: '10px 14px',
    background: B.bgOff,
  },
  fileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
  },
  fileLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: B.ink,
    fontSize: 13,
    textDecoration: 'underline',
    cursor: 'pointer',
    textAlign: 'left',
  },
  fileRemove: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: B.red,
    fontSize: 12,
    cursor: 'pointer',
  },
  uploadLabel: {
    display: 'inline-block',
    marginTop: 8,
    padding: '8px 14px',
    border: `1px solid ${B.ink}`,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    color: B.ink,
    cursor: 'pointer',
  },
  hiddenInput: { display: 'none' },
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
