import { useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Download, FileUp, Plus, Smartphone } from 'lucide-react'
import { accountTypes, addDays, addMonths, budgetRows, categoryContains, categoryLabel, csv, emptyLedger, periodEnd, periodStart, rangeLabel, rupiah, segmentFor, segments, spentBy, today, transactionNames, validateLedger, type Ledger, type Segment } from './domain/finance.ts'
import { TransactionRow } from './Dashboard'
import { type Commit, type Editor } from './Editors'
import { download, Empty, Glyph, Select } from './ui'
import { Tithe } from './Tithe'
import { titheCategory } from './domain/tithe.ts'
import { CloudSettings } from './CloudSettings'
import type { CloudAccount } from './storage/cloud.ts'

export function History({ data, filters, setFilters, edit }: {
  data: Ledger; filters: URLSearchParams; setFilters: (filters: URLSearchParams) => void; edit: (editor: Editor) => void;
}) {
  const account = filters.get('akun') ?? ''
  const category = filters.get('kategori') ?? ''
  const start = filters.get('dari') ?? ''
  const end = filters.get('sampai') ?? ''
  const segment = filters.get('bagian') as Segment | null
  const rows = [...data.transactions].filter(tx => {
    if ((start && tx.date < start) || (end && tx.date > end) || (segment && segmentFor(tx.date) !== segment)) return false
    if (filters.get('jenis') === 'expense' && tx.type !== 'expense') return false
    if (tx.type === 'transfer') return !category && (!account || tx.fromAccountId === account || tx.toAccountId === account)
    return (!category || categoryContains(data.categories, category, tx.categoryId)) && (!account || tx.accountId === account)
  }).sort((left, right) => right.date.localeCompare(left.date))
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(filters)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'dari' || key === 'sampai') next.delete('bagian')
    setFilters(next)
  }
  return <>
    <div className="page-title"><div><h1>Riwayat</h1><p>Periksa dan koreksi setiap transaksi.</p></div>
      <button className="button primary" onClick={() => edit({ kind: 'transaction' })}><Plus size={19} /> Catat transaksi</button></div>
    <section className="panel history-panel">
      <div className="filter-grid">
        <label className="field"><span>Dari</span><input type="date" value={start} onChange={event => change('dari', event.target.value)} /></label>
        <label className="field"><span>Sampai</span><input type="date" value={end} onChange={event => change('sampai', event.target.value)} /></label>
        <label className="field"><span>Sumber dana</span><Select value={account} onChange={event => change('akun', event.target.value)}><option value="">Semua akun</option>
          {data.accounts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
        <label className="field"><span>Kategori</span><Select value={category} onChange={event => change('kategori', event.target.value)}><option value="">Semua kategori</option>
          {data.categories.map(item => <option key={item.id} value={item.id}>{categoryLabel(data.categories, item)}</option>)}</Select></label>
      </div>
      {segment && <div className="filter-note"><span>{segments[segment]}</span><button className="text-button" onClick={() => change('bagian', '')}>Hapus filter bagian</button></div>}
      {rows.length ? rows.map(tx => <TransactionRow key={tx.id} tx={tx} data={data} onClick={() => edit({ kind: 'transaction', item: tx })} />)
        : <Empty>Tidak ada transaksi untuk filter ini.</Empty>}
    </section>
  </>
}

