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
