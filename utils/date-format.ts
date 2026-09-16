export type SystemDateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

const defaultDateFormat: SystemDateFormat = 'DD/MM/YYYY'

export function getConfiguredDateFormat(): SystemDateFormat {
  if (typeof window === 'undefined') return defaultDateFormat
  const value = window.localStorage.getItem('lendgh-date-format')
  return value === 'MM/DD/YYYY' || value === 'YYYY-MM-DD' || value === 'DD/MM/YYYY' ? value : defaultDateFormat
}

export function formatDate(value: string | Date | null | undefined, dateFormat = getConfiguredDateFormat(), fallback = '—') {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  if (dateFormat === 'YYYY-MM-DD') return `${year}-${month}-${day}`
  return dateFormat === 'MM/DD/YYYY' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`
}

export function formatDateTime(value: string | Date | null | undefined, dateFormat = getConfiguredDateFormat(), fallback = '—') {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return `${formatDate(date, dateFormat, fallback)} ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

export function formatMonth(value: Date) {
  return value.toLocaleString('en', { month: 'short' })
}

export function formatLongDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date)
}
