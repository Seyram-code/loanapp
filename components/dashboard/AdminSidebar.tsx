 'use client'

import { useEffect } from 'react'
import { BarChart3, Bell, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, FileText, LayoutDashboard, LogOut, Settings, ShieldCheck, UsersRound, WalletCards, X } from 'lucide-react'
import Link from 'next/link'
import { brandIcon } from '../../config/navigation'

type AdminSidebarProps = { activeNav: string; userName: string; menuOpen: boolean; collapsed: boolean; onNavigate: (label: string) => void; onToggleCollapse: () => void; onCloseMenu: () => void }

const navigation = [
	{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ label: 'Customers', href: '/customers', icon: UsersRound },
	{ label: 'Loans', href: '/loans', icon: WalletCards },
	{ label: 'Repayments', href: '/repayments', icon: CircleDollarSign },
	{ label: 'Reports', href: '/reports', icon: BarChart3 },
	{ label: 'Audit Logs', href: '/audit-logs', icon: FileText },
	{ label: 'Notifications', href: '/notifications', icon: Bell },
	{ label: 'Users', href: '/users', icon: ShieldCheck },
	{ label: 'Settings', href: '/settings', icon: Settings },
] as const

export function AdminSidebar({ activeNav, userName, menuOpen, collapsed, onNavigate, onToggleCollapse, onCloseMenu }: AdminSidebarProps) {
	const BrandIcon = brandIcon

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape' && menuOpen) onCloseMenu()
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [menuOpen, onCloseMenu])

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' })
		window.location.assign('/login')
	}

	return <>
		{menuOpen ? <button className="sidebar-backdrop" type="button" aria-label="Close navigation menu" onClick={onCloseMenu} /> : null}
		<aside className={`sidebar ${menuOpen ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`} aria-label="Primary navigation">
			<div className="sidebar-header"><Link href="/dashboard" className="brand" aria-label="LoanPro dashboard" onClick={onCloseMenu}><span className="brand-mark"><BrandIcon size={18} /></span><span className="brand-copy"><strong>LoanPro</strong><small>Loan Management System</small></span></Link><div className="sidebar-header-actions"><button className="icon-button sidebar-collapse" type="button" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button><button className="sidebar-close" type="button" onClick={onCloseMenu} aria-label="Close navigation menu"><X size={18} /></button></div></div>
			<div className="workspace-label"><span>Workspace</span><ChevronDown size={14} /></div>
			<nav className="nav-list" aria-label="Main navigation">
				<p className="nav-heading">Manage</p>
				{navigation.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className={`nav-item ${activeNav === label || (label === 'Dashboard' && activeNav === 'Overview') ? 'active' : ''}`} onClick={() => { onNavigate(label); onCloseMenu() }} title={collapsed ? label : undefined} aria-current={activeNav === label || (label === 'Dashboard' && activeNav === 'Overview') ? 'page' : undefined}><Icon size={18} /><span className="nav-label">{label}</span></Link>)}
			</nav>
			<Link href="/settings" className="sidebar-footer" title={collapsed ? 'Open profile settings' : undefined} onClick={onCloseMenu}><div className="user-avatar">{userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div className="sidebar-user-copy"><strong>{userName}</strong><span>Administrator</span></div><ChevronDown className="sidebar-user-chevron" size={14} /></Link>
			<div className="sidebar-controls"><button className="nav-item sidebar-action" type="button" onClick={() => void logout()} title={collapsed ? 'Log out' : undefined}><LogOut size={18} /><span className="nav-label">Logout</span></button></div>
		</aside>
	</>
}
