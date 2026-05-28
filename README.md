# Buvette Club — PWA tablette (Vite)

Application de caisse pour buvette de club sportif. Fonctionne 100 % hors-ligne,
installable comme une vraie app sur tablette iPad ou Android.

Version Vite — build moderne avec HMR, IndexedDB et service worker généré automatiquement.

## Démarrage rapide

```bash
npm install
npm run dev      # serveur de développement avec HMR
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build localement
```

## Structure du projet

```
src/
├── lib/
│   ├── data.js          # Produits, données de démo, fmtEUR, summarize
│   ├── db.js            # Instance Dexie (IndexedDB)
│   └── storage.js       # Persistance async : load / save / reset
├── components/
│   ├── UI.jsx           # Composants partagés : boutons, icônes, nav…
│   └── TweaksPanel.jsx  # Panneau de réglages flottant (dev/proto)
├── screens/
│   ├── OrdersScreen.jsx  # Écran 1 — Journal + modal nouvelle commande
│   ├── SummaryScreen.jsx # Écran 2 — Bilan du jour + clôture caisse
│   └── HistoryScreen.jsx # Écran 3 — Historique des journées
├── App.jsx              # Shell de l'application, navigation, état global
└── main.jsx             # Point d'entrée, capture beforeinstallprompt
```

## Personnalisation

**Produits et prix** — éditer `src/lib/data.js` → tableau `PRODUCTS` :

```js
export const PRODUCTS = [
  { id: 'biere', name: 'Bière', price: 2, emoji: '🍺', color: '#C99A3B' },
  // ...
];
```

**Couleur d'accent** — via le panneau Tweaks (flottant en bas à droite en mode dev),
ou directement dans `src/index.css` → variable `--club`.

**Données de démonstration** — modifier `TODAY` et `HISTORY` dans `src/lib/data.js`.

## Persistance

Les données sont stockées en **IndexedDB** via [Dexie](https://dexie.org/), ce qui offre
une capacité bien supérieure à `localStorage` et des accès non bloquants.

La base s'appelle `buvette`, table `state`, clé `v2`.

Pour vider les données depuis la console navigateur :

```js
const db = new Dexie('buvette'); db.version(1).stores({ state: 'key' });
await db.state.delete('v2');
location.reload();
```

## PWA et déploiement

Le manifeste et le service worker sont générés automatiquement par
[vite-plugin-pwa](https://vite-pwa-org.netlify.app/) à chaque `npm run build`.

**Déployer sur Netlify :**

```bash
npm run build
npx netlify deploy --prod --dir dist
```

Ou glisser-déposer le dossier `dist/` sur [app.netlify.com/drop](https://app.netlify.com/drop).

> Une PWA exige du HTTPS — `file://` et `http://` ne permettent pas l'installation
> ni le service worker.

**Installer sur tablette :**

- **iPad** : ouvrir l'URL dans Safari → bouton « Partager » → « Sur l'écran d'accueil »
- **Android** : ouvrir dans Chrome → Chrome propose automatiquement l'installation

## Évolutions suggérées

- **Export CSV/PDF** du bilan de journée pour le trésorier
- **Authentification PIN** pour protéger la clôture
- **Synchronisation multi-tablettes** via Supabase
- **Décompte du stock** : bouteilles restantes mis à jour automatiquement
- **Statistiques saison** : graphique des recettes journée par journée
