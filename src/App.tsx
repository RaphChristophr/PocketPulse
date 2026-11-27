import { t } from './domain/language.ts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, ArrowLeftRight, ChartNoAxesColumn, ChartPie, ChevronRight, CircleCheck, CloudOff, House, Plus, Settings as SettingsIcon, Wallet, X } from 'lucide-react'
import { Dashboard, Insight } from './Dashboard'
import { Cashflow } from './Cashflow'
import { EditorDialog, type Change, type Editor } from './Editors'
import { Budgets, History, Settings } from './Pages'
import { demoLedger } from './domain/demo.ts'
import { budgetRows, emptyLedger, periodEnd, periodStart, rangeLabel, rupiah, segmentFor, segments, today, weekStart, type Ledger, type Segment, type Transaction } from './domain/finance.ts'
import { type CloudAccount } from './storage/cloud.ts'
import { readLedger, updateLedger } from './storage/ledger.ts'
import type { Pwa } from './usePwa'
import { useCloudSync } from './useCloudSync'

const routes = [
  { id: 'ringkasan', name: 'Ringkasan', icon: House },
  { id: 'cashflow', name: 'Cashflow', icon: ChartNoAxesColumn },
  { id: 'insight', name: 'Insight', icon: ChartPie },
  { id: 'budget', name: 'Budget', icon: Wallet },
  { id: 'pengaturan', name: 'Pengaturan', icon: SettingsIcon },
  { id: 'riwayat', name: 'Riwayat', icon: ArrowLeftRight },
] as const

function getRoute() {
  const [path = '', search = ''] = window.location.hash.slice(1).split('?')
  return { screen: routes.find(item => item.id === path)?.id ?? 'ringkasan', filters: new URLSearchParams(search) }
}

