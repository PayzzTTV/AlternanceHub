# CLAUDE.md — AlternanceHub

## Mission
Agrégateur d'offres d'alternance cybersécurité. Stack DevSecOps complète.
Coût infrastructure cible : 0€.

## Règles non négociables

### Sécurité
- JAMAIS de secrets hardcodés. Toujours via variables d'environnement.
- SUPABASE_SERVICE_ROLE_KEY : uniquement côté serveur.
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
