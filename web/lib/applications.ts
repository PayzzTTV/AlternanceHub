'use server'

import { createSupabaseServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import type { Application, ApplicationStatus } from '@/types/application'

export async function getApplications(): Promise<Application[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Application[]
}

export async function addApplication(offer: {
  id: string
  title: string
  company: string
  source_url: string | null
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('applications').insert({
    offer_id: offer.id,
    title: offer.title,
    company: offer.company,
    source_url: offer.source_url,
    status: 'interested',
    user_id: user.id,
  })
  revalidatePath('/suivi')
}

export async function updateStatus(
  id: string,
  status: ApplicationStatus
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/suivi')
}

export async function updateDetails(
  id: string,
  data: { notes?: string; follow_up_date?: string; status?: ApplicationStatus }
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase
    .from('applications')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/suivi')
}

export async function removeApplication(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.from('applications').delete().eq('id', id)
  revalidatePath('/suivi')
}
