import { useState, useEffect, useMemo } from 'react';
import { AppHeader, Icon, BigButton, PayBadge } from '../components/UI';
import { OperationModal } from '../components/OperationModal';
import { fmtEUR, summarize } from '../lib/data';
import styles from './SummaryScreen.module.css';

export function SummaryScreen({ day, products, onClose, onReopen, cashCounted, cashFloat, archived, onAddOperation, onRemoveOperation, opSuggestions }) {
  const orders = day.orders;
  const dayClosed = day.dayClosed;
  const summary = useMemo(() => summarize(orders, products), [orders, products]);

  const [counted, setCounted] = useState(cashCounted == null ? '' : String(cashCounted).replace('.', ','));
  const [operationOpen, setOperationOpen] = useState(false);

  useEffect(() => {
    setCounted(cashCounted == null ? '' : String(cashCounted).replace('.', ','));
  }, [cashCounted]);

  // ── Calcul espèces attendues en caisse ────────────────────────────────────────
  const { expectedCash, base, report, reportDays, opsTotal, baseFromFloat } = useMemo(() => {
    let base = cashFloat ?? 0;
    let baseFromFloat = true;
    let report = 0;
    let reportDays = 0;
    for (const a of (archived || [])) {
      if (a.cashCounted !== null) {
        base = a.cashCounted;
        baseFromFloat = false;
        break;
      }
      report += a.especes;
      report += (a.mouvements || []).reduce((s, m) => s + m.amount, 0);
      reportDays++;
    }
    const dayOperations = day.mouvements || [];
    const opsTotal = dayOperations.reduce((s, op) => s + op.amount, 0);
    return { expectedCash: base + report + summary.especes + opsTotal, base, report, reportDays, opsTotal, baseFromFloat };
  }, [cashFloat, archived, summary.especes, day.mouvements]); // eslint-disable-line react-hooks/exhaustive-deps

  const operations = day.mouvements || [];

  const countedNum = parseFloat(counted.replace(',', '.'));
  const hasCount = !isNaN(countedNum);
  const diff = hasCount ? countedNum - expectedCash : 0;

  let diffState = 'neutral';
  if (hasCount) {
    if (Math.abs(diff) < 0.01) diffState = 'ok';
    else if (diff < 0) diffState = 'missing';
    else diffState = 'excess';
  }

  const diffPalette = {
    ok:      { bg: 'var(--ok-soft)',     fg: 'var(--ok)',     label: 'Caisse OK',        icon: '✓' },
    missing: { bg: 'var(--danger-soft)', fg: 'var(--danger)', label: 'Manque en caisse', icon: '−' },
    excess:  { bg: 'var(--warn-soft)',   fg: 'var(--warn)',   label: 'Excédent',          icon: '+' },
    neutral: { bg: 'var(--cream-deep)',  fg: 'var(--ink-soft)', label: 'À saisir',        icon: '·' },
  }[diffState];

  const baseLabel = baseFromFloat ? 'Fond de caisse' : 'Dernier comptage';

  return (
    <div className={styles.screen}>
      <AppHeader
        subtitle={day.date.toUpperCase()}
        title="Bilan du jour"
        right={dayClosed ? (
          <div className={styles.closedBadge}>
            <Icon.Check size={18} /> Journée clôturée
          </div>
        ) : null}
      />

      <div className={styles.scrollArea}>
        <div className={styles.metricsGrid}>
          <MetricCard label="Total attendu" value={fmtEUR(summary.total + opsTotal)} accent />
          <MetricCard label="Nombre de commandes" value={summary.count} />
        </div>

        <div className={styles.detailGrid}>
          <Section title="Détail par produit">
            <div className={styles.productTable}>
              <div className={styles.productTableHeader}>
                <div>Produit</div>
                <div>Qté</div>
                <div>Prix unit.</div>
                <div>Total</div>
              </div>
              {products.map(p => {
                const d = summary.products[p.id] || { qty: 0, total: 0 };
                return (
                  <div key={p.id} className={styles.productRow}>
                    <div className={styles.ptColProduct}>
                      {/* background et border inline — couleur spécifique au produit */}
                      <span className={styles.productEmoji}
                            style={{ background: p.color + '22', border: `1px solid ${p.color}40` }}>
                        {p.emoji}
                      </span>
                      <span className={styles.ptProductName}>{p.name}</span>
                    </div>
                    {/* color inline — dépend de la quantité vendue */}
                    <div className={styles.ptColQty}
                         style={{ color: d.qty > 0 ? 'var(--club)' : 'var(--ink-mute)' }}>
                      {d.qty}
                    </div>
                    <div className={styles.ptColPrice}>{fmtEUR(p.price)}</div>
                    <div className={styles.ptColTotal}>{fmtEUR(d.total)}</div>
                  </div>
                );
              })}
              <div className={styles.productTotalRow}>
                <span className={styles.ptTotalLabel}>Total</span>
                <span className={styles.ptTotalAmount}>{fmtEUR(summary.total)}</span>
              </div>
            </div>
          </Section>

          <div className={styles.rightCol}>
            <Section title="Répartition des paiements">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PaymentRow kind="especes" amount={summary.especes} total={summary.total} />
                <PaymentRow kind="carte"   amount={summary.carte}   total={summary.total} />
              </div>
            </Section>

            <Section title="Opérations de caisse">
              {operations.length === 0 ? (
                <div className={styles.mouvEmpty}>Aucune opération enregistrée</div>
              ) : (
                <div className={styles.mouvList}>
                  {operations.map(op => (
                    <OperationRow
                      key={op.id}
                      operation={op}
                      dayClosed={dayClosed}
                      onRemove={() => onRemoveOperation(op.id)}
                    />
                  ))}
                  <div className={styles.mouvNet}>
                    Net du jour : <span style={{ color: opsTotal >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                      {opsTotal >= 0 ? '+' : ''}{fmtEUR(opsTotal)}
                    </span>
                  </div>
                </div>
              )}
              {!dayClosed && (
                <button className={styles.addMouvBtn} onClick={() => setOperationOpen(true)}>
                  + Ajouter une opération
                </button>
              )}
            </Section>

            <Section title="Contrôle de la caisse espèces" accent={diffPalette.bg}>
              <div className={styles.breakdownRows}>
                <BreakdownLine label={baseLabel} value={base} />
                {report !== 0 && (
                  <BreakdownLine
                    label={`Report non comptés (${reportDays} j.)`}
                    value={report}
                    signed
                  />
                )}
                <BreakdownLine label="Espèces du jour" value={summary.especes} signed />
                {opsTotal !== 0 && (
                  <BreakdownLine label="Opérations du jour" value={opsTotal} signed />
                )}
                <BreakdownLine label="Total attendu en caisse" value={expectedCash} total />
              </div>

              <label className={styles.cashLabel}>Montant compté en caisse</label>
              <div className={styles.cashInputWrap}>
                <input
                  type="text" inputMode="decimal" value={counted}
                  onChange={(e) => setCounted(e.target.value)}
                  placeholder="0,00" disabled={dayClosed}
                  className={`${styles.cashInput} ${dayClosed ? styles.cashInputClosed : styles.cashInputOpen}`}
                />
                <span className={styles.cashEuroSign}>€</span>
              </div>
              {/* bg et fg restent inline — calculés depuis l'état diff */}
              <div className={styles.diffBadge}
                   style={{ background: diffPalette.bg, color: diffPalette.fg }}>
                <div>
                  <div className={styles.diffLabel}>{diffPalette.label}</div>
                  <div className={styles.diffValue}>
                    {hasCount ? (Math.abs(diff) < 0.01 ? 'Écart : 0,00 €' : `Écart : ${diff > 0 ? '+' : ''}${fmtEUR(diff).replace('€', '').trim()} €`) : '—'}
                  </div>
                </div>
                {/* bg inline — dérivé de diffPalette.fg */}
                <div className={styles.diffIcon}
                     style={{ background: diffPalette.fg + '22', color: diffPalette.fg }}>
                  {diffPalette.icon}
                </div>
              </div>
            </Section>
          </div>
        </div>

        <div className={styles.actions}>
          {!dayClosed ? (
            <BigButton variant="primary" icon={<Icon.Check size={26} />}
                       disabled={!hasCount} onClick={() => onClose(countedNum)}
                       style={{ minWidth: 340, height: 76, fontSize: 22 }}>
              Clôturer la journée
            </BigButton>
          ) : (
            <BigButton variant="ghost" onClick={onReopen} style={{ minWidth: 260 }}>
              Annuler la clôture
            </BigButton>
          )}
        </div>
      </div>

      {operationOpen && (
        <OperationModal
          onClose={() => setOperationOpen(false)}
          onValidate={onAddOperation}
          suggestions={opSuggestions}
        />
      )}
    </div>
  );
}


function MetricCard({ label, value, accent }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={accent ? styles.cardValueAccent : styles.cardValueNormal}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.sectionTitle}>{title}</div>
      <div style={{ color: 'var(--ink)' }}>{children}</div>
    </div>
  );
}

