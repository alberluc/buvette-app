# Déploiement — Buvette Club

## Architecture

```
[Browser] → [Reverse proxy :443] → app  (port 8080, nginx)
                                  → api  (port 3001, Node.js)
                                         ↓
                                        db  (port 5432, PostgreSQL)
```

- `app` — PWA React compilée, servie par nginx
- `api` — API REST Node.js / Express
- `db`  — PostgreSQL 16

---

## Prérequis serveur

- Docker + Docker Compose
- Un reverse proxy (Traefik, Caddy, nginx…) qui route :
  - `buvette.petanquedutelegraphe.fr` → `localhost:8080`
  - `api.petanquedutelegraphe.fr`     → `localhost:3001`
- DNS des deux sous-domaines pointant vers le serveur

---

## Première installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd buvette
```

### 2. Créer le fichier de secrets

```bash
cp .env.example .env
```

Éditer `.env` et renseigner des valeurs fortes :

```dotenv
# Générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<générer>
ADMIN_SECRET=<générer>
DB_PASS=<générer>
```

> **Ne jamais committer `.env`** — il contient les secrets de production.

### 3. Construire et démarrer

```bash
docker compose up -d --build
```

Docker Compose :
1. Démarre PostgreSQL et attend qu'il soit `healthy`
2. Lance les migrations Knex (`knex migrate:latest`)
3. Démarre l'API Node.js sur le port 3001
4. Construit l'image nginx de l'app (avec `VITE_API_URL` baked dans le bundle) sur le port 8080

Vérifier que tout tourne :

```bash
docker compose ps
docker compose logs api --tail=20
```

### 4. Créer la première licence

Sans licence l'app affiche un écran de blocage. Créer une licence pour le club :

```bash
curl -s -X POST https://api.petanquedutelegraphe.fr/admin/licenses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: <ADMIN_SECRET>" \
  -d '{"club_name":"Nom du Club","email":"contact@club.fr","plan":"annual"}' | jq
```

`plan` : `monthly` (30 jours) ou `annual` (365 jours).

La réponse contient la clé au format `XXXX-XXXX-XXXX-XXXX` à saisir dans l'app au premier lancement.

---

## Mises à jour

```bash
git pull
docker compose up -d --build app api
```

La DB n'est pas reconstruite. Les migrations éventuelles sont appliquées automatiquement au redémarrage de `api`.

---

## Gestion des licences

### Lister toutes les licences

```bash
curl -s https://api.petanquedutelegraphe.fr/admin/licenses \
  -H "X-Admin-Secret: <ADMIN_SECRET>" | jq
```

### Révoquer une licence

```bash
curl -s -X DELETE https://api.petanquedutelegraphe.fr/admin/licenses/<CLÉ> \
  -H "X-Admin-Secret: <ADMIN_SECRET>"
```

### Générer manuellement un token (debug)

```bash
curl -s -X POST https://api.petanquedutelegraphe.fr/admin/licenses/<CLÉ>/token \
  -H "X-Admin-Secret: <ADMIN_SECRET>" | jq
```

---

## Maintenance

### Logs

```bash
docker compose logs api -f
docker compose logs app -f
```

### Redémarrer un service

```bash
docker compose restart api
```

### Sauvegarde de la base

```bash
docker compose exec db pg_dump -U buvette buvette > backup_$(date +%Y%m%d).sql
```

### Restauration

```bash
cat backup_20260101.sql | docker compose exec -T db psql -U buvette buvette
```

### Réinitialiser complètement la DB (⚠ destructif)

```bash
docker compose down -v          # supprime le volume db_data
docker compose up -d --build    # repart de zéro
```

---

## Variables d'environnement

| Variable       | Description                                  | Exemple                        |
|----------------|----------------------------------------------|--------------------------------|
| `JWT_SECRET`   | Secret de signature des tokens JWT           | chaîne hex 64 caractères       |
| `ADMIN_SECRET` | Clé pour les routes `/admin/*`               | chaîne hex 32 caractères       |
| `DB_PASS`      | Mot de passe PostgreSQL                      | chaîne aléatoire               |
| `DB_HOST`      | Hôte PostgreSQL (fixé à `db` par compose)    | `db`                           |
| `DB_NAME`      | Nom de la base                               | `buvette`                      |
| `DB_USER`      | Utilisateur PostgreSQL                       | `buvette`                      |

---

## Ports exposés

| Service | Port externe | Port interne | Usage                        |
|---------|-------------|--------------|------------------------------|
| `app`   | 8080        | 80           | PWA nginx → reverse proxy    |
| `api`   | 3001        | 3000         | API REST → reverse proxy     |
| `db`    | 5432        | 5432         | PostgreSQL (debug local)     |
