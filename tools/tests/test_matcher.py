from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from matcher import match


_OFFERS = [
    {"id": "1", "title": "Alternant SOC", "company": "Orange Cyberdefense"},
    {"id": "2", "title": "Alternant Pentest", "company": "Airbus"},
    {"id": "3", "title": "Alternant Boulangerie", "company": "Dupont Boulangerie"},
]

_TEXTS = [
    "Alternant SOC analyste sécurité SIEM Splunk cybersécurité",
    "Alternant Pentest test intrusion sécurité offensive",
    "Alternant boulangerie viennoiserie pain farine",
]


def test_match_returns_all_offers():
    cv = "cybersécurité SOC SIEM Splunk Python analyste"
    results = match(cv, _OFFERS, _TEXTS)
    assert len(results) == 3


def test_match_sorted_descending():
    cv = "cybersécurité SOC SIEM Splunk Python analyste"
    results = match(cv, _OFFERS, _TEXTS)
    scores = [r["score"] for r in results]
    assert scores == sorted(scores, reverse=True)


def test_match_cyber_cv_ranks_soc_first():
    cv = "cybersécurité SOC SIEM Splunk analyste sécurité"
    results = match(cv, _OFFERS, _TEXTS)
    assert results[0]["offer"]["id"] == "1"


def test_match_boulangerie_cv_ranks_boulangerie_first():
    cv = "boulangerie pain viennoiserie farine pâtisserie"
    results = match(cv, _OFFERS, _TEXTS)
    assert results[0]["offer"]["id"] == "3"


def test_match_empty_offers():
    assert match("some cv text", [], []) == []


def test_match_score_range():
    cv = "cybersécurité SOC SIEM"
    results = match(cv, _OFFERS, _TEXTS)
    for r in results:
        assert 0.0 <= r["score"] <= 100.0


def test_match_result_has_offer_and_score_keys():
    cv = "cybersécurité"
    results = match(cv, _OFFERS[:1], _TEXTS[:1])
    assert "offer" in results[0]
    assert "score" in results[0]
