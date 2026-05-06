from __future__ import annotations

import hashlib


def offer_hash(title: str, company: str) -> str:
    payload = f"{title.strip().lower()}::{company.strip().lower()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
