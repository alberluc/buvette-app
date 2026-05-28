import { useState, useEffect, useMemo } from 'react';
import { AppHeader, Icon, BigButton, PayBadge } from '../components/UI';
import { fmtEUR, summarize } from '../lib/data';
import styles from './SummaryScreen.module.css';

export function SummaryScreen({ day, products, onClose, onReopen, cashCounted, setCashCounted }) {
  const orders = day.orders;
  const dayClosed = day.dayClosed;
  const summary = useMemo(() => summarize(orders, products), [orders, products]);

  const [counted, setCounted] = useState(cashCounted == null ? '' : String(cashCounted).replace('.', ','));
  useEffect(() => {
    setCounted(cashCounted == null ? '' : String(cashCounted).replace('.', ','));
  }, [cashCounted]);

  const countedNum = parseFloat(counted.replace(',', '.'));
  const hasCount = !isNaN(countedNum);
  const diff = hasCount ? countedNum - summary.especes : 0;

  let diffState = 'neutral';
  if (hasCount) {
    if (Math.abs(diff) < 0.01) diffState = 'ok';
    else if (diff < 0) diffState = 'missing';
    else diffState = 'excess';
  }

  const diffPalette = {
    ok:      { bg: 'var(--ok-soft)',     fg: 'var(--ok)',     label: 'Caisse OK',       icon: '✓' },
    missing: { bg: 'var(--danger-soft)', fg: 'var(--danger)', label: 'Manque en caisse', icon: '−' },
    excess:  { bg: 'var(--warn-soft)',   fg: 'var(--warn)',   label: 'Excédent',         icon: '+' },
    neutral: { bg: 'var(--cream-deep)',  fg: 'var(--ink-soft)', label: 'À saisir',       icon: '·' },
  }[diffState];

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
          <MetricCard label="Total attendu" value={fmtEUR(summary.total)} accent />
          <MetricCard label="Nombre de commandes" value={summary.count} />
        </div>

        <div className={styles.detailGrid}>
          <Section title="Détail par produit">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={th}>Produit</th>
                  <th style={{ ...th, textAlign: 'center' }}>Quantité</th>
                  <th style={{ ...th, textAlign: 'right' }}>Prix unit.</th>
                  <th style={{ ...th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const d = summary.products[p.id] || { qty: 0, total: 0 };
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                      <td style={{ ...td, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* background et border inline — couleur spécifique au produit */}
                        <span className={styles.productEmoji}
                              style={{ background: p.color + '22', border: `1px solid ${p.color}40` }}>
                          {p.emoji}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 17 }}>{p.name}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center', fontSize: 22, fontWeight: 700, color: d.qty > 0 ? 'var(--club)' : 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>{d.qty}</td>
                      <td style={{ ...td, textAlign: 'right', color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{fmtEUR(p.price)}</td>
                      <td style={{ ...td, textAlign: 'right', fontSize: 19, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtEUR(d.total)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td style={{ ...td, fontWeight: 700, fontSize: 18 }} colSpan="3">Total</td>
                  <td style={{ ...td, textAlign: 'right', fontSize: 22, fontWeight: 800, color: 'var(--club)', fontVariantNumeric: 'tabular-nums' }}>{fmtEUR(summary.total)}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <div className={styles.rightCol}>
            <Section title="Répartition des paiements">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PaymentRow kind="especes" amount={summary.especes} total={summary.total} />
                <PaymentRow kind="carte"   amount={summary.carte}   total={summary.total} />
              </div>
            </Section>

            <Section title="Contrôle de la caisse espèces" accent={diffPalette.bg}>
              <div style={{ marginBottom: 12 }}>
                <div className={styles.cashExpected}>Espèces attendues</div>
                <div className={styles.cashExpectedVal}>{fmtEUR(summary.especes)}</div>
              </div>
              <label className={styles.cashLabel}>Montant compté en caisse</label>
              <div className={styles.cashInputWrap}>
                <input
                  type="text" inputMode="decimal" value={counted}
                  onChange={(e) => {
                    setCounted(e.target.value);
                    const n = parseFloat(e.target.value.replace(',', '.'));
                    setCashCounted(isNaN(n) ? null : n);
                  }}
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
                    {hasCount ? (diff === 0 ? 'Écart : 0,00 €' : `Écart : ${diff > 0 ? '+' : ''}${fmtEUR(diff).replace('€', '').trim()} €`) : '—'}
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
    </div>
  );
}

const th = { textAlign: 'left', padding: '10px 8px', fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: 'var(--ink-mute)', textTransform: 'uppercase' };
const td = { padding: '12px 8px', verticalAlign: 'middle' };

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
