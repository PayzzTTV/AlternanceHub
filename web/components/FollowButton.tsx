'use client'

import { useState } from 'react'
import { addApplication } from '@/lib/applications'

type Props = {
  offer: {
    id: string
    title: string
    company: string
    source_url: string | null
  }
}

export default function FollowButton({ offer }: Props) {
  const [followed, setFollowed] = useState(false)

  async function handleClick() {
    setFollowed(true)
    await addApplication(offer)
  }

  if (followed) {
    return (
      <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-medium px-3 py-1.5 rounded-xl">
        ✓ Suivi
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="glass border-white/10 hover:border-indigo-500/40 hover:text-indigo-300 text-white/50 text-sm font-medium px-3 py-1.5 rounded-xl transition-all"
    >
      ⭐ Suivre
    </button>
  )
}
