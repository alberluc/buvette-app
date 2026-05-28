import { randomBytes, pbkdf2Sync } from 'crypto'

export function hashPassword(salt, password) {
  return pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex')
}

export function generateSalt() {
  return randomBytes(16).toString('hex')
}
