import { BriefcaseBusiness, CircleDollarSign, FileText, LayoutDashboard, Settings, UsersRound, WalletCards } from 'lucide-react'

export const adminNavigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Loans', icon: WalletCards },
  { label: 'Borrowers', icon: UsersRound },
  { label: 'Repayments', icon: CircleDollarSign },
  { label: 'Reports', icon: FileText },
] as const

export const adminSystemNavigation = [{ label: 'Settings', icon: Settings }] as const
export const brandIcon = BriefcaseBusiness
