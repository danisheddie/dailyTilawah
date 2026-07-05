// A compact "reading options" bottom sheet, opened from the reader header
// (the "Aa" button). Lets you switch view, size and reading aids without
// leaving the page — changes apply live via the reader's changeSetting.

import { TRANSLATIONS, RECITERS } from '../utils/api'
import { useLang } from '../utils/i18n.jsx'

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? 'bg-teal' : 'bg-muted/30'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

export default function ReadingOptions({ settings, onChange, onClose }) {
  const { t } = useLang()

  const views = [
    { id: 'mushaf', label: t('settings.mushafPage') },
    { id: 'list', label: t('settings.translationView') },
  ]
  const sizes = [
    ['s', 'settings.sizeSmall'],
    ['m', 'settings.sizeMedium'],
    ['l', 'settings.sizeLarge'],
  ]

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-teal/30 backdrop-blur-sm">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="animate-fade-in relative mx-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-3xl bg-paper shadow-xl">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-base font-semibold text-teal">{t('reader.options')}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted transition active:scale-90"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Reading view */}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t('settings.readingView')}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {views.map((v) => (
              <button
                key={v.id}
                onClick={() => onChange('readingView', v.id)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  settings.readingView === v.id
                    ? 'border-teal bg-teal text-paper'
                    : 'border-teal/15 text-teal active:scale-[0.99]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Text size */}
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('settings.readingSize')}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            {sizes.map(([id, key]) => (
              <button
                key={id}
                onClick={() => onChange('readingSize', id)}
                className={`rounded-xl border py-2.5 font-medium transition ${
                  settings.readingSize === id
                    ? 'border-teal bg-teal text-paper'
                    : 'border-teal/15 text-teal active:scale-[0.99]'
                } ${id === 's' ? 'text-xs' : id === 'l' ? 'text-base' : 'text-sm'}`}
              >
                {t(key)}
              </button>
            ))}
          </div>

          {/* Reading aids */}
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('settings.readingAids')}
          </p>
          <div className="mt-1 divide-y divide-teal/5">
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-teal">{t('settings.showTranslation')}</span>
              <Switch
                checked={settings.showTranslation}
                onChange={(v) => onChange('showTranslation', v)}
              />
            </div>
            {settings.showTranslation && (
              <div className="py-3">
                <select
                  value={settings.translationEdition}
                  onChange={(e) => onChange('translationEdition', e.target.value)}
                  className="w-full rounded-xl border border-teal/15 bg-transparent px-3 py-2 text-sm text-teal outline-none transition focus:border-teal"
                >
                  {TRANSLATIONS.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-teal">{t('settings.showTransliteration')}</span>
              <Switch
                checked={settings.showTransliteration}
                onChange={(v) => onChange('showTransliteration', v)}
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-teal">{t('settings.showAudio')}</span>
              <Switch
                checked={settings.showAudio}
                onChange={(v) => onChange('showAudio', v)}
              />
            </div>
            {settings.showAudio && (
              <div className="py-3">
                <select
                  value={settings.reciter}
                  onChange={(e) => onChange('reciter', e.target.value)}
                  className="w-full rounded-xl border border-teal/15 bg-transparent px-3 py-2 text-sm text-teal outline-none transition focus:border-teal"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
