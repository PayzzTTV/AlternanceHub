# Frontend Phase 3 — AlternanceHub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire le job board Next.js 15 qui affiche les offres d'alternance cybersécurité depuis Supabase avec recherche et filtres client-side.

**Architecture:** Page principale Server Component avec ISR (revalidate 6h) qui fetch toutes les offres et les passe à `OffersGrid` (Client Component). Le filtrage/recherche/pagination se fait entièrement côté client sur les données déjà chargées. Aucun re-fetch Supabase à chaque filtre.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS, @supabase/ssr, Jest + React Testing Library, Vercel.

---

## Structure des fichiers

```
web/
  app/
    layout.tsx              → RootLayout : Inter font, metadata, fond global
    page.tsx                → Page principale : Server Component ISR, fetch offers
    globals.css             → CSS variables dark mode + reset Tailwind
  components/
    StatsBar.tsx            → Compteur offres + heure mise à jour (server)
    OfferCard.tsx           → Card individuelle (server, props only)
    OffersGrid.tsx          → Client Component : état search/filtres/pagination + rendu grille
  lib/
    supabase.ts             → createServerClient (@supabase/ssr)
    offers.ts               → getOffers() → Offer[]
  types/
    offer.ts                → type Offer (miroir table Supabase)
  __tests__/
    lib/offers.test.ts
    components/OfferCard.test.tsx
    components/OffersGrid.test.tsx
  next.config.ts            → security headers, ISR config
  tailwind.config.ts        → palette dark mode custom
  jest.config.ts
  jest.setup.ts
  .env.local                → NEXT_PUBLIC_SUPABASE_URL + ANON_KEY (déjà dans repo)
```

---

## Task 1 : Bootstrap Next.js 15

**Files:**
- Create: `web/` (projet complet via create-next-app)

- [ ] **Step 1 : Initialiser le projet**

Depuis la racine du repo :

```bash
cd /chemin/vers/trouve_ton_alternance
npx create-next-app@15 web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes
```

- [ ] **Step 2 : Installer les dépendances Supabase et test**

```bash
cd web
npm install @supabase/supabase-js @supabase/ssr
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

- [ ] **Step 3 : Vérifier que le projet démarre**

```bash
npm run dev
```

Attendu : `http://localhost:3000` accessible, page Next.js par défaut visible.

- [ ] **Step 4 : Supprimer le boilerplate inutile**

Supprimer le contenu de `web/app/page.tsx` (garder le fichier vide avec `export default function Home() { return <></> }`).
Supprimer `web/app/globals.css` (on le réécrit à la tâche suivante).
Supprimer `web/public/` (images par défaut inutiles).

- [ ] **Step 5 : Commit**

```bash
cd ..
git add web/
git commit -m "feat(web): bootstrap Next.js 15 with TypeScript, Tailwind, Supabase"
```

---

## Task 2 : Design tokens + configuration Tailwind

**Files:**
- Modify: `web/app/globals.css`
- Modify: `web/tailwind.config.ts`
- Modify: `web/next.config.ts`

- [ ] **Step 1 : Écrire `web/app/globals.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0F172A;
  --bg-card: #1E293B;
  --border: #334155;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --primary: #3B82F6;
  --primary-dark: #2563EB;
  --primary-light: #DBEAFE;
  --badge-bg: #1E3A5F;
  --badge-text: #93C5FD;
  --success-bg: #052e16;
  --success-text: #4ADE80;
  --yellow-bg: #2D2000;
  --yellow-text: #FCD34D;
}

body {
  background-color: var(--bg);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
}
```

- [ ] **Step 2 : Écrire `web/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0F172A',
        card: '#1E293B',
        border: '#334155',
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#DBEAFE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 3 : Écrire `web/next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
}

