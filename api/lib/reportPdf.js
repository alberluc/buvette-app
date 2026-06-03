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

  <div class="footer">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · Assolyte</div>
</body>
</html>`
}

function gridDateLabel(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' })
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), dateStr }
}

function buildHtmlGrid(data) {
  const { clubName, year, month, products, days, grandTotal, grandEspeces, grandCarte, grandOrderCount, grandProducts } = data
  const label = monthLabel(year, month)

  const activeProductIds = products
    .filter(p => (grandProducts[p.id]?.qty ?? 0) > 0)
    .map(p => p.id)

  const productHeaders = activeProductIds
    .map(pid => `<th class="num">${grandProducts[pid]?.name ?? pid}</th>`)
    .join('')

  const bodyRows = days.flatMap(day => {
    const dayOrders = day.orders || []
    if (dayOrders.length === 0) return []

    const mouvements = day.mouvements || []
    const hasCash = day.cashCounted != null
    const totalRowspan = dayOrders.length + 1 + mouvements.length + (hasCash ? 2 : 0)
    const { weekday, dateStr } = gridDateLabel(day.dayKey)

    const orderRows = dayOrders.map((order, i) => {
      const cells = activeProductIds
        .map(pid => `<td class="num">${order.items[pid] ? order.items[pid] : ''}</td>`)
        .join('')
      return `<tr>
        ${i === 0
          ? `<td rowspan="${totalRowspan}" class="date-cell"><strong>${dateStr}</strong><span class="date-day">${weekday}</span></td>`
          : ''}
        ${cells}
        <td class="num total-cell">${eur(order.total)}</td>
      </tr>`
    })

    const mouvTotal = mouvements.reduce((s, m) => s + m.amount, 0)

    const mouvementRows = mouvements.map(m => `<tr class="mouvement-row ${m.amount >= 0 ? 'entree' : 'sortie'}">
      <td colspan="${activeProductIds.length}" class="mouvement-label">${m.label}</td>
      <td class="num mouvement-amount">${m.amount >= 0 ? '+' : ''}${eur(m.amount)}</td>
    </tr>`)

    const daySumCells = activeProductIds
      .map(pid => `<td class="num day-sum-cell">${day.products[pid]?.qty || ''}</td>`)
      .join('')

    const cashRows = hasCash ? (() => {
      const ecart = day._ecart ?? (day.cashCounted - (day.especes + mouvTotal))
      const ecartClass = ecart >= 0 ? 'surplus' : 'manque'
      return [
        `<tr class="caisse-row">
          <td colspan="${activeProductIds.length}" class="caisse-label">Caisse comptée</td>
          <td class="num caisse-amount">${eur(day.cashCounted)}</td>
        </tr>`,
        `<tr class="ecart-row ${ecartClass} day-end">
          <td colspan="${activeProductIds.length}" class="ecart-label">Écart</td>
          <td class="num ecart-amount">${ecart >= 0 ? '+' : ''}${eur(ecart)}</td>
        </tr>`,
      ]
    })() : []

    const lastDayTotalClass = hasCash ? 'day-total-row' : 'day-total-row day-end'
    const dayTotalRowFinal = `<tr class="${lastDayTotalClass}">
      ${daySumCells}
      <td class="num day-sum-cell day-grand">${eur(day.dayTotal + mouvTotal)}</td>
    </tr>`

    return [...orderRows, ...mouvementRows, dayTotalRowFinal, ...cashRows]
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
  @page { size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #1a1a1a; padding: 12mm 10mm; }
  h1 { font-size: 16px; margin-bottom: 2px; }
  .subtitle { font-size: 11px; color: #555; margin-bottom: 8mm; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8mm; }
  th { background: #2c3e50; color: #fff; padding: 4px 6px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  th.num, td.num { text-align: center; }
  td { padding: 2px 6px; border-bottom: 1px solid #ebebeb; border-right: 1px solid #ddd; vertical-align: middle; }
  td:last-child { border-right: none; }
  .total-cell, .day-grand { text-align: right; }
  .date-cell { width: 85px; border-right: 2px solid #ddd; font-size: 8px; color: #333; vertical-align: top; padding-top: 4px; background: #f8f8f8; }
  .date-cell strong { display: block; font-size: 9px; font-weight: bold; }
  .date-day { display: block; font-size: 8px; color: #888; }
  .total-cell { font-weight: bold; border-left: 2px solid #ddd; white-space: nowrap; }
  .day-total-row td { background: #f0f0f0; border-top: 1px solid #ccc; border-bottom: 1px solid #eee; }
  .day-end td, .ecart-row.day-end td, .day-total-row.day-end td { border-bottom: 3px solid #555; }
  .day-sum-cell { font-weight: bold; font-size: 9px; }
  .day-grand { border-left: 2px solid #ddd; color: #1a1a1a; }
  .mouvement-row td { border-bottom: 1px solid #eee; padding: 2px 6px; }
  .mouvement-row.sortie td { color: #c0392b; }
  .mouvement-row.entree td { color: #27ae60; }
  .mouvement-label { font-size: 8px; }
  .mouvement-amount { font-size: 8px; font-weight: bold; white-space: nowrap; border-left: 2px solid #ddd; }
  .caisse-row td, .ecart-row td { padding: 2px 6px; font-size: 8px; border-bottom: 1px solid #eee; }
  .caisse-row td { background: #f5f5f5; color: #444; }
  .caisse-label, .ecart-label { font-style: italic; }
  .caisse-amount { font-weight: bold; border-left: 2px solid #ddd; white-space: nowrap; }
  .ecart-row.surplus td { background: #f5fff8; }
  .ecart-row.manque td { background: #fff5f5; }
  .ecart-amount { font-weight: bold; border-left: 2px solid #ddd; white-space: nowrap; }
  .ecart-row.surplus .ecart-amount { color: #27ae60; }
  .ecart-row.manque .ecart-amount { color: #c0392b; }
  .grand-table th { background: #1a5276; }
  .grand-total { font-size: 12px; font-weight: bold; text-align: right; margin-top: 4mm; }
  .footer { margin-top: 8mm; font-size: 8px; color: #aaa; border-top: 1px solid #eee; padding-top: 3mm; }
  .empty { text-align: center; color: #888; padding: 20px; }
</style>
</head>
<body>
  <h1>Bilan mensuel — ${label} · Détail des commandes</h1>
  <div class="subtitle">${clubName} · ${grandOrderCount} commande${grandOrderCount > 1 ? 's' : ''} · Total : ${eur(grandTotal)} (Espèces : ${eur(grandEspeces)} / Carte : ${eur(grandCarte)})</div>

  ${days.length === 0 ? `<p class="empty">Aucune activité ce mois-ci.</p>` : `
  <table>
    <thead>
      <tr>
        <th>Date</th>
        ${productHeaders}
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
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

  <div class="footer">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · Assolyte</div>
</body>
</html>`
}

export async function generatePdf(data, format = 'summary') {
  const html = format === 'grid' ? buildHtmlGrid(data) : buildHtml(data)

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
