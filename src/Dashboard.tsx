import { useState } from 'react'
import { Activity, Bell, ChevronLeft, ChevronRight, Plus, Settings2 } from 'lucide-react'
import { getLocale, t } from './domain/language.ts'
import { addDays, addMonths, balanceSummary, budgetRows, categoryLabel, inRange, periodEnd, periodStart, rangeLabel, rupiah, segmentFor, segments, shortDate, spentBy, sum, transactionNames, weekStart, type Ledger, type Segment, type Transaction } from './domain/finance.ts'
import { spendingDays } from './domain/spending.ts'
import { Empty, Glyph } from './ui'
import { SpendingChart } from './SpendingChart'

export function TransactionRow({ tx, data, onClick }: { tx: Transaction; data: Ledger; onClick: () => void }) {
  const category = tx.type === 'transfer' ? undefined : data.categories.find(item => item.id === tx.categoryId)
  const name = (id: string) => data.accounts.find(account => account.id === id)?.name
  const account = tx.type === 'transfer' ? `${name(tx.fromAccountId)} → ${name(tx.toAccountId)}` : name(tx.accountId)
  const prefix = tx.type === 'expense' ? '−' : tx.type === 'income' ? '+' : ''
  return <button className="transaction-row" onClick={onClick}>
    <Glyph item={category} />
    <span className="item-main"><strong>{tx.note || (category ? categoryLabel(data.categories, category) : t(transactionNames[tx.type]))}</strong><small>{account}{tx.note && category?.parentId ? ` · ${categoryLabel(data.categories, category)}` : ''}</small></span>
    <span className="item-end"><strong className={tx.type === 'income' ? 'income-text' : ''}>{prefix}{rupiah(tx.amountIdr)}</strong><small>{shortDate(tx.date)}</small></span>
  </button>
}

type SpendingProps = {
  data: Ledger; day: string; period: string; setPeriod: (value: string) => void;
  drillDown: (category: string, start: string, end: string) => void;
}
const percent = (spent: number, limit: number) => limit > 0 ? Math.round(spent / limit * 100) : spent > 0 ? 100 : 0
const formatPercent = (value: number) => new Intl.NumberFormat(getLocale(), { style: 'percent' }).format(value / 100)

function PeriodControl({ period, setPeriod }: Pick<SpendingProps, 'period' | 'setPeriod'>) {
  return <div className="date-control spending-period">
    <button type="button" className="icon-button" aria-label={t("Periode sebelumnya")} onClick={() => setPeriod(addMonths(period, -1))}><ChevronLeft size={16} /></button>
    <span>{rangeLabel(period, periodEnd(period))}</span>
    <button type="button" className="icon-button" aria-label={t("Periode berikutnya")} onClick={() => setPeriod(addMonths(period, 1))}><ChevronRight size={16} /></button>
  </div>
}

function CategoryProgress({ value, color }: { value: number; color: string }) {
  return <span className="spending-progress" data-color={color} aria-hidden="true"><i style={{ inlineSize: `${Math.min(100, value)}%` }} /></span>
}

function spendingCategories(data: Ledger, start: string, end: string) {
  return data.categories.filter(category => category.type === 'expense' && !category.parentId)
    .map(category => ({ category, spent: spentBy(data.transactions, category.id, start, end, undefined, data.categories) }))
    .sort((left, right) => right.spent - left.spent)
}

