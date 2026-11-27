import { getLanguage, subscribeLanguage, t } from './domain/language.ts'
import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Activity } from 'lucide-react'
import { App } from './App'
import { cloudMisconfigured, supabase, type CloudAccount } from './storage/cloud.ts'
import { usePwa } from './usePwa'

export function CloudApp() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage)
  useEffect(() => {
    document.documentElement.lang = language
    document.title = `PocketPulse | ${t('Keuangan pribadi')}`
  }, [language])
  const pwa = usePwa()
  const [account, setAccount] = useState<CloudAccount | null | undefined>(supabase ? undefined : null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [installError, setInstallError] = useState(false)
  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      setAccount(user ? { id: user.id, email: user.email ?? '' } : null)
    })
    return () => subscription.unsubscribe()
  }, [])
  if (!supabase && !cloudMisconfigured) return <App pwa={pwa} />
  if (account) return <App key={account.id} account={account} pwa={pwa} />
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const { error: failure } = await supabase!.auth.signInWithPassword({
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
      })
      if (failure) throw failure
    } catch {
      setError(t("Login gagal. Periksa email, kata sandi, dan koneksi."))
    } finally { setBusy(false) }
  }
  return <main className="cloud-login">
    <div className="panel">
      <div className="brand"><span className="brand-mark"><Activity size={22} /></span><span>PocketPulse</span></div>
      {cloudMisconfigured ? <><h1>{t("Konfigurasi belum lengkap")}</h1><p>{t("Isi URL Supabase dan publishable key untuk mengaktifkan login.")}</p></>
        : account === undefined ? <p>{t("Memuat sesi…")}</p> : <>
          <h1>{t("Masuk ke PocketPulse")}</h1>
          <form className="fields" onSubmit={signIn}>
            <label className="field"><span>Email</span><input type="email" name="email" autoComplete="username" required /></label>
            <label className="field"><span>{t("Kata sandi")}</span><input type="password" name="password" autoComplete="current-password" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button primary" disabled={busy} type="submit">{busy ? t("Sedang masuk…") : t("Masuk")}</button>
          </form>
          {pwa.install && !pwa.installed && <button className="button secondary cloud-actions" onClick={() => {
            void pwa.install?.().catch(() => setInstallError(true))
          }}>{t("Pasang PocketPulse")}</button>}
          {installError && <p className="muted cloud-actions" role="status">{t("Buka menu browser untuk memasang PocketPulse.")}</p>}
        </>}
    </div>
  </main>
}
