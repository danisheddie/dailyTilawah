// A friendly, dismissible beta notice. Thanks the tester and reassures them
// the app is fully usable. Shown until dismissed (remembered on the device).

import { useState } from 'react'
import { isBetaDismissed, dismissBeta } from '../utils/storage'

export default function BetaNotice() {
  const [hidden, setHidden] = useState(() => isBetaDismissed())
  if (hidden) return null

  return (
    <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-relaxed text-teal/90">
          <span className="font-semibold">You’re testing an early version.</span>{' '}
          Jazākallāhu khayran for helping shape Tilawah. Everything here works —
          read, build your streak, and use it however you like. If anything feels
          off, your feedback makes it better.
        </p>
        <button
          onClick={() => {
            dismissBeta()
            setHidden(true)
          }}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-muted transition active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
