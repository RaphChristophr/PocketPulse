import { addDays, emptyLedger, periodStart, weekStart, type Ledger } from './finance.ts'

export function demoLedger(day: string): Ledger {
  const month = periodStart(day)
  const week = weekStart(day)
  const previous = addDays(day, -1)
  const third = addDays(day, -2)
  const openingDate = addDays(day, -50)
  return {
    ...emptyLedger(), demo: true,
    accounts: [
      { id: 'bank', name: 'Bank Utama', type: 'bank', openingBalanceIdr: 1800000, openingDate, isSavings: false, iconKey: 'bank', colorKey: 'jade' },
      { id: 'save', name: 'Bank Tabungan', type: 'bank', openingBalanceIdr: 2800000, openingDate, isSavings: true, iconKey: 'piggy', colorKey: 'violet' },
      { id: 'digital', name: 'Bank Digital 1', type: 'digital_bank', openingBalanceIdr: 620000, openingDate, isSavings: false, iconKey: 'card', colorKey: 'blue' },
      { id: 'second', name: 'Bank Digital 2', type: 'digital_bank', openingBalanceIdr: 350000, openingDate, isSavings: false, iconKey: 'card', colorKey: 'orange' },
      { id: 'cash', name: 'Tunai', type: 'cash', openingBalanceIdr: 165000, openingDate, isSavings: false, iconKey: 'wallet', colorKey: 'rose' },
    ],
    categories: [
      { id: 'makan', name: 'Makan', type: 'expense', iconKey: 'meal', colorKey: 'orange' },
      { id: 'ojek', name: 'Ojek', type: 'expense', iconKey: 'bike', colorKey: 'jade' },
      { id: 'belanja', name: 'Belanja', type: 'expense', iconKey: 'bag', colorKey: 'violet' },
      { id: 'internet', name: 'Internet', type: 'expense', iconKey: 'zap', colorKey: 'blue' },
      { id: 'gaji', name: 'Gaji', type: 'income', iconKey: 'briefcase', colorKey: 'jade' },
    ],
    transactions: [
      { id: 'demo-1', date: month, type: 'income', accountId: 'bank', categoryId: 'gaji', amountIdr: 3250000, note: 'Gaji bulanan' },
      { id: 'demo-2', date: day, type: 'expense', accountId: 'digital', categoryId: 'makan', amountIdr: 65000, note: 'Makan siang' },
      { id: 'demo-3', date: day, type: 'expense', accountId: 'digital', categoryId: 'ojek', amountIdr: 20000, note: 'Ojek ke kantor' },
      { id: 'demo-4', date: previous < month ? month : previous, type: 'expense', accountId: 'bank', categoryId: 'belanja', amountIdr: 215000, note: 'Belanja kebutuhan' },
      { id: 'demo-5', date: third < month ? month : third, type: 'expense', accountId: 'bank', categoryId: 'internet', amountIdr: 175000, note: 'Tagihan internet' },
      { id: 'demo-6', date: day, type: 'transfer', fromAccountId: 'bank', toAccountId: 'cash', amountIdr: 100000, note: 'Tarik tunai' },
    ],
    monthlyBudgets: [
      { periodStart: month, categoryId: 'makan', limitIdr: 1000000 },
      { periodStart: month, categoryId: 'ojek', limitIdr: 400000 },
      { periodStart: month, categoryId: 'belanja', limitIdr: 650000 },
      { periodStart: month, categoryId: 'internet', limitIdr: 250000 },
    ],
    weeklyBudgets: [
      { weekStart: week, segment: 'weekdays', categoryId: 'makan', limitIdr: 350000 },
      { weekStart: week, segment: 'weekdays', categoryId: 'ojek', limitIdr: 125000 },
      { weekStart: week, segment: 'saturday', categoryId: 'makan', limitIdr: 95000 },
      { weekStart: week, segment: 'sunday', categoryId: 'makan', limitIdr: 85000 },
    ],
  }
}
