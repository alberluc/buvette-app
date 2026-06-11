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

  const extraCols = 1
  const labelColspan = activeProductIds.length + extraCols

  const bodyGroups = days.map(day => {
    const dayOrders = day.orders || []
    if (dayOrders.length === 0) return ''

    const mouvements = day.mouvements || []
    const hasCash = day.cashCounted != null
    const mouvTotal = mouvements.reduce((s, m) => s + m.amount, 0)
    const openBalance = day._base ?? 0
    const theoreticalBalance = day._attendu ?? (openBalance + day.especes + mouvTotal)
    const especesOrders = dayOrders.filter(o => o.payment === 'especes')
    const totalRowspan = 1 + especesOrders.length + mouvements.length + 1 + 1 + (hasCash ? 2 : 0)
    const { weekday, dateStr } = gridDateLabel(day.dayKey)

    const openRow = `<tr class="balance-row open-balance-row">
      <td rowspan="${totalRowspan}" class="date-cell"><strong>${dateStr}</strong><span class="date-day">${weekday}</span></td>
      <td colspan="${labelColspan}" class="balance-label">Solde d'ouverture</td>
      <td class="num balance-amount">${eur(openBalance)}</td>
    </tr>`

    const orderRows = especesOrders.map(order => {
      const cells = activeProductIds
        .map(pid => `<td class="num">${order.items[pid] ? order.items[pid] : ''}</td>`)
        .join('')
      return `<tr>
        <td class="num time-cell">${order.time ?? ''}</td>
        ${cells}
        <td class="num total-cell">${eur(order.total)}</td>
      </tr>`
    })

    const mouvementRows = mouvements.map(m => `<tr class="mouvement-row ${m.amount >= 0 ? 'entree' : 'sortie'}">
      <td colspan="${labelColspan}" class="mouvement-label">${m.label}</td>
      <td class="num mouvement-amount">${m.amount >= 0 ? '+' : ''}${eur(m.amount)}</td>
    </tr>`)

    const daySumCells = activeProductIds
      .map(pid => `<td class="num day-sum-cell">${day.products[pid]?.qty || ''}</td>`)
      .join('')

    const theoreticalRow = `<tr class="balance-row theoretical-row">
      <td colspan="${labelColspan}" class="balance-label">Solde théorique</td>
      <td class="num balance-amount">${eur(theoreticalBalance)}</td>
    </tr>`

    const cashRows = hasCash ? (() => {
      const ecart = day._ecart ?? (day.cashCounted - theoreticalBalance)
      const ecartClass = ecart >= 0 ? 'surplus' : 'manque'
      return [
        `<tr class="caisse-row">
          <td colspan="${labelColspan}" class="caisse-label">Caisse comptée</td>
          <td class="num caisse-amount">${eur(day.cashCounted)}</td>
        </tr>`,
        `<tr class="ecart-row ${ecartClass} day-end">
          <td colspan="${labelColspan}" class="ecart-label">Écart</td>
          <td class="num ecart-amount">${ecart >= 0 ? '+' : ''}${eur(ecart)}</td>
        </tr>`,
      ]
    })() : []

    const lastDayTotalClass = 'day-total-row'
    const dayTotalRowFinal = `<tr class="${lastDayTotalClass}">
      <td colspan="${extraCols}"></td>
      ${daySumCells}
      <td class="num day-sum-cell day-grand">${eur(day.especes)}</td>
    </tr>`

    const endRows = hasCash
      ? [dayTotalRowFinal, theoreticalRow, ...cashRows]
      : [dayTotalRowFinal, theoreticalRow.replace('balance-row theoretical-row', 'balance-row theoretical-row day-end')]

    const rows = [openRow, ...orderRows, ...mouvementRows, ...endRows].join('')
    return `<tbody class="day-group">${rows}</tbody>`
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
  thead { display: table-header-group; }
  tbody.day-group { page-break-inside: avoid; }
  th { background: #2c3e50; color: #fff; padding: 4px 6px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  th.num, td.num { text-align: center; }
  th.total-col { text-align: right; }
  td { padding: 2px 6px; border-bottom: 1px solid #ebebeb; border-right: 1px solid #ddd; vertical-align: middle; }
  td:last-child { border-right: none; }
  td.total-cell, td.day-grand, td.mouvement-amount, td.caisse-amount, td.ecart-amount, td.balance-amount { text-align: right; }
  .time-cell { width: 28px; color: #999; font-size: 8px; }
  .pay-cell { width: 16px; font-weight: bold; font-size: 8px; }
  .pay-esp { color: #555; }
  .pay-crt { color: #2060b0; }
  .date-cell { width: 85px; border-right: 2px solid #ddd; font-size: 8px; color: #333; vertical-align: top; padding-top: 4px; background: #f8f8f8; }
  .date-cell strong { display: block; font-size: 9px; font-weight: bold; }
  .date-day { display: block; font-size: 8px; color: #888; }
  .total-cell { font-weight: bold; border-left: 2px solid #ddd; white-space: nowrap; }
  .day-total-row td { background: #f0f0f0; border-top: 1px solid #ccc; border-bottom: 1px solid #eee; }
  .day-end td, .ecart-row.day-end td, .day-total-row.day-end td, .balance-row.day-end td { border-bottom: 5px solid #2c3e50; }
  .day-sum-cell { font-weight: bold; font-size: 9px; }
  .day-grand { border-left: 2px solid #ddd; color: #1a1a1a; }
  .mouvement-row td { border-bottom: 1px solid #eee; padding: 2px 6px; }
  .mouvement-row.sortie td { color: #c0392b; }
  .mouvement-row.entree td { color: #27ae60; }
  .mouvement-label { font-size: 8px; }
  .mouvement-amount { font-size: 8px; font-weight: bold; white-space: nowrap; border-left: 2px solid #ddd; }
  .balance-row td { padding: 2px 6px; font-size: 8px; border-bottom: 1px solid #eee; background: #f0f4ff; }
  .balance-label { font-style: italic; color: #444; }
  .balance-amount { font-weight: bold; color: #2c3e50; border-left: 2px solid #ddd; }
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
  <h1>Bilan mensuel — ${label} · Journal de caisse</h1>
  <div class="subtitle">${clubName} · ${grandOrderCount} commande${grandOrderCount > 1 ? 's' : ''} · Total : ${eur(grandTotal)} (Espèces : ${eur(grandEspeces)} / Carte : ${eur(grandCarte)})</div>

  ${days.length === 0 ? `<p class="empty">Aucune activité ce mois-ci.</p>` : `
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th class="num">Heure</th>
        ${productHeaders}
        <th class="num total-col">Total</th>
      </tr>
    </thead>
    ${bodyGroups}
  </table>

  <table class="grand-table">
    <thead>
      <tr>
        <th colspan="2">Récapitulatif mensuel</th>
        <th class="num">Qté</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>${grandRows}</tbody>
  </table>

  <div class="grand-total">TOTAL MOIS : ${eur(grandTotal)}</div>
  `}

  <div class="footer">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · Assolyte</div>
</body>
</html>`
}

function buildHtmlJournal(data) {
  const { clubName, year, month, products, days, grandTotal, grandEspeces, grandCarte, grandOrderCount, grandProducts } = data
  const label = monthLabel(year, month)

  function itemsLabel(items) {
    return Object.entries(items)
      .filter(([, qty]) => qty > 0)
      .map(([pid, qty]) => {
        const p = products.find(x => x.id === pid)
        return qty > 1 ? `${p?.name ?? pid} ×${qty}` : (p?.name ?? pid)
      })
      .join(', ') || 'Vente'
  }

  // ── Section 1 : Journal de caisse espèces ──────────────────────────────────

  const journalGroups = days.map(day => {
    const mouvements = day.mouvements || []
    const mouvTotal = mouvements.reduce((s, m) => s + m.amount, 0)
    const openBalance = day._base ?? 0
    const theoreticalBalance = day._attendu ?? (openBalance + day.especes + mouvTotal)
    const hasCash = day.cashCounted != null
    const { weekday, dateStr } = gridDateLabel(day.dayKey)

    const events = [
      ...(day.orders || [])
        .filter(o => o.payment === 'especes')
        .map(o => ({ time: o.time, label: itemsLabel(o.items), amount: o.total, type: 'vente' })),
      ...mouvements.map(m => ({ time: m.time, label: m.label, amount: m.amount, type: 'mouvement' })),
    ].sort((a, b) => ((a.time ?? 'ZZ') < (b.time ?? 'ZZ') ? -1 : 1))

    let running = openBalance
    const eventRows = events.map(ev => {
      running += ev.amount
      const isMouv = ev.type === 'mouvement'
      const amtClass = isMouv ? (ev.amount >= 0 ? 'mouv-entree' : 'mouv-sortie') : ''
      const rowClass = isMouv ? 'j-mouvement' : 'j-vente'
      return `<tr class="${rowClass}">
        <td class="j-time">${ev.time ?? ''}</td>
        <td class="j-desc">${ev.label}</td>
        <td class="j-amount ${amtClass}">${ev.amount >= 0 && isMouv ? '+' : ''}${eur(ev.amount)}</td>
        <td class="j-solde">${eur(running)}</td>
      </tr>`
    }).join('')

    const ecart = hasCash ? (day._ecart ?? (day.cashCounted - theoreticalBalance)) : null
    const ecartClass = ecart != null ? (ecart >= 0 ? 'surplus' : 'manque') : ''

    const bottomRows = [
      `<tr class="j-subtotal${hasCash ? '' : ' j-day-end'}">
        <td></td>
        <td class="j-desc"><strong>Sous-total espèces</strong></td>
        <td class="j-amount"><strong>${eur(day.especes)}</strong></td>
        <td class="j-solde"><strong>${eur(theoreticalBalance)}</strong></td>
      </tr>`,
      ...(hasCash ? [
        `<tr class="j-counted">
          <td></td><td class="j-desc"><em>Caisse comptée</em></td>
          <td class="j-amount"></td>
          <td class="j-solde">${eur(day.cashCounted)}</td>
        </tr>`,
        `<tr class="j-ecart ${ecartClass} j-day-end">
          <td></td><td class="j-desc"><em>Écart</em></td>
          <td class="j-amount j-ecart-amt">${ecart >= 0 ? '+' : ''}${eur(ecart)}</td>
          <td class="j-solde"></td>
        </tr>`,
      ] : []),
    ].join('')

    return `<tbody class="j-day-group">
      <tr class="j-day-header"><td colspan="4">${dateStr} · ${weekday}</td></tr>
      <tr class="j-opening"><td></td><td class="j-desc"><em>Solde d'ouverture</em></td><td class="j-amount"></td><td class="j-solde">${eur(openBalance)}</td></tr>
      ${eventRows}${bottomRows}
    </tbody>`
  }).join('')

  // ── Section 2 : Carte bancaire ─────────────────────────────────────────────

  const cardDays = days.filter(d => (d.orders || []).some(o => o.payment === 'carte'))
  const cardRows = cardDays.map(day => {
    const carteOrders = (day.orders || []).filter(o => o.payment === 'carte')
    const totalCarte = carteOrders.reduce((s, o) => s + o.total, 0)
    const { dateStr, weekday } = gridDateLabel(day.dayKey)
    return `<tr>
      <td>${dateStr} <span class="small-day">${weekday}</span></td>
      <td class="num">${carteOrders.length}</td>
      <td class="num">${eur(totalCarte)}</td>
    </tr>`
  }).join('')
  const grandCarteCount = cardDays.reduce((s, d) => s + (d.orders || []).filter(o => o.payment === 'carte').length, 0)

  // ── Section 3 : Quantités par semaine ─────────────────────────────────────

  function mondayKey(dayKey) {
    const [y, m, d] = dayKey.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const dow = date.getDay()
    date.setDate(d + (dow === 0 ? -6 : 1 - dow))
    return date.toISOString().slice(0, 10)
  }

  function weekRangeLabel(mon) {
    const [y, m, d] = mon.split('-').map(Number)
    const monday = new Date(y, m - 1, d)
    const sunday = new Date(y, m - 1, d + 6)
    const mStart = new Date(year, month - 1, 1)
    const mEnd = new Date(year, month, 0)
    const from = new Date(Math.max(monday.getTime(), mStart.getTime()))
    const to = new Date(Math.min(sunday.getTime(), mEnd.getTime()))
    return from.getMonth() === to.getMonth()
      ? `${from.getDate()}–${to.getDate()}`
      : `${from.getDate()}/${from.getMonth() + 1}–${to.getDate()}/${to.getMonth() + 1}`
  }

  const weekMap = new Map()
  for (const day of days) {
    const mon = mondayKey(day.dayKey)
    if (!weekMap.has(mon)) weekMap.set(mon, { monday: mon, qtys: {} })
    const wk = weekMap.get(mon)
    for (const order of (day.orders || [])) {
      for (const [pid, qty] of Object.entries(order.items)) {
        wk.qtys[pid] = (wk.qtys[pid] ?? 0) + qty
      }
    }
  }
  const weeks = [...weekMap.values()].sort((a, b) => a.monday.localeCompare(b.monday))

  const activeProductIds = products.filter(p => (grandProducts[p.id]?.qty ?? 0) > 0).map(p => p.id)
  const weekHeaders = weeks.map(w => `<th class="num">${weekRangeLabel(w.monday)}</th>`).join('')
  const qtyRows = activeProductIds.map(pid => {
    const p = products.find(x => x.id === pid)
    const cells = weeks.map(w => `<td class="num">${w.qtys[pid] ?? 0}</td>`).join('')
    return `<tr><td>${p?.name ?? pid}</td>${cells}<td class="num total-qty">${grandProducts[pid]?.qty ?? 0}</td></tr>`
  }).join('')
  const weekTotals = weeks.map(w => `<td class="num">${activeProductIds.reduce((s, pid) => s + (w.qtys[pid] ?? 0), 0)}</td>`).join('')
  const grandQty = activeProductIds.reduce((s, pid) => s + (grandProducts[pid]?.qty ?? 0), 0)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  @page { size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #1a1a1a; padding: 12mm 10mm; }
  h1 { font-size: 16px; margin-bottom: 2px; }
  h2 { font-size: 11px; font-weight: bold; color: #2c3e50; margin: 7mm 0 3mm; padding-bottom: 2px; border-bottom: 2px solid #2c3e50; text-transform: uppercase; letter-spacing: 0.5px; }
  .subtitle { font-size: 11px; color: #555; margin-bottom: 4mm; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
  thead { display: table-header-group; }
  th { background: #2c3e50; color: #fff; padding: 4px 6px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  th.num, td.num { text-align: right; }
  td { padding: 2px 6px; border-bottom: 1px solid #ebebeb; vertical-align: middle; font-size: 8px; }

  /* Section 1 */
  tbody.j-day-group { page-break-inside: avoid; }
  .j-day-header td { background: #2c3e50; color: #fff; font-weight: bold; font-size: 9px; padding: 4px 6px; }
  .j-opening td { background: #f0f4ff; font-style: italic; color: #555; border-bottom: 1px solid #dde; }
  .j-time { width: 30px; color: #999; }
  .j-desc { }
  .j-amount { width: 65px; text-align: right; }
  .j-solde { width: 65px; text-align: right; font-weight: bold; border-left: 1px solid #ddd; }
  .mouv-entree { color: #27ae60; font-weight: bold; }
  .mouv-sortie { color: #c0392b; font-weight: bold; }
  .j-mouvement td { background: #fffdf5; }
  .j-subtotal td { background: #f0f0f0; border-top: 1px solid #ccc; border-bottom: 1px solid #eee; }
  .j-counted td { background: #f5f5f5; color: #444; font-style: italic; }
  .j-ecart.surplus td { background: #f5fff8; }
  .j-ecart.manque td { background: #fff5f5; }
  .j-ecart-amt { font-weight: bold; }
  .j-ecart.surplus .j-ecart-amt { color: #27ae60; }
  .j-ecart.manque .j-ecart-amt { color: #c0392b; }
  .j-day-end td { border-bottom: 5px solid #2c3e50; }

  /* Section 2 */
  .small-day { color: #888; }
  .card-footer td { background: #f0f0f0; font-weight: bold; border-top: 2px solid #aaa; }

  /* Section 3 */
  .qty-footer td { background: #f0f0f0; font-weight: bold; border-top: 2px solid #aaa; }
  td.total-qty { font-weight: bold; border-left: 2px solid #2c3e50; }

  .footer { margin-top: 8mm; font-size: 8px; color: #aaa; border-top: 1px solid #eee; padding-top: 3mm; }
  .empty { text-align: center; color: #888; padding: 20px; }
</style>
</head>
<body>
  <h1>Bilan mensuel — ${label} · Journal de caisse</h1>
  <div class="subtitle">${clubName} · ${grandOrderCount} commande${grandOrderCount > 1 ? 's' : ''} · Total : ${eur(grandTotal)} (Espèces : ${eur(grandEspeces)} / Carte : ${eur(grandCarte)})</div>

  ${days.length === 0 ? `<p class="empty">Aucune activité ce mois-ci.</p>` : `

  <h2>Journal de caisse — Espèces</h2>
  <table>
    <thead><tr><th style="width:30px">Heure</th><th>Description</th><th class="num" style="width:65px">Mouvement</th><th class="num" style="width:65px">Solde</th></tr></thead>
    ${journalGroups}
  </table>

  <h2>Paiements par carte bancaire</h2>
  ${cardDays.length === 0
    ? `<p class="empty">Aucun paiement par carte ce mois-ci.</p>`
    : `<table>
        <thead><tr><th>Date</th><th class="num">Commandes CB</th><th class="num">Total CB</th></tr></thead>
        <tbody>${cardRows}</tbody>
        <tfoot><tr class="card-footer"><td>Total</td><td class="num">${grandCarteCount}</td><td class="num">${eur(grandCarte)}</td></tr></tfoot>
      </table>`}

  <h2>Quantités vendues</h2>
  <table>
    <thead><tr><th>Produit</th>${weekHeaders}<th class="num">Total mois</th></tr></thead>
    <tbody>${qtyRows}</tbody>
    <tfoot><tr class="qty-footer"><td>Total</td>${weekTotals}<td class="num">${grandQty}</td></tr></tfoot>
  </table>
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
