import { promisify } from 'node:util'
import { randomBytes, scrypt as nodeScrypt, scryptSync, timingSafeEqual } from 'node:crypto'

const scrypt = promisify(nodeScrypt)

export async function verifyPassword(password: string, encodedHash: string) {
  const [salt, storedKey] = encodedHash.split(':')
  if (!salt || !storedKey) return false
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  const expectedKey = Buffer.from(storedKey, 'hex')
  return expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey)
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}
