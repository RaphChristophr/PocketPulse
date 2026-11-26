import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { accountTypes, colors, icons, parseMoney, segments, transactionNames, type Account, type Category, type Ledger, type Segment, type Transaction } from './domain/finance.ts'
import { Glyph, Select } from './ui.tsx'

export type Change = (current: Ledger) => Ledger
export type Commit = (change: Change) => Promise<Ledger>
export type Editor = { kind: 'transaction'; item?: Transaction } | { kind: 'account'; item?: Account }
  | { kind: 'category'; item?: Category } | { kind: 'budget'; start: string; segment?: Segment; categoryId?: string; limit?: number }

export function replaceById<T extends { id: string }>(list: T[], item: T) {
  return list.some(row => row.id === item.id) ? list.map(row => row.id === item.id ? item : row) : [item, ...list]
}
const read = (form: FormData, key: string) => String(form.get(key) ?? '')

export function EditorDialog({ editor, data, day, save, onSaved, close }: {
  editor: Editor; data: Ledger; day: string; save: Commit;
  onSaved: (message: string, tx?: Transaction, data?: Ledger) => void; close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { dialog.current?.showModal() }, [])
  const title = editor.kind === 'transaction' ? (editor.item ? 'Edit transaksi' : 'Catat transaksi')
    : editor.kind === 'account' ? (editor.item ? 'Edit sumber dana' : 'Tambah sumber dana')
    : editor.kind === 'category' ? (editor.item ? 'Edit kategori' : 'Tambah kategori') : 'Atur limit budget'
  async function run(action: () => Promise<void>) {
    setError('')
    setBusy(true)
    try { await action() } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Data gagal disimpan.')
    } finally { setBusy(false) }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    void run(async () => {
      const result = await save(current => {
        if (editor.kind === 'transaction') {
          const type = read(form, 'type') as Transaction['type']
          const base = { id: editor.item?.id ?? crypto.randomUUID(), amountIdr: parseMoney(read(form, 'amount'), 1), date: read(form, 'date'), note: read(form, 'note').trim() }
          if (base.date > day) throw new Error('Tanggal transaksi maksimal hari ini.')
          const tx: Transaction = type === 'transfer'
            ? { ...base, type, fromAccountId: read(form, 'from'), toAccountId: read(form, 'to') }
            : { ...base, type, accountId: read(form, 'account'), categoryId: read(form, 'category') }
          form.set('savedId', tx.id)
          return { ...current, transactions: replaceById(current.transactions, tx) }
        }
        if (editor.kind === 'account') {
          const item: Account = {
            id: editor.item?.id ?? crypto.randomUUID(), name: read(form, 'name').trim(), type: read(form, 'type') as Account['type'],
            openingBalanceIdr: parseMoney(read(form, 'openingBalance'), Number.MIN_SAFE_INTEGER), openingDate: read(form, 'openingDate'),
            isSavings: form.has('savings'), iconKey: read(form, 'icon') as Account['iconKey'], colorKey: read(form, 'color') as Account['colorKey'],
          }
          return { ...current, accounts: replaceById(current.accounts, item) }
        }
        if (editor.kind === 'category') {
          const item: Category = {
            id: editor.item?.id ?? crypto.randomUUID(), name: read(form, 'name').trim(), type: read(form, 'type') as Category['type'],
            iconKey: read(form, 'icon') as Category['iconKey'], colorKey: read(form, 'color') as Category['colorKey'],
          }
          return { ...current, categories: replaceById(current.categories, item) }
        }
        const categoryId = read(form, 'category')
        const limitIdr = parseMoney(read(form, 'limit'))
        if (editor.segment) {
          const weeklyBudgets = current.weeklyBudgets.filter(row => row.weekStart !== editor.start || row.segment !== editor.segment || row.categoryId !== categoryId)
          return { ...current, weeklyBudgets: [...weeklyBudgets, { weekStart: editor.start, segment: editor.segment, categoryId, limitIdr }] }
        }
        const monthlyBudgets = current.monthlyBudgets.filter(row => row.periodStart !== editor.start || row.categoryId !== categoryId)
        return { ...current, monthlyBudgets: [...monthlyBudgets, { periodStart: editor.start, categoryId, limitIdr }] }
      })
      const tx = editor.kind === 'transaction' ? result.transactions.find(item => item.id === form.get('savedId')) : undefined
      onSaved(editor.kind === 'transaction' ? 'Transaksi tersimpan' : 'Perubahan tersimpan', tx, result)
    })
  }
  function remove() {
    if (!window.confirm(editor.kind === 'budget' ? 'Hapus limit ini?' : 'Hapus transaksi ini?')) return
    void run(async () => {
      await save(current => {
        if (editor.kind === 'transaction') return { ...current, transactions: current.transactions.filter(row => row.id !== editor.item?.id) }
        if (editor.kind === 'budget' && editor.segment) return { ...current, weeklyBudgets: current.weeklyBudgets.filter(row =>
          row.weekStart !== editor.start || row.segment !== editor.segment || row.categoryId !== editor.categoryId) }
        if (editor.kind === 'budget') return { ...current, monthlyBudgets: current.monthlyBudgets.filter(row =>
          row.periodStart !== editor.start || row.categoryId !== editor.categoryId) }
        return current
      })
      onSaved('Catatan dihapus')
    })
  }
  const canDelete = (editor.kind === 'transaction' && editor.item) || (editor.kind === 'budget' && editor.limit !== undefined)
  return <dialog ref={dialog} className="dialog" onCancel={event => { event.preventDefault(); if (!busy) close() }} aria-labelledby="editor-heading">
    <div className="dialog-heading"><h2 id="editor-heading">{title}</h2><button type="button" className="icon-button" onClick={close} disabled={busy} aria-label="Tutup"><X size={22} /></button></div>
    <form onSubmit={submit}>
      <fieldset className="fields" disabled={busy}>
        {editor.kind === 'transaction' && <TransactionFields data={data} day={day} tx={editor.item} />}
        {editor.kind === 'account' && <AccountFields day={day} account={editor.item} />}
        {editor.kind === 'category' && <CategoryFields category={editor.item} />}
        {editor.kind === 'budget' && <BudgetFields data={data} editor={editor} />}
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        {canDelete && <button className="button danger" type="button" onClick={remove} disabled={busy}>Hapus</button>}
        <button className="button primary" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    </form>
  </dialog>
}

