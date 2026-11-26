import type { SyncBaseline } from '../domain/sync.ts'
import { validateLedger, type Ledger } from '../domain/finance.ts'

let connection: Promise<IDBDatabase> | undefined

function database() {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pocketpulse', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('ledger')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    }).catch(error => {
      connection = undefined
      throw error
    })
  }
  return connection
}

async function readValue<T>(key: string): Promise<T | undefined> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const request = db.transaction('ledger').objectStore('ledger').get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function readLedger(key = 'primary') { return readValue<Ledger>(key) }

export function readSyncBaseline(key: string) { return readValue<SyncBaseline>(`${key}:baseline`) }

export async function writeSyncBaseline(key: string, value: SyncBaseline) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('ledger', 'readwrite')
    transaction.objectStore('ledger').put(value, `${key}:baseline`)
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('Status sinkronisasi gagal disimpan.'))
  })
}

export async function updateLedger(initial: Ledger, change: (current: Ledger) => Ledger, key = 'primary'): Promise<Ledger> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('ledger', 'readwrite')
    const store = transaction.objectStore('ledger')
    const request = store.get(key)
    let next: Ledger
    let failure: unknown
    request.onsuccess = () => {
      try {
        next = validateLedger(change(request.result ?? initial))
        store.put(next, key)
      } catch (error) {
        failure = error
        transaction.abort()
      }
    }
    transaction.oncomplete = () => resolve(next)
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Data gagal disimpan.'))
  })
}
