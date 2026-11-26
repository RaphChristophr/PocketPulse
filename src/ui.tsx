import { ArrowLeftRight, Bike, BriefcaseBusiness, Building2, Coffee, CreditCard, Gift, House, PiggyBank, ShoppingBag, Utensils, Wallet, Zap, ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import type { Account, Category } from './domain/finance.ts'

export const glyphs = { bank: Building2, wallet: Wallet, card: CreditCard, piggy: PiggyBank, meal: Utensils, bike: Bike, bag: ShoppingBag, coffee: Coffee, house: House, briefcase: BriefcaseBusiness, zap: Zap, gift: Gift }
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
