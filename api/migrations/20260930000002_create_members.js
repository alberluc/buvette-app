// Membres du club — entité du socle, référencée plus tard par d'autres modules (cotisations, événements…).
// Supprimés en cascade avec la licence (purge des licences révoquées, suppression des démos).
export async function up(knex) {
  await knex.schema.createTable('members', table => {
    table.uuid('id').primary()
    table.string('license_key', 19).notNullable().references('key').inTable('licenses').onDelete('CASCADE')
    table.string('first_name').notNullable()
    table.string('last_name').notNullable()
    table.string('email')
    table.string('phone', 32)
    table.string('address')
    table.string('postal_code', 10)
    table.string('city')
    table.date('birth_date')
    table.date('member_since')
    table.string('status', 16).notNullable().defaultTo('active') // 'active' | 'inactive'
    table.text('notes')
    table.timestamp('consent_at') // consentement RGPD au traitement des données (null = non recueilli)
    table.timestamps(true, true)
    table.index(['license_key', 'last_name'])
  })
}

export async function down(knex) {
  await knex.schema.dropTable('members')
}
