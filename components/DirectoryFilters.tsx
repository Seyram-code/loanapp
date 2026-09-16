'use client'

import { SearchInput } from './ui/SearchInput'
import { FilterDropdown } from './ui/FilterDropdown'
import { CalendarDays } from 'lucide-react'

type FilterOption = { value: string; label: string }

type DirectoryFiltersProps = {
  query: string
  onQueryChange: (value: string) => void
  queryPlaceholder: string
  queryLabel: string
  selects?: Array<{ value: string; label: string; ariaLabel: string; options: FilterOption[]; onChange: (value: string) => void }>
  dates?: Array<{ value: string; ariaLabel: string; onChange: (value: string) => void }>
  resultLabel: string
  resultCount: number
  onClear?: () => void
}

export function DirectoryFilters({ query, onQueryChange, queryPlaceholder, queryLabel, selects = [], dates = [], resultLabel, resultCount, onClear }: DirectoryFiltersProps) {
  const hasFilters = Boolean(query || selects.some((select) => select.value) || dates.some((date) => date.value))

  return (
    <div className="directory-toolbar">
      <SearchInput value={query} onChange={onQueryChange} placeholder={queryPlaceholder} ariaLabel={queryLabel} />
      {selects.map((select) => (
        <FilterDropdown key={select.ariaLabel} value={select.value} options={select.options} onChange={select.onChange} ariaLabel={select.ariaLabel} />
      ))}
      {dates.map((date, index) => <label className="date-filter" key={date.ariaLabel}>
        <span>{index === 0 ? 'From' : 'To'}</span>
        <CalendarDays size={15} aria-hidden="true" />
        <input type="date" value={date.value} onChange={(event) => date.onChange(event.target.value)} aria-label={date.ariaLabel} />
      </label>)}
      {onClear && hasFilters && <button type="button" className="directory-clear" onClick={onClear} aria-label="Clear filters">Clear</button>}
      <span className="directory-count">{resultCount} {resultLabel}</span>
    </div>
  )
}
