import { useState } from 'react'
import { addDays, periodEnd, rupiah, shortDate, weekStart, type Ledger } from './domain/finance.ts'
import { spendingDays } from './domain/spending.ts'

export function SpendingChart({ data, day, period, drillDown }: {
  data: Ledger; day: string; period: string; drillDown: (category: string, start: string, end: string) => void;
}) {
  const [mode, setMode] = useState<'week' | 'period'>('week')
  const [selected, setSelected] = useState('')
  const start = mode === 'week' ? weekStart(day) : period
  const values = spendingDays(data.transactions, start, mode === 'week' ? addDays(start, 6) : periodEnd(period))
  const active = values.find(item => item.date === selected) ?? values.find(item => item.date === day) ?? values[0]
  const max = Math.max(1, ...values.map(item => item.spent))
  return <section className="panel spending-chart">
    <div className="panel-heading"><div><h2>Pengeluaran per hari</h2><p>Ketuk batang untuk melihat nominal</p></div></div>
    <div className="segmented"><button aria-pressed={mode === 'week'} onClick={() => setMode('week')}>Minggu ini</button>
      <button aria-pressed={mode === 'period'} onClick={() => setMode('period')}>Periode gajian</button></div>
    <div className="chart-bars" aria-label="Grafik pengeluaran per hari">
      {values.map(({ date, spent }, index) => <button key={date} type="button" onClick={() => setSelected(date)}
        aria-label={`${shortDate(date)}: ${rupiah(spent)}`} aria-pressed={date === active.date}>
        <span style={{ blockSize: `${spent ? spent / max * 100 : 3}%` }} aria-hidden="true" />
        <small aria-hidden="true">{mode === 'week' || index % 5 === 0 ? date.slice(-2) : ''}</small>
      </button>)}
    </div>
    <div className="chart-detail"><span>{shortDate(active.date)} · <strong>{rupiah(active.spent)}</strong></span>
      <button className="text-button" onClick={() => drillDown('', active.date, active.date)}>Lihat pengeluaran</button></div>
  </section>
}