export function App({ account, pwa }: { account?: CloudAccount; pwa: Pwa }) {
  const storageKey = account ? `cloud:${account.id}` : 'primary'
  const { install, installed, readyOffline, refresh } = pwa
  const [day, setDay] = useState(today)
  const activeDay = useRef(day)
  const [data, setData] = useState<Ledger | null>(null)
  const [storageError, setStorageError] = useState(false)
  const [route, setRoute] = useState(getRoute)
  const [composeRequested, requestCompose] = useState(() => window.location.hash === '#catat')
  const [period, setPeriod] = useState(() => periodStart(day))
  const [week, setWeek] = useState(() => weekStart(day))
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [toast, setToast] = useState<{ message: string; details?: string[] } | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const notify = useCallback((message: string) => setToast({ message }), [])

  useEffect(() => {
    readLedger(storageKey).then(stored => setData(stored ?? (account ? emptyLedger() : demoLedger(today())))).catch(() => setStorageError(true))
    function onHash() {
      if (window.location.hash === '#catat') requestCompose(true)
      setRoute(getRoute())
      window.scrollTo(0, 0)
    }
    function syncNetwork() { setOnline(navigator.onLine) }
    function refreshDate() {
      const current = today()
      const previous = activeDay.current
      if (current === previous) return
      activeDay.current = current
      setDay(current)
      setPeriod(value => value === periodStart(previous) ? periodStart(current) : value)
      setWeek(value => value === weekStart(previous) ? weekStart(current) : value)
    }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('online', syncNetwork)
    window.addEventListener('offline', syncNetwork)
    window.addEventListener('focus', refreshDate)
    const timer = window.setInterval(refreshDate, 30_000)
    return () => {
      clearInterval(timer)
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('online', syncNetwork)
      window.removeEventListener('offline', syncNetwork)
      window.removeEventListener('focus', refreshDate)
    }
  }, [account?.id, storageKey])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.details?.length ? 9500 : 5000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (data && route.screen === 'pengaturan' && route.filters.get('bagian') === 'pengingat') {
      document.getElementById('pengingat')?.scrollIntoView({ block: 'center' })
    }
  }, [data, route])

  function navigate(path: string) {
    window.location.hash = path
  }
  function drillDown(category: string, start: string, end: string, segment?: Segment) {
    const params = new URLSearchParams({ dari: start, sampai: end })
    if (category) params.set('kategori', category)
    else params.set('jenis', 'expense')
    if (segment) params.set('bagian', segment)
    navigate(`riwayat?${params}`)
  }
  async function save(change: Change) {
    if (!data) throw new Error(t("Data masih dimuat."))
    const updated = await updateLedger(data, change, storageKey)
    setData(updated)
    return updated
  }
  const cloudSync = useCloudSync({ ownerId: account?.id, storageKey, data, save, online, paused: Boolean(editor) })
  function openTransaction(tx?: Transaction) {
    if (!tx && data && !data.accounts.length) {
      navigate('pengaturan')
      setEditor({ kind: 'account' })
      return
    }
    setEditor({ kind: 'transaction', item: tx })
  }
  useEffect(() => {
    if (!data || !composeRequested || editor) return
    requestCompose(false)
    if (window.location.hash === '#catat') window.history.replaceState(null, '', '#ringkasan')
    if (!data.accounts.length) {
      window.location.hash = 'pengaturan'
      setEditor({ kind: 'account' })
    } else setEditor({ kind: 'transaction' })
  }, [data, composeRequested, editor])

  function onSaved(message: string, tx?: Transaction, updated?: Ledger) {
    setEditor(null)
    if (!tx || tx.type !== 'expense' || !updated) return notify(message)
    const month = periodStart(tx.date)
    const segment = segmentFor(tx.date)
    const weekRow = budgetRows(updated, weekStart(tx.date), segment).find(row => row.categoryId === tx.categoryId)
    const monthRow = budgetRows(updated, month).find(row => row.categoryId === tx.categoryId)
    const remaining = (row: { limitIdr: number; spent: number }) =>
      row.limitIdr >= row.spent ? t("Sisa {amount}", { amount: rupiah(row.limitIdr - row.spent) }) : t("Lewat {amount}", { amount: rupiah(row.spent - row.limitIdr) })
    const details = [
      weekRow ? `${t(segments[segment])}: ${remaining(weekRow)}` : '',
      monthRow ? `${rangeLabel(month, periodEnd(month))}: ${remaining(monthRow)}` : '',
    ].filter(Boolean)
    setToast({ message, details })
  }
  const startInstall = install ? () => { void install().catch(() => notify(t("Buka menu browser untuk memasang PocketPulse."))) } : undefined
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#ringkasan"><span className="brand-mark"><Activity size={22} strokeWidth={2.35} /></span><span>PocketPulse</span></a>
      <div className="main-nav-shell">
        <nav className="main-nav" aria-label={t("Navigasi utama")}>{routes.map(({ id, name, icon: Symbol }) =>
          <a key={id} className={`nav-${id}`} href={`#${id}`} aria-label={t(name)} aria-current={route.screen === id ? 'page' : undefined}>
            <Symbol size={21} strokeWidth={1.8} aria-hidden="true" /><span>{t(name)}</span>
          </a>)}</nav>
        {data && <button type="button" className="quick-add" aria-label={t("Catat transaksi")} onClick={() => openTransaction()}><Plus size={25} aria-hidden="true" /></button>}
      </div>
      <div className="sidebar-bottom">
        {data?.demo && <button className="workspace-label" onClick={() => navigate('pengaturan')}><span className="avatar">P</span><span><strong>{t("Ruang contoh")}</strong><small>{t("Data demo")}</small></span><ChevronRight size={15} /></button>}
        {!data?.demo && <div className="workspace-label"><span className="avatar">P</span><span><strong>{t("Ruang pribadi")}</strong><small>{t("Perangkat ini")}</small></span></div>}
      </div>
    </aside>
    <div className="workspace" data-screen={data ? route.screen : undefined}>
      <header className="topbar">
        <a className="brand mobile-brand" href="#ringkasan"><span className="brand-mark"><Activity size={19} strokeWidth={2.35} /></span><span>PocketPulse</span></a>
        <span className="desktop-breadcrumb">{t("Keuangan pribadi")} <ChevronRight size={14} /> <strong>{t(routes.find(item => item.id === route.screen)?.name ?? '')}</strong></span>
        <div className="header-meta">
          {!online ? <span className="connection"><CloudOff size={16} /> Offline</span> : readyOffline && <span className="connection desktop-status"><CircleCheck size={16} /> {t("Siap offline")}</span>}
          {data?.demo && <button className="demo-chip" onClick={() => navigate('pengaturan')}>{t("Data contoh")}</button>}
        </div>
      </header>
      <main className="content">
        {refresh && <div className="update-notice"><span>{t("Versi baru tersedia.")}</span><button className="text-button" onClick={refresh} disabled={Boolean(editor)}>{t("Muat ulang")}</button></div>}
        {!data && <section className="panel loading-panel"><h1>PocketPulse</h1><p>{storageError ? t("Penyimpanan perangkat gagal dibuka.") : t("Memuat catatan keuangan…")}</p>
          {storageError && <button className="button secondary" onClick={() => window.location.reload()}>{t("Coba lagi")}</button>}</section>}
        {data && route.screen === 'ringkasan' && <Dashboard data={data} day={day} period={period} setPeriod={setPeriod}
          initials={account?.email.slice(0, 1).toUpperCase()} reminders={Boolean(account)} openTransaction={openTransaction} drillDown={drillDown} />}
        {data && route.screen === 'cashflow' && <Cashflow data={data} day={day} month={route.filters.get('bulan')}
          setMonth={value => navigate(`cashflow?bulan=${value.slice(0, 7)}`)} drillDown={drillDown} />}
        {data && route.screen === 'insight' && <Insight data={data} day={day} period={period} setPeriod={setPeriod} drillDown={drillDown} />}
        {data && route.screen === 'riwayat' && <History data={data} filters={route.filters} setFilters={filters => navigate(`riwayat?${filters}`)}
          edit={item => item.kind === 'transaction' && !item.titheIncomeId ? openTransaction(item.item) : setEditor(item)} />}
        {data && route.screen === 'budget' && <Budgets data={data} week={week} period={period} setWeek={setWeek} setPeriod={setPeriod} mode={mode} setMode={setMode}
          edit={setEditor} save={save} notify={notify} drillDown={drillDown} />}
        {data && route.screen === 'pengaturan' && <Settings data={data} save={save} edit={setEditor} notify={notify} install={startInstall} installed={installed}
          account={account} cloudSync={cloudSync} />}
      </main>
    </div>
    {editor && data && <EditorDialog editor={editor} data={data} day={day} save={save} onSaved={onSaved} close={() => setEditor(null)} />}
    {toast && <div className="toast" role="status"><div><strong>{toast.message}</strong>{toast.details?.map(detail => <p key={detail}>{detail}</p>)}</div>
      <button className="icon-button" onClick={() => setToast(null)} aria-label={t("Tutup pemberitahuan")}><X size={17} /></button></div>}
  </div>
}
