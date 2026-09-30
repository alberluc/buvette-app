import { useState, useEffect } from 'react';
import { AppHeader, usePwaInstall } from '../components/UI';
import { formatDate } from '../lib/format';
import { ACCENT_SWATCHES } from '../lib/theme';
import styles from './SettingsScreen.module.css';

// Réglages globaux (/reglages) : apparence, licence, identité du club, équipe.
// Les réglages propres à un module sont dans le module (onglet « Réglages » de sa barre).
export function SettingsScreen({
  t, setTweak,
  licenseInfo,
  clubName, onClubNameChange,
  currentUser,
  onManageAccounts,
}) {
  // Administrateur du club : identité du club, comptes
  const isClubAdmin = currentUser?.role === 'admin';
  const { canInstall, install } = usePwaInstall();

  return (
    <div className={styles.screen}>
      <AppHeader subtitle="CONFIGURATION" title="Réglages" />
      <div className={styles.scrollArea}>
        <div className={`${styles.grid} ${!isClubAdmin ? styles.gridNarrow : ''}`}>
          <div className={styles.col}>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Apparence</div>
              <div className={styles.fieldLabel}>Couleur d'accent</div>
              <div className={styles.accentGrid}>
                {Object.entries(ACCENT_SWATCHES).map(([key, swatches]) => {
                  const active = t.accent === key;
                  const names = { club: 'Vert club', navy: 'Bleu marine', burgundy: 'Bordeaux', charcoal: 'Charbon' };
                  return (
                    <button key={key} onClick={() => setTweak('accent', key)}
                      className={`${styles.accentBtn} ${active ? styles.accentBtnActive : styles.accentBtnInactive}`}
                      style={active ? { border: `2px solid ${swatches[0]}`, background: swatches[2] } : {}}>
                      {/* background inline — couleur d'accent dynamique */}
                      <span className={styles.accentSwatch}
                            style={{ background: swatches[0], boxShadow: `inset 0 0 0 3px ${swatches[1]}` }} />
                      {names[key]}
                    </button>
                  );
                })}
              </div>
              <div className={`${styles.fieldLabel} ${styles.fieldLabelMt}`}>Taille du texte</div>
              <div className={styles.textSizeGrid}>
                {[{ v: 'normal', l: 'Normal' }, { v: 'large', l: 'Grand' }, { v: 'xlarge', l: '+ Grand' }].map(o => {
                  const on = t.textSize === o.v;
                  return (
                    <button key={o.v} onClick={() => setTweak('textSize', o.v)}
                      className={`${styles.textSizeBtn} ${on ? styles.textSizeBtnActive : styles.textSizeBtnInactive}`}>
                      {o.l}
                    </button>
                  );
                })}
              </div>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>Mode sombre</span>
                <button
                  role="switch" aria-checked={t.darkMode}
                  onClick={() => setTweak('darkMode', !t.darkMode)}
                  className={`${styles.toggleTrack} ${t.darkMode ? styles.toggleTrackOn : styles.toggleTrackOff}`}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
              {canInstall && (
                <div className={styles.toggleRow} style={{ marginTop: 12 }}>
                  <span className={styles.toggleLabel}>Installer l'application</span>
                  <button onClick={install} className={styles.installBtn}>Installer</button>
                </div>
              )}
            </div>

            {licenseInfo && (
              <div className={styles.card}>
                <div className={styles.cardTitle}>Licence</div>
                <div className={styles.infoCard}>
                  <div className={styles.infoCardTitle}>{licenseInfo.club}</div>
                  <div className={styles.infoCardSub}>
                    Licence {licenseInfo.plan === 'annual' ? 'annuelle' : 'mensuelle'} · expire le {formatDate(licenseInfo.licenseExpires)}
                  </div>
                </div>
              </div>
            )}

            {isClubAdmin && (
              <div className={styles.card}>
                <div className={styles.cardTitle}>Identité du club</div>
                <div className={styles.fieldLabel}>Nom du club</div>
                <ClubNameInput value={clubName ?? ''} onChange={onClubNameChange} />
                <div className={styles.hint}>
                  Affiché dans la barre de statut de l'application.
                </div>
              </div>
            )}

          </div>

          {isClubAdmin && (
            <div className={styles.col}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Équipe</div>
                <button onClick={onManageAccounts} className={styles.btn}>
                  👥 Gérer les comptes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClubNameInput({ value, onChange }) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);

  const handleSave = () => {
    const trimmed = local.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    else setLocal(value);
  };

  return (
    <input
      type="text"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={e => { if (e.key === 'Enter') { handleSave(); e.target.blur(); } }}
      placeholder="Ex : AS Bellecourt"
      className={styles.clubNameInput}
    />
  );
}
