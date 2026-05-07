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

export async function getOfferById(id: string): Promise<Offer | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Offer
}
