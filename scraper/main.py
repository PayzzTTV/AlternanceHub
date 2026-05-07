from __future__ import annotations

import os
import time
from typing import Any

import requests
from dotenv import load_dotenv

from scraper.deduplicator import offer_hash
from scraper.normalizer import normalize_offer, utc_now_iso
from scraper.sources.france_travail_rss import (
    SOURCE_NAME,
    fetch_france_travail_offers,
)
from scraper.sources.france_travail_api import (
    SOURCE_NAME as FT_API_SOURCE_NAME,
    fetch_france_travail_api_offers,
)


def _get_supabase_config() -> tuple[str, str]:
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    # Remove all whitespace (including embedded \n or \r from copy-paste)
    service_role_key = "".join(
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").split()
    )
    if not supabase_url or not service_role_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        )
    return supabase_url, service_role_key


def build_records(
    raw_offers: list[dict[str, Any]], source_name: str
) -> list[dict[str, Any]]:
    deduped_records: dict[str, dict[str, Any]] = {}
    scraped_at = utc_now_iso()
    for raw_offer in raw_offers:
        normalized = normalize_offer(raw_offer, source_name=source_name)
        record = normalized.to_record()
        record_hash = offer_hash(normalized.title, normalized.company)
        record["hash"] = record_hash
        record["scraped_at"] = scraped_at
        deduped_records[record_hash] = record
    return list(deduped_records.values())


def upsert_offers(
    supabase_url: str,
    service_role_key: str,
    records: list[dict[str, Any]],
    batch_size: int = 25,
) -> None:
    if not records:
        return
    url = f"{supabase_url}/rest/v1/offers?on_conflict=hash"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    session = requests.Session()
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        resp = session.post(url, json=batch, headers=headers, timeout=30)
        resp.raise_for_status()
        time.sleep(0.3)


def main() -> None:
    load_dotenv(".env.local")
    load_dotenv()
    supabase_url, service_role_key = _get_supabase_config()

    sources = [
        (SOURCE_NAME, fetch_france_travail_offers),
        (FT_API_SOURCE_NAME, fetch_france_travail_api_offers),
    ]

    total = 0
    for source_name, fetch_fn in sources:
        raw_offers = fetch_fn()
        if not raw_offers:
            print(f"No offers from {source_name}, skipping")
            continue
        records = build_records(raw_offers, source_name)
        upsert_offers(supabase_url, service_role_key, records)
        print(f"Scraped {len(records)} offers from {source_name}")
        total += len(records)

    print(f"Total: {total} offers upserted")


if __name__ == "__main__":
    main()
