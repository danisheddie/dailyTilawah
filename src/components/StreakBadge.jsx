// A quiet streak indicator — the only nod to gamification in the app.

export default function StreakBadge({ streak, size = 'md' }) {
  const active = streak > 0
  const big = size === 'lg'

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 ${
        big ? 'py-2.5' : 'py-2'
      } ${active ? 'bg-gold/15 text-gold' : 'bg-muted/10 text-muted'}`}
      title={`${streak}-day streak`}
    >
      <span className={big ? 'text-2xl' : 'text-lg'} aria-hidden="true">
        {active ? '🌙' : '☾'}
      </span>
      <span className={`font-semibold ${big ? 'text-lg' : 'text-sm'} text-teal`}>
        {streak} {streak === 1 ? 'day' : 'days'}
      </span>
    </div>
  )
}