export function Dashboard({ data, day, period, setPeriod, drillDown, openTransaction, initials, reminders }: SpendingProps & {
  openTransaction: (tx?: Transaction) => void; initials?: string; reminders: boolean;
}) {
  const end = periodEnd(period)
  const transactions = data.transactions.filter(tx => inRange(tx.date, period, end))
  const expenses = transactions.filter(tx => tx.type === 'expense')
  const spent = sum(expenses.map(tx => tx.amountIdr))
  const largest = expenses.reduce<Transaction | undefined>((max, tx) => !max || tx.amountIdr > max.amountIdr ? tx : max, undefined)
  const largestCategory = largest?.type === 'expense' ? data.categories.find(category => category.id === largest.categoryId) : undefined
  const points = spendingDays(data.transactions, period, day < end ? day : end).map(point =>
    ({ start: point.date, end: point.date, spent: point.spent }))
  const limits = budgetRows(data, period)
  const limit = sum(limits.map(row => row.limitIdr))
  const limitSpent = sum(limits.map(row => row.spent))
  const daysLeft = day >= period && day <= end ? spendingDays([], addDays(day, 1), end).length : null
  const categories = spendingCategories(data, period, end).flatMap(item => {
    const budget = limits.find(row => row.categoryId === item.category.id)
    return item.spent || budget ? [{ ...item, budget }] : []
  })
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const { sources, total, reserved, available } = balanceSummary(data)
  const week = weekStart(day)
  const segment = segmentFor(day)
  const todayRows = budgetRows(data, week, segment)
  const weeklyLimits = (Object.keys(segments) as Segment[]).flatMap(key => budgetRows(data, week, key))
  const currentLimits = budgetRows(data, periodStart(day))
  const remaining = (rows: typeof limits, id: string) => {
    const row = rows.find(item => item.categoryId === id)
    return row ? rupiah(row.limitIdr - row.spent) : t("Belum diatur")
  }
  const todayCategories = data.categories.filter(item => [...todayRows, ...currentLimits].some(row => row.categoryId === item.id))

  return <div className="spending-home">
    <section className="spending-hero" aria-labelledby="spending-home-title">
      <div className="hero-toolbar">
        <a className="hero-icon" href="#pengaturan" aria-label={t(data.demo ? "Data contoh" : "Ruang pribadi")}>
          {initials || <Activity size={20} />}{data.demo && <small className="hero-demo">Demo</small>}
        </a>
        <a className="hero-icon" href={reminders ? '#pengaturan?bagian=pengingat' : '#pengaturan'}
          aria-label={t(reminders ? "Pengingat harian" : "Pengaturan")}>{reminders ? <Bell size={20} /> : <Settings2 size={20} />}</a>
      </div>
      <h1 id="spending-home-title">{t("Saldo tersedia")}</h1>
      <p className="hero-amount">{rupiah(available)}</p>
      <div className="hero-metrics">
        <div><span>{t("Total saldo")}</span><strong>{rupiah(total)}</strong></div>
        <div><span>{t("Tabungan & dana darurat")}</span><strong>{rupiah(reserved)}</strong></div>
      </div>
      <button type="button" className="button desktop-compose" onClick={() => openTransaction()}><Plus size={18} />{t("Catat transaksi")}</button>
    </section>

    <div className="spending-home-body">
      <section className="panel home-trend">
        <div className="panel-heading"><h2>{t("Tren pengeluaran")}</h2><PeriodControl period={period} setPeriod={setPeriod} /></div>
        <div className="home-spending">
          <div><span>{t("Pengeluaran periode ini")}</span><strong>{rupiah(spent)}</strong></div>
          <p>{limits.length > 0 ? t("{percent} dari budget {amount}", { percent: formatPercent(percent(limitSpent, limit)), amount: rupiah(limit) }) : t("Budget belum diatur")}
            {daysLeft !== null && <> · {t("Sisa {count} hari", { count: daysLeft })}</>}</p>
        </div>
        {points.length ? <SpendingChart key={period} points={points} drillDown={drillDown} />
          : <Empty>{t("Belum ada pengeluaran di periode ini.")}</Empty>}
        <div className="balance-totals spending-figures">
          <div><span>{t("Rata-rata harian")}</span><strong>{rupiah(Math.round(spent / Math.max(points.length, 1)))}</strong></div>
          <div><span>{t("Transaksi")}</span><strong>{transactions.length}</strong></div>
          <div><span>{t("Terbesar")}</span><strong>{rupiah(largest?.amountIdr ?? 0)}</strong>
            {largest && <small>{largest.note || largestCategory?.name}</small>}</div>
        </div>
      </section>
      <section className="home-categories">
        <div className="panel-heading"><h2>{t("Kategori")}</h2><a className="text-button" href="#insight">{t("Lihat semua")}</a></div>
        {categories.length ? <div className="category-cards">{categories.map(({ category, spent, budget }) =>
          <button type="button" className="panel category-card" key={category.id} onClick={() => drillDown(category.id, period, end)}>
            <span>{category.name}</span><strong>{rupiah(spent)}</strong>
            {budget && <><CategoryProgress value={percent(spent, budget.limitIdr)} color={category.colorKey} />
              <small><span data-color={category.colorKey}>{formatPercent(percent(spent, budget.limitIdr))}</span> {t("dari {amount}", { amount: rupiah(budget.limitIdr) })}</small></>}
          </button>)}</div> : <Empty>{t("Belum ada pengeluaran di periode ini.")}</Empty>}
      </section>
      <section className="home-latest">
        <div className="panel-heading"><h2>{t("Transaksi terbaru")}</h2><a className="text-button" href="#riwayat">{t("Lihat semua")}</a></div>
        <div className="panel">{recent.length ? recent.map(tx => <TransactionRow key={tx.id} tx={tx} data={data} onClick={() => openTransaction(tx)} />)
          : <Empty>{t("Belum ada transaksi. Tambahkan transaksi pertamamu.")}</Empty>}</div>
      </section>
      <section className="panel home-balances">
        <div className="panel-heading"><h2>{t("Sumber dana")}</h2><a className="text-button" href="#pengaturan">{t("Kelola")}</a></div>
        <div className="balance-totals">
          <div><span>{t("Pemasukan")}</span><strong>{rupiah(sum(transactions.filter(tx => tx.type === 'income').map(tx => tx.amountIdr)))}</strong></div>
        </div>
        {sources.length ? <div className="account-list">{sources.map(account => <div className="account-row" key={account.id}>
          <Glyph item={account} size={16} /><span><strong>{account.name}</strong>{account.isSavings && <small>{t("Disisihkan")}</small>}</span><strong>{rupiah(account.balance)}</strong>
        </div>)}</div> : <Empty>{t("Belum ada sumber dana. Tambahkan akun dari Pengaturan.")}</Empty>}
      </section>
      <section className="panel home-remaining">
        <div className="panel-heading"><h2>{t("Sisa budget")}</h2><a className="text-button" href="#budget">{t("Lihat budget")}</a></div>
        <div className="balance-totals budget-totals">
          {([[t("Minggu ini"), weeklyLimits], [t("Periode gajian"), limits]] as const).map(([label, rows]) =>
            <div key={label}><span>{label}</span><strong>{rows.length
              ? rupiah(sum(rows.map(row => row.limitIdr - row.spent))) : t("Belum diatur")}</strong></div>)}
        </div>
        {todayCategories.length > 0 && <div className="today-budget">
          <div className="today-row"><strong>{t("Sisa jatah hari ini")}</strong><span>{t(segments[segment])}</span><span>{t("Periode gajian")}</span></div>
          {todayCategories.map(item => <div className="today-row" key={item.id}><span>{item.name}</span>
            <strong>{remaining(todayRows, item.id)}</strong><strong>{remaining(currentLimits, item.id)}</strong></div>)}
        </div>}
      </section>
    </div>
  </div>
}

