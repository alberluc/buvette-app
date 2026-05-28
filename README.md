# Buvette Club — PWA tablette (Vite)

Application de caisse pour buvette de club sportif. Fonctionne 100 % hors-ligne,
installable comme une vraie app sur tablette iPad ou Android.

## Démarrage rapide (dev)

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
│   ├── data.js          # Produits, fmtEUR, summarize
│   ├── db.js            # Instance Dexie (IndexedDB)
│   ├── storage.js       # Persistance async : load / save / reset / licence / PIN
│   └── api.js           # Appels API licence (activate, refresh, parseJwt)
├── components/
│   ├── UI.jsx           # Composants partagés : boutons, icônes, nav…
│   ├── TweaksPanel.jsx  # Panneau de réglages flottant (dev/proto)
│   ├── PINScreen.jsx    # Écrans et modales PIN
│   └── LicenseScreen.jsx # Écrans d'activation et de renouvellement de licence
├── screens/
│   ├── OrdersScreen.jsx  # Écran 1 — Journal + modal nouvelle commande
│   ├── SummaryScreen.jsx # Écran 2 — Bilan du jour + clôture caisse
│   └── HistoryScreen.jsx # Écran 3 — Historique des journées
├── App.jsx              # Shell de l'application, navigation, état global
└── main.jsx             # Point d'entrée, capture beforeinstallprompt
api/
├── server.js            # API Express (activation / renouvellement / admin)
└── Dockerfile
```

## Personnalisation

**Produits et prix** — éditer `src/lib/data.js` → tableau `PRODUCTS` :

```js
export const PRODUCTS = [
  { id: 'biere', name: 'Bière', price: 2, emoji: '🍺', color: '#C99A3B' },
  // ...
];
```

## Déploiement

### Prérequis serveur

- Docker + Docker Compose
- Ports 80 et 443 ouverts
- DNS `buvette.petanquedutelegraphe.fr` et `api.petanquedutelegraphe.fr` pointant vers le serveur

### Première installation

```bash
git clone https://github.com/alberluc/buvette-app.git
cd buvette-app

# Créer le fichier de secrets
cp .env.example .env
# Éditer .env et remplacer les valeurs "changeme" par de vraies valeurs :
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

docker compose up -d --build
```

### Reverse proxy (Caddy)

Ajouter ces deux blocs dans le `Caddyfile` du Caddy central :

```
buvette.petanquedutelegraphe.fr {
    reverse_proxy host.docker.internal:8080
}

api.petanquedutelegraphe.fr {
    reverse_proxy host.docker.internal:3001
}
```

Puis recharger Caddy :

```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### Mises à jour

```bash
git pull
docker compose up -d --build
```

## Système de licences

L'application nécessite une licence valide au premier lancement. Sans licence, elle est inutilisable.

### Créer une licence (admin)

```bash
curl -s -X POST https://api.petanquedutelegraphe.fr/admin/licenses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: <ADMIN_SECRET>" \
  -d '{"club_name":"AS Sainte-Anne","email":"contact@club.fr","plan":"annual"}' | jq
```

`plan` accepte `monthly` (30 jours) ou `annual` (365 jours).

La réponse contient la clé au format `XXXX-XXXX-XXXX-XXXX` à transmettre au client.

### Lister les licences

```bash
curl -s https://api.petanquedutelegraphe.fr/admin/licenses \
  -H "X-Admin-Secret: <ADMIN_SECRET>" | jq
```

### Révoquer une licence

```bash
curl -s -X DELETE https://api.petanquedutelegraphe.fr/admin/licenses/<CLÉ> \
  -H "X-Admin-Secret: <ADMIN_SECRET>"
```

### Fonctionnement

- À l'activation, l'app échange la clé contre un JWT valable **30 jours**, stocké en IndexedDB.
- L'app fonctionne **100 % hors-ligne** pendant ces 30 jours.
- À J-3 avant expiration, un renouvellement silencieux est tenté si internet est disponible.
- Si le JWT expire sans renouvellement, un écran de renouvellement s'affiche.

## PWA — installation sur tablette

- **iPad** : ouvrir l'URL dans Safari → bouton « Partager » → « Sur l'écran d'accueil »
- **Android** : ouvrir dans Chrome → Chrome propose automatiquement l'installation

> Une PWA exige du HTTPS — `file://` et `http://` ne permettent pas l'installation
> ni le service worker.
