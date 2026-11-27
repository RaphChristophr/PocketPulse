import { addDays, addMonths, periodStart, type Transaction } from './finance.ts'

export const monthStart = (day: string) => `${day.slice(0, 7)}-01`
export const monthEnd = (start: string) => addDays(addMonths(start, 1), -1)

export function cashflowMonths(transactions: Transaction[], end: string) {
  const months = Array.from({ length: 7 }, (_, index) => ({
    start: addMonths(end, index - 6), income: 0, expense: 0,
  }))
  const byMonth = new Map(months.map(month => [month.start, month]))
  for (const tx of transactions) {
    if (tx.type === 'transfer') continue
    const month = byMonth.get(monthStart(tx.date))
    if (month) month[tx.type] += tx.amountIdr
  }
  return months
}

export function paydayProgress(day: string) {
  const from = periodStart(addDays(day, -1))
  const payday = addMonths(from, 1)
  const daysBetween = (start: string, end: string) =>
    Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000)
  const daysLeft = daysBetween(day, payday)
  const duration = daysBetween(from, payday)
  return { payday, daysLeft, percent: Math.round((1 - daysLeft / duration) * 100) }
}
