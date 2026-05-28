import { useState, useEffect, useMemo } from 'react';
import { AppHeader, Icon, BigButton, PayBadge } from '../components/UI';
import { fmtEUR, summarize } from '../lib/data';

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppHeader
        subtitle={day.date.toUpperCase()}
        title="Bilan du jour"
        right={dayClosed ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '10px 18px', background: 'var(--ok-soft)', color: 'var(--ok)',
            borderRadius: 999, fontWeight: 700, fontSize: 15,
          }}>
            <Icon.Check size={18} /> Journée clôturée
          </div>
        ) : null}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <MetricCard label="Total attendu" value={fmtEUR(summary.total)} accent />
          <MetricCard label="Nombre de commandes" value={summary.count} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
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
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: p.color + '22', display: 'grid', placeItems: 'center', fontSize: 18, border: `1px solid ${p.color}40` }}>{p.emoji}</span>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Section title="Répartition des paiements">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PaymentRow kind="especes" amount={summary.especes} total={summary.total} />
                <PaymentRow kind="carte"   amount={summary.carte}   total={summary.total} />
              </div>
            </Section>

            <Section title="Contrôle de la caisse espèces" accent={diffPalette.bg}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 6, fontWeight: 500 }}>Espèces attendues</div>
                <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>{fmtEUR(summary.especes)}</div>
              </div>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--ink-soft)', marginBottom: 8, fontWeight: 600 }}>
                Montant compté en caisse
              </label>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <input
                  type="text" inputMode="decimal" value={counted}
                  onChange={(e) => {
                    setCounted(e.target.value);
                    const n = parseFloat(e.target.value.replace(',', '.'));
                    setCashCounted(isNaN(n) ? null : n);
                  }}
                  placeholder="0,00" disabled={dayClosed}
                  style={{
                    width: '100%', height: 72,
                    border: '2px solid var(--line)', borderRadius: 12,
                    padding: '0 64px 0 20px', fontSize: 28, fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit',
                    background: dayClosed ? 'var(--cream-deep)' : 'var(--paper)',
                    color: 'var(--ink)', outline: 'none', letterSpacing: -0.3,
                  }}
                />
                <span style={{ position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)', fontSize: 26, fontWeight: 700, color: 'var(--ink-mute)' }}>€</span>
              </div>
              <div style={{
                background: diffPalette.bg, color: diffPalette.fg,
                borderRadius: 12, padding: '16px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.85 }}>{diffPalette.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4, marginTop: 2 }}>
                    {hasCount ? (diff === 0 ? 'Écart : 0,00 €' : `Écart : ${diff > 0 ? '+' : ''}${fmtEUR(diff).replace('€', '').trim()} €`) : '—'}
                  </div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 999,
                  background: diffPalette.fg + '22', color: diffPalette.fg,
                  display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800,
                }}>{diffPalette.icon}</div>
              </div>
            </Section>
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line-soft)', borderRadius: 16, padding: '18px 22px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: accent ? 'var(--club)' : 'var(--ink)', letterSpacing: -0.8, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line-soft)', borderRadius: 16, padding: '18px 22px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.3, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 14 }}>{title}</div>
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
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <PayBadge kind={kind} size="lg" />
        <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3 }}>{fmtEUR(amount)}</div>
      </div>
      <div style={{ height: 10, background: bg, borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 999, transition: 'width 240ms' }} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, fontWeight: 500 }}>{pct} % du chiffre du jour</div>
    </div>
  );
}
