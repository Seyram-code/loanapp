type FilterOption = { value: string; label: string }
type FilterDropdownProps = { value: string; options: FilterOption[]; onChange: (value: string) => void; ariaLabel: string }

export function FilterDropdown({ value, options, onChange, ariaLabel }: FilterDropdownProps) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel}>{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>
}
