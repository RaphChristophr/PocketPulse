import test from 'node:test'
import assert from 'node:assert/strict'
import { balanceFor, validateLedger, type Transaction } from '../src/domain/finance.ts'
import { demoLedger } from '../src/domain/demo.ts'
import { titheAllocations, titheCategory } from '../src/domain/tithe.ts'
import { spendingDays } from '../src/domain/spending.ts'
import { cashflowPeriods, cashflowTrend, monthEnd, paydayProgress } from '../src/domain/cashflow.ts'

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

test('Cashflow groups by calendar month across payday, leap day, and year boundaries', () => {
  const data = demoLedger('2024-02-29')
  const expense = data.transactions.find(tx => tx.type === 'expense')!
  data.transactions.push(
    { ...expense, id: 'december', date: '2023-12-31', amountIdr: 30_000 },
    { ...expense, id: 'before-payday', date: '2024-02-24', amountIdr: 10_000 },
    { ...expense, id: 'march', date: '2024-03-01', amountIdr: 20_000 },
  )
  assert.equal(monthEnd('2024-02-01'), '2024-02-29')
  assert.equal(monthEnd('2026-12-01'), '2026-12-31')
  assert.deepEqual(cashflowTrend(data.transactions, '2024-03-01', 'bulan').slice(-4), [
    { start: '2023-12-01', income: 0, expense: 30_000 },
    { start: '2024-01-01', income: 0, expense: 0 },
    { start: '2024-02-01', income: 3_250_000, expense: 485_000 },
    { start: '2024-03-01', income: 0, expense: 20_000 },
  ])
})

test('Cashflow separates payday periods and groups a Monday–Sunday week by day', () => {
  const data = demoLedger('2026-12-01')
  const expense = data.transactions.find(tx => tx.type === 'expense')!
  data.transactions.push(
    { ...expense, id: 'cutoff', date: '2026-11-24', amountIdr: 10_000 },
    { ...expense, id: 'last-day', date: '2026-12-24', amountIdr: 20_000 },
    { ...expense, id: 'new-payday', date: '2026-12-25', amountIdr: 30_000 },
  )
  assert.equal(cashflowPeriods.gajian.end('2026-11-25'), '2026-12-24')
  assert.deepEqual(cashflowTrend(data.transactions, '2026-12-25', 'gajian').slice(-3), [
    { start: '2026-10-25', income: 0, expense: 10_000 },
    { start: '2026-11-25', income: 3_250_000, expense: 495_000 },
    { start: '2026-12-25', income: 0, expense: 30_000 },
  ])
  const weekly = cashflowPeriods.minggu
  const start = weekly.start('2026-12-01')
  assert.equal(start, '2026-11-30')
  assert.equal(weekly.end(start), '2026-12-06')
  assert.deepEqual(cashflowTrend(data.transactions, start, 'minggu').slice(0, 2), [
    { start: '2026-11-30', income: 0, expense: 215_000 },
    { start: '2026-12-01', income: 0, expense: 85_000 },
  ])
})

test('To payday reaches 100% on the 25th and starts the next cycle the following day', () => {
  assert.deepEqual(paydayProgress('2026-12-24'), { payday: '2026-12-25', daysLeft: 1, percent: 97 })
  assert.deepEqual(paydayProgress('2026-12-25'), { payday: '2026-12-25', daysLeft: 0, percent: 100 })
  assert.deepEqual(paydayProgress('2026-12-26'), { payday: '2027-01-25', daysLeft: 30, percent: 3 })
  assert.deepEqual(paydayProgress('2024-02-29'), { payday: '2024-03-25', daysLeft: 25, percent: 14 })
})
