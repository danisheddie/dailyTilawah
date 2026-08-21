// Routing + first-launch gate. Onboarding takes over until the user has
// chosen a goal; afterwards the core routes and the bottom tab bar are shown.

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { isOnboarded } from './utils/storage'
import { syncNow } from './utils/cloudSync'
import Onboarding from './components/Onboarding'
import Home from './components/Home'
import Reader from './components/Reader'
import Settings from './components/Settings'
import Journey from './components/Journey'
import Saved from './components/Saved'
import Help from './components/Help'
import BottomNav from './components/BottomNav'

// The tab bar shows on the top-level destinations; focused/detail views
// (the reader, help) take over the full screen with their own controls.
const NAV_ROUTES = new Set(['/', '/saved', '/settings', '/journey'])

export default function App() {
  const [onboarded, setOnboarded] = useState(() => isOnboarded())
  const { pathname } = useLocation()

  // If the device is linked to a sync code, reconcile with the cloud on load.
  useEffect(() => {
    syncNow().catch(() => {})
  }, [])

  if (!onboarded) {
    return <Onboarding onDone={() => setOnboarded(true)} />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/read" element={<Reader />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {NAV_ROUTES.has(pathname) && <BottomNav />}
    </>
  )
}
