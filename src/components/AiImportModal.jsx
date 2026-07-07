import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { B, bodyFont } from '../lib/theme'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-run-of-show`

// AI Import: upload a .docx run-of-show, extract its text client-side
// with mammoth.js, send it to the parse-run-of-show Edge Function (which
// holds the Anthropic key server-side — never call the AI API directly
// from the browser), and insert the returned tasks.
//
// Every step here surfaces its own error state. The old build's biggest
// AI Import bugs were all silent: a missing CDN script left window.mammoth
// undefined with no visible failure, and a missing UUID check on the
// returned ownerId caused inserts to fail a foreign-key constraint with
// no user-facing message at all.
export default function AiImportModal({ event, teamMembers, onClose, onImported }) {
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState('idle') // idle | extracting | parsing | error
  const [errorMessage, setErrorMessage] = useState('')

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    setErrorMessage('')

    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.docx')) {
      setStatus('error')
      setErrorMessage('Only .docx files are supported right now — PDF and legacy .doc are not yet.')
      return
    }
    if (!window.mammoth) {
      setStatus('error')
      setErrorMessage('Document reader failed to load. Refresh the page and try again.')
      return
    }

    setStatus('extracting')
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const result = await window.mammoth.extractRawText({ arrayBuffer: evt.target.result })
        await parseDocument(result.value || '')
      } catch (err) {
        setStatus('error')
        setErrorMessage(`Could not read document: ${err.message}`)
      }
    }
    reader.onerror = () => {
      setStatus('error')
      setErrorMessage('Could not read the file.')
    }
    reader.readAsArrayBuffer(file)
  }

  const parseDocument = async (documentText) => {
    setStatus('parsing')
    try {
      const session = (await supabase.auth.getSession()).data.session
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          document: documentText.slice(0, 6000),
          team: teamMembers,
        }),
      })
      const body = await res.json()
      if (!res.ok || body.error) {
        throw new Error(body.error || `Server returned ${res.status}`)
      }

      const rows = (body.tasks || []).map((t) => ({
        event_id: event.id,
        time: t.time,
        task: t.task,
        assigned_team_member_id: UUID_RE.test(t.ownerId) ? t.ownerId : null,
        status: t.status || 'pending',
        category: t.category,
        phase: t.phase,
      }))

      if (rows.length === 0) {
        setStatus('error')
        setErrorMessage('AI did not find any tasks in this document. Try a clearer run-of-show format.')
        return
      }

      const { data: inserted, error: insertError } = await supabase.from('tasks').insert(rows).select()
      if (insertError) {
        setStatus('error')
        setErrorMessage(`AI parsed the document, but saving the tasks failed: ${insertError.message}`)
        return
      }

      onImported(inserted || [])
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong parsing the document.')
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>AI Import</h2>
        <p style={styles.subtitle}>Upload a run-of-show Word document (.docx) and AI will turn it into tasks.</p>

        <label style={styles.dropZone}>
          <input
            type="file"
            accept=".docx"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {fileName ? fileName : 'Click to choose a .docx file'}
        </label>

        {status === 'extracting' && <p style={styles.note}>Reading document…</p>}
        {status === 'parsing' && <p style={styles.note}>AI is reading the document…</p>}
        {status === 'error' && <p style={styles.error}>{errorMessage}</p>}

        <button type="button" style={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: B.bg,
    borderRadius: 4,
    padding: 28,
    width: 400,
    fontFamily: bodyFont,
  },
  title: { fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 8 },
  subtitle: { fontSize: 13, color: B.inkMid, marginBottom: 16, lineHeight: 1.4 },
  dropZone: {
    display: 'block',
    border: `1px dashed ${B.border}`,
    borderRadius: 4,
    padding: '24px 16px',
    textAlign: 'center',
    fontSize: 13,
    color: B.inkMid,
    cursor: 'pointer',
    marginBottom: 12,
  },
  note: { fontSize: 13, color: B.inkLight, marginBottom: 12 },
  error: { fontSize: 13, color: B.red, marginBottom: 12, lineHeight: 1.4 },
  closeButton: {
    width: '100%',
    padding: '10px 0',
    background: B.bg,
    color: B.ink,
    border: `1px solid ${B.border}`,
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
  },
}
