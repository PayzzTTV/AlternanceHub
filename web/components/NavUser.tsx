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
      <span className="text-xs text-slate-400 hidden sm:block">{email}</span>
      <button
        onClick={handleLogout}
        className="text-xs text-slate-400 hover:text-slate-200 border border-[#334155] hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors"
      >
        Déconnexion
      </button>
    </div>
  )
}
