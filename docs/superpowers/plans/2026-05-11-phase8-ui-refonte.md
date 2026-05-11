# Phase 8 — Refonte UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le design glassmorphism par un flat dark (style Linear/Vercel) et restructurer la page d'accueil en layout sidebar filtres fixes + liste d'offres.

**Architecture:** `page.tsx` (Server Component) délègue le layout à `OffersLayout.tsx` (Client Component) qui possède le state des filtres et rend `FilterSidebar` (desktop) + `OffersGrid` (grille). La logique de filtrage est extraite dans `lib/filters.ts` (pure functions). `OffersGrid` reçoit les offres déjà filtrées et gère uniquement la pagination + matchScores.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, Jest 30 + Testing Library.

---

## File Map

| Action | Fichier | Rôle |
|--------|---------|------|
| Create | `web/lib/filters.ts` | Type `Filters`, `defaultFilters`, `applyFilters()` |
| Create | `web/__tests__/lib/filters.test.ts` | Tests unitaires filtrage |
| Modify | `web/app/globals.css` | Tokens flat dark, suppression `.glass`/`.glass-strong` |
| Create | `web/components/FilterSidebar.tsx` | Sidebar desktop + export `FilterChips` |
| Create | `web/__tests__/components/FilterSidebar.test.tsx` | Tests sidebar et chips |
| Create | `web/components/OffersLayout.tsx` | Client Component, state filtres, layout 2 colonnes |
| Create | `web/__tests__/components/OffersLayout.test.tsx` | Tests layout |
| Modify | `web/components/OffersGrid.tsx` | Reçoit offres filtrées, gère pagination + matchScores uniquement |
| Modify | `web/__tests__/components/OffersGrid.test.tsx` | Tests mis à jour (plus de tests de filtrage) |
| Modify | `web/app/page.tsx` | Utilise `OffersLayout`, retire `StatsBar` |
| Modify | `web/components/OfferCard.tsx` | Tokens flat dark uniquement |
| Modify | `web/app/suivi/page.tsx` | Navbar flat dark cohérente |

---

## Task 1 : `lib/filters.ts` — type Filters + applyFilters

**Files:**
- Create: `web/lib/filters.ts`
- Create: `web/__tests__/lib/filters.test.ts`

- [ ] **Step 1 : Écrire les tests**

Contenu de `web/__tests__/lib/filters.test.ts` :

```typescript
import { applyFilters, defaultFilters } from '@/lib/filters'
import type { Offer } from '@/types/offer'

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: Math.random().toString(),
    hash: '',
    title: 'Analyste SOC',
    company: 'DINUM',
    location: 'Paris',
    contract_type: 'alternance',
    duration: '12',
    salary: null,
    tags: ['cybersécurité'],
    source: 'france_travail',
    source_url: 'https://example.com',
    published_at: null,
    scraped_at: new Date().toISOString(),
    is_active: true,
    ...overrides,
  }
}

describe('applyFilters', () => {
  it('retourne toutes les offres avec les filtres par défaut', () => {
    const offers = [makeOffer(), makeOffer()]
    expect(applyFilters(offers, defaultFilters)).toHaveLength(2)
  })

  it('filtre par query sur le titre (insensible à la casse)', () => {
    const offers = [makeOffer({ title: 'Analyste SOC' }), makeOffer({ title: 'Développeur Python' })]
    expect(applyFilters(offers, { ...defaultFilters, query: 'soc' })).toHaveLength(1)
    expect(applyFilters(offers, { ...defaultFilters, query: 'soc' })[0].title).toBe('Analyste SOC')
  })

  it('filtre par query sur le nom de l\'entreprise', () => {
    const offers = [makeOffer({ company: 'Thales' }), makeOffer({ company: 'DINUM' })]
    expect(applyFilters(offers, { ...defaultFilters, query: 'thales' })).toHaveLength(1)
  })

  it('filtre par query sur la localisation', () => {
    const offers = [makeOffer({ location: 'Lyon' }), makeOffer({ location: 'Paris' })]
    expect(applyFilters(offers, { ...defaultFilters, query: 'lyon' })).toHaveLength(1)
  })

  it('filtre télétravail uniquement', () => {
    const offers = [
      makeOffer({ tags: ['Télétravail', 'cybersécurité'] }),
      makeOffer({ tags: ['cybersécurité'] }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, teletravailOnly: true })).toHaveLength(1)
  })

  it('filtre par durée', () => {
    const offers = [makeOffer({ duration: '12' }), makeOffer({ duration: '24' })]
    expect(applyFilters(offers, { ...defaultFilters, duration: '12' })).toHaveLength(1)
  })

  it('filtre par localisation exacte', () => {
    const offers = [makeOffer({ location: 'Paris' }), makeOffer({ location: 'Lyon' })]
    expect(applyFilters(offers, { ...defaultFilters, location: 'Paris' })).toHaveLength(1)
  })

  it('filtre par tags — tous les tags sélectionnés doivent être présents', () => {
    const offers = [
      makeOffer({ tags: ['SOC', 'SIEM', 'cybersécurité'] }),
      makeOffer({ tags: ['SOC', 'cybersécurité'] }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, selectedTags: ['SOC', 'SIEM'] })).toHaveLength(1)
  })

  it('combine plusieurs filtres', () => {
    const offers = [
      makeOffer({ title: 'SOC', location: 'Paris', duration: '12', tags: ['Télétravail'] }),
      makeOffer({ title: 'SOC', location: 'Lyon', duration: '12', tags: [] }),
    ]
    const result = applyFilters(offers, { ...defaultFilters, location: 'Paris', teletravailOnly: true })
    expect(result).toHaveLength(1)
    expect(result[0].location).toBe('Paris')
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
cd web && npx jest __tests__/lib/filters.test.ts --no-coverage
```

