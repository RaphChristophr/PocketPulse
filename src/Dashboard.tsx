import { t } from './domain/language.ts'
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, PiggyBank, Plus, Wallet } from 'lucide-react'
import { addMonths, balanceFor, budgetRows, categoryLabel, inRange, periodEnd, periodStart, rangeLabel, rupiah, segmentFor, segments, shortDate, spentBy, sum, transactionNames, weekStart, type Ledger, type Segment, type Transaction } from './domain/finance.ts'
import { Empty, Glyph } from './ui.tsx'
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

export function Dashboard({ data, day, period, setPeriod, openTransaction, navigate, drillDown }: {
  data: Ledger; day: string; period: string; setPeriod: (value: string) => void;
  openTransaction: (tx?: Transaction) => void; navigate: (path: string) => void;
  drillDown: (category: string, dateStart: string, dateEnd: string, segment?: Segment) => void;
}) {
  const end = periodEnd(period)
  const current = data.transactions.filter(tx => inRange(tx.date, period, end))
  const expenses = sum(current.filter(tx => tx.type === 'expense').map(tx => tx.amountIdr))
  const income = sum(current.filter(tx => tx.type === 'income').map(tx => tx.amountIdr))
  const sources = data.accounts.map(account => ({ ...account, balance: balanceFor(account, data.transactions) }))
  const total = sum(sources.map(account => account.balance))
  const savings = sum(sources.filter(account => account.isSavings).map(account => account.balance))
  const categoryTotals = data.categories.filter(category => !category.parentId).map(category => ({ category, value: spentBy(data.transactions, category.id, period, end, undefined, data.categories) }))
    .filter(item => item.value > 0).sort((a, b) => b.value - a.value)
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const week = weekStart(day)
  const weekly = Object.keys(segments).flatMap(segment => budgetRows(data, week, segment as Segment))
  const monthly = budgetRows(data, period)
  const weekLimit = sum(weekly.map(item => item.limitIdr))
  const monthLimit = sum(monthly.map(item => item.limitIdr))
  const weekSpent = sum(weekly.map(item => item.spent))
  const monthSpent = sum(monthly.map(item => item.spent))
  const todaySegment = segmentFor(day)
  const todayRows = budgetRows(data, week, todaySegment)
  const activePeriodRows = budgetRows(data, periodStart(day))
  const todayCategories = data.categories.filter(item => todayRows.some(row => row.categoryId === item.id)
    || activePeriodRows.some(row => row.categoryId === item.id))
  const remaining = (row: { limitIdr: number; spent: number } | undefined) => row ? rupiah(row.limitIdr - row.spent) : t("Belum diatur")
  return <>
    <div className="page-title"><div><h1>{t("Ringkasan")}</h1><p>{t("Saldo, pengeluaran, dan sisa budget kamu.")}</p></div>
      <button className="button primary page-action" onClick={() => openTransaction()}><Plus size={19} /> {t("Catat transaksi")}</button>
    </div>
    <div className="period-toolbar">
      <div className="date-control">
        <button aria-label={t("Periode sebelumnya")} className="icon-button" onClick={() => setPeriod(addMonths(period, -1))}><ChevronLeft size={18} /></button>
        <span><CalendarDays size={16} />{rangeLabel(period, end)}</span>
        <button aria-label={t("Periode berikutnya")} className="icon-button" onClick={() => setPeriod(addMonths(period, 1))}><ChevronRight size={18} /></button>
      </div>
      <span className="period-caption">{t("Periode gajian")}</span>
    </div>
    <div className="dashboard-grid">
      <section className="balance-panel" aria-labelledby="balance-heading">
        <div className="balance-art" aria-hidden="true"><i /><i /><i /><i /></div>
        <h2 id="balance-heading">{t("Total saldo")}</h2>
        <p className="balance-number">{rupiah(total)}</p>
        <p className="savings-line"><PiggyBank size={16} /> {t("Termasuk tabungan")} {rupiah(savings)}</p>
        <div className="balance-metrics">
          <div><span className="metric-icon"><ArrowDownLeft size={17} /></span><div><span>{t("Pemasukan")}</span><strong>{rupiah(income)}</strong></div></div>
          <div><span className="metric-icon outgoing"><ArrowUpRight size={17} /></span><div><span>{t("Pengeluaran")}</span><strong>{rupiah(expenses)}</strong></div></div>
        </div>
      </section>
      <section className="panel accounts-panel">
        <div className="panel-heading"><div><h2>{t("Sumber dana")}</h2><p>{t("Saldo di setiap akun")}</p></div><button className="text-button" onClick={() => navigate('pengaturan')}>{t("Kelola")}</button></div>
        {sources.length ? <div className="account-list">{sources.map(account => <div className="account-row" key={account.id}>
          <Glyph item={account} size={16} /><span><strong>{account.name}</strong>{account.isSavings && <small>{t("Tabungan")}</small>}</span><strong>{rupiah(account.balance)}</strong>
        </div>)}</div> : <Empty>{t("Belum ada sumber dana. Tambahkan akun dari Pengaturan.")}</Empty>}
      </section>
      <section className="panel budget-overview">
        <div className="panel-heading"><div><h2>{t("Sisa budget")}</h2><p>{t("Jatah yang sudah kamu atur")}</p></div><button className="text-button" onClick={() => navigate('budget')}>{t("Lihat budget")}</button></div>
        <div className="budget-summaries">
          <BudgetSummary label={t("Minggu ini")} spent={weekSpent} limit={weekLimit} hasBudget={weekly.length > 0} />
          <BudgetSummary label={t("Periode gajian")} spent={monthSpent} limit={monthLimit} hasBudget={monthly.length > 0} />
        </div>
        {todayCategories.length > 0 && <div className="today-budget">
          <div className="today-row"><strong>{t("Sisa jatah hari ini")}</strong><span>{t(segments[todaySegment])}</span><span>{t("Periode gajian")}</span></div>
          {todayCategories.map(item => <div className="today-row" key={item.id}><span>{item.name}</span>
            <strong>{remaining(todayRows.find(row => row.categoryId === item.id))}</strong>
            <strong>{remaining(activePeriodRows.find(row => row.categoryId === item.id))}</strong></div>)}
        </div>}
      </section>
      <section className="panel top-expenses">
        <div className="panel-heading"><div><h2>{t("Pengeluaran terbesar")}</h2><p>{t("Per kategori di periode ini")}</p></div></div>
        {categoryTotals.length ? <div className="rank-list">{categoryTotals.slice(0, 4).map(({ category, value }) =>
          <button className="rank-row" key={category.id} onClick={() => drillDown(category.id, period, end)}>
            <Glyph item={category} size={16} />
            <span className="rank-info"><span>{category.name}</span><span className="rank-bar" data-color={category.colorKey}><i style={{ inlineSize: `${(value / expenses) * 100}%` }} /></span></span>
            <strong>{rupiah(value)}</strong>
          </button>
        )}</div> : <Empty>{t("Belum ada pengeluaran di periode ini.")}</Empty>}
      </section>
      <section className="panel recent-panel">
        <div className="panel-heading"><div><h2>{t("Transaksi terbaru")}</h2><p>{t("Riwayat pencatatan terakhir")}</p></div><button className="text-button" onClick={() => navigate('riwayat')}>{t("Lihat riwayat")}</button></div>
        {recent.length ? recent.map(tx => <TransactionRow key={tx.id} tx={tx} data={data} onClick={() => openTransaction(tx)} />)
          : <Empty>{t("Belum ada transaksi. Tambahkan transaksi pertamamu.")}</Empty>}
      </section>
      <SpendingChart data={data} day={day} period={period} drillDown={drillDown} />
    </div>
  </>
}

function BudgetSummary({ label, spent, limit, hasBudget }: { label: string; spent: number; limit: number; hasBudget: boolean }) {
  const percent = limit ? Math.min(spent / limit * 100, 100) : spent ? 100 : 0
  return <div className="budget-summary"><div className="budget-summary-title"><Wallet aria-hidden="true" size={16} />{label}</div>
    <strong className={spent > limit ? 'danger-text' : ''}>{hasBudget ? (spent > limit ? t("Lewat {amount}", { amount: rupiah(spent - limit) }) : rupiah(limit - spent)) : t("Belum diatur")}</strong>
    {hasBudget && <><div className="progress" aria-hidden="true"><i className={spent > limit ? 'over' : ''} style={{ inlineSize: `${percent}%` }} /></div>
      <small>{rupiah(spent)} {t("terpakai dari")} {rupiah(limit)}</small></>}
  </div>
}
