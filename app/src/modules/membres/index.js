import { Icon } from '../../components/UI';
import { MembresProvider } from './MembresProvider';
import { MembersScreen } from './screens/MembersScreen';

// Descripteur du module — voir modules/index.js pour le contrat.
// Pas de defaultLevel : données personnelles, l'accès doit être donné explicitement.
// Pas de reset : rien n'est stocké sur l'appareil.
export default {
  id: 'membres',
  label: 'Membres',
  description: 'Fichier des adhérents et coordonnées',
  Icon: Icon.Users,
  color: { fg: 'var(--blue)', bg: 'var(--blue-soft)' },
  Provider: MembresProvider,
  tabs: [
    { path: '/membres', label: 'Membres', Icon: Icon.Users, screenLabel: '05 Membres', Screen: MembersScreen },
  ],
};
