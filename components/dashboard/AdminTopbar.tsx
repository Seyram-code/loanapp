 'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun, UserRound } from 'lucide-react'
import Link from 'next/link'

type AdminTopbarProps = { userName: string; userRole: string; onMenuToggle: () => void }

export function AdminTopbar({ userName, userRole, onMenuToggle }: AdminTopbarProps) {
	const [unreadCount, setUnreadCount] = useState(0)
	const [darkMode, setDarkMode] = useState(false)
	const [profileMenuOpen, setProfileMenuOpen] = useState(false)
	const profileMenuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const savedTheme = window.localStorage.getItem('lendgh-theme')
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
		const nextDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark
		// Theme preference is read from browser storage after hydration.
		// oxlint-disable-next-line react/set-state-in-effect
		setDarkMode(nextDarkMode)
		document.documentElement.dataset.theme = nextDarkMode ? 'dark' : 'light'
		void fetch('/api/notifications')
			.then((response) => response.ok ? response.json() : null)
			.then((data: { unreadCount?: number } | null) => setUnreadCount(data?.unreadCount ?? 0))
			.catch(() => setUnreadCount(0))
	}, [])

	useEffect(() => {
		function handleMenuClose(event: MouseEvent) {
			if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setProfileMenuOpen(false)
		}
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') setProfileMenuOpen(false)
		}
		document.addEventListener('mousedown', handleMenuClose)
		document.addEventListener('keydown', handleKeyDown)
		return () => { document.removeEventListener('mousedown', handleMenuClose); document.removeEventListener('keydown', handleKeyDown) }
	}, [])

	function toggleTheme() {
		const nextDarkMode = !darkMode
		setDarkMode(nextDarkMode)
		document.documentElement.dataset.theme = nextDarkMode ? 'dark' : 'light'
		window.localStorage.setItem('lendgh-theme', nextDarkMode ? 'dark' : 'light')
	}

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' })
		window.location.assign('/login')
	}

	return <header className="topbar"><button className="icon-button mobile-menu" onClick={onMenuToggle} aria-label="Toggle menu"><Menu size={20} /></button><div className="topbar-search"><Search size={16} /><input aria-label="Search workspace" placeholder="Search anything..." /></div><div className="top-actions"><button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={darkMode ? 'Use light theme' : 'Use dark theme'} title={darkMode ? 'Use light theme' : 'Use dark theme'}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button><Link href="/notifications" className="icon-button notification" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}><Bell size={19} />{unreadCount > 0 ? <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}</Link><div className="profile-menu" ref={profileMenuRef}><button type="button" className={`top-user ${profileMenuOpen ? 'is-open' : ''}`} onClick={() => setProfileMenuOpen((current) => !current)} aria-expanded={profileMenuOpen} aria-haspopup="menu"><div className="user-avatar small">{userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div className="top-user-copy"><strong>{userName}</strong><small>{userRole.replaceAll('_', ' ')}</small></div><ChevronDown size={14} /></button>{profileMenuOpen ? <div className="profile-menu-panel" role="menu"><div className="profile-menu-heading"><span className="user-avatar small">{userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div><strong>{userName}</strong><small>{userRole.replaceAll('_', ' ')}</small></div></div><Link href="/settings" role="menuitem" onClick={() => setProfileMenuOpen(false)}><UserRound size={16} /> Profile</Link><Link href="/settings/system" role="menuitem" onClick={() => setProfileMenuOpen(false)}><Settings size={16} /> Settings</Link><button type="button" role="menuitem" onClick={() => void logout()}><LogOut size={16} /> Log out</button></div> : null}</div></div></header>
}
