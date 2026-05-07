from __future__ import annotations

import json
import os
import ssl
import time
from urllib.request import Request, urlopen
from typing import Any

import certifi
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
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
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
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    url = f"{supabase_url}/rest/v1/offers?on_conflict=hash"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        body = json.dumps(batch).encode("utf-8")
        req = Request(url, data=body, method="POST")
        for key, value in headers.items():
            req.add_header(key, value)
        with urlopen(req, timeout=30, context=ssl_context) as resp:
            resp.read()
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
