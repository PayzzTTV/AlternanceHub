from __future__ import annotations

import json
import os
import ssl
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from typing import Any

import certifi


SOURCE_NAME = "france_travail_api"

# ROME codes for IT/cybersecurity roles
_ROME_CODES = "M1802,M1805,M1806,M1810"
# Max results per call (API limit = 150)
_PAGE_SIZE = 149


def _get_token() -> str:
    client_id = os.getenv("FT_CLIENT_ID", "").strip()
    client_secret = os.getenv("FT_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        raise ValueError(
            "FT_CLIENT_ID and FT_CLIENT_SECRET are required"
        )

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    url = (
        "https://entreprise.francetravail.fr"
        "/connexion/oauth2/access_token?realm=%2Fpartenaire"
    )
    body = urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "api_offresdemploiv2 o2dsoffre",
    }).encode()
    req = Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urlopen(req, timeout=30, context=ssl_context) as resp:
        payload = json.loads(resp.read().decode())
    token = payload.get("access_token", "")
    if not token:
        raise ValueError(f"Failed to get FT token: {payload}")
    return token


def _map_item(item: dict[str, Any]) -> dict[str, Any]:
    lieu = item.get("lieuTravail") or {}
    location_raw = lieu.get("libelle", "")
    # "42 - ST ETIENNE" → "St Etienne"
    if " - " in location_raw:
        location_raw = location_raw.split(" - ", 1)[1].title()

    salary_info = item.get("salaire") or {}
    salary = salary_info.get("libelle") or None

    # Duration: extract months from qualificationLibelle or default
    duree = item.get("dureeTravailLibelle") or ""
    duration = None
    if "mois" in duree.lower():
        for part in duree.split():
            if part.isdigit():
                duration = part
                break

    competences = item.get("competences") or []
    skills = [c.get("libelle", "") for c in competences if c.get("libelle")]

    description = item.get("description") or ""

    return {
        "title": item.get("intitule", ""),
        "company": (
            (item.get("entreprise") or {}).get("nom", "")
            or "France Travail"
        ),
        "location": location_raw or None,
        "source_url": (
            (item.get("origineOffre") or {}).get("urlOrigine")
            or f"https://candidat.francetravail.fr/offres/recherche"
            f"/detail/{item.get('id', '')}"
        ),
        "published_at": item.get("dateCreation"),
        "duration": duration,
        "salary": salary,
        "description": description,
        "desired_skills": skills,
        "remote": None,
    }


def fetch_france_travail_api_offers() -> list[dict[str, Any]]:
    client_id = os.getenv("FT_CLIENT_ID", "").strip()
    if not client_id:
        return []

    token = _get_token()
    time.sleep(1)

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    base_url = (
        "https://api.francetravail.io/partenaire/offresdemploi"
        "/v2/offres/search"
    )
    params = urlencode({
        "codeROME": _ROME_CODES,
        "motsCles": "alternance",
        "range": f"0-{_PAGE_SIZE}",
    })
    req = Request(f"{base_url}?{params}")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/json")

    with urlopen(req, timeout=30, context=ssl_context) as resp:
        payload = json.loads(resp.read().decode())

    results = payload.get("resultats") or []
    return [
        _map_item(item)
        for item in results
        if isinstance(item, dict)
    ]