Attendu : FAIL — "Cannot find module '@/lib/filters'"

- [ ] **Step 3 : Implémenter `web/lib/filters.ts`**

```typescript
import type { Offer } from '@/types/offer'

export type Filters = {
  query: string
  teletravailOnly: boolean
  duration: string
  location: string
  selectedTags: string[]
  publishedAfter: '' | '7' | '30' | '90'
}

export const defaultFilters: Filters = {
  query: '',
  teletravailOnly: false,
  duration: '',
  location: '',
  selectedTags: [],
  publishedAfter: '',
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export function applyFilters(offers: Offer[], filters: Filters): Offer[] {
  const q = filters.query.toLowerCase()
  const cutoff = filters.publishedAfter ? daysAgo(Number(filters.publishedAfter)) : null

  return offers.filter((o) => {
    const matchesQuery =
      !q ||
      o.title.toLowerCase().includes(q) ||
      o.company.toLowerCase().includes(q) ||
      (o.location ?? '').toLowerCase().includes(q)
    const matchesTeletravail = !filters.teletravailOnly || o.tags.includes('Télétravail')
    const matchesDuration = !filters.duration || o.duration === filters.duration
    const matchesLocation = !filters.location || o.location === filters.location
    const matchesTags =
      filters.selectedTags.length === 0 ||
      filters.selectedTags.every((t) => o.tags.includes(t))
    const matchesDate =
      !cutoff || (o.published_at != null && new Date(o.published_at) >= cutoff)
    return matchesQuery && matchesTeletravail && matchesDuration && matchesLocation && matchesTags && matchesDate
  })
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/lib/filters.test.ts --no-coverage
```

Attendu : PASS (9 tests verts)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add web/lib/filters.ts web/__tests__/lib/filters.test.ts
git commit -m "feat(web): add Filters type and applyFilters pure function with tests"
```

---

## Task 2 : Tokens CSS flat dark (`globals.css`)

**Files:**
- Modify: `web/app/globals.css`

- [ ] **Step 1 : Remplacer entièrement `web/app/globals.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..800;1,14..32,300..800&display=swap');
@import "tailwindcss";

* { box-sizing: border-box; }

