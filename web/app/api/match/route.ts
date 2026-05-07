import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { matchCV } from '@/lib/tfidf'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('cv') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No CV file provided' }, { status: 400 })
  }

  // Extract text from PDF or plain text
  let cvText = ''
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const buffer = Buffer.from(await file.arrayBuffer())
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const parsed = await pdfParse(buffer)
    cvText = parsed.text
  } else {
    cvText = await file.text()
  }

  if (!cvText.trim()) {
    return NextResponse.json({ error: 'CV is empty or unreadable' }, { status: 422 })
  }

  // Fetch active offers
  const supabase = await createSupabaseServerClient()
  const { data: offers, error } = await supabase
    .from('offers')
    .select('id,title,company,location,tags,description,desired_skills')
    .eq('is_active', true)
    .not('description', 'is', null)
    .limit(500)

  if (error || !offers?.length) {
    return NextResponse.json({ scores: {} })
  }

  const offerDocs = offers.map((o) => ({
    id: o.id as string,
    text: [
      o.title, o.title, o.title,
      ...(o.tags ?? []), ...(o.tags ?? []),
      ...(o.desired_skills ?? []), ...(o.desired_skills ?? []),
      o.company ?? '',
      o.location ?? '',
      o.description ?? '',
    ].join(' '),
  }))

  const scores = matchCV(cvText, offerDocs)
  return NextResponse.json({ scores })
}
