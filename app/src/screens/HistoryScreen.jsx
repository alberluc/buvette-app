import { useState, useMemo } from 'react';
import { AppHeader, Icon } from '../components/UI';
import { fmtEUR } from '../lib/data';
import { downloadXlsx } from '../lib/api';
import styles from './HistoryScreen.module.css';

function monthKey(dayKey) { return dayKey ? dayKey.slice(0, 7) : ''; }

function monthLabel(ym) {
  const [year, month] = ym.split('-');
  return new Date(year, Number(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function HistoryScreen({ archived, products, cashFloat, sessionToken }) {
  const [openId, setOpenId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const days = archived || [];

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Recalcule attendu + écart pour chaque journée archivée en propageant la base
  // (fond de caisse → dernier comptage connu) — doit rester sur toutes les journées
  const daysComputed = useMemo(() => {
    let base = cashFloat ?? 0;
    const result = [];
    for (const day of [...days].reverse()) {
      const mouvTotal = (day.mouvements || []).reduce((s, m) => s + m.amount, 0);
      const attendu = base + day.especes + mouvTotal;
      const ecart = day.cashCounted != null ? day.cashCounted - attendu : null;
      result.unshift({ ...day, _attendu: attendu, _ecart: ecart, _base: base, _mouvTotal: mouvTotal, _grandTotal: day.total + mouvTotal });
      base = day.cashCounted != null ? day.cashCounted : attendu;
    }
    return result;
  }, [days, cashFloat]);

  const availableMonths = useMemo(() => {
    const months = new Set(daysComputed.map(d => monthKey(d.dayKey)));
    months.add(currentMonth);
    return [...months].sort().reverse();
  }, [daysComputed, currentMonth]);

  const filteredDays = useMemo(
    () => daysComputed.filter(d => monthKey(d.dayKey) === selectedMonth),
    [daysComputed, selectedMonth],
  );

  const handleExport = async () => {
    if (!sessionToken || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const blob = await downloadXlsx(sessionToken, year, month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assolyte-${selectedMonth}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Export impossible (hors ligne ?)');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.screen}>
      <AppHeader
        subtitle="JOURNÉES PRÉCÉDENTES"
        title="Historique"
        right={
          <div className={styles.headerRight}>
            <div className={styles.headerLabel}>{monthLabel(selectedMonth)}</div>
            <div className={styles.headerValue}>
              {fmtEUR(filteredDays.reduce((s, d) => s + d._grandTotal, 0))}
            </div>
            <div className={styles.headerSub}>
              {filteredDays.length} journée{filteredDays.length !== 1 ? 's' : ''} · {filteredDays.reduce((s, d) => s + d.orderCount, 0)} commandes
            </div>
            {filteredDays.length > 0 && (
              <button onClick={handleExport} className={styles.exportBtn} title="Exporter en Excel" disabled={exporting || !sessionToken}>
                <DownloadSvg /> {exporting ? '…' : 'Excel'}
              </button>
            )}
            {exportError && <div className={styles.exportError}>{exportError}</div>}
          </div>
        }
      />

      {availableMonths.length > 1 && (
        <div className={styles.monthBar}>
          {availableMonths.map(ym => (
            <button
              key={ym}
              onClick={() => { setSelectedMonth(ym); setOpenId(null); }}
              className={`${styles.monthChip} ${ym === selectedMonth ? styles.monthChipActive : ''}`}
            >
              {monthLabel(ym)}
            </button>
          ))}
        </div>
      )}

      <div className={styles.list}>
        {filteredDays.length === 0 ? (
          <div className={styles.emptyState}>
            {days.length === 0 ? (
              <>
                <div className={styles.emptyTitle}>Aucune journée archivée</div>
                <div className={styles.emptyText}>Les journées clôturées apparaîtront ici.</div>
              </>
            ) : (
              <>
                <div className={styles.emptyTitle}>Aucune journée ce mois-ci</div>
                <div className={styles.emptyText}>Sélectionnez un autre mois pour voir l&apos;historique.</div>
              </>
            )}
          </div>
        ) : (
          <div className={styles.dayListInner}>
            {filteredDays.map((day, i) => (
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
  const diff = day._ecart ?? 0;
  const isOk = !auto && day.cashCounted != null && Math.abs(diff) < 0.01;
  return (
    <div className={`${styles.dayRow} ${auto ? styles.dayRowAuto : ''}`}>
      <button onClick={onToggle} className={styles.dayToggleBtn}>
        <div>
          <div className={styles.dayDate}>{day.date}</div>
        </div>
        <div className={`${styles.dayStat} ${styles.dayOrders}`}>
          <div className={styles.dayStatLabelSm}>Commandes</div>
          <div>{day.orderCount}</div>
        </div>
        <div className={`${styles.dayStat} ${styles.dayTotal}`}>
          <div className={styles.dayStatLabelSm}>Total</div>
          <div>{fmtEUR(day._grandTotal)}</div>
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
  const diff = day._ecart ?? 0;
  const mouvements = day.mouvements || [];

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
              if (qty === 0) return null;
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
            <DetailRow label="Total" value={fmtEUR(day.total)} bold />
          </div>
          {mouvements.length > 0 && (
            <>
              <div className={styles.detailSectionLabel} style={{ marginTop: 16 }}>Opérations de caisse</div>
              <div className={styles.detailRows}>
                {mouvements.map(m => (
                  <DetailRow
                    key={m.id}
                    label={`${m.time} · ${m.label}`}
                    value={(m.amount >= 0 ? '+' : '') + fmtEUR(m.amount)}
                    color={m.amount >= 0 ? 'var(--ok)' : 'var(--danger)'}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div>
          <div className={styles.detailSectionLabel}>Caisse espèces</div>
          <div className={styles.detailRows}>
            <DetailRow label="Fond de caisse" value={fmtEUR(day._base)} />
            <DetailRow label="Espèces du jour" value={'+' + fmtEUR(day.especes)} />
            {day._mouvTotal !== 0 && (
              <DetailRow
                label="Opérations"
                value={(day._mouvTotal >= 0 ? '+' : '') + fmtEUR(day._mouvTotal)}
                color={day._mouvTotal >= 0 ? 'var(--ok)' : 'var(--danger)'}
              />
            )}
            <DetailRow label="Attendu en caisse" value={fmtEUR(day._attendu)} bold />
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

function DownloadSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v10M7 15l5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
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
