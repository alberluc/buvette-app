export async function up(knex) {
  await knex.schema.table('licenses', table => {
    table.boolean('is_demo').notNullable().defaultTo(false)
  })
}

export async function down(knex) {
  await knex.schema.table('licenses', table => {
    table.dropColumn('is_demo')
  })
}
