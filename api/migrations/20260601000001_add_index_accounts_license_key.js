export async function up(knex) {
  await knex.schema.table('accounts', table => {
    table.index(['license_key'], 'accounts_license_key_idx')
  })
}

export async function down(knex) {
  await knex.schema.table('accounts', table => {
    table.dropIndex(['license_key'], 'accounts_license_key_idx')
  })
}
