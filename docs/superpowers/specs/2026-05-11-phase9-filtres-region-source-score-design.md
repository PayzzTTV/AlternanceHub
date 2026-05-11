# Phase 9 — Filtres : Région, Source, Score

**Date :** 2026-05-11
**Statut :** Approuvé

---

## Contexte

Phase 8 livrée : sidebar filtres flat dark, `FilterSidebar`, `OffersLayout`, `applyFilters`. Phase 9 enrichit les filtres avec 3 nouvelles dimensions et remplace le filtre "ville exacte" par un filtre "région".

---

## Nouveaux filtres

| Filtre | Avant | Après |
|--------|-------|-------|
| Localisation | Select ville exacte (`location: string`) | Select région (`region: string`) |
| Source | — | Pills Toutes / LBA (`source: string`) |
| Score minimum | — | Pills Tous / 40%+ / 70%+ (`minScore: number`) |

---

## Architecture

### Nouveaux fichiers
- `web/lib/regions.ts` — table `CITY_TO_REGION` (~200 villes françaises → 13 régions métropolitaines), helper `cityToRegion(city: string | null): string | null`, constante `REGIONS: string[]`

### Fichiers modifiés
- `web/lib/filters.ts` — retire `location`, ajoute `region`, `source`, `minScore` dans `Filters` ; `applyFilters` gère région + source (minScore géré en dehors)
- `web/components/OffersLayout.tsx` — remonte `matchScores` (depuis OffersGrid), applique filtre `minScore` après `applyFilters`, passe `matchScores` à OffersGrid et `hasScores` à FilterSidebar
- `web/components/OffersGrid.tsx` — reçoit `matchScores: Record<string, number>` en prop au lieu de le calculer lui-même
- `web/components/FilterSidebar.tsx` — remplace select ville par select région, ajoute pills source + score (conditionnel à `hasScores`), met à jour FilterChips

### Fichiers non touchés
`OfferCard`, `KanbanBoard`, `page.tsx`, `suivi/page.tsx`, `lib/offers.ts`, `types/offer.ts`

---

## Type `Filters` après modification

```typescript
export type Filters = {
  query: string
  teletravailOnly: boolean
  duration: string
  region: string        // '' = toutes, 'Île-de-France', ..., 'Autre'
  source: string        // '' = toutes, 'france_travail'
  minScore: number      // 0 = tous, 40, 70
  selectedTags: string[]
  publishedAfter: '' | '7' | '30' | '90'
}
```

---

## Logique de filtrage

### Région dans `applyFilters`
```typescript
const matchesRegion = !filters.region || (() => {
  const r = cityToRegion(o.location)
  return filters.region === 'Autre' ? r === null : r === filters.region
})()
```

### minScore dans `OffersLayout` (hors `applyFilters`)
```typescript
const filteredOffers = useMemo(() => applyFilters(offers, filters), [offers, filters])
const scoredOffers = filters.minScore === 0
  ? filteredOffers
  : filteredOffers.filter((o) => (matchScores[o.id] ?? 0) >= filters.minScore)
```

---

## FilterSidebar — nouvelles sections

- **Région** : select dérivé des régions présentes dans les offres (`cityToRegion` sur chaque offre)
- **Source** : pills "Toutes" / "LBA" (valeur `france_travail`)
- **Score** : pills "Tous" / "40%+" / "70%+" — affiché uniquement si `hasScores === true`

---

## Tests

- `web/__tests__/lib/regions.test.ts` (nouveau) — ville connue, ville inconnue, null, casse
- `web/__tests__/lib/filters.test.ts` — remplace test `location` par `region`, ajoute `source`
- `web/__tests__/components/FilterSidebar.test.tsx` — met à jour section localisation → région, ajoute source + score
- `web/__tests__/components/OffersGrid.test.tsx` — `matchScores` devient prop
- `web/__tests__/components/OffersLayout.test.tsx` — vérifie que `matchScores` est passé à OffersGrid
