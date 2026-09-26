'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AdminSidebar } from '@/components/dashboard/AdminSidebar'
import { AdminTopbar } from '@/components/dashboard/AdminTopbar'

type AdminShellProps = { userName: string; userRole: string; children: React.ReactNode }

const navigationPaths = [
	{ label: 'Dashboard', path: '/dashboard' },
	{ label: 'Customers', path: '/customers' },
	{ label: 'Loans', path: '/loans' },
	{ label: 'Repayments', path: '/repayments' },
	{ label: 'Reports', path: '/reports' },
	{ label: 'Audit Logs', path: '/audit-logs' },
	{ label: 'Notifications', path: '/notifications' },
	{ label: 'Users', path: '/users' },
	{ label: 'Settings', path: '/settings' },
] as const

export function AdminShell({ userName, userRole, children }: AdminShellProps) {
	const pathname = usePathname()
	const [menuOpen, setMenuOpen] = useState(false)
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
	const activeNav = navigationPaths.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`))?.label ?? 'Dashboard'

	return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
		<AdminSidebar activeNav={activeNav} userName={userName} menuOpen={menuOpen} collapsed={sidebarCollapsed} onNavigate={() => setMenuOpen(false)} onToggleCollapse={() => setSidebarCollapsed((current) => !current)} onCloseMenu={() => setMenuOpen(false)} />
		<main className="main-content">
			<AdminTopbar userName={userName} userRole={userRole} onMenuToggle={() => setMenuOpen((current) => !current)} />
			{children}
		</main>
	</div>
}