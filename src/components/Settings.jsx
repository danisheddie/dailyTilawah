// Settings: native-style grouped rows. Single-value settings open a bottom
// sheet to choose; toggles sit inline; complex panels (reminders, sync) open
// in a sheet. All the original functionality, flattened and quieted.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Reminders from './Reminders'
import SyncSettings from './SyncSettings'
import StartingPoint from './StartingPoint'
import Group from './ui/Group'
import SettingRow from './ui/SettingRow'
import OptionSheet from './ui/OptionSheet'
import Sheet from './ui/Sheet'
import { RECITERS, TRANSLATIONS } from '../utils/api'
import { useLang, LANGUAGES } from '../utils/i18n.jsx'
import { applyTheme } from '../utils/theme'
import { formatHijri } from '../utils/dateUtils'
import {
  GOALS,
  MIN_CUSTOM_GOAL,
  MAX_CUSTOM_GOAL,
  clampGoalPages,
  getGoal,
  setGoal,
  getSettings,
  setSetting,
  getStreak,
  getTotalPagesRead,
  resetProgress,
  getName,
  setName,
  getLastPage,
  setLastPage,
} from '../utils/storage'

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-teal' : 'bg-muted/30'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { t, lang, setLang } = useLang()
  const initialGoal = getGoal()
  const [goalId, setGoalId] = useState(() => initialGoal.id)
  const [customPages, setCustomPages] = useState(() =>
    initialGoal.id === 'custom' ? initialGoal.pages : 3
  )
  const [settings, setSettings] = useState(() => getSettings())
  const [name, setNameState] = useState(() => getName())
  const [resumePage, setResumePage] = useState(() => getLastPage())
  const [sheet, setSheet] = useState(null) // which picker/panel is open

  const streak = getStreak()
  const totalPages = getTotalPagesRead()

  function changeGoal(id) {
    setGoalId(id)
    if (id === 'custom') setGoal('custom', customPages)
    else setGoal(id)
  }
  function changeCustomPages(value) {
    setCustomPages(value)
    if (goalId === 'custom') setGoal('custom', value)
  }
  function toggle(key, value) {
    setSettings(setSetting(key, value))
  }
  function changeTheme(theme) {
    setSettings(setSetting('theme', theme))
    applyTheme(theme)
  }
  function changeHijri(delta) {
    const next = Math.max(-2, Math.min(2, (settings.hijriOffset || 0) + delta))
    toggle('hijriOffset', next)
  }
  function doReset() {
    resetProgress()
    setSheet(null)
    navigate('/', { replace: true })
  }

  // Option lists + current-value labels.
  const themeOptions = [
    { id: 'light', label: t('settings.themeLight') },
    { id: 'dark', label: t('settings.themeDark') },
    { id: 'sepia', label: t('settings.themeSepia') },
  ]
  const sizeOptions = [
    { id: 's', label: t('settings.sizeSmall') },
    { id: 'm', label: t('settings.sizeMedium') },
    { id: 'l', label: t('settings.sizeLarge') },
  ]
  const viewOptions = [
    { id: 'mushaf', label: t('settings.mushafPage'), sub: t('settings.mushafSub') },
    { id: 'list', label: t('settings.translationView'), sub: t('settings.translationViewSub') },
  ]
  const reflectionOptions = [
    { id: 'both', label: t('settings.both') },
    { id: 'quran', label: t('settings.quranOnly') },
    { id: 'hadith', label: t('settings.hadithOnly') },
    { id: 'off', label: t('settings.off') },
  ]
  const labelFor = (opts, id) => opts.find((o) => o.id === id)?.label
  const goalLabel =
    goalId === 'custom' ? `${customPages} ${t('common.pages')}` : t('goal.' + goalId)
  const editionLabel = TRANSLATIONS.find((tr) => tr.id === settings.translationEdition)?.name
  const reciterLabel = RECITERS.find((r) => r.id === settings.reciter)?.name
  const hijriOffset = settings.hijriOffset || 0
  const hijriValue = `${hijriOffset > 0 ? '+' : ''}${hijriOffset} ${t('common.days')}`

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-28 pt-6">
      <header className="flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          aria-label={t('common.back')}
          className="-ml-2 rounded-lg p-2 text-muted transition active:scale-90"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="t-title text-xl">{t('settings.title')}</h1>
      </header>

      {/* Reading activity */}
      <section className="mt-6">
        <p className="section-label mb-2">{t('settings.readingActivity')}</p>
        <div className="card flex items-center px-2 py-4">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold leading-none text-teal">{streak}</p>
            <p className="mt-1.5 t-caption">{t('settings.dayStreak')}</p>
          </div>
          <span className="h-9 w-px bg-teal/10" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold leading-none text-teal">{totalPages}</p>
            <p className="mt-1.5 t-caption">{t('settings.lifetime')}</p>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <Group label={t('settings.appearance')}>
        <SettingRow label={t('settings.appLanguage')} value={LANGUAGES.find((l) => l.id === lang)?.name} onClick={() => setSheet('lang')} />
        <SettingRow label={t('settings.theme')} value={labelFor(themeOptions, settings.theme)} onClick={() => setSheet('theme')} />
        <SettingRow label={t('settings.readingSize')} value={labelFor(sizeOptions, settings.readingSize)} onClick={() => setSheet('size')} />
        <SettingRow label={t('settings.hijriDate')} value={hijriValue} onClick={() => setSheet('hijri')} />
      </Group>

      {/* Reading */}
      <Group label={t('settings.reading')}>
        <SettingRow label={t('settings.dailyGoal')} value={goalLabel} onClick={() => setSheet('goal')} />
        <SettingRow label={t('settings.readingView')} value={labelFor(viewOptions, settings.readingView)} onClick={() => setSheet('view')} />
        <SettingRow label={t('settings.showTranslation')} value={<Switch checked={settings.showTranslation} onChange={(v) => toggle('showTranslation', v)} />} />
        {settings.showTranslation && (
          <SettingRow label={t('settings.translation')} value={editionLabel} onClick={() => setSheet('edition')} />
        )}
        <SettingRow label={t('settings.showTransliteration')} value={<Switch checked={settings.showTransliteration} onChange={(v) => toggle('showTransliteration', v)} />} />
        <SettingRow label={t('settings.showAudio')} value={<Switch checked={settings.showAudio} onChange={(v) => toggle('showAudio', v)} />} />
        {settings.showAudio && (
          <SettingRow label={t('settings.reciter')} value={reciterLabel} onClick={() => setSheet('reciter')} />
        )}
        <SettingRow label={t('settings.dailyReflection')} value={labelFor(reflectionOptions, settings.reflectionMode)} onClick={() => setSheet('reflection')} />
        <SettingRow label={t('settings.readingPosition')} value={t('reader.page', { page: resumePage })} onClick={() => setSheet('position')} />
        <SettingRow label={t('settings.yourName')} value={name || t('onboarding.namePlaceholder')} onClick={() => setSheet('name')} />
      </Group>

      {/* Reminders & sync */}
      <Group>
        <SettingRow
          label={t('reminders.title')}
          icon={
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          }
          onClick={() => setSheet('reminders')}
        />
        <SettingRow
          label={t('sync.title')}
          icon={
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7-3.3M3 12a9 9 0 0 1 16-5.7M21 3v5h-5M3 21v-5h5" />
            </svg>
          }
          onClick={() => setSheet('sync')}
        />
      </Group>

      {/* Support */}
      <Group label={t('settings.support')}>
        <SettingRow
          label={t('settings.howItWorks')}
          icon={
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          }
          onClick={() => navigate('/help')}
        />
      </Group>

      {/* Reset */}
      <div className="mt-8">
        <div className="card px-4">
          <SettingRow label={t('settings.resetProgress')} danger onClick={() => setSheet('reset')} />
        </div>
      </div>

      <p className="mt-10 text-center t-caption">Tilawah · {t('common.appTagline')}</p>
      <p className="mt-1 text-center text-[11px] text-muted/70">{t('settings.betaFooter')}</p>

      {/* ---------------- sheets ---------------- */}
      {sheet === 'lang' && (
        <OptionSheet title={t('settings.appLanguage')} options={LANGUAGES.map((l) => ({ id: l.id, label: l.name }))} value={lang} onSelect={setLang} onClose={() => setSheet(null)} />
      )}
      {sheet === 'theme' && (
        <OptionSheet title={t('settings.theme')} options={themeOptions} value={settings.theme} onSelect={changeTheme} onClose={() => setSheet(null)} />
      )}
      {sheet === 'size' && (
        <OptionSheet title={t('settings.readingSize')} options={sizeOptions} value={settings.readingSize} onSelect={(v) => toggle('readingSize', v)} onClose={() => setSheet(null)} />
      )}
      {sheet === 'view' && (
        <OptionSheet title={t('settings.readingView')} options={viewOptions} value={settings.readingView} onSelect={(v) => toggle('readingView', v)} onClose={() => setSheet(null)} />
      )}
      {sheet === 'edition' && (
        <OptionSheet title={t('settings.translation')} options={TRANSLATIONS.map((tr) => ({ id: tr.id, label: tr.name }))} value={settings.translationEdition} onSelect={(v) => toggle('translationEdition', v)} onClose={() => setSheet(null)} />
      )}
      {sheet === 'reciter' && (
        <OptionSheet title={t('settings.reciter')} options={RECITERS.map((r) => ({ id: r.id, label: r.name }))} value={settings.reciter} onSelect={(v) => toggle('reciter', v)} onClose={() => setSheet(null)} />
      )}
      {sheet === 'reflection' && (
        <OptionSheet title={t('settings.dailyReflection')} options={reflectionOptions} value={settings.reflectionMode} onSelect={(v) => toggle('reflectionMode', v)} onClose={() => setSheet(null)} />
      )}

      {sheet === 'goal' && (
        <Sheet title={t('settings.dailyGoal')} onClose={() => setSheet(null)}>
          <div className="-mt-1 grid grid-cols-2 gap-3">
            {[...GOALS, { id: 'custom' }].map((g) => (
              <button
                key={g.id}
                onClick={() => changeGoal(g.id)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  goalId === g.id ? 'border-teal bg-teal text-paper' : 'border-teal/15 text-teal active:scale-[0.99]'
                }`}
              >
                {t('goal.' + g.id)}
              </button>
            ))}
          </div>
          {goalId === 'custom' && (
            <div className="mt-3 flex items-center gap-3">
              <input
                type="number"
                min={MIN_CUSTOM_GOAL}
                max={MAX_CUSTOM_GOAL}
                step={0.5}
                value={customPages}
                onChange={(e) => changeCustomPages(e.target.value)}
                onBlur={(e) => changeCustomPages(clampGoalPages(e.target.value))}
                className="w-24 rounded-xl border border-teal/15 bg-transparent px-4 py-3 text-center text-sm text-teal outline-none transition focus:border-teal"
              />
              <span className="text-sm text-muted">{t('goal.pagesPerDay')}</span>
            </div>
          )}
        </Sheet>
      )}

      {sheet === 'hijri' && (
        <Sheet title={t('settings.hijriDate')} onClose={() => setSheet(null)}>
          <p className="-mt-1 t-caption">{t('settings.hijriDateSub')}</p>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-teal/15 px-2 py-2">
            <button onClick={() => changeHijri(-1)} disabled={hijriOffset <= -2} aria-label="-1 day" className="flex h-10 w-12 items-center justify-center rounded-lg text-2xl text-teal transition active:scale-90 disabled:opacity-30">−</button>
            <span className="text-sm font-medium text-teal">{formatHijri(new Date(), hijriOffset)}</span>
            <button onClick={() => changeHijri(1)} disabled={hijriOffset >= 2} aria-label="+1 day" className="flex h-10 w-12 items-center justify-center rounded-lg text-2xl text-teal transition active:scale-90 disabled:opacity-30">+</button>
          </div>
        </Sheet>
      )}

      {sheet === 'name' && (
        <Sheet title={t('settings.yourName')} onClose={() => { setName(name); setSheet(null) }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setNameState(e.target.value)}
            placeholder={t('onboarding.namePlaceholder')}
            maxLength={40}
            autoFocus
            className="-mt-1 w-full rounded-xl border border-teal/15 bg-transparent px-4 py-3 text-base text-teal outline-none transition placeholder:text-muted/60 focus:border-teal"
          />
          <button className="btn-primary mt-4 w-full" onClick={() => { setName(name); setSheet(null) }}>
            {t('common.continue')}
          </button>
        </Sheet>
      )}

      {sheet === 'position' && (
        <Sheet title={t('settings.readingPosition')} onClose={() => setSheet(null)}>
          <p className="-mt-1 t-caption">{t('settings.readingPositionSub', { page: resumePage })}</p>
          <div className="mt-4">
            <StartingPoint
              onApplied={(page) => {
                setLastPage(page)
                setResumePage(page)
                setSheet(null)
              }}
            />
          </div>
        </Sheet>
      )}

      {sheet === 'reminders' && (
        <Sheet title={t('reminders.title')} onClose={() => setSheet(null)}>
          <Reminders />
        </Sheet>
      )}
      {sheet === 'sync' && (
        <Sheet title={t('sync.title')} onClose={() => setSheet(null)}>
          <SyncSettings />
        </Sheet>
      )}

      {sheet === 'reset' && (
        <Sheet title={t('settings.resetProgress')} onClose={() => setSheet(null)}>
          <p className="-mt-1 text-sm leading-relaxed text-muted">{t('settings.resetConfirm')}</p>
          <div className="mt-5 flex gap-3">
            <button className="btn-ghost grow" onClick={() => setSheet(null)}>{t('common.cancel')}</button>
            <button className="grow rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition active:scale-[0.98]" onClick={doReset}>
              {t('settings.reset')}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
