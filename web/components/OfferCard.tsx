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
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function matchBadge(score: number): string {
  if (score >= 70) return 'bg-[#14532d] border border-[#166534] text-[#4ade80]'
  if (score >= 40) return 'bg-[#1c1917] border border-[#44403c] text-[#d97706]'
  return 'bg-[#1e1e2e] border border-[#334155] text-[#475569]'
}

export default function OfferCard({ offer, matchScore }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const insight = getMatchInsights()[offer.id]

  return (
    <>
      <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-5 flex flex-col gap-3 hover:border-[#4f46e5] transition-colors duration-150 cursor-default">
        <div className="flex justify-between items-start gap-2">
          <div className="cursor-pointer" onClick={() => setModalOpen(true)}>
            <h3 className="text-base font-semibold text-[#e2e8f0] leading-snug hover:text-[#818cf8] transition-colors">
              {offer.title}
            </h3>
            <p className="text-sm text-[#475569] mt-0.5">{offer.company}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {matchScore !== undefined && (
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${matchBadge(matchScore)}`}>
                {matchScore}%
              </span>
            )}
            <span className="bg-[#1e1e2e] text-[#818cf8] border border-[#312e81] text-xs font-medium px-2 py-1 rounded-lg">
              {offer.source === 'france_travail' ? 'LBA' : offer.source}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-[#475569]">
          {offer.location && <span>📍 {offer.location}</span>}
          {offer.duration && <span>⏱ {offer.duration} mois</span>}
          <span>💼 {offer.contract_type}</span>
        </div>

        {offer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {offer.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2 py-0.5 rounded-lg bg-[#16161f] text-[#475569] border border-[#2a2a3d]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs text-[#334155]">
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
              className="bg-[#4f46e5] hover:bg-[#6366f1] text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
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
