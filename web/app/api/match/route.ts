import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { matchCV } from '@/lib/tfidf'

export async function POST(req: NextRequest) {
  const { cvText } = await req.json() as { cvText?: string }

  if (!cvText?.trim()) {
    return NextResponse.json({ error: 'CV text is empty' }, { status: 400 })
  }

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
