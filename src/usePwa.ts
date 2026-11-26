import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

interface InstallPrompt extends Event {
  prompt(): Promise<unknown>
}

export function usePwa() {
  const [readyOffline, setReadyOffline] = useState(Boolean(navigator.serviceWorker?.controller))
  const [refresh, setRefresh] = useState<(() => void) | null>(null)
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone))

  useEffect(() => {
    function beforeInstall(event: Event) {
      event.preventDefault()
      setPrompt(event as InstallPrompt)
    }
    function onInstall() { setInstalled(true); setPrompt(null) }
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', onInstall)
    const update = registerSW({
      onOfflineReady() { setReadyOffline(true) },
      onNeedRefresh() { setRefresh(() => () => { void update(true) }) },
    })
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall)
      window.removeEventListener('appinstalled', onInstall)
    }
  }, [])

  const install = prompt ? async () => {
    setPrompt(null)
    await prompt.prompt()
  } : undefined

  return { install, installed, readyOffline, refresh }
}

export type Pwa = ReturnType<typeof usePwa>
