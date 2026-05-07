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
      <div className="glass border-b border-white/8 px-8 py-4 flex flex-wrap gap-3 items-center">
        <div className="flex rounded-xl overflow-hidden border border-indigo-500/50 shadow-[0_0_0_3px_rgba(99,102,241,0.1)] flex-1 min-w-[260px] max-w-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Rechercher titre, entreprise, ville…"
            className="flex-1 px-4 py-2.5 bg-white/5 text-white/90 placeholder-white/25 outline-none text-sm"
          />
          <button
            className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 text-sm font-semibold transition-colors"
            onClick={() => setPage(1)}
            aria-label="Lancer la recherche"
          >
            🔍
          </button>
        </div>

        <button
          onClick={() => { setTeletravailOnly(!teletravailOnly); setPage(1) }}
          className={`px-3 py-2 rounded-full text-sm border transition-all ${
            teletravailOnly
              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-medium'
              : 'bg-white/5 border-white/10 text-white/45 hover:border-white/25'
          }`}
        >
          🏠 Télétravail
        </button>

        <select
          value={duration}
          onChange={(e) => { setDuration(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-full text-sm bg-white/5 border border-white/10 text-white/45 outline-none"
        >
          <option value="">Durée : toutes</option>
          {allDurations.map((d) => (
            <option key={d} value={d}>{d} mois</option>
          ))}
        </select>

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border transition-all ${
            showAdvanced || activeAdvancedCount > 0
              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
              : 'bg-white/5 border-white/10 text-white/45 hover:border-white/25'
          }`}
        >
          ⚙ Filtres
          {activeAdvancedCount > 0 && (
            <span className="bg-indigo-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {activeAdvancedCount}
            </span>
          )}
          <span className="text-xs">{showAdvanced ? '▲' : '▼'}</span>
        </button>

        <button
          onClick={() => exportCsv(filtered)}
          className="text-sm text-white/40 border border-white/10 hover:border-indigo-500/40 hover:text-indigo-300 px-3 py-2 rounded-full transition-all"
          title="Exporter les offres filtrées en CSV"
        >
          ⬇ CSV
        </button>

        <button
          onClick={resetFilters}
          className="ml-auto text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          Réinitialiser
        </button>
      </div>

      {/* Panneau filtres avancés */}
      {showAdvanced && (
        <div className="glass border-b border-white/8 px-8 py-5 flex flex-col gap-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-location" className="text-xs text-white/35 uppercase tracking-widest">Localisation</label>
              <select
                id="filter-location"
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white/65 outline-none min-w-[180px]"
              >
                <option value="">Toutes les villes</option>
                {allLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/35 uppercase tracking-widest">Date de publication</label>
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
                    className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                      publishedAfter === value
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-medium'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/25'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/35 uppercase tracking-widest">
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
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-medium'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/25 hover:text-white/65'
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
        <p className="text-xs text-white/30">
          {filtered.length} offre{filtered.length !== 1 ? 's' : ''} {filtered.length !== offers.length ? `sur ${offers.length}` : ''}
        </p>
      </div>

      {/* Grille */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        {paginated.length === 0 ? (
          <p className="text-white/40 text-center py-16">
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
              className="w-9 h-9 rounded-xl glass text-white/45 disabled:opacity-30 hover:border-indigo-500/40 text-sm transition-all"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-xl text-sm transition-all ${
                  n === safePage
                    ? 'bg-indigo-500 text-white font-semibold border border-indigo-400'
                    : 'glass text-white/45 hover:border-indigo-500/40'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-9 h-9 rounded-xl glass text-white/45 disabled:opacity-30 hover:border-indigo-500/40 text-sm transition-all"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
