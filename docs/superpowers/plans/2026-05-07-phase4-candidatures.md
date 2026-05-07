# Phase 4 — Tableau de suivi de candidatures — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une page `/suivi` avec un kanban personnel permettant de suivre l'état de chaque candidature, avec drag-and-drop, notes, dates de relance et liens vers les offres.

**Architecture:** Server Component `app/suivi/page.tsx` charge les applications via `lib/applications.ts` (Server Actions), passe les données à `KanbanBoard` (Client Component `@dnd-kit`). Les mutations appellent les Server Actions qui `revalidatePath('/suivi')`. `FollowButton` est un Client Component ajouté à `OfferCard` (Server Component).

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, `@supabase/ssr`, Jest 30 + Testing Library.

---

## File Map

| Action | Fichier | Rôle |
|--------|---------|------|
| Create | `web/types/application.ts` | Type `Application` + `ApplicationStatus` |
| Create | `infra/supabase/migrations/002_applications.sql` | Migration table `applications` |
| Create | `web/lib/applications.ts` | Server Actions CRUD |
| Create | `web/__tests__/lib/applications.test.ts` | Tests Server Actions |
| Create | `web/components/ApplicationCard.tsx` | Carte kanban (client) |
| Create | `web/__tests__/components/ApplicationCard.test.tsx` | Tests carte |
| Create | `web/components/ApplicationModal.tsx` | Modale édition (client) |
| Create | `web/components/KanbanBoard.tsx` | Kanban dnd-kit (client) |
| Create | `web/__tests__/components/KanbanBoard.test.tsx` | Tests kanban |
| Create | `web/app/suivi/page.tsx` | Server Component page suivi |
| Create | `web/components/FollowButton.tsx` | Bouton "Suivre" (client) |
| Modify | `web/components/OfferCard.tsx` | Ajout `<FollowButton>` |
| Modify | `web/__tests__/components/OfferCard.test.tsx` | Mock `@/lib/applications` |
| Modify | `web/app/page.tsx` | Lien "Suivi" dans la navbar |
| Modify | `web/package.json` | Ajout `@dnd-kit/*` |

---

## Task 1 : Installer @dnd-kit

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1 : Installer les dépendances**

```bash
cd web && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Attendu : packages ajoutés dans `dependencies` de `package.json`.

- [ ] **Step 2 : Vérifier les types**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add web/package.json web/package-lock.json
git commit -m "feat(web): install @dnd-kit/core, sortable, utilities"
```

---

## Task 2 : Migration SQL + type Application

**Files:**
- Create: `infra/supabase/migrations/002_applications.sql`
- Create: `web/types/application.ts`

- [ ] **Step 1 : Créer le fichier de migration**

Contenu de `infra/supabase/migrations/002_applications.sql` :

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

- [ ] **Step 2 : Appliquer la migration manuellement**

Ouvrir l'éditeur SQL Supabase et exécuter le fichier `infra/supabase/migrations/002_applications.sql`.
(Étape manuelle — à faire avant de tester en production)

- [ ] **Step 3 : Créer le type Application**

Contenu de `web/types/application.ts` :

```typescript
export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'followed_up'
  | 'interview'
  | 'accepted'
  | 'rejected'

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

- [ ] **Step 4 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 5 : Commit**

```bash
git add infra/supabase/migrations/002_applications.sql web/types/application.ts
git commit -m "feat: add applications table migration and Application type"
```

---

## Task 3 : lib/applications.ts (Server Actions) + tests

**Files:**
- Create: `web/lib/applications.ts`
- Create: `web/__tests__/lib/applications.test.ts`

- [ ] **Step 1 : Écrire les tests (TDD)**

Contenu de `web/__tests__/lib/applications.test.ts` :

```typescript
import {
  getApplications,
  addApplication,
  updateStatus,
  updateDetails,
  removeApplication,
} from '@/lib/applications'
import { createSupabaseServerClient } from '@/lib/supabase'
import type { Application } from '@/types/application'

jest.mock('@/lib/supabase')
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const mockedClient = createSupabaseServerClient as jest.MockedFunction<
  typeof createSupabaseServerClient
>

const fakeApp: Application = {
  id: 'app-1',
  offer_id: 'offer-1',
  title: 'Alternant SOC',
  company: 'Thales',
  source_url: 'https://example.com',
  status: 'interested',
  notes: null,
  follow_up_date: null,
  created_at: '2026-05-06T10:00:00Z',
  updated_at: '2026-05-06T10:00:00Z',
}

// --- getApplications ---

