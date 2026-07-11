// A single, dismissible first-run nudge pointing newcomers to the guide.
// Priority: it defers to the install nudge (shows only once install isn't
// eligible), and the beta notice in turn defers to this — so at most one Home
// banner shows. Dismissed for good on tap-through, on the ×, or once the guide
// has been opened.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isHelpSeen, markHelpSeen } from '../utils/storage'
import { useInstall } from '../utils/useInstall.jsx'
import { useLang } from '../utils/i18n.jsx'

export default function HelpPointer() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { eligible: installEligible } = useInstall()
  const [hidden, setHidden] = useState(() => isHelpSeen())

  if (hidden || installEligible) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-teal/15 bg-teal/[0.04] px-4 py-3">
      <button
        onClick={() => {
          markHelpSeen()
          navigate('/help')
        }}
        className="flex grow items-center gap-2 text-left text-sm font-medium text-teal active:opacity-70"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        {t('help.pointer')}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <button
        onClick={() => {
          markHelpSeen()
          setHidden(true)
        }}
        aria-label="Dismiss"
        className="-mr-1 shrink-0 rounded-full p-1 text-muted transition active:scale-90"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
