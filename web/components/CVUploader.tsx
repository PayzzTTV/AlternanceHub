'use client'

import { useRef, useState, useCallback } from 'react'

const STORAGE_KEY = 'alternancehub_match_scores'

export function getMatchScores(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }
  return pages.join('\n')
}

export default function CVUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setState('loading')

    try {
      let cvText: string
      if (file.name.endsWith('.pdf')) {
        cvText = await extractPdfText(file)
      } else {
        cvText = await file.text()
      }

      if (!cvText.trim()) throw new Error('empty')

      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText }),
      })
      if (!res.ok) throw new Error('api')
      const { scores } = await res.json()
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
      setState('done')
      window.dispatchEvent(new CustomEvent('match-scores-updated'))
    } catch {
      setState('error')
    }
  }, [])

  function handleReset() {
    sessionStorage.removeItem(STORAGE_KEY)
    setFileName(null)
    setState('idle')
    window.dispatchEvent(new CustomEvent('match-scores-updated'))
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">Matching CV</p>
          <p className="text-xs text-slate-400">
            Upload ton CV pour voir ton score sur chaque offre
          </p>
        </div>
        {state === 'done' && (
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Effacer
          </button>
        )}
      </div>

      {state === 'idle' && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-[#334155] hover:border-blue-500 rounded-lg py-4 text-sm text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importer mon CV (.pdf ou .txt)
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Extraction du CV en cours…
        </div>
      )}

      {state === 'done' && (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="truncate max-w-[200px] text-slate-300">{fileName}</span>
          <span>· scores calculés</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Erreur lors de l&apos;analyse
          <button onClick={() => setState('idle')} className="underline text-slate-400 hover:text-slate-200">
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}
