import type { Category, Ledger, Transaction } from './finance.ts'

export const titheCategory: Category = { id: 'pocketpulse-tithe', name: 'Tithe', type: 'expense', iconKey: 'gift', colorKey: 'violet' }
export const titheAmount = (income: number) => Math.round(income / 10)
export const isTitheIncome = (tx: Transaction): tx is Extract<Transaction, { type: 'income' }> & { tithe: true } =>
  tx.type === 'income' && tx.tithe === true

export function titheAllocations(transactions: Ledger['transactions']) {
  const payments = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.titheIncomeId) continue
    const linked = payments.get(tx.titheIncomeId) ?? []
    linked.push(tx)
    payments.set(tx.titheIncomeId, linked)
  }
  return transactions.filter(isTitheIncome).map(income => {
    const linked = payments.get(income.id) ?? []
    const paid = linked.reduce((total, tx) => total + tx.amountIdr, 0)
    const allocated = titheAmount(income.amountIdr)
    return { income, payments: linked, allocated, paid, outstanding: allocated - paid }
  })
}
