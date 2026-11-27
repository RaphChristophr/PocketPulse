import { getLanguage, setLanguage, t } from './domain/language.ts'
import { useId, useRef, useState, type ReactNode } from 'react'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Download, FileUp, ListFilter, Plus, Smartphone, X } from 'lucide-react'
import { accountTypes, addDays, addMonths, budgetRows, categoryContains, categoryLabel, csv, emptyLedger, monthlyLimitsToCopy, periodEnd, periodStart, rangeLabel, rupiah, segmentFor, segments, spentBy, today, transactionNames, validateLedger, type Ledger, type Segment } from './domain/finance.ts'
import { TransactionRow } from './Dashboard'
import { type Commit, type Editor } from './Editors'
import { download, Empty, Glyph, Select } from './ui'
import { Tithe } from './Tithe'
import { titheCategory } from './domain/tithe.ts'
import { ReminderSettings } from './ReminderSettings'
import { CloudSettings } from './CloudSettings'
import type { CloudAccount } from './storage/cloud.ts'
import type { CloudSync } from './useCloudSync'

type FilterOption = { id: string; name: string; icon: ReactNode; detail?: string }

function HistoryPicker({ label, placeholder, value, options, onChange }: {
  label: string; placeholder: string; value: string; options: FilterOption[]; onChange: (value: string) => void;
}) {
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const allOption: FilterOption = { id: '', name: placeholder, icon: <span className="history-picker-icon"><ListFilter size={18} aria-hidden="true" /></span> }
  const selected = options.find(option => option.id === value) ?? allOption
  function show() {
    dialog.current?.showModal()
    setOpen(true)
    dialog.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus()
  }
  return <div className="field">
    <span>{label}</span>
    <button ref={trigger} type="button" className="history-picker-trigger" aria-label={`${label}: ${selected.name}`}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={show}>
      {selected.icon}<span>{selected.name}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    <dialog ref={dialog} id={id} className="dialog history-picker" aria-labelledby={`${id}-title`} data-no-swipe
      onClose={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }) }}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <div className="history-picker-body">
        <div className="dialog-heading">
          <h2 id={`${id}-title`}>{label}</h2>
          <button type="button" className="icon-button" onClick={() => dialog.current?.close()} aria-label={t("Tutup")}><X size={19} aria-hidden="true" /></button>
        </div>
        <div className="history-picker-list">
          {[allOption, ...options].map(option => <button key={option.id} type="button" aria-pressed={selected.id === option.id} onClick={() => {
            onChange(option.id)
            dialog.current?.close()
          }}>
            {option.icon}
            <span><strong>{option.name}</strong>{option.detail && <small>{option.detail}</small>}</span>
            {selected.id === option.id && <Check size={18} aria-hidden="true" />}
          </button>)}
        </div>
      </div>
    </dialog>
  </div>
}

const historyKinds = [
  { id: 'expense', Icon: ArrowUpRight, color: 'rose' },
  { id: 'income', Icon: ArrowDownLeft, color: 'jade' },
  { id: 'transfer', Icon: ArrowLeftRight, color: 'slate' },
] as const

