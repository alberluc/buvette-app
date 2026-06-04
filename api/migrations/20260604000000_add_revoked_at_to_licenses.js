export async function up(knex) {
  await knex.schema.table('licenses', table => {
    table.timestamp('revoked_at').nullable().defaultTo(null)
  })
}

export async function down(knex) {
  await knex.schema.table('licenses', table => {
    table.dropColumn('revoked_at')
  })
}
