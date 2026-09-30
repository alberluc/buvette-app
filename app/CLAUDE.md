# Assolyte — app (PWA)

PWA tablette pour club sportif. Organisée en **socle** (licence, comptes, apparence, navigation) + **modules** fonctionnels activés par licence :
- **buvette** — caisse, 100 % hors-ligne
- **membres** — fichier des adhérents, en ligne uniquement (données personnelles)

## Commandes

```bash
npm run dev      # serveur de développement (HMR)
npm run build    # build de production → dist/
npm run preview  # prévisualiser le build
npm run lint     # lint ESLint
```

## Stack

- **React 19** + **Vite 8**
- **react-router-dom 7** — `BrowserRouter` dans `main.jsx`, routes construites dans `App.jsx` à partir des modules
- **Dexie 4** — IndexedDB (base `buvette`, table `state` clé/valeur partagée socle + modules)
- **vite-plugin-pwa** — génère manifest + service worker au build
- **CSS Modules** (un `.module.css` par composant/écran). Les styles dynamiques (couleurs produit, valeurs calculées) restent en `style={{}}` inline.

## Structure

```
src/
├── App.jsx               # shell du socle : licence, session, comptes, tweaks, routes, TabBar
├── main.jsx              # point d'entrée, BrowserRouter, capture beforeinstallprompt
├── components/           # socle : UI.jsx (Icon, TabBar, StatusBar…), LoginScreen, LicenseScreen,
│                         #         SettingsDrawer, TweaksPanel
├── screens/
│   └── SettingsScreen.jsx  # /reglages — cartes du socle + cartes fournies par les modules
├── lib/                  # socle : api.js (licences, comptes, /settings), storage.js (licence,
│                         #         session, comptes, tweaks), format.js (fmtEUR, todayKey, formatDate),
│                         #         db.js, theme.js
└── modules/
    ├── index.js          # registre MODULES + contrat d'un module + enabledModules(licenseInfo)
    └── buvette/
        ├── index.js          # descripteur du module (onglets, Provider, réglages, overlays…)
        ├── BuvetteProvider.jsx # tout l'état caisse : journée, archives, produits, synchro, minuit
        ├── context.js        # useBuvette()
        ├── paths.js          # /buvette/journal, /buvette/bilan, /buvette/historique
        ├── routes.jsx        # adaptateurs route → écran (props depuis useBuvette)
        ├── screens/          # OrdersScreen, SummaryScreen, HistoryScreen
        ├── components/       # OperationModal, CashCountModal, BuvetteOverlays, BuvetteSettings
        └── lib/              # api.js, storage.js, data.js (DEFAULT_PRODUCTS, summarize…), day.js
    └── membres/
        ├── index.js          # descripteur (onglet /membres, pas de defaultLevel ni de reset)
        ├── MembresProvider.jsx # sans état : { sessionToken, canEdit }
        ├── context.js        # useMembres()
        ├── screens/          # MembersScreen (tableau, recherche, filtre, export)
        ├── components/       # MemberModal (fiche : création, édition, lecture seule, suppression)
        └── lib/api.js        # /members (aucun stockage local)
```

**Règle de dépendance** : les modules importent le socle, jamais l'inverse. Le socle ne connaît les modules que via `modules/index.js`. Un module n'importe pas un autre module.

## Ajouter un module

1. Côté API : ajouter l'id dans `api/lib/modules.js`, protéger ses routes avec `requireSession, requireModule('<id>')` (lecture/usage) ou `requireModule('<id>', 'admin')` (réglages du module). Ajouter `{ fresh: true }` si le module expose des données personnelles : les droits sont alors relus en base à chaque requête au lieu de se fier au token (7 j).
2. Créer `src/modules/<id>/index.js` qui respecte le contrat documenté dans `modules/index.js` (`id`, `label`, `Provider`, `tabs`, et optionnellement `defaultLevel`, `Overlays`, `DevTools`, `SettingsMain`, `SettingsSide`, `reset`). Ne pas mettre de `defaultLevel` si le module manipule des données personnelles.
3. L'ajouter au tableau `MODULES` de `modules/index.js`.
4. Activer le module sur une licence : `PUT /admin/licenses/:key/modules`.

