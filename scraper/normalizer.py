from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from dateutil import parser as dt_parser


@dataclass(frozen=True)
class NormalizedOffer:
    title: str
    company: str
    location: str | None
    contract_type: str
    duration: str | None
    salary: str | None
    tags: list[str]
    source: str
    source_url: str
    published_at: str | None
    description: str | None = None
    desired_skills: list[str] | None = None
    is_active: bool = True

    def to_record(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "contract_type": self.contract_type,
            "duration": self.duration,
            "salary": self.salary,
            "tags": self.tags,
            "source": self.source,
            "source_url": self.source_url,
            "published_at": self.published_at,
            "description": self.description,
            "desired_skills": self.desired_skills or [],
            "is_active": self.is_active,
        }


def _safe_string(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


# Maps lowercase keyword → canonical tag label
_KEYWORD_TAGS: list[tuple[str, str]] = [
    ("cybersécurité", "Cybersécurité"),
    ("cybersecurité", "Cybersécurité"),
    ("cybersecurity", "Cybersécurité"),
    ("sécurité informatique", "Cybersécurité"),
    ("sécurité si", "Cybersécurité"),
    ("pentest", "Pentest"),
    ("test d'intrusion", "Pentest"),
    (" soc ", "SOC"),
    ("analyste soc", "SOC"),
    ("siem", "SIEM"),
    ("firewall", "Firewall"),
    ("réseau", "Réseau"),
    ("network", "Réseau"),
    ("cloud", "Cloud"),
    ("linux", "Linux"),
    ("python", "Python"),
    ("devsecops", "DevSecOps"),
    ("devops", "DevOps"),
    ("audit", "Audit SI"),
    ("forensic", "Forensic"),
    ("iso 27001", "ISO 27001"),
    ("anssi", "ANSSI"),
    (" grc ", "GRC"),
    ("gouvernance", "GRC"),
    ("azure", "Azure"),
    (" aws ", "AWS"),
    ("kubernetes", "Kubernetes"),
    ("docker", "Docker"),
    ("splunk", "Splunk"),
    ("microsoft 365", "Microsoft 365"),
    ("active directory", "Active Directory"),
]


def _extract_tags(raw: dict[str, Any]) -> list[str]:
    # If explicit tags already provided (e.g. future sources), use them
    explicit = raw.get("tags")
    if isinstance(explicit, list) and explicit:
        clean = [str(t).strip() for t in explicit if str(t).strip()]
        if clean:
            return clean

    # Build a single searchable text from title + description + skills
    title = str(raw.get("title") or "").lower()
    description = str(raw.get("description") or "").lower()
    raw_skills = raw.get("desired_skills") or []
    skills = " ".join(str(s) for s in raw_skills).lower()
    haystack = f" {title} {description} {skills} "

    found: list[str] = []
    seen: set[str] = set()
    for keyword, label in _KEYWORD_TAGS:
        if keyword in haystack and label not in seen:
            found.append(label)
            seen.add(label)

    if raw.get("remote"):
        found.append("Télétravail")

    return found if found else ["Informatique"]


def _extract_company(raw: dict[str, Any]) -> str:
    candidates = [
        raw.get("company"),
        raw.get("author"),
        raw.get("source"),
    ]
    for candidate in candidates:
        cleaned = _safe_string(candidate)
        if cleaned:
            return cleaned
    return "Unknown company"


def _to_iso8601(value: Any) -> str | None:
    cleaned = _safe_string(value)
    if not cleaned:
        return None
    try:
        parsed = dt_parser.parse(cleaned)
    except (ValueError, TypeError, OverflowError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat()


def normalize_offer(raw: dict[str, Any], source_name: str) -> NormalizedOffer:
    title = _safe_string(raw.get("title"), "Untitled offer")
    company = _extract_company(raw)
    location = _safe_string(raw.get("location")) or None
    source_url = _safe_string(raw.get("source_url") or raw.get("link"))
    if not source_url:
        raise ValueError("Missing source_url/link in raw offer")

    raw_skills = raw.get("desired_skills") or []
    skills = [str(s).strip() for s in raw_skills if str(s).strip()]

    return NormalizedOffer(
        title=title,
        company=company,
        location=location,
        contract_type="alternance",
        duration=_safe_string(raw.get("duration")) or None,
        salary=_safe_string(raw.get("salary")) or None,
        tags=_extract_tags(raw),
        source=source_name,
        source_url=source_url,
        published_at=_to_iso8601(
            raw.get("published_at") or raw.get("published")
        ),
        description=_safe_string(raw.get("description")) or None,
        desired_skills=skills or None,
    )


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
