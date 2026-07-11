// A friendly, dismissible beta notice. Thanks the tester and reassures them
// the app is fully usable. Shown until dismissed (remembered on the device).

import { useState } from 'react'
import { isBetaDismissed, dismissBeta, isHelpSeen } from '../utils/storage'
import { useInstall } from '../utils/useInstall.jsx'
import { useLang } from '../utils/i18n.jsx'

export default function BetaNotice() {
  const { t } = useLang()
  const { eligible: installEligible } = useInstall()
  const [hidden, setHidden] = useState(() => isBetaDismissed())
  // Only one Home banner shows at a time: defer to the install nudge, then to
  // the first-run help pointer (until the guide has been seen/dismissed).
  if (hidden || installEligible || !isHelpSeen()) return null

  return (
    <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-relaxed text-teal/90">
          <span className="font-semibold">{t('beta.title')}</span>{' '}
          {t('beta.body')}
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
