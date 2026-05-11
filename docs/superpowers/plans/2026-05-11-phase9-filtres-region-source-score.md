# Phase 9 — Filtres Région, Source, Score — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le filtre "ville exacte" par un filtre "région" et ajouter des filtres source (LBA) et score minimum (40%+, 70%+).

**Architecture:** `web/lib/regions.ts` fournit la table ville→région. `web/lib/filters.ts` gère région + source dans `applyFilters`. Le filtre `minScore` est appliqué séparément dans `OffersLayout` car les scores viennent du localStorage. `matchScores` remonte de `OffersGrid` vers `OffersLayout` et est passé en prop.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, Jest 30 + Testing Library.

---

## File Map

| Action | Fichier | Rôle |
|--------|---------|------|
| Create | `web/lib/regions.ts` | Table ville→région + `cityToRegion()` + `REGIONS` |
| Create | `web/__tests__/lib/regions.test.ts` | Tests unitaires regions |
| Modify | `web/lib/filters.ts` | Retire `location`, ajoute `region`/`source`/`minScore` |
| Modify | `web/__tests__/lib/filters.test.ts` | Tests mis à jour |
| Modify | `web/components/OffersGrid.tsx` | Reçoit `matchScores` en prop |
| Modify | `web/__tests__/components/OffersGrid.test.tsx` | Tests mis à jour |
| Modify | `web/components/OffersLayout.tsx` | Remonte matchScores, applique minScore |
| Modify | `web/__tests__/components/OffersLayout.test.tsx` | Tests mis à jour |
| Modify | `web/components/FilterSidebar.tsx` | Région + source + score sections |
| Modify | `web/__tests__/components/FilterSidebar.test.tsx` | Tests mis à jour |

---

## Task 1 : `web/lib/regions.ts` + tests

**Files:**
- Create: `web/lib/regions.ts`
- Create: `web/__tests__/lib/regions.test.ts`

- [ ] **Step 1 : Écrire les tests**

Contenu de `web/__tests__/lib/regions.test.ts` :

```typescript
import { cityToRegion, REGIONS } from '@/lib/regions'

describe('cityToRegion', () => {
  it('retourne la région pour une ville connue', () => {
    expect(cityToRegion('Paris')).toBe('Île-de-France')
    expect(cityToRegion('Lyon')).toBe('Auvergne-Rhône-Alpes')
    expect(cityToRegion('Marseille')).toBe("Provence-Alpes-Côte d'Azur")
  })

  it('est insensible à la casse', () => {
    expect(cityToRegion('paris')).toBe('Île-de-France')
    expect(cityToRegion('LYON')).toBe('Auvergne-Rhône-Alpes')
  })

  it('gère les variantes avec arrondissement — Paris 1er, Lyon 3e', () => {
    expect(cityToRegion('Paris 1er')).toBe('Île-de-France')
    expect(cityToRegion('Paris 75008')).toBe('Île-de-France')
    expect(cityToRegion('Lyon 3e')).toBe('Auvergne-Rhône-Alpes')
    expect(cityToRegion('Marseille 13')).toBe("Provence-Alpes-Côte d'Azur")
  })

  it('retourne null pour une ville inconnue', () => {
    expect(cityToRegion('Atlantis')).toBeNull()
    expect(cityToRegion('VilleInconnue')).toBeNull()
  })

  it('retourne null pour null', () => {
    expect(cityToRegion(null)).toBeNull()
  })
})

describe('REGIONS', () => {
  it('contient les 13 régions métropolitaines', () => {
    expect(REGIONS).toHaveLength(13)
    expect(REGIONS).toContain('Île-de-France')
    expect(REGIONS).toContain("Provence-Alpes-Côte d'Azur")
    expect(REGIONS).toContain('Auvergne-Rhône-Alpes')
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
cd web && npx jest __tests__/lib/regions.test.ts --no-coverage 2>&1 | tail -5
```

Attendu : FAIL — "Cannot find module '@/lib/regions'"

- [ ] **Step 3 : Créer `web/lib/regions.ts`**

