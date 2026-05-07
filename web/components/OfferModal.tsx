'use client'

import { useEffect } from 'react'
import type { Offer } from '@/types/offer'

type Insight = { strengths: string[]; gaps: string[] }

type Props = {
  offer: Offer
  matchScore?: number
  insight?: Insight
  onClose: () => void
}

function matchColor(score: number) {
  if (score >= 70) return { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'Excellent match' }
  if (score >= 40) return { bar: 'bg-amber-500', text: 'text-amber-400', label: 'Match partiel' }
  return { bar: 'bg-slate-500', text: 'text-slate-400', label: 'Match faible' }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function OfferModal({ offer, matchScore, insight, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const colors = matchScore !== undefined ? matchColor(matchScore) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1E293B] border-b border-[#334155] px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-100 leading-snug">{offer.title}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{offer.company}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Score de matching */}
          {matchScore !== undefined && colors && (
            <div className="bg-[#0F172A] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-100">Score de matching</span>
                <span className={`text-2xl font-bold ${colors.text}`}>{matchScore}%</span>
              </div>
              <div className="w-full bg-[#334155] rounded-full h-2">
                <div
                  className={`${colors.bar} h-2 rounded-full transition-all`}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
              <p className={`text-xs font-medium ${colors.text}`}>{colors.label}</p>

              {insight && (
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {insight.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 mb-1.5">✓ Tes forces</p>
                      <div className="flex flex-wrap gap-1">
                        {insight.strengths.map((s) => (
                          <span key={s} className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.gaps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-400 mb-1.5">△ À renforcer</p>
                      <div className="flex flex-wrap gap-1">
                        {insight.gaps.map((g) => (
                          <span key={g} className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Infos */}
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            {offer.location && <span>📍 {offer.location}</span>}
            {offer.duration && <span>⏱ {offer.duration} mois</span>}
            {offer.salary && <span>💶 {offer.salary}</span>}
            <span>💼 {offer.contract_type}</span>
          </div>

          {/* Tags */}
          {offer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {offer.tags.map((tag) => (
                <span key={tag} className="text-xs bg-[#1E3A5F] text-[#93C5FD] px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {offer.description && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</p>
              <div
                className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap prose-sm"
                dangerouslySetInnerHTML={{ __html: offer.description.replace(/<[^>]*>/g, '\n').replace(/\n{3,}/g, '\n\n').trim() }}
              />
            </div>
          )}

          {/* Compétences souhaitées */}
          {offer.desired_skills && offer.desired_skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Compétences souhaitées</p>
              <div className="flex flex-wrap gap-1.5">
                {offer.desired_skills.map((s) => (
                  <span key={s} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Date + source */}
          <p className="text-xs text-slate-500">
            {offer.published_at
              ? `Publié le ${formatDate(offer.published_at)}`
              : `Indexé le ${formatDate(offer.scraped_at)}`}
            {' · '}
            {offer.source === 'france_travail' ? 'La Bonne Alternance' : 'France Travail API'}
          </p>
        </div>

        {/* Footer sticky */}
        <div className="sticky bottom-0 bg-[#1E293B] border-t border-[#334155] px-6 py-4">
          <a
            href={offer.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Postuler sur le site officiel →
          </a>
        </div>
      </div>
    </div>
  )
}
