import { render, screen, fireEvent } from '@testing-library/react'
import FilterSidebar, { FilterChips } from '@/components/FilterSidebar'
import { defaultFilters } from '@/lib/filters'
import type { Offer } from '@/types/offer'

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: Math.random().toString(), hash: '', title: 'Test', company: 'Corp',
    location: 'Paris', contract_type: 'alternance', duration: '12', salary: null,
    tags: ['cybersécurité'], source: 'france_travail', source_url: 'https://example.com',
    published_at: null, scraped_at: new Date().toISOString(), is_active: true, ...overrides,
  }
}

const baseOffers = [makeOffer({ location: 'Paris' }), makeOffer({ location: 'Lyon' })]

describe('FilterSidebar', () => {
  beforeEach(() => jest.clearAllMocks())

  it('affiche le champ de recherche', () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} />)
    expect(screen.getByPlaceholderText(/titre, entreprise/i)).toBeInTheDocument()
  })

  it('affiche les sections Localisation, Durée, Télétravail', () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} />)
    expect(screen.getByText(/localisation/i)).toBeInTheDocument()
    expect(screen.getByText(/durée/i)).toBeInTheDocument()
    expect(screen.getByText(/télétravail/i)).toBeInTheDocument()
  })

  it('appelle onChange quand la query change', () => {
    const onChange = jest.fn()
    render(<FilterSidebar filters={defaultFilters} onChange={onChange} offers={baseOffers} />)
    fireEvent.change(screen.getByPlaceholderText(/titre, entreprise/i), { target: { value: 'SOC' } })
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, query: 'SOC' })
  })

  it('appelle onChange quand le toggle télétravail est cliqué', () => {
    const onChange = jest.fn()
    render(<FilterSidebar filters={defaultFilters} onChange={onChange} offers={baseOffers} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, teletravailOnly: true })
  })

  it("n'affiche pas Réinitialiser si aucun filtre actif", () => {
    render(<FilterSidebar filters={defaultFilters} onChange={jest.fn()} offers={baseOffers} />)
    expect(screen.queryByText('Réinitialiser')).not.toBeInTheDocument()
  })

  it('affiche Réinitialiser si un filtre est actif', () => {
    render(
      <FilterSidebar
        filters={{ ...defaultFilters, query: 'test' }}
        onChange={jest.fn()}
        offers={baseOffers}
      />
    )
    expect(screen.getByText('Réinitialiser')).toBeInTheDocument()
  })

  it('appelle onChange avec defaultFilters quand Réinitialiser est cliqué', () => {
    const onChange = jest.fn()
    render(
      <FilterSidebar
        filters={{ ...defaultFilters, query: 'test', teletravailOnly: true }}
        onChange={onChange}
        offers={baseOffers}
      />
    )
    fireEvent.click(screen.getByText('Réinitialiser'))
    expect(onChange).toHaveBeenCalledWith(defaultFilters)
  })

  it('appelle onChange avec le bon tag quand un tag est cliqué', () => {
    const onChange = jest.fn()
    render(
      <FilterSidebar
        filters={defaultFilters}
        onChange={onChange}
        offers={[makeOffer({ tags: ['SOC'] })]}
      />
    )
    fireEvent.click(screen.getByText('SOC'))
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, selectedTags: ['SOC'] })
  })
})

describe('FilterChips', () => {
  it('ne rend rien quand aucun filtre actif', () => {
    const { container } = render(<FilterChips filters={defaultFilters} onChange={jest.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche un chip pour le filtre télétravail actif', () => {
    render(<FilterChips filters={{ ...defaultFilters, teletravailOnly: true }} onChange={jest.fn()} />)
    expect(screen.getByText(/télétravail/i)).toBeInTheDocument()
  })

  it('affiche un chip pour la durée active', () => {
    render(<FilterChips filters={{ ...defaultFilters, duration: '12' }} onChange={jest.fn()} />)
    expect(screen.getByText(/12 mois/i)).toBeInTheDocument()
  })

  it('appelle onChange pour désactiver le filtre au clic sur le chip', () => {
    const onChange = jest.fn()
    render(<FilterChips filters={{ ...defaultFilters, teletravailOnly: true }} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ teletravailOnly: false }))
  })
})
