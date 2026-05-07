import Link from 'next/link'
import { getOffers } from '@/lib/offers'
import StatsBar from '@/components/StatsBar'
import OffersGrid from '@/components/OffersGrid'

export const revalidate = 21600 // 6 heures

export default async function HomePage() {
  const offers = await getOffers()
  const lastScrapedAt = offers[0]?.scraped_at ?? null

  return (
    <>
      {/* Navbar */}
      <nav className="bg-[#1E293B] border-b border-[#334155] px-8 h-14 flex items-center justify-between sticky top-0 z-10">
        <span className="text-lg font-bold text-slate-100">
          Alternance<span className="text-blue-500">Hub</span>
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/suivi"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Suivi
          </Link>
          <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {offers.length} offres
          </span>
        </div>
      </nav>

      {/* Hero */}
      <div
        className="border-b border-[#334155] px-8 py-12 text-center"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)' }}
      >
        <h1 className="text-4xl font-bold text-slate-100 mb-3 leading-tight">
          Trouve ton alternance en{' '}
          <span className="text-blue-500">cybersécurité</span>
        </h1>
        <p className="text-slate-400 text-base">
          Toutes les offres agrégées depuis France Travail &amp; La Bonne Alternance
        </p>
      </div>

      {/* Stats */}
      <StatsBar count={offers.length} scrapedAt={lastScrapedAt} />

      {/* Grid filtrable */}
      <OffersGrid offers={offers} />

      {/* Footer */}
      <footer className="border-t border-[#334155] px-8 py-5 text-center text-sm text-slate-500 mt-8">
        AlternanceHub · Open source · Données issues de{' '}
        <a
          href="https://labonnealternance.apprentissage.beta.gouv.fr"
          className="text-blue-400 hover:underline"
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
