// A calm, snoozable nudge for users with real progress who haven't backed it
// up. It defers to the install nudge (so only one Home banner shows), and the
// help/beta banners defer to it. Never shown once synced; hidden for ~2 weeks
// on dismiss (the data-loss risk is ongoing, so it can resurface).

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isBackupEligible } from '../utils/cloudSync'
import { snoozeBackup } from '../utils/storage'
import { useInstall } from '../utils/useInstall.jsx'
import { useLang } from '../utils/i18n.jsx'

export default function BackupNudge() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { eligible: installEligible } = useInstall()
  const [hidden, setHidden] = useState(() => !isBackupEligible())

  if (hidden || installEligible) return null

  return (
    <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => navigate('/settings')}
          className="flex grow items-start gap-3 text-left active:opacity-70"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-gold" aria-hidden="true">
            <path d="M12 3a4 4 0 0 0-4 4M4 15a4 4 0 0 1 1-7.9 5 5 0 0 1 9.6-1.6A4.5 4.5 0 0 1 19 15" />
            <path d="M12 12v8m0-8-3 3m3-3 3 3" />
          </svg>
          <span>
            <span className="block text-sm font-semibold text-teal">{t('backup.title')}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t('backup.body')}</span>
            <span className="mt-2 inline-block text-xs font-semibold text-teal">
              {t('backup.cta')} →
            </span>
          </span>
        </button>
        <button
          onClick={() => {
            snoozeBackup()
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
