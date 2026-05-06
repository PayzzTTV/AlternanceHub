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
    <div className="bg-[#1E293B] border-b border-[#334155] px-8 py-3 flex items-center gap-6 text-sm">
      <span className="font-semibold text-blue-400">{count} offres</span>
      <span className="text-[#334155]">·</span>
      <span className="text-slate-400">Mis à jour {timeAgo(scrapedAt)}</span>
      <span className="text-[#334155]">·</span>
      <span className="text-slate-400">Source : La Bonne Alternance</span>
    </div>
  )
}
