import { randomUUID } from 'crypto'
import { pbkdf2Sync, randomBytes } from 'crypto'
import { generateHistoricalDays, generateTodayOpen } from '../lib/dayGenerator.js'

const LICENSE_KEY = 'DEV0-DEV0-DEV0-0001'

const PRODUCTS = [
  { id: 'biere', name: 'Bière',      price: 2, emoji: '🍺', color: '#C99A3B' },
  { id: 'vin',   name: 'Vin',        price: 1, emoji: '🍷', color: '#8E2A3A' },
  { id: 'soda',  name: 'Soda / Eau', price: 1, emoji: '🥤', color: '#2F6BBB' },
  { id: 'box',   name: 'Box',        price: 1, emoji: '🍿', color: '#5E4632' },
]

function hashPassword(salt, password) {
  return pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex')
}

function generateSalt() {
  return randomBytes(16).toString('hex')
}

export async function seed(knex) {
  await knex('days').where({ license_key: LICENSE_KEY }).delete()
  await knex('accounts').where({ license_key: LICENSE_KEY }).delete()
  await knex('licenses').where({ key: LICENSE_KEY }).delete()

  await knex('licenses').insert({
    key: LICENSE_KEY,
    club_name: 'Club Dev Local',
    email: 'dev@local.test',
    plan: 'annual',
    expires_at: '2027-12-31',
    products: JSON.stringify(PRODUCTS),
    cash_float: 50,
    is_demo: false,
    revoked: false,
  })

  const adminSalt = generateSalt()
  const userSalt = generateSalt()
  await knex('accounts').insert([
    {
      id: randomUUID(),
      license_key: LICENSE_KEY,
      name: 'Admin',
      salt: adminSalt,
      password_hash: hashPassword(adminSalt, 'admin'),
      role: 'admin',
    },
    {
      id: randomUUID(),
      license_key: LICENSE_KEY,
      name: 'Caissier',
      salt: userSalt,
      password_hash: hashPassword(userSalt, '1234'),
      role: 'user',
    },
  ])

  const historicalDays = generateHistoricalDays(LICENSE_KEY, PRODUCTS)
  const today = generateTodayOpen(LICENSE_KEY, PRODUCTS)
  await knex('days').insert([...historicalDays, today])

  console.log(`✓ Licence : ${LICENSE_KEY}`)
  console.log(`✓ Comptes : Admin (admin/admin) · Caissier (caissier/1234)`)
  console.log(`✓ Journées : ${historicalDays.length} historiques + 1 ouverte aujourd'hui`)
}
