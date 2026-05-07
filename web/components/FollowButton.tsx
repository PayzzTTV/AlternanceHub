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
      <span className="bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-md">
        ✓ Suivi
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="bg-[#1E293B] border border-[#334155] hover:border-blue-500 text-slate-300 hover:text-blue-400 text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
    >
      ⭐ Suivre
    </button>
  )
}
