import { emptyLedger, type Ledger } from './finance.ts'

export type SyncBaseline = { revision: string; ledger: Ledger }

function sorted(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)))
  }
  return value
}

export function sameLedger(left: Ledger, right: Ledger) {
  return JSON.stringify(left, sorted) === JSON.stringify(right, sorted)
}

export function syncDirection(local: Ledger, baseline: SyncBaseline | undefined, remote: SyncBaseline | undefined) {
  if (remote && sameLedger(local, remote.ledger)) return 'aligned'
  if (!remote) return baseline ? 'conflict' : 'push'
  if (!baseline) return sameLedger(local, emptyLedger()) ? 'pull' : 'conflict'
  if (sameLedger(local, baseline.ledger)) return 'pull'
  return remote.revision === baseline.revision ? 'push' : 'conflict'
}
