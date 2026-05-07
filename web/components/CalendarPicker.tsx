'use client'

import { useState } from 'react'

type Props = {
  value: string // YYYY-MM-DD ou ''
  onChange: (date: string) => void
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

function parseDate(value: string): Date | null {
  if (!value) return null
  const d = new Date(value + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPicker({ value, onChange }: Props) {
  const today = new Date()
  const selected = parseDate(value)

  const [cursor, setCursor] = useState<{ year: number; month: number }>(() => {
    const d = selected ?? today
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  function prevMonth() {
    setCursor((c) => {
      if (c.month === 0) return { year: c.year - 1, month: 11 }
      return { year: c.year, month: c.month - 1 }
    })
  }

  function nextMonth() {
    setCursor((c) => {
      if (c.month === 11) return { year: c.year + 1, month: 0 }
      return { year: c.year, month: c.month + 1 }
    })
  }

  const firstDay = new Date(cursor.year, cursor.month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayYMD = toYMD(today)
  const selectedYMD = value

  function handleDay(day: number) {
    const d = new Date(cursor.year, cursor.month, day)
    onChange(toYMD(d))
  }

  return (
    <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 select-none">
      {/* Header navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-white/80">
          {MONTHS[cursor.month]} {cursor.year}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
        >
          →
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-white/30 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const ymd = toYMD(new Date(cursor.year, cursor.month, day))
          const isSelected = ymd === selectedYMD
          const isToday = ymd === todayYMD
          const isPast = ymd < todayYMD

          return (
            <button
              key={i}
              onClick={() => handleDay(day)}
              className={`
                w-8 h-8 mx-auto flex items-center justify-center rounded-xl text-sm transition-all
                ${isSelected
                  ? 'bg-indigo-500 text-white font-semibold'
                  : isToday
                  ? 'border border-indigo-500/60 text-indigo-400'
                  : isPast
                  ? 'text-white/20 hover:bg-white/5 hover:text-white/45'
                  : 'text-white/65 hover:bg-white/8'
                }
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Raccourcis + effacer */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-white/8">
        <button
          onClick={() => onChange(todayYMD)}
          className="flex-1 text-xs text-white/40 hover:text-white/75 border border-white/10 hover:border-white/20 rounded-xl py-1.5 transition-all"
        >
          Aujourd&apos;hui
        </button>
        <button
          onClick={() => {
            const d = new Date(today)
            d.setDate(d.getDate() + 7)
            onChange(toYMD(d))
          }}
          className="flex-1 text-xs text-white/40 hover:text-white/75 border border-white/10 hover:border-white/20 rounded-xl py-1.5 transition-all"
        >
          +7 jours
        </button>
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-xs text-red-400 hover:text-red-300 border border-white/10 rounded-xl px-2 py-1.5 transition-colors"
          >
            Effacer
          </button>
        )}
      </div>
    </div>
  )
}
