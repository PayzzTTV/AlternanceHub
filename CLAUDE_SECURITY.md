# CLAUDE_SECURITY.md — Règles de sécurité AlternanceHub

## Secrets management
- `.env.local` dans `.gitignore`.
- Secrets uniquement via GitHub Secrets / variables d'environnement.
- Jamais de secrets dans les logs CI.

## Variables sensibles
- `SUPABASE_SERVICE_ROLE_KEY` : jamais côté client.
- `FRANCE_TRAVAIL_CLIENT_SECRET` : jamais côté client.
- Toute clé API : jamais dans le dépôt.

## Dockerfile security checklist
- Image de base slim.
- Utilisateur non-root.
- Pas de secrets dans `ARG`/`ENV`.
- `.dockerignore` strict.

## RLS Supabase
- RLS activé sur toutes les tables.
- Insertion par service role côté serveur.
- Lecture publique limitée aux offres actives.

## Scan automatique
- Bandit (SAST Python)
- Trivy (CVE images Docker)
- Gitleaks (secrets)
- Dependabot (dépendances)
