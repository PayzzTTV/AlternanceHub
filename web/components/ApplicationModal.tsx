'use client'

import { useState } from 'react'
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

export default function ApplicationModal({ application, onClose, onDelete, onUpdate }: Props) {
  const [notes, setNotes] = useState(application.notes ?? '')
  const [followUpDate, setFollowUpDate] = useState(application.follow_up_date ?? '')
  const [status, setStatus] = useState<ApplicationStatus>(application.status)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const updated: Application = {
      ...application,
      notes: notes || null,
      follow_up_date: followUpDate || null,
      status,
      updated_at: new Date().toISOString(),
    }
    onUpdate(updated)
    setSaving(false)
    onClose()
  }

  function handleDelete() {
    onDelete(application.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{application.title}</h2>
            <p className="text-sm text-slate-400">{application.company}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-100"
            >
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-100 resize-none"
              placeholder="CV envoyé via LinkedIn, RH = ..."
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date de relance</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-100"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-[#334155] rounded-md"
          >
            Annuler
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-[#334155]">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Supprimer la candidature
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Confirmer la suppression ?</span>
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 hover:text-red-300 font-medium"
              >
                Oui, supprimer
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-slate-500 hover:text-slate-300"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
