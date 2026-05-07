'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateStatus, updateDetails, removeApplication } from '@/lib/applications'
import ApplicationCard from '@/components/ApplicationCard'
import type { Application, ApplicationStatus } from '@/types/application'

type Props = { initialApplications: Application[] }

type ColumnDef = {
  id: ApplicationStatus | 'done'
  label: string
  color: string
}

const COLUMNS: ColumnDef[] = [
  { id: 'interested', label: 'Intéressé', color: 'border-slate-500' },
  { id: 'applied', label: 'Postulé', color: 'border-blue-500' },
  { id: 'followed_up', label: 'Relancé', color: 'border-amber-500' },
  { id: 'interview', label: 'Entretien', color: 'border-emerald-500' },
  { id: 'done', label: 'Terminé', color: 'border-slate-600' },
]

function SortableCard({
  application,
  onDelete,
  onUpdate,
}: {
  application: Application
  onDelete: (id: string) => void
  onUpdate: (app: Application) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: application.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCard application={application} onDelete={onDelete} onUpdate={onUpdate} />
    </div>
  )
}

function DroppableColumn({
  col,
  items,
  acceptedItems,
  rejectedItems,
  onDelete,
  onUpdate,
}: {
  col: ColumnDef
  items: Application[]
  acceptedItems: Application[]
  rejectedItems: Application[]
  onDelete: (id: string) => void
  onUpdate: (app: Application) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  const totalCount = col.id === 'done' ? acceptedItems.length + rejectedItems.length : items.length

  return (
    <div
      className={`min-w-[220px] flex-1 bg-[#1E293B] border border-[#334155] rounded-xl flex flex-col border-t-[3px] ${col.color} transition-colors ${isOver && col.id !== 'done' ? 'border-blue-400 bg-[#1e2f47]' : ''}`}
    >
      <div className="px-3 py-3 border-b border-[#334155] flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          {col.label}
        </span>
        <span className="text-xs bg-[#334155] text-slate-400 rounded-full px-2 py-0.5">
          {totalCount}
        </span>
      </div>

      <div ref={setNodeRef} className="p-2 flex flex-col gap-2 flex-1 min-h-[280px]">
        {col.id === 'done' ? (
          <>
            <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">✅ Accepté</p>
            {acceptedItems.map((app) => (
              <div key={app.id} className="border-l-2 border-emerald-500 pl-1">
                <ApplicationCard application={app} onDelete={onDelete} onUpdate={onUpdate} />
              </div>
            ))}
            <p className="text-xs text-slate-500 uppercase tracking-wide mt-2">❌ Refusé</p>
            {rejectedItems.map((app) => (
              <div key={app.id} className="border-l-2 border-red-500 pl-1">
                <ApplicationCard application={app} onDelete={onDelete} onUpdate={onUpdate} />
              </div>
            ))}
          </>
        ) : (
          <SortableContext
            items={items.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((app) => (
              <SortableCard key={app.id} application={app} onDelete={onDelete} onUpdate={onUpdate} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ initialApplications }: Props) {
  const [items, setItems] = useState<Application[]>(initialApplications)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    let targetStatus: ApplicationStatus | null = null

    const colMatch = COLUMNS.find((c) => c.id === overId && c.id !== 'done')
    if (colMatch) {
      targetStatus = colMatch.id as ApplicationStatus
    } else {
      const overCard = items.find((a) => a.id === overId)
      if (overCard && overCard.status !== 'accepted' && overCard.status !== 'rejected') {
        targetStatus = overCard.status
      }
    }

    if (!targetStatus) return

    const current = items.find((a) => a.id === draggedId)
    if (!current || current.status === targetStatus) return

    setItems((prev) =>
      prev.map((a) => (a.id === draggedId ? { ...a, status: targetStatus! } : a))
    )
    await updateStatus(draggedId, targetStatus)
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((a) => a.id !== id))
    removeApplication(id)
  }

  function handleUpdate(updated: Application) {
    setItems((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    updateDetails(updated.id, {
      notes: updated.notes ?? undefined,
      follow_up_date: updated.follow_up_date ?? undefined,
      status: updated.status,
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const colItems = col.id === 'done' ? [] : items.filter((a) => a.status === col.id)
          const acceptedItems = col.id === 'done' ? items.filter((a) => a.status === 'accepted') : []
          const rejectedItems = col.id === 'done' ? items.filter((a) => a.status === 'rejected') : []

          return (
            <DroppableColumn
              key={col.id}
              col={col}
              items={colItems}
              acceptedItems={acceptedItems}
              rejectedItems={rejectedItems}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          )
        })}
      </div>
    </DndContext>
  )
}
