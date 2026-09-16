import type { ReactNode } from 'react'
import Link from 'next/link'

export function LoadingState({ children = 'Loading...' }: { children?: ReactNode }) { return <div className="directory-empty loading-state" role="status">{children}</div> }
export function EmptyState({ title, message, action }: { title: string; message: string; action?: { label: string; href: string } }) { return <div className="directory-empty empty-state"><strong>{title}</strong><span>{message}</span>{action ? <Link className="secondary-button" href={action.href}>{action.label}</Link> : null}</div> }
export function ErrorState({ title = 'Something went wrong', message }: { title?: string; message: ReactNode }) { return <div className="loan-warning"><strong>{title}</strong><span>{message}</span></div> }
