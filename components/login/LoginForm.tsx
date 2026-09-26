'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (!response.ok) {
      setError('Invalid admin credentials.')
      setPending(false)
      return
    }
    router.replace('/dashboard')
    router.refresh()
  }

  return <main className="login-page"><section className="login-panel"><div className="login-brand"><span className="brand-mark"><BriefcaseBusiness size={18} /></span><span>lend<span>gh</span></span></div><p className="eyebrow">Admin workspace</p><h1>Sign in to manage lending.</h1><p className="login-copy">Access is limited to authorized administrators. Customers do not log in to this system.</p><form onSubmit={handleSubmit}><label>Email address<div className="login-input"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div></label><label>Password<div className="login-input"><LockKeyhole size={16} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required minLength={8} /><button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="primary-button login-button" type="submit" disabled={pending}>{pending ? 'Signing in...' : 'Sign in'} {!pending && <ArrowRight size={17} />}</button></form><p className="login-footer">Admin-only loan operations · lendgh</p></section></main>
}