'use client'

import { Search, X } from 'lucide-react'

type SearchInputProps = { value: string; onChange: (value: string) => void; placeholder: string; ariaLabel: string }

export function SearchInput({ value, onChange, placeholder, ariaLabel }: SearchInputProps) {
  return <div className="search-box directory-search"><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={ariaLabel} />{value ? <button type="button" onClick={() => onChange('')} aria-label="Clear search"><X size={14} /></button> : null}</div>
}
