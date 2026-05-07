'use client'

import { useState } from 'react'
import type { Offer } from '@/types/offer'
import FollowButton from '@/components/FollowButton'
import OfferModal from '@/components/OfferModal'
import { getMatchInsights } from '@/components/CVUploader'

type Props = { offer: Offer; matchScore?: number }

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function matchColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  if (score >= 40) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  return 'bg-white/5 text-white/40 border border-white/10'
}

export default function OfferCard({ offer, matchScore }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const insight = getMatchInsights()[offer.id]

  return (
    <>
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 hover:border-indigo-500/40 hover:bg-white/[0.07] transition-all duration-200 cursor-default">
      <div className="flex justify-between items-start gap-2">
        <div className="cursor-pointer" onClick={() => setModalOpen(true)}>
          <h3 className="text-base font-semibold text-white/90 leading-snug hover:text-indigo-300 transition-colors">
            {offer.title}
          </h3>
          <p className="text-sm text-white/45 mt-0.5">{offer.company}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {matchScore !== undefined && (
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${matchColor(matchScore)}`}>
              {matchScore}%
            </span>
          )}
          <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-xs font-medium px-2 py-1 rounded-lg">
            {offer.source === 'france_travail' ? 'LBA' : offer.source}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-white/45">
        {offer.location && <span>📍 {offer.location}</span>}
        {offer.duration && <span>⏱ {offer.duration} mois</span>}
        <span>💼 {offer.contract_type}</span>
      </div>

      {offer.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {offer.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2 py-0.5 rounded-lg bg-white/5 text-white/55 border border-white/8"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs text-white/30">
          {offer.published_at
            ? `Publié le ${formatDate(offer.published_at)}`
            : `Indexé le ${formatDate(offer.scraped_at)}`}
        </span>
        <div className="flex items-center gap-2">
          <FollowButton
            offer={{
              id: offer.id,
              title: offer.title,
              company: offer.company,
              source_url: offer.source_url,
            }}
          />
          <button
            onClick={() => setModalOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium px-3 py-1.5 rounded-xl transition-colors"
          >
            Voir l&apos;offre →
          </button>
        </div>
      </div>
    </div>

    {modalOpen && (
      <OfferModal
        offer={offer}
        matchScore={matchScore}
        insight={insight}
        onClose={() => setModalOpen(false)}
      />
    )}
    </>
  )
}
