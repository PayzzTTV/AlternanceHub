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
  accent: string
}

const COLUMNS: ColumnDef[] = [
  { id: 'interested', label: 'Intéressé', accent: 'border-t-white/20' },
  { id: 'applied', label: 'Postulé', accent: 'border-t-indigo-500' },
  { id: 'followed_up', label: 'Relancé', accent: 'border-t-amber-500' },
  { id: 'interview', label: 'Entretien', accent: 'border-t-emerald-500' },
  { id: 'done', label: 'Terminé', accent: 'border-t-white/10' },
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
      className={`min-w-[220px] flex-1 glass rounded-2xl flex flex-col border-t-[3px] ${col.accent} transition-all ${isOver && col.id !== 'done' ? 'bg-indigo-500/10 border-indigo-500/40' : ''}`}
    >
      <div className="px-3 py-3 border-b border-white/8 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/55">
          {col.label}
        </span>
        <span className="text-xs bg-white/8 text-white/40 rounded-full px-2 py-0.5">
          {totalCount}
        </span>
      </div>

      <div ref={setNodeRef} className="p-2 flex flex-col gap-2 flex-1 min-h-[280px]">
        {col.id === 'done' ? (
          <>
            <p className="text-xs text-white/30 uppercase tracking-wide mt-1">✅ Accepté</p>
            {acceptedItems.map((app) => (
              <div key={app.id} className="border-l-2 border-emerald-500 pl-1">
                <ApplicationCard application={app} onDelete={onDelete} onUpdate={onUpdate} />
              </div>
            ))}
            <p className="text-xs text-white/30 uppercase tracking-wide mt-2">❌ Refusé</p>
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
