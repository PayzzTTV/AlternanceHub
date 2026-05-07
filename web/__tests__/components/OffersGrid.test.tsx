import { render, screen, fireEvent } from '@testing-library/react'
import OffersGrid from '@/components/OffersGrid'
import type { Offer } from '@/types/offer'

jest.mock('@/lib/applications', () => ({
  addApplication: jest.fn(),
}))

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: Math.random().toString(),
    hash: Math.random().toString(),
    title: 'Analyste SOC',
    company: 'DINUM',
    location: 'Paris',
    contract_type: 'alternance',
    duration: '12',
    salary: null,
    tags: ['cybersécurité', 'alternance'],
    source: 'france_travail',
    source_url: 'https://example.com',
    published_at: null,
    scraped_at: new Date().toISOString(),
    is_active: true,
    ...overrides,
  }
}

describe('OffersGrid', () => {
  it('renders all offers when no filter applied', () => {
    const offers = [makeOffer({ title: 'Offre A' }), makeOffer({ title: 'Offre B' })]
    render(<OffersGrid offers={offers} />)
    expect(screen.getByText('Offre A')).toBeInTheDocument()
    expect(screen.getByText('Offre B')).toBeInTheDocument()
  })

  it('filters by search query on title', () => {
    const offers = [
      makeOffer({ title: 'Analyste SOC' }),
      makeOffer({ title: 'Développeur Python' }),
    ]
    render(<OffersGrid offers={offers} />)
    fireEvent.change(screen.getByPlaceholderText(/Rechercher/i), {
      target: { value: 'SOC' },
    })
    expect(screen.getByText('Analyste SOC')).toBeInTheDocument()
    expect(screen.queryByText('Développeur Python')).not.toBeInTheDocument()
  })

  it('filters by company name', () => {
    const offers = [
      makeOffer({ company: 'Capgemini' }),
      makeOffer({ company: 'Thales' }),
    ]
    render(<OffersGrid offers={offers} />)
    fireEvent.change(screen.getByPlaceholderText(/Rechercher/i), {
      target: { value: 'Thales' },
    })
    expect(screen.queryByText('Capgemini')).not.toBeInTheDocument()
  })

  it('shows empty message when no results match', () => {
    render(<OffersGrid offers={[makeOffer({ title: 'Analyste SOC' })]} />)
    fireEvent.change(screen.getByPlaceholderText(/Rechercher/i), {
      target: { value: 'xyznotfound' },
    })
    expect(screen.getByText(/Aucune offre/i)).toBeInTheDocument()
  })

  it('filters by télétravail tag', () => {
    const offers = [
      makeOffer({ title: 'Remote', tags: ['cybersécurité', 'Télétravail'] }),
      makeOffer({ title: 'Onsite', tags: ['cybersécurité'] }),
    ]
    render(<OffersGrid offers={offers} />)
    fireEvent.click(screen.getByRole('button', { name: /Télétravail/i }))
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.queryByText('Onsite')).not.toBeInTheDocument()
  })

  it('filtre par localisation', () => {
    const offers = [
      makeOffer({ title: 'Paris job', location: 'Paris' }),
      makeOffer({ title: 'Lyon job', location: 'Lyon' }),
    ]
    render(<OffersGrid offers={offers} />)
    fireEvent.click(screen.getByRole('button', { name: /Filtres/i }))
    fireEvent.change(screen.getByRole('combobox', { name: /Localisation/i }), {
      target: { value: 'Paris' },
    })
    expect(screen.getByText('Paris job')).toBeInTheDocument()
    expect(screen.queryByText('Lyon job')).not.toBeInTheDocument()
  })

  it('filtre par tag (intersection)', () => {
    const offers = [
      makeOffer({ title: 'SOC job', tags: ['SOC', 'SIEM'] }),
      makeOffer({ title: 'Pentest job', tags: ['Pentest'] }),
    ]
    render(<OffersGrid offers={offers} />)
    fireEvent.click(screen.getByRole('button', { name: /Filtres/i }))
    fireEvent.click(screen.getByRole('button', { name: 'SOC' }))
    expect(screen.getByText('SOC job')).toBeInTheDocument()
    expect(screen.queryByText('Pentest job')).not.toBeInTheDocument()
  })

  it('affiche le compteur de filtres actifs sur le bouton', () => {
    const offers = [makeOffer({ location: 'Paris' })]
    render(<OffersGrid offers={offers} />)
    fireEvent.click(screen.getByRole('button', { name: /Filtres/i }))
    fireEvent.change(screen.getByRole('combobox', { name: /Localisation/i }), {
      target: { value: 'Paris' },
    })
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
