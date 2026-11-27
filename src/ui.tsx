import { getLanguage, t } from './domain/language.ts'
import {
  ArrowLeftRight, Bike, BriefcaseBusiness, Building2, BusFront, CarFront, CarTaxiFront, Check, ChevronDown,
  CircleParking, Coffee, CreditCard, Dumbbell, Film, Fuel, Gift, GraduationCap, HeartPulse, House,
  PawPrint, PiggyBank, Plane, Ship, Shirt, ShoppingBag, ShoppingCart, TrainFront, Utensils, Wallet, Wifi, Zap,
  type LucideIcon,
} from 'lucide-react'
import { useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { digitsFromAmount, groupedAmount, type Language } from './domain/amount.ts'
import type { Account, Category } from './domain/finance.ts'

export const glyphs = {
  bank: Building2, wallet: Wallet, card: CreditCard, piggy: PiggyBank,
  meal: Utensils, bag: ShoppingBag, coffee: Coffee, house: House, briefcase: BriefcaseBusiness, zap: Zap, gift: Gift,
  bike: Bike, train: TrainFront, car: CarFront, bus: BusFront, taxi: CarTaxiFront,
  plane: Plane, ship: Ship, fuel: Fuel, parking: CircleParking,
  cart: ShoppingCart, health: HeartPulse, education: GraduationCap, wifi: Wifi,
  pet: PawPrint, clothing: Shirt, fitness: Dumbbell, film: Film,
} satisfies Record<Account['iconKey'], LucideIcon>
export function Glyph({ item, size = 18 }: { item?: Pick<Account | Category, 'iconKey' | 'colorKey'>; size?: number }) {
  const Symbol = item ? glyphs[item.iconKey] : ArrowLeftRight
  return <span className="glyph" data-color={item?.colorKey ?? 'slate'} aria-hidden="true"><Symbol size={size} strokeWidth={1.8} /></span>
}
export function Select({ children, ...props }: ComponentProps<'select'>) {
  return <span className="select-wrap"><select {...props}>{children}</select><ChevronDown size={15} aria-hidden="true" /></span>
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}
export function download(filename: string, value: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type PickerOption = { id: string; name: string; iconKey: Account['iconKey']; colorKey: Account['colorKey'] }

export function VisualPicker({ label, name, value, options, placeholder, onChange }: {
  label: string; name: string; value: string; options: PickerOption[]; placeholder: string; onChange: (value: string) => void;
}) {
  const list = useRef<HTMLDetailsElement>(null)
  const selected = options.find(item => item.id === value)
  return <div className="field">
    <span>{label}</span>
    <input name={name} type="hidden" value={value} />
    <details className="visual-picker" ref={list} onKeyDown={event => {
      if (event.key === 'Escape' && list.current?.open) {
        event.preventDefault()
        event.stopPropagation()
        list.current.open = false
        list.current.querySelector('summary')?.focus()
      }
    }}>
      <summary aria-label={`${label}: ${selected?.name ?? placeholder}`}><Glyph item={selected} /><span>{selected?.name ?? placeholder}</span><ChevronDown size={16} /></summary>
      <div className="picker-options" role="group" aria-label={label}>
        {options.length ? options.map(item => <button key={item.id} type="button" aria-pressed={item.id === value} onClick={() => {
          onChange(item.id)
          if (list.current) {
            list.current.open = false
            list.current.querySelector('summary')?.focus()
          }
        }}><Glyph item={item} /><span>{item.name}</span>{item.id === value && <Check size={16} />}</button>)
          : <p className="muted">{placeholder}</p>}
      </div>
    </details>
  </div>
}

export function AmountInput({ name, label, initial, signed = false, autoFocus, onAmount, prefix, language = getLanguage() }: {
  name: string; label: string; initial?: number; signed?: boolean; autoFocus?: boolean; onAmount?: (raw: string) => void; prefix?: string; language?: Language;
}) {
  const [raw, setRaw] = useState(initial === undefined ? '' : String(initial))
  const box = useRef<HTMLInputElement>(null)
  const caret = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (caret.current === null) return
    const position = caret.current
    caret.current = null
    box.current?.setSelectionRange(position, position)
  })
  function update(text: string, inputPosition = text.length) {
    const next = digitsFromAmount(text, signed)
    if (next === null) return
    const preceding = text.slice(0, inputPosition).replace(/[.,\s]/g, '').length
    const formatted = groupedAmount(next, language)
    let position = 0
    let digits = 0
    while (digits < preceding && position < formatted.length) {
      if (formatted[position] !== '.' && formatted[position] !== ',') digits += 1
      position += 1
    }
    caret.current = position
    if (next === raw) box.current?.setSelectionRange(position, position)
    setRaw(next)
    onAmount?.(next)
  }
  return <div className="field"><span>{label}</span>
    <div className="money-input">
      {prefix && <span aria-hidden="true" className="amount-prefix">{prefix}</span>}
      <input ref={box} aria-label={label} autoFocus={autoFocus} required inputMode={signed ? 'decimal' : 'numeric'}
        placeholder="0" value={groupedAmount(raw, language)} onChange={event => update(event.currentTarget.value, event.currentTarget.selectionStart ?? undefined)} />
      <input type="hidden" name={name} value={raw} />
      <button type="button" className="button secondary" aria-label={t("Tambah tiga nol")} onClick={() => {
        update(raw && raw !== '-' ? raw + '000' : '0')
        box.current?.focus()
      }}>000</button>
    </div>
  </div>
}
