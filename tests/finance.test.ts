import test from 'node:test'
import assert from 'node:assert/strict'
import { addDays, balanceFor, balanceSummary, budgetRows, csv, monthlyLimitsToCopy, parseMoney, periodEnd, periodStart, segmentFor, validateLedger, weekStart, type Transaction } from '../src/domain/finance.ts'
import { demoLedger } from '../src/domain/demo.ts'

test('tanggal 25 membuka periode gajian baru, termasuk batas tahun dan Februari', () => {
  const expectations = [
    ['2026-11-24', '2026-10-25'], ['2026-11-25', '2026-11-25'],
    ['2026-12-24', '2026-11-25'], ['2026-12-25', '2026-12-25'],
    ['2027-01-01', '2026-12-25'], ['2028-02-29', '2028-02-25'],
  ]
  for (const [day, expected] of expectations) assert.equal(periodStart(day), expected)
  assert.equal(periodEnd('2026-12-25'), '2027-01-24')
  assert.equal(periodEnd('2028-02-25'), '2028-03-24')
  assert.equal(weekStart('2026-11-24'), weekStart('2026-11-25'))
  assert.deepEqual(['2026-12-04', '2026-12-05', '2026-12-06'].map(segmentFor), ['weekdays', 'saturday', 'sunday'])
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
})

test('transfer mengubah kedua saldo tanpa menambah pengeluaran atau budget', () => {
  const data = demoLedger('2026-12-01')
  const transfer = data.transactions.find(tx => tx.type === 'transfer')!
  const without = data.transactions.filter(tx => tx !== transfer)
  const bank = data.accounts.find(item => item.id === 'bank')!
  const cash = data.accounts.find(item => item.id === 'cash')!
  assert.equal(balanceFor(bank, data.transactions) - balanceFor(bank, without), -100_000)
  assert.equal(balanceFor(cash, data.transactions) - balanceFor(cash, without), 100_000)
  assert.deepEqual(budgetRows(data, '2026-11-25'), budgetRows({ ...data, transactions: without }, '2026-11-25'))
})

test('arsip kategori mempertahankan saldo dan laporan, salin limit mengisi kategori aktif yang kosong', () => {
  const data = demoLedger('2026-12-01')
  const archived = validateLedger({
    ...data,
    categories: data.categories.map(item => item.id === 'internet' ? { ...item, archived: true } : item),
    monthlyBudgets: [...data.monthlyBudgets, { periodStart: '2026-12-25', categoryId: 'makan', limitIdr: 0 }],
  })
  assert.deepEqual(balanceSummary(archived).available, balanceSummary(data).available)
  assert.deepEqual(budgetRows(archived, '2026-11-25'), budgetRows(data, '2026-11-25'))
  const copy = monthlyLimitsToCopy(archived, '2026-12-25')
  assert.deepEqual(copy, [
    { periodStart: '2026-12-25', categoryId: 'ojek', limitIdr: 400_000 },
    { periodStart: '2026-12-25', categoryId: 'belanja', limitIdr: 650_000 },
  ])
  assert.deepEqual(monthlyLimitsToCopy({ ...archived, monthlyBudgets: [...archived.monthlyBudgets, ...copy] }, '2026-12-25'), [])
  assert.throws(() => validateLedger({ ...archived, categories: [{ ...archived.categories[0], archived: 'true' }] }), /Kategori tidak valid/)
})

test('saldo tersedia mengecualikan tabungan dan dana darurat saat saldo dipindahkan', () => {
  const demo = demoLedger('2026-12-01')
  const ledger = validateLedger({
    ...demo,
    accounts: demo.accounts.map(account => account.id === 'second' ? { ...account, name: 'Dana Darurat', isSavings: true } : account),
  })
  const before = balanceSummary(ledger)
  assert.equal(before.reserved, 3_150_000)
  assert.equal(before.available, 5_360_000)
  const transfer: Transaction = {
    id: 'reserve-transfer', type: 'transfer', date: '2026-12-01', amountIdr: 100_000,
    fromAccountId: 'bank', toAccountId: 'second', note: '',
  }
  const after = balanceSummary({ ...ledger, transactions: [...ledger.transactions, transfer] })
  assert.equal(after.total, before.total)
  assert.equal(after.available, before.available - 100_000)
  assert.equal(after.reserved, before.reserved + 100_000)
})

test('pengeluaran memakai dua limit terpisah dan edit hari memindahkan pemakaian mingguan', () => {
  let data = demoLedger('2026-12-01')
  const tx = data.transactions.find(item => item.id === 'demo-3')!
  const monthlySpent = () => budgetRows(data, '2026-11-25').find(row => row.categoryId === 'ojek')?.spent
  const weekdaySpent = () => budgetRows(data, '2026-11-30', 'weekdays').find(row => row.categoryId === 'ojek')?.spent
  assert.equal(monthlySpent(), 20_000)
  assert.equal(weekdaySpent(), 20_000)
  data = { ...data, transactions: data.transactions.map(item => item === tx ? { ...item, date: '2026-12-05' } : item) }
  assert.equal(monthlySpent(), 20_000)
  assert.equal(weekdaySpent(), 0)
})

test('backup memvalidasi nominal, warna, referensi, serta limit dengan periode yang tepat', () => {
  const data = demoLedger('2026-12-01')
  assert.deepEqual(validateLedger(JSON.parse(JSON.stringify(data))), data)
  const transfer = data.transactions.find(tx => tx.type === 'transfer')!
  assert.throws(() => validateLedger({ ...data, transactions: [{ ...transfer, toAccountId: transfer.fromAccountId } as Transaction] }), /berbeda/)
  assert.throws(() => validateLedger({ ...data, accounts: [] }), /sumber dana/i)
  assert.throws(() => validateLedger({ ...data, accounts: [{ ...data.accounts[0], colorKey: 'unknown' }] }), /tidak valid/)
  assert.throws(() => validateLedger({ ...data, monthlyBudgets: [{ ...data.monthlyBudgets[0], periodStart: '2026-11-24' }] }), /25/)
})

test('Rupiah memakai bilangan utuh dan CSV menangani tanda kutip serta formula', () => {
  assert.equal(parseMoney('1.250.000'), 1_250_000)
  assert.throws(() => parseMoney('1,25'))
  assert.throws(() => parseMoney('9007199254740994'))
  assert.equal(csv([['makan, siang', 'catatan "a"', '=1+2', 1000]]), '\uFEFF"makan, siang","catatan ""a""","\'=1+2",1000')
})
