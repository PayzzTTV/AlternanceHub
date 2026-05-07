from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client

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


def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not service_role_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        )
    return create_client(supabase_url, service_role_key)


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
    client: Client, records: list[dict[str, Any]], batch_size: int = 50
) -> None:
    if not records:
        return
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        client.table("offers").upsert(batch, on_conflict="hash").execute()


def main() -> None:
    load_dotenv(".env.local")
    load_dotenv()
    client = get_supabase_client()

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
        upsert_offers(client, records)
        print(f"Scraped {len(records)} offers from {source_name}")
        total += len(records)

    print(f"Total: {total} offers upserted")


if __name__ == "__main__":
    main()
