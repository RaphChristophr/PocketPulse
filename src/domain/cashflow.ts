import { addDays, addMonths, periodEnd, periodStart, weekStart, type Transaction } from './finance.ts'

export const monthStart = (day: string) => `${day.slice(0, 7)}-01`
export const monthEnd = (start: string) => addDays(addMonths(start, 1), -1)

export const cashflowPeriods = {
  gajian: { label: 'Periode gajian', start: periodStart, end: periodEnd, shift: addMonths },
  minggu: { label: 'Minggu ini', start: weekStart, end: (start: string) => addDays(start, 6), shift: (start: string, steps: number) => addDays(start, steps * 7) },
  bulan: { label: 'Bulan kalender', start: monthStart, end: monthEnd, shift: addMonths },
} as const

export type CashflowPeriod = keyof typeof cashflowPeriods

export function cashflowTrend(transactions: Transaction[], anchor: string, period: CashflowPeriod) {
  const weekly = period === 'minggu'
  const points = Array.from({ length: 7 }, (_, index) => ({
    start: weekly ? addDays(anchor, index) : addMonths(anchor, index - 6), income: 0, expense: 0,
  }))
  const byStart = new Map(points.map(point => [point.start, point]))
  for (const tx of transactions) {
    if (tx.type === 'transfer') continue
    const point = byStart.get(weekly ? tx.date : cashflowPeriods[period].start(tx.date))
    if (point) point[tx.type] += tx.amountIdr
  }
  return points
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
