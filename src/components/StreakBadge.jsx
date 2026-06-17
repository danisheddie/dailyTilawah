// A quiet streak indicator — the only nod to gamification in the app.

import { useLang } from '../utils/i18n.jsx'

export default function StreakBadge({ streak, size = 'md' }) {
  const { t } = useLang()
  const active = streak > 0
  const big = size === 'lg'
  const unit = streak === 1 ? t('common.day') : t('common.days')

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 ${
        big ? 'py-2.5' : 'py-2'
      } ${active ? 'bg-gold/15 text-gold' : 'bg-muted/10 text-muted'}`}
      title={`${streak} ${unit}`}
    >
      <span className={big ? 'text-2xl' : 'text-lg'} aria-hidden="true">
        {active ? '🌙' : '☾'}
      </span>
      <span className={`font-semibold ${big ? 'text-lg' : 'text-sm'} text-teal`}>
        {streak} {unit}
      </span>
    </div>
  )
}