```typescript
const CITY_TO_REGION: Record<string, string> = {
  // Île-de-France
  paris: 'Île-de-France',
  versailles: 'Île-de-France',
  'boulogne-billancourt': 'Île-de-France',
  'neuilly-sur-seine': 'Île-de-France',
  'issy-les-moulineaux': 'Île-de-France',
  'levallois-perret': 'Île-de-France',
  cergy: 'Île-de-France',
  évry: 'Île-de-France',
  evry: 'Île-de-France',
  massy: 'Île-de-France',
  palaiseau: 'Île-de-France',
  saclay: 'Île-de-France',
  'saint-denis': 'Île-de-France',
  montreuil: 'Île-de-France',
  vincennes: 'Île-de-France',
  créteil: 'Île-de-France',
  creteil: 'Île-de-France',
  nanterre: 'Île-de-France',
  'rueil-malmaison': 'Île-de-France',
  suresnes: 'Île-de-France',
  puteaux: 'Île-de-France',
  courbevoie: 'Île-de-France',
  clamart: 'Île-de-France',
  'vélizy-villacoublay': 'Île-de-France',
  'velizy-villacoublay': 'Île-de-France',
  vélizy: 'Île-de-France',
  velizy: 'Île-de-France',
  meudon: 'Île-de-France',
  'gif-sur-yvette': 'Île-de-France',
  orsay: 'Île-de-France',
  'les ulis': 'Île-de-France',
  antony: 'Île-de-France',
  montrouge: 'Île-de-France',
  arcueil: 'Île-de-France',
  cachan: 'Île-de-France',
  'la défense': 'Île-de-France',
  'la defense': 'Île-de-France',
  châtillon: 'Île-de-France',
  chatillon: 'Île-de-France',
  malakoff: 'Île-de-France',
  'fontenay-sous-bois': 'Île-de-France',

  // Auvergne-Rhône-Alpes
  lyon: 'Auvergne-Rhône-Alpes',
  grenoble: 'Auvergne-Rhône-Alpes',
  'clermont-ferrand': 'Auvergne-Rhône-Alpes',
  'saint-étienne': 'Auvergne-Rhône-Alpes',
  'saint-etienne': 'Auvergne-Rhône-Alpes',
  annecy: 'Auvergne-Rhône-Alpes',
  chambéry: 'Auvergne-Rhône-Alpes',
  chambery: 'Auvergne-Rhône-Alpes',
  valence: 'Auvergne-Rhône-Alpes',
  villeurbanne: 'Auvergne-Rhône-Alpes',
  'caluire-et-cuire': 'Auvergne-Rhône-Alpes',
  bron: 'Auvergne-Rhône-Alpes',
  vénissieux: 'Auvergne-Rhône-Alpes',
  venissieux: 'Auvergne-Rhône-Alpes',
  meylan: 'Auvergne-Rhône-Alpes',
  crolles: 'Auvergne-Rhône-Alpes',
  échirolles: 'Auvergne-Rhône-Alpes',
  echirolles: 'Auvergne-Rhône-Alpes',
  montbonnot: 'Auvergne-Rhône-Alpes',

  // Hauts-de-France
  lille: 'Hauts-de-France',
  amiens: 'Hauts-de-France',
  roubaix: 'Hauts-de-France',
  tourcoing: 'Hauts-de-France',
  dunkerque: 'Hauts-de-France',
  valenciennes: 'Hauts-de-France',
  lens: 'Hauts-de-France',
  arras: 'Hauts-de-France',
  béthune: 'Hauts-de-France',
  bethune: 'Hauts-de-France',
  "villeneuve-d'ascq": 'Hauts-de-France',
  calais: 'Hauts-de-France',
  'boulogne-sur-mer': 'Hauts-de-France',
  'saint-quentin': 'Hauts-de-France',
  compiègne: 'Hauts-de-France',
  compiegne: 'Hauts-de-France',

  // Nouvelle-Aquitaine
  bordeaux: 'Nouvelle-Aquitaine',
  pau: 'Nouvelle-Aquitaine',
  limoges: 'Nouvelle-Aquitaine',
  poitiers: 'Nouvelle-Aquitaine',
  'la rochelle': 'Nouvelle-Aquitaine',
  bayonne: 'Nouvelle-Aquitaine',
  angoulême: 'Nouvelle-Aquitaine',
  angouleme: 'Nouvelle-Aquitaine',
  mérignac: 'Nouvelle-Aquitaine',
  merignac: 'Nouvelle-Aquitaine',
  pessac: 'Nouvelle-Aquitaine',
  talence: 'Nouvelle-Aquitaine',
  biarritz: 'Nouvelle-Aquitaine',
  niort: 'Nouvelle-Aquitaine',
  périgueux: 'Nouvelle-Aquitaine',
  perigueux: 'Nouvelle-Aquitaine',
  agen: 'Nouvelle-Aquitaine',

  // Occitanie
  toulouse: 'Occitanie',
  montpellier: 'Occitanie',
  nîmes: 'Occitanie',
  nimes: 'Occitanie',
  perpignan: 'Occitanie',
  béziers: 'Occitanie',
  beziers: 'Occitanie',
  albi: 'Occitanie',
  castres: 'Occitanie',
  tarbes: 'Occitanie',
  narbonne: 'Occitanie',
  carcassonne: 'Occitanie',
  montauban: 'Occitanie',
  blagnac: 'Occitanie',
  labège: 'Occitanie',
  labege: 'Occitanie',

  // Grand Est
  strasbourg: 'Grand Est',
  reims: 'Grand Est',
  metz: 'Grand Est',
  nancy: 'Grand Est',
  mulhouse: 'Grand Est',
  colmar: 'Grand Est',
  épinal: 'Grand Est',
  epinal: 'Grand Est',
  troyes: 'Grand Est',
  'châlons-en-champagne': 'Grand Est',
  'chalons-en-champagne': 'Grand Est',
  thionville: 'Grand Est',

  // Provence-Alpes-Côte d'Azur
  marseille: "Provence-Alpes-Côte d'Azur",
  nice: "Provence-Alpes-Côte d'Azur",
  toulon: "Provence-Alpes-Côte d'Azur",
  'aix-en-provence': "Provence-Alpes-Côte d'Azur",
  avignon: "Provence-Alpes-Côte d'Azur",
  gap: "Provence-Alpes-Côte d'Azur",
  cannes: "Provence-Alpes-Côte d'Azur",
  antibes: "Provence-Alpes-Côte d'Azur",
  fréjus: "Provence-Alpes-Côte d'Azur",
  frejus: "Provence-Alpes-Côte d'Azur",
  aubagne: "Provence-Alpes-Côte d'Azur",
  'sophia antipolis': "Provence-Alpes-Côte d'Azur",
  valbonne: "Provence-Alpes-Côte d'Azur",
  mougins: "Provence-Alpes-Côte d'Azur",
  biot: "Provence-Alpes-Côte d'Azur",
  'la ciotat': "Provence-Alpes-Côte d'Azur",
  arles: "Provence-Alpes-Côte d'Azur",
  'salon-de-provence': "Provence-Alpes-Côte d'Azur",

  // Pays de la Loire
  nantes: 'Pays de la Loire',
  angers: 'Pays de la Loire',
  'le mans': 'Pays de la Loire',
  'saint-nazaire': 'Pays de la Loire',
  laval: 'Pays de la Loire',
  'la roche-sur-yon': 'Pays de la Loire',
  cholet: 'Pays de la Loire',

  // Normandie
  rouen: 'Normandie',
  caen: 'Normandie',
  'le havre': 'Normandie',
  cherbourg: 'Normandie',
  'cherbourg-en-cotentin': 'Normandie',
  évreux: 'Normandie',
  evreux: 'Normandie',
  alençon: 'Normandie',
  alencon: 'Normandie',

  // Bretagne
  rennes: 'Bretagne',
  brest: 'Bretagne',
  quimper: 'Bretagne',
  lorient: 'Bretagne',
  vannes: 'Bretagne',
  'saint-malo': 'Bretagne',
  'saint-brieuc': 'Bretagne',

  // Centre-Val de Loire
  orléans: 'Centre-Val de Loire',
  orleans: 'Centre-Val de Loire',
  tours: 'Centre-Val de Loire',
  chartres: 'Centre-Val de Loire',
  blois: 'Centre-Val de Loire',
  bourges: 'Centre-Val de Loire',
  châteauroux: 'Centre-Val de Loire',
  chateauroux: 'Centre-Val de Loire',

  // Bourgogne-Franche-Comté
  dijon: 'Bourgogne-Franche-Comté',
  besançon: 'Bourgogne-Franche-Comté',
  besancon: 'Bourgogne-Franche-Comté',
  belfort: 'Bourgogne-Franche-Comté',
  mâcon: 'Bourgogne-Franche-Comté',
  macon: 'Bourgogne-Franche-Comté',
  auxerre: 'Bourgogne-Franche-Comté',
  nevers: 'Bourgogne-Franche-Comté',
  'chalon-sur-saône': 'Bourgogne-Franche-Comté',
  'chalon-sur-saone': 'Bourgogne-Franche-Comté',

  // Corse
  ajaccio: 'Corse',
  bastia: 'Corse',
}

export const REGIONS: string[] = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  "Provence-Alpes-Côte d'Azur",
]

export function cityToRegion(city: string | null): string | null {
  if (!city) return null
  const normalized = city.toLowerCase().trim()
  if (CITY_TO_REGION[normalized]) return CITY_TO_REGION[normalized]
  // Préfixe : "Paris 1er", "Lyon 3e", "Marseille 13"…
  for (const [key, region] of Object.entries(CITY_TO_REGION)) {
    if (normalized.startsWith(key + ' ') || normalized.startsWith(key + '-')) {
      return region
    }
  }
  return null
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/lib/regions.test.ts --no-coverage
```

