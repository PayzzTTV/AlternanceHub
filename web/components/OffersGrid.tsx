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
