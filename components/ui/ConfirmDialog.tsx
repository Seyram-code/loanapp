'use client'

import { Modal } from './Modal'

type ConfirmDialogProps = { open: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmDialogProps) { return <Modal open={open} title={title} onClose={onCancel} className="confirm-dialog"><div className="confirm-dialog-message"><span className="confirm-dialog-icon" aria-hidden="true">!</span><p>{message}</p></div><div className="confirm-dialog-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button type="button" className="primary-button" onClick={onConfirm}>{confirmLabel}</button></div></Modal> }
