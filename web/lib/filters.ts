import type { Offer } from '@/types/offer'

export type Filters = {
  query: string
  teletravailOnly: boolean
  duration: string
  location: string
  selectedTags: string[]
  publishedAfter: '' | '7' | '30' | '90'
}

export const defaultFilters: Filters = {
  query: '',
  teletravailOnly: false,
  duration: '',
  location: '',
  selectedTags: [],
  publishedAfter: '',
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export function applyFilters(offers: Offer[], filters: Filters): Offer[] {
  const q = filters.query.toLowerCase()
  const cutoff = filters.publishedAfter ? daysAgo(Number(filters.publishedAfter)) : null

  return offers.filter((o) => {
    const matchesQuery =
      !q ||
      o.title.toLowerCase().includes(q) ||
      o.company.toLowerCase().includes(q) ||
      (o.location ?? '').toLowerCase().includes(q)
    const matchesTeletravail = !filters.teletravailOnly || o.tags.includes('Télétravail')
    const matchesDuration = !filters.duration || o.duration === filters.duration
    const matchesLocation = !filters.location || o.location === filters.location
    const matchesTags =
      filters.selectedTags.length === 0 ||
      filters.selectedTags.every((t) => o.tags.includes(t))
    const matchesDate =
      !cutoff || (o.published_at != null && new Date(o.published_at) >= cutoff)
    return matchesQuery && matchesTeletravail && matchesDuration && matchesLocation && matchesTags && matchesDate
  })
}
