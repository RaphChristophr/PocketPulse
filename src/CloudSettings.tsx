import { useState } from 'react'
import { Cloud, Download, LogOut } from 'lucide-react'
import { today } from './domain/finance.ts'
import { readCloudLedger, supabase, type CloudAccount } from './storage/cloud.ts'
import type { CloudSync } from './useCloudSync'
import { download } from './ui'

export function CloudSettings({ account, synchronization, notify }: {
  account: CloudAccount; synchronization: CloudSync; notify: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false)
  const { status, pending, lastSync, result, message, sync } = synchronization
  const inProgress = busy || status === 'working'
  async function exportCloud() {
    setBusy(true)
    try {
      const remote = await readCloudLedger(account.id)
      if (!remote) throw new Error('Tidak ada catatan cloud untuk diunduh.')
      download(`pocketpulse-cloud-${today()}.json`, JSON.stringify(remote.ledger, null, 2), 'application/json')
    } catch (error) { notify(error instanceof Error ? error.message : 'Cadangan cloud gagal diunduh.') }
    finally { setBusy(false) }
  }
  async function logout() {
    setBusy(true)
    try {
      const response = await supabase!.auth.signOut({ scope: 'local' })
      if (response.error) throw response.error
    } catch { notify('Gagal keluar. Coba lagi saat koneksi tersedia.') }
    finally { setBusy(false) }
  }
  return <section className="panel data-panel">
    <div className="panel-heading"><div><h2>Sinkronisasi Supabase</h2><p>{account.email}</p></div><Cloud className="panel-icon" size={19} /></div>
    <p className="muted">Perubahan disimpan di perangkat dahulu dan disinkronkan saat online.</p>
    <div className="sync-status" role="status">
      <strong>{status === 'working' ? 'Sedang menyinkronkan' : pending ? 'Perubahan belum tersinkron' : status === 'success' ? 'Tersinkron' : 'Siap menyinkronkan'}</strong>
      {lastSync && <p>{'Terakhir berhasil sinkron'} · {new Date(lastSync).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' })}</p>}
      {result && <p>{result.direction === 'pull' ? `${result.count} perubahan transaksi ditarik dari cloud`
        : result.direction === 'push' ? `${result.count} perubahan transaksi diunggah ke cloud` : 'Data perangkat dan cloud sama.'}</p>}
    </div>
    {status === 'error' && <p className="form-error" role="alert">{message}</p>}
    {status === 'conflict' && <p className="form-error" role="alert">Versi perangkat dan cloud berbeda. Unduh kedua backup sebelum memilih versi yang ingin dipulihkan.</p>}
    <div className="tool-buttons cloud-actions">
      <button className="button primary" disabled={inProgress} onClick={() => void sync(true)}>Sinkronkan</button>
      {status === 'conflict' && <button className="button secondary" disabled={inProgress} onClick={() => void exportCloud()}><Download size={16} /> Unduh versi cloud</button>}
      <button className="button secondary" disabled={inProgress} onClick={() => void logout()}><LogOut size={16} /> Keluar</button>
    </div>
  </section>
}