export default nextConfig
```

- [ ] **Step 4 : Vérifier que le build passe**

```bash
cd web && npm run build
```

Attendu : `✓ Compiled successfully`

- [ ] **Step 5 : Commit**

```bash
cd ..
git add web/app/globals.css web/tailwind.config.ts web/next.config.ts
git commit -m "feat(web): add design tokens, Tailwind config, security headers"
```

---

## Task 3 : Type Offer + client Supabase

**Files:**
- Create: `web/types/offer.ts`
- Create: `web/lib/supabase.ts`

- [ ] **Step 1 : Créer `web/types/offer.ts`**

```typescript
export type Offer = {
  id: string
  hash: string
  title: string
  company: string
  location: string | null
  contract_type: string
  duration: string | null
  salary: string | null
  tags: string[]
  source: string
  source_url: string
  published_at: string | null
  scraped_at: string
  is_active: boolean
}
```

- [ ] **Step 2 : Créer `web/lib/supabase.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
}
```

- [ ] **Step 3 : Configurer Jest**

Créer `web/jest.config.ts` :

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

Créer `web/jest.setup.ts` :

```typescript
import '@testing-library/jest-dom'
```

Ajouter dans `web/package.json` (section `scripts`) :

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4 : Commit**

```bash
cd ..
git add web/types/ web/lib/supabase.ts web/jest.config.ts web/jest.setup.ts web/package.json
git commit -m "feat(web): add Offer type, Supabase server client, Jest config"
```

---

## Task 4 : lib/offers.ts + test

**Files:**
- Create: `web/lib/offers.ts`
- Create: `web/__tests__/lib/offers.test.ts`

- [ ] **Step 1 : Écrire le test en premier**

Créer `web/__tests__/lib/offers.test.ts` :

```typescript
import { getOffers } from '@/lib/offers'

// Mock Supabase client
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockOrder = jest.fn()

jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    }),
  }),
}))

describe('getOffers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns offers array on success', async () => {
    const fakeOffers = [
      {
        id: '1',
        hash: 'abc',
        title: 'Analyste SOC',
        company: 'DINUM',
        location: 'Paris',
        contract_type: 'alternance',
        duration: '12',
        salary: null,
        tags: ['cybersécurité'],
        source: 'france_travail',
        source_url: 'https://example.com',
        published_at: '2024-07-23T00:00:00Z',
        scraped_at: '2024-07-24T00:00:00Z',
        is_active: true,
      },
    ]
    mockOrder.mockResolvedValue({ data: fakeOffers, error: null })

    const result = await getOffers()

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Analyste SOC')
  })

  it('returns empty array when Supabase returns error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const result = await getOffers()

    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd web && npx jest __tests__/lib/offers.test.ts
```

Attendu : FAIL avec `Cannot find module '@/lib/offers'`

- [ ] **Step 3 : Implémenter `web/lib/offers.ts`**

```typescript
import { createSupabaseServerClient } from '@/lib/supabase'
import type { Offer } from '@/types/offer'

export async function getOffers(): Promise<Offer[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('is_active', true)
    .order('scraped_at', { ascending: false })

  if (error) {
    console.error('getOffers error:', error.message)
    return []
  }

  return (data as Offer[]) ?? []
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

```bash
npx jest __tests__/lib/offers.test.ts
```

Attendu : `PASS __tests__/lib/offers.test.ts` — 2 tests passent.

- [ ] **Step 5 : Commit**

```bash
cd ..
git add web/lib/offers.ts web/__tests__/lib/offers.test.ts
git commit -m "feat(web): add getOffers with Supabase query and tests"
```

---

## Task 5 : Composant OfferCard + test

**Files:**
- Create: `web/components/OfferCard.tsx`
- Create: `web/__tests__/components/OfferCard.test.tsx`

- [ ] **Step 1 : Écrire le test**

Créer `web/__tests__/components/OfferCard.test.tsx` :

```typescript
import { render, screen } from '@testing-library/react'
import OfferCard from '@/components/OfferCard'
import type { Offer } from '@/types/offer'

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
    expect(screen.getByText(/12/)).toBeInTheDocument()
  })

  it('renders tags as badges', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByText('cybersécurité')).toBeInTheDocument()
  })

  it('CTA link points to source_url', () => {
    render(<OfferCard offer={mockOffer} />)
    const link = screen.getByRole('link', { name: /voir l'offre/i })
    expect(link).toHaveAttribute('href', 'https://example.com/offre/1')
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd web && npx jest __tests__/components/OfferCard.test.tsx
```

Attendu : FAIL avec `Cannot find module '@/components/OfferCard'`

- [ ] **Step 3 : Implémenter `web/components/OfferCard.tsx`**

```typescript
import type { Offer } from '@/types/offer'

type Props = { offer: Offer }

const TAG_STYLES: Record<string, string> = {
  cybersécurité: 'bg-[#1E3A5F] text-[#93C5FD]',
  alternance: 'bg-slate-700 text-slate-300 border border-slate-600',
  Télétravail: 'bg-[#052e16] text-[#4ADE80]',
  Apprentissage: 'bg-[#2D2000] text-[#FCD34D]',
  Professionnalisation: 'bg-[#2D2000] text-[#FCD34D]',
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
  )
}
```

- [ ] **Step 4 : Lancer le test**

```bash
npx jest __tests__/components/OfferCard.test.tsx
```

Attendu : `PASS` — 4 tests passent.

- [ ] **Step 5 : Commit**

```bash
cd ..
git add web/components/OfferCard.tsx web/__tests__/components/OfferCard.test.tsx
git commit -m "feat(web): add OfferCard component with tests"
```

---

## Task 6 : Composant StatsBar

**Files:**
- Create: `web/components/StatsBar.tsx`

(Composant simple, pas de logique métier — test visuel suffisant via page)

- [ ] **Step 1 : Créer `web/components/StatsBar.tsx`**

```typescript
type Props = {
  count: number
  scrapedAt: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'récemment'
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'il y a moins d\'1h'
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export default function StatsBar({ count, scrapedAt }: Props) {
  return (
    <div className="bg-[#1E293B] border-b border-[#334155] px-8 py-3 flex items-center gap-6 text-sm">
      <span className="font-semibold text-blue-400">{count} offres</span>
      <span className="text-[#334155]">·</span>
      <span className="text-slate-400">Mis à jour {timeAgo(scrapedAt)}</span>
      <span className="text-[#334155]">·</span>
      <span className="text-slate-400">Source : La Bonne Alternance</span>
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
cd ..
git add web/components/StatsBar.tsx
git commit -m "feat(web): add StatsBar component"
```

---

## Task 7 : Composant OffersGrid (client, search + filtres + pagination) + test

**Files:**
- Create: `web/components/OffersGrid.tsx`
- Create: `web/__tests__/components/OffersGrid.test.tsx`

- [ ] **Step 1 : Écrire le test**

Créer `web/__tests__/components/OffersGrid.test.tsx` :

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import OffersGrid from '@/components/OffersGrid'
import type { Offer } from '@/types/offer'

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: Math.random().toString(),
    hash: Math.random().toString(),
    title: 'Analyste SOC',
    company: 'DINUM',
    location: 'Paris',
    contract_type: 'alternance',
    duration: '12',
    salary: null,
    tags: ['cybersécurité', 'alternance'],
    source: 'france_travail',
    source_url: 'https://example.com',
    published_at: null,
    scraped_at: new Date().toISOString(),
    is_active: true,
    ...overrides,
  }
}

