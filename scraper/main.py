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


def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not service_role_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        )
    return create_client(supabase_url, service_role_key)


def build_records(raw_offers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped_records: dict[str, dict[str, Any]] = {}
    scraped_at = utc_now_iso()
    for raw_offer in raw_offers:
        normalized = normalize_offer(raw_offer, source_name=SOURCE_NAME)
        record = normalized.to_record()
        record_hash = offer_hash(normalized.title, normalized.company)
        record["hash"] = record_hash
        record["scraped_at"] = scraped_at
        deduped_records[record_hash] = record
    return list(deduped_records.values())


def upsert_offers(client: Client, records: list[dict[str, Any]]) -> None:
    if not records:
        return
    client.table("offers").upsert(records, on_conflict="hash").execute()


def main() -> None:
    load_dotenv(".env.local")
    load_dotenv()
    raw_offers = fetch_france_travail_offers()
    records = build_records(raw_offers)
    client = get_supabase_client()
    upsert_offers(client, records)
    print(f"Scraped {len(records)} offers from {SOURCE_NAME}")


if __name__ == "__main__":
    main()
