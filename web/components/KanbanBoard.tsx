'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateStatus } from '@/lib/applications'
import ApplicationCard from '@/components/ApplicationCard'
import type { Application, ApplicationStatus } from '@/types/application'

type Props = { initialApplications: Application[] }

type ColumnDef = {
  id: ApplicationStatus | 'done'
  label: string
  color: string
  statuses?: ApplicationStatus[]
}

const COLUMNS: ColumnDef[] = [
  { id: 'interested', label: 'Intéressé', color: 'border-slate-500' },
  { id: 'applied', label: 'Postulé', color: 'border-blue-500' },
  { id: 'followed_up', label: 'Relancé', color: 'border-amber-500' },
  { id: 'interview', label: 'Entretien', color: 'border-emerald-500' },
  { id: 'done', label: 'Terminé', color: 'border-slate-600', statuses: ['accepted', 'rejected'] },
]

function SortableCard({ application }: { application: Application }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: application.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCard application={application} />
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
    const targetColId = over.id as string

    const col = COLUMNS.find((c) => c.id === targetColId)
    if (!col || col.id === 'done') return

    const newStatus = col.id as ApplicationStatus
    const current = items.find((a) => a.id === draggedId)
    if (!current || current.status === newStatus) return

    setItems((prev) =>
      prev.map((a) => (a.id === draggedId ? { ...a, status: newStatus } : a))
    )
    await updateStatus(draggedId, newStatus)
  }

  function getColumnItems(col: ColumnDef): Application[] {
    if (col.id === 'done') return []
    return items.filter((a) => a.status === (col.id as ApplicationStatus))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const colItems = getColumnItems(col)
          const acceptedItems = col.id === 'done' ? items.filter((a) => a.status === 'accepted') : []
          const rejectedItems = col.id === 'done' ? items.filter((a) => a.status === 'rejected') : []
          const totalCount = col.id === 'done' ? acceptedItems.length + rejectedItems.length : colItems.length

          return (
            <div
              key={col.id}
              className={`min-w-[220px] flex-1 bg-[#1E293B] border border-[#334155] rounded-xl flex flex-col border-t-[3px] ${col.color}`}
            >
              <div className="px-3 py-3 border-b border-[#334155] flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  {col.label}
                </span>
                <span className="text-xs bg-[#334155] text-slate-400 rounded-full px-2 py-0.5">
                  {totalCount}
                </span>
              </div>

              <div className="p-2 flex flex-col gap-2 flex-1 min-h-[280px]" id={col.id}>
                {col.id === 'done' ? (
                  <>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">✅ Accepté</p>
                    {acceptedItems.map((app) => (
                      <div key={app.id} className="border-l-2 border-emerald-500 pl-1">
                        <ApplicationCard application={app} />
                      </div>
                    ))}
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-2">❌ Refusé</p>
                    {rejectedItems.map((app) => (
                      <div key={app.id} className="border-l-2 border-red-500 pl-1">
                        <ApplicationCard application={app} />
                      </div>
                    ))}
                  </>
                ) : (
                  <SortableContext
                    items={colItems.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {colItems.map((app) => (
                      <SortableCard key={app.id} application={app} />
                    ))}
                  </SortableContext>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}
