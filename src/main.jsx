import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { LanguageProvider } from './utils/i18n.jsx'
import './index.css'

// Guarantee the official KFGQPC Uthmanic Hafs font is registered on every
// device (with the correct base path), so silent-letter marks like the ṣifr
// mustadīr over a silent alif render as a proper circle — not a fallback dot.
if (typeof FontFace !== 'undefined' && document.fonts) {
  const kfgqpc = new FontFace(
    'KFGQPC Uthmanic Script HAFS',
    `url(${import.meta.env.BASE_URL}fonts/UthmanicHafs1Ver18.woff2)`,
    { display: 'swap' }
  )
  kfgqpc
    .load()
    .then((face) => document.fonts.add(face))
    .catch(() => {})
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* basename matches Vite's base so routes work under /dailyTilawah/. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// Register the service worker (PWA install + push reminders). Harmless if the
// browser lacks support; failures are non-fatal.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .catch(() => {})
  })
}
