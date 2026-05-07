import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApplicationCard from '@/components/ApplicationCard'
import type { Application } from '@/types/application'

// ApplicationModal est testé séparément — on le mock ici
jest.mock('@/components/ApplicationModal', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="modal">
      <button onClick={onClose}>Fermer</button>
    </div>
  ),
}))

const base: Application = {
  id: 'app-1',
  offer_id: 'offer-1',
  title: 'Alternant SOC',
  company: 'Thales',
  source_url: 'https://example.com/offre',
  status: 'interested',
  notes: null,
  follow_up_date: null,
  created_at: '2026-05-06T10:00:00Z',
  updated_at: '2026-05-06T10:00:00Z',
}

const onDelete = jest.fn()
const onUpdate = jest.fn()

describe('ApplicationCard', () => {
  it('affiche le titre et la company', () => {
    render(<ApplicationCard application={base} onDelete={onDelete} onUpdate={onUpdate} />)
    expect(screen.getByText('Alternant SOC')).toBeInTheDocument()
    expect(screen.getByText('Thales')).toBeInTheDocument()
  })

  it("affiche la note quand elle est présente", () => {
    render(<ApplicationCard application={{ ...base, notes: 'Ma note de test' }} onDelete={onDelete} onUpdate={onUpdate} />)
    expect(screen.getByText('Ma note de test')).toBeInTheDocument()
  })

  it('affiche le lien vers l\'offre', () => {
    render(<ApplicationCard application={base} onDelete={onDelete} onUpdate={onUpdate} />)
    const link = screen.getByRole('link', { name: /voir l/i })
    expect(link).toHaveAttribute('href', 'https://example.com/offre')
  })

  it('la date de relance est orange si dans les 3 jours', () => {
    render(<ApplicationCard application={{ ...base, follow_up_date: '2026-05-08' }} onDelete={onDelete} onUpdate={onUpdate} />)
    const dateEl = screen.getByText(/2026-05-08/)
    expect(dateEl).toHaveClass('text-amber-400')
  })

  it('la date de relance est grise si plus de 3 jours', () => {
    render(<ApplicationCard application={{ ...base, follow_up_date: '2026-06-01' }} onDelete={onDelete} onUpdate={onUpdate} />)
    const dateEl = screen.getByText(/2026-06-01/)
    expect(dateEl).toHaveClass('text-slate-500')
  })

  it('ouvre la modale au clic sur ✏️', async () => {
    render(<ApplicationCard application={base} onDelete={onDelete} onUpdate={onUpdate} />)
    await userEvent.click(screen.getByRole('button', { name: /✏️/i }))
    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })
})
