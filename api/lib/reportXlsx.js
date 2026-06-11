import ExcelJS from 'exceljs'
import { buildMonthReport } from './reportData.js'

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function eur(n) {
  return n == null ? null : Math.round(n * 100) / 100
}

// Styles réutilisables
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
const TOTAL_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
const ROW_ALT_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
const CURRENCY_FMT = '#,##0.00 "€"'
const BORDER_THIN = { style: 'thin', color: { argb: 'FFD1D5DB' } }
const CELL_BORDER = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN }

function applyHeaderStyle(row, numCols) {
  row.height = 22
  for (let c = 1; c <= numCols; c++) {
    const cell = row.getCell(c)
    cell.fill = HEADER_FILL
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.alignment = { vertical: 'middle', horizontal: c <= 3 ? 'left' : 'right', wrapText: false }
    cell.border = CELL_BORDER
  }
}

function applyDataStyle(row, colCount, isAlt, productStartCol) {
  row.height = 18
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c)
    if (isAlt) cell.fill = ROW_ALT_FILL
    cell.border = CELL_BORDER
    cell.font = { size: 10 }
    cell.alignment = { vertical: 'middle', horizontal: c <= 3 ? 'left' : 'right' }
    if (c >= 4 && c <= 11 && productStartCol && c < productStartCol) {
      cell.numFmt = CURRENCY_FMT
    }
  }
}

function applyTotalStyle(row, colCount, productStartCol) {
  row.height = 20
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c)
    cell.fill = TOTAL_FILL
    cell.font = { bold: true, size: 10 }
    cell.border = CELL_BORDER
    cell.alignment = { vertical: 'middle', horizontal: c <= 3 ? 'left' : 'right' }
    if (c >= 4 && c <= 11 && productStartCol && c < productStartCol) {
      cell.numFmt = CURRENCY_FMT
    }
  }
}

export async function generateXlsx(licenseKey, year, month) {
  const data = await buildMonthReport(licenseKey, year, month)
  const { clubName, products, days, grandTotal, grandEspeces, grandCarte, grandOrderCount } = data

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`
  const exportDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Assolyte'
  wb.created = new Date()

  const ws = wb.addWorksheet(monthLabel)

  // ── Colonnes fixes + colonnes produits ───────────────────────────────────────
  const fixedHeaders = [
    'Date', 'Journée', 'Commandes',
    'Ventes (€)', 'Espèces (€)', 'Carte (€)', 'Opérations (€)', 'Grand total (€)',
    'Attendu caisse (€)', 'Compté (€)', 'Écart (€)', 'Clôture',
  ]
  const productHeaders = products.map(p => `${p.name} (qté)`)
  const allHeaders = [...fixedHeaders, ...productHeaders]
  const numCols = allHeaders.length
  const productStartCol = fixedHeaders.length + 1

  ws.columns = [
    { width: 13 },  // Date
    { width: 32 },  // Journée
    { width: 12 },  // Commandes
    { width: 14 },  // Ventes
    { width: 14 },  // Espèces
    { width: 12 },  // Carte
    { width: 14 },  // Opérations
    { width: 14 },  // Grand total
    { width: 16 },  // Attendu caisse
    { width: 12 },  // Compté
    { width: 12 },  // Écart
    { width: 16 },  // Clôture
    ...products.map(() => ({ width: 14 })),
  ]

  // ── Titre ────────────────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, numCols)
  const titleCell = ws.getCell('A1')
  titleCell.value = clubName || 'Buvette'
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 28

  ws.mergeCells(2, 1, 2, numCols)
  const subCell = ws.getCell('A2')
  subCell.value = `${monthLabel} — exporté le ${exportDate}`
  subCell.font = { italic: true, size: 10, color: { argb: 'FF6B7280' } }
  subCell.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(2).height = 16

  // Ligne vide
  ws.addRow([])

  // ── En-têtes ─────────────────────────────────────────────────────────────────
  const headerRow = ws.addRow(allHeaders)
  applyHeaderStyle(headerRow, numCols)
  // Colonnes produits en gris bleuté
  for (let c = productStartCol; c <= numCols; c++) {
    const cell = headerRow.getCell(c)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }
  }

  // ── Données ──────────────────────────────────────────────────────────────────
  days.forEach((day, i) => {
    const mouvTotal = (day.mouvements || []).reduce((s, m) => s + m.amount, 0)
    const grandTotalDay = day.dayTotal + mouvTotal
    const cloture = day.autoClosed ? 'Auto' : (day.dayClosed || day.closed ? 'Manuelle' : 'Non clôturée')
    const productQtys = products.map(p => (day.products || {})[p.id]?.qty ?? 0)

    const row = ws.addRow([
      day.dayKey,
      day.date,
      day.orderCount,
      eur(day.dayTotal),
      eur(day.especes),
      eur(day.carte),
      eur(mouvTotal) ?? 0,
      eur(grandTotalDay),
      eur(day._attendu),
      day.cashCounted != null ? eur(day.cashCounted) : null,
      day._ecart != null ? eur(day._ecart) : null,
      cloture,
      ...productQtys,
    ])

    applyDataStyle(row, numCols, i % 2 === 1, productStartCol)

    // Coloration de l'écart
    const ecartCell = row.getCell(11)
    if (day._ecart != null) {
      if (Math.abs(day._ecart) < 0.01) {
        ecartCell.font = { size: 10, color: { argb: 'FF16A34A' } }
      } else if (day._ecart < 0) {
        ecartCell.font = { size: 10, color: { argb: 'FFDC2626' } }
      } else {
        ecartCell.font = { size: 10, color: { argb: 'FFD97706' } }
      }
    }
  })

  // ── Ligne totaux ─────────────────────────────────────────────────────────────
  const grandMouvTotal = days.reduce((s, d) => s + (d.mouvements || []).reduce((sm, m) => sm + m.amount, 0), 0)
  const grandGrandTotal = grandTotal + grandMouvTotal
  const grandProductQtys = products.map(p =>
    days.reduce((s, d) => s + ((d.products || {})[p.id]?.qty ?? 0), 0)
  )

  const totalRow = ws.addRow([
    '', 'TOTAL',
    grandOrderCount,
    eur(grandTotal),
    eur(grandEspeces),
    eur(grandCarte),
    eur(grandMouvTotal),
    eur(grandGrandTotal),
    '', '', '', '',
    ...grandProductQtys,
  ])
  applyTotalStyle(totalRow, numCols, productStartCol)

  // Freeze les 4 premières lignes (titre + entête)
  ws.views = [{ state: 'frozen', ySplit: 4 }]

  return wb.xlsx.writeBuffer()
}
