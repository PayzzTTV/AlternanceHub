import {
  getApplications,
  addApplication,
  updateStatus,
  updateDetails,
  removeApplication,
} from '@/lib/applications'
import { createSupabaseServerClient } from '@/lib/supabase'
import type { Application } from '@/types/application'

jest.mock('@/lib/supabase')
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const mockedClient = createSupabaseServerClient as jest.MockedFunction<
  typeof createSupabaseServerClient
>

const fakeApp: Application = {
  id: 'app-1',
  offer_id: 'offer-1',
  title: 'Alternant SOC',
  company: 'Thales',
  source_url: 'https://example.com',
  status: 'interested',
  notes: null,
  follow_up_date: null,
  created_at: '2026-05-06T10:00:00Z',
  updated_at: '2026-05-06T10:00:00Z',
}

// --- getApplications ---

function buildSelectMock(result: { data: unknown; error: unknown }) {
  const order = jest.fn().mockResolvedValue(result)
  const select = jest.fn().mockReturnValue({ order })
  const from = jest.fn().mockReturnValue({ select })
  return { from, select, order }
}

describe('getApplications', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns array on success', async () => {
    const mocks = buildSelectMock({ data: [fakeApp], error: null })
    mockedClient.mockResolvedValue(mocks as never)
    const result = await getApplications()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Alternant SOC')
  })

  it('returns empty array on error', async () => {
    const mocks = buildSelectMock({ data: null, error: { message: 'fail' } })
    mockedClient.mockResolvedValue(mocks as never)
    const result = await getApplications()
    expect(result).toEqual([])
  })

  it('orders by created_at descending', async () => {
    const mocks = buildSelectMock({ data: [], error: null })
    mockedClient.mockResolvedValue(mocks as never)
    await getApplications()
    expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})

// --- addApplication ---

function buildInsertMock(result = { error: null }) {
  const insert = jest.fn().mockResolvedValue(result)
  const from = jest.fn().mockReturnValue({ insert })
  return { from, insert }
}

describe('addApplication', () => {
  beforeEach(() => jest.clearAllMocks())

  it('inserts with status interested', async () => {
    const mocks = buildInsertMock()
    mockedClient.mockResolvedValue(mocks as never)
    await addApplication({
      id: 'offer-1',
      title: 'Alternant SOC',
      company: 'Thales',
      source_url: 'https://example.com',
    })
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'interested', title: 'Alternant SOC' })
    )
  })
})

// --- updateStatus ---

function buildUpdateMock(result = { error: null }) {
  const eq = jest.fn().mockResolvedValue(result)
  const update = jest.fn().mockReturnValue({ eq })
  const from = jest.fn().mockReturnValue({ update })
  return { from, update, eq }
}

describe('updateStatus', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls update with new status', async () => {
    const mocks = buildUpdateMock()
    mockedClient.mockResolvedValue(mocks as never)
    await updateStatus('app-1', 'applied')
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'applied' })
    )
    expect(mocks.eq).toHaveBeenCalledWith('id', 'app-1')
  })
})

// --- updateDetails ---

describe('updateDetails', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls update with provided fields', async () => {
    const mocks = buildUpdateMock()
    mockedClient.mockResolvedValue(mocks as never)
    await updateDetails('app-1', { notes: 'Note test', follow_up_date: '2026-05-10' })
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'Note test', follow_up_date: '2026-05-10' })
    )
    expect(mocks.eq).toHaveBeenCalledWith('id', 'app-1')
  })
})

// --- removeApplication ---

function buildDeleteMock(result = { error: null }) {
  const eq = jest.fn().mockResolvedValue(result)
  const del = jest.fn().mockReturnValue({ eq })
  const from = jest.fn().mockReturnValue({ delete: del })
  return { from, delete: del, eq }
}

describe('removeApplication', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls delete with correct id', async () => {
    const mocks = buildDeleteMock()
    mockedClient.mockResolvedValue(mocks as never)
    await removeApplication('app-1')
    expect(mocks.eq).toHaveBeenCalledWith('id', 'app-1')
  })
})
