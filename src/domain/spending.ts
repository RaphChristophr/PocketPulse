import { addDays, inRange, spentBy, type Ledger, type Transaction } from './finance.ts'

export function spendingCategories(data: Ledger, start: string, end: string) {
  return data.categories.filter(category => category.type === 'expense' && !category.parentId)
    .map(category => ({ category, spent: spentBy(data.transactions, category.id, start, end, undefined, data.categories) }))
    .sort((left, right) => right.spent - left.spent)
}

export function spendingDays(transactions: Transaction[], start: string, end: string) {
  const totals = new Map<string, number>()
  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || !inRange(transaction.date, start, end)) continue
    totals.set(transaction.date, (totals.get(transaction.date) ?? 0) + transaction.amountIdr)
  }
  const days: Array<{ date: string; spent: number }> = []
  for (let date = start; date <= end; date = addDays(date, 1)) days.push({ date, spent: totals.get(date) ?? 0 })
  return days
}
