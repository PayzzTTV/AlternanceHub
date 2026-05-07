from __future__ import annotations

import json
import os
import ssl
import time
from urllib.request import Request, urlopen
from typing import Any

import certifi
import feedparser


SOURCE_NAME = "france_travail"


def _extract_city(address: str) -> str:
    """Extract city name from a French postal address like '105 RUE SAINT-CHARLES 75015 PARIS'."""
    if not address:
        return ""
    parts = address.strip().split()
    # City is typically after the postal code (5 digits)
    for i, part in enumerate(parts):
        if part.isdigit() and len(part) == 5 and i + 1 < len(parts):
            return " ".join(parts[i + 1:]).title()
    return address.title()


def _map_france_travail_json_item(item: dict[str, Any]) -> dict[str, Any]:
    workplace = item.get("workplace", {})
    offer = item.get("offer", {})
    apply = item.get("apply", {})
    contract = item.get("contract", {})
    publication = offer.get("publication", {})

    location = ""
    if isinstance(workplace, dict):
        raw_address = (
            workplace.get("location", {}).get("address", "")
            if isinstance(workplace.get("location"), dict)
            else ""
        )
        location = _extract_city(raw_address)

    duration = contract.get("duration")
    duration_text = str(duration) if duration is not None else ""

    remote = contract.get("remote")
    desired_skills: list[str] = offer.get("desired_skills") or []
    description: str = offer.get("description") or ""

    return {
        "title": offer.get("title", ""),
        "company": workplace.get("name", "") or "France Travail",
        "location": location,
        "source_url": apply.get("url", ""),
        "published_at": publication.get("creation", ""),
        "duration": duration_text,
        "description": description,
        "desired_skills": desired_skills,
        "remote": remote,
    }


def _fetch_from_json_api() -> list[dict[str, Any]]:
    api_url = os.getenv("FRANCE_TRAVAIL_API_URL", "").strip()
    if not api_url:
        return []

    user_agent = (
        "AlternanceHubBot/1.0 "
        "(+https://github.com/PayzzTTV/AlternanceHub)"
    )
    headers = {"User-Agent": user_agent, "accept": "application/json"}

    api_key = os.getenv("FRANCE_TRAVAIL_API_KEY", "").strip()
    api_key_header = os.getenv(
        "FRANCE_TRAVAIL_API_KEY_HEADER", "x-api-key"
    ).strip()
    if api_key:
        headers[api_key_header] = api_key

    bearer_token = os.getenv("FRANCE_TRAVAIL_BEARER_TOKEN", "").strip()
    if bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"

    req = Request(api_url, headers=headers)
    time.sleep(2)
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    with urlopen(req, timeout=30, context=ssl_context) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if isinstance(payload, list):
        return [
            _map_france_travail_json_item(item)
            for item in payload
            if isinstance(item, dict)
        ]
    if isinstance(payload, dict):
        if "jobs" in payload and isinstance(payload["jobs"], list):
            return [
                _map_france_travail_json_item(item)
                for item in payload["jobs"]
                if isinstance(item, dict)
            ]
        if "results" in payload and isinstance(payload["results"], list):
            return [
                _map_france_travail_json_item(item)
                for item in payload["results"]
                if isinstance(item, dict)
            ]
        return [_map_france_travail_json_item(payload)]
    return []


def fetch_france_travail_offers() -> list[dict[str, Any]]:
    api_entries = _fetch_from_json_api()
    if api_entries:
        return api_entries

    rss_url = os.getenv("FRANCE_TRAVAIL_RSS_URL", "").strip()
    if not rss_url:
        raise ValueError(
            "Provide FRANCE_TRAVAIL_API_URL or FRANCE_TRAVAIL_RSS_URL"
        )

    # Respectful scraping behavior, keeps request cadence conservative.
    time.sleep(2)
    feed = feedparser.parse(rss_url)

    entries: list[dict[str, Any]] = []
    for item in feed.entries:
        entries.append(
            {
                "title": getattr(item, "title", ""),
                "company": getattr(item, "author", "") or "France Travail",
                "location": getattr(item, "location", "") or "",
                "source_url": getattr(item, "link", ""),
                "published_at": getattr(item, "published", ""),
                "tags": ["cybersecurity", "alternance"],
            }
        )
    return entries