function buildSelectMock(result: { data: unknown; error: unknown }) {
  const order = jest.fn().mockResolvedValue(result)
  const select = jest.fn().mockReturnValue({ order })
  const from = jest.fn().mockReturnValue({ select })
  return { from, select, order }
}

describe('getApplications', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns array on success', async () => {
    const mocks = buildSelectMock({ data: [fakeApp], error: null })
    mockedClient.mockResolvedValue(mocks as never)
    const result = await getApplications()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Alternant SOC')
  })

  it('returns empty array on error', async () => {
    const mocks = buildSelectMock({ data: null, error: { message: 'fail' } })
    mockedClient.mockResolvedValue(mocks as never)
    const result = await getApplications()
    expect(result).toEqual([])
  })

  it('orders by created_at descending', async () => {
    const mocks = buildSelectMock({ data: [], error: null })
    mockedClient.mockResolvedValue(mocks as never)
    await getApplications()
    expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})

// --- addApplication ---

function buildInsertMock(result = { error: null }) {
  const insert = jest.fn().mockResolvedValue(result)
  const from = jest.fn().mockReturnValue({ insert })
  return { from, insert }
}

describe('addApplication', () => {
  beforeEach(() => jest.clearAllMocks())

  it('inserts with status interested', async () => {
    const mocks = buildInsertMock()
    mockedClient.mockResolvedValue(mocks as never)
    await addApplication({
      id: 'offer-1',
      title: 'Alternant SOC',
      company: 'Thales',
      source_url: 'https://example.com',
    })
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'interested', title: 'Alternant SOC' })
    )
  })
})

// --- updateStatus ---

function buildUpdateMock(result = { error: null }) {
  const eq = jest.fn().mockResolvedValue(result)
  const update = jest.fn().mockReturnValue({ eq })
  const from = jest.fn().mockReturnValue({ update })
  return { from, update, eq }
}

describe('updateStatus', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls update with new status', async () => {
    const mocks = buildUpdateMock()
    mockedClient.mockResolvedValue(mocks as never)
    await updateStatus('app-1', 'applied')
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'applied' })
    )
    expect(mocks.eq).toHaveBeenCalledWith('id', 'app-1')
  })
})

// --- updateDetails ---

describe('updateDetails', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls update with provided fields', async () => {
    const mocks = buildUpdateMock()
    mockedClient.mockResolvedValue(mocks as never)
    await updateDetails('app-1', { notes: 'Note test', follow_up_date: '2026-05-10' })
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'Note test', follow_up_date: '2026-05-10' })
    )
    expect(mocks.eq).toHaveBeenCalledWith('id', 'app-1')
  })
})

// --- removeApplication ---

function buildDeleteMock(result = { error: null }) {
  const eq = jest.fn().mockResolvedValue(result)
  const del = jest.fn().mockReturnValue({ eq })
  const from = jest.fn().mockReturnValue({ delete: del })
  return { from, delete: del, eq }
}

