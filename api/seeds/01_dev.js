import { randomUUID } from 'crypto'
import { pbkdf2Sync, randomBytes } from 'crypto'
import { generateHistoricalDays, generateTodayOpen } from '../lib/dayGenerator.js'

const LICENSE_KEY = 'DEV0-DEV0-DEV0-0001'
const CASH_FLOAT  = 50

const PRODUCTS = [
  { id: 'biere', name: 'Bière',      price: 2, emoji: '🍺', color: '#C99A3B' },
  { id: 'vin',   name: 'Vin',        price: 1, emoji: '🍷', color: '#8E2A3A' },
  { id: 'soda',  name: 'Soda / Eau', price: 1, emoji: '🥤', color: '#2F6BBB' },
  { id: 'box',   name: 'Box',        price: 1, emoji: '🍿', color: '#5E4632' },
]

// [prénom, nom, ville, adhérent depuis, statut]
const MEMBERS = [
  ['Jean',     'Bernard',  'Lyon',          '2019-09-01', 'active'],
  ['Claire',   'Petit',    'Villeurbanne',  '2021-09-01', 'active'],
  ['Hugo',     'Robert',   'Lyon',          '2022-09-01', 'active'],
  ['Émilie',   'Richard',  'Bron',          '2020-09-01', 'active'],
  ['Lucas',    'Durand',   'Vénissieux',    '2023-09-01', 'active'],
  ['Nathalie', 'Moreau',   'Lyon',          '2018-09-01', 'inactive'],
  ['Paul',     'Simon',    'Caluire',       '2024-09-01', 'active'],
  ['Léa',      'Laurent',  'Villeurbanne',  '2025-09-01', 'active'],
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
    key:        LICENSE_KEY,
    club_name:  'Pétanque des Cailloux Ronds',
    email:      'tresorier@petanque-cailloux.fr',
    plan:       'annual',
    expires_at: '2027-12-31',
    products:   JSON.stringify(PRODUCTS),
    cash_float: CASH_FLOAT,
    is_demo:    false,
    revoked:    false,
    modules:    JSON.stringify(['buvette', 'membres']),
  })

  const adminSalt = generateSalt()
  const userSalt  = generateSalt()
  const userId    = randomUUID()
  const secretarySalt = generateSalt()
  const secretaryId   = randomUUID()
  await knex('accounts').insert([
    {
      id:            randomUUID(),
      license_key:   LICENSE_KEY,
      name:          'Marie Dupont',
      salt:          adminSalt,
      password_hash: hashPassword(adminSalt, 'admin'),
      role:          'admin',
    },
    {
      id:            userId,
      license_key:   LICENSE_KEY,
      name:          'Thomas Lebrun',
      salt:          userSalt,
      password_hash: hashPassword(userSalt, '1234'),
      role:          'user',
    },
    {
      id:            secretaryId,
      license_key:   LICENSE_KEY,
      name:          'Sophie Martin',
      salt:          secretarySalt,
      password_hash: hashPassword(secretarySalt, '5678'),
      role:          'user',
    },
  ])
  // L'admin a tous les droits implicitement ; le bénévole a l'accès caisse ; la secrétaire gère les membres
  await knex('account_permissions').insert([
    { account_id: userId,      module: 'buvette', level: 'user' },
    { account_id: secretaryId, module: 'membres', level: 'admin' },
  ])

  // Membres fictifs (supprimés en cascade avec la licence)
  const consent = new Date()
  await knex('members').insert(MEMBERS.map(([first_name, last_name, city, member_since, status]) => ({
    id: randomUUID(), license_key: LICENSE_KEY, first_name, last_name, city, member_since, status,
    email: `${first_name}.${last_name}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '') + '@example.test',
    phone: '06 00 00 00 00',
    consent_at: status === 'active' ? consent : null,
  })))

  const historicalDays = generateHistoricalDays(LICENSE_KEY, PRODUCTS, CASH_FLOAT)
  const today          = generateTodayOpen(LICENSE_KEY, PRODUCTS, CASH_FLOAT)
  await knex('days').insert([...historicalDays, today])

  const tournaments  = historicalDays.filter(d => JSON.parse(d.orders).length >= 35).length
  const autoClosed   = historicalDays.filter(d => d.auto_closed).length
  const withCounting = historicalDays.filter(d => d.cash_counted !== null).length

  console.log(`✓ Licence : ${LICENSE_KEY}  (${CASH_FLOAT} € fond de caisse)`)
  console.log(`✓ Comptes : Marie Dupont (admin/admin) · Thomas Lebrun (caissier/1234) · Sophie Martin (secrétaire/5678)`)
  console.log(`✓ Membres : ${MEMBERS.length} fictifs`)
  console.log(`✓ Journées : ${historicalDays.length} historiques + 1 ouverte`)
  console.log(`  dont ${tournaments} compétitions, ${autoClosed} clôtures auto, ${withCounting} avec comptage`)
}
