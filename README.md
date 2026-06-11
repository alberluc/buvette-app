# Assolyte — Application de caisse buvette

PWA tablette pour buvette de club sportif. Fonctionne 100 % hors-ligne, installable sur iPad ou Android.

## Structure

```
app/      # PWA React + Vite (tablette, hors-ligne)
api/      # API REST Node.js / Express + PostgreSQL
landing/  # Page de présentation (nginx)
admin/    # Interface admin (nginx)
```

## Développement

### Prérequis

- Docker + Docker Compose
- Node.js 22+ (optionnel — uniquement si tu lances app/api sans Docker)

### Démarrage

```bash
cp .env.example .env   # renseigner JWT_SECRET, ADMIN_SECRET, DB_PASS

npm run dev            # démarre toute la stack (app + api + db + landing + admin)
npm run dev:down       # arrête tout
npm run dev:logs       # suit les logs api + app en temps réel
```

| Service | URL |
|---------|-----|
| App (Vite HMR) | http://localhost:5173 |
| API (nodemon)  | http://localhost:3001 |
| Landing        | http://localhost:8081 |
| Admin          | http://localhost:8082 |
| DB PostgreSQL  | localhost:5432 |

Au premier `npm run dev`, les `node_modules` s'installent dans des volumes Docker dédiés (~30 s). Les relances suivantes sont immédiates.

### Sans Docker (app ou api seul)

```bash
cd app && npm install && npm run dev   # Vite sur :5173
cd api && npm install && npm run dev   # nodemon sur :3000
```

## Déploiement

```bash
cp .env.example .env   # renseigner les valeurs de production

npm run prod           # docker compose up (builds de production)
npm run prod:down      # docker compose down
```

Le reverse proxy (Caddy) est géré dans un projet séparé. Ports à exposer :

| Service | Port | Domaine |
|---------|------|---------|
| app     | 8080 | `app.assolyte.fr` |
| api     | 3001 | `api.assolyte.fr` |
| landing | 8081 | `assolyte.fr` |
| admin   | 8082 | `admin.assolyte.fr` |

### Mises à jour

```bash
git pull
npm run prod
```

## Gestion des licences

### Créer une licence

```bash
curl -s -X POST https://api.assolyte.fr/admin/licenses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: <ADMIN_SECRET>" \
  -d '{"club_name":"AS Exemple","email":"contact@club.fr","plan":"annual"}' | jq
```

`plan` : `monthly` (30 jours) ou `annual` (365 jours). La réponse contient la clé `XXXX-XXXX-XXXX-XXXX` à transmettre au client.

### Lister / révoquer

```bash
# Lister
curl -s https://api.assolyte.fr/admin/licenses \
  -H "X-Admin-Secret: <ADMIN_SECRET>" | jq

# Révoquer
curl -s -X DELETE https://api.assolyte.fr/admin/licenses/<CLÉ> \
  -H "X-Admin-Secret: <ADMIN_SECRET>"
```

### Fonctionnement

- L'app échange la clé contre un JWT de 30 jours stocké en IndexedDB.
- Fonctionne hors-ligne pendant toute la durée du JWT.
- Renouvellement silencieux à J-3 si internet disponible.

## PWA — installation tablette

- **iPad** : Safari → Partager → « Sur l'écran d'accueil »
- **Android** : Chrome propose l'installation automatiquement

> HTTPS requis pour le service worker et l'installation PWA.
