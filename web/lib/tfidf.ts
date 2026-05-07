const FR_STOP_WORDS = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'et', 'en',
  'au', 'aux', 'par', 'pour', 'sur', 'dans', 'avec', 'sans', 'sous',
  'ce', 'qui', 'que', 'qu', 'se', 'sa', 'son', 'ses', 'leur', 'leurs',
  'nous', 'vous', 'ils', 'elles', 'on', 'je', 'tu', 'il', 'elle',
  'est', 'sont', 'sera', 'seront', 'ont', 'plus', 'très', 'aussi',
  'mais', 'ou', 'si', 'ne', 'pas', 'non', 'tout', 'tous', 'cette',
  'cet', 'ces', 'nos', 'vos', 'mon', 'ton', 'notre', 'votre', 'dont',
  'lors', 'dès', 'afin', 'ainsi', 'alors', 'après', 'avant', 'bien',
  'comme', 'même', 'selon', 'vers', 'entre', 'depuis', 'h', 'f', 'hf', 'fh',
  'vous', 'nous', 'votre', 'notre', 'être', 'avoir', 'faire', 'will',
])

export type OfferInsight = {
  strengths: string[]  // mots-clés du CV présents dans l'offre
  gaps: string[]       // mots-clés importants de l'offre absents du CV
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\-\.]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !FR_STOP_WORDS.has(t))
}

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
  const max = Math.max(1, ...tf.values())
  tf.forEach((v, k) => tf.set(k, v / max))
  return tf
}

export function matchCV(
  cvText: string,
  offers: { id: string; text: string }[]
): { scores: Record<string, number>; insights: Record<string, OfferInsight> } {
  if (!offers.length) return { scores: {}, insights: {} }

  const docs = [cvText, ...offers.map((o) => o.text)]
  const tokenized = docs.map(tokenize)

  // IDF
  const dfMap = new Map<string, number>()
  for (const tokens of tokenized) {
    for (const t of new Set(tokens)) dfMap.set(t, (dfMap.get(t) ?? 0) + 1)
  }
  const N = tokenized.length
  const idf = (term: string) => Math.log((N + 1) / ((dfMap.get(term) ?? 0) + 1)) + 1

  const allTerms = Array.from(dfMap.keys())
  function toVector(tokens: string[]): number[] {
    const tf = termFreq(tokens)
    return allTerms.map((t) => (tf.get(t) ?? 0) * idf(t))
  }

  const cvTokenSet = new Set(tokenized[0])
  const cvVec = toVector(tokenized[0])
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0))
  const cvNorm = norm(cvVec)

  const rawScores = offers.map((offer, i) => {
    const offerTokens = tokenized[i + 1]
    const offerVec = toVector(offerTokens)
    const dot = cvVec.reduce((s, v, j) => s + v * offerVec[j], 0)
    const similarity = cvNorm * norm(offerVec) === 0 ? 0 : dot / (cvNorm * norm(offerVec))

    // Strengths: high-IDF terms present in both CV and offer
    const offerTokenSet = new Set(offerTokens)
    const strengths = allTerms
      .filter((t) => cvTokenSet.has(t) && offerTokenSet.has(t))
      .sort((a, b) => idf(b) - idf(a))
      .slice(0, 6)

    // Gaps: high-IDF terms in offer but absent from CV
    const gaps = allTerms
      .filter((t) => !cvTokenSet.has(t) && offerTokenSet.has(t) && idf(t) > 2)
      .sort((a, b) => idf(b) - idf(a))
      .slice(0, 5)

    return { id: offer.id, score: similarity, strengths, gaps }
  })

  const maxScore = Math.max(...rawScores.map((r) => r.score), 1e-9)
  const scores: Record<string, number> = {}
  const insights: Record<string, OfferInsight> = {}
  for (const { id, score, strengths, gaps } of rawScores) {
    scores[id] = Math.round((score / maxScore) * 100)
    insights[id] = { strengths, gaps }
  }
  return { scores, insights }
}
