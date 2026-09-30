// Droits par module pour les comptes non administrateurs.
// Les administrateurs du club (accounts.role = 'admin') ont implicitement le niveau 'admin' partout.
export async function up(knex) {
  await knex.schema.createTable('account_permissions', table => {
    table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE')
    table.string('module', 32).notNullable()
    table.string('level', 16).notNullable() // 'user' | 'admin'
    table.primary(['account_id', 'module'])
  })

  // Les bénévoles existants gardent l'accès caisse qu'ils avaient
  const users = await knex('accounts').where({ role: 'user' }).select('id')
  if (users.length)
    await knex('account_permissions').insert(users.map(u => ({ account_id: u.id, module: 'buvette', level: 'user' })))
}

export async function down(knex) {
  await knex.schema.dropTable('account_permissions')
}
