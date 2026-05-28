export async function up(knex) {
  await knex.schema.createTable('licenses', table => {
    table.increments('id')
    table.string('key', 19).unique().notNullable()
    table.string('club_name').notNullable()
    table.string('email')
    table.enu('plan', ['monthly', 'annual']).notNullable()
    table.date('expires_at').notNullable()
    table.boolean('revoked').notNullable().defaultTo(false)
    table.timestamps(true, true) // created_at, updated_at
  })
}

export async function down(knex) {
  await knex.schema.dropTable('licenses')
}