export function Budgets({ data, week, period, setWeek, setPeriod, mode, setMode, edit, save, notify, drillDown }: {
  data: Ledger; week: string; period: string; setWeek: (day: string) => void; setPeriod: (day: string) => void;
  mode: 'weekly' | 'monthly'; setMode: (mode: 'weekly' | 'monthly') => void; edit: (editor: Editor) => void;
  save: Commit; notify: (message: string) => void; drillDown: (category: string, start: string, end: string, section?: Segment) => void;
}) {
  const [copying, setCopying] = useState(false)
  const weekly = mode === 'weekly'
  const start = weekly ? week : period
  const end = weekly ? addDays(start, 6) : periodEnd(start)
  const previous = addDays(week, -7)
  const categories = data.categories.filter(item => item.type === 'expense' && !item.parentId && item.id !== titheCategory.id)
  const weekHasLimits = data.weeklyBudgets.some(row => row.weekStart === week)
  const lastWeekHasLimits = data.weeklyBudgets.some(row => row.weekStart === previous)
  async function copy() {
    setCopying(true)
    try {
      await save(current => {
        if (current.weeklyBudgets.some(row => row.weekStart === week)) throw new Error('Minggu ini sudah punya limit.')
        const source = current.weeklyBudgets.filter(row => row.weekStart === previous)
        if (!source.length) throw new Error('Minggu sebelumnya belum punya limit.')
        return { ...current, weeklyBudgets: [...current.weeklyBudgets, ...source.map(row => ({ ...row, weekStart: week }))] }
      })
      notify('Limit minggu sebelumnya tersalin')
    } catch (error) { notify(error instanceof Error ? error.message : 'Limit gagal disalin.') }
    finally { setCopying(false) }
  }
  const step = (count: number) => weekly ? setWeek(addDays(start, count * 7)) : setPeriod(addMonths(start, count))
  const blocks: Array<Segment | undefined> = weekly ? ['weekdays', 'saturday', 'sunday'] : [undefined]
  return <>
    <div className="page-title"><div><h1>Budget</h1><p>Atur jatah dan lihat pemakaian per kategori.</p></div></div>
    <div className="budget-tools">
      <div className="segmented"><button aria-pressed={weekly} onClick={() => setMode('weekly')}>Mingguan</button>
        <button aria-pressed={!weekly} onClick={() => setMode('monthly')}>Bulanan</button></div>
      <div className="date-control"><button className="icon-button" aria-label="Periode sebelumnya" onClick={() => step(-1)}><ChevronLeft size={18} /></button>
        <span><CalendarDays size={16} />{rangeLabel(start, end)}</span>
        <button className="icon-button" aria-label="Periode berikutnya" onClick={() => step(1)}><ChevronRight size={18} /></button></div>
      {weekly && !weekHasLimits && lastWeekHasLimits && <button className="button secondary" disabled={copying} onClick={() => void copy()}>Salin limit minggu lalu</button>}
    </div>
    <div className="budget-stack">{blocks.map(segment => {
      const rows = budgetRows(data, start, segment)
      const listed = categories.filter(item => rows.some(row => row.categoryId === item.id)
        || spentBy(data.transactions, item.id, start, end, segment, data.categories) > 0)
      return <section className="panel budget-panel" key={segment ?? 'monthly'}>
        <div className="panel-heading"><div><h2>{segment ? segments[segment] : 'Periode gajian'}</h2>
          <p>{segment ? 'Jatah per kategori' : rangeLabel(start, end)}</p></div>
          {rows.length < categories.length && <button className="button secondary" onClick={() => edit({ kind: 'budget', start, segment })}><Plus size={17} /> Atur limit</button>}</div>
        {listed.length ? listed.map(category => {
          const row = rows.find(item => item.categoryId === category.id)
          const spent = row?.spent ?? spentBy(data.transactions, category.id, start, end, segment, data.categories)
          const remaining = row ? row.limitIdr - spent : 0
          const detail = segment === 'weekdays' ? [start, addDays(start, 4)] : segment === 'saturday' ? [addDays(start, 5), addDays(start, 5)] : segment === 'sunday' ? [end, end] : [start, end]
          return <div className="budget-row" key={category.id}>
            <button className="budget-category" onClick={() => drillDown(category.id, detail[0], detail[1], segment)}><Glyph item={category} /><strong>{category.name}</strong></button>
            <div className="budget-row-value"><span>Jatah</span><strong>{row ? rupiah(row.limitIdr) : 'Belum diatur'}</strong></div>
            <div className="budget-row-value"><span>Terpakai</span><strong>{rupiah(spent)}</strong></div>
            <div className="budget-row-value"><span>Sisa</span><strong className={remaining < 0 ? 'danger-text' : ''}>{row ? remaining < 0 ? `Lewat ${rupiah(-remaining)}` : rupiah(remaining) : '—'}</strong></div>
            <button className="text-button" onClick={() => edit({ kind: 'budget', start, segment, categoryId: category.id, limit: row?.limitIdr })}>{row ? 'Edit' : 'Atur'}</button>
          </div>
        }) : <Empty>{categories.length ? 'Belum ada limit atau pengeluaran di bagian ini.' : 'Tambahkan kategori pengeluaran di Pengaturan.'}</Empty>}
      </section>
    })}{!weekly && <Tithe data={data} period={period} edit={edit} />}</div>
  </>
}

