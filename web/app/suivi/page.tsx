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
      <nav className="h-14 sticky top-0 z-20 bg-[#0a0a0f] border-b border-[#1e1e2e] px-6 flex items-center justify-between">
        <Link href="/" className="text-base font-bold text-[#e2e8f0] tracking-tight">
          Alternance<span className="text-[#6366f1]">Hub</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-[#475569] hover:text-[#e2e8f0] transition-colors hidden sm:block">
            Offres
          </Link>
          <Link href="/suivi" className="text-[#6366f1] font-semibold">
            Suivi
          </Link>
          {user && <NavUser email={user.email ?? ''} />}
        </div>
      </nav>

      <div className="px-8 py-8">
        <h1 className="text-3xl font-bold text-[#e2e8f0] mb-1 tracking-tight">Tableau de suivi</h1>
        <p className="text-sm text-[#475569] mb-6">
          Glisse les cartes entre colonnes pour changer leur statut
        </p>

        <div className="flex gap-3 mb-6">
          <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl px-5 py-3">
            <span className="text-2xl font-bold text-[#e2e8f0]">{total}</span>
            <span className="text-xs text-[#475569] ml-2">Total</span>
          </div>
          <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl px-5 py-3">
            <span className="text-2xl font-bold text-emerald-400">{interviews}</span>
            <span className="text-xs text-[#475569] ml-2">Entretiens</span>
          </div>
          {urgent > 0 && (
            <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl px-5 py-3">
              <span className="text-2xl font-bold text-amber-400">{urgent}</span>
              <span className="text-xs text-[#475569] ml-2">Relances urgentes</span>
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
