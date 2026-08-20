// Presents a set of options in a bottom sheet with the current one checked,
// instead of showing every choice inline. options: [{ id, label, sub? }].

import Sheet from './Sheet'

export default function OptionSheet({ title, options, value, onSelect, onClose }) {
  return (
    <Sheet title={title} onClose={onClose}>
      <ul className="-mt-1 divide-y divide-teal/5">
        {options.map((o) => {
          const active = value === o.id
          return (
            <li key={o.id}>
              <button
                onClick={() => {
                  onSelect(o.id)
                  onClose()
                }}
                className="row"
              >
                <span>
                  <span className={`block text-[15px] ${active ? 'font-semibold text-teal' : 'font-medium text-teal'}`}>
                    {o.label}
                  </span>
                  {o.sub && <span className="mt-0.5 block t-caption">{o.sub}</span>}
                </span>
                {active && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gold" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
