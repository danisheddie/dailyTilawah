// Shared install state, so the install nudge and the beta notice agree on who
// shows. `eligible` is true when the app isn't installed, hasn't been
// permanently dismissed, and can actually be installed (a native prompt was
// captured, or we're on iOS where it's manual).

import { useEffect, useState } from 'react'
import { isInstallDismissed, dismissInstall } from './storage'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function useInstall() {
  const [deferred, setDeferred] = useState(null) // beforeinstallprompt event
  const [dismissed, setDismissed] = useState(() => isInstallDismissed())
  const [installed, setInstalled] = useState(() => isStandalone())
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  // "Add to Home Screen" only exists in real Safari on iOS — not Chrome/Firefox
  // (CriOS/FxiOS…) and not in-app webviews (Instagram, Facebook, etc.), which
  // lack Safari's "Version/" token. When iOS but not Safari we tell the user to
  // open the page in Safari first instead of showing steps they can't follow.
  const isIosSafari =
    isIos &&
    /Safari/.test(ua) &&
    /Version\//.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter/.test(ua)
  const iosNeedsSafari = isIos && !isIosSafari

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault()
      setDeferred(e)
    }
    function onInstalled() {
      setInstalled(true)
      dismissInstall()
      setDismissed(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const eligible = !installed && !dismissed && (isIos || deferred != null)

  async function install() {
    if (!deferred) return
    deferred.prompt()
    try {
      await deferred.userChoice
    } catch {
      /* ignore */
    }
    setDeferred(null)
  }

  function dontShowAgain() {
    dismissInstall()
    setDismissed(true)
  }

  return { eligible, deferred, isIos, iosNeedsSafari, install, dontShowAgain }
}
