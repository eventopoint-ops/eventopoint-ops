import { Component } from 'react'
import { logError } from '../lib/logError'
import { B, displayFont, bodyFont } from '../lib/theme'

// Catches render-time errors anywhere below it in the tree so a bug in one
// screen doesn't take down the whole app with a blank white page. Logs to
// error_logs (best-effort) and shows a simple recovery screen instead.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    logError(error, `React render error${info?.componentStack ? ` — ${info.componentStack.split('\n')[1]?.trim() || ''}` : ''}`)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.shell}>
          <div style={styles.card}>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.note}>
              The app hit an unexpected error. It's been logged — reloading usually fixes it.
            </p>
            <button style={styles.button} onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: B.bgOff,
    fontFamily: bodyFont,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: B.bg,
    border: `1px solid ${B.border}`,
    borderRadius: 8,
    padding: '40px 32px',
    textAlign: 'center',
  },
  title: {
    fontFamily: displayFont,
    fontWeight: 900,
    textTransform: 'uppercase',
    fontSize: 24,
    lineHeight: 1.15,
    margin: '0 0 12px',
  },
  note: { color: B.inkMid, fontSize: 14, lineHeight: 1.5, marginBottom: 24 },
  button: {
    padding: '12px 28px',
    background: B.ink,
    color: B.bg,
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
