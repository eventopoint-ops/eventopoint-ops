import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import EventDetailPage from './pages/EventDetailPage'
import CheckInPage from './pages/CheckInPage'
import { bodyFont } from './lib/theme'

// The app has no URL router — every other screen is a client-side state
// machine (see AppShell below), which is fine because nothing except this
// needs a shareable, no-login URL. Check-in links have to work for staff
// who've never signed in, so this one path is handled before AuthProvider
// even mounts. Matches /checkin/<token>.
function getCheckInToken() {
  const match = window.location.pathname.match(/^\/checkin\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : null
}

function AppShell() {
  const { session, profile, loading, error } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState(null)

  if (loading) {
    return <div style={{ padding: 40, fontFamily: bodyFont }}>Loading…</div>
  }

  if (error) {
    return <div style={{ padding: 40, fontFamily: bodyFont, color: '#CC3333' }}>{error}</div>
  }

  if (!session) {
    return <AuthPage />
  }

  if (!profile?.onboarding_complete) {
    return <OnboardingPage />
  }

  if (selectedEvent) {
    return <EventDetailPage event={selectedEvent} onBack={() => setSelectedEvent(null)} />
  }

  return <DashboardPage onOpenEvent={setSelectedEvent} />
}

export default function App() {
  const checkInToken = getCheckInToken()

  if (checkInToken) {
    return <CheckInPage token={checkInToken} />
  }

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
