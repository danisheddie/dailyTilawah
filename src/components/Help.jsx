// A calm "How it works" guide — the platform/PWA things people don't discover
// on their own: installing, syncing, reminders, reading views, progress.
// Reached from the Home header "?" and from Settings. Replayable by anyone.

import { useNavigate } from 'react-router-dom'
import { useLang } from '../utils/i18n.jsx'

function Section({ title, children }) {
  return (
    <section className="border-t border-teal/5 py-5 first:border-t-0">
      <h2 className="text-sm font-semibold text-teal">{title}</h2>
      <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  )
}

export default function Help() {
  const navigate = useNavigate()
  const { t } = useLang()

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="rounded-full p-1.5 text-muted transition active:scale-90"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-teal">{t('help.title')}</h1>
      </header>

      <p className="mt-6 text-sm leading-relaxed text-muted">{t('help.intro')}</p>

      <div className="mt-4">
        <Section title={t('help.startTitle')}>
          <p>{t('help.startBody')}</p>
        </Section>

        <Section title={t('help.installTitle')}>
          <p>{t('help.installBody')}</p>
          <ul className="mt-1 space-y-1.5">
            <li>{t('help.installIphone')}</li>
            <li>{t('help.installAndroid')}</li>
            <li>{t('help.installInApp')}</li>
          </ul>
        </Section>

        <Section title={t('help.readingTitle')}>
          <p>{t('help.readingBody')}</p>
        </Section>

        <Section title={t('help.syncTitle')}>
          <p>{t('help.syncBody')}</p>
        </Section>

        <Section title={t('help.remindersTitle')}>
          <p>{t('help.remindersBody')}</p>
        </Section>

        <Section title={t('help.progressTitle')}>
          <p>{t('help.progressBody')}</p>
        </Section>
      </div>
    </div>
  )
}
