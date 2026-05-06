# AlternanceHub

SaaS open source et auto-hebergeable pour agreger des offres d'alternance en cybersecurite.

## Phase 1 - Fondations

Cette phase pose le socle:
- structure de repository
- baseline Git (`main` / `develop`)
- migration Supabase initiale avec RLS
- hygiene secrets (`.env.example`, `.gitignore`)
- automatisation securite minimale (Gitleaks + Dependabot)

## Prerequis locaux

- Git
- Python 3.11+
- Node.js 20+
- Un projet Supabase (free tier)

## Initialisation locale

```bash
git init
git checkout -b main
git checkout -b develop
```

## Variables d'environnement

Copier le template:

```bash
cp .env.example .env.local
```

Ne jamais commiter de valeurs reelles de secrets.

## Supabase - Appliquer la migration initiale

Executer le SQL de `infra/supabase/migrations/001_initial.sql` dans l'editeur SQL Supabase.

Resultat attendu:
- table `offers` creee
- index techniques presents
- RLS active
- policy de lecture publique `public_read_active_offers`

## Checklist "Phase 1 done"

- [x] Structure de base du monorepo creee
- [x] Branches `main` et `develop` creees
- [x] Migration SQL initiale versionnee
- [x] Template `.env.example` complet et sans secret
- [x] `.gitignore` durci (env, cache, artefacts build)
- [x] Workflow Gitleaks configure
- [x] Dependabot configure (GitHub Actions, pip, npm)
