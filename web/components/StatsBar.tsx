import RefreshButton from '@/components/RefreshButton'

type Props = {
  count: number
  scrapedAt: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'récemment'
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "il y a moins d'1h"
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export default function StatsBar({ count, scrapedAt }: Props) {
  return (
    <div className="glass border-b border-white/8 px-8 py-3 flex items-center gap-5 text-sm">
      <span className="font-semibold text-indigo-400">{count} offres</span>
      <span className="text-white/15">·</span>
      <span className="text-white/40">Mis à jour {timeAgo(scrapedAt)}</span>
      <span className="text-white/15">·</span>
      <span className="text-white/40">Source : La Bonne Alternance</span>
      <span className="text-white/15">·</span>
      <RefreshButton />
    </div>
  )
}
