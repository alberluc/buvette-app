import { AppHeader, Icon } from '../components/UI';
import styles from './HomeScreen.module.css';

const SETTINGS_TILE = {
  id: 'reglages',
  label: 'Réglages',
  description: 'Apparence, club, équipe et réglages des modules',
  Icon: Icon.Settings,
  color: { fg: 'var(--ink-soft)', bg: 'var(--cream-deep)' },
};

// Accueil (/) : un module = une tuile. Seuls les modules accessibles à l'utilisateur sont listés.
export function HomeScreen({ modules, settingsPath, userName, clubName, onOpen }) {
  const tiles = [
    ...modules.map(m => ({ ...m, path: m.tabs[0].path })),
    { ...SETTINGS_TILE, path: settingsPath },
  ];

  return (
    <div className={styles.screen}>
      <AppHeader subtitle={clubName || 'Assolyte'} title={userName ? `Bonjour ${userName.split(' ')[0]}` : 'Accueil'} />
      <div className={styles.scrollArea}>
        {modules.length === 0 && (
          <div className={styles.notice}>
            Aucun module ne vous est encore attribué. Demandez à un administrateur du club de vous donner accès.
          </div>
        )}
        <div className={styles.grid}>
          {tiles.map(tile => (
            <button key={tile.id} onClick={() => onOpen(tile.path)} className={styles.tile}>
              {/* couleurs inline — accent propre à chaque module */}
              <span className={styles.tileIcon} style={{ color: tile.color.fg, background: tile.color.bg }}>
                <tile.Icon size={42} />
              </span>
              <span className={styles.tileText}>
                <span className={styles.tileLabel}>{tile.label}</span>
                <span className={styles.tileDescription}>{tile.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
