import cron from 'node-cron'
import { db } from '../db.js'
import { buildMonthReport } from '../lib/reportData.js'
import { generatePdf, monthLabel } from '../lib/reportPdf.js'
import { sendReport } from '../lib/mailer.js'
import { reportEmailHtml } from '../lib/emailTemplates.js'

function previousMonth() {
  const now = new Date()
  const month = now.getMonth() === 0 ? 12 : now.getMonth()
  const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  return { year, month }
}

async function runMonthlyReports() {
  const { year, month } = previousMonth()
  const label = monthLabel(year, month)
  console.log(`[report] Génération des bilans ${label}…`)

  const licenses = await db('licenses')
    .where({ revoked: false })
    .whereNotNull('email')
    .whereNot({ email: '' })

  let ok = 0
  let ko = 0

  for (const license of licenses) {
    try {
      const data        = await buildMonthReport(license.key, year, month)
      const pdf         = await generatePdf(data, 'summary')
      const pdfGrid     = await generatePdf(data, 'grid')

      await sendReport({
        to: license.email,
        clubName: license.club_name,
        monthLabel: label,
        html: reportEmailHtml({ clubName: license.club_name, label, data }),
        pdfBuffer: pdf,
        pdfGridBuffer: pdfGrid,
      })

      console.log(`[report] OK — ${license.club_name} <${license.email}>`)
      ok++
    } catch (err) {
      console.error(`[report] ERREUR — ${license.club_name}: ${err.message}`)
      ko++
    }
  }

  console.log(`[report] Terminé — ${ok} envoyés, ${ko} erreurs`)
}

export function startMonthlyReportJob() {
  // 1er de chaque mois à 8h00
  cron.schedule('0 8 1 * *', runMonthlyReports, { timezone: 'Europe/Paris' })
  console.log('[report] Job mensuel planifié (1er du mois à 8h00)')
}

export { runMonthlyReports }
