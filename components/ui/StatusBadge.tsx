type StatusBadgeProps = { status: string; className?: string }

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const label = status.replaceAll('_', ' ')
  return <span className={`status ${status.toLowerCase()} ${className}`.trim()}>{label}</span>
}
