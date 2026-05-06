# AlternanceHub — Frontend Phase 3 : Design Spec

**Date :** 2026-05-06  
**Statut :** Approuvé  
**Approche retenue :** Static-first avec ISR (Next.js App Router)

---

## Contexte

Phase 1 (fondations) et Phase 2 (scraper France Travail → Supabase, CI/CD) sont terminées.  
342 offres en base. Le frontend `web/` est vide.  
Objectif Phase 3 : rendre les offres visibles aux utilisateurs.

---

## Fonctionnalités en scope

### Page principale (`/`)
- **Hero** : titre, sous-titre, barre de recherche (full-text sur titre/entreprise/compétence)
- **Barre de stats** : nombre d'offres, heure du dernier update, source(s)
- **Barre de filtres** :
  - Ville (chips cliquables : Paris, Lyon, Roubaix…)
  - Domaine (cybersécurité actif par défaut)
  - Durée (select : 6/12/24 mois)
  - Niveau diplôme (select : Bac+2 à Bac+5)
  - Télétravail (chip toggle)
  - Bouton "Réinitialiser"
- **Grille d'offres** : cards avec titre, entreprise, localisation, durée, niveau, tags, date, bouton CTA
- **Pagination** : 12 offres par page, navigation numérotée

### Out of scope (Phase 3)
- Authentification / compte utilisateur
- Alertes email
- Nouvelles sources de données
- Page détail offre (le CTA ouvre directement source_url)

---

## Design System

**Style :** Dark mode, Clean & Pro  
**Couleur primaire :** `#3B82F6` (bleu, contraste fort sur fond sombre)  
**Fond :** `#0F172A` (Slate 900)  
**Cards :** `#1E293B` (Slate 800)  
**Typographie :** Inter (Google Fonts)  
**Border-radius :** 12px cards / 6px boutons / 4px badges  
**Grille :** 8pt spacing system

Mockup de référence : `.superpowers/brainstorm/*/content/fullpage-mockup.html`

---

## Architecture technique

```
web/
  app/
    layout.tsx          → RootLayout (Inter font, metadata)
    page.tsx            → Page principale (Server Component, ISR revalidate: 21600s)
    globals.css         → Design tokens CSS variables
  components/
    SearchBar.tsx       → Input + bouton recherche (client component)
    FilterBar.tsx       → Chips + selects (client component)
    OfferCard.tsx       → Card offre (server component)
    OffersGrid.tsx      → Grille + pagination (server component)
    StatsBar.tsx        → Compteur offres + last update (server component)
  lib/
    supabase.ts         → createServerClient (@supabase/ssr)
    offers.ts           → getOffers(filters) → requête Supabase
  types/
    offer.ts            → type Offer (miroir de la table Supabase)
```

### Flux de données (ISR)

```
Build/revalidate (toutes les 6h)
  → page.tsx (Server Component)
  → lib/offers.ts → Supabase SELECT * FROM offers WHERE is_active=true
  → rendu HTML statique servi par Vercel CDN

Filtres/recherche
  → URL params mis à jour client-side
  → Filtrage sur le JSON déjà chargé (pas de re-fetch Supabase)
  → Résultats mis à jour sans rechargement de page
```

### Variables d'environnement requises (web)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Roadmap complète

| Phase | Contenu | Statut |
|-------|---------|--------|
| Phase 1 | Fondations (Supabase, secrets, CI base) | ✅ Done |
| Phase 2 | Scraper France Travail + CI/CD complet | ✅ Done |
| Phase 3 | Frontend Next.js (ce spec) | 🔄 En cours |
| Phase 4 | Nouvelles sources (APEC, Indeed, Hellowork) | ⏳ Backlog |
| Phase 5 | **Refonte UI/UX complète** (design system Figma, tokens, composants accessibles WCAG AA, tests utilisateurs) | ⏳ Backlog |
| Phase 6 | Monitoring, alertes cron, observabilité Supabase | ⏳ Backlog |
| Phase 7 | Compte utilisateur + alertes email | ⏳ Backlog |

> **Note Phase 5 :** La Phase 3 utilise un design fonctionnel validé en brainstorming. La Phase 5 reprendra avec les skills `ui-design-system`, `ux-researcher-designer` et `senior-frontend` pour une refonte complète avec personas, journey map, design tokens Figma, et audit WCAG.

---

## Checklist d'implémentation

- [ ] Initialiser Next.js 15 dans `web/` (TypeScript strict, App Router, Tailwind)
- [ ] Configurer `@supabase/ssr` + variables d'env
- [ ] Créer type `Offer` depuis schéma Supabase
- [ ] Implémenter `lib/offers.ts` (getOffers avec filtres)
- [ ] Implémenter `OfferCard`, `OffersGrid`, `StatsBar`
- [ ] Implémenter `SearchBar` + `FilterBar` (client-side filtering)
- [ ] Page principale avec ISR (revalidate 6h)
- [ ] Configurer `next.config.ts` (ISR, headers sécurité)
- [ ] Déployer sur Vercel (lier repo GitHub, secrets env)
- [ ] Vérifier CI bloquant (lint TS, build check)
