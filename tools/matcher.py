from __future__ import annotations

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_FR_STOP_WORDS = [
    "de", "du", "des", "le", "la", "les", "un", "une", "et", "en",
    "au", "aux", "par", "pour", "sur", "dans", "avec", "sans", "sous",
    "ce", "qui", "que", "qu", "se", "sa", "son", "ses", "leur", "leurs",
    "nous", "vous", "ils", "elles", "on", "je", "tu", "il", "elle",
    "est", "sont", "être", "avoir", "sera", "seront", "été", "ont",
    "plus", "très", "aussi", "mais", "ou", "si", "ne", "pas", "non",
    "tout", "tous", "toute", "toutes", "cette", "cet", "ces", "nos",
    "vos", "mon", "ton", "notre", "votre", "dont", "lors", "dès",
    "afin", "ainsi", "alors", "après", "avant", "bien", "comme",
    "lors", "même", "selon", "vers", "votre", "entre", "depuis",
    "h", "f", "hf", "fh",  # "(H/F)" markers in job titles
]


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
        token_pattern=r"(?u)\b\w[\w\-\.]{1,}\b",
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
        stop_words=_FR_STOP_WORDS,
    )
    matrix = vectorizer.fit_transform(docs)
    scores = cosine_similarity(matrix[0:1], matrix[1:])[0]

    max_score = float(scores.max()) if scores.max() > 0 else 1.0
    results = [
        {
            "offer": offer,
            "score": round(float(score) / max_score * 100, 1),
            "raw_score": round(float(score) * 100, 2),
        }
        for offer, score in zip(offers, scores)
    ]
    return sorted(results, key=lambda x: x["score"], reverse=True)
