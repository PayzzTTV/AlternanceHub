from __future__ import annotations

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def match(cv_text: str, offers: list[dict], offer_texts: list[str]) -> list[dict]:
    """
    Rank offers by TF-IDF cosine similarity against the CV text.

    Returns a list of dicts: {'offer': ..., 'score': float 0-100}
    sorted from best to worst match.
    """
    if not offers:
        return []

    docs = [cv_text] + offer_texts
    vectorizer = TfidfVectorizer(
        analyzer="word",
        token_pattern=r"(?u)\b\w[\w\-\.]{1,}\b",  # keep "dnd-kit", "ISO 27001"
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(docs)
    scores = cosine_similarity(matrix[0:1], matrix[1:])[0]

    results = [
        {"offer": offer, "score": round(float(score) * 100, 1)}
        for offer, score in zip(offers, scores)
    ]
    return sorted(results, key=lambda x: x["score"], reverse=True)
