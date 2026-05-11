'use client'

import type { Filters } from '@/lib/filters'
import { defaultFilters } from '@/lib/filters'
import type { Offer } from '@/types/offer'
import { cityToRegion } from '@/lib/regions'

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
  const availableSources = [...new Set(offers.map((o) => o.source))]

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

        {/* Source — visible seulement si plusieurs sources */}
        {availableSources.length > 1 && (
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
        )}

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

export function FilterChips({ filters, onChange, className = '' }: ChipsProps) {
  const chips: { label: string; clear: Filters }[] = []

  if (filters.teletravailOnly)
    chips.push({ label: '🏠 Télétravail', clear: { ...filters, teletravailOnly: false } })
  if (filters.duration)
    chips.push({ label: `${filters.duration} mois`, clear: { ...filters, duration: '' } })
  if (filters.region)
    chips.push({ label: `📍 ${filters.region}`, clear: { ...filters, region: '' } })
  if (filters.source)
    chips.push({ label: filters.source === 'france_travail' ? 'LBA' : filters.source, clear: { ...filters, source: '' } })
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
