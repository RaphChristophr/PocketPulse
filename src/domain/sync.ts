import { emptyLedger, type Ledger, type Transaction } from './finance.ts'

export type SyncBaseline = { revision: string; ledger: Ledger; syncedAt?: number }

function sorted(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)))
  }
  return value
}

export function sameLedger(left: Ledger, right: Ledger) {
  return JSON.stringify(left, sorted) === JSON.stringify(right, sorted)
}

export function hasSyncedTransaction(baseline: Ledger | undefined, transaction: Transaction) {
  const stored = baseline?.transactions.find(item => item.id === transaction.id)
  return stored !== undefined && JSON.stringify(stored, sorted) === JSON.stringify(transaction, sorted)
}

export function syncDirection(local: Ledger, baseline: SyncBaseline | undefined, remote: SyncBaseline | undefined) {
  if (remote && sameLedger(local, remote.ledger)) return 'aligned'
  if (!remote) return baseline ? 'conflict' : 'push'
  if (!baseline) return sameLedger(local, emptyLedger()) ? 'pull' : 'conflict'
  if (sameLedger(local, baseline.ledger)) return 'pull'
  return remote.revision === baseline.revision ? 'push' : 'conflict'
}


export function changedTransactions(before: Ledger, after: Ledger) {
  const previous = new Map(before.transactions.map(tx => [tx.id, JSON.stringify(tx, sorted)]))
  let changes = 0
  for (const tx of after.transactions) {
    if (previous.get(tx.id) !== JSON.stringify(tx, sorted)) changes += 1
    previous.delete(tx.id)
  }
  return changes + previous.size
}
