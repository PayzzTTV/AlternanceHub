'use client'

import type { Application } from '@/types/application'

type Props = {
  application: Application
  onClose: () => void
}

export default function ApplicationModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 w-full max-w-md">
        <button onClick={onClose}>Fermer</button>
      </div>
    </div>
  )
}
