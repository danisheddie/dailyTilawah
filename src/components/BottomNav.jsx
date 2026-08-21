// Persistent bottom tab bar — the app's primary navigation. Four destinations:
// Home (dashboard), Quran (the reader), Saved (bookmarks), More (settings).
// Fixed to the bottom within the max-w-md column, with safe-area padding so it
// clears the iOS home indicator.

import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../utils/i18n.jsx'

const HomeIcon = (
  <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
)
const QuranIcon = (
  <>
    <path d="M4 5a2 2 0 0 1 2-2h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2z" />
    <path d="M4 19a2 2 0 0 1 2-2h13" />
  </>
)
const SavedIcon = <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
const MoreIcon = (
  <>
    <circle cx="5" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="19" cy="12" r="1.4" />
  </>
)

function Tab({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center justify-center gap-1 transition active:scale-95 ${
        active ? 'text-teal' : 'text-muted'
      }`}
    >
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
      <span className={`text-[10.5px] tracking-tight ${active ? 'font-semibold' : 'font-medium'}`}>
        {label}
      </span>
    </button>
  )
}

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useLang()

  const tabs = [
    { to: '/', match: (p) => p === '/', label: t('nav.home'), icon: HomeIcon },
    { to: '/read', match: (p) => p === '/read', label: t('nav.quran'), icon: QuranIcon },
    { to: '/saved', match: (p) => p === '/saved', label: t('nav.saved'), icon: SavedIcon },
    { to: '/settings', match: (p) => p === '/settings' || p === '/journey', label: t('nav.more'), icon: MoreIcon },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30">
      <div className="mx-auto max-w-md border-t border-teal/10 bg-paper/90 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md">
        <div className="flex h-[var(--nav-h)] items-stretch">
          {tabs.map((tab) => (
            <Tab
              key={tab.to}
              active={tab.match(pathname)}
              label={tab.label}
              onClick={() => navigate(tab.to)}
            >
              {tab.icon}
            </Tab>
          ))}
        </div>
      </div>
    </nav>
  )
}
