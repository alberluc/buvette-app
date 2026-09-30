export async function up(knex) {
  await knex.schema.table('licenses', table => {
    table.jsonb('modules').notNullable().defaultTo(JSON.stringify(['buvette']))
  })
}

export async function down(knex) {
  await knex.schema.table('licenses', table => {
    table.dropColumn('modules')
  })
}
