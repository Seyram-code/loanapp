import { formatDate, formatDateTime } from '@/utils/date-format'

type DateDisplayProps = { value: string | Date | null | undefined; withTime?: boolean; fallback?: string }

export function DateDisplay({ value, withTime = false, fallback = '—' }: DateDisplayProps) {
  if (!value) return <span>{fallback}</span>
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return <span>{fallback}</span>
  return <time dateTime={date.toISOString()}>{withTime ? formatDateTime(date, undefined, fallback) : formatDate(date, undefined, fallback)}</time>
}