export function History({ data, filters, setFilters, edit }: {
  data: Ledger; filters: URLSearchParams; setFilters: (filters: URLSearchParams) => void; edit: (editor: Editor) => void;
}) {
  const account = filters.get('akun') ?? ''
  const category = filters.get('kategori') ?? ''
  const start = filters.get('dari') ?? ''
  const end = filters.get('sampai') ?? ''
  const segment = filters.get('bagian') as Segment | null
  const kind = filters.get('jenis') ?? ''
  const hasKind = Object.hasOwn(transactionNames, kind)
  const query = filters.get('cari') ?? ''
  const search = query.trim().toLocaleLowerCase()
  const rows = [...data.transactions].filter(tx => {
    if ((start && tx.date < start) || (end && tx.date > end) || (segment && segmentFor(tx.date) !== segment)) return false
    if (hasKind && tx.type !== kind) return false
    if (search && !tx.note.toLocaleLowerCase().includes(search)) return false
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
    <div className="page-title"><div><h1>{t("Riwayat")}</h1><p>{t("Periksa dan koreksi setiap transaksi.")}</p></div>
      <button className="button primary" onClick={() => edit({ kind: 'transaction' })}><Plus size={19} /> {t("Catat transaksi")}</button></div>
    <section className="panel history-panel">
      <label className="field history-search"><span>{t("Cari catatan transaksi")}</span><input type="search" value={query}
        onChange={event => change('cari', event.target.value)} /></label>
      <div className="filter-grid">
        <label className="field"><span>{t("Dari")}</span><input type="date" value={start} onChange={event => change('dari', event.target.value)} /></label>
        <label className="field"><span>{t("Sampai")}</span><input type="date" value={end} onChange={event => change('sampai', event.target.value)} /></label>
        <HistoryPicker label={t("Sumber dana")} placeholder={t("Semua akun")} value={account} onChange={value => change('akun', value)}
          options={data.accounts.map(item => ({ id: item.id, name: item.name, detail: t(accountTypes[item.type]), icon: <Glyph item={item} /> }))} />
        <HistoryPicker label={t("Kategori")} placeholder={t("Semua kategori")} value={category} onChange={value => change('kategori', value)}
          options={data.categories.map(item => ({ id: item.id, name: categoryLabel(data.categories, item),
            detail: t(item.archived ? "Diarsipkan" : transactionNames[item.type]), icon: <Glyph item={item} /> }))} />
        <HistoryPicker label={t("Jenis")} placeholder={t("Semua jenis")} value={kind} onChange={value => change('jenis', value)}
          options={historyKinds.map(({ id, Icon, color }) => ({ id, name: t(transactionNames[id]),
            icon: <span className="glyph" data-color={color}><Icon size={18} aria-hidden="true" /></span> }))} />
      </div>
      {(query || start || end || account || category || kind || segment) && <div className="filter-note">
        {segment && <><span>{t(segments[segment])}</span><button className="text-button" onClick={() => change('bagian', '')}>{t("Hapus filter bagian")}</button></>}
        <button className="text-button" onClick={() => setFilters(new URLSearchParams())}>{t("Hapus semua filter")}</button>
      </div>}
      {rows.length ? rows.map(tx => <TransactionRow key={tx.id} tx={tx} data={data} onClick={() => edit({ kind: 'transaction', item: tx })} />)
        : <Empty>{t("Tidak ada transaksi untuk filter ini.")}</Empty>}
    </section>
  </>
}

export function Budgets({ data, week, period, setWeek, setPeriod, mode, setMode, edit, save, notify, drillDown }: {
  data: Ledger; week: string; period: string; setWeek: (day: string) => void; setPeriod: (day: string) => void;
  mode: 'weekly' | 'monthly'; setMode: (mode: 'weekly' | 'monthly') => void; edit: (editor: Editor) => void;
  save: Commit; notify: (message: string) => void; drillDown: (category: string, start: string, end: string, section?: Segment) => void;
}) {
  const [copying, setCopying] = useState(false)
  const [previewPeriod, setPreviewPeriod] = useState('')
  const weekly = mode === 'weekly'
  const start = weekly ? week : period
  const end = weekly ? addDays(start, 6) : periodEnd(start)
  const previous = addDays(week, -7)
  const categories = data.categories.filter(item => item.type === 'expense' && !item.parentId && item.id !== titheCategory.id)
  const activeCategories = new Set(categories.filter(item => !item.archived).map(item => item.id))
  const monthlyPreview = weekly ? [] : monthlyLimitsToCopy(data, period)
  const weekHasLimits = data.weeklyBudgets.some(row => row.weekStart === week)
  const lastWeekHasLimits = data.weeklyBudgets.some(row => row.weekStart === previous && activeCategories.has(row.categoryId))
  async function copy() {
    setCopying(true)
    try {
      await save(current => {
        if (current.weeklyBudgets.some(row => row.weekStart === week)) throw new Error(t("Minggu ini sudah punya limit."))
        const active = new Set(current.categories.filter(item => !item.archived).map(item => item.id))
        const source = current.weeklyBudgets.filter(row => row.weekStart === previous && active.has(row.categoryId))
        if (!source.length) throw new Error(t("Minggu sebelumnya belum punya limit."))
        return { ...current, weeklyBudgets: [...current.weeklyBudgets, ...source.map(row => ({ ...row, weekStart: week }))] }
      })
      notify(t("Limit minggu sebelumnya tersalin"))
    } catch (error) { notify(error instanceof Error ? error.message : t("Limit gagal disalin.")) }
    finally { setCopying(false) }
  }
  async function copyMonth() {
    const approved = new Map(monthlyPreview.map(row => [row.categoryId, row.limitIdr]))
    setCopying(true)
    try {
      await save(current => {
        const limits = monthlyLimitsToCopy(current, period).filter(row => approved.get(row.categoryId) === row.limitIdr)
        if (!limits.length) throw new Error(t("Tidak ada limit yang dapat disalin."))
        return { ...current, monthlyBudgets: [...current.monthlyBudgets, ...limits] }
      })
      setPreviewPeriod('')
      notify(t("Limit periode sebelumnya tersalin"))
    } catch (error) { notify(error instanceof Error ? error.message : t("Limit gagal disalin.")) }
    finally { setCopying(false) }
  }
  const step = (count: number) => weekly ? setWeek(addDays(start, count * 7)) : setPeriod(addMonths(start, count))
  const blocks: Array<Segment | undefined> = weekly ? ['weekdays', 'saturday', 'sunday'] : [undefined]
  return <>
    <div className="page-title"><div><h1>Budget</h1><p>{t("Atur jatah dan lihat pemakaian per kategori.")}</p></div></div>
    <div className="budget-tools">
      <div className="segmented"><button aria-pressed={weekly} onClick={() => setMode('weekly')}>{t("Mingguan")}</button>
        <button aria-pressed={!weekly} onClick={() => setMode('monthly')}>{t("Bulanan")}</button></div>
      <div className="date-control"><button className="icon-button" aria-label={t("Periode sebelumnya")} onClick={() => step(-1)}><ChevronLeft size={18} /></button>
        <span><CalendarDays size={16} />{rangeLabel(start, end)}</span>
        <button className="icon-button" aria-label={t("Periode berikutnya")} onClick={() => step(1)}><ChevronRight size={18} /></button></div>
      {weekly && !weekHasLimits && lastWeekHasLimits && <button className="button secondary" disabled={copying} onClick={() => void copy()}>{t("Salin limit minggu lalu")}</button>}
      {monthlyPreview.length > 0 && <button className="button secondary" type="button" disabled={copying} aria-expanded={previewPeriod === period}
        onClick={() => setPreviewPeriod(previewPeriod === period ? '' : period)}>{t("Salin limit periode lalu")}</button>}
    </div>
    {previewPeriod === period && monthlyPreview.length > 0 && <section className="panel budget-copy-preview" aria-labelledby="budget-copy-heading">
      <h2 id="budget-copy-heading">{t("Pratinjau salin limit")}</h2>
      <p className="muted">{rangeLabel(period, end)}</p>
      <ul>{monthlyPreview.map(row => <li key={row.categoryId}>
        <span>{categories.find(item => item.id === row.categoryId)?.name}</span><strong>{rupiah(row.limitIdr)}</strong>
      </li>)}</ul>
      <div className="category-actions">
        <button className="button secondary" type="button" disabled={copying} onClick={() => setPreviewPeriod('')}>{t("Batal")}</button>
        <button className="button primary" type="button" disabled={copying} onClick={() => void copyMonth()}>{t("Salin limit")}</button>
      </div>
    </section>}
    <div className="budget-stack">{blocks.map(segment => {
      const rows = budgetRows(data, start, segment)
      const listed = categories.filter(item => rows.some(row => row.categoryId === item.id)
        || spentBy(data.transactions, item.id, start, end, segment, data.categories) > 0)
      const canAdd = categories.some(item => !item.archived && !rows.some(row => row.categoryId === item.id))
      return <section className="panel budget-panel" key={segment ?? 'monthly'}>
        <div className="panel-heading"><div><h2>{segment ? t(segments[segment]) : t("Periode gajian")}</h2>
          <p>{segment ? t("Jatah per kategori") : rangeLabel(start, end)}</p></div>
          {canAdd && <button className="button secondary" onClick={() => edit({ kind: 'budget', start, segment })}><Plus size={17} /> {t("Atur limit")}</button>}</div>
        {listed.length ? listed.map(category => {
          const row = rows.find(item => item.categoryId === category.id)
          const spent = row?.spent ?? spentBy(data.transactions, category.id, start, end, segment, data.categories)
          const remaining = row ? row.limitIdr - spent : 0
          const detail = segment === 'weekdays' ? [start, addDays(start, 4)] : segment === 'saturday' ? [addDays(start, 5), addDays(start, 5)] : segment === 'sunday' ? [end, end] : [start, end]
          return <div className="budget-row" key={category.id}>
            <button className="budget-category" onClick={() => drillDown(category.id, detail[0], detail[1], segment)}><Glyph item={category} /><strong>{category.name}</strong></button>
            <div className="budget-row-value"><span>{t("Jatah")}</span><strong>{row ? rupiah(row.limitIdr) : t("Belum diatur")}</strong></div>
            <div className="budget-row-value"><span>{t("Terpakai")}</span><strong>{rupiah(spent)}</strong></div>
            <div className="budget-row-value"><span>{t("Sisa")}</span><strong className={remaining < 0 ? 'danger-text' : ''}>{row ? remaining < 0 ? t("Lewat {amount}", { amount: rupiah(-remaining) }) : rupiah(remaining) : '—'}</strong></div>
            {(row || !category.archived) && <button className="text-button" onClick={() => edit({ kind: 'budget', start, segment, categoryId: category.id, limit: row?.limitIdr })}>{row ? 'Edit' : t("Atur")}</button>}
          </div>
        }) : <Empty>{categories.length ? t("Belum ada limit atau pengeluaran di bagian ini.") : t("Tambahkan kategori pengeluaran di Pengaturan.")}</Empty>}
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
    return csv([[t("Tanggal"), t("Jenis"), t("Kategori"), t("Nominal IDR"), t("Sumber dana"), t("Tujuan transfer"), t("Bagian minggu"), t("Periode gajian"), t("Catatan")],
      ...[...data.transactions].sort((left, right) => left.date.localeCompare(right.date)).map(tx =>
        [tx.date, t(transactionNames[tx.type]), tx.type === 'transfer' ? '' : category(tx.categoryId), tx.amountIdr,
          account(tx.type === 'transfer' ? tx.fromAccountId : tx.accountId), tx.type === 'transfer' ? account(tx.toAccountId) : '',
          t(segments[segmentFor(tx.date)]), periodStart(tx.date), tx.note])])
  }
  if (kind === 'weekly') return csv([[t("Awal minggu"), t("Akhir minggu"), 'Bagian', t("Kategori"), t("Jatah IDR"), t("Terpakai IDR"), t("Sisa IDR")],
    ...data.weeklyBudgets.map(row => {
      const end = addDays(row.weekStart, 6)
      const spent = spentBy(data.transactions, row.categoryId, row.weekStart, end, row.segment, data.categories)
      return [row.weekStart, end, t(segments[row.segment]), category(row.categoryId), row.limitIdr, spent, row.limitIdr - spent]
    })])
  return csv([[t("Awal periode"), t("Akhir periode"), t("Kategori"), t("Jatah IDR"), t("Terpakai IDR"), t("Sisa IDR")], ...data.monthlyBudgets.map(row => {
    const end = periodEnd(row.periodStart)
    const spent = spentBy(data.transactions, row.categoryId, row.periodStart, end, undefined, data.categories)
    return [row.periodStart, end, category(row.categoryId), row.limitIdr, spent, row.limitIdr - spent]
  })])
}

export function Settings({ data, save, edit, notify, install, installed, account, cloudSync }: {
  data: Ledger; save: Commit; edit: (editor: Editor) => void; notify: (message: string) => void;
  install: (() => void) | undefined; installed: boolean; account?: CloudAccount; cloudSync: CloudSync;
}) {
  const upload = useRef<HTMLInputElement>(null)
  const [restoring, setRestoring] = useState(false)
  async function restore(file?: File) {
    if (!file) return
    setRestoring(true)
    try {
      const backup = validateLedger(JSON.parse(await file.text()))
      if (!window.confirm(t("Ganti catatan yang ada dengan isi backup ini?"))) return
      await save(() => backup)
      notify(t("Backup berhasil dipulihkan"))
    } catch (error) { notify(error instanceof Error ? error.message : t("Backup tidak dapat dibaca.")) }
    finally { setRestoring(false) }
  }
  async function startPersonal() {
    if (!window.confirm(t("Ganti data contoh dengan ruang pencatatan kosong?"))) return
    try {
      await save(() => emptyLedger())
      notify(t("Ruang pribadi siap. Tambahkan sumber dana pertamamu."))
    } catch (error) { notify(error instanceof Error ? error.message : t("Ruang pribadi gagal dibuat.")) }
  }
  return <>
    <div className="page-title"><div><h1>{t("Pengaturan")}</h1><p>{t("Kelola tampilan akun, kategori, dan data PocketPulse.")}</p></div></div>
    {data.demo && <section className="demo-settings"><div><strong>{t("Data contoh")}</strong><p>{t("Coba alur PocketPulse atau mulai dengan catatan kosong.")}</p></div>
      <button className="button primary" onClick={() => void startPersonal()}>{t("Mulai ruang pribadi")}</button></section>}
    <div className="settings-grid">
      <section className="panel data-panel"><label className="field"><span>{t('Bahasa')}</span>
        <Select value={getLanguage()} onChange={event => setLanguage(event.target.value === 'en' ? 'en' : 'id')}>
          <option value="id">Bahasa Indonesia</option><option value="en">English</option>
        </Select></label></section>
      {account && <><CloudSettings account={account} synchronization={cloudSync} notify={notify} /><ReminderSettings ownerId={account.id} /></>}
      <section className="panel"><div className="panel-heading"><div><h2>{t("Sumber dana")}</h2><p>{t("Bank, bank digital, dan tunai")}</p></div>
        <button className="button secondary" onClick={() => edit({ kind: 'account' })}><Plus size={16} /> {t("Tambah")}</button></div>
        {data.accounts.length ? data.accounts.map(item => <button key={item.id} className="manage-row" onClick={() => edit({ kind: 'account', item })}>
          <Glyph item={item} /><span><strong>{item.name}</strong><small>{t(accountTypes[item.type])}{item.isSavings ? ` · ${t("Disisihkan")}` : ''}</small></span><span className="text-button">Edit</span>
        </button>) : <Empty>{t("Belum ada sumber dana.")}</Empty>}
      </section>
      <section className="panel"><div className="panel-heading"><div><h2>{t("Kategori")}</h2><p>{t("Pengelompokan transaksi")}</p></div>
        <button className="button secondary" onClick={() => edit({ kind: 'category' })}><Plus size={16} /> {t("Tambah")}</button></div>
        {data.categories.length ? data.categories.filter(item => item.id !== titheCategory.id).map(item => <button key={item.id} className="manage-row" onClick={() => edit({ kind: 'category', item })}>
          <Glyph item={item} /><span><strong>{categoryLabel(data.categories, item)}</strong><small>{t(transactionNames[item.type])}{item.archived && ` · ${t("Diarsipkan")}`}</small></span><span className="text-button">Edit</span>
        </button>) : <Empty>{t("Belum ada kategori.")}</Empty>}
      </section>
      <section className="panel data-panel"><div className="panel-heading"><div><h2>{t("Data dan backup")}</h2><p>{t("Data tersimpan di perangkat ini.")}</p></div></div>
        <div className="tool-buttons">
          <button className="button secondary" onClick={() => download('pocketpulse-transaksi.csv', exportRecords(data, 'transactions'), 'text/csv;charset=utf-8')}><Download size={16} /> {t("CSV transaksi")}</button>
          <button className="button secondary" onClick={() => download('pocketpulse-budget-mingguan.csv', exportRecords(data, 'weekly'), 'text/csv;charset=utf-8')}><Download size={16} /> {t("CSV mingguan")}</button>
          <button className="button secondary" onClick={() => download('pocketpulse-budget-bulanan.csv', exportRecords(data, 'monthly'), 'text/csv;charset=utf-8')}><Download size={16} /> {t("CSV bulanan")}</button>
          <button className="button secondary" onClick={() => download(`pocketpulse-backup-${today()}.json`, JSON.stringify(data, null, 2), 'application/json')}><Download size={16} /> {t("Unduh backup")}</button>
          <button className="button secondary" disabled={restoring} onClick={() => upload.current?.click()}><FileUp size={16} /> {t("Pulihkan backup")}</button>
          <input ref={upload} type="file" accept=".json,application/json" hidden onChange={event => {
            const file = event.target.files?.[0]
            event.target.value = ''
            void restore(file)
          }} />
        </div>
      </section>
      <section className="panel data-panel"><div className="panel-heading"><div><h2>{t("Akses dari HP")}</h2><p>{installed ? t("PocketPulse berjalan sebagai aplikasi terpasang.") : t("Buka langsung dari layar utama.")}</p></div><Smartphone className="panel-icon" size={19} /></div>
        {!installed && (install ? <button className="button secondary" onClick={install}>{t("Pasang PocketPulse")}</button>
          : <p className="muted">{t("Di Chrome Android, pilih Tambahkan ke Layar Utama lalu Pasang aplikasi. Di Safari iPhone, gunakan Bagikan → Tambahkan ke Layar Utama, lalu aktifkan Buka sebagai App Web.")}</p>)}
      </section>
    </div>
  </>
}
