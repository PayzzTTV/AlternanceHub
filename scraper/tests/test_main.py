from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from scraper.main import build_records, upsert_offers


_RAW_OFFER = {
    "title": "Alternant Cybersécurité SOC",
    "company": "Acme Corp",
    "location": "Paris",
    "source_url": "https://example.com/offre/1",
    "published_at": "2026-01-01T00:00:00Z",
    "duration": "12",
    "salary": None,
    "description": "Poste de cybersécurité en alternance.",
    "desired_skills": ["Python", "SIEM"],
    "remote": None,
}


def test_build_records_returns_list():
    records = build_records([_RAW_OFFER], source_name="france_travail")
    assert isinstance(records, list)
    assert len(records) == 1


def test_build_records_has_hash_and_scraped_at():
    records = build_records([_RAW_OFFER], source_name="france_travail")
    record = records[0]
    assert "hash" in record
    assert "scraped_at" in record
    assert len(record["hash"]) == 64  # SHA256 hex


def test_build_records_deduplicates():
    records = build_records(
        [_RAW_OFFER, _RAW_OFFER], source_name="france_travail"
    )
    assert len(records) == 1


def test_build_records_empty():
    assert build_records([], source_name="france_travail") == []


def test_upsert_offers_skips_empty():
    # Should return without making any HTTP call
    upsert_offers("https://example.com", "fake-key", [])


def test_upsert_offers_posts_in_batches():
    records = build_records([_RAW_OFFER], source_name="france_travail")
    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None

    with patch("scraper.main.requests.Session") as mock_session_cls:
        mock_session = MagicMock()
        mock_session.post.return_value = mock_resp
        mock_session_cls.return_value = mock_session

        upsert_offers(
            "https://example.supabase.co",
            "fake-service-role-key",
            records,
            batch_size=25,
        )

        assert mock_session.post.call_count == 1
        call_args = mock_session.post.call_args
        assert "on_conflict=hash" in call_args[0][0]
