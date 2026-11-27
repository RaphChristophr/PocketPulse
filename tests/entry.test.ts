import test from 'node:test'
import assert from 'node:assert/strict'
import { digitsFromAmount, groupedAmount } from '../src/domain/amount.ts'
import { budgetRows, validateLedger } from '../src/domain/finance.ts'
import { demoLedger } from '../src/domain/demo.ts'

test('formatted amounts retain whole Rupiah in both languages', () => {
  assert.equal(groupedAmount('25000', 'id'), '25.000')
  assert.equal(groupedAmount('25000', 'en'), '25,000')
  assert.equal(digitsFromAmount('25.000'), '25000')
  assert.equal(digitsFromAmount('25,000'), '25000')
  assert.equal(digitsFromAmount('-25.000', true), '-25000')
  assert.equal(digitsFromAmount('2a5'), null)
})

test('a subcategory rolls into the parent limit once and cannot form a cycle', () => {
  const data = demoLedger('2026-12-01')
  const category = data.categories.find(item => item.id === 'ojek')!
  data.categories.push({ ...category, id: 'go-ride', parentId: category.id })
  data.transactions = data.transactions.map(tx => tx.type === 'expense' && tx.categoryId === category.id ? { ...tx, categoryId: 'go-ride' } : tx)
  assert.equal(budgetRows(validateLedger(data), '2026-11-25').find(row => row.categoryId === category.id)?.spent, 20_000)
  category.parentId = 'go-ride'
  assert.throws(() => validateLedger(data), /induk/)
})
