import { useState } from 'react';
import { AppHeader, Icon } from '../components/UI';
import { fmtEUR } from '../lib/data';

export function HistoryScreen({ archived, products }) {
  const [openId, setOpenId] = useState(null);
  const days = archived || [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppHeader
        subtitle="JOURNÉES PRÉCÉDENTES"
        title="Historique"
        right={
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Cumul saison</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>
              {fmtEUR(days.reduce((s, d) => s + d.total, 0))}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 500, marginTop: 2 }}>
              {days.length} journées · {days.reduce((s, d) => s + d.orderCount, 0)} commandes
            </div>
          </div>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 32px' }}>
        {days.length === 0 ? (
          <div style={{ margin: '80px auto', maxWidth: 420, textAlign: 'center', color: 'var(--ink-soft)' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Aucune journée archivée</div>
            <div style={{ fontSize: 16 }}>Les journées clôturées apparaîtront ici.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {days.map((day, i) => (
              <DayRow
                key={day.dayKey || i} day={day}
                products={products}
                open={openId === (day.dayKey || i)}
                onToggle={() => setOpenId(openId === (day.dayKey || i) ? null : (day.dayKey || i))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayRow({ day, products, open, onToggle }) {
  const auto = !!day.autoClosed;
  const diff = (day.cashCounted ?? 0) - day.especes;
  const isOk = !auto && day.cashCounted != null && Math.abs(diff) < 0.01;
  return (
    <div style={{
      background: 'var(--paper)',
      border: auto ? '1px solid var(--warn)' : '1px solid var(--line-soft)',
      borderLeft: auto ? '4px solid var(--warn)' : undefined,
      borderRadius: 14, overflow: 'hidden',
    }}>
      <button onClick={onToggle} style={{
        appearance: 'none', border: 'none', background: 'transparent',
        width: '100%', padding: '18px 24px',
        display: 'grid', gridTemplateColumns: '1fr auto auto auto 28px',
        alignItems: 'center', gap: 24, cursor: 'pointer',
        textAlign: 'left', fontFamily: 'inherit',
      }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2 }}>{day.date}</div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 500, marginTop: 2 }}>{day.label || '—'}</div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 110 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--ink-mute)', textTransform: 'uppercase' }}>Commandes</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{day.orderCount}</div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 130 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--ink-mute)', textTransform: 'uppercase' }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>{fmtEUR(day.total)}</div>
        </div>
        <CaisseBadge auto={auto} ok={isOk} diff={diff} hasCount={day.cashCounted != null} />
        <div style={{ color: 'var(--ink-soft)' }}><Icon.Chevron dir={open ? 'up' : 'down'} /></div>
      </button>
      {open && <DayDetail day={day} products={products} />}
    </div>
  );
}

function CaisseBadge({ auto, ok, diff, hasCount }) {
  if (auto) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'var(--warn-soft)', color: 'var(--warn)', fontWeight: 700, fontSize: 14, letterSpacing: 0.2, minWidth: 160, justifyContent: 'center', whiteSpace: 'nowrap' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
      Clôture auto
    </span>
  );
  if (ok) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'var(--ok-soft)', color: 'var(--ok)', fontWeight: 700, fontSize: 14, letterSpacing: 0.2, minWidth: 130, justifyContent: 'center' }}>
      <Icon.Check size={16} /> Caisse OK
    </span>
  );
  if (!hasCount) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'var(--cream-deep)', color: 'var(--ink-soft)', fontWeight: 700, fontSize: 14, letterSpacing: 0.2, minWidth: 130, justifyContent: 'center' }}>
      Non comptée
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: diff < 0 ? 'var(--danger-soft)' : 'var(--warn-soft)', color: diff < 0 ? 'var(--danger)' : 'var(--warn)', fontWeight: 700, fontSize: 14, letterSpacing: 0.2, minWidth: 130, justifyContent: 'center', fontVariantNumeric: 'tabular-nums' }}>
      Écart {diff > 0 ? '+' : ''}{fmtEUR(diff)}
    </span>
  );
}

function DayDetail({ day, products }) {
  const auto = !!day.autoClosed;
  const hasCount = day.cashCounted != null;
  const diff = (day.cashCounted ?? 0) - day.especes;
  return (
    <div style={{ padding: '20px 24px 22px', borderTop: '1px solid var(--line-soft)', background: 'var(--cream)' }}>
      {auto && (
        <div style={{ background: 'var(--warn-soft)', color: 'var(--warn)', border: '1px solid var(--warn)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <div><b>Journée clôturée automatiquement.</b><br/>La caisse n'a pas été comptée à la fin de cette journée — le contrôle des espèces n'a pas été effectué.</div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.3, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Détail par produit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.map(p => {
              const qty = (day.products || {})[p.id] || 0;
              const total = qty * p.price;
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: p.color + '22', display: 'grid', placeItems: 'center', fontSize: 16, border: `1px solid ${p.color}40` }}>{p.emoji}</span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--club)', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>×{qty}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 76, textAlign: 'right' }}>{fmtEUR(total)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.3, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Paiements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <DetailRow icon={<span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--amber)' }} />} label="Espèces" value={fmtEUR(day.especes)} />
            <DetailRow icon={<span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--blue)' }} />} label="Carte" value={fmtEUR(day.carte)} />
            <DetailRow label="Total encaissé" value={fmtEUR(day.total)} bold />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.3, color: 'var(--ink-mute)', textTransform: 'uppercase', marginBottom: 10 }}>Caisse espèces</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <DetailRow label="Attendu" value={fmtEUR(day.especes)} />
            <DetailRow label="Compté" value={hasCount ? fmtEUR(day.cashCounted) : '—'} muted={!hasCount} />
            <DetailRow
              label="Écart"
              value={hasCount ? `${diff > 0 ? '+' : ''}${fmtEUR(diff)}` : '—'}
              bold
              color={!hasCount ? 'var(--ink-mute)' : (Math.abs(diff) < 0.01 ? 'var(--ok)' : (diff < 0 ? 'var(--danger)' : 'var(--warn)'))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, bold, color, muted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-soft)', fontSize: 15, fontWeight: 500 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize: bold ? 18 : 16, fontWeight: bold ? 800 : 600, color: muted ? 'var(--ink-mute)' : (color || 'var(--ink)'), fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2 }}>
        {value}
      </div>
    </div>
  );
}
