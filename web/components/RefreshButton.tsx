'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RefreshButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    router.refresh()
    // router.refresh() est synchrone côté client — on attend un peu
    // pour que l'animation soit visible
    setTimeout(() => setLoading(false), 1200)
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors text-sm"
      aria-label="Actualiser les offres"
    >
      <span
        className={loading ? 'animate-spin inline-block' : 'inline-block'}
        style={{ display: 'inline-block' }}
      >
        ↻
      </span>
      {loading ? 'Actualisation…' : 'Actualiser'}
    </button>
  )
}
