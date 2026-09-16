import type { ReactNode } from 'react'

type DataTableProps = { headers: ReactNode; children: ReactNode; empty?: ReactNode }

export function DataTable({ headers, children, empty }: DataTableProps) { return <div className="customer-table"><div className="customer-row customer-head">{headers}</div>{children || empty}</div> }
