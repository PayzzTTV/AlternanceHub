export type ApplicationStatus =
  | 'interested'
  | 'applied'
  | 'followed_up'
  | 'interview'
  | 'accepted'
  | 'rejected'

export type Application = {
  id: string
  offer_id: string | null
  title: string
  company: string
  source_url: string | null
  status: ApplicationStatus
  notes: string | null
  follow_up_date: string | null
  created_at: string
  updated_at: string
}
