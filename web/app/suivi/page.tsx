import { getApplications } from '@/lib/applications'
import KanbanBoard from '@/components/KanbanBoard'
import NavUser from '@/components/NavUser'
import CVUploader from '@/components/CVUploader'
import { createSupabaseServerClient } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SuiviPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const applications = await getApplications()

  const total = applications.length
  const interviews = applications.filter((a) => a.status === 'interview').length
  const urgent = applications.filter((a) => {
    if (!a.follow_up_date) return false
    const diff = new Date(a.follow_up_date).getTime() - Date.now()
    return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000
  }).length

  return (
    <>
      <nav className="glass-strong border-b border-white/8 px-8 h-14 flex items-center justify-between sticky top-0 z-20">
        <Link href="/" className="text-lg font-bold text-white/90 tracking-tight">
          Alternance<span className="text-indigo-400">Hub</span>
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/" className="text-white/50 hover:text-white/90 transition-colors">
            Offres
          </Link>
          <Link href="/suivi" className="text-indigo-400 font-semibold">
            Suivi
          </Link>
          {user && <NavUser email={user.email ?? ''} />}
        </div>
      </nav>

      <div className="px-8 py-8">
        <h1 className="text-3xl font-bold text-white/90 mb-1 tracking-tight">Tableau de suivi</h1>
        <p className="text-sm text-white/40 mb-6">
          Glisse les cartes entre colonnes pour changer leur statut
        </p>

        <div className="flex gap-3 mb-6">
          <div className="glass rounded-2xl px-5 py-3">
            <span className="text-2xl font-bold text-white/90">{total}</span>
            <span className="text-xs text-white/40 ml-2">Total</span>
          </div>
          <div className="glass rounded-2xl px-5 py-3">
            <span className="text-2xl font-bold text-emerald-400">{interviews}</span>
            <span className="text-xs text-white/40 ml-2">Entretiens</span>
          </div>
          {urgent > 0 && (
            <div className="glass rounded-2xl px-5 py-3">
              <span className="text-2xl font-bold text-amber-400">{urgent}</span>
              <span className="text-xs text-white/40 ml-2">Relances urgentes</span>
            </div>
          )}
        </div>

        <div className="mb-6 max-w-sm">
          <CVUploader />
        </div>

        <KanbanBoard initialApplications={applications} />
      </div>
    </>
  )
}
