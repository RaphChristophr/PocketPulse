import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, ArrowLeftRight, ChartPie, ChevronRight, CircleCheck, CloudOff, LayoutDashboard, Plus, Settings2, X } from 'lucide-react'
import { registerSW } from 'virtual:pwa-register'
import { Dashboard } from './Dashboard'
import { EditorDialog, type Change, type Editor } from './Editors'
import { Budgets, History, Settings } from './Pages'
import { demoLedger } from './domain/demo.ts'
import { budgetRows, emptyLedger, periodEnd, periodStart, rangeLabel, rupiah, segmentFor, segments, today, weekStart, type Ledger, type Segment, type Transaction } from './domain/finance.ts'
import { type CloudAccount } from './storage/cloud.ts'
import { readLedger, updateLedger } from './storage/ledger.ts'

const routes = [
  { id: 'ringkasan', name: 'Ringkasan', icon: LayoutDashboard },
  { id: 'riwayat', name: 'Riwayat', icon: ArrowLeftRight },
  { id: 'budget', name: 'Budget', icon: ChartPie },
  { id: 'pengaturan', name: 'Pengaturan', icon: Settings2 },
] as const

interface InstallPrompt extends Event {
  prompt(): Promise<unknown>
}
function getRoute() {
  const [path = '', search = ''] = window.location.hash.slice(1).split('?')
  return { screen: routes.find(item => item.id === path)?.id ?? 'ringkasan', filters: new URLSearchParams(search) }
}

