import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { getLocale, t } from './domain/language.ts'
import { rangeLabel, rupiah, shortDate, sum, type Ledger } from './domain/finance.ts'
import { cashflowPeriods, cashflowTrend, paydayProgress, type CashflowPeriod } from './domain/cashflow.ts'
import { spendingCategories } from './domain/spending.ts'
import { Empty, Glyph } from './ui'
import './cashflow.css'

const monthIndex = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7))

const periodOptions = Object.keys(cashflowPeriods) as CashflowPeriod[]
const chartLabels = { gajian: 'Pengeluaran per periode gajian', minggu: 'Pengeluaran per hari', bulan: 'Pengeluaran per bulan' } as const

export function Cashflow({ data, day, filters, setPeriod, drillDown }: {
  data: Ledger; day: string; filters: URLSearchParams; setPeriod: (period: CashflowPeriod, date?: string) => void;
  drillDown: (category: string, start: string, end: string) => void;
}) {
  const [chartDay, setChartDay] = useState('')
  const legacyMonth = filters.get('bulan')
  const period = periodOptions.find(item => item === filters.get('periode')) ?? (legacyMonth ? 'bulan' : 'gajian')
  const weekly = period === 'minggu'
  const range = cashflowPeriods[period]
  const current = range.start(day)
  const requested = filters.get('tanggal') ?? (legacyMonth ? `${legacyMonth}-01` : '')
  const parsed = new Date(requested)
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested >= '0001-01-01'
    && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === requested
  const start = validDate ? range.start(requested) : current
  const selectedStart = start <= current ? start : current
  const end = range.end(selectedStart)
  const monthsBack = monthIndex(current) - monthIndex(selectedStart)
  const chartAnchor = weekly ? selectedStart : range.shift(current, -Math.floor(monthsBack / 7) * 7)
  const points = cashflowTrend(data.transactions, chartAnchor, period)
  const selectedPoint = points.find(item => item.start === (weekly ? chartDay : selectedStart))
    ?? points.find(item => item.start === day) ?? points[points.length - 1]
  const maximum = Math.max(1, ...points.map(item => item.expense))
  const income = weekly ? sum(points.map(item => item.income)) : selectedPoint.income
  const expense = weekly ? sum(points.map(item => item.expense)) : selectedPoint.expense
  const net = income - expense
  const payday = paydayProgress(day)
  const categories = spendingCategories(data, selectedStart, end).filter(item => item.spent > 0)
  const locale = getLocale()
  const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const tickFormat = new Intl.DateTimeFormat(locale, weekly ? { weekday: 'short', timeZone: 'UTC' } : { month: 'short', timeZone: 'UTC' })
  const percent = new Intl.NumberFormat(locale, { style: 'percent' })
  const periodLabel = (date: string) => period === 'bulan' ? monthFormat.format(new Date(date)) : rangeLabel(date, range.end(date))

  return <div className="cashflow">
    <section className="cashflow-overview" aria-labelledby="cashflow-heading">
      <header className="cashflow-header">
        <h1 id="cashflow-heading">Cashflow</h1>
        <div className="cashflow-period">
          <button className="icon-button" type="button" aria-label={t("Periode sebelumnya")} disabled={selectedStart <= '0001-01-01'}
            onClick={() => setPeriod(period, range.shift(selectedStart, -1))}><ChevronLeft size={18} /></button>
          <span>{periodLabel(selectedStart)}</span>
          <button className="icon-button" type="button" aria-label={t("Periode berikutnya")} disabled={selectedStart === current}
            onClick={() => setPeriod(period, range.shift(selectedStart, 1))}><ChevronRight size={18} /></button>
        </div>
        <div className="cashflow-ranges" role="group" aria-label={t("Periode pengeluaran")}>
          {periodOptions.map(item => <button type="button" key={item} aria-pressed={item === period}
            onClick={() => { setChartDay(''); setPeriod(item) }}>{t(cashflowPeriods[item].label)}</button>)}
        </div>
      </header>
      <div className="cashflow-net" aria-live="polite" aria-atomic="true">
        <span>{t("Arus kas bersih")}</span>
        <strong>{net > 0 ? '+' : ''}{rupiah(net)}</strong>
      </div>
      <div className="cashflow-totals">
        <div><ArrowDownLeft size={18} aria-hidden="true" /><span>{t("Pemasukan")}</span><strong>{rupiah(income)}</strong></div>
        <div className="cashflow-expenses"><ArrowUpRight size={18} aria-hidden="true" /><span>{t("Pengeluaran")}</span><strong>{rupiah(expense)}</strong></div>
      </div>
      <div className="cashflow-chart-heading">
        <h2 className="cashflow-chart-label" id="cashflow-chart-label">{t(chartLabels[period])}</h2>
        <strong>{rupiah(selectedPoint.expense)}</strong>
      </div>
      <div className="cashflow-chart" role="group" aria-labelledby="cashflow-chart-label" data-no-swipe>
        {points.map(item => <button type="button" key={item.start} aria-pressed={item === selectedPoint}
          aria-label={`${weekly ? shortDate(item.start, true) : periodLabel(item.start)}, ${rupiah(item.expense)}`}
          onClick={() => weekly ? setChartDay(item.start) : setPeriod(period, item.start)}>
          <span className="cashflow-bar" aria-hidden="true"><i style={{ height: `${item.expense / maximum * 100}%` }} /></span>
          <span className="cashflow-tick">{tickFormat.format(new Date(item.start))}</span>
        </button>)}
      </div>
      {weekly && <div className="cashflow-day-detail">
        <span>{shortDate(selectedPoint.start)}</span>
        <button className="text-button" type="button" onClick={() => drillDown('', selectedPoint.start, selectedPoint.start)}>{t("Lihat pengeluaran")}</button>
      </div>}
      <section className="cashflow-payday" aria-labelledby="cashflow-payday-heading">
        <div><h2 id="cashflow-payday-heading">To payday</h2><strong>{payday.daysLeft === 0
          ? t("Gajian hari ini") : payday.daysLeft === 1 ? t("1 hari lagi") : t("{days} hari lagi", { days: payday.daysLeft })}</strong></div>
        <div className="cashflow-payday-progress">
          <progress aria-label="To payday" value={payday.percent} max={100} />
          <span>{percent.format(payday.percent / 100)}</span>
        </div>
        <div><span>{t("Jadwal gajian")}</span><time dateTime={payday.payday}>{shortDate(payday.payday, true)}</time></div>
      </section>
    </section>
    <section aria-labelledby="cashflow-categories-heading">
      <div className="panel-heading cashflow-categories-heading">
        <h2 id="cashflow-categories-heading">{t("Pengeluaran per kategori")}</h2>
        <a className="text-button" href={`#riwayat?dari=${selectedStart}&sampai=${end}`}>{t("Lihat riwayat")}</a>
      </div>
      {categories.length ? <div className="cashflow-categories">
        {categories.map(({ category, spent }) => <button type="button" key={category.id}
          onClick={() => drillDown(category.id, selectedStart, end)}>
          <Glyph item={category} size={20} /><span>{percent.format(spent / expense)}</span>
          <strong>{category.name}</strong><b>{rupiah(spent)}</b>
        </button>)}
      </div> : <Empty>{t("Belum ada pengeluaran di periode ini.")}</Empty>}
    </section>
  </div>
}
