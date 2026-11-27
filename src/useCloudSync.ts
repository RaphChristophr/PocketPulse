import { t } from './domain/language.ts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Commit } from './Editors'
import { emptyLedger, type Ledger, type Transaction } from './domain/finance.ts'
import { changedTransactions, hasSyncedTransaction, sameLedger, syncDirection } from './domain/sync.ts'
import { readCloudLedger, writeCloudLedger } from './storage/cloud.ts'
import { readLedger, readSyncBaseline, writeSyncBaseline } from './storage/ledger.ts'

type SyncStatus = 'idle' | 'working' | 'success' | 'conflict' | 'error'
type Result = { direction: 'push' | 'pull' | 'aligned'; count: number }

export function useCloudSync({ ownerId, storageKey, data, save, online, paused }: {
  ownerId?: string; storageKey: string; data: Ledger | null; save: Commit; online: boolean; paused: boolean;
}) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState('')
  const [baseline, setBaseline] = useState<Ledger>()
  const [lastSync, setLastSync] = useState<number>()
  const [result, setResult] = useState<Result>()
  const [rerun, setRerun] = useState(0)
  const running = useRef(false)
  const followUp = useRef(false)
  const blocked = useRef(false)
  const current = useRef({ data, paused, save })
  current.current = { data, paused, save }

  useEffect(() => {
    if (!ownerId) return
    let alive = true
    void readSyncBaseline(storageKey).then(item => {
      if (alive && item) {
        setBaseline(item.ledger)
        setLastSync(item.syncedAt)
      }
    }).catch(() => {})
    return () => { alive = false }
  }, [ownerId, storageKey])

  const sync = useCallback(async (manual = false) => {
    if (!ownerId || !current.current.data || current.current.paused || (!manual && blocked.current)) return
    if (running.current) {
      followUp.current = true
      return
    }
    if (!navigator.onLine) {
      if (manual) {
        setMessage(t("Perangkat sedang offline. Catatan tersimpan di perangkat ini."))
        setStatus('error')
      }
      return
    }
    running.current = true
    setStatus('working')
    setMessage('')
    try {
      const [stored, prior, remote] = await Promise.all([
        readLedger(storageKey), readSyncBaseline(storageKey), readCloudLedger(ownerId),
      ])
      const local = stored ?? current.current.data
      if (!local || local.demo) throw new Error(t("Gunakan catatan pribadi sebelum menyinkronkan data."))
      if (!prior && !remote && sameLedger(local, emptyLedger())) {
        setStatus('idle')
        return
      }
      const direction = syncDirection(local, prior, remote)
      if (direction === 'conflict') {
        blocked.current = true
        setStatus('conflict')
        return
      }
      if (current.current.paused) { setStatus('idle'); return }
      const syncedAt = Date.now()
      const synchronized = direction === 'push' ? await writeCloudLedger(ownerId, local, remote?.revision) : remote!
      if (direction === 'pull') {
        await current.current.save(latest => {
          if (current.current.paused || !sameLedger(latest, local)) throw new Error(t("Catatan lokal baru berubah. Jalankan sinkronisasi lagi."))
          return synchronized.ledger
        })
      }
      await writeSyncBaseline(storageKey, { ...synchronized, syncedAt })
      blocked.current = false
      setBaseline(synchronized.ledger)
      setLastSync(syncedAt)
      if (direction !== 'aligned' || manual) setResult({ direction,
        count: direction === 'pull' ? changedTransactions(local, synchronized.ledger) : direction === 'push'
          ? changedTransactions(remote?.ledger ?? emptyLedger(), local) : 0,
      })
      setStatus('success')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("Sinkronisasi gagal."))
      setStatus('error')
    } finally {
      running.current = false
      if (followUp.current) {
        followUp.current = false
        setRerun(value => value + 1)
      }
    }
  }, [ownerId, storageKey])

  useEffect(() => {
    if (!ownerId || !data || !online || paused) return
    const timer = window.setTimeout(() => { void sync() }, 800)
    return () => clearTimeout(timer)
  }, [ownerId, data, online, paused, rerun, sync])

  const pending = Boolean(data && !sameLedger(data, baseline ?? emptyLedger()))
  return { sync, pending, lastSync, status, result, message,
    isTransactionSynced: (transaction: Transaction) => hasSyncedTransaction(baseline, transaction),
  }
}

export type CloudSync = ReturnType<typeof useCloudSync>
