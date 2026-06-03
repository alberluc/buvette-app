import { useState, useMemo } from 'react';
import { Icon, BigButton } from './UI';
import { fmtEUR } from '../lib/data';
import styles from './CashCountModal.module.css';

const BILLETS = [100, 50, 20, 10, 5];
const PIECES  = [2, 1, 0.50, 0.20, 0.10, 0.05];

function fmtDenom(v) {
  return v >= 1 ? `${v} €` : `${Math.round(v * 100)} c`;
}

export function CashCountModal({ onClose, onValidate }) {
  const [counts, setCounts] = useState({});

  const total = useMemo(() => {
    return Math.round([...BILLETS, ...PIECES].reduce((s, v) => s + (counts[v] || 0) * v, 0) * 100) / 100;
  }, [counts]);

  const set = (value, qty) => {
    const n = Math.max(0, Math.floor(qty || 0));
    setCounts(c => ({ ...c, [value]: n }));
  };

  const handleValidate = () => {
    onValidate(total);
    onClose();
  };

  const renderRow = (v) => {
    const qty = counts[v] || 0;
    const sub = Math.round(qty * v * 100) / 100;
    return (
      <div key={v} className={styles.denomRow}>
        <div className={styles.denomLabel}>{fmtDenom(v)}</div>
        <input
          type="number" min="0" inputMode="numeric"
          value={qty === 0 ? '' : qty}
          placeholder="0"
          className={styles.qtyInput}
          onChange={e => set(v, parseInt(e.target.value))}
        />
        <div className={styles.subTotal}>{sub > 0 ? fmtEUR(sub) : '—'}</div>
      </div>
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <div className={styles.headerLabel}>Caisse</div>
            <h2 className={styles.headerTitle}>Comptage des coupures</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Fermer">
            <Icon.Close size={24} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.grid}>
            <div className={styles.col}>
              <div className={styles.colTitle}>Billets</div>
              {BILLETS.map(renderRow)}
            </div>
            <div className={styles.divider} />
            <div className={styles.col}>
              <div className={styles.colTitle}>Pièces</div>
              {PIECES.map(renderRow)}
            </div>
          </div>
        </div>

        <div className={styles.totalBar}>
          <span className={styles.totalLabel}>Total compté</span>
          <span className={styles.totalValue}>{fmtEUR(total)}</span>
        </div>

        <div className={styles.actions}>
          <BigButton variant="ghost" onClick={onClose} style={{ minWidth: 140 }}>
            Annuler
          </BigButton>
          <BigButton variant="primary" onClick={handleValidate}
                     style={{ flex: 1, fontSize: 20, height: 68 }}>
            Valider · {fmtEUR(total)}
          </BigButton>
        </div>
      </div>
    </div>
  );
}
