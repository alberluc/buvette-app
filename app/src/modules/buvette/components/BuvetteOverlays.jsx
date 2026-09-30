import { Icon } from '../../../components/UI';
import { TweakSection, TweakButton } from '../../../components/TweaksPanel';
import { fmtEUR } from '../../../lib/format';
import { useBuvette } from '../context';
import styles from './BuvetteOverlays.module.css';

// Rendu par le shell dans la zone principale (le toast est positionné en absolu dedans)
export function BuvetteOverlays() {
  const { autoCloseNotice, dismissAutoCloseNotice, viewAutoCloseNotice, pendingClose, confirmClose, cancelClose } = useBuvette();
  return (
    <>
      {autoCloseNotice && (
        <AutoCloseToast entry={autoCloseNotice} onDismiss={dismissAutoCloseNotice} onView={viewAutoCloseNotice} />
      )}
      {pendingClose && <ConfirmCloseModal onConfirm={confirmClose} onCancel={cancelClose} />}
    </>
  );
}

// Boutons du panneau Tweaks (outil dev/proto)
export function BuvetteDevTools() {
  const { day, simulateNextDay, reopenDay, closeDay } = useBuvette();
  return (
    <>
      <TweakSection label="Démo" />
      <TweakButton label="🗓️ Simuler le jour suivant" onClick={simulateNextDay} />
      <TweakButton label={day.dayClosed ? 'Rouvrir la journée' : 'Clôturer la journée'} onClick={() => day.dayClosed ? reopenDay() : closeDay(day.cashCounted ?? 0)} />
    </>
  );
}

// ── Confirmation de clôture ───────────────────────────────────────────────────
function ConfirmCloseModal({ onConfirm, onCancel }) {
  return (
    <div className={styles.confirmOverlay}>
      <div className={styles.confirmModal}>
        <div className={styles.confirmTitle}>Clôturer la journée ?</div>
        <div className={styles.confirmBody}>
          Cette action archivera la journée en cours.<br />Elle peut être réouverte depuis le bilan.
        </div>
        <div className={styles.confirmActions}>
          <button onClick={onCancel} className={styles.confirmBtnCancel}>Annuler</button>
          <button onClick={onConfirm} className={styles.confirmBtnOk}>Clôturer</button>
        </div>
      </div>
    </div>
  );
}

// ── Toast clôture automatique ─────────────────────────────────────────────────
function AutoCloseToast({ entry, onDismiss, onView }) {
  return (
    <div className={styles.toast}>
      <div className={styles.toastIcon}>!</div>
      <div className={styles.toastBody}>
        <div className={styles.toastTitle}>Clôture automatique</div>
        <div className={styles.toastText}>
          La journée du <b>{entry.date}</b> n'a pas été clôturée manuellement.
          Elle a été archivée avec son total ({fmtEUR(entry.total)}).
        </div>
      </div>
      <button onClick={onView} className={styles.toastViewBtn}>Voir l'historique</button>
      <button onClick={onDismiss} aria-label="Fermer" className={styles.toastCloseBtn}>
        <Icon.Close size={20} />
      </button>
    </div>
  );
}