describe('removeApplication', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls delete with correct id', async () => {
    const mocks = buildDeleteMock()
    mockedClient.mockResolvedValue(mocks as never)
    await removeApplication('app-1')
    expect(mocks.eq).toHaveBeenCalledWith('id', 'app-1')
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
cd web && npx jest __tests__/lib/applications.test.ts --no-coverage
```

Attendu : FAIL — "Cannot find module '@/lib/applications'"

- [ ] **Step 3 : Implémenter lib/applications.ts**

Contenu de `web/lib/applications.ts` :

```typescript
'use server'

import { createSupabaseServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import type { Application, ApplicationStatus } from '@/types/application'

export async function getApplications(): Promise<Application[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Application[]
}

export async function addApplication(offer: {
  id: string
  title: string
  company: string
  source_url: string | null
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.from('applications').insert({
    offer_id: offer.id,
    title: offer.title,
    company: offer.company,
    source_url: offer.source_url,
    status: 'interested',
  })
  revalidatePath('/suivi')
}

export async function updateStatus(
  id: string,
  status: ApplicationStatus
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/suivi')
}

export async function updateDetails(
  id: string,
  data: { notes?: string; follow_up_date?: string; status?: ApplicationStatus }
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase
    .from('applications')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/suivi')
}

export async function removeApplication(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.from('applications').delete().eq('id', id)
  revalidatePath('/suivi')
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/lib/applications.test.ts --no-coverage
```

Attendu : PASS (5 suites, toutes vertes)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 6 : Commit**

```bash
git add web/lib/applications.ts web/__tests__/lib/applications.test.ts
git commit -m "feat(web): add applications Server Actions with tests"
```

---

## Task 4 : ApplicationCard + tests

**Files:**
- Create: `web/components/ApplicationCard.tsx`
- Create: `web/__tests__/components/ApplicationCard.test.tsx`

- [ ] **Step 1 : Écrire les tests**

Contenu de `web/__tests__/components/ApplicationCard.test.tsx` :

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApplicationCard from '@/components/ApplicationCard'
import type { Application } from '@/types/application'

// ApplicationModal est testé séparément — on le mock ici
jest.mock('@/components/ApplicationModal', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="modal">
      <button onClick={onClose}>Fermer</button>
    </div>
  ),
}))

// Server Actions mockées
jest.mock('@/lib/applications', () => ({
  updateStatus: jest.fn(),
  updateDetails: jest.fn(),
  removeApplication: jest.fn(),
}))

const base: Application = {
  id: 'app-1',
  offer_id: 'offer-1',
  title: 'Alternant SOC',
  company: 'Thales',
  source_url: 'https://example.com/offre',
  status: 'interested',
  notes: null,
  follow_up_date: null,
  created_at: '2026-05-06T10:00:00Z',
  updated_at: '2026-05-06T10:00:00Z',
}

describe('ApplicationCard', () => {
  it('affiche le titre et la company', () => {
    render(<ApplicationCard application={base} />)
    expect(screen.getByText('Alternant SOC')).toBeInTheDocument()
    expect(screen.getByText('Thales')).toBeInTheDocument()
  })

  it("affiche la note quand elle est présente", () => {
    render(<ApplicationCard application={{ ...base, notes: 'Ma note de test' }} />)
    expect(screen.getByText('Ma note de test')).toBeInTheDocument()
  })

  it('affiche le lien vers l\'offre', () => {
    render(<ApplicationCard application={base} />)
    const link = screen.getByRole('link', { name: /voir l/i })
    expect(link).toHaveAttribute('href', 'https://example.com/offre')
  })

  it('la date de relance est orange si dans les 3 jours', () => {
    // 2026-05-06 + 2 jours = dans les 3 jours → orange
    render(<ApplicationCard application={{ ...base, follow_up_date: '2026-05-08' }} />)
    const dateEl = screen.getByText(/2026-05-08/)
    expect(dateEl).toHaveClass('text-amber-400')
  })

  it('la date de relance est grise si plus de 3 jours', () => {
    render(<ApplicationCard application={{ ...base, follow_up_date: '2026-06-01' }} />)
    const dateEl = screen.getByText(/2026-06-01/)
    expect(dateEl).toHaveClass('text-slate-500')
  })

  it('ouvre la modale au clic sur ✏️', async () => {
    render(<ApplicationCard application={base} />)
    await userEvent.click(screen.getByRole('button', { name: /✏️/i }))
    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
cd web && npx jest __tests__/components/ApplicationCard.test.tsx --no-coverage
```

Attendu : FAIL — "Cannot find module '@/components/ApplicationCard'"

- [ ] **Step 3 : Implémenter ApplicationCard.tsx**

Contenu de `web/components/ApplicationCard.tsx` :

```typescript
'use client'

import { useState } from 'react'
import type { Application } from '@/types/application'
import ApplicationModal from '@/components/ApplicationModal'

type Props = {
  application: Application
}

function isUrgent(dateStr: string | null): boolean {
  if (!dateStr) return false
  const diff = new Date(dateStr).getTime() - Date.now()
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000
}

export default function ApplicationCard({ application }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div
        className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 cursor-grab hover:border-blue-500 transition-colors"
        data-application-id={application.id}
      >
        <p className="text-sm font-semibold text-slate-100 leading-snug mb-0.5">
          {application.title}
        </p>
        <p className="text-xs text-slate-400 mb-2">{application.company}</p>

        {application.notes && (
          <p className="text-xs text-slate-500 bg-[#1E293B] rounded p-1.5 mb-2 line-clamp-2">
            {application.notes}
          </p>
        )}

        {application.follow_up_date && (
          <p
            className={`text-xs mb-2 ${
              isUrgent(application.follow_up_date)
                ? 'text-amber-400'
                : 'text-slate-500'
            }`}
          >
            ⏰ {application.follow_up_date}
          </p>
        )}

        <div className="flex items-center justify-between">
          {application.source_url ? (
            <a
              href={application.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline"
            >
              ↗ Voir l&apos;offre
            </a>
          ) : (
            <span />
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs text-blue-400 hover:text-blue-300 px-1"
            aria-label="✏️"
          >
            ✏️
          </button>
        </div>
      </div>

      {modalOpen && (
        <ApplicationModal
          application={application}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 4 : Créer un stub ApplicationModal (pour débloquer les tests)**

Contenu de `web/components/ApplicationModal.tsx` :

```typescript
'use client'

import type { Application } from '@/types/application'

type Props = {
  application: Application
  onClose: () => void
}

export default function ApplicationModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 w-full max-w-md">
        <button onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
```

(Ce composant sera complété dans la Task 5)

- [ ] **Step 5 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/components/ApplicationCard.test.tsx --no-coverage
```

Attendu : PASS (6 tests verts)

- [ ] **Step 6 : Commit**

```bash
git add web/components/ApplicationCard.tsx web/components/ApplicationModal.tsx web/__tests__/components/ApplicationCard.test.tsx
git commit -m "feat(web): add ApplicationCard component with tests"
```

---

## Task 5 : ApplicationModal (implémentation complète)

**Files:**
- Modify: `web/components/ApplicationModal.tsx`

- [ ] **Step 1 : Implémenter ApplicationModal complet**

Remplacer entièrement le contenu de `web/components/ApplicationModal.tsx` :

```typescript
'use client'

import { useState } from 'react'
import { updateDetails, removeApplication } from '@/lib/applications'
import type { Application, ApplicationStatus } from '@/types/application'

type Props = {
  application: Application
  onClose: () => void
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: 'Intéressé',
  applied: 'Postulé',
  followed_up: 'Relancé',
  interview: 'Entretien',
  accepted: 'Accepté',
  rejected: 'Refusé',
}

export default function ApplicationModal({ application, onClose }: Props) {
  const [notes, setNotes] = useState(application.notes ?? '')
  const [followUpDate, setFollowUpDate] = useState(application.follow_up_date ?? '')
  const [status, setStatus] = useState<ApplicationStatus>(application.status)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateDetails(application.id, {
      notes: notes || undefined,
      follow_up_date: followUpDate || undefined,
      status,
    })
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    await removeApplication(application.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{application.title}</h2>
            <p className="text-sm text-slate-400">{application.company}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-100"
            >
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-100 resize-none"
              placeholder="CV envoyé via LinkedIn, RH = ..."
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date de relance</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-100"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-[#334155] rounded-md"
          >
            Annuler
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-[#334155]">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Supprimer la candidature
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Confirmer la suppression ?</span>
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 hover:text-red-300 font-medium"
              >
                Oui, supprimer
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-slate-500 hover:text-slate-300"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier que les tests ApplicationCard passent toujours**

```bash
cd web && npx jest __tests__/components/ApplicationCard.test.tsx --no-coverage
```

Attendu : PASS (6 tests verts — la modale est mockée dans ce test)

- [ ] **Step 3 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 4 : Commit**

```bash
git add web/components/ApplicationModal.tsx
git commit -m "feat(web): implement ApplicationModal with notes, date, status, delete"
```

---

## Task 6 : KanbanBoard + tests

**Files:**
- Create: `web/components/KanbanBoard.tsx`
- Create: `web/__tests__/components/KanbanBoard.test.tsx`

- [ ] **Step 1 : Écrire les tests**

Contenu de `web/__tests__/components/KanbanBoard.test.tsx` :

```typescript
import { render, screen } from '@testing-library/react'
import KanbanBoard from '@/components/KanbanBoard'
import type { Application } from '@/types/application'

// Mock @dnd-kit (pas de DOM DnD dans jsdom)
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: jest.fn(),
  PointerSensor: class {},
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}))
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: jest.fn(),
}))
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: jest.fn(() => '') } },
}))

