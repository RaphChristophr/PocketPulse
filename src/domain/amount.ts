export type Language = 'id' | 'en'

export function digitsFromAmount(text: string, signed = false) {
  if (!(signed ? /^-?[\d.,\s]*$/ : /^[\d.,\s]*$/).test(text)) return null
  return text.replace(/[.,\s]/g, '')
}

export function groupedAmount(raw: string, language: Language) {
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, language === 'id' ? '.' : ',')
}
