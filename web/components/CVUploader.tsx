'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'

const SCORES_KEY = 'alternancehub_match_scores'
const INSIGHTS_KEY = 'alternancehub_match_insights'
const CV_TEXT_KEY = 'alternancehub_cv_text'
const CV_NAME_KEY = 'alternancehub_cv_name'

export function getMatchScores(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(SCORES_KEY) ?? '{}') } catch { return {} }
}

export function getMatchInsights(): Record<string, { strengths: string[]; gaps: string[] }> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(INSIGHTS_KEY) ?? '{}') } catch { return {} }
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }
  return pages.join('\n')
}

async function computeScores(cvText: string): Promise<{ scores: Record<string, number>; insights: Record<string, { strengths: string[]; gaps: string[] }> }> {
  const res = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cvText }),
  })
  if (!res.ok) throw new Error('api')
  return res.json()
}

export default function CVUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    const savedText = localStorage.getItem(CV_TEXT_KEY)
    const savedName = localStorage.getItem(CV_NAME_KEY)
    const savedScores = localStorage.getItem(SCORES_KEY)
    if (savedText && savedName) {
      setFileName(savedName)
      if (savedScores && Object.keys(JSON.parse(savedScores)).length > 0) {
        setState('done')
        window.dispatchEvent(new CustomEvent('match-scores-updated'))
      } else {
        setState('loading')
        computeScores(savedText)
          .then(({ scores, insights }) => {
            localStorage.setItem(SCORES_KEY, JSON.stringify(scores))
            localStorage.setItem(INSIGHTS_KEY, JSON.stringify(insights))
            setState('done')
            window.dispatchEvent(new CustomEvent('match-scores-updated'))
          })
          .catch(() => setState('idle'))
      }
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setState('loading')
    try {
      const cvText = file.name.endsWith('.pdf')
        ? await extractPdfText(file)
        : await file.text()

      if (!cvText.trim()) throw new Error('empty')

      const { scores, insights } = await computeScores(cvText)

      localStorage.setItem(CV_TEXT_KEY, cvText)
      localStorage.setItem(CV_NAME_KEY, file.name)
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores))
      localStorage.setItem(INSIGHTS_KEY, JSON.stringify(insights))
      setState('done')
      window.dispatchEvent(new CustomEvent('match-scores-updated'))
    } catch (err) {
      console.error('[CVUploader] analyse failed:', err)
      setState('error')
    }
  }, [])

  function handleReset() {
    localStorage.removeItem(SCORES_KEY)
    localStorage.removeItem(INSIGHTS_KEY)
    localStorage.removeItem(CV_TEXT_KEY)
    localStorage.removeItem(CV_NAME_KEY)
    setFileName(null)
    setState('idle')
    window.dispatchEvent(new CustomEvent('match-scores-updated'))
  }

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white/85">Matching CV</p>
          <p className="text-xs text-white/40">
            {state === 'done'
              ? 'Retourne sur les offres pour voir tes scores'
              : 'Upload ton CV pour voir ton % de correspondance sur chaque offre'}
          </p>
        </div>
        {state === 'done' && (
          <button
            onClick={handleReset}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Effacer
          </button>
        )}
      </div>

      {state === 'idle' && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl py-4 text-sm text-white/35 hover:text-indigo-300 transition-all cursor-pointer"
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
        <div className="flex items-center gap-2 py-3 text-sm text-white/45">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Calcul en cours…
        </div>
      )}

      {state === 'done' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="truncate max-w-[180px] text-white/65">{fileName}</span>
            <span>· actif</span>
          </div>
          <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Voir les offres →
          </Link>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Erreur lors de l&apos;analyse
          <button onClick={() => setState('idle')} className="underline text-white/40 hover:text-white/70">
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}
