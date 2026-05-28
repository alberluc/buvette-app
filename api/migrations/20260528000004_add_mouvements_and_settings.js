export async function up(knex) {
  await knex.schema.table('days', table => {
    table.jsonb('mouvements').notNullable().defaultTo('[]')
  })
  await knex.schema.table('licenses', table => {
    table.decimal('cash_float', 10, 2).notNullable().defaultTo(0)
  })
}

export async function down(knex) {
  await knex.schema.table('days', table => {
    table.dropColumn('mouvements')
  })
  await knex.schema.table('licenses', table => {
    table.dropColumn('cash_float')
  })
}
