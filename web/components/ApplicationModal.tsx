'use client'

import { useState, useEffect } from 'react'
import CalendarPicker from '@/components/CalendarPicker'
import type { Application, ApplicationStatus } from '@/types/application'

type Props = {
  application: Application
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (app: Application) => void
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: 'Intéressé',
  applied: 'Postulé',
  followed_up: 'Relancé',
  interview: 'Entretien',
  accepted: 'Accepté',
  rejected: 'Refusé',
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  interested: 'border-slate-500 text-slate-300',
  applied: 'border-blue-500 text-blue-300',
  followed_up: 'border-amber-500 text-amber-300',
  interview: 'border-emerald-500 text-emerald-300',
  accepted: 'border-emerald-400 text-emerald-200',
  rejected: 'border-red-500 text-red-300',
}

export default function ApplicationModal({ application, onClose, onDelete, onUpdate }: Props) {
  const [notes, setNotes] = useState(application.notes ?? '')
  const [followUpDate, setFollowUpDate] = useState(application.follow_up_date ?? '')
  const [status, setStatus] = useState<ApplicationStatus>(application.status)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [visible, setVisible] = useState(false)

  // Slide-in au montage
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  function handleSave() {
    const updated: Application = {
      ...application,
      notes: notes || null,
      follow_up_date: followUpDate || null,
      status,
      updated_at: new Date().toISOString(),
    }
    onUpdate(updated)
    close()
  }

  function handleDelete() {
    onDelete(application.id)
    close()
  }

  function formatDateFR(ymd: string): string {
    if (!ymd) return ''
    const [y, m, d] = ymd.split('-')
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#0F172A] border-l border-[#334155] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#334155]">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-100 truncate">{application.title}</h2>
            <p className="text-sm text-slate-400 truncate">{application.company}</p>
          </div>
          <button
            onClick={close}
            className="ml-3 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-[#1E293B] transition-colors text-lg"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

          {/* Statut — pills */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Statut</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors text-left ${
                    status === s
                      ? `${STATUS_COLORS[s]} bg-[#1E293B]`
                      : 'border-[#334155] text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-[#1E293B] border border-[#334155] focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm text-slate-100 resize-none outline-none transition-colors placeholder-slate-600"
              placeholder="CV envoyé via LinkedIn, contact RH = …"
            />
          </div>

          {/* Calendrier date de relance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Date de relance</p>
              {followUpDate && (
                <span className="text-xs text-amber-400 font-medium">
                  ⏰ {formatDateFR(followUpDate)}
                </span>
              )}
            </div>
            <CalendarPicker value={followUpDate} onChange={setFollowUpDate} />
          </div>

          {/* Lien offre */}
          {application.source_url && (
            <a
              href={application.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              ↗ Voir l&apos;offre originale
            </a>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-[#334155] flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              Enregistrer
            </button>
            <button
              onClick={close}
              className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 border border-[#334155] rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-400 hover:text-red-300 text-left transition-colors"
            >
              Supprimer la candidature
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Confirmer ?</span>
              <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-300 font-semibold">
                Oui, supprimer
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-slate-500 hover:text-slate-300">
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