const insightRanges = { week: 'Minggu ini', period: 'Periode gajian', quarter: '3 periode', year: '12 periode' } as const
type InsightRange = keyof typeof insightRanges

function insightPoints(data: Ledger, day: string, period: string, range: InsightRange) {
  const months = range === 'year' ? 12 : range === 'quarter' ? 3 : 1
  const start = range === 'week' ? weekStart(day) : addMonths(period, 1 - months)
  const end = range === 'week' ? addDays(start, 6) : periodEnd(period)
  const previousStart = range === 'week' ? addDays(start, -7) : addMonths(start, -months)
  const previousEnd = addDays(start, -1)
  const dates = spendingDays(data.transactions, start, day < end ? day : end)
  const previous = spendingDays(data.transactions, previousStart, previousEnd)
  if (months === 1) {
    const points = dates.map(({ date, spent }) => ({ start: date, end: date, spent }))
    return { start, end, points, comparison: points.map((_, index) => previous[index]?.spent ?? 0) }
  }
  const points = []
  const comparison = []
  for (let index = 0; index < months; index += 1) {
    const from = addMonths(start, index)
    const to = periodEnd(from)
    const days = dates.filter(item => inRange(item.date, from, to))
    if (!days.length) break
    const priorPeriod = addMonths(previousStart, index)
    const priorDays = previous.filter(item => inRange(item.date, priorPeriod, periodEnd(priorPeriod)))
    points.push({ start: from, end: days.at(-1)!.date, spent: sum(days.map(item => item.spent)) })
    comparison.push(sum((day < to ? priorDays.slice(0, days.length) : priorDays).map(item => item.spent)))
  }
  return { start, end, points, comparison }
}

