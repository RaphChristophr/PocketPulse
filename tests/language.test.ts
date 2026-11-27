import test from 'node:test'
import assert from 'node:assert/strict'
import { getLanguage, setLanguage, t } from '../src/domain/language.ts'
import { rupiah, shortDate } from '../src/domain/finance.ts'

test('switches interface text and date/amount formatting without changing currency', () => {
  assert.equal(getLanguage(), 'id')
  assert.equal(t('Sinkronkan'), 'Sinkronkan')
  assert.equal(rupiah(25000), 'Rp25.000')
  try {
    setLanguage('en')
    assert.equal(t('Sinkronkan'), 'Sync now')
    assert.equal(rupiah(25000), 'Rp25,000')
    assert.match(shortDate('2026-08-25'), /Aug/)
    assert.equal(t('Sisa {amount}', { amount: 'Rp25,000' }), 'Rp25,000 left')
  } finally { setLanguage('id') }
})
