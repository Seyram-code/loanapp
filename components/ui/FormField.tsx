import type { InputHTMLAttributes, ReactNode } from 'react'

type FormFieldProps = { label: string; error?: string; children: ReactNode }

export function FormField({ label, error, children }: FormFieldProps) { return <label className={error ? 'has-error' : ''}><span>{label}</span>{children}{error ? <small>{error}</small> : null}</label> }
export type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
export function InputField({ label, error, ...props }: InputFieldProps) { return <FormField label={label} error={error}><input {...props} /></FormField> }