// Mock ApplicationCard pour isoler KanbanBoard
jest.mock('@/components/ApplicationCard', () => ({
  __esModule: true,
  default: ({ application }: { application: Application }) => (
    <div data-testid={`card-${application.id}`}>{application.title}</div>
  ),
}))

// Mock Server Actions
jest.mock('@/lib/applications', () => ({
  updateStatus: jest.fn(),
}))

const apps: Application[] = [
  {
    id: '1', offer_id: null, title: 'Offre A', company: 'Corp A',
    source_url: null, status: 'interested', notes: null, follow_up_date: null,
    created_at: '2026-05-06T10:00:00Z', updated_at: '2026-05-06T10:00:00Z',
  },
  {
    id: '2', offer_id: null, title: 'Offre B', company: 'Corp B',
    source_url: null, status: 'applied', notes: null, follow_up_date: null,
    created_at: '2026-05-06T10:00:00Z', updated_at: '2026-05-06T10:00:00Z',
  },
  {
    id: '3', offer_id: null, title: 'Offre C', company: 'Corp C',
    source_url: null, status: 'accepted', notes: null, follow_up_date: null,
    created_at: '2026-05-06T10:00:00Z', updated_at: '2026-05-06T10:00:00Z',
  },
  {
    id: '4', offer_id: null, title: 'Offre D', company: 'Corp D',
    source_url: null, status: 'rejected', notes: null, follow_up_date: null,
    created_at: '2026-05-06T10:00:00Z', updated_at: '2026-05-06T10:00:00Z',
  },
]

