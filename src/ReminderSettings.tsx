import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { getLanguage, t } from './domain/language.ts'
import { supabase } from './storage/cloud.ts'

const table = 'pocketpulse_reminders'
const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    && import.meta.env.PROD

function decodeKey(key: string) {
  return Uint8Array.from(atob(key.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - key.length % 4) % 4)), char => char.charCodeAt(0))
}

export function ReminderSettings({ ownerId }: { ownerId: string }) {
  const [key, setKey] = useState('')
  const [availability, setAvailability] = useState<'loading' | 'ready' | 'error'>('loading')
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const language = getLanguage()
  useEffect(() => {
    if (!supported || !supabase || !projectUrl) return
    let cancelled = false
    async function load() {
      const response = await fetch(`${projectUrl}/functions/v1/nightly-reminders`, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) throw new Error()
      const json: { publicKey?: string } = await response.json()
      if (!json.publicKey || decodeKey(json.publicKey).length !== 65) throw new Error()
      if (cancelled) return
      setKey(json.publicKey)
      setAvailability('ready')
      const registration = await navigator.serviceWorker.getRegistration()
      if (cancelled) return
      const subscription = await registration?.pushManager.getSubscription()
      if (!subscription) return
      const row = await supabase!.from(table).select('endpoint,language').eq('user_id', ownerId).eq('endpoint', subscription.endpoint).maybeSingle()
      if (cancelled || row.error) return
      setEnabled(Boolean(row.data))
      if (row.data && row.data.language !== language) {
        await supabase!.from(table).update({ language }).eq('endpoint', subscription.endpoint).eq('user_id', ownerId)
      }
    }
    void load().catch(() => { if (!cancelled) setAvailability('error') })
    return () => { cancelled = true }
  }, [ownerId, language])

  async function toggle() {
    if (!supabase || !key) return
    setMessage('')
    setBusy(true)
    let created: PushSubscription | null = null
    try {
      if (!enabled && await Notification.requestPermission() !== 'granted') {
        setMessage('Izin notifikasi belum diberikan. Periksa pengaturan browser atau perangkat.')
        return
      }
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration?.active) throw new Error('PocketPulse sedang menyiapkan PWA. Muat ulang dan coba lagi.')
      let subscription = await registration.pushManager.getSubscription()
      if (enabled) {
        if (subscription) {
          const { error } = await supabase.from(table).delete().eq('endpoint', subscription.endpoint).eq('user_id', ownerId)
          if (error) throw new Error('Pengingat gagal dinonaktifkan. Coba lagi saat online.')
          try { await subscription.unsubscribe() } catch { /* The cloud subscription is already removed. */ }
        }
        setEnabled(false)
        return
      }
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(key) })
        created = subscription
      }
      const { endpoint, keys } = subscription.toJSON()
      if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error('Langganan notifikasi tidak valid.')
      const found = await supabase.from(table).select('endpoint').eq('endpoint', endpoint).eq('user_id', ownerId).maybeSingle()
      if (found.error) throw new Error('Langganan notifikasi gagal dibaca.')
      const values = { p256dh: keys.p256dh, auth_key: keys.auth, language }
      const { error } = await (found.data ? supabase.from(table).update(values).eq('endpoint', endpoint).eq('user_id', ownerId)
        : supabase.from(table).insert({ endpoint, ...values }))
      if (error?.code === '23505' || error?.code === '42501') throw new Error('Perangkat ini mungkin terhubung ke pengingat akun lain. Nonaktifkan pengingat dari akun tersebut dulu.')
      if (error) throw new Error('Pengingat gagal diaktifkan. Coba lagi saat online.')
      setEnabled(true)
    } catch (error) {
      if (created) await created.unsubscribe().catch(() => false)
      setMessage(error instanceof Error ? error.message : 'Pengaturan pengingat gagal diperbarui.')
    } finally { setBusy(false) }
  }

  return <section className="panel data-panel">
    <div className="panel-heading"><div><h2>{t('Pengingat harian')}</h2><p>{t('Catat pengeluaranmu setiap malam pukul 20.00 WIB.')}</p></div><Bell className="panel-icon" size={19} /></div>
    {!supported ? <p className="muted">{t('Buka PocketPulse sebagai PWA di perangkat yang mendukung notifikasi.')}</p>
      : availability === 'loading' ? <p className="muted">{t('Memeriksa pengingat…')}</p>
        : availability === 'error' ? <p className="muted">{t('Pengingat belum tersedia. Buka kembali PocketPulse saat online.')}</p>
          : <button className="button secondary" onClick={() => void toggle()} disabled={busy} aria-pressed={enabled}>
            {t(enabled ? 'Nonaktifkan pengingat' : 'Aktifkan pengingat')}</button>}
    {message && <p className="form-error" role="alert">{t(message)}</p>}
  </section>
}
