import { getOffers } from '@/lib/offers'
import { createSupabaseServerClient } from '@/lib/supabase'

jest.mock('@/lib/supabase')

const mockedClient = createSupabaseServerClient as jest.MockedFunction<
  typeof createSupabaseServerClient
>

const fakeOffer = {
  id: '1',
  hash: 'abc',
  title: 'Analyste SOC',
  company: 'DINUM',
  location: 'Paris',
  contract_type: 'alternance',
  duration: '12',
  salary: null,
  tags: ['cybersécurité'],
  source: 'france_travail',
  source_url: 'https://example.com',
  published_at: '2024-07-23T00:00:00Z',
  scraped_at: '2024-07-24T00:00:00Z',
  is_active: true,
}

function buildSupabaseMock(result: { data: unknown; error: unknown }) {
  const order = jest.fn().mockResolvedValue(result)
  const eq = jest.fn().mockReturnValue({ order })
  const select = jest.fn().mockReturnValue({ eq })
  const from = jest.fn().mockReturnValue({ select })
  return { from, select, eq, order }
}

describe('getOffers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns offers array on success', async () => {
    const mocks = buildSupabaseMock({ data: [fakeOffer], error: null })
    mockedClient.mockResolvedValue(mocks as never)

    const result = await getOffers()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Analyste SOC')
  })

  it('returns empty array on Supabase error', async () => {
    const mocks = buildSupabaseMock({ data: null, error: { message: 'DB error' } })
    mockedClient.mockResolvedValue(mocks as never)

    const result = await getOffers()
    expect(result).toEqual([])
  })

  it('queries only active offers', async () => {
    const mocks = buildSupabaseMock({ data: [], error: null })
    mockedClient.mockResolvedValue(mocks as never)

    await getOffers()
    expect(mocks.eq).toHaveBeenCalledWith('is_active', true)
  })
})
