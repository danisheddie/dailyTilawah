// A calm bottom sheet: dim backdrop, rounded top panel, title + close. The
// single sheet primitive used across the app (option pickers, reading options,
// jump-to). Tap the backdrop or the × to close.

export default function Sheet({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-teal/30 backdrop-blur-sm">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="animate-fade-in relative mx-auto flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-paper shadow-card">
        <div className="flex items-center justify-between px-6 pb-1 pt-5">
          <h2 className="t-title">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-lg p-1.5 text-muted transition active:scale-90"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-8 pt-1">{children}</div>
        {footer}
      </div>
    </div>
  )
}
