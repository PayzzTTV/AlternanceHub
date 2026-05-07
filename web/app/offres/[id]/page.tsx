import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOfferById } from '@/lib/offers'
import FollowButton from '@/components/FollowButton'

export const dynamic = 'force-dynamic'

const TAG_STYLES: Record<string, string> = {
  'cybersécurité': 'bg-[#1E3A5F] text-[#93C5FD]',
  'alternance': 'bg-slate-700 text-slate-300 border border-slate-600',
  'Télétravail': 'bg-[#052e16] text-[#4ADE80]',
  'Apprentissage': 'bg-[#2D2000] text-[#FCD34D]',
  'Professionnalisation': 'bg-[#2D2000] text-[#FCD34D]',
}

function tagStyle(tag: string): string {
  return TAG_STYLES[tag] ?? 'bg-slate-700 text-slate-300'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const offer = await getOfferById(id)
  if (!offer) notFound()

  return (
    <>
      <nav className="bg-[#1E293B] border-b border-[#334155] px-8 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-lg font-bold text-slate-100">
          Alternance<span className="text-blue-500">Hub</span>
        </Link>
        <div className="flex gap-6 text-sm">
          <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">Offres</Link>
          <Link href="/suivi" className="text-slate-400 hover:text-slate-200 transition-colors">Suivi</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 mb-6 inline-block">
          ← Retour aux offres
        </Link>

        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 shadow">
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 leading-snug mb-1">
                {offer.title}
              </h1>
              <p className="text-lg text-slate-400">{offer.company}</p>
            </div>
            <span className="bg-[#1E3A5F] text-[#93C5FD] text-xs font-medium px-2.5 py-1.5 rounded shrink-0">
              {offer.source === 'france_travail' ? 'LBA' : offer.source}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-6 pb-6 border-b border-[#334155]">
            {offer.location && <span>📍 {offer.location}</span>}
            {offer.duration && <span>⏱ {offer.duration} mois</span>}
            <span>💼 {offer.contract_type}</span>
            {offer.salary && <span>💰 {offer.salary}</span>}
            {offer.published_at && (
              <span>📅 Publié le {formatDate(offer.published_at)}</span>
            )}
          </div>

          {offer.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {offer.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs font-medium px-2.5 py-1 rounded ${tagStyle(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <a
              href={offer.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-3 rounded-lg transition-colors text-center"
            >
              Postuler sur le site source →
            </a>
            <FollowButton
              offer={{
                id: offer.id,
                title: offer.title,
                company: offer.company,
                source_url: offer.source_url,
              }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-600 text-center mt-6">
          Indexé le {formatDate(offer.scraped_at)} · ID {offer.id}
        </p>
      </div>
    </>
  )
}
