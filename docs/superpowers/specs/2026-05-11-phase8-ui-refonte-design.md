# Phase 8 — Refonte UI/UX AlternanceHub

**Date :** 2026-05-11
**Statut :** Approuvé

---

## Contexte

Les phases 1–7 sont livrées. Le frontend dispose déjà d'un design glassmorphism sombre (indigo, `#080810`, classes `.glass`/`.glass-strong`). La Phase 8 remplace ce design par un flat dark soigné (style Linear/Vercel) et restructure la page d'accueil en layout sidebar + liste.

---

## Décisions design

| Axe | Choix retenu |
|-----|-------------|
| Style visuel | Flat dark (Linear/Vercel) — fini le blur/glass |
| Layout homepage | Sidebar filtres fixe (240px) + liste principale |
| Cards d'offres | Pleines avec tags, flat dark |
| Mobile | Chips scrollables horizontaux pour les filtres actifs |
| Stratégie d'implémentation | Couche par couche (layout → cards → mobile) |

---

## Tokens CSS

**Remplacements dans `globals.css` :**

| Ancien | Nouveau |
|--------|---------|
| `#080810` fond global | `#0a0a0f` |
| `.glass` (bg rgba+blur) | Supprimé |
| `.glass-strong` (bg rgba+blur) | Supprimé |
| Borders `rgba(255,255,255,0.08)` | `#1e1e2e` |
| Cards bg `rgba(255,255,255,0.05)` | `#16161f` |
| Fond page filtres | `#0f0f17` |
| Accent | `#6366f1` (indigo-500) conservé |

**Nouvelles classes utilitaires CSS :**
```css
.surface   { background: #16161f; border: 1px solid #1e1e2e; }
.surface-2 { background: #0f0f17; border: 1px solid #2a2a3d; }
```

---

## Architecture des fichiers

### Nouveaux fichiers
- `web/components/FilterSidebar.tsx` — sidebar desktop + export `FilterChips`
- `web/components/OffersLayout.tsx` — Client Component propriétaire du state filtres

### Fichiers modifiés
- `web/app/globals.css` — tokens flat dark, suppression `.glass`/`.glass-strong`
- `web/app/page.tsx` — délègue le layout à `OffersLayout`
- `web/app/suivi/page.tsx` — navbar cohérente (couleurs flat dark)
- `web/components/OffersGrid.tsx` — reçoit `offers` déjà filtrées, ne gère plus que grille + pagination + matchScores
- `web/components/OfferCard.tsx` — tokens flat dark

### Fichiers non touchés
`OfferModal`, `KanbanBoard`, `ApplicationCard`, `ApplicationModal`, `CVUploader`, `FollowButton`, `NavUser`, `StatsBar`, `lib/`, `types/` — aucune modification fonctionnelle.

---

## Layout desktop (`page.tsx` + `OffersLayout.tsx`)

`page.tsx` reste un **Server Component** — il ne peut pas tenir de `useState`. Le state de filtres est déplacé dans un nouveau Client Component `OffersLayout.tsx`.

**`page.tsx` (Server Component, inchangé dans sa logique) :**
```tsx
// Rend la navbar + passe offers au client layout
export default async function HomePage() {
  const offers = await getOffers()
  return (
    <>
      <nav ...>{/* navbar */}</nav>
      <OffersLayout offers={offers} />   {/* Client Component */}
    </>
  )
}
```

**Nouveau fichier `web/components/OffersLayout.tsx` (Client Component) :**
```tsx
'use client'
// Propriétaire du state filters
// Rend FilterSidebar + OffersGrid côte à côte
export default function OffersLayout({ offers }: { offers: Offer[] }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const filteredOffers = useMemo(() => applyFilters(offers, filters), [offers, filters])

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        offers={offers}              // pour calculer les villes/tags disponibles
        className="hidden md:flex"
      />
      <main className="flex-1 overflow-y-auto">
        <FilterChips
          filters={filters}
          onChange={setFilters}
          className="md:hidden"
        />
        <OffersGrid
          offers={filteredOffers}
        />
      </main>
    </div>
  )
}
```

**`OffersGrid.tsx` après refactoring :** reçoit `offers` déjà filtrées + `matchScores`. Ne gère plus que la grille et la pagination. State `matchScores` reste dans `OffersGrid` (écoute `match-scores-updated`).

---

## `FilterSidebar.tsx`

