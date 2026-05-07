'use client'

import { useState } from 'react'
import type { Application } from '@/types/application'
import ApplicationModal from '@/components/ApplicationModal'

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

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 cursor-pointer hover:border-blue-500 transition-colors"
        data-application-id={application.id}
      >
        <p className="text-sm font-semibold text-slate-100 leading-snug mb-0.5">
          {application.title}
        </p>
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
