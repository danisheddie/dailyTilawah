// Routing + first-launch gate. Onboarding takes over until the user has
// chosen a goal; afterwards the three core routes are available.

import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { isOnboarded } from './utils/storage'
import Onboarding from './components/Onboarding'
import Home from './components/Home'
import Reader from './components/Reader'
import Settings from './components/Settings'

export default function App() {
  const [onboarded, setOnboarded] = useState(() => isOnboarded())

  if (!onboarded) {
    return <Onboarding onDone={() => setOnboarded(true)} />
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/read" element={<Reader />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
