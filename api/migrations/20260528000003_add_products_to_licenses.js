const DEFAULT_PRODUCTS = [
  { id: 'biere', name: 'Bière',      price: 2, emoji: '🍺', color: '#C99A3B' },
  { id: 'vin',   name: 'Vin',        price: 1, emoji: '🍷', color: '#8E2A3A' },
  { id: 'soda',  name: 'Soda / Eau', price: 1, emoji: '🥤', color: '#2F6BBB' },
  { id: 'box',   name: 'Box',        price: 1, emoji: '🍿', color: '#5E4632' },
]

export async function up(knex) {
  await knex.schema.table('licenses', table => {
    table.jsonb('products').notNullable().defaultTo(JSON.stringify(DEFAULT_PRODUCTS))
  })
}

export async function down(knex) {
  await knex.schema.table('licenses', table => {
    table.dropColumn('products')
  })
}
