export async function up(knex) {
  await knex.schema.alterTable('days', table => {
    table.dropColumn('label')
  })
}

export async function down(knex) {
  await knex.schema.alterTable('days', table => {
    table.string('label').notNullable().defaultTo('')
  })
}
