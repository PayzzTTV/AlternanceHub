# Phase 4 — Tableau de suivi de candidatures

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ajouter une page `/suivi` avec un kanban personnel permettant de suivre l'état de chaque candidature, avec drag-and-drop, notes, dates de relance et liens vers les offres.

---

## Architecture

### Nouvelles routes
- `/suivi` — page kanban (Server Component pour le fetch initial, KanbanBoard en client)

### Nouveaux fichiers
- `web/app/suivi/page.tsx` — Server Component, fetch toutes les applications
- `web/components/KanbanBoard.tsx` — client component, drag-and-drop (`@dnd-kit`)
- `web/components/ApplicationCard.tsx` — carte dans le kanban
- `web/components/ApplicationModal.tsx` — modale édition (note + date relance)
- `web/lib/applications.ts` — Server Actions CRUD (add, updateStatus, updateDetails, remove)
- `web/types/application.ts` — type `Application`

### Fichiers modifiés
- `web/components/OfferCard.tsx` — ajout bouton "Suivre" (Server Action)
- `web/app/layout.tsx` — ajout lien "Suivi" dans la navbar

---

## Base de données

### Table Supabase `applications`

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'interested'
    CHECK (status IN ('interested','applied','followed_up','interview','accepted','rejected')),
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Colonnes dénormalisées** (`title`, `company`, `source_url`) : copiées depuis `offers` à l'insertion pour survivre à la suppression de l'offre.

**RLS** : lecture et écriture publiques (usage personnel, pas d'auth).

---

## Composants

### `KanbanBoard`
- Client component (`'use client'`)
- 5 colonnes : `interested` → `applied` → `followed_up` → `interview` → `accepted/rejected`
- Drag-and-drop via `@dnd-kit/core` + `@dnd-kit/sortable`
- Boutons `→` / `←` comme fallback accessible
- Appelle Server Action `updateStatus` au drop

### `ApplicationCard`
- Affiche : titre, entreprise, note (tronquée à 2 lignes), date de relance (orange si dans les 3 jours), lien `source_url`
- Clic sur ✏️ → ouvre `ApplicationModal`
- Drag handle visible au hover

### `ApplicationModal`
- Champs : notes (textarea), follow_up_date (input date), statut (select)
- Bouton "Supprimer la candidature" (rouge, confirmation inline)
- Appelle `updateDetails` au submit

### `OfferCard` (modifié)
- Bouton "⭐ Suivre" → Server Action `addApplication`
- Après ajout : bouton devient "✓ Suivi" (state optimiste)

---

## Server Actions (`lib/applications.ts`)

```typescript
addApplication(offer: Offer): Promise<void>
updateStatus(id: string, status: ApplicationStatus): Promise<void>
updateDetails(id: string, data: { notes?: string; follow_up_date?: string; status?: ApplicationStatus }): Promise<void>
removeApplication(id: string): Promise<void>
getApplications(): Promise<Application[]>
```

Toutes les actions appellent `revalidatePath('/suivi')` après mutation.

---

## Type `Application`

```typescript
export type ApplicationStatus =
  | 'interested' | 'applied' | 'followed_up'
  | 'interview' | 'accepted' | 'rejected'

export type Application = {
  id: string
  offer_id: string | null
  title: string
  company: string
  source_url: string | null
  status: ApplicationStatus
  notes: string | null
  follow_up_date: string | null
  created_at: string
  updated_at: string
}
```

---

## UI / Design

- Même dark mode que Phase 3 (`#0F172A`, `#1E293B`, `#334155`)
- Colonnes avec bordure supérieure colorée : gris / bleu / orange / vert / gris foncé
- Cartes avec hover `border-color: #3B82F6`
- Date de relance orange si ≤ 3 jours, grise sinon
- Colonne "Terminé" splitée : section Accepté (bordure verte) + section Refus (bordure rouge)
- Navbar : lien "Suivi" actif sur `/suivi`

---

## Tests

- `__tests__/lib/applications.test.ts` — mock Supabase, teste addApplication, updateStatus, updateDetails, removeApplication
- `__tests__/components/ApplicationCard.test.tsx` — rendu titre/entreprise, note tronquée, date de relance colorée
- `__tests__/components/KanbanBoard.test.tsx` — rendu colonnes, cartes dans la bonne colonne

---

## Migration Supabase

Fichier : `infra/supabase/migrations/002_applications.sql`

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'interested'
    CHECK (status IN ('interested','applied','followed_up','interview','accepted','rejected')),
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_applications"
  ON applications FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Roadmap mise à jour

| Phase | Contenu | Statut |
|-------|---------|--------|
| 1 | Bootstrap + scraper France Travail | ✅ |
| 2 | CI/CD DevSecOps | ✅ |
| 3 | Frontend Next.js 15 — job board | ✅ |
| **4** | **Tableau de suivi de candidatures** | 🚧 En cours |
| 5 | Nouvelles sources (APEC, Indeed) | ⏳ |
| 6 | Refonte UI/UX complète | ⏳ |
