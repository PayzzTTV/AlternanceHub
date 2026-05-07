'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function NavUser({ email }: { email: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40 hidden sm:block">{email}</span>
      <button
        onClick={handleLogout}
        className="text-xs text-white/50 hover:text-white/90 border border-white/10 hover:border-white/25 rounded-xl px-3 py-1.5 transition-all"
      >
        Déconnexion
      </button>
    </div>
  )
}
