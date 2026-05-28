import { useState } from 'react';
import { AppHeader, Icon } from '../components/UI';
import { fmtEUR } from '../lib/data';
import styles from './HistoryScreen.module.css';

export function HistoryScreen({ archived, products }) {
  const [openId, setOpenId] = useState(null);
  const days = archived || [];

  return (
    <div className={styles.screen}>
      <AppHeader
        subtitle="JOURNÉES PRÉCÉDENTES"
        title="Historique"
        right={
          <div className={styles.headerRight}>
            <div className={styles.headerLabel}>Cumul saison</div>
            <div className={styles.headerValue}>
              {fmtEUR(days.reduce((s, d) => s + d.total, 0))}
            </div>
            <div className={styles.headerSub}>
              {days.length} journées · {days.reduce((s, d) => s + d.orderCount, 0)} commandes
            </div>
          </div>
        }
      />

      <div className={styles.list}>
        {days.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>Aucune journée archivée</div>
            <div className={styles.emptyText}>Les journées clôturées apparaîtront ici.</div>
          </div>
        ) : (
          <div className={styles.dayListInner}>
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
    <div className={`${styles.dayRow} ${auto ? styles.dayRowAuto : ''}`}>
      <button onClick={onToggle} className={styles.dayToggleBtn}>
        <div>
          <div className={styles.dayDate}>{day.date}</div>
          <div className={styles.dayLabel}>{day.label || '—'}</div>
        </div>
        <div className={`${styles.dayStat} ${styles.dayOrders}`}>
          <div className={styles.dayStatLabelSm}>Commandes</div>
          <div>{day.orderCount}</div>
        </div>
        <div className={`${styles.dayStat} ${styles.dayTotal}`}>
          <div className={styles.dayStatLabelSm}>Total</div>
          <div>{fmtEUR(day.total)}</div>
        </div>
        <CaisseBadge auto={auto} ok={isOk} diff={diff} hasCount={day.cashCounted != null} />
        <div className={styles.chevronCell}><Icon.Chevron dir={open ? 'up' : 'down'} /></div>
      </button>
      {open && <DayDetail day={day} products={products} />}
    </div>
  );
}

function CaisseBadge({ auto, ok, diff, hasCount }) {
  if (auto) return (
    <span className={`${styles.badge} ${styles.badgeAuto}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
      Clôture auto
    </span>
  );
  if (ok) return (
    <span className={`${styles.badge} ${styles.badgeOk}`}>
      <Icon.Check size={16} /> Caisse OK
    </span>
  );
  if (!hasCount) return (
    <span className={`${styles.badge} ${styles.badgeNone}`}>Non comptée</span>
  );
  return (
    <span className={`${styles.badge} ${diff < 0 ? styles.badgeMissing : styles.badgeExcess}`}>
      Écart {diff > 0 ? '+' : ''}{fmtEUR(diff)}
    </span>
  );
}

function DayDetail({ day, products }) {
  const auto = !!day.autoClosed;
  const hasCount = day.cashCounted != null;
  const diff = (day.cashCounted ?? 0) - day.especes;
  return (
    <div className={styles.dayDetail}>
      {auto && (
        <div className={styles.autoWarning}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={styles.autoWarningIcon}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <div><b>Journée clôturée automatiquement.</b><br/>La caisse n'a pas été comptée à la fin de cette journée — le contrôle des espèces n'a pas été effectué.</div>
        </div>
      )}
      <div className={styles.detailGrid}>
        <div>
          <div className={styles.detailSectionLabel}>Détail par produit</div>
          <div className={styles.productList}>
            {products.map(p => {
              const qty = (day.products || {})[p.id] || 0;
              const total = qty * p.price;
              return (
                <div key={p.id} className={styles.productRow}>
                  {/* background et border inline — couleur spécifique au produit */}
                  <span className={styles.productEmoji}
                        style={{ background: p.color + '22', border: `1px solid ${p.color}40` }}>
                    {p.emoji}
                  </span>
                  <span className={styles.productName}>{p.name}</span>
                  <span className={styles.productQty}>×{qty}</span>
                  <span className={styles.productTotal}>{fmtEUR(total)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className={styles.detailSectionLabel}>Paiements</div>
          <div className={styles.detailRows}>
            <DetailRow icon={<span className={`${styles.dot} ${styles.dotEspeces}`} />} label="Espèces" value={fmtEUR(day.especes)} />
            <DetailRow icon={<span className={`${styles.dot} ${styles.dotCarte}`} />} label="Carte" value={fmtEUR(day.carte)} />
            <DetailRow label="Total encaissé" value={fmtEUR(day.total)} bold />
          </div>
        </div>
        <div>
          <div className={styles.detailSectionLabel}>Caisse espèces</div>
          <div className={styles.detailRows}>
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
    <div className={styles.detailRow}>
      <div className={styles.detailRowLeft}>{icon}{label}</div>
      {/* color inline — valeur calculée dynamiquement selon l'écart */}
      <div className={bold ? styles.detailRowValBold : styles.detailRowValNormal}
           style={{ color: muted ? 'var(--ink-mute)' : (color || 'var(--ink)') }}>
        {value}
      </div>
    </div>
  );
}
