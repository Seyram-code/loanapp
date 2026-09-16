'use client'

import type { ReactNode } from 'react'

type NotificationDropdownProps = { trigger: ReactNode; children: ReactNode; open: boolean; onToggle: () => void; ariaLabel: string }

export function NotificationDropdown({ trigger, children, open, onToggle, ariaLabel }: NotificationDropdownProps) { return <div className="notification-dropdown"><button type="button" className="icon-button" onClick={onToggle} aria-label={ariaLabel} aria-expanded={open} aria-haspopup="menu">{trigger}</button>{open ? <div className="notification-dropdown-menu" role="menu">{children}</div> : null}</div> }
