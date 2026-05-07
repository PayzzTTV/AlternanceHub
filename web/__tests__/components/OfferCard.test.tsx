import { render, screen } from '@testing-library/react'
import OfferCard from '@/components/OfferCard'
import type { Offer } from '@/types/offer'

jest.mock('@/lib/applications', () => ({
  addApplication: jest.fn(),
}))

const mockOffer: Offer = {
  id: '1',
  hash: 'abc123',
  title: 'Analyste SOC Junior',
  company: 'DINUM',
  location: 'Paris 75007',
  contract_type: 'alternance',
  duration: '12',
  salary: null,
  tags: ['cybersécurité', 'alternance'],
  source: 'france_travail',
  source_url: 'https://example.com/offre/1',
  published_at: '2024-07-23T00:00:00Z',
  scraped_at: '2024-07-24T00:00:00Z',
  is_active: true,
}

describe('OfferCard', () => {
  it('renders title and company', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByText('Analyste SOC Junior')).toBeInTheDocument()
    expect(screen.getByText('DINUM')).toBeInTheDocument()
  })

  it('renders location and duration', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByText(/Paris 75007/)).toBeInTheDocument()
    expect(screen.getByText(/12 mois/)).toBeInTheDocument()
  })

  it('renders tags as badges', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByText('cybersécurité')).toBeInTheDocument()
  })

  it('CTA ouvre le modal offre', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByRole('button', { name: /voir l/i })).toBeInTheDocument()
  })

  it('affiche le bouton Suivre', () => {
    render(<OfferCard offer={mockOffer} />)
    expect(screen.getByRole('button', { name: /⭐ Suivre/i })).toBeInTheDocument()
  })
})
