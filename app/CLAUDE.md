# Buvette Club — CLAUDE.md

Application de caisse pour buvette de club sportif. PWA tablette (paysage), 100 % hors-ligne.

## Commandes

```bash
npm run dev      # serveur de développement (HMR)
npm run build    # build de production → dist/
npm run preview  # prévisualiser le build
npm run lint     # lint ESLint
```

## Stack

- **React 19** + **Vite 8** — pas de router (navigation par état `tab`)
- **Dexie 4** — IndexedDB, remplace localStorage
- **vite-plugin-pwa** — génère manifest + service worker au build
- Le style utilise **CSS Modules** (un fichier `.module.css` par composant/écran). Les styles dynamiques (couleurs produit, valeurs calculées depuis l'état) restent en `style={{}}` inline.

## Structure

```
src/
├── lib/
│   ├── data.js          # PRODUCTS, TODAY, HISTORY, fmtEUR(), summarize()
│   ├── db.js            # instance Dexie (table `state`, clé `key`)
│   └── storage.js       # load/save/reset/loadPIN/savePIN (tous async)
├── components/
│   ├── UI.jsx           # PayBadge, BigButton, Icon, StatusBar, TabBar, AppHeader
│   ├── TweaksPanel.jsx  # useTweaks + tous les contrôles Tweak* (outil dev/proto)
│   └── PINScreen.jsx    # PINLockScreen, PINChallenge, ChangePINModal
├── screens/
│   ├── OrdersScreen.jsx  # Écran 1 — journal + modal nouvelle commande
│   ├── SummaryScreen.jsx # Écran 2 — bilan du jour + clôture caisse
│   └── HistoryScreen.jsx # Écran 3 — historique des journées archivées
├── App.jsx              # shell, état global, flux PIN, SettingsDrawer
├── main.jsx             # point d'entrée, capture beforeinstallprompt
└── index.css            # variables CSS + reset global (pas de classes)
```

## Modèle de données

### Journée en cours (`day`)
```js
{
  dayKey: 'YYYY-MM-DD',   // clé de tri / détection changement de date
  date: 'Samedi 3 mai…',  // chaîne affichable
  orders: [Order],
  dayClosed: false,
  cashCounted: null,      // montant espèces compté (number | null)
}
```

### Commande (`Order`)
```js
{ time: 'HH:MM', items: [['biere', 2], ['soda', 1]], payment: 'especes'|'carte', total: 5 }
```

### Journée archivée
```js
{ dayKey, date, orderCount, total, especes, carte, cashCounted, closed, autoClosed, products: { biere: 12, … } }
```

### Produits (`PRODUCTS` dans `data.js`)
```js
{ id: 'biere', name: 'Bière', price: 2, emoji: '🍺', color: '#C99A3B' }
```
Modifier ce tableau pour changer le catalogue.

## État global (App.jsx)

`App.jsx` est la seule source de vérité. Il gère :

| State | Type | Rôle |
|---|---|---|
| `day` | object | Journée en cours |
| `archived` | array | Historique des journées clôturées |
| `loaded` | bool | Chargement initial terminé |
| `tab` | string | `'orders'` `'summary'` `'history'` |
| `storedPIN` | string\|null | Code PIN stocké (`null` = jamais modifié, défaut `'1234'`) |
| `pinUnlocked` | bool | L'utilisateur a passé l'écran de verrouillage (reset au rechargement) |
| `pendingClose` | object\|null | `{ cashCounted }` — déclenche la modale PIN avant clôture |

## Persistance (IndexedDB)

Base Dexie `buvette`, table `state`, deux enregistrements :

| Clé | Contenu |
|---|---|
| `'v2'` | `{ day, archived }` — état complet de l'app |
| `'pin'` | Code PIN sous forme de chaîne `'XXXX'` |

`reset()` supprime les deux clés. `loadPIN()` retourne `null` si jamais modifié (le code par défaut `'1234'` est dans `DEFAULT_PIN`).

## Système PIN

Trois points de contrôle :
1. **Ouverture de l'app** — `PINLockScreen` (plein écran) bloque tant que `!pinUnlocked`
2. **Clôture de journée** — `SummaryScreen` appelle `requestCloseDay()` → `PINChallenge` (modale) → `closeDay()`
3. **Changement de code** — `ChangePINModal` (3 étapes) depuis le drawer Réglages → section Sécurité

Les composants PIN sont dans `src/components/PINScreen.jsx`.

## Auto-archive à minuit

Un `setInterval` de 60 s dans `App.jsx` compare `day.dayKey` avec `todayKey()`. Si la date a changé (app restée ouverte toute la nuit), la journée est archivée automatiquement (`autoClosed: true`) et une nouvelle journée vide est créée.

## PWA

`vite.config.js` configure `vite-plugin-pwa` avec `registerType: 'autoUpdate'`. Le manifest et le SW sont générés au build — ne pas créer `manifest.webmanifest` ou `service-worker.js` manuellement.

Les icônes sont dans `public/` : `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`.

## Conventions

- **CSS Modules** — un fichier `Foo.module.css` à côté de chaque `Foo.jsx`, importé comme `import styles from './Foo.module.css'`
- **Inline style uniquement** pour les valeurs dynamiques impossibles en CSS pur (couleur spécifique d'un produit, largeur calculée depuis l'état, etc.)
- **Pas de router** — la navigation est un `useState('orders'|'summary'|'history')`
- **Pas de global state** (Redux, Zustand…) — tout dans `App.jsx`, passé en props
- **Pas de TypeScript** — JS pur
- **Composants sous-écran** (ex : `OrderRow`, `ProductCard`) définis dans le même fichier que leur écran parent, non exportés
- `fmtEUR(n)` pour tout affichage monétaire
- `summarize(orders)` calcule totaux, répartition espèces/carte, qtés par produit
