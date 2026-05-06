import type { Offer } from '@/types/offer'

type Props = { offer: Offer }

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
    month: 'short',
    year: 'numeric',
  })
}

export default function OfferCard({ offer }: Props) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow flex flex-col gap-3 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100 leading-snug">
            {offer.title}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">{offer.company}</p>
        </div>
        <span className="bg-[#1E3A5F] text-[#93C5FD] text-xs font-medium px-2 py-1 rounded shrink-0">
          {offer.source === 'france_travail' ? 'LBA' : offer.source}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
        {offer.location && <span>📍 {offer.location}</span>}
        {offer.duration && <span>⏱ {offer.duration} mois</span>}
        <span>💼 {offer.contract_type}</span>
      </div>

      {offer.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {offer.tags.map((tag) => (
            <span
              key={tag}
              className={`text-xs font-medium px-2 py-0.5 rounded ${tagStyle(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-slate-500">
          {offer.published_at
            ? `Publié le ${formatDate(offer.published_at)}`
            : `Indexé le ${formatDate(offer.scraped_at)}`}
        </span>
        <a
          href={offer.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          Voir l&apos;offre →
        </a>
      </div>
    </div>
  )
}
