import { render, screen, fireEvent } from '@testing-library/react'
import OffersLayout from '@/components/OffersLayout'
import type { Offer } from '@/types/offer'

// Mocks — on isole OffersLayout de ses enfants
jest.mock('@/components/FilterSidebar', () => ({
  __esModule: true,
  default: ({
    filters,
    onChange,
  }: {
    filters: { query: string }
    onChange: (f: { query: string }) => void
  }) => (
    <div data-testid="filter-sidebar">
      <input
        data-testid="sidebar-query"
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
      />
    </div>
  ),
  FilterChips: () => null,
}))

jest.mock('@/components/OffersGrid', () => ({
  __esModule: true,
  default: ({ offers }: { offers: Offer[] }) => (
    <div data-testid="offers-grid">{offers.length} offres</div>
  ),
}))

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: Math.random().toString(),
    hash: '',
    title: 'Analyste SOC',
    company: 'DINUM',
    location: 'Paris',
    contract_type: 'alternance',
    duration: '12',
    salary: null,
    tags: ['cybersécurité'],
    source: 'france_travail',
    source_url: 'https://example.com',
    published_at: null,
    scraped_at: new Date().toISOString(),
    is_active: true,
    ...overrides,
  }
}

describe('OffersLayout', () => {
  it('rend la sidebar et la grille', () => {
    render(<OffersLayout offers={[makeOffer()]} />)
    expect(screen.getByTestId('filter-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('offers-grid')).toBeInTheDocument()
  })

  it('passe toutes les offres à la grille avec filtres par défaut', () => {
    render(<OffersLayout offers={[makeOffer(), makeOffer()]} />)
    expect(screen.getByText('2 offres')).toBeInTheDocument()
  })

  it('filtre les offres quand la query change dans la sidebar', () => {
    const offers = [
      makeOffer({ title: 'Analyste SOC' }),
      makeOffer({ title: 'Développeur Python' }),
    ]
    render(<OffersLayout offers={offers} />)
    fireEvent.change(screen.getByTestId('sidebar-query'), { target: { value: 'SOC' } })
    expect(screen.getByText('1 offres')).toBeInTheDocument()
  })
})
