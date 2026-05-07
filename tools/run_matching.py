from __future__ import annotations

import argparse
import sys

from cv_to_md import cv_to_text
from matcher import match
from offer_to_md import fetch_offers, offer_to_text


def _print_results(results: list[dict], top: int) -> None:
    width = 55
    print(f"\n{'─' * (width + 12)}")
    print(f"{'#':>3}  {'Titre — Entreprise':<{width}}  {'Score':>7}")
    print(f"{'─' * (width + 12)}")
    for i, r in enumerate(results[:top], 1):
        offer = r["offer"]
        label = f"{offer.get('title', '')} — {offer.get('company', '')}"
        if len(label) > width:
            label = label[:width - 1] + "…"
        print(f"{i:>3}. {label:<{width}}  {r['score']:>6.1f}%")
    print(f"{'─' * (width + 12)}\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Match a CV against active alternance offers"
    )
    parser.add_argument("--cv", required=True, help="Path to CV (.pdf or .txt)")
    parser.add_argument(
        "--top", type=int, default=20, help="Number of results to show (default 20)"
    )
    parser.add_argument(
        "--limit", type=int, default=500, help="Max offers to fetch (default 500)"
    )
    args = parser.parse_args()

    print(f"Extraction du CV : {args.cv}")
    try:
        cv_text = cv_to_text(args.cv)
    except (FileNotFoundError, ValueError) as e:
        print(f"Erreur : {e}", file=sys.stderr)
        sys.exit(1)

    if not cv_text.strip():
        print("Erreur : CV vide ou illisible.", file=sys.stderr)
        sys.exit(1)

    print(f"Récupération des offres Supabase (max {args.limit})…")
    try:
        offers = fetch_offers(limit=args.limit)
    except Exception as e:
        print(f"Erreur Supabase : {e}", file=sys.stderr)
        sys.exit(1)

    if not offers:
        print("Aucune offre active trouvée.")
        sys.exit(0)

    print(f"{len(offers)} offres récupérées. Calcul du matching…")
    offer_texts = [offer_to_text(o) for o in offers]
    results = match(cv_text, offers, offer_texts)

    print(f"\nRésultats de matching pour {args.cv}")
    _print_results(results, args.top)


if __name__ == "__main__":
    main()