describe('KanbanBoard', () => {
  it('affiche les 5 colonnes', () => {
    render(<KanbanBoard initialApplications={apps} />)
    expect(screen.getByText('Intéressé')).toBeInTheDocument()
    expect(screen.getByText('Postulé')).toBeInTheDocument()
    expect(screen.getByText('Relancé')).toBeInTheDocument()
    expect(screen.getByText('Entretien')).toBeInTheDocument()
    expect(screen.getByText('Terminé')).toBeInTheDocument()
  })

  it('place les cartes dans la bonne colonne', () => {
    render(<KanbanBoard initialApplications={apps} />)
    // card-1 est dans "interested" → présent
    expect(screen.getByTestId('card-1')).toBeInTheDocument()
    expect(screen.getByTestId('card-2')).toBeInTheDocument()
  })

  it('affiche les sections Accepté et Refusé dans Terminé', () => {
    render(<KanbanBoard initialApplications={apps} />)
    expect(screen.getByText('✅ Accepté')).toBeInTheDocument()
    expect(screen.getByText('❌ Refusé')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
cd web && npx jest __tests__/components/KanbanBoard.test.tsx --no-coverage
```

Attendu : FAIL — "Cannot find module '@/components/KanbanBoard'"

- [ ] **Step 3 : Implémenter KanbanBoard.tsx**

Contenu de `web/components/KanbanBoard.tsx` :

```typescript
'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateStatus } from '@/lib/applications'
import ApplicationCard from '@/components/ApplicationCard'
import type { Application, ApplicationStatus } from '@/types/application'

type Props = { initialApplications: Application[] }

type ColumnDef = {
  id: ApplicationStatus | 'done'
  label: string
  color: string
  statuses?: ApplicationStatus[]
}

const COLUMNS: ColumnDef[] = [
  { id: 'interested', label: 'Intéressé', color: 'border-slate-500' },
  { id: 'applied', label: 'Postulé', color: 'border-blue-500' },
  { id: 'followed_up', label: 'Relancé', color: 'border-amber-500' },
  { id: 'interview', label: 'Entretien', color: 'border-emerald-500' },
  { id: 'done', label: 'Terminé', color: 'border-slate-600', statuses: ['accepted', 'rejected'] },
]

function SortableCard({ application }: { application: Application }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: application.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCard application={application} />
    </div>
  )
}

export default function KanbanBoard({ initialApplications }: Props) {
  const [items, setItems] = useState<Application[]>(initialApplications)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const draggedId = active.id as string
    const targetColId = over.id as string

    // Trouver le statut cible à partir du colonne droppée
    const col = COLUMNS.find((c) => c.id === targetColId)
    if (!col || col.id === 'done') return

    const newStatus = col.id as ApplicationStatus
    const current = items.find((a) => a.id === draggedId)
    if (!current || current.status === newStatus) return

    setItems((prev) =>
      prev.map((a) => (a.id === draggedId ? { ...a, status: newStatus } : a))
    )
    await updateStatus(draggedId, newStatus)
  }

  function getColumnItems(col: ColumnDef): Application[] {
    if (col.id === 'done') return []
    return items.filter((a) => a.status === (col.id as ApplicationStatus))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const colItems = getColumnItems(col)
          const acceptedItems = col.id === 'done' ? items.filter((a) => a.status === 'accepted') : []
          const rejectedItems = col.id === 'done' ? items.filter((a) => a.status === 'rejected') : []
          const totalCount = col.id === 'done' ? acceptedItems.length + rejectedItems.length : colItems.length

          return (
            <div
              key={col.id}
              className={`min-w-[220px] flex-1 bg-[#1E293B] border border-[#334155] rounded-xl flex flex-col border-t-[3px] ${col.color}`}
            >
              <div className="px-3 py-3 border-b border-[#334155] flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  {col.label}
                </span>
                <span className="text-xs bg-[#334155] text-slate-400 rounded-full px-2 py-0.5">
                  {totalCount}
                </span>
              </div>

              <div className="p-2 flex flex-col gap-2 flex-1 min-h-[280px]" id={col.id}>
                {col.id === 'done' ? (
                  <>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">✅ Accepté</p>
                    {acceptedItems.map((app) => (
                      <div key={app.id} className="border-l-2 border-emerald-500 pl-1">
                        <ApplicationCard application={app} />
                      </div>
                    ))}
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-2">❌ Refusé</p>
                    {rejectedItems.map((app) => (
                      <div key={app.id} className="border-l-2 border-red-500 pl-1">
                        <ApplicationCard application={app} />
                      </div>
                    ))}
                  </>
                ) : (
                  <SortableContext
                    items={colItems.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {colItems.map((app) => (
                      <SortableCard key={app.id} application={app} />
                    ))}
                  </SortableContext>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/components/KanbanBoard.test.tsx --no-coverage
```

Attendu : PASS (3 tests verts)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 6 : Commit**

```bash
git add web/components/KanbanBoard.tsx web/__tests__/components/KanbanBoard.test.tsx
git commit -m "feat(web): add KanbanBoard with dnd-kit and tests"
```

---

## Task 7 : app/suivi/page.tsx

**Files:**
- Create: `web/app/suivi/page.tsx`

- [ ] **Step 1 : Créer la page Server Component**

Contenu de `web/app/suivi/page.tsx` :

```typescript
import { getApplications } from '@/lib/applications'
import KanbanBoard from '@/components/KanbanBoard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SuiviPage() {
  const applications = await getApplications()

  const total = applications.length
  const interviews = applications.filter((a) => a.status === 'interview').length
  const urgent = applications.filter((a) => {
    if (!a.follow_up_date) return false
    const diff = new Date(a.follow_up_date).getTime() - Date.now()
    return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000
  }).length

  return (
    <>
      <nav className="bg-[#1E293B] border-b border-[#334155] px-8 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-lg font-bold text-slate-100">
          Alternance<span className="text-blue-500">Hub</span>
        </Link>
        <div className="flex gap-6 text-sm">
          <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
            Offres
          </Link>
          <Link href="/suivi" className="text-blue-500 font-semibold">
            Suivi
          </Link>
        </div>
      </nav>

      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Tableau de suivi</h1>
        <p className="text-sm text-slate-400 mb-5">
          Glisse les cartes entre colonnes pour changer leur statut
        </p>

        <div className="flex gap-3 mb-6">
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5">
            <span className="text-xl font-bold text-slate-100">{total}</span>
            <span className="text-xs text-slate-400 ml-2">Total</span>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5">
            <span className="text-xl font-bold text-emerald-400">{interviews}</span>
            <span className="text-xs text-slate-400 ml-2">Entretiens</span>
          </div>
          {urgent > 0 && (
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5">
              <span className="text-xl font-bold text-amber-400">{urgent}</span>
              <span className="text-xs text-slate-400 ml-2">Relances urgentes</span>
            </div>
          )}
        </div>

        <KanbanBoard initialApplications={applications} />
      </div>
    </>
  )
}
```

- [ ] **Step 2 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 3 : Commit**

```bash
git add web/app/suivi/page.tsx
git commit -m "feat(web): add /suivi page with kanban and stats"
```

---

## Task 8 : FollowButton + modification OfferCard

**Files:**
- Create: `web/components/FollowButton.tsx`
- Modify: `web/components/OfferCard.tsx`
- Modify: `web/__tests__/components/OfferCard.test.tsx`

- [ ] **Step 1 : Créer FollowButton.tsx**

Contenu de `web/components/FollowButton.tsx` :

```typescript
'use client'

import { useState } from 'react'
import { addApplication } from '@/lib/applications'

type Props = {
  offer: {
    id: string
    title: string
    company: string
    source_url: string | null
  }
}

export default function FollowButton({ offer }: Props) {
  const [followed, setFollowed] = useState(false)

  async function handleClick() {
    setFollowed(true)
    await addApplication(offer)
  }

  if (followed) {
    return (
      <span className="bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-md">
        ✓ Suivi
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="bg-[#1E293B] border border-[#334155] hover:border-blue-500 text-slate-300 hover:text-blue-400 text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
    >
      ⭐ Suivre
    </button>
  )
}
```

- [ ] **Step 2 : Modifier OfferCard.tsx**

Remplacer uniquement la section footer dans `web/components/OfferCard.tsx`. Ajouter l'import et le bouton :

```typescript
import type { Offer } from '@/types/offer'
import FollowButton from '@/components/FollowButton'

// ... (tout le reste du fichier identique)

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-slate-500">
          {offer.published_at
            ? `Publié le ${formatDate(offer.published_at)}`
            : `Indexé le ${formatDate(offer.scraped_at)}`}
        </span>
        <div className="flex items-center gap-2">
          <FollowButton
            offer={{
              id: offer.id,
              title: offer.title,
              company: offer.company,
              source_url: offer.source_url,
            }}
          />
          <a
            href={offer.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            Voir l&apos;offre →
          </a>
        </div>
      </div>
```

Le fichier complet `web/components/OfferCard.tsx` après modification :

```typescript
import type { Offer } from '@/types/offer'
import FollowButton from '@/components/FollowButton'

type Props = { offer: Offer }

const TAG_STYLES: Record<string, string> = {
  'cybersécurité': 'bg-[#1E3A5F] text-[#93C5FD]',
  'alternance': 'bg-slate-700 text-slate-300 border border-slate-600',
  'Télétravail': 'bg-[#052e16] text-[#4ADE80]',
  'Apprentissage': 'bg-[#2D2000] text-[#FCD34D]',
  'Professionnalisation': 'bg-[#2D2000] text-[#FCD34D]',
}

function tagStyle(tag: string): string {
  return TAG_STYLES[tag] ?? 'bg-slate-700 text-slate-300'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function OfferCard({ offer }: Props) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow flex flex-col gap-3 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100 leading-snug">
            {offer.title}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">{offer.company}</p>
        </div>
        <span className="bg-[#1E3A5F] text-[#93C5FD] text-xs font-medium px-2 py-1 rounded shrink-0">
          {offer.source === 'france_travail' ? 'LBA' : offer.source}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
        {offer.location && <span>📍 {offer.location}</span>}
        {offer.duration && <span>⏱ {offer.duration} mois</span>}
        <span>💼 {offer.contract_type}</span>
      </div>

      {offer.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {offer.tags.map((tag) => (
            <span
              key={tag}
              className={`text-xs font-medium px-2 py-0.5 rounded ${tagStyle(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-slate-500">
          {offer.published_at
            ? `Publié le ${formatDate(offer.published_at)}`
            : `Indexé le ${formatDate(offer.scraped_at)}`}
        </span>
        <div className="flex items-center gap-2">
          <FollowButton
            offer={{
              id: offer.id,
              title: offer.title,
              company: offer.company,
              source_url: offer.source_url,
            }}
          />
          <a
            href={offer.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            Voir l&apos;offre →
          </a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Mettre à jour OfferCard.test.tsx pour mocker @/lib/applications**

Ajouter en haut du fichier `web/__tests__/components/OfferCard.test.tsx`, après les imports existants :

```typescript
import { render, screen } from '@testing-library/react'
import OfferCard from '@/components/OfferCard'
import type { Offer } from '@/types/offer'

jest.mock('@/lib/applications', () => ({
  addApplication: jest.fn(),
}))

const mockOffer: Offer = {
  id: '1',
  hash: 'abc123',
  title: 'Analyste SOC Junior',
  company: 'DINUM',
  location: 'Paris 75007',
  contract_type: 'alternance',
  duration: '12',
  salary: null,
  tags: ['cybersécurité', 'alternance'],
  source: 'france_travail',
  source_url: 'https://example.com/offre/1',
  published_at: '2024-07-23T00:00:00Z',
  scraped_at: '2024-07-24T00:00:00Z',
  is_active: true,
}

describe('OfferCard', () => {
  it('renders title and company', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByText('Analyste SOC Junior')).toBeInTheDocument()
    expect(screen.getByText('DINUM')).toBeInTheDocument()
  })

  it('renders location and duration', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByText(/Paris 75007/)).toBeInTheDocument()
    expect(screen.getByText(/12 mois/)).toBeInTheDocument()
  })

  it('renders tags as badges', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByText('cybersécurité')).toBeInTheDocument()
  })

  it('CTA link points to source_url', () => {
    render(<OfferCard offer={mockOffer} />)
    const link = screen.getByRole('link', { name: /voir l/i })
    expect(link).toHaveAttribute('href', 'https://example.com/offre/1')
  })

  it('affiche le bouton Suivre', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByRole('button', { name: /⭐ Suivre/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 4 : Lancer tous les tests composants**

```bash
cd web && npx jest __tests__/components/ --no-coverage
```

Attendu : PASS (OfferCard : 5 tests, ApplicationCard : 6 tests, KanbanBoard : 3 tests)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 6 : Commit**

```bash
git add web/components/FollowButton.tsx web/components/OfferCard.tsx web/__tests__/components/OfferCard.test.tsx
git commit -m "feat(web): add FollowButton to OfferCard"
```

---

## Task 9 : Lien "Suivi" dans la navbar de la page principale

**Files:**
- Modify: `web/app/page.tsx`

- [ ] **Step 1 : Ajouter le lien Suivi dans la navbar**

Dans `web/app/page.tsx`, modifier la `<nav>` pour ajouter le lien :

```typescript
import Link from 'next/link'
import { getOffers } from '@/lib/offers'
import StatsBar from '@/components/StatsBar'
import OffersGrid from '@/components/OffersGrid'

export const revalidate = 21600 // 6 heures

export default async function HomePage() {
  const offers = await getOffers()
  const lastScrapedAt = offers[0]?.scraped_at ?? null

  return (
    <>
      {/* Navbar */}
      <nav className="bg-[#1E293B] border-b border-[#334155] px-8 h-14 flex items-center justify-between sticky top-0 z-10">
        <span className="text-lg font-bold text-slate-100">
          Alternance<span className="text-blue-500">Hub</span>
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/suivi"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Suivi
          </Link>
          <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {offers.length} offres
          </span>
        </div>
      </nav>

      {/* Hero */}
      <div
        className="border-b border-[#334155] px-8 py-12 text-center"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)' }}
      >
        <h1 className="text-4xl font-bold text-slate-100 mb-3 leading-tight">
          Trouve ton alternance en{' '}
          <span className="text-blue-500">cybersécurité</span>
        </h1>
        <p className="text-slate-400 text-base">
          Toutes les offres agrégées depuis France Travail &amp; La Bonne Alternance
        </p>
      </div>

      {/* Stats */}
      <StatsBar count={offers.length} scrapedAt={lastScrapedAt} />

      {/* Grid filtrable */}
      <OffersGrid offers={offers} />

      {/* Footer */}
      <footer className="border-t border-[#334155] px-8 py-5 text-center text-sm text-slate-500 mt-8">
        AlternanceHub · Open source · Données issues de{' '}
        <a
          href="https://labonnealternance.apprentissage.beta.gouv.fr"
          className="text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          La Bonne Alternance
        </a>{' '}
        · Mise à jour toutes les 6h
      </footer>
    </>
  )
}
```

- [ ] **Step 2 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : pas d'erreur.

- [ ] **Step 3 : Commit**

```bash
git add web/app/page.tsx
git commit -m "feat(web): add Suivi nav link to homepage"
```

---

## Task 10 : Vérification finale

- [ ] **Step 1 : Lancer tous les tests**

```bash
cd web && npm run test:ci
```

Attendu : tous les tests passent, couverture ≥ 70%.

- [ ] **Step 2 : Lint**

```bash
cd web && npm run lint
```

Attendu : 0 erreur, 0 warning.

- [ ] **Step 3 : Type check**

```bash
cd web && npx tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Step 4 : Build**

```bash
cd web && npm run build
```

Attendu : build réussi, 0 erreur.

- [ ] **Step 5 : Appliquer la migration Supabase (étape manuelle)**

Ouvrir l'éditeur SQL sur dashboard.supabase.com et exécuter :
```
infra/supabase/migrations/002_applications.sql
```

- [ ] **Step 6 : Commit final et push**

```bash
git add -A
git commit -m "feat(web): phase 4 complete — kanban suivi candidatures"
git push origin develop
```

- [ ] **Step 7 : Ouvrir la PR develop → main**

```bash
gh pr create --title "feat: phase 4 — tableau de suivi de candidatures" \
  --body "$(cat <<'EOF'
## Phase 4 — Tableau de suivi de candidatures

- Page `/suivi` avec kanban 5 colonnes (Intéressé → Postulé → Relancé → Entretien → Terminé)
- Drag-and-drop via @dnd-kit/core + @dnd-kit/sortable
- ApplicationCard : notes, date de relance (orange si urgente), lien offre
- ApplicationModal : édition notes/statut/date, suppression
- Bouton "⭐ Suivre" sur chaque OfferCard (optimistic UI)
- Server Actions avec revalidatePath
- Migration Supabase : table `applications` avec RLS public
- Tests Jest pour Server Actions, ApplicationCard, KanbanBoard

## Migration requise
Appliquer `infra/supabase/migrations/002_applications.sql` sur Supabase.
EOF
)"
```