export function App({ account }: { account?: CloudAccount }) {
  const storageKey = account ? `cloud:${account.id}` : 'primary'
  const [day, setDay] = useState(today)
  const activeDay = useRef(day)
  const [data, setData] = useState<Ledger | null>(null)
  const [storageError, setStorageError] = useState(false)
  const [route, setRoute] = useState(getRoute)
  const [period, setPeriod] = useState(() => periodStart(day))
  const [week, setWeek] = useState(() => weekStart(day))
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [toast, setToast] = useState<{ message: string; details?: string[] } | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [readyOffline, setReadyOffline] = useState(Boolean(navigator.serviceWorker?.controller))
  const [refresh, setRefresh] = useState<(() => void) | null>(null)
  const [install, setInstall] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  const notify = useCallback((message: string) => setToast({ message }), [])

  useEffect(() => {
    readLedger(storageKey).then(stored => setData(stored ?? (account ? emptyLedger() : demoLedger(today())))).catch(() => setStorageError(true))
    function onHash() {
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
    function beforeInstall(event: Event) {
      event.preventDefault()
      setInstall(event as InstallPrompt)
    }
    function onInstall() { setInstalled(true); setInstall(null) }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('online', syncNetwork)
    window.addEventListener('offline', syncNetwork)
    window.addEventListener('focus', refreshDate)
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', onInstall)
    const timer = window.setInterval(refreshDate, 30_000)
    const update = registerSW({
      onOfflineReady() { setReadyOffline(true) },
      onNeedRefresh() { setRefresh(() => () => { void update(true) }) },
    })
    return () => {
      clearInterval(timer)
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('online', syncNetwork)
      window.removeEventListener('offline', syncNetwork)
      window.removeEventListener('focus', refreshDate)
      window.removeEventListener('beforeinstallprompt', beforeInstall)
      window.removeEventListener('appinstalled', onInstall)
    }
  }, [account?.id, storageKey])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.details?.length ? 9500 : 5000)
    return () => clearTimeout(timer)
  }, [toast])

  function navigate(path: string) {
    window.location.hash = path
  }
  function drillDown(category: string, start: string, end: string, segment?: Segment) {
    const params = new URLSearchParams({ kategori: category, dari: start, sampai: end })
    if (segment) params.set('bagian', segment)
    navigate(`riwayat?${params}`)
  }
  async function save(change: Change) {
    if (!data) throw new Error('Data masih dimuat.')
    const updated = await updateLedger(data, change, storageKey)
    setData(updated)
    return updated
  }
  function openTransaction(tx?: Transaction) {
    if (!tx && data && !data.accounts.length) {
      navigate('pengaturan')
      setEditor({ kind: 'account' })
      return
    }
    setEditor({ kind: 'transaction', item: tx })
  }
  function onSaved(message: string, tx?: Transaction, updated?: Ledger) {
    setEditor(null)
    if (!tx || tx.type !== 'expense' || !updated) return notify(message)
    const month = periodStart(tx.date)
    const segment = segmentFor(tx.date)
    const weekRow = budgetRows(updated, weekStart(tx.date), segment).find(row => row.categoryId === tx.categoryId)
    const monthRow = budgetRows(updated, month).find(row => row.categoryId === tx.categoryId)
    const remaining = (row: { limitIdr: number; spent: number }) =>
      row.limitIdr >= row.spent ? `Sisa ${rupiah(row.limitIdr - row.spent)}` : `Lewat ${rupiah(row.spent - row.limitIdr)}`
    const details = [
      weekRow ? `${segments[segment]}: ${remaining(weekRow)}` : '',
      monthRow ? `${rangeLabel(month, periodEnd(month))}: ${remaining(monthRow)}` : '',
    ].filter(Boolean)
    setToast({ message, details })
  }
  const startInstall = install ? () => { void install.prompt().then(() => setInstall(null)).catch(() => notify('Buka menu browser untuk memasang PocketPulse.')) } : undefined
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#ringkasan"><span className="brand-mark"><Activity size={22} strokeWidth={2.35} /></span><span>PocketPulse</span></a>
      <nav className="main-nav" aria-label="Navigasi utama">{routes.map(({ id, name, icon: Symbol }) =>
        <a key={id} href={`#${id}`} aria-current={route.screen === id ? 'page' : undefined}><Symbol size={19} strokeWidth={1.8} /><span>{name}</span></a>)}</nav>
      <div className="sidebar-bottom">
        {data?.demo && <button className="workspace-label" onClick={() => navigate('pengaturan')}><span className="avatar">P</span><span><strong>Ruang contoh</strong><small>Data demo</small></span><ChevronRight size={15} /></button>}
        {!data?.demo && <div className="workspace-label"><span className="avatar">P</span><span><strong>Ruang pribadi</strong><small>Perangkat ini</small></span></div>}
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <a className="brand mobile-brand" href="#ringkasan"><span className="brand-mark"><Activity size={19} strokeWidth={2.35} /></span><span>PocketPulse</span></a>
        <span className="desktop-breadcrumb">Keuangan pribadi <ChevronRight size={14} /> <strong>{routes.find(item => item.id === route.screen)?.name}</strong></span>
        <div className="header-meta">
          {!online ? <span className="connection"><CloudOff size={16} /> Offline</span> : readyOffline && <span className="connection desktop-status"><CircleCheck size={16} /> Siap offline</span>}
          {data?.demo && <button className="demo-chip" onClick={() => navigate('pengaturan')}>Data contoh</button>}
        </div>
      </header>
      <main className="content">
        {refresh && <div className="update-notice"><span>Versi baru tersedia.</span><button className="text-button" onClick={refresh} disabled={Boolean(editor)}>Muat ulang</button></div>}
        {!data && <section className="panel loading-panel"><h1>PocketPulse</h1><p>{storageError ? 'Penyimpanan perangkat gagal dibuka.' : 'Memuat catatan keuangan…'}</p>
          {storageError && <button className="button secondary" onClick={() => window.location.reload()}>Coba lagi</button>}</section>}
        {data && route.screen === 'ringkasan' && <Dashboard data={data} day={day} period={period} setPeriod={setPeriod}
          navigate={navigate} openTransaction={openTransaction} drillDown={drillDown} />}
        {data && route.screen === 'riwayat' && <History data={data} filters={route.filters} setFilters={filters => navigate(`riwayat?${filters}`)}
          edit={item => item.kind === 'transaction' ? openTransaction(item.item) : setEditor(item)} />}
        {data && route.screen === 'budget' && <Budgets data={data} week={week} period={period} setWeek={setWeek} setPeriod={setPeriod} mode={mode} setMode={setMode}
          edit={setEditor} save={save} notify={notify} drillDown={drillDown} />}
        {data && route.screen === 'pengaturan' && <Settings data={data} save={save} edit={setEditor} notify={notify} install={startInstall} installed={installed}
          account={account} storageKey={storageKey} />}
      </main>
      {data && <button className="quick-add" aria-label="Catat transaksi" onClick={() => openTransaction()}><Plus size={23} /></button>}
    </div>
    {editor && data && <EditorDialog editor={editor} data={data} day={day} save={save} onSaved={onSaved} close={() => setEditor(null)} />}
    {toast && <div className="toast" role="status"><div><strong>{toast.message}</strong>{toast.details?.map(detail => <p key={detail}>{detail}</p>)}</div>
      <button className="icon-button" onClick={() => setToast(null)} aria-label="Tutup pemberitahuan"><X size={17} /></button></div>}
  </div>
}
