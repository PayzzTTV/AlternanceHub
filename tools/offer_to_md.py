from __future__ import annotations

import os

import requests
from dotenv import load_dotenv


def _get_config() -> tuple[str, str]:
    load_dotenv(
        dotenv_path=str(
            __file__ and
            __import__("pathlib").Path(__file__).resolve().parents[1]
            / ".env.local"
        )
    )
    load_dotenv()
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    key = "".join(key.split())
    if not url or not key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        )
    return url, key


def fetch_offers(limit: int = 500) -> list[dict]:
    """Fetch active offers from Supabase."""
    url, key = _get_config()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }
    params = {
        "select": (
            "id,title,company,location,tags,"
            "source_url,duration,salary,description,desired_skills"
        ),
        "is_active": "eq.true",
        "limit": str(limit),
    }
    resp = requests.get(
        f"{url}/rest/v1/offers",
        headers=headers,
        params=params,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def offer_to_text(offer: dict) -> str:
    """Convert an offer dict to a plain text document for TF-IDF."""
    parts = [
        offer.get("title", ""),
        offer.get("company", ""),
        offer.get("location", "") or "",
        " ".join(offer.get("tags") or []),
        " ".join(offer.get("desired_skills") or []),
        offer.get("description", "") or "",
    ]
    return " ".join(p for p in parts if p)
