type CurrencyDisplayProps = { value: string | number | null | undefined; currency?: string; decimals?: number }

export function CurrencyDisplay({ value, currency = 'GHS', decimals = 2 }: CurrencyDisplayProps) {
  if (value === null || value === undefined || value === '') return <span>{currency} 0.{String(0).padStart(decimals, '0')}</span>
  return <span>{currency} {Number(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
}
