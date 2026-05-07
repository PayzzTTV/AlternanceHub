export type Offer = {
  id: string
  hash: string
  title: string
  company: string
  location: string | null
  contract_type: string
  duration: string | null
  salary: string | null
  tags: string[]
  source: string
  source_url: string
  published_at: string | null
  scraped_at: string
  is_active: boolean
  description?: string | null
  desired_skills?: string[] | null
}
