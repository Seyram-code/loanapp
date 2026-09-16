export type CustomerStatus = 'ACTIVE' | 'INACTIVE'
export type CustomerRow = { id: string; customerNumber: string; name: string; phone: string; email: string | null; occupation: string | null; activeLoans: number; totalOutstanding: string; status: CustomerStatus; createdAt: string }
export type CustomerPage = { customers: CustomerRow[]; total: number; page: number; pageSize: number; totalPages: number }