Les onglets du module apparaissent dans la TabBar seulement si le module est activé sur la licence (`currentUser.modules`, lu dans le token de session) **et** si l'utilisateur y a accès (`currentUser.permissions`). Un token sans champ `modules` vaut `['buvette']`. Un module activé sur une licence apparaît à la prochaine ouverture de l'app (voir « Rafraîchissement de session »).

## Droits

- **Administrateur du club** (`role: 'admin'`) : gère les comptes et l'identité du club, et a implicitement le niveau `admin` sur tous les modules de la licence.
- **Bénévole** (`role: 'user'`) : droits par module, stockés dans `account_permissions` côté API. Niveaux : `user` (utiliser le module) et `admin` (« Responsable » : réglages du module). Pas de ligne = aucun accès.
- Les droits effectifs et les modules de la licence sont calculés côté serveur et embarqués dans le token de session (`modules: ['buvette'], permissions: { buvette: 'user' }`).
- Côté app : `enabledModules(user)`, `moduleLevel(user, id)` et `accessibleModules(user)` (`modules/index.js`) ; les cartes de réglages d'un module reçoivent `isAdmin` = responsable de ce module. `userFromSession()` (`lib/permissions.js`) reproduit le repli de l'API pour les sessions émises avant les droits par module.

### Rafraîchissement de session

À chaque ouverture de l'app (session locale valide, en ligne), `App.jsx` appelle `POST /auth/refresh` : l'API relit compte, droits, modules et licence en base et renvoie un nouveau token de session + un nouveau token de licence. Conséquences :
- un module activé ou un droit modifié apparaît à la prochaine ouverture de l'app, sans reconnexion ;
- compte supprimé (401) ou licence révoquée/expirée (403) → retour à l'écran de connexion ;
- hors ligne → la session locale est conservée telle quelle ;
- la session glisse : elle reste valide 7 jours après la dernière ouverture en ligne.

Ne pas lire les modules dans le token de licence : il peut dater de 30 jours.

## Socle (App.jsx)

| State | Rôle |
|---|---|
| `licenseStatus` / `licenseToken` / `licenseInfo` | Licence activée sur l'appareil (`{ club, plan, licenseExpires }`) |
| `sessionToken` / `currentUser` | Utilisateur connecté (`{ id, name, role: 'admin'|'user', modules: [id], permissions: { module: 'user'|'admin' } }`) |
| `cachedAccounts` | Comptes du club, cache hors-ligne pour l'écran de connexion |
| `apiOnline` | Remonté par les modules via le callback `onApiStatus` (point vert / « Hors ligne ») |
| `t` | Préférences d'apparence (tweaks) |