body {
  background-color: #0a0a0f;
  color: #e2e8f0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #2a2a3d; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #3d3d5c; }
```

- [ ] **Step 2 : Vérifier que le build passe**

```bash
cd web && npm run build
```

Attendu : build réussi (des composants auront l'air "cassé" visuellement mais aucune erreur de compilation — les classes `.glass` utilisées seront simplement ignorées par Tailwind).

- [ ] **Step 3 : Commit**

```bash
git add web/app/globals.css
git commit -m "feat(web): replace glassmorphism tokens with flat dark CSS"
```

---

## Task 3 : `FilterSidebar.tsx` + `FilterChips` + tests

**Files:**
- Create: `web/components/FilterSidebar.tsx`
- Create: `web/__tests__/components/FilterSidebar.test.tsx`

- [ ] **Step 1 : Écrire les tests**

Contenu de `web/__tests__/components/FilterSidebar.test.tsx` :

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import FilterSidebar, { FilterChips } from '@/components/FilterSidebar'
import { defaultFilters } from '@/lib/filters'
import type { Offer } from '@/types/offer'

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: Math.random().toString(), hash: '', title: 'Test', company: 'Corp',
    location: 'Paris', contract_type: 'alternance', duration: '12', salary: null,
    tags: ['cybersécurité'], source: 'france_travail', source_url: 'https://example.com',
    published_at: null, scraped_at: new Date().toISOString(), is_active: true, ...overrides,
  }
}

const baseOffers = [makeOffer({ location: 'Paris' }), makeOffer({ location: 'Lyon' })]

describe('FilterSidebar', () => {
  beforeEach(() => jest.clearAllMocks())

  it('affiche le champ de recherche', () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} />)
    expect(screen.getByPlaceholderText(/titre, entreprise/i)).toBeInTheDocument()
  })

  it('affiche les sections Localisation, Durée, Télétravail', () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} />)
    expect(screen.getByText(/localisation/i)).toBeInTheDocument()
    expect(screen.getByText(/durée/i)).toBeInTheDocument()
    expect(screen.getByText(/télétravail/i)).toBeInTheDocument()
  })

  it('appelle onChange quand la query change', () => {
    const onChange = jest.fn()
    render(<FilterSidebar filters={defaultFilters} onChange={onChange} offers={baseOffers} />)
    fireEvent.change(screen.getByPlaceholderText(/titre, entreprise/i), { target: { value: 'SOC' } })
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, query: 'SOC' })
  })

  it('appelle onChange quand le toggle télétravail est cliqué', () => {
    const onChange = jest.fn()
    render(<FilterSidebar filters={defaultFilters} onChange={onChange} offers={baseOffers} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, teletravailOnly: true })
  })

  it("n'affiche pas Réinitialiser si aucun filtre actif", () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} />)
    expect(screen.queryByText('Réinitialiser')).not.toBeInTheDocument()
  })

  it('affiche Réinitialiser si un filtre est actif', () => {
    render(
      <FilterSidebar
        filters={{ ...defaultFilters, query: 'test' }}
        onChange={jest.fn()}
        offers={baseOffers}
      />
    )
    expect(screen.getByText('Réinitialiser')).toBeInTheDocument()
  })

  it('appelle onChange avec defaultFilters quand Réinitialiser est cliqué', () => {
    const onChange = jest.fn()
    render(
      <FilterSidebar
        filters={{ ...defaultFilters, query: 'test', teletravailOnly: true }}
        onChange={onChange}
        offers={baseOffers}
      />
    )
    fireEvent.click(screen.getByText('Réinitialiser'))
    expect(onChange).toHaveBeenCalledWith(defaultFilters)
  })

  it('appelle onChange avec le bon tag quand un tag est cliqué', () => {
    const onChange = jest.fn()
    render(
      <FilterSidebar
        filters={defaultFilters}
        onChange={onChange}
        offers={[makeOffer({ tags: ['SOC'] })]}
      />
    )
    fireEvent.click(screen.getByText('SOC'))
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, selectedTags: ['SOC'] })
  })
})

describe('FilterChips', () => {
  it('ne rend rien quand aucun filtre actif', () => {
    const { container } = render(<FilterChips filters={defaultFilters} onChange={jest.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche un chip pour le filtre télétravail actif', () => {
    render(<FilterChips filters={{ ...defaultFilters, teletravailOnly: true }} onChange={jest.fn()} />)
    expect(screen.getByText(/télétravail/i)).toBeInTheDocument()
  })

  it('affiche un chip pour la durée active', () => {
    render(<FilterChips filters={{ ...defaultFilters, duration: '12' }} onChange={jest.fn()} />)
    expect(screen.getByText(/12 mois/i)).toBeInTheDocument()
  })

  it('appelle onChange pour désactiver le filtre au clic sur le chip', () => {
    const onChange = jest.fn()
    render(<FilterChips filters={{ ...defaultFilters, teletravailOnly: true }} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ teletravailOnly: false }))
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
cd web && npx jest __tests__/components/FilterSidebar.test.tsx --no-coverage
```

Attendu : FAIL — "Cannot find module '@/components/FilterSidebar'"

- [ ] **Step 3 : Implémenter `web/components/FilterSidebar.tsx`**

```typescript
'use client'

import type { Filters } from '@/lib/filters'
import { defaultFilters } from '@/lib/filters'
import type { Offer } from '@/types/offer'

type Props = {
  filters: Filters
  onChange: (f: Filters) => void
  offers: Offer[]
  className?: string
}

const DURATIONS = ['6', '12', '24']

const PUBLISHED_OPTIONS: { label: string; value: Filters['publishedAfter'] }[] = [
  { label: 'Tout', value: '' },
  { label: '7 jours', value: '7' },
  { label: '30 jours', value: '30' },
  { label: '3 mois', value: '90' },
]

export default function FilterSidebar({ filters, onChange, offers, className = '' }: Props) {
  const allLocations = [...new Set(offers.map((o) => o.location).filter(Boolean) as string[])].sort()
  const allTags = [...new Set(offers.flatMap((o) => o.tags))].sort().slice(0, 8)
  const hasActive =
    filters.query ||
    filters.teletravailOnly ||
    filters.duration ||
    filters.location ||
    filters.selectedTags.length > 0 ||
    filters.publishedAfter

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }

  function toggleTag(tag: string) {
    const next = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag]
    set('selectedTags', next)
  }

  return (
    <aside className={`flex-col overflow-y-auto bg-[#0a0a0f] ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between sticky top-0 bg-[#0a0a0f] z-10">
        <span className="text-xs font-semibold text-[#475569] uppercase tracking-widest">Filtres</span>
        {hasActive && (
          <button
            onClick={() => onChange(defaultFilters)}
            className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 p-4">
        {/* Recherche */}
        <input
          type="text"
          value={filters.query}
          onChange={(e) => set('query', e.target.value)}
          placeholder="Titre, entreprise, ville…"
          className="w-full bg-[#16161f] border border-[#2a2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#475569] outline-none focus:border-[#4f46e5] transition-colors"
        />

        {/* Localisation */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-widest">Localisation</label>
          <select
            value={filters.location}
            onChange={(e) => set('location', e.target.value)}
            className="bg-[#16161f] border border-[#2a2a3d] rounded-lg px-3 py-2 text-sm text-[#94a3b8] outline-none focus:border-[#4f46e5] transition-colors"
          >
            <option value="">Toutes les villes</option>
            {allLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Durée */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-widest">Durée</label>
          <div className="flex gap-1.5 flex-wrap">
            {(['', ...DURATIONS] as string[]).map((d) => (
              <button
                key={d || 'all'}
                onClick={() => set('duration', d)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  filters.duration === d
                    ? 'bg-[#1e1e2e] border-[#312e81] text-[#818cf8] font-medium'
                    : 'bg-[#16161f] border-[#2a2a3d] text-[#475569] hover:border-[#4f46e5]'
                }`}
              >
                {d ? `${d} mois` : 'Toutes'}
              </button>
            ))}
          </div>
        </div>

        {/* Télétravail */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.teletravailOnly}
            onChange={(e) => set('teletravailOnly', e.target.checked)}
            className="accent-[#6366f1] w-4 h-4 cursor-pointer"
          />
          <span className="text-sm text-[#94a3b8]">🏠 Télétravail uniquement</span>
        </label>

        {/* Date de publication */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-widest">Publiée dans</label>
          <div className="flex gap-1.5 flex-wrap">
            {PUBLISHED_OPTIONS.map(({ label, value }) => (
              <button
                key={value || 'all'}
                onClick={() => set('publishedAfter', value)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  filters.publishedAfter === value
                    ? 'bg-[#1e1e2e] border-[#312e81] text-[#818cf8] font-medium'
                    : 'bg-[#16161f] border-[#2a2a3d] text-[#475569] hover:border-[#4f46e5]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-widest">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                    filters.selectedTags.includes(tag)
                      ? 'bg-[#1e1e2e] border-[#312e81] text-[#818cf8] font-medium'
                      : 'bg-[#16161f] border-[#2a2a3d] text-[#475569] hover:border-[#4f46e5]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

// Chips des filtres actifs — pour mobile
type ChipsProps = {
  filters: Filters
  onChange: (f: Filters) => void
  className?: string
}

export function FilterChips({ filters, onChange, className = '' }: ChipsProps) {
  const chips: { label: string; clear: Filters }[] = []

  if (filters.teletravailOnly)
    chips.push({ label: '🏠 Télétravail', clear: { ...filters, teletravailOnly: false } })
  if (filters.duration)
    chips.push({ label: `${filters.duration} mois`, clear: { ...filters, duration: '' } })
  if (filters.location)
    chips.push({ label: `📍 ${filters.location}`, clear: { ...filters, location: '' } })
  if (filters.publishedAfter)
    chips.push({ label: `Derniers ${filters.publishedAfter}j`, clear: { ...filters, publishedAfter: '' } })
  filters.selectedTags.forEach((tag) =>
    chips.push({
      label: tag,
      clear: { ...filters, selectedTags: filters.selectedTags.filter((t) => t !== tag) },
    })
  )

  if (chips.length === 0) return null

  return (
    <div className={`flex gap-2 overflow-x-auto py-2 ${className}`}>
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onChange(chip.clear)}
          className="flex-shrink-0 flex items-center gap-1 bg-[#1e1e2e] border border-[#312e81] text-[#818cf8] text-xs px-2.5 py-1 rounded-full whitespace-nowrap hover:border-[#6366f1] transition-colors"
        >
          {chip.label}
          <span className="text-[#6366f1] font-medium">×</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/components/FilterSidebar.test.tsx --no-coverage
```

Attendu : PASS (11 tests verts)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add web/components/FilterSidebar.tsx web/__tests__/components/FilterSidebar.test.tsx
git commit -m "feat(web): add FilterSidebar and FilterChips components with tests"
```

---

## Task 4 : `OffersLayout.tsx` + tests

**Files:**
- Create: `web/components/OffersLayout.tsx`
- Create: `web/__tests__/components/OffersLayout.test.tsx`

- [ ] **Step 1 : Écrire les tests**

Contenu de `web/__tests__/components/OffersLayout.test.tsx` :

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import OffersLayout from '@/components/OffersLayout'
import type { Offer } from '@/types/offer'

// Mocks — on isole OffersLayout de ses enfants
jest.mock('@/components/FilterSidebar', () => ({
  __esModule: true,
  default: ({
    filters,
    onChange,
  }: {
    filters: { query: string }
    onChange: (f: { query: string }) => void
  }) => (
    <div data-testid="filter-sidebar">
      <input
        data-testid="sidebar-query"
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
      />
    </div>
  ),
  FilterChips: () => null,
}))

jest.mock('@/components/OffersGrid', () => ({
  __esModule: true,
  default: ({ offers }: { offers: Offer[] }) => (
    <div data-testid="offers-grid">{offers.length} offres</div>
  ),
}))

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: Math.random().toString(), hash: '', title: 'Analyste SOC', company: 'DINUM',
    location: 'Paris', contract_type: 'alternance', duration: '12', salary: null,
    tags: ['cybersécurité'], source: 'france_travail', source_url: 'https://example.com',
    published_at: null, scraped_at: new Date().toISOString(), is_active: true, ...overrides,
  }
}

describe('OffersLayout', () => {
  it('rend la sidebar et la grille', () => {
    render(<OffersLayout offers={[makeOffer()]} />)
    expect(screen.getByTestId('filter-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('offers-grid')).toBeInTheDocument()
  })

  it('passe toutes les offres à la grille avec filtres par défaut', () => {
    render(<OffersLayout offers={[makeOffer(), makeOffer()]} />)
    expect(screen.getByText('2 offres')).toBeInTheDocument()
  })

  it('filtre les offres quand la query change dans la sidebar', () => {
    const offers = [
      makeOffer({ title: 'Analyste SOC' }),
      makeOffer({ title: 'Développeur Python' }),
    ]
    render(<OffersLayout offers={offers} />)
    fireEvent.change(screen.getByTestId('sidebar-query'), { target: { value: 'SOC' } })
    expect(screen.getByText('1 offres')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
cd web && npx jest __tests__/components/OffersLayout.test.tsx --no-coverage
```

Attendu : FAIL — "Cannot find module '@/components/OffersLayout'"

- [ ] **Step 3 : Implémenter `web/components/OffersLayout.tsx`**

```typescript
'use client'

import { useState, useMemo } from 'react'
import type { Offer } from '@/types/offer'
import FilterSidebar, { FilterChips } from '@/components/FilterSidebar'
import OffersGrid from '@/components/OffersGrid'
import { defaultFilters, applyFilters, type Filters } from '@/lib/filters'

type Props = { offers: Offer[] }

export default function OffersLayout({ offers }: Props) {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const filteredOffers = useMemo(() => applyFilters(offers, filters), [offers, filters])

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar — desktop uniquement */}
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        offers={offers}
        className="hidden md:flex md:w-60 md:border-r md:border-[#1e1e2e]"
      />

      {/* Zone principale */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile : search + chips + toggle filtres */}
        <div className="md:hidden border-b border-[#1e1e2e]">
          <div className="flex gap-2 px-4 pt-3 pb-2">
            <input
              type="text"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="Rechercher titre, entreprise, ville…"
              className="flex-1 bg-[#16161f] border border-[#2a2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#475569] outline-none focus:border-[#4f46e5] transition-colors"
            />
            <button
              onClick={() => setShowMobileFilters((v) => !v)}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                showMobileFilters
                  ? 'bg-[#1e1e2e] border-[#312e81] text-[#818cf8]'
                  : 'bg-[#16161f] border-[#2a2a3d] text-[#475569] hover:border-[#4f46e5]'
              }`}
            >
              ⚙ {showMobileFilters ? '▲' : '▼'}
            </button>
          </div>

          <FilterChips filters={filters} onChange={setFilters} className="px-4 pb-2" />

          {showMobileFilters && (
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              offers={offers}
              className="flex w-full border-t border-[#1e1e2e] max-h-[60vh] overflow-y-auto"
            />
          )}
        </div>

        <OffersGrid offers={filteredOffers} />
      </main>
    </div>
  )
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/components/OffersLayout.test.tsx --no-coverage
```

Attendu : PASS (3 tests verts)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add web/components/OffersLayout.tsx web/__tests__/components/OffersLayout.test.tsx
git commit -m "feat(web): add OffersLayout client component with filter state and sidebar"
```

---

## Task 5 : Refactor `OffersGrid.tsx` + mise à jour des tests

**Files:**
- Modify: `web/components/OffersGrid.tsx`
- Modify: `web/__tests__/components/OffersGrid.test.tsx`

- [ ] **Step 1 : Réécrire les tests**

Remplacer entièrement le contenu de `web/__tests__/components/OffersGrid.test.tsx` :

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import OffersGrid from '@/components/OffersGrid'
import type { Offer } from '@/types/offer'

// Les filtres vivent maintenant dans OffersLayout — OffersGrid reçoit des offres déjà filtrées
jest.mock('@/components/CVUploader', () => ({
  getMatchScores: jest.fn(() => ({})),
  getMatchInsights: jest.fn(() => ({})),
}))

jest.mock('@/components/OfferCard', () => ({
  __esModule: true,
  default: ({ offer }: { offer: Offer }) => (
    <div data-testid={`card-${offer.id}`}>{offer.title}</div>
  ),
}))

jest.mock('@/lib/applications', () => ({
  addApplication: jest.fn(),
}))

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: Math.random().toString(), hash: '', title: 'Analyste SOC', company: 'DINUM',
    location: 'Paris', contract_type: 'alternance', duration: '12', salary: null,
    tags: [], source: 'france_travail', source_url: 'https://example.com',
    published_at: null, scraped_at: new Date().toISOString(), is_active: true, ...overrides,
  }
}

describe('OffersGrid', () => {
  it('rend toutes les offres passées en props', () => {
    const offers = [
      makeOffer({ id: '1', title: 'Offre A' }),
      makeOffer({ id: '2', title: 'Offre B' }),
    ]
    render(<OffersGrid offers={offers} />)
    expect(screen.getByText('Offre A')).toBeInTheDocument()
    expect(screen.getByText('Offre B')).toBeInTheDocument()
  })

  it("affiche l'état vide quand aucune offre", () => {
    render(<OffersGrid offers={[]} />)
    expect(screen.getByText(/aucune offre/i)).toBeInTheDocument()
  })

  it('affiche le nombre d\'offres', () => {
    render(<OffersGrid offers={[makeOffer(), makeOffer()]} />)
    expect(screen.getByText(/2 offres/)).toBeInTheDocument()
  })

  it('affiche le bouton CSV', () => {
    render(<OffersGrid offers={[makeOffer()]} />)
    expect(screen.getByText(/csv/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent (OffersGrid a encore les anciens filtres)**

```bash
cd web && npx jest __tests__/components/OffersGrid.test.tsx --no-coverage
```

Attendu : des tests peuvent passer ou échouer selon l'état actuel — on va réécrire le composant de toute façon.

- [ ] **Step 3 : Réécrire `web/components/OffersGrid.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { Offer } from '@/types/offer'
import OfferCard from '@/components/OfferCard'
import { getMatchScores } from '@/components/CVUploader'

const PAGE_SIZE = 12

function exportCsv(offers: Offer[]) {
  const headers = ['Titre', 'Entreprise', 'Localisation', 'Durée', 'Contrat', 'Tags', 'Source', 'URL', 'Publié le']
  const rows = offers.map((o) => [
    o.title, o.company, o.location ?? '', o.duration ? `${o.duration} mois` : '',
    o.contract_type, o.tags.join(' | '), o.source, o.source_url,
    o.published_at ? new Date(o.published_at).toLocaleDateString('fr-FR') : '',
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `alternances-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

type Props = { offers: Offer[] }

export default function OffersGrid({ offers }: Props) {
  const [page, setPage] = useState(1)
  const [matchScores, setMatchScores] = useState<Record<string, number>>({})

  useEffect(() => {
    setMatchScores(getMatchScores())
    const handler = () => setMatchScores(getMatchScores())
    window.addEventListener('match-scores-updated', handler)
    return () => window.removeEventListener('match-scores-updated', handler)
  }, [])

  // Remettre à la page 1 quand les offres changent (nouveau filtre appliqué)
  useEffect(() => { setPage(1) }, [offers])

  const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = offers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#475569]">
          {offers.length} offre{offers.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => exportCsv(offers)}
          className="text-xs text-[#475569] border border-[#2a2a3d] hover:border-[#4f46e5] hover:text-[#818cf8] px-3 py-1.5 rounded-lg transition-colors"
        >
          ⬇ CSV
        </button>
      </div>

      {/* Grille */}
      {paginated.length === 0 ? (
        <p className="text-[#475569] text-center py-16">
          Aucune offre ne correspond à ta recherche.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              matchScore={matchScores[offer.id]}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-9 h-9 rounded-lg bg-[#16161f] border border-[#2a2a3d] text-[#475569] disabled:opacity-30 hover:border-[#4f46e5] text-sm transition-colors"
          >
            ←
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                n === safePage
                  ? 'bg-[#4f46e5] text-white font-semibold border border-[#6366f1]'
                  : 'bg-[#16161f] border border-[#2a2a3d] text-[#475569] hover:border-[#4f46e5]'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="w-9 h-9 rounded-lg bg-[#16161f] border border-[#2a2a3d] text-[#475569] disabled:opacity-30 hover:border-[#4f46e5] text-sm transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/components/OffersGrid.test.tsx --no-coverage
```

Attendu : PASS (4 tests verts)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add web/components/OffersGrid.tsx web/__tests__/components/OffersGrid.test.tsx
git commit -m "refactor(web): OffersGrid receives pre-filtered offers, removes filter state"
```

---

## Task 6 : Mise à jour de `page.tsx`

**Files:**
- Modify: `web/app/page.tsx`

- [ ] **Step 1 : Remplacer entièrement `web/app/page.tsx`**

```typescript
import Link from 'next/link'
import { getOffers } from '@/lib/offers'
import { createSupabaseServerClient } from '@/lib/supabase'
import NavUser from '@/components/NavUser'
import OffersLayout from '@/components/OffersLayout'

export const revalidate = 21600 // 6 heures

export default async function HomePage() {
  const offers = await getOffers()
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <nav className="h-14 sticky top-0 z-20 bg-[#0a0a0f] border-b border-[#1e1e2e] px-6 flex items-center justify-between">
        <span className="text-base font-bold text-[#e2e8f0] tracking-tight">
          Alternance<span className="text-[#6366f1]">Hub</span>
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/suivi"
            className="text-sm text-[#475569] hover:text-[#e2e8f0] transition-colors hidden sm:block"
          >
            Suivi
          </Link>
          {user ? (
            <NavUser email={user.email ?? ''} />
          ) : (
            <Link
              href="/login"
              className="text-sm text-[#94a3b8] hover:text-[#e2e8f0] border border-[#2a2a3d] hover:border-[#4f46e5] rounded-lg px-3 py-1.5 transition-colors hidden sm:block"
            >
              Connexion
            </Link>
          )}
          <span className="bg-[#1e1e2e] border border-[#312e81] text-[#818cf8] text-xs font-semibold px-3 py-1 rounded-full">
            {offers.length} offres
          </span>
        </div>
      </nav>
      <OffersLayout offers={offers} />
    </>
  )
}
```

- [ ] **Step 2 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Step 3 : Vérifier le build**

```bash
cd web && npm run build
```

Attendu : build réussi.

- [ ] **Step 4 : Commit**

```bash
git add web/app/page.tsx
git commit -m "feat(web): update homepage to use OffersLayout with sidebar"
```

---

## Task 7 : Refonte tokens `OfferCard.tsx`

**Files:**
- Modify: `web/components/OfferCard.tsx`

- [ ] **Step 1 : Remplacer entièrement `web/components/OfferCard.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { Offer } from '@/types/offer'
import FollowButton from '@/components/FollowButton'
import OfferModal from '@/components/OfferModal'
import { getMatchInsights } from '@/components/CVUploader'

type Props = { offer: Offer; matchScore?: number }

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function matchBadge(score: number): string {
  if (score >= 70) return 'bg-[#14532d] border border-[#166534] text-[#4ade80]'
  if (score >= 40) return 'bg-[#1c1917] border border-[#44403c] text-[#d97706]'
  return 'bg-[#1e1e2e] border border-[#334155] text-[#475569]'
}

export default function OfferCard({ offer, matchScore }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const insight = getMatchInsights()[offer.id]

  return (
    <>
      <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-5 flex flex-col gap-3 hover:border-[#4f46e5] transition-colors duration-150 cursor-default">
        <div className="flex justify-between items-start gap-2">
          <div className="cursor-pointer" onClick={() => setModalOpen(true)}>
            <h3 className="text-base font-semibold text-[#e2e8f0] leading-snug hover:text-[#818cf8] transition-colors">
              {offer.title}
            </h3>
            <p className="text-sm text-[#475569] mt-0.5">{offer.company}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {matchScore !== undefined && (
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${matchBadge(matchScore)}`}>
                {matchScore}%
              </span>
            )}
            <span className="bg-[#1e1e2e] text-[#818cf8] border border-[#312e81] text-xs font-medium px-2 py-1 rounded-lg">
              {offer.source === 'france_travail' ? 'LBA' : offer.source}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-[#475569]">
          {offer.location && <span>📍 {offer.location}</span>}
          {offer.duration && <span>⏱ {offer.duration} mois</span>}
          <span>💼 {offer.contract_type}</span>
        </div>

        {offer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {offer.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2 py-0.5 rounded-lg bg-[#16161f] text-[#475569] border border-[#2a2a3d]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs text-[#334155]">
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
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#4f46e5] hover:bg-[#6366f1] text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Voir l&apos;offre →
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <OfferModal
          offer={offer}
          matchScore={matchScore}
          insight={insight}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2 : Vérifier que les tests OfferCard passent toujours**

```bash
cd web && npx jest __tests__/components/OfferCard.test.tsx --no-coverage
```

Attendu : PASS (les tests testent le comportement, pas les classes CSS)

- [ ] **Step 3 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Step 4 : Commit**

```bash
git add web/components/OfferCard.tsx
git commit -m "feat(web): apply flat dark tokens to OfferCard"
```

---

## Task 8 : Navbar flat dark dans `suivi/page.tsx`

**Files:**
- Modify: `web/app/suivi/page.tsx`

- [ ] **Step 1 : Mettre à jour la navbar dans `web/app/suivi/page.tsx`**

Remplacer uniquement le bloc `<nav>` (ligne 25–38) :

```typescript
      <nav className="h-14 sticky top-0 z-20 bg-[#0a0a0f] border-b border-[#1e1e2e] px-6 flex items-center justify-between">
        <Link href="/" className="text-base font-bold text-[#e2e8f0] tracking-tight">
          Alternance<span className="text-[#6366f1]">Hub</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-[#475569] hover:text-[#e2e8f0] transition-colors hidden sm:block">
            Offres
          </Link>
          <Link href="/suivi" className="text-[#6366f1] font-semibold">
            Suivi
          </Link>
          {user && <NavUser email={user.email ?? ''} />}
        </div>
      </nav>
```

- [ ] **Step 2 : Mettre à jour les classes restantes dans `suivi/page.tsx`**

Remplacer les occurrences de classes glass dans le body de la page :

| Avant | Après |
|-------|-------|
| `text-white/90` | `text-[#e2e8f0]` |
| `text-white/40` | `text-[#475569]` |
| `glass rounded-2xl` | `bg-[#16161f] border border-[#1e1e2e] rounded-xl` |
| `text-white/40` (labels) | `text-[#475569]` |

Le fichier complet `web/app/suivi/page.tsx` après modification :

```typescript
import { getApplications } from '@/lib/applications'
import KanbanBoard from '@/components/KanbanBoard'
import NavUser from '@/components/NavUser'
import CVUploader from '@/components/CVUploader'
import { createSupabaseServerClient } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SuiviPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
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
      <nav className="h-14 sticky top-0 z-20 bg-[#0a0a0f] border-b border-[#1e1e2e] px-6 flex items-center justify-between">
        <Link href="/" className="text-base font-bold text-[#e2e8f0] tracking-tight">
          Alternance<span className="text-[#6366f1]">Hub</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-[#475569] hover:text-[#e2e8f0] transition-colors hidden sm:block">
            Offres
          </Link>
          <Link href="/suivi" className="text-[#6366f1] font-semibold">
            Suivi
          </Link>
          {user && <NavUser email={user.email ?? ''} />}
        </div>
      </nav>

      <div className="px-8 py-8">
        <h1 className="text-3xl font-bold text-[#e2e8f0] mb-1 tracking-tight">Tableau de suivi</h1>
        <p className="text-sm text-[#475569] mb-6">
          Glisse les cartes entre colonnes pour changer leur statut
        </p>

        <div className="flex gap-3 mb-6">
          <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl px-5 py-3">
            <span className="text-2xl font-bold text-[#e2e8f0]">{total}</span>
            <span className="text-xs text-[#475569] ml-2">Total</span>
          </div>
          <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl px-5 py-3">
            <span className="text-2xl font-bold text-emerald-400">{interviews}</span>
            <span className="text-xs text-[#475569] ml-2">Entretiens</span>
          </div>
          {urgent > 0 && (
            <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl px-5 py-3">
              <span className="text-2xl font-bold text-amber-400">{urgent}</span>
              <span className="text-xs text-[#475569] ml-2">Relances urgentes</span>
            </div>
          )}
        </div>

        <div className="mb-6 max-w-sm">
          <CVUploader />
        </div>

        <KanbanBoard initialApplications={applications} />
      </div>
    </>
  )
}
```

- [ ] **Step 3 : Vérifier les types**

```bash
cd web && npx tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Step 4 : Commit**

```bash
git add web/app/suivi/page.tsx
git commit -m "feat(web): apply flat dark tokens to suivi page navbar"
```

---

## Task 9 : Vérification finale

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

Attendu : build réussi.

- [ ] **Step 5 : Commit final + push**

```bash
git add -A
git commit -m "feat(web): phase 8 complete — flat dark UI, sidebar layout"
git push origin develop
```

- [ ] **Step 6 : Ouvrir la PR develop → main**

```bash
gh pr create --title "feat: phase 8 — refonte UI flat dark + sidebar layout" \
  --body "$(cat <<'EOF'
## Phase 8 — Refonte UI/UX

### Changements
- Design glassmorphism → flat dark (style Linear/Vercel)
- Layout homepage : sidebar filtres fixe 240px + liste d'offres
- `FilterSidebar` : localisation, durée, télétravail, date, tags
- `FilterChips` : filtres actifs en chips scrollables (mobile)
- `OffersLayout` : Client Component propriétaire du state filtres
- `OffersGrid` : simplifié — reçoit offres filtrées, gère pagination + CSV
- `OfferCard` : tokens flat dark, structure inchangée
- Navbar responsive (lien Connexion masqué sur mobile)

### Architecture
- `lib/filters.ts` : type `Filters` + `applyFilters` (pure function testée)
- Server Components (`page.tsx`, `suivi/page.tsx`) inchangés côté logique

### Tests
- 9 tests `filters.test.ts`
- 11 tests `FilterSidebar.test.tsx`
- 3 tests `OffersLayout.test.tsx`
- 4 tests `OffersGrid.test.tsx` (mis à jour)
EOF
)"
```
