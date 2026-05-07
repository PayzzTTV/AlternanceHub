from scraper.normalizer import normalize_offer


def test_normalizer_maps_core_fields() -> None:
    raw = {
        "title": "Alternance Cybersecurity Analyst",
        "company": "Acme",
        "location": "Paris",
        "source_url": "https://example.org/offers/1",
        "published_at": "2026-05-06T12:00:00+02:00",
        "tags": ["soc", "siem"],
    }
    normalized = normalize_offer(raw, source_name="france_travail_rss")
    assert normalized.title == "Alternance Cybersecurity Analyst"
    assert normalized.company == "Acme"
    assert normalized.location == "Paris"
    assert normalized.contract_type == "alternance"
    assert normalized.source == "france_travail_rss"
    assert normalized.source_url == "https://example.org/offers/1"
    assert normalized.tags == ["soc", "siem"]
    assert normalized.published_at is not None


def test_normalizer_uses_defaults() -> None:
    raw = {"link": "https://example.org/offers/2"}
    normalized = normalize_offer(raw, source_name="france_travail_rss")
    assert normalized.title == "Untitled offer"
    assert normalized.company == "Unknown company"
    assert normalized.tags == ["Informatique"]
