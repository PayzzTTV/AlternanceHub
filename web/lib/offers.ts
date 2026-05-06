import { createSupabaseServerClient } from '@/lib/supabase'
import type { Offer } from '@/types/offer'

export async function getOffers(): Promise<Offer[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('is_active', true)
    .order('scraped_at', { ascending: false })

  if (error) {
    console.error('getOffers error:', error.message)
    return []
  }

  return (data as Offer[]) ?? []
}