export function exportRecords(data: Ledger, kind: 'transactions' | 'weekly' | 'monthly') {
  const category = (id: string) => {
    const item = data.categories.find(row => row.id === id)
    return item ? categoryLabel(data.categories, item) : ''
  }
  const account = (id: string) => data.accounts.find(item => item.id === id)?.name ?? ''
  if (kind === 'transactions') {
    return csv([['Tanggal', 'Jenis', 'Kategori', 'Nominal IDR', 'Sumber dana', 'Tujuan transfer', 'Bagian minggu', 'Periode gajian', 'Catatan'],
      ...[...data.transactions].sort((left, right) => left.date.localeCompare(right.date)).map(tx =>
        [tx.date, transactionNames[tx.type], tx.type === 'transfer' ? '' : category(tx.categoryId), tx.amountIdr,
          account(tx.type === 'transfer' ? tx.fromAccountId : tx.accountId), tx.type === 'transfer' ? account(tx.toAccountId) : '',
          segments[segmentFor(tx.date)], periodStart(tx.date), tx.note])])
  }
  if (kind === 'weekly') return csv([['Awal minggu', 'Akhir minggu', 'Bagian', 'Kategori', 'Jatah IDR', 'Terpakai IDR', 'Sisa IDR'],
    ...data.weeklyBudgets.map(row => {
      const end = addDays(row.weekStart, 6)
      const spent = spentBy(data.transactions, row.categoryId, row.weekStart, end, row.segment, data.categories)
      return [row.weekStart, end, segments[row.segment], category(row.categoryId), row.limitIdr, spent, row.limitIdr - spent]
    })])
  return csv([['Awal periode', 'Akhir periode', 'Kategori', 'Jatah IDR', 'Terpakai IDR', 'Sisa IDR'], ...data.monthlyBudgets.map(row => {
    const end = periodEnd(row.periodStart)
    const spent = spentBy(data.transactions, row.categoryId, row.periodStart, end, undefined, data.categories)
    return [row.periodStart, end, category(row.categoryId), row.limitIdr, spent, row.limitIdr - spent]
  })])
}