function Label({ title, children }: { title: string; children: ReactNode }) {
  return <label className="field"><span>{title}</span>{children}</label>
}

function TransactionFields({ data, day, tx }: { data: Ledger; day: string; tx?: Transaction }) {
  const [type, setType] = useState<Transaction['type']>(tx?.type ?? 'expense')
  const [account, setAccount] = useState(tx?.type !== 'transfer' ? tx?.accountId ?? '' : '')
  const [category, setCategory] = useState(tx?.type !== 'transfer' ? tx?.categoryId ?? '' : '')
  const [from, setFrom] = useState(tx?.type === 'transfer' ? tx.fromAccountId : '')
  const [to, setTo] = useState(tx?.type === 'transfer' ? tx.toAccountId : '')
  const matched = data.categories.filter(item => item.type === type)
  const options = data.accounts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)
  const accountField = (title: string, inputName: string, value: string, update: (value: string) => void) =>
    <Label title={title}><span className="with-icon"><Glyph item={data.accounts.find(item => item.id === value)} />
      <Select aria-label={title} name={inputName} required value={value} onChange={event => update(event.target.value)}><option value="">Pilih sumber dana</option>{options}</Select></span></Label>
  return <>
    <div className="segmented">{Object.entries(transactionNames).map(([key, label]) => <button type="button" key={key} aria-pressed={key === type}
      onClick={() => { setType(key as Transaction['type']); setCategory('') }}>{label}</button>)}</div>
    <input type="hidden" name="type" value={type} />
    <Label title="Nominal"><span className="money-input"><span aria-hidden="true">Rp</span><input autoFocus required name="amount" inputMode="numeric" placeholder="0" defaultValue={tx?.amountIdr} /></span></Label>
    {type === 'transfer' ? <>
      {accountField('Akun asal', 'from', from, setFrom)}
      {accountField('Akun tujuan', 'to', to, setTo)}
    </> : <>
      <Label title="Kategori"><span className="with-icon"><Glyph item={matched.find(item => item.id === category)} />
        <Select aria-label="Kategori" required name="category" value={category} onChange={event => setCategory(event.target.value)}><option value="">Pilih kategori</option>
          {matched.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></span></Label>
      {accountField('Sumber dana', 'account', account, setAccount)}
    </>}
    <Label title="Tanggal"><input required name="date" type="date" max={day} defaultValue={tx?.date ?? day} /></Label>
    <Label title="Catatan (opsional)"><input name="note" placeholder="Contoh: makan siang" maxLength={160} defaultValue={tx?.note} /></Label>
  </>
}

