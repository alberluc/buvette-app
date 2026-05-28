export async function up(knex) {
  await knex.schema.createTable('accounts', table => {
    table.uuid('id').primary()
    table.string('license_key', 19).references('key').inTable('licenses').notNullable()
    table.string('name').notNullable()
    table.string('salt', 32).notNullable()
    table.string('password_hash', 64).notNullable()
    table.enu('role', ['admin', 'user']).notNullable().defaultTo('user')
    table.timestamps(true, true)
  })
}

export async function down(knex) {
  await knex.schema.dropTable('accounts')
}
