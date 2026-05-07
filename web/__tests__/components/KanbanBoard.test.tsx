import { render, screen } from '@testing-library/react'
import KanbanBoard from '@/components/KanbanBoard'
import type { Application } from '@/types/application'

// Mock @dnd-kit (pas de DOM DnD dans jsdom)
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: jest.fn(),
  PointerSensor: class {},
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
}))
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: jest.fn(),
}))
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: jest.fn(() => '') } },
}))

// Mock ApplicationCard pour isoler KanbanBoard
jest.mock('@/components/ApplicationCard', () => ({
  __esModule: true,
  default: ({ application }: { application: Application }) => (
    <div data-testid={`card-${application.id}`}>{application.title}</div>
  ),
}))

// Mock Server Actions
jest.mock('@/lib/applications', () => ({
  updateStatus: jest.fn(),
}))

const apps: Application[] = [
  {
    id: '1', offer_id: null, title: 'Offre A', company: 'Corp A',
    source_url: null, status: 'interested', notes: null, follow_up_date: null,
    created_at: '2026-05-06T10:00:00Z', updated_at: '2026-05-06T10:00:00Z',
  },
  {
    id: '2', offer_id: null, title: 'Offre B', company: 'Corp B',
    source_url: null, status: 'applied', notes: null, follow_up_date: null,
    created_at: '2026-05-06T10:00:00Z', updated_at: '2026-05-06T10:00:00Z',
  },
  {
    id: '3', offer_id: null, title: 'Offre C', company: 'Corp C',
    source_url: null, status: 'accepted', notes: null, follow_up_date: null,
    created_at: '2026-05-06T10:00:00Z', updated_at: '2026-05-06T10:00:00Z',
  },
  {
    id: '4', offer_id: null, title: 'Offre D', company: 'Corp D',
    source_url: null, status: 'rejected', notes: null, follow_up_date: null,
    created_at: '2026-05-06T10:00:00Z', updated_at: '2026-05-06T10:00:00Z',
  },
]

describe('KanbanBoard', () => {
  it('affiche les 5 colonnes', () => {
    render(<KanbanBoard initialApplications={apps} />)
    expect(screen.getByText('Intéressé')).toBeInTheDocument()
    expect(screen.getByText('Postulé')).toBeInTheDocument()
    expect(screen.getByText('Relancé')).toBeInTheDocument()
    expect(screen.getByText('Entretien')).toBeInTheDocument()
    expect(screen.getByText('Terminé')).toBeInTheDocument()
  })

  it('place les cartes dans la bonne colonne', () => {
    render(<KanbanBoard initialApplications={apps} />)
    expect(screen.getByTestId('card-1')).toBeInTheDocument()
    expect(screen.getByTestId('card-2')).toBeInTheDocument()
  })

  it('affiche les sections Accepté et Refusé dans Terminé', () => {
    render(<KanbanBoard initialApplications={apps} />)
    expect(screen.getByText('✅ Accepté')).toBeInTheDocument()
    expect(screen.getByText('❌ Refusé')).toBeInTheDocument()
  })
})
