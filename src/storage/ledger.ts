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

export async function readLedger(): Promise<Ledger | undefined> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const request = db.transaction('ledger').objectStore('ledger').get('primary')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function updateLedger(initial: Ledger, change: (current: Ledger) => Ledger): Promise<Ledger> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('ledger', 'readwrite')
    const store = transaction.objectStore('ledger')
    const request = store.get('primary')
    let next: Ledger
    let failure: unknown
    request.onsuccess = () => {
      try {
        next = validateLedger(change(request.result ?? initial))
        store.put(next, 'primary')
      } catch (error) {
        failure = error
        transaction.abort()
      }
    }
    transaction.oncomplete = () => resolve(next)
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Data gagal disimpan.'))
  })
}
