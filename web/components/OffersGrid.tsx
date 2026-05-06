'use client'

import { useState, useMemo } from 'react'
import type { Offer } from '@/types/offer'
import OfferCard from '@/components/OfferCard'

const PAGE_SIZE = 12

type Props = { offers: Offer[] }

export default function OffersGrid({ offers }: Props) {
  const [query, setQuery] = useState('')
  const [teletravailOnly, setTeletravailOnly] = useState(false)
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
        !teletravailOnly || o.tags.includes('Télétravail')
      const matchesDuration = !duration || o.duration === duration
      return matchesQuery && matchesTeletravail && matchesDuration
    })
  }, [offers, query, teletravailOnly, duration])

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
            aria-label="Lancer la recherche"
          >
            🔍
          </button>
        </div>

        <button
          onClick={() => { setTeletravailOnly(!teletravailOnly); setPage(1) }}
          className={`px-3 py-2 rounded-full text-sm border transition-colors ${
            teletravailOnly
              ? 'bg-[#1E3A5F] border-blue-500 text-[#93C5FD] font-medium'
              : 'bg-[#0F172A] border-[#334155] text-slate-400 hover:border-blue-500'
          }`}
        >
          🏠 Télétravail
        </button>

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
