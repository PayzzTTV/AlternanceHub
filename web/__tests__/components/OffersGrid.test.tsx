import { render, screen } from '@testing-library/react'
import OffersGrid from '@/components/OffersGrid'
import type { Offer } from '@/types/offer'

jest.mock('@/components/OfferCard', () => ({
  __esModule: true,
  default: ({ offer }: { offer: Offer }) => (
    <div data-testid={`card-${offer.id}`}>{offer.title}</div>
  ),
}))

jest.mock('@/lib/applications', () => ({
  addApplication: jest.fn(),
}))

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: Math.random().toString(), hash: '', title: 'Analyste SOC', company: 'DINUM',
    location: 'Paris', contract_type: 'alternance', duration: '12', salary: null,
    tags: [], source: 'france_travail', source_url: 'https://example.com',
    published_at: null, scraped_at: new Date().toISOString(), is_active: true, ...overrides,
  }
}

describe('OffersGrid', () => {
  it('rend toutes les offres passées en props', () => {
    const offers = [
      makeOffer({ id: '1', title: 'Offre A' }),
      makeOffer({ id: '2', title: 'Offre B' }),
    ]
    render(<OffersGrid offers={offers} matchScores={{}} />)
    expect(screen.getByText('Offre A')).toBeInTheDocument()
    expect(screen.getByText('Offre B')).toBeInTheDocument()
  })

  it("affiche l'état vide quand aucune offre", () => {
    render(<OffersGrid offers={[]} matchScores={{}} />)
    expect(screen.getByText(/aucune offre/i)).toBeInTheDocument()
  })

  it("affiche le nombre d'offres", () => {
    render(<OffersGrid offers={[makeOffer(), makeOffer()]} matchScores={{}} />)
    expect(screen.getByText(/2 offres/)).toBeInTheDocument()
  })

  it('affiche le bouton CSV', () => {
    render(<OffersGrid offers={[makeOffer()]} matchScores={{}} />)
    expect(screen.getByText(/csv/i)).toBeInTheDocument()
  })
})
