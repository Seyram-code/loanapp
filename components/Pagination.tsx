'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  page: number
  total: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function Pagination({ page, total, totalPages, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  return <nav className="directory-footer" aria-label="Pagination"><span aria-live="polite">Page {page} of {totalPages || 1} · {total} total</span><div className="pagination-controls">{onPageSizeChange ? <label>Rows <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} aria-label="Page size"><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></label> : null}<button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></nav>
}
