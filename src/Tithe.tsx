import { useState } from 'react'
import { inRange, periodEnd, rupiah, shortDate, sum, type Ledger } from './domain/finance.ts'
import { titheAllocations } from './domain/tithe.ts'
import { Empty } from './ui'
import type { Editor } from './Editors'

export function Tithe({ data, period, edit }: { data: Ledger; period: string; edit: (editor: Editor) => void }) {
  const [allHistory, setAllHistory] = useState(false)
  const rows = titheAllocations(data.transactions)
  const current = rows.filter(row => inRange(row.income.date, period, periodEnd(period)))
  const summary = [
    ['Dialokasikan periode ini', sum(current.map(row => row.allocated))],
    ['Sudah dibayar dari alokasi periode ini', sum(current.map(row => row.paid))],
    ['Belum dibayar (semua periode)', sum(rows.map(row => row.outstanding))],
  ] as const
  const history = (allHistory ? rows : rows.filter(row => row.outstanding > 0 || current.includes(row)))
    .sort((left, right) => right.income.date.localeCompare(left.income.date))
  return <section className="panel">
    <div className="panel-heading"><div><h2>Tithe / Persepuluhan</h2><p>Alokasi dari pemasukan dan riwayat pembayaran</p></div>
      <button className="text-button" aria-pressed={allHistory} onClick={() => setAllHistory(!allHistory)}>{allHistory ? 'Ringkas riwayat' : 'Semua riwayat'}</button></div>
    <div className="tithe-summary">{summary.map(([label, value]) => <div key={label}><small>{label}</small><strong>{rupiah(value)}</strong></div>)}</div>
    {history.length ? history.map(row => {
      const source = data.categories.find(category => category.id === row.income.categoryId)
      return <div className="tithe-row" key={row.income.id}>
        <div className="panel-heading"><div><h3>{row.income.note || source?.name || 'Pemasukan'}</h3>
          <p>{shortDate(row.income.date, true)} · {rupiah(row.income.amountIdr)}</p></div>
          {row.outstanding > 0 && <button className="button secondary" onClick={() => edit({ kind: 'transaction', titheIncomeId: row.income.id })}>Catat pembayaran</button>}</div>
        <p>{row.outstanding === 0 ? 'Lunas' : row.paid ? 'Dibayar sebagian' : 'Belum dibayar'}</p>
        <p className="muted">{rupiah(row.allocated)} alokasi · {rupiah(row.outstanding)} belum dibayar</p>
        {row.payments.map(payment => <button key={payment.id} className="text-button tithe-payment" onClick={() => edit({ kind: 'transaction', item: payment })}>
          {shortDate(payment.date, true)} · {rupiah(payment.amountIdr)}{payment.note ? ` · ${payment.note}` : ''}
        </button>)}
      </div>
    }) : <Empty>Centang Sisihkan Tithe (10%) saat mencatat pemasukan untuk membuat alokasi.</Empty>}
  </section>
}
