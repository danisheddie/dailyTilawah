// A native-style settings row: optional leading icon, label, and a right-side
// value + chevron. Renders as a button when `onClick` is given, else a div
// (for rows that hold their own control, e.g. a toggle passed as `value`).

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/70" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export default function SettingRow({ icon, label, value, onClick, danger }) {
  const inner = (
    <>
      <span className={`flex items-center gap-3 text-[15px] ${danger ? 'font-medium text-red-500' : 'text-teal'}`}>
        {icon && <span className={danger ? 'text-red-500' : 'text-teal'}>{icon}</span>}
        {label}
      </span>
      <span className="flex items-center gap-1.5 text-sm text-muted">
        {value}
        {onClick && <Chevron />}
      </span>
    </>
  )
  if (onClick) {
    return (
      <button onClick={onClick} className="row">
        {inner}
      </button>
    )
  }
  return <div className="row">{inner}</div>
}