function AppearanceFields({ item, defaultIcon = 'wallet' }: { item?: Account | Category; defaultIcon?: Account['iconKey'] }) {
  const [icon, setIcon] = useState(item?.iconKey ?? defaultIcon)
  const [color, setColor] = useState(item?.colorKey ?? 'jade')
  return <>
    <Label title="Ikon"><Select aria-label="Ikon" name="icon" value={icon} onChange={event => setIcon(event.target.value as Account['iconKey'])}>
      {Object.entries(icons).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Label>
    <div className="field"><span>Warna</span><div className="swatches" role="group" aria-label="Warna">
      {Object.entries(colors).map(([key, label]) => <button type="button" key={key} data-color={key} aria-label={label} title={label} aria-pressed={color === key}
        onClick={() => setColor(key as Account['colorKey'])}>{color === key && <Check size={18} />}</button>)}
    </div><input type="hidden" name="color" value={color} /></div>
    <div className="appearance-preview"><Glyph item={{ iconKey: icon, colorKey: color }} /><span>Pratinjau ikon</span></div>
  </>
}
function AccountFields({ account, day }: { account?: Account; day: string }) {
  return <>
    <Label title="Nama sumber dana"><input required name="name" maxLength={60} defaultValue={account?.name} /></Label>
    <Label title="Jenis"><Select name="type" defaultValue={account?.type ?? 'bank'}>
      {Object.entries(accountTypes).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</Select></Label>
    <div className="form-columns">
      <Label title="Saldo awal (Rp)"><input required name="openingBalance" inputMode="decimal" defaultValue={account?.openingBalanceIdr ?? 0} /></Label>
      <Label title="Tanggal saldo awal"><input required name="openingDate" type="date" max={day} defaultValue={account?.openingDate ?? day} /></Label>
    </div>
    <label className="checkbox"><input type="checkbox" name="savings" defaultChecked={account?.isSavings} /> Akun khusus tabungan</label>
    <AppearanceFields item={account} defaultIcon="bank" />
  </>
}
function CategoryFields({ category }: { category?: Category }) {
  return <>
    <Label title="Nama kategori"><input required name="name" maxLength={60} defaultValue={category?.name} /></Label>
    <Label title="Jenis"><Select name="type" defaultValue={category?.type ?? 'expense'}>
      <option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></Select></Label>
    <AppearanceFields item={category} defaultIcon="bag" />
  </>
}
function BudgetFields({ data, editor }: { data: Ledger; editor: Extract<Editor, { kind: 'budget' }> }) {
  const configured = editor.segment
    ? data.weeklyBudgets.filter(row => row.weekStart === editor.start && row.segment === editor.segment)
    : data.monthlyBudgets.filter(row => row.periodStart === editor.start)
  const options = data.categories.filter(category => category.type === 'expense'
    && (!editor.categoryId ? !configured.some(row => row.categoryId === category.id) : category.id === editor.categoryId))
  return <>
    <p className="muted">{editor.segment ? segments[editor.segment] : 'Periode gajian'}</p>
    <Label title="Kategori"><Select name="category" required defaultValue={editor.categoryId ?? ''}>
      <option value="">Pilih kategori</option>{options.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Label>
    <Label title="Limit (Rp)"><input required name="limit" inputMode="numeric" defaultValue={editor.limit} placeholder="0" /></Label>
  </>
}
