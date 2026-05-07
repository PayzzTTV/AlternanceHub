'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Offer } from '@/types/offer'
import OfferCard from '@/components/OfferCard'
import { getMatchScores } from '@/components/CVUploader'

const PAGE_SIZE = 12

function exportCsv(offers: Offer[]) {
  const headers = ['Titre', 'Entreprise', 'Localisation', 'Durée', 'Contrat', 'Tags', 'Source', 'URL', 'Publié le']
  const rows = offers.map((o) => [
    o.title,
    o.company,
    o.location ?? '',
    o.duration ? `${o.duration} mois` : '',
    o.contract_type,
    o.tags.join(' | '),
    o.source,
    o.source_url,
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

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

type Props = { offers: Offer[] }

export default function OffersGrid({ offers }: Props) {
  const [query, setQuery] = useState('')
  const [teletravailOnly, setTeletravailOnly] = useState(false)
  const [duration, setDuration] = useState('')
  const [location, setLocation] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [publishedAfter, setPublishedAfter] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [matchScores, setMatchScores] = useState<Record<string, number>>({})

  useEffect(() => {
    setMatchScores(getMatchScores())
    const handler = () => setMatchScores(getMatchScores())
    window.addEventListener('match-scores-updated', handler)
    return () => window.removeEventListener('match-scores-updated', handler)
  }, [])
  const [page, setPage] = useState(1)

  // Options dynamiques depuis les données
  const allLocations = useMemo(() => {
    const locs = offers.map((o) => o.location).filter(Boolean) as string[]
    return [...new Set(locs)].sort()
  }, [offers])

  const allDurations = useMemo(() => {
    const durs = offers.map((o) => o.duration).filter(Boolean) as string[]
    return [...new Set(durs)].sort((a, b) => Number(a) - Number(b))
  }, [offers])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    offers.forEach((o) => o.tags.forEach((t) => tagSet.add(t)))
    return [...tagSet].sort()
  }, [offers])

  const activeAdvancedCount = [
    location !== '',
    selectedTags.length > 0,
    publishedAfter !== '',
  ].filter(Boolean).length

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const cutoff = publishedAfter
      ? publishedAfter === '7' ? daysAgo(7)
      : publishedAfter === '30' ? daysAgo(30)
      : publishedAfter === '90' ? daysAgo(90)
      : null
      : null

    return offers.filter((o) => {
      const matchesQuery =
        !q ||
        o.title.toLowerCase().includes(q) ||
        o.company.toLowerCase().includes(q) ||
        (o.location ?? '').toLowerCase().includes(q)
      const matchesTeletravail = !teletravailOnly || o.tags.includes('Télétravail')
      const matchesDuration = !duration || o.duration === duration
      const matchesLocation = !location || o.location === location
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((t) => o.tags.includes(t))
      const matchesDate =
        !cutoff ||
        (o.published_at != null && new Date(o.published_at) >= cutoff)

      return matchesQuery && matchesTeletravail && matchesDuration && matchesLocation && matchesTags && matchesDate
    })
  }, [offers, query, teletravailOnly, duration, location, selectedTags, publishedAfter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function resetFilters() {
    setQuery('')
    setTeletravailOnly(false)
    setDuration('')
    setLocation('')
    setSelectedTags([])
    setPublishedAfter('')
    setPage(1)
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
    setPage(1)
  }

  return (
    <div>
      {/* Barre principale */}
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
          {allDurations.map((d) => (
            <option key={d} value={d}>{d} mois</option>
          ))}
        </select>

        {/* Bouton filtres avancés */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border transition-colors ${
            showAdvanced || activeAdvancedCount > 0
              ? 'bg-[#1E3A5F] border-blue-500 text-[#93C5FD]'
              : 'bg-[#0F172A] border-[#334155] text-slate-400 hover:border-blue-500'
          }`}
        >
          ⚙ Filtres
          {activeAdvancedCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {activeAdvancedCount}
            </span>
          )}
          <span className="text-xs">{showAdvanced ? '▲' : '▼'}</span>
        </button>

        <button
          onClick={() => exportCsv(filtered)}
          className="text-sm text-slate-400 border border-[#334155] hover:border-blue-500 hover:text-blue-400 px-3 py-2 rounded-full transition-colors"
          title="Exporter les offres filtrées en CSV"
        >
          ⬇ CSV
        </button>

        <button
          onClick={resetFilters}
          className="ml-auto text-sm text-slate-500 underline hover:text-slate-300"
        >
          Réinitialiser
        </button>
      </div>

      {/* Panneau filtres avancés */}
      {showAdvanced && (
        <div className="bg-[#0F172A] border-b border-[#334155] px-8 py-5 flex flex-col gap-5">
          {/* Localisation + Date */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-location" className="text-xs text-slate-500 uppercase tracking-wide">Localisation</label>
              <select
                id="filter-location"
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg text-sm bg-[#1E293B] border border-[#334155] text-slate-300 outline-none min-w-[180px]"
              >
                <option value="">Toutes les villes</option>
                {allLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wide">Date de publication</label>
              <div className="flex gap-2">
                {[
                  { label: 'Tout', value: '' },
                  { label: '7 derniers jours', value: '7' },
                  { label: '30 jours', value: '30' },
                  { label: '3 mois', value: '90' },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => { setPublishedAfter(value); setPage(1) }}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      publishedAfter === value
                        ? 'bg-[#1E3A5F] border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#1E293B] border-[#334155] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-500 uppercase tracking-wide">
                Compétences / Tags
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => { setSelectedTags([]); setPage(1) }}
                    className="ml-2 text-red-400 hover:text-red-300 normal-case"
                  >
                    (effacer)
                  </button>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-[#1E3A5F] border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#1E293B] border-[#334155] text-slate-400 hover:border-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compteur résultats */}
      <div className="max-w-7xl mx-auto px-8 pt-5 pb-1">
        <p className="text-xs text-slate-500">
          {filtered.length} offre{filtered.length !== 1 ? 's' : ''} {filtered.length !== offers.length ? `sur ${offers.length}` : ''}
        </p>
      </div>

      {/* Grille */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        {paginated.length === 0 ? (
          <p className="text-slate-400 text-center py-16">
            Aucune offre ne correspond à ta recherche.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((offer) => (
              <OfferCard
                  key={offer.id}
                  offer={offer}
                  matchScore={matchScores[offer.id]}
                />
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