function PaymentRow({ kind, amount, total }) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  const isEspeces = kind === 'especes';
  const color = isEspeces ? 'var(--amber)' : 'var(--blue)';
  const bg = isEspeces ? 'var(--amber-soft)' : 'var(--blue-soft)';
  return (
    <div>
      <div className={styles.paymentRowHeader}>
        <PayBadge kind={kind} size="lg" />
        <div className={styles.paymentRowAmount}>{fmtEUR(amount)}</div>
      </div>
      {/* bg et color inline — valeurs dépendent du type de paiement via variables CSS */}
      <div className={styles.paymentBar} style={{ background: bg }}>
        <div className={styles.paymentBarFill} style={{ width: pct + '%', background: color }} />
      </div>
      <div className={styles.paymentRowPct}>{pct} % du chiffre du jour</div>
    </div>
  );
}

function OperationRow({ operation, dayClosed, onRemove }) {
  const isPos = operation.amount >= 0;
  return (
    <div className={styles.mouvRow}>
      <span className={styles.mouvTime}>{operation.time}</span>
      <span className={styles.mouvLabel}>{operation.label}</span>
      {/* color inline — dépend du signe de l'opération */}
      <span className={styles.mouvAmount} style={{ color: isPos ? 'var(--ok)' : 'var(--danger)' }}>
        {isPos ? '+' : ''}{fmtEUR(operation.amount)}
      </span>
      {!dayClosed && (
        <button onClick={onRemove} className={styles.mouvDeleteBtn} aria-label="Supprimer">
          <Icon.Trash size={16} />
        </button>
      )}
    </div>
  );
}

function BreakdownLine({ label, value, signed, total }) {
  return (
    <div className={`${styles.breakdownRow} ${total ? styles.breakdownRowTotal : ''}`}>
      <span className={styles.breakdownLabel}>{label}</span>
      <span className={`${styles.breakdownValue} ${total ? styles.breakdownValueTotal : ''}`}>
        {signed && value >= 0 ? '+' : ''}{fmtEUR(value)}
      </span>
    </div>
  );
}
