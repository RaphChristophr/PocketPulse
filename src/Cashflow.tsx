import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { getLocale, t } from './domain/language.ts'
import { addMonths, rupiah, shortDate, type Ledger } from './domain/finance.ts'
import { cashflowMonths, monthEnd, monthStart, paydayProgress } from './domain/cashflow.ts'
import { spendingCategories } from './domain/spending.ts'
import { Empty, Glyph } from './ui'
import './cashflow.css'

const monthIndex = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7))

export function Cashflow({ data, day, month, setMonth, drillDown }: {
  data: Ledger; day: string; month: string | null; setMonth: (value: string) => void;
  drillDown: (category: string, start: string, end: string) => void;
}) {
  const current = monthStart(day)
  const start = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && month >= '0001-01' && month <= current.slice(0, 7)
    ? `${month}-01` : current
  const end = monthEnd(start)
  const monthsBack = monthIndex(current) - monthIndex(start)
  const chartEnd = addMonths(current, -Math.floor(monthsBack / 7) * 7)
  const months = cashflowMonths(data.transactions, chartEnd)
  const selected = months.find(item => item.start === start) ?? months[months.length - 1]
  const maximum = Math.max(1, ...months.map(item => item.expense))
  const net = selected.income - selected.expense
  const payday = paydayProgress(day)
  const categories = spendingCategories(data, start, end).filter(item => item.spent > 0)
  const locale = getLocale()
  const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const tickFormat = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
  const percent = new Intl.NumberFormat(locale, { style: 'percent' })
  const monthLabel = monthFormat.format(new Date(start))

  return <div className="cashflow">
    <section className="cashflow-overview" aria-labelledby="cashflow-heading">
      <header className="cashflow-header">
        <h1 id="cashflow-heading">Cashflow</h1>
        <div className="cashflow-month">
          <button className="icon-button" type="button" aria-label={t("Bulan sebelumnya")} disabled={start <= '0001-01-01'}
            onClick={() => setMonth(addMonths(start, -1))}><ChevronLeft size={18} /></button>
          <span>{monthLabel}</span>
          <button className="icon-button" type="button" aria-label={t("Bulan berikutnya")} disabled={start === current}
            onClick={() => setMonth(addMonths(start, 1))}><ChevronRight size={18} /></button>
        </div>
      </header>
      <div className="cashflow-net" aria-live="polite" aria-atomic="true">
        <span>{t("Arus kas bersih")}</span>
        <strong>{net > 0 ? '+' : ''}{rupiah(net)}</strong>
      </div>
      <div className="cashflow-chart-heading">
        <h2 className="cashflow-chart-label" id="cashflow-chart-label">{t("Pengeluaran per bulan")}</h2>
        <strong>{rupiah(selected.expense)}</strong>
      </div>
      <div className="cashflow-chart" role="group" aria-labelledby="cashflow-chart-label">
        {months.map(item => <button type="button" key={item.start} aria-pressed={item.start === start}
          aria-label={`${monthFormat.format(new Date(item.start))}, ${rupiah(item.expense)}`}
          onClick={() => setMonth(item.start)}>
          <span className="cashflow-bar" aria-hidden="true"><i style={{ height: `${item.expense / maximum * 100}%` }} /></span>
          <span className="cashflow-tick">{tickFormat.format(new Date(item.start))}</span>
        </button>)}
      </div>
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
    <div className="cashflow-totals">
      <div><ArrowDownLeft size={18} aria-hidden="true" /><span>{t("Pemasukan")}</span><strong>{rupiah(selected.income)}</strong></div>
      <div><ArrowUpRight size={18} aria-hidden="true" /><span>{t("Pengeluaran")}</span><strong>{rupiah(selected.expense)}</strong></div>
    </div>
    <section aria-labelledby="cashflow-categories-heading">
      <div className="panel-heading cashflow-categories-heading">
        <h2 id="cashflow-categories-heading">{t("Pengeluaran per kategori")}</h2>
        <a className="text-button" href={`#riwayat?dari=${start}&sampai=${end}`}>{t("Lihat riwayat")}</a>
      </div>
      {categories.length ? <div className="cashflow-categories">
        {categories.map(({ category, spent }) => <button type="button" key={category.id}
          onClick={() => drillDown(category.id, start, end)}>
          <Glyph item={category} size={20} /><span>{percent.format(spent / selected.expense)}</span>
          <strong>{category.name}</strong><b>{rupiah(spent)}</b>
        </button>)}
      </div> : <Empty>{t("Belum ada pengeluaran di periode ini.")}</Empty>}
    </section>
  </div>
}
