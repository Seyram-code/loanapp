type Attempt = { count: number; resetAt: number }

const attempts = new Map<string, Attempt>()
const windowMs = 15 * 60 * 1000
const maxAttempts = 5

export function checkLoginRateLimit(key: string) {
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }
  if (current.count >= maxAttempts) return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
  current.count += 1
  return { allowed: true, retryAfter: 0 }
}

export function clearLoginRateLimit(key: string) {
  attempts.delete(key)
}
