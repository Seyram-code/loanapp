import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { DashboardCard } from '../ui/DashboardCard'

type MetricCardProps = { title: string; value: string; change?: string; icon: React.ReactNode; featured?: boolean; negative?: boolean; line: string; iconClass?: string; className?: string }

export function MetricCard({ title, value, change, icon, featured, negative, line, iconClass = '', className }: MetricCardProps) {
  const chartColor = line === 'gold-line' ? '#ddb23c' : line === 'blue-line' ? '#6e9bb3' : line === 'coral-line' ? '#d99382' : '#80af9a'
  const data = [8, 12, 10, 17, 14, 22, 20].map((chartValue, index) => ({ index, value: chartValue }))
  return <DashboardCard title={title} value={value} icon={<span className={`metric-icon ${iconClass}`}>{icon}</span>} featured={featured} className={className}><>{change && <p><span className={negative ? 'negative' : 'positive'}>{negative ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />} {change}</span> <span className="muted">vs last month</span></p>}<div className="sparkline"><ResponsiveContainer width={74} height={28}><AreaChart data={data}><Area type="monotone" dataKey="value" stroke={chartColor} fill={chartColor} fillOpacity={0.14} strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div></></DashboardCard>
}