export function Settings({ data, save, edit, notify, install, installed, account, storageKey }: {
  data: Ledger; save: Commit; edit: (editor: Editor) => void; notify: (message: string) => void;
  install: (() => void) | undefined; installed: boolean; account?: CloudAccount; storageKey: string;
}) {
  const upload = useRef<HTMLInputElement>(null)
  const [restoring, setRestoring] = useState(false)
  async function restore(file?: File) {
    if (!file) return
    setRestoring(true)
    try {
      const backup = validateLedger(JSON.parse(await file.text()))
      if (!window.confirm('Ganti catatan yang ada dengan isi backup ini?')) return
      await save(() => backup)
      notify('Backup berhasil dipulihkan')
    } catch (error) { notify(error instanceof Error ? error.message : 'Backup tidak dapat dibaca.') }
    finally { setRestoring(false) }
  }
  async function startPersonal() {
    if (!window.confirm('Ganti data contoh dengan ruang pencatatan kosong?')) return
    try {
      await save(() => emptyLedger())
      notify('Ruang pribadi siap. Tambahkan sumber dana pertamamu.')
    } catch (error) { notify(error instanceof Error ? error.message : 'Ruang pribadi gagal dibuat.') }
  }
  return <>
    <div className="page-title"><div><h1>Pengaturan</h1><p>Kelola tampilan akun, kategori, dan data PocketPulse.</p></div></div>
    {data.demo && <section className="demo-settings"><div><strong>Data contoh</strong><p>Coba alur PocketPulse atau mulai dengan catatan kosong.</p></div>
      <button className="button primary" onClick={() => void startPersonal()}>Mulai ruang pribadi</button></section>}
    <div className="settings-grid">
      {account && <CloudSettings account={account} keyName={storageKey} data={data} save={save} notify={notify} />}
      <section className="panel"><div className="panel-heading"><div><h2>Sumber dana</h2><p>Bank, bank digital, dan tunai</p></div>
        <button className="button secondary" onClick={() => edit({ kind: 'account' })}><Plus size={16} /> Tambah</button></div>
        {data.accounts.length ? data.accounts.map(item => <button key={item.id} className="manage-row" onClick={() => edit({ kind: 'account', item })}>
          <Glyph item={item} /><span><strong>{item.name}</strong><small>{accountTypes[item.type]}{item.isSavings ? ' · Tabungan' : ''}</small></span><span className="text-button">Edit</span>
        </button>) : <Empty>Belum ada sumber dana.</Empty>}
      </section>
      <section className="panel"><div className="panel-heading"><div><h2>Kategori</h2><p>Pengelompokan transaksi</p></div>
        <button className="button secondary" onClick={() => edit({ kind: 'category' })}><Plus size={16} /> Tambah</button></div>
        {data.categories.length ? data.categories.filter(item => item.id !== titheCategory.id).map(item => <button key={item.id} className="manage-row" onClick={() => edit({ kind: 'category', item })}>
          <Glyph item={item} /><span><strong>{categoryLabel(data.categories, item)}</strong><small>{transactionNames[item.type]}</small></span><span className="text-button">Edit</span>
        </button>) : <Empty>Belum ada kategori.</Empty>}
      </section>
      <section className="panel data-panel"><div className="panel-heading"><div><h2>Data dan backup</h2><p>Data tersimpan di perangkat ini.</p></div></div>
        <div className="tool-buttons">
          <button className="button secondary" onClick={() => download('pocketpulse-transaksi.csv', exportRecords(data, 'transactions'), 'text/csv;charset=utf-8')}><Download size={16} /> CSV transaksi</button>
          <button className="button secondary" onClick={() => download('pocketpulse-budget-mingguan.csv', exportRecords(data, 'weekly'), 'text/csv;charset=utf-8')}><Download size={16} /> CSV mingguan</button>
          <button className="button secondary" onClick={() => download('pocketpulse-budget-bulanan.csv', exportRecords(data, 'monthly'), 'text/csv;charset=utf-8')}><Download size={16} /> CSV bulanan</button>
          <button className="button secondary" onClick={() => download(`pocketpulse-backup-${today()}.json`, JSON.stringify(data, null, 2), 'application/json')}><Download size={16} /> Unduh backup</button>
          <button className="button secondary" disabled={restoring} onClick={() => upload.current?.click()}><FileUp size={16} /> Pulihkan backup</button>
          <input ref={upload} type="file" accept=".json,application/json" hidden onChange={event => {
            const file = event.target.files?.[0]
            event.target.value = ''
            void restore(file)
          }} />
        </div>
      </section>
      <section className="panel data-panel"><div className="panel-heading"><div><h2>Akses dari HP</h2><p>{installed ? 'PocketPulse berjalan sebagai aplikasi terpasang.' : 'Buka langsung dari layar utama.'}</p></div><Smartphone className="panel-icon" size={19} /></div>
        {!installed && (install ? <button className="button secondary" onClick={install}>Pasang PocketPulse</button>
          : <p className="muted">Di Chrome Android, pilih Tambahkan ke Layar Utama lalu Pasang aplikasi. Di Safari iPhone, gunakan Bagikan → Tambahkan ke Layar Utama, lalu aktifkan Buka sebagai App Web.</p>)}
      </section>
    </div>
  </>
}
