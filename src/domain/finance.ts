import { getLocale, t } from './language.ts'
import { isTitheIncome, titheAllocations, titheAmount, titheCategory } from './tithe.ts'

export const accountTypes = { bank: 'Bank', digital_bank: 'Bank digital', cash: 'Tunai' } as const
export const colors = { jade: 'Hijau', orange: 'Jingga', blue: 'Biru', violet: 'Ungu', rose: 'Merah muda', slate: 'Abu-abu', red: 'Merah', yellow: 'Kuning', teal: 'Toska', brown: 'Cokelat' } as const
export const icons = {
  bank: 'Bank', wallet: 'Dompet', card: 'Kartu', piggy: 'Tabungan',
  meal: 'Makan', bag: 'Belanja', coffee: 'Kopi', house: 'Rumah', briefcase: 'Pekerjaan', zap: 'Tagihan', gift: 'Hadiah',
  bike: 'Transportasi', train: 'Kereta', car: 'Mobil', bus: 'Bus', taxi: 'Taksi',
  plane: 'Pesawat', ship: 'Kapal', fuel: 'Bahan bakar', parking: 'Parkir',
  cart: 'Belanja bahan pokok', health: 'Kesehatan', education: 'Pendidikan', wifi: 'Internet',
  pet: 'Hewan peliharaan', clothing: 'Pakaian', fitness: 'Olahraga', film: 'Film',
} as const
export const segments = { weekdays: 'Senin–Jumat', saturday: 'Sabtu', sunday: 'Minggu' } as const
export const transactionNames = { expense: 'Pengeluaran', income: 'Pemasukan', transfer: 'Transfer' } as const
type Appearance = { iconKey: keyof typeof icons; colorKey: keyof typeof colors }
export type Account = Appearance & { id: string; name: string; type: keyof typeof accountTypes; openingBalanceIdr: number; openingDate: string; isSavings: boolean }
export type Category = Appearance & { id: string; name: string; type: 'income' | 'expense'; parentId?: string; archived?: boolean }
type TransactionBase = { id: string; date: string; amountIdr: number; note: string }
export type Transaction = TransactionBase & (
  { type: 'income'; accountId: string; categoryId: string; tithe?: boolean } |
  { type: 'expense'; accountId: string; categoryId: string; titheIncomeId?: string } |
  { type: 'transfer'; fromAccountId: string; toAccountId: string }
)
export type Segment = keyof typeof segments
export type MonthlyBudget = { periodStart: string; categoryId: string; limitIdr: number }
export type WeeklyBudget = { weekStart: string; segment: Segment; categoryId: string; limitIdr: number }
export type Favorite = { accountId: string; categoryId: string }
export type Ledger = { schemaVersion: 1; demo: boolean; accounts: Account[]; categories: Category[]; transactions: Transaction[]; monthlyBudgets: MonthlyBudget[]; weeklyBudgets: WeeklyBudget[]; favorites?: Favorite[] }
export const emptyLedger = (): Ledger => ({
  schemaVersion: 1, demo: false, accounts: [], categories: [], transactions: [], monthlyBudgets: [], weeklyBudgets: [],
})

export const rupiah = (amount: number) =>
  `${amount < 0 ? '-' : ''}Rp${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(Math.abs(amount))}`
const dateParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' })
export function today() {
  const parts = Object.fromEntries(dateParts.formatToParts(new Date()).map(({ type, value }) => [type, value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
const toDate = (day: string) => new Date(`${day}T00:00:00Z`)
const toISO = (day: Date) => day.toISOString().slice(0, 10)
export function addDays(day: string, count: number) {
  const value = toDate(day)
  value.setUTCDate(value.getUTCDate() + count)
  return toISO(value)
}
export function addMonths(day: string, count: number) {
  const value = toDate(day)
  value.setUTCMonth(value.getUTCMonth() + count)
  return toISO(value)
}
export const shortDate = (day: string, year = false) => new Intl.DateTimeFormat(getLocale(), {
  timeZone: 'UTC', day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}),
}).format(toDate(day))
export function rangeLabel(start: string, end: string) {
  return `${shortDate(start, start.slice(0, 4) !== end.slice(0, 4))} – ${shortDate(end, true)}`
}
export function weekStart(day: string) {
  return addDays(day, -((toDate(day).getUTCDay() + 6) % 7))
}
export function segmentFor(day: string): Segment {
  const weekday = toDate(day).getUTCDay()
  if (weekday === 0) return 'sunday'
  return weekday === 6 ? 'saturday' : 'weekdays'
}
export function periodStart(day: string) {
  const current = `${day.slice(0, 7)}-25`
  return day < current ? addMonths(current, -1) : current
}
export const periodEnd = (start: string) => addDays(addMonths(start, 1), -1)
export const inRange = (day: string, start: string, end: string) => day >= start && day <= end
export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export function balanceFor(account: Account, transactions: Transaction[]) {
  return transactions.reduce((balance, tx) => {
    if (tx.type === 'transfer') {
      if (tx.fromAccountId === account.id) return balance - tx.amountIdr
      if (tx.toAccountId === account.id) return balance + tx.amountIdr
      return balance
    }
    if (tx.accountId !== account.id) return balance
    return balance + (tx.type === 'expense' ? -tx.amountIdr : tx.amountIdr)
  }, account.openingBalanceIdr)
}

export function balanceSummary({ accounts, transactions }: Pick<Ledger, 'accounts' | 'transactions'>) {
  const sources = accounts.map(account => ({ ...account, balance: balanceFor(account, transactions) }))
  const reserved = sum(sources.filter(account => account.isSavings).map(account => account.balance))
  const available = sum(sources.filter(account => !account.isSavings).map(account => account.balance))
  return { sources, total: available + reserved, reserved, available }
}

export const categoryContains = (categories: Category[], parent: string, actual: string) =>
  parent === actual || categories.some(category => category.id === actual && category.parentId === parent)

export const categoryLabel = (categories: Category[], category: Category) => {
  const parent = categories.find(item => item.id === category.parentId)
  return parent ? `${parent.name} / ${category.name}` : category.name
}

export const spentBy = (transactions: Transaction[], categoryId: string, start: string, end: string, segment?: Segment, categories: Category[] = []) =>
  sum(transactions.filter(tx => tx.type === 'expense' && categoryContains(categories, categoryId, tx.categoryId) && inRange(tx.date, start, end)
    && (!segment || segmentFor(tx.date) === segment)).map(tx => tx.amountIdr))

export function budgetRows(data: Ledger, start: string, segment?: Segment): Array<{ categoryId: string; limitIdr: number; spent: number }> {
  return segment
    ? data.weeklyBudgets.filter(row => row.weekStart === start && row.segment === segment)
      .map(row => ({ ...row, spent: spentBy(data.transactions, row.categoryId, start, addDays(start, 6), segment, data.categories) }))
    : data.monthlyBudgets.filter(row => row.periodStart === start)
      .map(row => ({ ...row, spent: spentBy(data.transactions, row.categoryId, start, periodEnd(start), undefined, data.categories) }))
}

export function monthlyLimitsToCopy(data: Ledger, start: string): MonthlyBudget[] {
  const previous = addMonths(start, -1)
  const configured = new Set(data.monthlyBudgets.filter(row => row.periodStart === start).map(row => row.categoryId))
  const active = new Set(data.categories.filter(category => !category.archived).map(category => category.id))
  return data.monthlyBudgets
    .filter(row => row.periodStart === previous && active.has(row.categoryId) && !configured.has(row.categoryId))
    .map(row => ({ ...row, periodStart: start }))
}

const keyOf = <T extends object>(catalog: T, value: unknown): value is keyof T =>
  typeof value === 'string' && Object.hasOwn(catalog, value)
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const validDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = toDate(value)
  return !Number.isNaN(date.valueOf()) && toISO(date) === value
}
export function parseMoney(text: string, minimum = 0) {
  const raw = text.trim()
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(raw)) throw new Error(t("Masukkan nominal dalam Rupiah utuh."))
  const amount = Number(raw.replaceAll('.', ''))
  if (!Number.isSafeInteger(amount) || amount < minimum) throw new Error(t("Nominal di luar batas yang diperbolehkan."))
  return amount
}
function requireValid(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
function unique(keys: string[]) { return new Set(keys).size === keys.length }
export function validateLedger(input: unknown): Ledger {
  const data = input as Ledger
  requireValid(data && data.schemaVersion === 1 && typeof data.demo === 'boolean', t("Format backup PocketPulse tidak dikenali."))
  for (const list of [data.accounts, data.categories, data.transactions, data.monthlyBudgets, data.weeklyBudgets]) {
    requireValid(Array.isArray(list) && list.every(item => item && typeof item === 'object'), t("Isi catatan tidak lengkap."))
  }
  requireValid(unique(data.accounts.map(item => item.id)) && unique(data.categories.map(item => item.id))
    && unique(data.transactions.map(item => item.id)), t("Terdapat ID catatan ganda."))
  const accounts = new Map(data.accounts.map(item => [item.id, item]))
  const categories = new Map(data.categories.map(item => [item.id, item]))
  for (const account of data.accounts) {
    requireValid(isText(account.id) && isText(account.name) && keyOf(accountTypes, account.type)
      && Number.isSafeInteger(account.openingBalanceIdr) && validDate(account.openingDate)
      && typeof account.isSavings === 'boolean' && keyOf(icons, account.iconKey) && keyOf(colors, account.colorKey),
    t("Sumber dana tidak valid."))
  }
  for (const category of data.categories) {
    requireValid(isText(category.id) && isText(category.name) && (category.type === 'income' || category.type === 'expense')
      && keyOf(icons, category.iconKey) && keyOf(colors, category.colorKey)
      && (category.archived === undefined || typeof category.archived === 'boolean'), t("Kategori tidak valid."))
  }
  for (const category of data.categories) {
    if (category.parentId === undefined) continue
    const parent = categories.get(category.parentId)
    requireValid(category.type === 'expense' && parent?.type === 'expense' && parent.id !== category.id && !parent.parentId,
      t("Pilih kategori induk pengeluaran yang valid."))
  }
  if (data.favorites !== undefined) {
    requireValid(Array.isArray(data.favorites) && data.favorites.every(item => item && accounts.has(item.accountId)
      && categories.get(item.categoryId)?.type === 'expense'), t("Favorit transaksi tidak valid."))
    requireValid(unique(data.favorites.map(item => JSON.stringify([item.accountId, item.categoryId]))), t("Terdapat favorit ganda."))
  }
  const transactions = new Map(data.transactions.map(item => [item.id, item]))
  for (const tx of data.transactions) {
    requireValid(isText(tx.id) && validDate(tx.date) && typeof tx.note === 'string'
      && Number.isSafeInteger(tx.amountIdr) && tx.amountIdr > 0, t("Tanggal atau nominal transaksi tidak valid."))
    if (tx.type === 'transfer') {
      requireValid(tx.fromAccountId !== tx.toAccountId, t("Akun asal dan tujuan harus berbeda."))
      const from = accounts.get(tx.fromAccountId)
      const to = accounts.get(tx.toAccountId)
      requireValid(from && to && tx.date >= from.openingDate && tx.date >= to.openingDate,
        t("Pilih dua sumber dana dan tanggal setelah atau pada tanggal saldo awal."))
    } else {
      const account = accounts.get(tx.accountId)
      requireValid((tx.type === 'income' || tx.type === 'expense') && categories.get(tx.categoryId)?.type === tx.type,
        t("Pilih kategori yang sesuai jenis transaksi."))
      requireValid(account && tx.date >= account.openingDate, t("Pilih sumber dana dan tanggal setelah atau pada tanggal saldo awal."))
      if (tx.type === 'income') {
        requireValid(tx.tithe === undefined || typeof tx.tithe === 'boolean', t("Pilihan Tithe tidak valid."))
        if (tx.tithe) requireValid(titheAmount(tx.amountIdr) > 0, t("Pemasukan terlalu kecil untuk alokasi Tithe."))
      }
      if (tx.type === 'expense' && (tx.titheIncomeId !== undefined || tx.categoryId === titheCategory.id)) {
        const income = tx.titheIncomeId ? transactions.get(tx.titheIncomeId) : undefined
        requireValid(income && isTitheIncome(income) && tx.categoryId === titheCategory.id && tx.date >= income.date,
          t("Pembayaran Tithe harus merujuk alokasi dan tanggal pemasukan yang valid."))
      }
    }
  }
  requireValid(titheAllocations(data.transactions).every(row => row.outstanding >= 0), t("Pembayaran Tithe melebihi alokasi."))
  for (const row of data.monthlyBudgets) {
    requireValid(validDate(row.periodStart) && row.periodStart.endsWith('-25'), t("Awal periode harus tanggal 25."))
  }
  for (const row of data.weeklyBudgets) {
    requireValid(validDate(row.weekStart) && weekStart(row.weekStart) === row.weekStart && keyOf(segments, row.segment),
      t("Periode budget mingguan tidak valid."))
  }
  for (const row of [...data.weeklyBudgets, ...data.monthlyBudgets]) {
    requireValid(Number.isSafeInteger(row.limitIdr) && row.limitIdr >= 0
      && categories.get(row.categoryId)?.type === 'expense' && !categories.get(row.categoryId)?.parentId && row.categoryId !== titheCategory.id, t("Limit budget atau kategori tidak valid."))
  }
  requireValid(unique(data.monthlyBudgets.map(row => JSON.stringify([row.periodStart, row.categoryId])))
    && unique(data.weeklyBudgets.map(row => JSON.stringify([row.weekStart, row.segment, row.categoryId]))), t("Terdapat limit ganda."))
  const absoluteBaseline = sum(data.accounts.map(account => Math.abs(account.openingBalanceIdr)))
  requireValid(Number.isSafeInteger(absoluteBaseline + sum(data.transactions.map(tx => tx.amountIdr))),
    t("Total nominal melebihi batas perhitungan yang aman."))
  return data
}

export function csv(rows: Array<Array<string | number>>) {
  return '\uFEFF' + rows.map(row => row.map(value => {
    if (typeof value === 'number') return String(value)
    const safe = /^[\s]*[=+\-@]|^[\t\r\n]/.test(value) ? "'" + value : value
    return '"' + safe.replaceAll('"', '""') + '"'
  }).join(',')).join('\r\n')
}