describe('OffersGrid', () => {
  it('renders all offers when no filter is applied', () => {
    const offers = [makeOffer({ title: 'Offre A' }), makeOffer({ title: 'Offre B' })]
    render(<OffersGrid offers={offers} />)
    expect(screen.getByText('Offre A')).toBeInTheDocument()
    expect(screen.getByText('Offre B')).toBeInTheDocument()
  })

  it('filters by search query on title', () => {
    const offers = [
      makeOffer({ title: 'Analyste SOC' }),
      makeOffer({ title: 'Développeur Python' }),
    ]
    render(<OffersGrid offers={offers} />)
    const input = screen.getByPlaceholderText(/rechercher/i)
    fireEvent.change(input, { target: { value: 'SOC' } })
    expect(screen.getByText('Analyste SOC')).toBeInTheDocument()
    expect(screen.queryByText('Développeur Python')).not.toBeInTheDocument()
  })

  it('filters by search query on company', () => {
    const offers = [
      makeOffer({ company: 'Capgemini' }),
      makeOffer({ company: 'Thales' }),
    ]
    render(<OffersGrid offers={offers} />)
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), {
      target: { value: 'Thales' },
    })
    expect(screen.queryByText('Capgemini')).not.toBeInTheDocument()
  })

  it('shows "Aucune offre" when no results match', () => {
    render(<OffersGrid offers={[makeOffer({ title: 'Analyste SOC' })]} />)
    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), {
      target: { value: 'xyznotfound' },
    })
    expect(screen.getByText(/aucune offre/i)).toBeInTheDocument()
  })

  it('filters by télétravail tag', () => {
    const offers = [
      makeOffer({ title: 'Remote', tags: ['cybersécurité', 'Télétravail'] }),
      makeOffer({ title: 'Onsite', tags: ['cybersécurité'] }),
    ]
    render(<OffersGrid offers={offers} />)
    fireEvent.click(screen.getByRole('button', { name: /télétravail/i }))
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.queryByText('Onsite')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd web && npx jest __tests__/components/OffersGrid.test.tsx
```

Attendu : FAIL avec `Cannot find module '@/components/OffersGrid'`

- [ ] **Step 3 : Implémenter `web/components/OffersGrid.tsx`**

```typescript
'use client'

import { useState, useMemo } from 'react'
import type { Offer } from '@/types/offer'
import OfferCard from '@/components/OfferCard'

const PAGE_SIZE = 12

type Props = { offers: Offer[] }

export default function OffersGrid({ offers }: Props) {
  const [query, setQuery] = useState('')
  const [teletravaилOnly, setTeletravailOnly] = useState(false)
  const [duration, setDuration] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return offers.filter((o) => {
      const matchesQuery =
        !q ||
        o.title.toLowerCase().includes(q) ||
        o.company.toLowerCase().includes(q) ||
        (o.location ?? '').toLowerCase().includes(q)
      const matchesTeletravail =
        !teletravaилOnly || o.tags.includes('Télétravail')
      const matchesDuration = !duration || o.duration === duration
      return matchesQuery && matchesTeletravail && matchesDuration
    })
  }, [offers, query, teletravaилOnly, duration])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function resetFilters() {
    setQuery('')
    setTeletravailOnly(false)
    setDuration('')
    setPage(1)
  }

  return (
    <div>
      {/* Search + filters */}
      <div className="bg-[#1E293B] border-b border-[#334155] px-8 py-4 flex flex-wrap gap-3 items-center">
        {/* Search input */}
        <div className="flex rounded-lg overflow-hidden border-[1.5px] border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)] flex-1 min-w-[260px] max-w-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Rechercher titre, entreprise, ville…"
            className="flex-1 px-4 py-2.5 bg-[#0F172A] text-slate-100 placeholder-slate-500 outline-none text-sm"
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 text-sm font-semibold transition-colors"
            onClick={() => setPage(1)}
          >
            🔍
          </button>
        </div>

        {/* Télétravail toggle */}
        <button
          onClick={() => { setTeletravailOnly(!teletravaилOnly); setPage(1) }}
          className={`px-3 py-2 rounded-full text-sm border transition-colors ${
            teletravaилOnly
              ? 'bg-[#1E3A5F] border-blue-500 text-[#93C5FD] font-medium'
              : 'bg-[#0F172A] border-[#334155] text-slate-400 hover:border-blue-500'
          }`}
        >
          🏠 Télétravail
        </button>

        {/* Duration select */}
        <select
          value={duration}
          onChange={(e) => { setDuration(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-full text-sm bg-[#0F172A] border border-[#334155] text-slate-400 outline-none"
        >
          <option value="">Durée : toutes</option>
          <option value="6">6 mois</option>
          <option value="12">12 mois</option>
          <option value="24">24 mois</option>
        </select>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="ml-auto text-sm text-slate-500 underline hover:text-slate-300"
        >
          Réinitialiser
        </button>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-8 py-7">
        {paginated.length === 0 ? (
          <p className="text-slate-400 text-center py-16">
            Aucune offre ne correspond à ta recherche.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-9 h-9 rounded-lg border border-[#334155] bg-[#1E293B] text-slate-400 disabled:opacity-30 hover:border-blue-500 text-sm"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-lg border text-sm transition-colors ${
                  n === safePage
                    ? 'bg-blue-500 border-blue-500 text-white font-semibold'
                    : 'border-[#334155] bg-[#1E293B] text-slate-400 hover:border-blue-500'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-9 h-9 rounded-lg border border-[#334155] bg-[#1E293B] text-slate-400 disabled:opacity-30 hover:border-blue-500 text-sm"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Lancer les tests**

```bash
npx jest __tests__/components/OffersGrid.test.tsx
```

Attendu : `PASS` — 5 tests passent.

- [ ] **Step 5 : Commit**

```bash
cd ..
git add web/components/OffersGrid.tsx web/__tests__/components/OffersGrid.test.tsx
git commit -m "feat(web): add OffersGrid with search, filters, pagination and tests"
```

---

## Task 8 : Page principale + layout

**Files:**
- Modify: `web/app/layout.tsx`
- Modify: `web/app/page.tsx`

- [ ] **Step 1 : Écrire `web/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AlternanceHub — Offres d\'alternance cybersécurité',
  description: 'Agrégateur d\'offres d\'alternance en cybersécurité. Toutes les offres France Travail, La Bonne Alternance en un seul endroit.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#0F172A] text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2 : Écrire `web/app/page.tsx`**

```typescript
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
        <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {offers.length} offres
        </span>
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

      {/* Grid + filtres */}
      <OffersGrid offers={offers} />
    </>
  )
}
```

- [ ] **Step 3 : Lancer en dev et vérifier visuellement**

```bash
cd web && npm run dev
```

Ouvrir `http://localhost:3000`. Vérifier :
- La navbar affiche "AlternanceHub" + badge count
- Le hero s'affiche avec le gradient
- La StatsBar affiche le nombre d'offres
- La grille affiche les cartes (si NEXT_PUBLIC_SUPABASE_URL est dans `.env.local`)

- [ ] **Step 4 : Vérifier que le build passe**

```bash
npm run build
```

Attendu : `✓ Compiled successfully`, aucune erreur TypeScript.

- [ ] **Step 5 : Lancer tous les tests**

```bash
npm test
```

Attendu : tous les tests passent.

- [ ] **Step 6 : Commit**

```bash
cd ..
git add web/app/layout.tsx web/app/page.tsx
git commit -m "feat(web): add main page with ISR, hero, navbar, StatsBar and OffersGrid"
```

---

## Task 9 : CI Next.js (lint + build + tests)

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1 : Ajouter le job Next.js dans `.github/workflows/ci.yml`**

Ajouter à la fin du fichier (après le job `security`) :

```yaml
  web-lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: web

      - name: Lint (ESLint)
        run: npm run lint
        working-directory: web

      - name: Type check
        run: npx tsc --noEmit
        working-directory: web

      - name: Tests
        run: npm test -- --ci --coverage
        working-directory: web

      - name: Build
        run: npm run build
        working-directory: web
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

- [ ] **Step 2 : Ajouter les secrets GitHub**

Dans GitHub → Settings → Secrets → Actions, ajouter :
- `NEXT_PUBLIC_SUPABASE_URL` (même valeur que `.env.local`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clé anon publique)

- [ ] **Step 3 : Commit et vérifier que la CI passe**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add Next.js lint, typecheck, test, build job"
git push origin develop
```

Ouvrir GitHub Actions et vérifier que le workflow `CI` passe sur le job `web-lint-test`.

---

## Task 10 : Déploiement Vercel

**Files:** aucun fichier modifié (configuration via UI Vercel)

- [ ] **Step 1 : Connecter le repo à Vercel**

1. Aller sur [vercel.com](https://vercel.com) → New Project
2. Importer `PayzzTTV/AlternanceHub`
3. **Root Directory** : `web` (important — le projet Next.js est dans le sous-dossier)
4. Framework : Next.js (auto-détecté)

- [ ] **Step 2 : Configurer les variables d'environnement dans Vercel**

Dans Vercel → Project Settings → Environment Variables :
```
NEXT_PUBLIC_SUPABASE_URL   = https://tizzekonlimucqdqydqt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ... (clé anon)
```

- [ ] **Step 3 : Déployer et vérifier**

Cliquer "Deploy". Vercel build + deploy automatiquement.
Vérifier que l'URL Vercel affiche le site avec les offres.

- [ ] **Step 4 : Ajouter `.superpowers` au `.gitignore`**

```bash
echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm artifacts"
git push origin develop
```

---

## Self-review

**Couverture spec :**
- ✅ Hero + barre de recherche
- ✅ Barre de stats (count + last update)
- ✅ Filtres chips (télétravail), select (durée)
- ✅ Grille d'offres avec cards
- ✅ Pagination 12 offres/page
- ✅ CTA ouvre source_url (pas de page détail)
- ✅ ISR revalidate 6h
- ✅ TypeScript strict
- ✅ @supabase/ssr uniquement
- ✅ CI bloquant
- ✅ Déploiement Vercel

**Type consistency :** `Offer` défini en Task 3, utilisé de façon cohérente dans Tasks 4, 5, 6, 7, 8.

**Filtres manquants du spec (ville, niveau diplôme) :** Le spec les listait mais la table `offers` n'a pas de colonne `level` structurée (niveau est parfois dans les tags). Filtre ville ajouté via la barre de recherche générale (location incluse dans le query match). À affiner en Phase 5 (refonte UI/UX) quand les données seront plus structurées.
