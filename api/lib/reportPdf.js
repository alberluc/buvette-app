import puppeteer from 'puppeteer'

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function monthLabel(year, month) {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

function eur(n) {
  return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €'
}

function buildHtml(data) {
  const { clubName, year, month, products, days, grandTotal, grandEspeces, grandCarte, grandOrderCount, grandProducts } = data
  const label = monthLabel(year, month)

  const activeProductIds = products
    .filter(p => (grandProducts[p.id]?.qty ?? 0) > 0)
    .map(p => p.id)

  const dayRows = days.map(day => {
    const productLines = activeProductIds
      .filter(pid => day.products[pid]?.qty > 0)
      .map((pid, i) => {
        const stat = day.products[pid]
        return `
          <tr class="product-row">
            ${i === 0 ? `<td rowspan="${activeProductIds.filter(pid => day.products[pid]?.qty > 0).length + 1}" class="date-cell">
              <strong>${day.date}</strong>
              ${day.label ? `<br><span class="label">${day.label}</span>` : ''}
            </td>` : ''}
            <td>${stat.name}</td>
            <td class="num">${stat.qty}</td>
            <td class="num">${eur(stat.total)}</td>
          </tr>`
      }).join('')

    return `
      ${productLines}
      <tr class="day-total-row">
        <td colspan="2"><em>${day.orderCount} commande${day.orderCount > 1 ? 's' : ''} — Espèces : ${eur(day.especes)} / Carte : ${eur(day.carte)}</em></td>
        <td class="num total-cell">${eur(day.dayTotal)}</td>
      </tr>`
  }).join('')

  const grandRows = activeProductIds.map(pid => {
    const stat = grandProducts[pid]
    if (!stat?.qty) return ''
    return `<tr><td colspan="2">${stat.name}</td><td class="num">${stat.qty}</td><td class="num">${eur(stat.total)}</td></tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20mm 15mm; }
  h1 { font-size: 18px; margin-bottom: 2px; }
  .subtitle { font-size: 12px; color: #555; margin-bottom: 10mm; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8mm; }
  th { background: #2c3e50; color: #fff; padding: 5px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  th.num, td.num { text-align: right; }
  td { padding: 4px 8px; border-bottom: 1px solid #e8e8e8; vertical-align: top; }
  .date-cell { width: 130px; border-right: 2px solid #ddd; font-size: 10px; color: #333; vertical-align: middle; }
  .date-cell strong { display: block; font-size: 11px; }
  .label { color: #888; font-style: italic; }
  .product-row td { background: #fff; }
  .day-total-row td { background: #f5f5f5; font-size: 10px; color: #444; padding: 3px 8px 6px; border-bottom: 2px solid #ccc; }
  .total-cell { font-weight: bold; font-size: 11px; color: #1a1a1a; }
  .grand-table th { background: #1a5276; }
  .grand-total { font-size: 13px; font-weight: bold; text-align: right; margin-top: 4mm; }
  .footer { margin-top: 10mm; font-size: 9px; color: #aaa; border-top: 1px solid #eee; padding-top: 3mm; }
  .empty { text-align: center; color: #888; padding: 20px; }
</style>
</head>
<body>
  <h1>Bilan mensuel — ${label}</h1>
  <div class="subtitle">${clubName} · ${grandOrderCount} commande${grandOrderCount > 1 ? 's' : ''} · Total : ${eur(grandTotal)} (Espèces : ${eur(grandEspeces)} / Carte : ${eur(grandCarte)})</div>

  ${days.length === 0 ? `<p class="empty">Aucune activité ce mois-ci.</p>` : `
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Produit</th>
        <th class="num">Qté</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${dayRows}
    </tbody>
  </table>

  <table class="grand-table">
    <thead>
      <tr>
        <th colspan="2">Récapitulatif mensuel</th>
        <th class="num">Qté</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${grandRows}
    </tbody>
  </table>

  <div class="grand-total">TOTAL MOIS : ${eur(grandTotal)}</div>
  `}

  <div class="footer">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · Buvette Club</div>
</body>
</html>`
}

export async function generatePdf(data) {
  const html = buildHtml(data)

  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
  }
  const browser = await puppeteer.launch(launchOpts)

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
    })
    return pdf
  } finally {
    await browser.close()
  }
}