Attendu : PASS (7 tests verts)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit 2>&1 | head -10
```

Attendu : 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add web/lib/regions.ts web/__tests__/lib/regions.test.ts
git commit -m "feat(web): add city-to-region mapping for French metropolitan regions"
```

---

## Task 2 : Mise à jour `web/lib/filters.ts` + tests

**Files:**
- Modify: `web/lib/filters.ts`
- Modify: `web/__tests__/lib/filters.test.ts`

- [ ] **Step 1 : Remplacer entièrement `web/__tests__/lib/filters.test.ts`**

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

  it('exclut les offres avec duration null si filtre durée actif', () => {
    const offer = makeOffer({ duration: null })
    expect(applyFilters([offer], { ...defaultFilters, duration: '12' })).toHaveLength(0)
  })

  it('filtre par région — Île-de-France inclut Paris', () => {
    const offers = [
      makeOffer({ location: 'Paris' }),
      makeOffer({ location: 'Lyon' }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, region: 'Île-de-France' })).toHaveLength(1)
  })

  it('filtre par région Autre — villes inconnues uniquement', () => {
    const offers = [
      makeOffer({ location: 'Atlantis' }),
      makeOffer({ location: 'Paris' }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, region: 'Autre' })).toHaveLength(1)
  })

  it('filtre par source', () => {
    const offers = [
      makeOffer({ source: 'france_travail' }),
      makeOffer({ source: 'hellowork' }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, source: 'france_travail' })).toHaveLength(1)
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
    const result = applyFilters(offers, { ...defaultFilters, region: 'Île-de-France', teletravailOnly: true })
    expect(result).toHaveLength(1)
    expect(result[0].location).toBe('Paris')
  })

  describe('publishedAfter', () => {
    it('exclut les offres publiées trop tôt', () => {
      const recent = makeOffer({ published_at: new Date().toISOString() })
      const old = makeOffer({
        published_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      })
      expect(applyFilters([recent, old], { ...defaultFilters, publishedAfter: '30' })).toHaveLength(1)
    })

    it('exclut les offres sans published_at quand publishedAfter est actif', () => {
      const offer = makeOffer({ published_at: null })
      expect(applyFilters([offer], { ...defaultFilters, publishedAfter: '7' })).toHaveLength(0)
    })
  })
})
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
cd web && npx jest __tests__/lib/filters.test.ts --no-coverage 2>&1 | tail -10
```

Attendu : FAIL sur les tests région et source (champs inexistants dans Filters).

- [ ] **Step 3 : Remplacer entièrement `web/lib/filters.ts`**

```typescript
import type { Offer } from '@/types/offer'
import { cityToRegion } from '@/lib/regions'

