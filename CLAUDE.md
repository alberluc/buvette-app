# Buvette Club — Monorepo

Application de caisse pour buvette de club sportif.

## Structure

```
app/      # PWA React (tablette, hors-ligne) — voir app/CLAUDE.md
api/      # API REST Node.js / Express + PostgreSQL
landing/  # Page de présentation (à venir)
```

## Infra

- `docker-compose.yml` — orchestre app + api + db (PostgreSQL)
- `Caddyfile` — reverse proxy en production
- `.env.example` — variables d'environnement nécessaires (JWT_SECRET, ADMIN_SECRET, DB_PASS)

## Démarrage rapide

```bash
# Dev app frontend
cd app && npm install && npm run dev

# Dev API
cd api && npm install && npm run dev

# Stack complète (Docker)
cp .env.example .env   # puis éditer les valeurs
docker compose up
```
