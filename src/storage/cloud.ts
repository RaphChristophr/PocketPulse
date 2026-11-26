import { createClient } from '@supabase/supabase-js'
import { validateLedger, type Ledger } from '../domain/finance.ts'
import type { SyncBaseline } from '../domain/sync.ts'

const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const cloudMisconfigured = Boolean(projectUrl || publishableKey)
  && (!projectUrl || !publishableKey || !/^https?:\/\//i.test(projectUrl))

export const supabase = projectUrl && publishableKey && !cloudMisconfigured
  ? createClient(projectUrl, publishableKey)
  : null

export type CloudAccount = { id: string; email: string }

function ledgerTable() {
  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.')
  return supabase.from('pocketpulse_ledgers')
}

export async function readCloudLedger(ownerId: string): Promise<SyncBaseline | undefined> {
  const { data, error } = await ledgerTable().select('revision,snapshot').eq('user_id', ownerId)
    .abortSignal(AbortSignal.timeout(12000)).maybeSingle()
  if (error) throw new Error('Data Supabase gagal dibaca. Coba lagi saat koneksi tersedia.')
  if (!data) return undefined
  return { revision: data.revision, ledger: validateLedger(data.snapshot) }
}

export async function writeCloudLedger(ownerId: string, ledger: Ledger, priorRevision?: string): Promise<SyncBaseline> {
  const revision = crypto.randomUUID()
  const values = { revision, snapshot: ledger }
  const request = priorRevision
    ? ledgerTable().update(values).eq('user_id', ownerId).eq('revision', priorRevision)
    : ledgerTable().insert({ ...values, user_id: ownerId })
  const { data, error } = await request.select('revision').abortSignal(AbortSignal.timeout(12000)).maybeSingle()
  if (error && error.code !== '23505') throw new Error('Data Supabase gagal disimpan. Perubahan masih ada di perangkat ini.')
  if (!data || error) throw new Error('Versi cloud berubah. Jalankan sinkronisasi lagi.')
  return { revision, ledger }
}
