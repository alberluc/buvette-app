import { useState } from 'react';
import { Icon, BigButton } from './UI';
import { fmtEUR } from '../lib/data';
import styles from './OperationModal.module.css';

export function OperationModal({ onClose, onValidate, suggestions = {} }) {
  const [type, setType] = useState('sortie');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');

  const amountNum = parseFloat(amount.replace(',', '.'));
  const valid = !isNaN(amountNum) && amountNum > 0;

  const handleValidate = () => {
    if (!valid) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const signedAmount = type === 'entree' ? amountNum : -amountNum;
    const defaultLabel = type === 'entree' ? 'Entrée caisse' : 'Sortie caisse';
    onValidate({ id: crypto.randomUUID(), time, label: label.trim() || defaultLabel, amount: signedAmount });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <div className={styles.headerLabel}>Caisse</div>
            <h2 className={styles.headerTitle}>Opération de caisse</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Fermer">
            <Icon.Close size={24} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.typeGroup}>
            <TypeBtn
              active={type === 'sortie'}
              onClick={() => setType('sortie')}
              activeColor="var(--danger)"
            >
              − Sortie
            </TypeBtn>
            <TypeBtn
              active={type === 'entree'}
              onClick={() => setType('entree')}
              activeColor="var(--ok)"
            >
              + Entrée
            </TypeBtn>
          </div>

          <div>
            <label className={styles.fieldLabel}>Montant (€)</label>
            <div
              className={styles.amountWrap}
              style={{ '--amount-focus-color': type === 'sortie' ? 'var(--danger)' : 'var(--ok)' }}
            >
              <span className={styles.amountSign} style={{ color: type === 'sortie' ? 'var(--danger)' : 'var(--ok)' }}>
                {type === 'sortie' ? '−' : '+'}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                className={styles.amountInput}
                style={{ color: type === 'sortie' ? 'var(--danger)' : 'var(--ok)' }}
                autoFocus
              />
              <span className={styles.euroSign}>€</span>
            </div>
          </div>

          <div>
            <label className={styles.fieldLabel}>Libellé (optionnel)</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={type === 'sortie' ? 'Achat glaçons, petite caisse…' : 'Appoint monnaie, dépôt…'}
              className={styles.labelInput}
            />
            {(suggestions[type] ?? []).length > 0 && (
              <div className={styles.chips}>
                {(suggestions[type] ?? []).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLabel(s)}
                    className={`${styles.chip} ${label === s ? styles.chipActive : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <BigButton variant="ghost" onClick={onClose} style={{ minWidth: 140 }}>
            Annuler
          </BigButton>
          <BigButton
            variant={type === 'sortie' ? 'danger' : 'primary'}
            disabled={!valid}
            onClick={handleValidate}
            style={{ flex: 1, fontSize: 20, height: 68 }}
          >
            Enregistrer · {valid ? (type === 'sortie' ? '−' : '+') + fmtEUR(amountNum) : '—'}
          </BigButton>
        </div>
      </div>
    </div>
  );
}

function TypeBtn({ children, active, onClick, activeColor }) {
  return (
    <button
      onClick={onClick}
      className={styles.typeBtn}
      style={active
        ? { background: activeColor + '18', borderColor: activeColor, color: activeColor }
        : { background: 'transparent', borderColor: 'var(--line)', color: 'var(--ink-soft)' }
      }
    >
      {children}
    </button>
  );
}