Flux : licence → connexion → les `Provider` des modules accessibles sont montés autour du shell (ils chargent leurs données à ce moment-là et rendent `null` tant qu'ils chargent). À la déconnexion, ils sont démontés.

## Module buvette

### Journée en cours (`day`)
```js
{ dayKey: 'YYYY-MM-DD', date: 'Samedi 3 mai…', orders: [Order], mouvements: [Operation], dayClosed: false, cashCounted: null }
```

### Commande (`Order`)
```js
{ id, time: 'HH:MM', items: [['biere', 2], ['soda', 1]], payment: 'especes'|'carte', total: 5, by: 'Nom' }
```

### Journée archivée
```js
{ dayKey, date, orderCount, total, especes, carte, cashCounted, mouvements, closed, autoClosed, products: { biere: 12, … } }
```

### Produits
```js
{ id: 'biere', name: 'Bière', price: 2, emoji: '🍺', color: '#C99A3B' }
```
Catalogue par défaut : `DEFAULT_PRODUCTS` (`modules/buvette/lib/data.js`) ; le catalogue réel vient de l'API (`/products`) et se modifie dans Réglages.

### Synchro hors-ligne
- Chaque commande/opération est ajoutée localement puis poussée à l'API ; `pushingRef` évite les doubles envois.
- Polling toutes les 10 s (`/days/current`) : fusion des éléments locaux non confirmés + renvoi de ceux qui manquent côté serveur. Resynchro complète au retour de connexion.
- Auto-archive à minuit : `setInterval` de 60 s qui compare `day.dayKey` au jour courant.

## Module membres

Entité `members` côté API (table du socle, référençable par de futurs modules : cotisations, événements…).

```js
{ id, firstName, lastName, email, phone, address, postalCode, city,
  birthDate: 'YYYY-MM-DD'|null, memberSince: 'YYYY-MM-DD'|null, status: 'active'|'inactive',
  notes, consentAt: ISO|null, createdAt, updatedAt }
```

- **Droits** : `user` = consultation (fiche en lecture seule), `admin` (responsable) = création, modification, suppression, export CSV. Aucun accès par défaut pour un nouveau bénévole.
- **Routes** : `GET/POST /members`, `GET/PUT/DELETE /members/:id`, `GET /members/export.csv`. Toutes en `requireModule('membres', …, { fresh: true })` : un droit retiré, un compte supprimé ou une licence révoquée prennent effet immédiatement.
- **Pas de hors-ligne** : la liste est chargée à l'ouverture de l'écran et oubliée en le quittant ; rien n'est écrit dans IndexedDB. Hors ligne, l'écran affiche « Connexion requise ».
- **RGPD** : case de consentement sur la fiche (`consent: true|false` à l'envoi ; la date `consentAt` est conservée tant qu'il n'est pas retiré), suppression définitive, export CSV (`;`, BOM UTF-8 pour Excel).

## Persistance (IndexedDB, table `state`)

| Clé | Propriétaire | Contenu |
|---|---|---|
| `license` | socle | token de licence |
| `session` | socle | token de session |
| `accounts-cache` | socle | comptes du club |
| `tweaks` | socle | préférences d'apparence |
| `v2` | buvette | `{ day, archived }` |
| `products` | buvette | catalogue |
| `settings` | buvette | `{ cashFloat, opSuggestions }` |

Ne pas renommer ces clés : les tablettes installées ont leurs données dessous. « Réinitialiser les données » appelle `reset()` du socle puis `reset()` de chaque module.

## PWA

`vite.config.js` configure `vite-plugin-pwa` avec `registerType: 'autoUpdate'`. Le manifest et le SW sont générés au build — ne pas créer `manifest.webmanifest` ou `service-worker.js` manuellement. Le fallback de navigation (Workbox + `nginx.conf`) sert `index.html` pour les routes du router.

Les icônes sont dans `public/` : `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`.

## Conventions

- **CSS Modules** — un fichier `Foo.module.css` à côté de chaque `Foo.jsx`, importé comme `import styles from './Foo.module.css'`. Exception : les cartes de réglages d'un module réutilisent les classes de carte de `screens/SettingsScreen.module.css` (import `shared`).
- **Inline style uniquement** pour les valeurs dynamiques impossibles en CSS pur
- **Pas de store global** (Redux, Zustand…) — état du socle dans `App.jsx`, état d'un module dans son `Provider` (contexte React). Les écrans restent pilotés par props.
- **Pas de TypeScript** — JS pur
- **Composants sous-écran** (ex : `OrderRow`, `ProductCard`) définis dans le même fichier que leur écran parent, non exportés
- `fmtEUR(n)` (`lib/format.js`) pour tout affichage monétaire
- `summarize(orders, products)` calcule totaux, répartition espèces/carte, qtés par produit
