import { Icon } from '../../components/UI';
import { BuvetteProvider } from './BuvetteProvider';
import { JournalRoute, BilanRoute, HistoriqueRoute } from './routes';
import { BuvetteOverlays, BuvetteDevTools } from './components/BuvetteOverlays';
import { BuvetteSettingsMain, BuvetteSettingsSide } from './components/BuvetteSettings';
import { reset } from './lib/storage';
import { BUVETTE_PATHS } from './paths';

// Descripteur du module — voir modules/index.js pour le contrat
export default {
  id: 'buvette',
  label: 'Buvette',
  description: 'Caisse, bilan du jour et historique des ventes',
  Icon: Icon.Mug,
  color: { fg: 'var(--amber)', bg: 'var(--amber-soft)' },
  defaultLevel: 'user',
  Provider: BuvetteProvider,
  tabs: [
    { path: BUVETTE_PATHS.journal,    label: 'Journal',    Icon: Icon.Receipt, screenLabel: '01 Commandes',  Screen: JournalRoute },
    { path: BUVETTE_PATHS.bilan,      label: 'Bilan',      Icon: Icon.Chart,   screenLabel: '02 Bilan',      Screen: BilanRoute },
    { path: BUVETTE_PATHS.historique, label: 'Historique', Icon: Icon.Clock,   screenLabel: '03 Historique', Screen: HistoriqueRoute },
  ],
  Overlays: BuvetteOverlays,
  DevTools: BuvetteDevTools,
  SettingsMain: BuvetteSettingsMain,
  SettingsSide: BuvetteSettingsSide,
  reset,
};
