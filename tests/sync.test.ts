import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyLedger } from '../src/domain/finance.ts'
import { demoLedger } from '../src/domain/demo.ts'
import { sameLedger, syncDirection } from '../src/domain/sync.ts'

const initial = { ...demoLedger('2026-12-01'), demo: false }
const baseline = { revision: 'A', ledger: initial }
const local = { ...initial, transactions: initial.transactions.slice(1) }
const remote = { revision: 'B', ledger: { ...initial, transactions: initial.transactions.slice(0, -1) } }

test('unggah pertama, tarik di perangkat baru, dan arah sinkronisasi setelah edit', () => {
  assert.equal(syncDirection(initial, undefined, undefined), 'push')
  assert.equal(syncDirection(emptyLedger(), undefined, baseline), 'pull')
  assert.equal(syncDirection(initial, baseline, remote), 'pull')
  assert.equal(syncDirection(local, baseline, baseline), 'push')
})

test('deteksi perubahan di kedua sisi serta cloud yang hilang', () => {
  assert.equal(syncDirection(local, baseline, remote), 'conflict')
  assert.equal(syncDirection(local, undefined, remote), 'conflict')
  assert.equal(syncDirection(local, baseline, undefined), 'conflict')
})

test('hasil retry dan susunan properti JSONB tidak memicu konflik semu', () => {
  const reversed = Object.fromEntries(Object.entries(local).reverse()) as typeof local
  assert.ok(sameLedger(local, reversed))
  assert.equal(syncDirection(local, baseline, { revision: 'C', ledger: reversed }), 'aligned')
})

test('sync status counts inserted, removed, and edited transactions', async () => {
  const { changedTransactions } = await import('../src/domain/sync.ts')
  const edited = { ...initial, transactions: initial.transactions.slice(1).map((item, index) => index === 0 ? { ...item, note: 'Edited' } : item) }
  assert.equal(changedTransactions(initial, edited), 2)
  assert.equal(changedTransactions(initial, initial), 0)
})