**Desktop (flex-col, w-60, border-r border-[#1e1e2e]) :**

```
┌──────────────────────┐
│ Filtres   [Réinit.]  │  ← header sticky
├──────────────────────┤
│ 🔍 Rechercher…       │  ← input
├──────────────────────┤
│ LOCALISATION         │
│ [select villes]      │
├──────────────────────┤
│ DURÉE                │
│ [Toutes][6][12][24]  │  ← radio pills
├──────────────────────┤
│ 🏠 Télétravail  [⬜] │  ← toggle switch
├──────────────────────┤
│ DATE DE PUBLICATION  │
│ [Tout][7j][30j][3m]  │  ← radio pills
├──────────────────────┤
│ TAGS                 │
│ [soc][pentest][siem] │  ← cliquables, max 8
└──────────────────────┘
```

**Export secondaire `FilterChips` (mobile, `md:hidden`) :**
- Affiche uniquement les filtres **actifs** en chips `[label ×]`
- Scroll horizontal natif
- Bouton "⚙ Filtres ▾" à droite ouvre le panneau accordion (logique `showAdvanced` existante)

---

## `OfferCard.tsx` — changements

**Tokens uniquement — structure inchangée :**

| Propriété | Avant | Après |
|-----------|-------|-------|
| Fond card | `bg-white/[0.07]` | `bg-[#16161f]` |
| Bordure | `border-white/8` | `border-[#1e1e2e]` |
| Hover bordure | `hover:border-indigo-500/40` | `hover:border-[#4f46e5]` |
| Tags génériques bg | `bg-white/5` | `bg-[#16161f]` |
| Tags génériques border | `border-white/8` | `border-[#2a2a3d]` |
| Tags cybersec bg | `bg-indigo-500/15` | `bg-[#1e1e2e]` |
| Tags cybersec border | `border-indigo-500/25` | `border-[#312e81]` |
| Score vert bg | `bg-emerald-500/20` | `bg-[#14532d]` |
| Score amber bg | `bg-amber-500/20` | `bg-[#1c1917]` |
| Texte titre | `text-white/90` | `text-[#e2e8f0]` |
| Texte secondaire | `text-white/45` | `text-[#475569]` |
| Texte muted | `text-white/30` | `text-[#334155]` |

Bouton "Voir l'offre" : `bg-indigo-500` conservé (seul CTA coloré).

---

## Mobile (`< md`)

**Navbar :** logo + badge offres + lien "Suivi". Lien "Connexion" → icône `👤` sur mobile.

**FilterChips (sous search bar, visible si filtres actifs) :**
```
[🏠 Télétravail ×]  [📍 Paris ×]  [⚙ Filtres ▾]
─────────────────────────────────────── scroll →
```

**Panneau accordion :** tap sur "⚙ Filtres ▾" déplie les filtres complets sous la search bar (même logique que `showAdvanced` actuel, restyled flat dark).

---

## Tests

Les tests existants (`OfferCard.test.tsx`, `OffersGrid.test.tsx`, `KanbanBoard.test.tsx`, etc.) doivent continuer à passer — les changements sont CSS uniquement pour les cards.

Nouveaux tests à écrire :
- `FilterSidebar.test.tsx` — rendu des sections, toggle filtres, callback `onChange`
- `FilterChips.test.tsx` — affichage uniquement si filtres actifs, suppression d'un chip
- `OffersLayout.test.tsx` — state filtres, filtrage mémoïsé, passage props à enfants

---

## Animations

Transitions `transition-colors duration-150` sur hover des cards et chips. Pas d'animations complexes — performance mobile prioritaire.

---

## Checklist d'implémentation

- [ ] Tokens CSS flat dark dans `globals.css`, suppression `.glass`/`.glass-strong`
- [ ] `FilterSidebar.tsx` — desktop sidebar + export `FilterChips`
- [ ] `OffersLayout.tsx` — Client Component, state filtres, `applyFilters`, layout 2 colonnes
- [ ] Tests `FilterSidebar`, `FilterChips`, `OffersLayout`
- [ ] Refactoring `OffersGrid` — reçoit `offers` filtrées en props, garde `matchScores` en interne
- [ ] Mise à jour `page.tsx` — délègue à `<OffersLayout offers={offers} />`
- [ ] Refonte tokens `OfferCard.tsx`
- [ ] Navbar mobile responsive (`suivi/page.tsx` + `page.tsx`)
- [ ] Vérification `npx tsc --noEmit` + `npm run lint`
- [ ] Tests complets `npm run test:ci`
- [ ] Build `npm run build`
