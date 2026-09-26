'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { formatGhanaNationalId, isValidGhanaNationalId } from '@/schemas/customer'

type CustomerFormProps = { customerId?: string; onClose: () => void; onCreated: (customerNumber: string) => void }
type ReferrerOption = { id: string; customerNumber: string; name: string }
type FormState = {
  referredByCustomerId: string
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone: string
  alternatePhone: string
  email: string
  address: string
  city: string
  region: string
  nationalId: string
  occupation: string
  employer: string
  monthlyIncome: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  notes: string
}

const ghanaRegions = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Western North',
  'Central',
  'Eastern',
  'Volta',
  'Oti',
  'Northern',
  'North East',
  'Savannah',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
]

const initialForm: FormState = {
  referredByCustomerId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  alternatePhone: '',
  email: '',
  address: '',
  city: '',
  region: '',
  nationalId: '',
  occupation: '',
  employer: '',
  monthlyIncome: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  notes: '',
}

export default function CustomerForm({ customerId, onClose, onCreated }: CustomerFormProps) {
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [referrers, setReferrers] = useState<ReferrerOption[]>([])

  useEffect(() => {
    if (!customerId) {
      fetch('/api/customers?pageSize=50&sort=name&direction=asc')
        .then((response) => response.ok ? response.json() : null)
        .then((result) => setReferrers(result?.customers ?? []))
        .catch(() => setReferrers([]))
    }
    if (!customerId) return
    fetch(`/api/customers/${customerId}/details`).then((response) => response.ok ? response.json() : null).then((result) => {
      if (!result?.customer) {
        setError('Unable to load customer details.')
        return
      }
      const customer = result.customer
      setForm({
        referredByCustomerId: '',
        firstName: customer.firstName ?? '',
        middleName: customer.middleName ?? '',
        lastName: customer.lastName ?? '',
        dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString().slice(0, 10) : '',
        gender: customer.gender ?? '',
        phone: customer.phone ?? '',
        alternatePhone: customer.alternatePhone ?? '',
        email: customer.email ?? '',
        address: customer.address ?? '',
        city: customer.city ?? '',
        region: customer.region ?? '',
        nationalId: customer.nationalId ?? '',
        occupation: customer.occupation ?? '',
        employer: customer.employer ?? '',
        monthlyIncome: customer.monthlyIncome ?? '',
        emergencyContactName: customer.emergencyContactName ?? '',
        emergencyContactPhone: customer.emergencyContactPhone ?? '',
        emergencyContactRelationship: customer.emergencyContactRelationship ?? '',
        notes: customer.notes ?? '',
      })
    }).catch(() => setError('Unable to load customer details.'))
  }, [customerId])

  function update(field: keyof FormState, value: string) {
    if (field === 'nationalId') {
      const nextValue = formatGhanaNationalId(value)
      setForm((current) => ({ ...current, [field]: nextValue }))
      setErrors((current) => ({ ...current, [field]: '' }))
      setError('')
      return
    }

    if (field === 'phone') value = value.replace(/\D/g, '').slice(0, 10)

    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setError('')
  }

  function validate() {
    const next: Record<string, string> = {}

    if (!form.firstName.trim()) next.firstName = 'First name is required'
    if (!form.lastName.trim()) next.lastName = 'Last name is required'

    if (!form.dateOfBirth) {
      next.dateOfBirth = 'Date of birth is required'
    } else {
      const birthDate = new Date(form.dateOfBirth)
      const today = new Date()
      const minimumAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())

      if (Number.isNaN(birthDate.getTime()) || birthDate > minimumAgeDate) {
        next.dateOfBirth = 'Customer must be at least 18 years old'
      }
    }

    if (!form.gender) next.gender = 'Gender is required'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(form.phone)) next.phone = 'Phone number must be exactly 10 digits'
    if (!form.address.trim()) next.address = 'Address is required'
    if (!form.city.trim()) next.city = 'City is required'
    if (!form.region.trim()) next.region = 'Region is required'
    if (!form.nationalId.trim()) {
      next.nationalId = 'National ID is required'
    } else if (!isValidGhanaNationalId(form.nationalId)) {
      next.nationalId = 'National ID must match GHA-123456789-1 format'
    }
    if (!form.occupation.trim()) next.occupation = 'Occupation is required'
    if (!form.employer.trim()) next.employer = 'Employer is required'

    if (!form.monthlyIncome.trim()) {
      next.monthlyIncome = 'Monthly income is required'
    } else if (!Number.isFinite(Number(form.monthlyIncome))) {
      next.monthlyIncome = 'Enter a valid amount'
    }

    if (!form.emergencyContactName.trim()) next.emergencyContactName = 'Emergency contact name is required'
    if (!form.emergencyContactPhone.trim()) next.emergencyContactPhone = 'Emergency contact phone is required'
    if (!form.emergencyContactRelationship.trim()) next.emergencyContactRelationship = 'Emergency contact relationship is required'

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = 'Enter a valid email address'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return

    setPending(true)

    const payload = {
      ...form,
      referredByCustomerId: !customerId && form.referredByCustomerId ? form.referredByCustomerId : undefined,
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || undefined,
      lastName: form.lastName.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      phone: form.phone.trim(),
      alternatePhone: form.alternatePhone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      city: form.city.trim(),
      region: form.region.trim(),
      nationalId: formatGhanaNationalId(form.nationalId.trim()),
      occupation: form.occupation.trim(),
      employer: form.employer.trim(),
      monthlyIncome: Number(form.monthlyIncome),
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactPhone: form.emergencyContactPhone.trim(),
      emergencyContactRelationship: form.emergencyContactRelationship.trim(),
      notes: form.notes.trim() || undefined,
    }

    const response = await fetch(customerId ? `/api/customers/${customerId}` : '/api/customers', {
      method: customerId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || 'Unable to create customer.')
      setPending(false)
      return
    }

    showToast('Customer created successfully.')
    onCreated(result.customerNumber)
    setPending(false)
  }

  const field = (label: string, key: keyof FormState, props: Record<string, string | number | boolean> = {}) => (
    <label className={errors[key] ? 'has-error' : ''}>
      {label}
      <input value={form[key]} onChange={(event) => update(key, event.target.value)} {...props} />
      {errors[key] && <small>{errors[key]}</small>}
    </label>
  )

  return (
    <div className="customer-modal-backdrop">
      <section className="customer-modal customer-form-modal panel">
        <header className="customer-form-header">
          <div>
            <p className="eyebrow">Customer record</p>
            <h2>{customerId ? 'Edit customer' : 'Add customer'}</h2>
            <p>Customer number will be generated automatically.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close form">
            <X size={18} />
          </button>
        </header>

        <form className="customer-form" onSubmit={submit}>
          {!customerId && <label>
            Referred by (optional)
            <select value={form.referredByCustomerId} onChange={(event) => update('referredByCustomerId', event.target.value)}>
              <option value="">Select an existing customer</option>
              {referrers.map((referrer) => <option key={referrer.id} value={referrer.id}>{referrer.customerNumber} - {referrer.name}</option>)}
            </select>
          </label>}

          <div className="settings-form-row">
            {field('First name', 'firstName', { required: true })}
            {field('Middle name', 'middleName')}
          </div>

          <div className="settings-form-row">
            {field('Last name', 'lastName', { required: true })}
            {field('Date of birth', 'dateOfBirth', {
              type: 'date',
              required: true,
              max: new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().slice(0, 10),
            })}
          </div>

          <div className="settings-form-row">
            <label className={errors.gender ? 'has-error' : ''}>
              Gender
              <select value={form.gender} onChange={(event) => update('gender', event.target.value)} required>
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
              {errors.gender && <small>{errors.gender}</small>}
            </label>
            {field('National ID', 'nationalId', { required: true, placeholder: 'GHA-123456789-1', inputMode: 'numeric' })}
          </div>

          <div className="settings-form-row">
            {field('Phone number', 'phone', { required: true, type: 'tel', inputMode: 'numeric', maxLength: 10, pattern: '[0-9]{10}', placeholder: '0241234567' })}
            {field('Alternate phone', 'alternatePhone')}
          </div>

          <div className="settings-form-row">
            {field('Email', 'email', { type: 'email' })}
            {field('Monthly income', 'monthlyIncome', { type: 'number', min: '0', step: '0.01', required: true })}
          </div>

          {field('Address', 'address', { required: true })}

          <div className="settings-form-row">
            {field('City', 'city', { required: true })}
            <label className={errors.region ? 'has-error' : ''}>
              Region
              <select value={form.region} onChange={(event) => update('region', event.target.value)} required>
                <option value="">Select region</option>
                {ghanaRegions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              {errors.region && <small>{errors.region}</small>}
            </label>
          </div>

          <div className="settings-form-row">
            {field('Occupation', 'occupation', { required: true })}
            {field('Employer', 'employer', { required: true })}
          </div>

          <div className="settings-form-row">
            {field('Emergency contact name', 'emergencyContactName', { required: true })}
            {field('Emergency contact phone', 'emergencyContactPhone', { required: true })}
          </div>

          {field('Emergency contact relationship', 'emergencyContactRelationship', { required: true })}

          <label>
            Notes
            <textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} rows={3} />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="customer-form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit" disabled={pending}>
              {pending ? 'Saving...' : customerId ? 'Save changes' : 'Create customer'} <Check size={16} />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
