// A compact reading stat: big value + quiet label, with an optional leading
// icon. Gold accent is reserved for Qur'an/progress meaning.

export default function Stat({ icon, value, label, sub, accent = 'teal' }) {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <span className={accent === 'gold' ? 'text-gold' : 'text-teal'}>{icon}</span>
      )}
      <div>
        <p className="text-xl font-bold leading-none text-teal">{value}</p>
        <p className="mt-1 t-caption">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-muted/70">{sub}</p>}
      </div>
    </div>
  )
}