export function Insight({ data, day, period, setPeriod, drillDown }: SpendingProps) {
  const [range, setRange] = useState<InsightRange>('period')
  const { start, end, points, comparison } = insightPoints(data, day, period, range)
  const total = sum(points.map(point => point.spent))
  const previous = sum(comparison)
  const change = previous > 0 ? Math.round((total - previous) / previous * 100) : null
  const categories = spendingCategories(data, start, day < end ? day : end).filter(item => item.spent > 0)
  const limits = budgetRows(data, period)
  return <div className="spending-insight">
    <div className="insight-title"><h1>Insight</h1><p>{t("Tren pengeluaran dan budget")}</p></div>
    <div className="segmented insight-ranges" role="group" aria-label={t("Periode pengeluaran")}>
      {Object.entries(insightRanges).map(([key, label]) =>
        <button key={key} type="button" aria-pressed={key === range} onClick={() => setRange(key as InsightRange)}>{t(label)}</button>)}
    </div>
    {range !== 'week' && <PeriodControl period={period} setPeriod={setPeriod} />}
    <section className="panel insight-trend">
      <h2 className="insight-total">{rupiah(total)}</h2>
      <div className="insight-range-label"><span>{rangeLabel(start, end)}</span>
        {change !== null && <span className="insight-change" data-increase={change > 0}
          title={t("Dibanding periode sebelumnya")}>{change > 0 ? '+' : ''}{formatPercent(change)} {t("vs sebelumnya")}</span>}</div>
      {points.length > 0 ? <SpendingChart key={`${range}:${start}`} points={points} comparison={previous > 0 ? comparison : undefined} drillDown={drillDown} />
        : <Empty>{t("Belum ada pengeluaran di periode ini.")}</Empty>}
    </section>
    <section className="panel insight-breakdown">
      <h2>{t("Rincian kategori")}</h2>
      {categories.length ? categories.map(({ category, spent }) =>
        <button className="insight-line" type="button" key={category.id} onClick={() => drillDown(category.id, start, end)}>
          <Glyph item={category} size={20} /><span>{category.name}</span>
          <CategoryProgress value={percent(spent, categories[0].spent)} color={category.colorKey} /><strong>{rupiah(spent)}</strong>
        </button>) : <Empty>{t("Belum ada pengeluaran di periode ini.")}</Empty>}
    </section>
    <section className="insight-goals">
      <div className="panel-heading"><div><h2>{t("Target budget")}</h2><p>{rangeLabel(period, periodEnd(period))}</p></div><a className="text-button" href="#budget">{t("Lihat budget")}</a></div>
      <div className="panel">{limits.length ? limits.map(row => {
        const category = data.categories.find(item => item.id === row.categoryId)
        if (!category) return null
        return <button className="insight-goal" type="button" key={row.categoryId} onClick={() => drillDown(row.categoryId, period, periodEnd(period))}>
          <Glyph item={category} size={20} /><span>{category.name}</span>
          <strong>{rupiah(row.spent)} <small>/ {rupiah(row.limitIdr)}</small></strong>
          <CategoryProgress value={percent(row.spent, row.limitIdr)} color={category.colorKey} />
        </button>
      }) : <Empty>{t("Budget belum diatur")}</Empty>}</div>
    </section>
  </div>
}
