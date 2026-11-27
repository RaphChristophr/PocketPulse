import { useId, useState } from 'react'
import { t } from './domain/language.ts'
import { rupiah, shortDate } from './domain/finance.ts'

type SpendingPoint = { start: string; end: string; spent: number }

export function SpendingChart({ points, comparison, drillDown }: {
  points: SpendingPoint[]; comparison?: number[]; drillDown: (category: string, start: string, end: string) => void;
}) {
  const gradient = useId()
  const [selected, setSelected] = useState('')
  const active = points.find(point => point.start === selected)
  if (!points.length) return null

  const values = points.map(point => point.spent)
  const max = Math.max(1, ...values, ...(comparison ?? []))
  const width = 400
  const floor = 108
  const x = (index: number) => points.length > 1 ? index * width / (points.length - 1) : width / 2
  const y = (amount: number) => floor - amount * 98 / max
  const lineFor = (amounts: number[]) => amounts.reduce((path, amount, index) => {
    if (index === 0) return points.length === 1 ? `M0,${y(amount)} H${width}` : `M0,${y(amount)}`
    const middle = (x(index - 1) + x(index)) / 2
    return `${path} C${middle},${y(amounts[index - 1])} ${middle},${y(amount)} ${x(index)},${y(amount)}`
  }, '')
  const line = lineFor(values)
  const tickCount = Math.min(points.length, 5)
  const ticks = Array.from({ length: tickCount }, (_, index) =>
    Math.round(index * (points.length - 1) / Math.max(1, tickCount - 1)))

  return <>
    <div className="trend-plot">
      <svg viewBox={`0 0 ${width} 112`} preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={gradient} x2="0%" y2="100%" gradientUnits="objectBoundingBox">
          <stop stopColor="currentColor" stopOpacity=".2" /><stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient></defs>
        {[12, 60, floor].map(level => <path key={level} className="trend-gridline" d={`M0 ${level} H${width}`} />)}
        <path fill={`url(#${gradient})`} d={`${line} L${width},${floor} H0 Z`} />
        {comparison && <path className="trend-compare" d={lineFor(comparison)} />}
        <path className="trend-line" d={line} />
        {active && <circle cx={x(points.indexOf(active))} cy={y(active.spent)} r="3.5" fill="currentColor" />}
      </svg>
      <div className="trend-hit" role="group" aria-label={t("Grafik pengeluaran")}>
        {points.map(point => <button key={point.start} type="button" aria-pressed={active === point}
          aria-label={`${shortDate(point.start)}${point.end === point.start ? '' : ` – ${shortDate(point.end)}`}, ${rupiah(point.spent)}`}
          onClick={() => setSelected(point.start)} />)}
      </div>
    </div>
    <div className="trend-dates" aria-hidden="true">{ticks.map(index =>
      <span key={points[index].start}>{shortDate(points[index].start)}</span>)}</div>
    {active && <div className="chart-detail"><span>{shortDate(active.start)}{active.end !== active.start && ` – ${shortDate(active.end)}`} · <strong>{rupiah(active.spent)}</strong></span>
      <button className="text-button" onClick={() => drillDown('', active.start, active.end)}>{t("Lihat pengeluaran")}</button></div>}
  </>
}
