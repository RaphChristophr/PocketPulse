import test from 'node:test'
import assert from 'node:assert/strict'
import { balanceFor, validateLedger, type Transaction } from '../src/domain/finance.ts'
import { demoLedger } from '../src/domain/demo.ts'
import { titheAllocations, titheCategory } from '../src/domain/tithe.ts'
import { spendingDays } from '../src/domain/spending.ts'

test('Tithe allocation leaves balances alone, and linked payments reconcile', () => {
  const data = demoLedger('2026-12-01')
  const before = balanceFor(data.accounts[0], data.transactions)
  data.transactions = data.transactions.map(tx => tx.type === 'income' ? { ...tx, tithe: true } : tx)
  data.categories.push(titheCategory)
  assert.equal(balanceFor(data.accounts[0], validateLedger(data).transactions), before)
  const first = titheAllocations(data.transactions)[0]
  assert.equal(first.allocated, 325000)
  assert.equal(first.outstanding, 325000)
  const payment: Transaction = { id: 'payment', type: 'expense', accountId: data.accounts[0].id, categoryId: titheCategory.id,
    titheIncomeId: first.income.id, date: '2026-12-01', amountIdr: 200000, note: '' }
  data.transactions.push(payment)
  assert.equal(balanceFor(data.accounts[0], validateLedger(data).transactions), before - 200000)
  assert.equal(titheAllocations(data.transactions)[0].outstanding, 125000)
  payment.amountIdr = 325001
  assert.throws(() => validateLedger(data), /melebihi alokasi/)
})

test('daily chart respects pay period boundary and excludes transfers', () => {
  const data = demoLedger('2026-11-25')
  const rows = spendingDays(data.transactions, '2026-11-24', '2026-11-25')
  assert.deepEqual(rows, [
    { date: '2026-11-24', spent: 0 }, { date: '2026-11-25', spent: 475000 },
  ])
})
