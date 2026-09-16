import type { ReactNode } from 'react'

type DashboardCardProps = { title: string; value: ReactNode; icon?: ReactNode; children?: ReactNode; featured?: boolean; className?: string }

export function DashboardCard({ title, value, icon, children, featured = false, className = '' }: DashboardCardProps) { return <article className={`metric-card ${featured ? 'featured' : ''} ${className}`.trim()}><div className="metric-top"><span>{title}</span>{icon ? <span className="metric-icon">{icon}</span> : null}</div><strong>{value}</strong>{children}</article> }
