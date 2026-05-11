import Link from 'next/link'
import { getOffers } from '@/lib/offers'
import { createSupabaseServerClient } from '@/lib/supabase'
import NavUser from '@/components/NavUser'
import OffersLayout from '@/components/OffersLayout'

export const revalidate = 21600 // 6 heures

export default async function HomePage() {
  const offers = await getOffers()
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <nav className="h-14 sticky top-0 z-20 bg-[#0a0a0f] border-b border-[#1e1e2e] px-6 flex items-center justify-between">
        <span className="text-base font-bold text-[#e2e8f0] tracking-tight">
          Alternance<span className="text-[#6366f1]">Hub</span>
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/suivi"
            className="text-sm text-[#475569] hover:text-[#e2e8f0] transition-colors hidden sm:block"
          >
            Suivi
          </Link>
          {user ? (
            <NavUser email={user.email ?? ''} />
          ) : (
            <Link
              href="/login"
              className="text-sm text-[#94a3b8] hover:text-[#e2e8f0] border border-[#2a2a3d] hover:border-[#4f46e5] rounded-lg px-3 py-1.5 transition-colors hidden sm:block"
            >
              Connexion
            </Link>
          )}
          <span className="bg-[#1e1e2e] border border-[#312e81] text-[#818cf8] text-xs font-semibold px-3 py-1 rounded-full">
            {offers.length} offres
          </span>
        </div>
      </nav>
      <OffersLayout offers={offers} />
    </>
  )
}
