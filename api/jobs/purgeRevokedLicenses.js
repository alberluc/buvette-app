import cron from 'node-cron'
import { db } from '../db.js'

async function runPurge() {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)

  const licenses = await db('licenses')
    .where({ revoked: true })
    .where('revoked_at', '<', cutoff)
    .select('key', 'club_name')

  if (licenses.length === 0) {
    console.log('[purge] Aucune licence à supprimer.')
    return
  }

  const keys = licenses.map(l => l.key)

  await db('days').whereIn('license_key', keys).delete()
  await db('accounts').whereIn('license_key', keys).delete()
  await db('licenses').whereIn('key', keys).delete()

  for (const l of licenses) {
    console.log(`[purge] Supprimé — ${l.club_name} (${l.key})`)
  }
  console.log(`[purge] ${licenses.length} licence(s) purgée(s).`)
}

export function startPurgeJob() {
  // Tous les jours à 3h00
  cron.schedule('0 3 * * *', runPurge, { timezone: 'Europe/Paris' })
  console.log('[purge] Job de purge planifié (tous les jours à 3h00)')
}

export { runPurge }
