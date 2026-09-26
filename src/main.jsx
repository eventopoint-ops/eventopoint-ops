import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { installGlobalErrorLogging } from './lib/logError.js'

installGlobalErrorLogging()

// Drop the pre-React boot screen from index.html now that we're mounting.
// Removing it here rather than in CSS means it stays visible for exactly
// as long as it is useful -- from the tap on the icon to the first render.
document.getElementById('boot')?.remove()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
