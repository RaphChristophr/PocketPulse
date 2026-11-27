import { t } from './domain/language.ts'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Check, ChevronLeft, X } from 'lucide-react'
import { accountTypes, categoryLabel, colors, icons, parseMoney, rupiah, segments, transactionNames, type Account, type Category, type Ledger, type Segment, type Transaction } from './domain/finance.ts'
import { titheAllocations, titheAmount, titheCategory } from './domain/tithe.ts'
import { AmountInput, Glyph, Select, VisualPicker } from './ui.tsx'

export type Change = (current: Ledger) => Ledger
export type Commit = (change: Change) => Promise<Ledger>
export type Editor = { kind: 'transaction'; item?: Transaction; titheIncomeId?: string } | { kind: 'account'; item?: Account }
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
  const linkedId = editor.kind === 'transaction'
    ? editor.titheIncomeId ?? (editor.item?.type === 'expense' ? editor.item.titheIncomeId : undefined)
    : undefined
  const linkedAllocation = linkedId ? titheAllocations(data.transactions).find(row => row.income.id === linkedId) : undefined
  const initialAmount = editor.kind === 'transaction' ? editor.item?.amountIdr ?? linkedAllocation?.outstanding : undefined
  const [amount, setAmount] = useState(initialAmount ?? 0)
  const isTransaction = editor.kind === 'transaction'
  useEffect(() => { dialog.current?.showModal() }, [])
  const title = editor.kind === 'transaction' ? (editor.item ? t("Edit transaksi") : t("Catat transaksi"))
    : editor.kind === 'account' ? (editor.item ? t("Edit sumber dana") : t("Tambah sumber dana"))
    : editor.kind === 'category' ? (editor.item ? t("Edit kategori") : t("Tambah kategori")) : t("Atur limit budget")
  async function run(action: () => Promise<void>) {
    setError('')
    setBusy(true)
    try { await action() } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("Data gagal disimpan."))
    } finally { setBusy(false) }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (editor.kind === 'transaction' && editor.item?.type === 'income') {
      const income = editor.item
      const paid = titheAllocations(data.transactions).find(row => row.income.id === income.id)?.paid ?? 0
      if (paid && (Number(read(form, 'amount')) !== income.amountIdr || !form.has('tithe') || read(form, 'date') !== income.date)
        && !window.confirm(t("Tithe {amount} sudah dibayar. Perubahan akan menghitung ulang alokasi. Lanjutkan?", { amount: rupiah(paid) }))) return
    }
    void run(async () => {
      const result = await save(current => {
        if (editor.kind === 'transaction') {
          const type = read(form, 'type') as Transaction['type']
          const base = { id: editor.item?.id ?? crypto.randomUUID(), amountIdr: parseMoney(read(form, 'amount'), 1), date: read(form, 'date'), note: read(form, 'note').trim() }
          if (base.date > day) throw new Error(t("Tanggal transaksi maksimal hari ini."))
          let categoryId = read(form, 'category')
          let categories = current.categories
          const titheIncomeId = read(form, 'titheIncomeId')
          if (type === 'expense' && titheIncomeId) {
            categoryId = titheCategory.id
            if (!categories.some(item => item.id === categoryId)) categories = [...categories, titheCategory]
          } else if (type !== 'transfer' && form.has('newCategory')) {
            const name = read(form, 'newCategory').trim()
            if (!name) throw new Error(t("Isi nama kategori."))
            const existing = categories.find(item => item.type === type && item.name === name && item.id !== titheCategory.id)
            categoryId = existing?.id ?? crypto.randomUUID()
            if (!existing) categories = [...categories, {
              id: categoryId, name, type, iconKey: type === 'income' ? 'briefcase' : 'bag', colorKey: 'jade',
            }]
          }
          const tx: Transaction = type === 'transfer'
            ? { ...base, type, fromAccountId: read(form, 'from'), toAccountId: read(form, 'to') }
            : type === 'income'
              ? { ...base, type, accountId: read(form, 'account'), categoryId, ...(form.has('tithe') ? { tithe: true } : {}) }
              : { ...base, type, accountId: read(form, 'account'), categoryId, ...(titheIncomeId ? { titheIncomeId } : {}) }
          form.set('savedId', tx.id)
          const next = { ...current, categories, transactions: replaceById(current.transactions, tx) }
          const favorites = current.favorites ?? []
          if (tx.type === 'expense' && !tx.titheIncomeId && read(form, 'favoriteAction')) {
            const others = favorites.filter(item => item.accountId !== tx.accountId || item.categoryId !== tx.categoryId)
            return { ...next, favorites:
              read(form, 'favoriteAction') === 'add' ? [...others, { accountId: tx.accountId, categoryId: tx.categoryId }] : others }
          }
          return next
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
            ...(read(form, 'parent') ? { parentId: read(form, 'parent') } : {}),
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
      onSaved(editor.kind === 'transaction' ? t("Transaksi tersimpan") : t("Perubahan tersimpan"), tx, result)
    })
  }
  function remove() {
    if (!window.confirm(editor.kind === 'budget' ? t("Hapus limit ini?") : t("Hapus transaksi ini?"))) return
    void run(async () => {
      await save(current => {
        if (editor.kind === 'transaction') return { ...current, transactions: current.transactions.filter(row => row.id !== editor.item?.id) }
        if (editor.kind === 'budget' && editor.segment) return { ...current, weeklyBudgets: current.weeklyBudgets.filter(row =>
          row.weekStart !== editor.start || row.segment !== editor.segment || row.categoryId !== editor.categoryId) }
        if (editor.kind === 'budget') return { ...current, monthlyBudgets: current.monthlyBudgets.filter(row =>
          row.periodStart !== editor.start || row.categoryId !== editor.categoryId) }
        return current
      })
      onSaved(t("Catatan dihapus"))
    })
  }
  const canDelete = (editor.kind === 'transaction' && editor.item) || (editor.kind === 'budget' && editor.limit !== undefined)
  return <dialog ref={dialog} className={isTransaction ? "dialog transaction-dialog" : "dialog"} onCancel={event => { event.preventDefault(); if (!busy) close() }} aria-labelledby="editor-heading">
    <div className="dialog-heading"><h2 id="editor-heading">{title}</h2><button type="button" className="icon-button" onClick={close} disabled={busy} aria-label={t("Tutup")}>{isTransaction ? <ChevronLeft size={22} /> : <X size={22} />}</button></div>
    <form onSubmit={submit}>
      <fieldset className="fields" disabled={busy}>
        {editor.kind === 'transaction' && <TransactionFields data={data} day={day} tx={editor.item} linkedId={linkedId} linkedAllocation={linkedAllocation}
          amount={amount} initialAmount={initialAmount} setAmount={setAmount} />}
        {editor.kind === 'account' && <AccountFields day={day} account={editor.item} />}
        {editor.kind === 'category' && <CategoryFields data={data} category={editor.item} />}
        {editor.kind === 'budget' && <BudgetFields data={data} editor={editor} />}
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        {canDelete && <button className="button danger" type="button" onClick={remove} disabled={busy}>{t("Hapus")}</button>}
        <button className="button primary" type="submit" disabled={busy}>{busy ? t("Menyimpan…") : isTransaction && Number.isSafeInteger(amount) && amount > 0 ? `${t("Simpan")} · ${rupiah(amount)}` : t("Simpan")}</button>
      </div>
    </form>
  </dialog>
}

function Label({ title, children }: { title: string; children: ReactNode }) {
  return <label className="field"><span>{title}</span>{children}</label>
}

function TransactionFields({ data, day, tx, linkedId, linkedAllocation, amount, initialAmount, setAmount }: {
  data: Ledger; day: string; tx?: Transaction; linkedId?: string; linkedAllocation?: ReturnType<typeof titheAllocations>[number];
  amount: number; initialAmount?: number; setAmount: (amount: number) => void;
}) {
  const [tithe, setTithe] = useState(tx?.type === 'income' && tx.tithe === true)
  const [type, setType] = useState<Transaction['type']>(tx?.type ?? 'expense')
  const [account, setAccount] = useState(tx?.type !== 'transfer' ? tx?.accountId ?? '' : '')
  const [category, setCategory] = useState(tx?.type !== 'transfer' ? tx?.categoryId ?? '' : '')
  const [from, setFrom] = useState(tx?.type === 'transfer' ? tx.fromAccountId : '')
  const [to, setTo] = useState(tx?.type === 'transfer' ? tx.toAccountId : '')
  const [favoriteAction, setFavoriteAction] = useState('')
  const favorites = data.favorites ?? []
  const favoriteExists = favorites.some(item => item.accountId === account && item.categoryId === category)
  const isFavorite = favoriteAction ? favoriteAction === 'add' : favoriteExists
  const matched = data.categories.filter(item => item.type === type && item.id !== titheCategory.id)
  const accountField = (title: string, inputName: string, value: string, update: (value: string) => void) =>
    <VisualPicker label={title} name={inputName} value={value} placeholder={t("Pilih sumber dana")} options={data.accounts}
      onChange={value => { update(value); setFavoriteAction('') }} />
  return <>
    <div className="transaction-amount">
      <AmountInput name="amount" label={t("Nominal")} initial={initialAmount} prefix="Rp" onAmount={raw => setAmount(Number(raw))} />
    </div>
    <div className="transaction-sheet">
      {linkedId ? <h3>{t("Pembayaran Tithe")}</h3> : <div className="segmented" role="group" aria-label={t("Jenis")}>
        {Object.entries(transactionNames).map(([key, label]) => <button type="button" key={key} aria-pressed={key === type}
          onClick={() => { if (type !== key) { setType(key as Transaction['type']); setCategory(''); setFavoriteAction('') } }}>{t(label)}</button>)}</div>}
      <input type="hidden" name="type" value={type} />
      {type === 'expense' && !tx && !linkedId && favorites.length > 0 && <div className="favorite-buttons" aria-label={t("Favorit transaksi")}>
        {favorites.map(item => <button className="button secondary" type="button" key={JSON.stringify(item)} onClick={() => {
          setAccount(item.accountId)
          setCategory(item.categoryId)
          setFavoriteAction('')
        }}>{data.categories.find(category => category.id === item.categoryId)?.name} · {data.accounts.find(account => account.id === item.accountId)?.name}</button>)}
      </div>}
      {type === 'transfer' ? <div className="form-columns">
        {accountField(t("Akun asal"), 'from', from, setFrom)}
        {accountField(t("Akun tujuan"), 'to', to, setTo)}
      </div> : linkedId ? <>
        <input type="hidden" name="titheIncomeId" value={linkedId} />
        <p className="muted">{linkedAllocation?.income.note || t("Alokasi Tithe yang dipilih")}</p>
      </> : <fieldset className="category-choice">
        <legend>{t("Kategori")}</legend>
        {matched.length ? <div className="category-grid">{matched.map(item => <label key={item.id}>
          <input type="radio" name="category" value={item.id} required checked={category === item.id}
            onChange={() => { setCategory(item.id); setFavoriteAction('') }} />
          <Glyph item={item} size={22} /><span>{categoryLabel(data.categories, item)}</span>
        </label>)}</div> : <Label key={type} title={t("Nama kategori baru")}>
          <input required name="newCategory" maxLength={60} placeholder={type === 'income' ? t("Misalnya Gaji") : t("Misalnya Makan")} />
        </Label>}
      </fieldset>}
      <div className="form-columns transaction-details">
        <Label title={t("Tanggal")}><input required name="date" type="date" min={linkedAllocation?.income.date} max={day} defaultValue={tx?.date ?? day} /></Label>
        {type !== 'transfer' && accountField(t("Sumber dana"), 'account', account, setAccount)}
      </div>
      <Label title={t("Catatan (opsional)")}><input name="note" placeholder={t("Contoh: makan siang")} maxLength={160} defaultValue={tx?.note} /></Label>
      {type === 'expense' && !linkedId && account && category && <>
        <input type="hidden" name="favoriteAction" value={favoriteAction} />
        <label className="checkbox"><input type="checkbox" checked={isFavorite} onChange={event => {
          setFavoriteAction(event.target.checked === favoriteExists ? '' : event.target.checked ? 'add' : 'remove')
        }} /> {t("Simpan sebagai favorit")}</label>
      </>}
      {type === 'income' && <label className="checkbox"><input type="checkbox" name="tithe" checked={tithe} onChange={event => setTithe(event.target.checked)} />{t("Sisihkan Tithe (10%)")}{tithe && Number.isSafeInteger(amount) && amount >= 0 ? ` · ${rupiah(titheAmount(amount))}` : ''}</label>}
    </div>
  </>
}

function AppearanceFields({ item, defaultIcon = 'wallet' }: { item?: Account | Category; defaultIcon?: Account['iconKey'] }) {
  const [icon, setIcon] = useState(item?.iconKey ?? defaultIcon)
  const [color, setColor] = useState(item?.colorKey ?? 'jade')
  return <>
    <div className="field"><span>{t("Ikon")}</span><div className="icon-picker" role="group" aria-label={t("Ikon")}>
      {Object.entries(icons).map(([key, label]) => <button key={key} type="button" title={t(label)} aria-label={t(label)} aria-pressed={icon === key}
        onClick={() => setIcon(key as Account['iconKey'])}><Glyph item={{ iconKey: key as Account['iconKey'], colorKey: color }} /></button>)}
    </div><input type="hidden" name="icon" value={icon} /></div>
    <div className="field"><span>{t("Warna")}</span><div className="swatches" role="group" aria-label={t("Warna")}>
      {Object.entries(colors).map(([key, label]) => <button type="button" key={key} data-color={key} aria-label={t(label)} title={t(label)} aria-pressed={color === key}
        onClick={() => setColor(key as Account['colorKey'])}>{color === key && <Check size={18} />}</button>)}
    </div><input type="hidden" name="color" value={color} /></div>
    <div className="appearance-preview"><Glyph item={{ iconKey: icon, colorKey: color }} /><span>{t("Pratinjau ikon")}</span></div>
  </>
}
function AccountFields({ account, day }: { account?: Account; day: string }) {
  return <>
    <Label title={t("Nama sumber dana")}><input required name="name" maxLength={60} defaultValue={account?.name} /></Label>
    <Label title={t("Jenis")}><Select name="type" defaultValue={account?.type ?? 'bank'}>
      {Object.entries(accountTypes).map(([key, label]) => <option value={key} key={key}>{t(label)}</option>)}</Select></Label>
    <div className="form-columns">
      <AmountInput name="openingBalance" label={t("Saldo awal (Rp)")} initial={account?.openingBalanceIdr ?? 0} signed />
      <Label title={t("Tanggal saldo awal")}><input required name="openingDate" type="date" max={day} defaultValue={account?.openingDate ?? day} /></Label>
    </div>
    <label className="checkbox"><input type="checkbox" name="savings" defaultChecked={account?.isSavings} aria-describedby="reserved-account-help" /> {t("Khusus tabungan atau dana darurat")}</label>
    <p className="muted" id="reserved-account-help">{t("Saldo akun ini disisihkan dari Saldo tersedia.")}</p>
    <AppearanceFields item={account} defaultIcon="bank" />
  </>
}
function CategoryFields({ category, data }: { category?: Category; data: Ledger }) {
  const [type, setType] = useState(category?.type ?? 'expense')
  const hasChildren = data.categories.some(item => item.parentId === category?.id && item.parentId)
  const hasBudget = [...data.weeklyBudgets, ...data.monthlyBudgets].some(item => item.categoryId === category?.id)
  return <>
    <Label title={t("Nama kategori")}><input required name="name" maxLength={60} defaultValue={category?.name} /></Label>
    <Label title={t("Jenis")}><Select name="type" value={type} onChange={event => setType(event.target.value as Category['type'])}>
      <option value="expense">{t("Pengeluaran")}</option><option value="income">{t("Pemasukan")}</option></Select></Label>
    {type === 'expense' && !hasChildren && !hasBudget && <Label title={t("Kategori induk")}><Select name="parent" defaultValue={category?.parentId ?? ''}>
      <option value="">{t("Kategori utama")}</option>{data.categories.filter(item => item.type === 'expense' && !item.parentId && item.id !== titheCategory.id && item.id !== category?.id)
        .map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Label>}
    <AppearanceFields item={category} defaultIcon="bag" />
  </>
}
function BudgetFields({ data, editor }: { data: Ledger; editor: Extract<Editor, { kind: 'budget' }> }) {
  const configured = editor.segment
    ? data.weeklyBudgets.filter(row => row.weekStart === editor.start && row.segment === editor.segment)
    : data.monthlyBudgets.filter(row => row.periodStart === editor.start)
  const options = data.categories.filter(category => category.type === 'expense' && !category.parentId && category.id !== titheCategory.id
    && (!editor.categoryId ? !configured.some(row => row.categoryId === category.id) : category.id === editor.categoryId))
  return <>
    <p className="muted">{editor.segment ? t(segments[editor.segment]) : t("Periode gajian")}</p>
    <Label title={t("Kategori")}><Select name="category" required defaultValue={editor.categoryId ?? ''}>
      <option value="">{t("Pilih kategori")}</option>{options.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Label>
    <AmountInput name="limit" label="Limit (Rp)" initial={editor.limit} />
  </>
}
