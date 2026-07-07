import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import EventDetailPage from './pages/EventDetailPage'
import { bodyFont } from './lib/theme'

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
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
