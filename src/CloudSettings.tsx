import { useState } from 'react'
import { Cloud, Download, LogOut } from 'lucide-react'
import { today, type Ledger } from './domain/finance.ts'
import { sameLedger, syncDirection, type SyncBaseline } from './domain/sync.ts'
import { readCloudLedger, supabase, writeCloudLedger, type CloudAccount } from './storage/cloud.ts'
import { readLedger, readSyncBaseline, writeSyncBaseline } from './storage/ledger.ts'
import type { Commit } from './Editors'
import { download } from './ui'

export function CloudSettings({ account, keyName, data, save, notify }: {
  account: CloudAccount; keyName: string; data: Ledger; save: Commit; notify: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false)
  const [conflict, setConflict] = useState(false)
  async function sync() {
    setBusy(true)
    setConflict(false)
    try {
      const [stored, baseline, remote] = await Promise.all([
        readLedger(keyName), readSyncBaseline(keyName), readCloudLedger(account.id),
      ])
      const local = stored ?? data
      if (local.demo) throw new Error('Gunakan catatan pribadi sebelum menyinkronkan data.')
      const direction = syncDirection(local, baseline, remote)
      if (direction === 'conflict') {
        setConflict(true)
        return
      }
      let synchronized: SyncBaseline
      if (direction === 'push') {
        synchronized = await writeCloudLedger(account.id, local, remote?.revision)
      } else {
        synchronized = remote!
        if (direction === 'pull') {
          await save(latest => {
            if (!sameLedger(latest, local)) throw new Error('Catatan lokal baru berubah. Jalankan sinkronisasi lagi.')
            return synchronized.ledger
          })
        }
      }
      await writeSyncBaseline(keyName, synchronized)
      notify('Sinkronisasi selesai')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Sinkronisasi gagal.')
    } finally { setBusy(false) }
  }
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
      const result = await supabase!.auth.signOut({ scope: 'local' })
      if (result.error) throw result.error
    } catch { notify('Gagal keluar. Coba lagi saat koneksi tersedia.') }
    finally { setBusy(false) }
  }
  return <section className="panel data-panel">
    <div className="panel-heading"><div><h2>Sinkronisasi Supabase</h2><p>{account.email}</p></div><Cloud className="panel-icon" size={19} /></div>
    <p className="muted">Perubahan tersimpan di perangkat. Tekan Sinkronkan untuk memperbarui catatan cloud.</p>
    {conflict && <p className="form-error" role="alert">Versi perangkat dan cloud berbeda. Unduh kedua backup sebelum memilih versi yang ingin dipulihkan.</p>}
    <div className="tool-buttons cloud-actions">
      <button className="button primary" disabled={busy} onClick={() => void sync()}>{busy ? 'Memproses…' : 'Sinkronkan'}</button>
      {conflict && <button className="button secondary" disabled={busy} onClick={() => void exportCloud()}><Download size={16} /> Unduh versi cloud</button>}
      <button className="button secondary" disabled={busy} onClick={() => void logout()}><LogOut size={16} /> Keluar</button>
    </div>
  </section>
}
