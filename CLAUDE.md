# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mission
Agrégateur d'offres d'alternance cybersécurité. Stack DevSecOps complète.
Coût infrastructure cible : 0€.

## Commandes de développement

### Scraper Python

```bash
# Installer les dépendances
pip install -r scraper/requirements.txt

# Lancer le scraper (requiert .env.local ou variables d'environnement)
python -m scraper.main

# Lint
flake8 scraper/

# Tests complets avec couverture
pytest scraper/tests/ --cov=scraper --cov-report=xml
coverage report --fail-under=70

# Test unitaire isolé
pytest scraper/tests/test_normalizer.py
pytest scraper/tests/test_deduplicator.py -v

# SAST
bandit -r scraper/ -ll --exit-zero
```

### Docker scraper

```bash
docker build -t alternancehub-scraper:test ./scraper
docker run --env-file .env.local alternancehub-scraper:test
```

### Supabase

Appliquer la migration initiale depuis l'éditeur SQL Supabase :
```
infra/supabase/migrations/001_initial.sql
```

## Architecture

Monorepo structuré en couches distinctes :

```
scraper/          → Ingestion Python (seule partie fonctionnelle en phase 1/2)
web/              → Frontend Next.js (pas encore implémenté)
infra/supabase/   → Migrations SQL versionnées
infra/k8s/        → Manifestes Kubernetes (futur)
.github/workflows/→ CI (ci.yml) + Cron scraper (scraper.yml)
```

### Pipeline de données scraper

```
API La Bonne Alternance (GET /job/v1/search)
  → sources/france_travail_rss.py  (_fetch_from_json_api)
  → normalizer.py                  (NormalizedOffer dataclass)
  → deduplicator.py                (SHA256 sur title::company)
  → main.py                        (upsert Supabase sur conflict hash)
  → Supabase table offers
```

**Fallback** : si `FRANCE_TRAVAIL_API_URL` est vide, le scraper tente `FRANCE_TRAVAIL_RSS_URL` via feedparser.

### Table Supabase `offers`

Colonnes clés : `hash` (UNIQUE, SHA256 title+company), `tags TEXT[]`, `source`, `is_active`.
RLS activée : seule policy `public_read_active_offers` (SELECT WHERE is_active).
La `SUPABASE_SERVICE_ROLE_KEY` est requise pour les upserts côté scraper (bypass RLS).

### Auth API La Bonne Alternance

Le scraper supporte trois modes d'auth configurables via env :
- `FRANCE_TRAVAIL_API_KEY` → header `FRANCE_TRAVAIL_API_KEY_HEADER` (défaut : `x-api-key`)
- `FRANCE_TRAVAIL_BEARER_TOKEN` → header `Authorization: Bearer`

Le JWT de connexion (portail api.apprentissage.beta.gouv.fr) est passé comme Bearer token.

## Règles non négociables

### Sécurité
- JAMAIS de secrets hardcodés. Toujours via variables d'environnement.
- `SUPABASE_SERVICE_ROLE_KEY` : uniquement côté serveur.
- Valider tous les inputs avec Zod (frontend) ou Pydantic (Python).
- RLS activé sur toutes les tables Supabase.
- Docker non-root (UID 1000), read-only et no-new-privileges en local.

### CI/CD (Shift Left)
- Pipeline bloquant si lint/tests/sécurité échouent.
- Gitleaks sur chaque push/PR.
- SBOM généré à chaque release.

### Python (scraper)
- Python 3.11+, typage strict, Pydantic pour les modèles.
- Gestion d'erreurs explicite, pas de `except: pass`.
- Tests pytest pour chaque nouveau scraper.

### Next.js (frontend)
- TypeScript strict.
- Pas de `any` sans justification.
- `@supabase/ssr` uniquement.

### Git
- Commits conventionnels en anglais.
- `develop` pour les features, `main` pour la production.

## GitHub Secrets requis (Actions)

| Secret | Usage |
|--------|-------|
| `SUPABASE_URL` | Cron scraper |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron scraper |
| `FRANCE_TRAVAIL_API_URL` | Cron scraper |
| `FRANCE_TRAVAIL_API_KEY` | Cron scraper |
| `FRANCE_TRAVAIL_BEARER_TOKEN` | Cron scraper |