export type Filters = {
  query: string
  teletravailOnly: boolean
  duration: string
  region: string
  source: string
  minScore: number
  selectedTags: string[]
  publishedAfter: '' | '7' | '30' | '90'
}

export const defaultFilters: Filters = {
  query: '',
  teletravailOnly: false,
  duration: '',
  region: '',
  source: '',
  minScore: 0,
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
    const matchesRegion = !filters.region || (() => {
      const r = cityToRegion(o.location)
      return filters.region === 'Autre' ? r === null : r === filters.region
    })()
    const matchesSource = !filters.source || o.source === filters.source
    const matchesTags =
      filters.selectedTags.length === 0 ||
      filters.selectedTags.every((t) => o.tags.includes(t))
    const matchesDate =
      !cutoff || (o.published_at != null && new Date(o.published_at) >= cutoff)
    return matchesQuery && matchesTeletravail && matchesDuration && matchesRegion && matchesSource && matchesTags && matchesDate
  })
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/lib/filters.test.ts --no-coverage
```

Attendu : PASS (14 tests verts)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit 2>&1 | head -20
```

Note : des erreurs TS apparaîtront sur `FilterSidebar.tsx` (référence à `filters.location` qui n'existe plus) — c'est attendu, sera corrigé en Task 5.

- [ ] **Step 6 : Commit**

```bash
git add web/lib/filters.ts web/__tests__/lib/filters.test.ts
git commit -m "feat(web): add region/source/minScore to Filters type, replace location with region in applyFilters"
```

---

## Task 3 : Refactor `web/components/OffersGrid.tsx` — matchScores en prop

**Files:**
- Modify: `web/components/OffersGrid.tsx`
- Modify: `web/__tests__/components/OffersGrid.test.tsx`

- [ ] **Step 1 : Remplacer entièrement `web/__tests__/components/OffersGrid.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react'
import OffersGrid from '@/components/OffersGrid'
import type { Offer } from '@/types/offer'

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
    render(<OffersGrid offers={offers} matchScores={{}} />)
    expect(screen.getByText('Offre A')).toBeInTheDocument()
    expect(screen.getByText('Offre B')).toBeInTheDocument()
  })

  it("affiche l'état vide quand aucune offre", () => {
    render(<OffersGrid offers={[]} matchScores={{}} />)
    expect(screen.getByText(/aucune offre/i)).toBeInTheDocument()
  })

  it("affiche le nombre d'offres", () => {
    render(<OffersGrid offers={[makeOffer(), makeOffer()]} matchScores={{}} />)
    expect(screen.getByText(/2 offres/)).toBeInTheDocument()
  })

  it('affiche le bouton CSV', () => {
    render(<OffersGrid offers={[makeOffer()]} matchScores={{}} />)
    expect(screen.getByText(/csv/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer les tests pour voir l'état actuel**

```bash
cd web && npx jest __tests__/components/OffersGrid.test.tsx --no-coverage 2>&1 | tail -10
```

Attendu : FAIL — `matchScores` n'est pas encore une prop.

- [ ] **Step 3 : Mettre à jour `web/components/OffersGrid.tsx`**

Remplacer le type Props et retirer la logique interne matchScores :

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { Offer } from '@/types/offer'
import OfferCard from '@/components/OfferCard'

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

type Props = {
  offers: Offer[]
  matchScores: Record<string, number>
}

export default function OffersGrid({ offers, matchScores }: Props) {
  const [page, setPage] = useState(1)

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

- [ ] **Step 5 : Commit**

```bash
git add web/components/OffersGrid.tsx web/__tests__/components/OffersGrid.test.tsx
git commit -m "refactor(web): OffersGrid receives matchScores as prop instead of computing internally"
```

---

## Task 4 : Mise à jour `web/components/OffersLayout.tsx`

**Files:**
- Modify: `web/components/OffersLayout.tsx`
- Modify: `web/__tests__/components/OffersLayout.test.tsx`

- [ ] **Step 1 : Remplacer entièrement `web/__tests__/components/OffersLayout.test.tsx`**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import OffersLayout from '@/components/OffersLayout'
import type { Offer } from '@/types/offer'

jest.mock('@/components/CVUploader', () => ({
  getMatchScores: jest.fn(() => ({ 'offer-a': 80, 'offer-b': 30 })),
  getMatchInsights: jest.fn(() => ({})),
}))

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
  default: ({ offers, matchScores }: { offers: Offer[]; matchScores: Record<string, number> }) => (
    <div data-testid="offers-grid" data-scores={Object.keys(matchScores).length}>
      {offers.length} offres
    </div>
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

  it('passe matchScores à OffersGrid', () => {
    render(<OffersLayout offers={[makeOffer({ id: 'offer-a' }), makeOffer({ id: 'offer-b' })]} />)
    // getMatchScores mocké retourne { 'offer-a': 80, 'offer-b': 30 } soit 2 scores
    expect(screen.getByTestId('offers-grid').dataset.scores).toBe('2')
  })
})
```

- [ ] **Step 2 : Lancer les tests pour voir l'état actuel**

```bash
cd web && npx jest __tests__/components/OffersLayout.test.tsx --no-coverage 2>&1 | tail -10
```

Attendu : FAIL — OffersGrid reçoit un prop `matchScores` inattendu (ou erreur de type).

- [ ] **Step 3 : Remplacer entièrement `web/components/OffersLayout.tsx`**

```typescript
'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Offer } from '@/types/offer'
import FilterSidebar, { FilterChips } from '@/components/FilterSidebar'
import OffersGrid from '@/components/OffersGrid'
import { defaultFilters, applyFilters, type Filters } from '@/lib/filters'
import { getMatchScores } from '@/components/CVUploader'

type Props = { offers: Offer[] }

export default function OffersLayout({ offers }: Props) {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [matchScores, setMatchScores] = useState<Record<string, number>>({})

  useEffect(() => {
    setMatchScores(getMatchScores())
    const handler = () => setMatchScores(getMatchScores())
    window.addEventListener('match-scores-updated', handler)
    return () => window.removeEventListener('match-scores-updated', handler)
  }, [])

  const filteredOffers = useMemo(() => applyFilters(offers, filters), [offers, filters])
  const scoredOffers = useMemo(
    () =>
      filters.minScore === 0
        ? filteredOffers
        : filteredOffers.filter((o) => (matchScores[o.id] ?? 0) >= filters.minScore),
    [filteredOffers, filters.minScore, matchScores]
  )

  const hasScores = Object.keys(matchScores).length > 0

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar — desktop uniquement */}
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        offers={offers}
        hasScores={hasScores}
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
              hasScores={hasScores}
              className="flex w-full border-t border-[#1e1e2e] max-h-[60vh] overflow-y-auto"
            />
          )}
        </div>

        <OffersGrid offers={scoredOffers} matchScores={matchScores} />
      </main>
    </div>
  )
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
cd web && npx jest __tests__/components/OffersLayout.test.tsx --no-coverage
```

Attendu : PASS (4 tests verts)

- [ ] **Step 5 : Commit**

```bash
git add web/components/OffersLayout.tsx web/__tests__/components/OffersLayout.test.tsx
git commit -m "feat(web): lift matchScores to OffersLayout, add minScore filter and hasScores prop"
```

---

## Task 5 : Mise à jour `web/components/FilterSidebar.tsx` + tests

**Files:**
- Modify: `web/components/FilterSidebar.tsx`
- Modify: `web/__tests__/components/FilterSidebar.test.tsx`

- [ ] **Step 1 : Remplacer entièrement `web/__tests__/components/FilterSidebar.test.tsx`**

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

const baseOffers = [
  makeOffer({ location: 'Paris' }),
  makeOffer({ location: 'Lyon' }),
]

describe('FilterSidebar', () => {
  beforeEach(() => jest.clearAllMocks())

  it('affiche le champ de recherche', () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} hasScores={false} />)
    expect(screen.getByPlaceholderText(/titre, entreprise/i)).toBeInTheDocument()
  })

  it('affiche les sections Région, Durée, Télétravail', () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} hasScores={false} />)
    expect(screen.getByText(/région/i)).toBeInTheDocument()
    expect(screen.getByText(/durée/i)).toBeInTheDocument()
    expect(screen.getByText(/télétravail/i)).toBeInTheDocument()
  })

  it('affiche la section source', () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} hasScores={false} />)
    expect(screen.getByText(/source/i)).toBeInTheDocument()
  })

  it('affiche la section score uniquement si hasScores=true', () => {
    const { rerender } = render(
      <FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} hasScores={false} />
    )
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument()

    rerender(
      <FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} hasScores={true} />
    )
    expect(screen.getByText(/score/i)).toBeInTheDocument()
  })

  it('appelle onChange quand la query change', () => {
    const onChange = jest.fn()
    render(<FilterSidebar filters={defaultFilters} onChange={onChange} offers={baseOffers} hasScores={false} />)
    fireEvent.change(screen.getByPlaceholderText(/titre, entreprise/i), { target: { value: 'SOC' } })
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, query: 'SOC' })
  })

  it('appelle onChange quand le toggle télétravail est cliqué', () => {
    const onChange = jest.fn()
    render(<FilterSidebar filters={defaultFilters} onChange={onChange} offers={baseOffers} hasScores={false} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, teletravailOnly: true })
  })

  it("n'affiche pas Réinitialiser si aucun filtre actif", () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} hasScores={false} />)
    expect(screen.queryByText('Réinitialiser')).not.toBeInTheDocument()
  })

  it('affiche Réinitialiser si un filtre est actif', () => {
    render(
      <FilterSidebar
        filters={{ ...defaultFilters, query: 'test' }}
        onChange={jest.fn()}
        offers={baseOffers}
        hasScores={false}
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
        hasScores={false}
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
        hasScores={false}
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

  it('affiche un chip pour la région active', () => {
    render(<FilterChips filters={{ ...defaultFilters, region: 'Île-de-France' }} onChange={jest.fn()} />)
    expect(screen.getByText(/Île-de-France/i)).toBeInTheDocument()
  })

  it('affiche un chip pour la source active', () => {
    render(<FilterChips filters={{ ...defaultFilters, source: 'france_travail' }} onChange={jest.fn()} />)
    expect(screen.getByText('LBA')).toBeInTheDocument()
  })

  it('affiche un chip pour le score minimum actif', () => {
    render(<FilterChips filters={{ ...defaultFilters, minScore: 70 }} onChange={jest.fn()} />)
    expect(screen.getByText(/≥ 70%/i)).toBeInTheDocument()
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
cd web && npx jest __tests__/components/FilterSidebar.test.tsx --no-coverage 2>&1 | tail -10
```

Attendu : FAIL — `hasScores` prop manquante, sections source/score absentes.

- [ ] **Step 3 : Remplacer entièrement `web/components/FilterSidebar.tsx`**

```typescript
'use client'

import type { Filters } from '@/lib/filters'
import { defaultFilters } from '@/lib/filters'
import type { Offer } from '@/types/offer'
import { cityToRegion, REGIONS } from '@/lib/regions'

type Props = {
  filters: Filters
  onChange: (f: Filters) => void
  offers: Offer[]
  hasScores: boolean
  className?: string
}

const DURATIONS = ['6', '12', '24']

const PUBLISHED_OPTIONS: { label: string; value: Filters['publishedAfter'] }[] = [
  { label: 'Tout', value: '' },
  { label: '7 jours', value: '7' },
  { label: '30 jours', value: '30' },
  { label: '3 mois', value: '90' },
]

const SOURCE_LABELS: Record<string, string> = {
  france_travail: 'LBA',
}

const SCORE_OPTIONS = [
  { label: 'Tous', value: 0 },
  { label: '40%+', value: 40 },
  { label: '70%+', value: 70 },
]

const PILL_BASE = 'px-2.5 py-1 rounded-lg text-xs border transition-colors'
const PILL_ACTIVE = 'bg-[#1e1e2e] border-[#312e81] text-[#818cf8] font-medium'
const PILL_INACTIVE = 'bg-[#16161f] border-[#2a2a3d] text-[#475569] hover:border-[#4f46e5]'

export default function FilterSidebar({ filters, onChange, offers, hasScores, className = '' }: Props) {
  const availableRegions = [...new Set(
    offers.map((o) => cityToRegion(o.location) ?? 'Autre')
  )].sort()

  const allTags = [...new Set(offers.flatMap((o) => o.tags))].sort().slice(0, 8)

  const hasActive =
    !!filters.query ||
    filters.teletravailOnly ||
    !!filters.duration ||
    !!filters.region ||
    !!filters.source ||
    filters.minScore > 0 ||
    filters.selectedTags.length > 0 ||
    !!filters.publishedAfter

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

        {/* Région */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-widest">Région</label>
          <select
            value={filters.region}
            onChange={(e) => set('region', e.target.value)}
            className="bg-[#16161f] border border-[#2a2a3d] rounded-lg px-3 py-2 text-sm text-[#94a3b8] outline-none focus:border-[#4f46e5] transition-colors"
          >
            <option value="">Toutes les régions</option>
            {availableRegions.map((r) => (
              <option key={r} value={r}>{r}</option>
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
                className={`${PILL_BASE} ${filters.duration === d ? PILL_ACTIVE : PILL_INACTIVE}`}
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

        {/* Source */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-widest">Source</label>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => set('source', '')}
              className={`${PILL_BASE} ${filters.source === '' ? PILL_ACTIVE : PILL_INACTIVE}`}
            >
              Toutes
            </button>
            <button
              onClick={() => set('source', 'france_travail')}
              className={`${PILL_BASE} ${filters.source === 'france_travail' ? PILL_ACTIVE : PILL_INACTIVE}`}
            >
              LBA
            </button>
          </div>
        </div>

        {/* Score — visible seulement si CV chargé */}
        {hasScores && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-widest">Score min</label>
            <div className="flex gap-1.5 flex-wrap">
              {SCORE_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => set('minScore', value)}
                  className={`${PILL_BASE} ${filters.minScore === value ? PILL_ACTIVE : PILL_INACTIVE}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date de publication */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-widest">Publiée dans</label>
          <div className="flex gap-1.5 flex-wrap">
            {PUBLISHED_OPTIONS.map(({ label, value }) => (
              <button
                key={value || 'all'}
                onClick={() => set('publishedAfter', value)}
                className={`${PILL_BASE} ${filters.publishedAfter === value ? PILL_ACTIVE : PILL_INACTIVE}`}
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
                  className={`${PILL_BASE} ${filters.selectedTags.includes(tag) ? PILL_ACTIVE : PILL_INACTIVE}`}
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

const SOURCE_LABELS_CHIPS: Record<string, string> = {
  france_travail: 'LBA',
}

export function FilterChips({ filters, onChange, className = '' }: ChipsProps) {
  const chips: { label: string; clear: Filters }[] = []

  if (filters.teletravailOnly)
    chips.push({ label: '🏠 Télétravail', clear: { ...filters, teletravailOnly: false } })
  if (filters.duration)
    chips.push({ label: `${filters.duration} mois`, clear: { ...filters, duration: '' } })
  if (filters.region)
    chips.push({ label: `📍 ${filters.region}`, clear: { ...filters, region: '' } })
  if (filters.source)
    chips.push({ label: SOURCE_LABELS_CHIPS[filters.source] ?? filters.source, clear: { ...filters, source: '' } })
  if (filters.minScore)
    chips.push({ label: `≥ ${filters.minScore}%`, clear: { ...filters, minScore: 0 } })
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
      {chips.map((chip) => (
        <button
          key={chip.label}
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

Attendu : PASS (16 tests verts)

- [ ] **Step 5 : Vérifier les types**

```bash
cd web && npx tsc --noEmit 2>&1 | head -10
```

Attendu : 0 erreur.

- [ ] **Step 6 : Lancer tous les tests**

```bash
cd web && npm run test:ci 2>&1 | tail -15
```

Attendu : tous les tests passent.

- [ ] **Step 7 : Build**

```bash
cd web && npm run build 2>&1 | tail -10
```

Attendu : build réussi.

- [ ] **Step 8 : Commit**

```bash
git add web/components/FilterSidebar.tsx web/__tests__/components/FilterSidebar.test.tsx
git commit -m "feat(web): add region/source/score filters to FilterSidebar, update FilterChips"
```

- [ ] **Step 9 : Push + PR**

```bash
git push origin develop
gh pr create --title "feat: phase 9 — filtres région, source, score" \
  --body "$(cat <<'EOF'
## Phase 9 — Filtres enrichis

### Changements
- Filtre **région** (13 régions métropolitaines + Autre) remplace le filtre ville exacte
- Filtre **source** : Toutes / LBA (france_travail)
- Filtre **score minimum** : Tous / 40%+ / 70%+ (visible uniquement si CV chargé)
- `matchScores` remonté de OffersGrid → OffersLayout pour permettre le filtrage par score

### Fichiers
- `web/lib/regions.ts` (nouveau) — 150+ villes françaises mappées aux 13 régions
- `web/lib/filters.ts` — type Filters enrichi, applyFilters gère région + source
- `web/components/OffersLayout.tsx` — remonte matchScores, applique minScore
- `web/components/OffersGrid.tsx` — reçoit matchScores en prop
- `web/components/FilterSidebar.tsx` — sections région, source, score + FilterChips mis à jour
EOF
)"
```
