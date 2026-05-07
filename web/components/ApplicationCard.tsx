'use client'

import { useState, useEffect } from 'react'
import type { Application } from '@/types/application'
import ApplicationModal from '@/components/ApplicationModal'
import { getMatchScores } from '@/components/CVUploader'

type Props = {
  application: Application
  onDelete: (id: string) => void
  onUpdate: (app: Application) => void
}

function isUrgent(dateStr: string | null): boolean {
  if (!dateStr) return false
  const diff = new Date(dateStr).getTime() - Date.now()
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000
}

export default function ApplicationCard({ application, onDelete, onUpdate }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [matchScore, setMatchScore] = useState<number | undefined>(undefined)

  useEffect(() => {
    const update = () => {
      if (application.offer_id) {
        const scores = getMatchScores()
        setMatchScore(scores[application.offer_id])
      }
    }
    update()
    window.addEventListener('match-scores-updated', update)
    return () => window.removeEventListener('match-scores-updated', update)
  }, [application.offer_id])

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 cursor-pointer hover:border-blue-500 transition-colors"
        data-application-id={application.id}
      >
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-100 leading-snug">{application.title}</p>
          {matchScore !== undefined && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
              matchScore >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
              matchScore >= 40 ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-700 text-slate-400'
            }`}>{matchScore}%</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-2">{application.company}</p>

        {application.notes && (
          <p className="text-xs text-slate-500 bg-[#1E293B] rounded p-1.5 mb-2 line-clamp-2">
            {application.notes}
          </p>
        )}

        {application.follow_up_date && (
          <p
            className={`text-xs mb-2 ${
              isUrgent(application.follow_up_date)
                ? 'text-amber-400'
                : 'text-slate-500'
            }`}
          >
            ⏰ {application.follow_up_date}
          </p>
        )}

        {application.source_url && (
          <div className="mt-1">
            <a
              href={application.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-400 hover:underline"
            >
              ↗ Voir l&apos;offre
            </a>
          </div>
        )}
      </div>

      {modalOpen && (
        <ApplicationModal
          application={application}
          onClose={() => setModalOpen(false)}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}
