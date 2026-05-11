import { applyFilters, defaultFilters } from '@/lib/filters'
import type { Offer } from '@/types/offer'

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

describe('applyFilters', () => {
  it('retourne toutes les offres avec les filtres par défaut', () => {
    const offers = [makeOffer(), makeOffer()]
    expect(applyFilters(offers, defaultFilters)).toHaveLength(2)
  })

  it('filtre par query sur le titre (insensible à la casse)', () => {
    const offers = [makeOffer({ title: 'Analyste SOC' }), makeOffer({ title: 'Développeur Python' })]
    expect(applyFilters(offers, { ...defaultFilters, query: 'soc' })).toHaveLength(1)
    expect(applyFilters(offers, { ...defaultFilters, query: 'soc' })[0].title).toBe('Analyste SOC')
  })

  it('filtre par query sur le nom de l\'entreprise', () => {
    const offers = [makeOffer({ company: 'Thales' }), makeOffer({ company: 'DINUM' })]
    expect(applyFilters(offers, { ...defaultFilters, query: 'thales' })).toHaveLength(1)
  })

  it('filtre par query sur la localisation', () => {
    const offers = [makeOffer({ location: 'Lyon' }), makeOffer({ location: 'Paris' })]
    expect(applyFilters(offers, { ...defaultFilters, query: 'lyon' })).toHaveLength(1)
  })

  it('filtre télétravail uniquement', () => {
    const offers = [
      makeOffer({ tags: ['Télétravail', 'cybersécurité'] }),
      makeOffer({ tags: ['cybersécurité'] }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, teletravailOnly: true })).toHaveLength(1)
  })

  it('filtre par durée', () => {
    const offers = [makeOffer({ duration: '12' }), makeOffer({ duration: '24' })]
    expect(applyFilters(offers, { ...defaultFilters, duration: '12' })).toHaveLength(1)
  })

  it('exclut les offres avec duration null si filtre durée actif', () => {
    const offer = makeOffer({ duration: null })
    expect(applyFilters([offer], { ...defaultFilters, duration: '12' })).toHaveLength(0)
  })

  it('filtre par région — Île-de-France inclut Paris', () => {
    const offers = [
      makeOffer({ location: 'Paris' }),
      makeOffer({ location: 'Lyon' }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, region: 'Île-de-France' })).toHaveLength(1)
  })

  it('filtre par région Autre — villes inconnues uniquement', () => {
    const offers = [
      makeOffer({ location: 'Atlantis' }),
      makeOffer({ location: 'Paris' }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, region: 'Autre' })).toHaveLength(1)
  })

  it('filtre par source', () => {
    const offers = [
      makeOffer({ source: 'france_travail' }),
      makeOffer({ source: 'hellowork' }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, source: 'france_travail' })).toHaveLength(1)
  })

  it('filtre par tags — tous les tags sélectionnés doivent être présents', () => {
    const offers = [
      makeOffer({ tags: ['SOC', 'SIEM', 'cybersécurité'] }),
      makeOffer({ tags: ['SOC', 'cybersécurité'] }),
    ]
    expect(applyFilters(offers, { ...defaultFilters, selectedTags: ['SOC', 'SIEM'] })).toHaveLength(1)
  })

  it('combine plusieurs filtres', () => {
    const offers = [
      makeOffer({ title: 'SOC', location: 'Paris', duration: '12', tags: ['Télétravail'] }),
      makeOffer({ title: 'SOC', location: 'Lyon', duration: '12', tags: [] }),
    ]
    const result = applyFilters(offers, { ...defaultFilters, region: 'Île-de-France', teletravailOnly: true })
    expect(result).toHaveLength(1)
    expect(result[0].location).toBe('Paris')
  })

  describe('publishedAfter', () => {
    it('exclut les offres publiées trop tôt', () => {
      const recent = makeOffer({ published_at: new Date().toISOString() })
      const old = makeOffer({
        published_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      })
      expect(applyFilters([recent, old], { ...defaultFilters, publishedAfter: '30' })).toHaveLength(1)
    })

    it('exclut les offres sans published_at quand publishedAfter est actif', () => {
      const offer = makeOffer({ published_at: null })
      expect(applyFilters([offer], { ...defaultFilters, publishedAfter: '7' })).toHaveLength(0)
    })
  })
})
