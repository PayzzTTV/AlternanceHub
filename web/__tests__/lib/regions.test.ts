import { cityToRegion, REGIONS } from '@/lib/regions'

describe('cityToRegion', () => {
  it('retourne la région pour une ville connue', () => {
    expect(cityToRegion('Paris')).toBe('Île-de-France')
    expect(cityToRegion('Lyon')).toBe('Auvergne-Rhône-Alpes')
    expect(cityToRegion('Marseille')).toBe("Provence-Alpes-Côte d'Azur")
  })

  it('est insensible à la casse', () => {
    expect(cityToRegion('paris')).toBe('Île-de-France')
    expect(cityToRegion('LYON')).toBe('Auvergne-Rhône-Alpes')
  })

  it('gère les variantes avec arrondissement — Paris 1er, Lyon 3e', () => {
    expect(cityToRegion('Paris 1er')).toBe('Île-de-France')
    expect(cityToRegion('Paris 75008')).toBe('Île-de-France')
    expect(cityToRegion('Lyon 3e')).toBe('Auvergne-Rhône-Alpes')
    expect(cityToRegion('Marseille 13')).toBe("Provence-Alpes-Côte d'Azur")
  })

  it('retourne null pour une ville inconnue', () => {
    expect(cityToRegion('Atlantis')).toBeNull()
    expect(cityToRegion('VilleInconnue')).toBeNull()
  })

  it('retourne null pour null', () => {
    expect(cityToRegion(null)).toBeNull()
  })
})

describe('REGIONS', () => {
  it('contient les 13 régions métropolitaines', () => {
    expect(REGIONS).toHaveLength(13)
    expect(REGIONS).toContain('Île-de-France')
    expect(REGIONS).toContain("Provence-Alpes-Côte d'Azur")
    expect(REGIONS).toContain('Auvergne-Rhône-Alpes')
  })

  it('est trié alphabétiquement (locale fr)', () => {
    const sorted = [...REGIONS].sort((a, b) => a.localeCompare(b, 'fr'))
    expect(REGIONS).toEqual(sorted)
  })
})
