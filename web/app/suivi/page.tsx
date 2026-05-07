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
      <nav className="bg-[#1E293B] border-b border-[#334155] px-8 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-lg font-bold text-slate-100">
          Alternance<span className="text-blue-500">Hub</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
            Offres
          </Link>
          <Link href="/suivi" className="text-blue-500 font-semibold">
            Suivi
          </Link>
          {user && <NavUser email={user.email ?? ''} />}
        </div>
      </nav>

      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Tableau de suivi</h1>
        <p className="text-sm text-slate-400 mb-5">
          Glisse les cartes entre colonnes pour changer leur statut
        </p>

        <div className="flex gap-3 mb-6">
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5">
            <span className="text-xl font-bold text-slate-100">{total}</span>
            <span className="text-xs text-slate-400 ml-2">Total</span>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5">
            <span className="text-xl font-bold text-emerald-400">{interviews}</span>
            <span className="text-xs text-slate-400 ml-2">Entretiens</span>
          </div>
          {urgent > 0 && (
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5">
              <span className="text-xl font-bold text-amber-400">{urgent}</span>
              <span className="text-xs text-slate-400 ml-2">Relances urgentes</span>
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
