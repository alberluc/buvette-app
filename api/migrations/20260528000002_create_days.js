export async function up(knex) {
  await knex.schema.createTable('days', table => {
    table.increments('id')
    table.string('license_key', 19).references('key').inTable('licenses').notNullable()
    table.string('day_key', 10).notNullable()   // YYYY-MM-DD
    table.string('date').notNullable()           // chaîne affichable ex: "Samedi 3 mai 2026"
    table.jsonb('orders').notNullable().defaultTo('[]')
    table.boolean('day_closed').notNullable().defaultTo(false)
    table.boolean('auto_closed').notNullable().defaultTo(false)
    table.decimal('cash_counted', 10, 2).nullable()
    table.timestamps(true, true)
    table.unique(['license_key', 'day_key'])
  })
}

export async function down(knex) {
  await knex.schema.dropTable('days')
}
