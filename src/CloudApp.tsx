import { useEffect, useState, type FormEvent } from 'react'
import { Activity } from 'lucide-react'
import { App } from './App'
import { cloudMisconfigured, supabase, type CloudAccount } from './storage/cloud.ts'
import { usePwa } from './usePwa'

export function CloudApp() {
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
      setError('Login gagal. Periksa email, kata sandi, dan koneksi.')
    } finally { setBusy(false) }
  }
  return <main className="cloud-login">
    <div className="panel">
      <div className="brand"><span className="brand-mark"><Activity size={22} /></span><span>PocketPulse</span></div>
      {cloudMisconfigured ? <><h1>Konfigurasi belum lengkap</h1><p>Isi URL Supabase dan publishable key untuk mengaktifkan login.</p></>
        : account === undefined ? <p>Memuat sesi…</p> : <>
          <h1>Masuk ke PocketPulse</h1>
          <form className="fields" onSubmit={signIn}>
            <label className="field"><span>Email</span><input type="email" name="email" autoComplete="username" required /></label>
            <label className="field"><span>Kata sandi</span><input type="password" name="password" autoComplete="current-password" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button primary" disabled={busy} type="submit">{busy ? 'Sedang masuk…' : 'Masuk'}</button>
          </form>
          {pwa.install && !pwa.installed && <button className="button secondary cloud-actions" onClick={() => {
            void pwa.install?.().catch(() => setInstallError(true))
          }}>Pasang PocketPulse</button>}
          {installError && <p className="muted cloud-actions" role="status">Buka menu browser untuk memasang PocketPulse.</p>}
        </>}
    </div>
  </main>
}
