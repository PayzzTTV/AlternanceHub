import Link from 'next/link'
import { getOffers } from '@/lib/offers'
import { createSupabaseServerClient } from '@/lib/supabase'
import StatsBar from '@/components/StatsBar'
import OffersGrid from '@/components/OffersGrid'
import NavUser from '@/components/NavUser'

export const revalidate = 21600 // 6 heures

export default async function HomePage() {
  const offers = await getOffers()
  const lastScrapedAt = offers[0]?.scraped_at ?? null
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      {/* Navbar */}
      <nav className="glass-strong border-b border-white/8 px-8 h-14 flex items-center justify-between sticky top-0 z-20">
        <span className="text-lg font-bold text-white/90 tracking-tight">
          Alternance<span className="text-indigo-400">Hub</span>
        </span>
        <div className="flex items-center gap-5">
          <Link
            href="/suivi"
            className="text-sm text-white/50 hover:text-white/90 transition-colors"
          >
            Suivi
          </Link>
          {user ? (
            <NavUser email={user.email ?? ''} />
          ) : (
            <Link
              href="/login"
              className="text-sm text-white/60 hover:text-white/90 border border-white/10 hover:border-white/25 rounded-xl px-4 py-1.5 transition-all"
            >
              Connexion
            </Link>
          )}
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-3 py-1 rounded-full">
            {offers.length} offres
          </span>
        </div>
      </nav>

      {/* Hero */}
      <div className="px-8 py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <h1 className="relative text-5xl font-bold text-white/90 mb-4 leading-tight tracking-tight">
          Trouve ton alternance en{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
            cybersécurité
          </span>
        </h1>
        <p className="relative text-white/45 text-base max-w-md mx-auto">
          Toutes les offres agrégées depuis France Travail &amp; La Bonne Alternance
        </p>
      </div>

      {/* Stats */}
      <StatsBar count={offers.length} scrapedAt={lastScrapedAt} />

      {/* Grid filtrable */}
      <OffersGrid offers={offers} />

      {/* Footer */}
      <footer className="border-t border-white/8 px-8 py-5 text-center text-sm text-white/30 mt-8">
        AlternanceHub · Open source · Données issues de{' '}
        <a
          href="https://labonnealternance.apprentissage.beta.gouv.fr"
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          La Bonne Alternance
        </a>{' '}
        · Mise à jour toutes les 6h
      </footer>
    </>
  )
}
