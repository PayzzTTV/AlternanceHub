from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from offer_to_md import offer_to_text


def test_offer_to_text_includes_title_and_company():
    offer = {
        "id": "1",
        "title": "Alternant SOC",
        "company": "Orange Cyberdefense",
        "location": "Paris",
        "tags": ["Cybersécurité", "SOC"],
        "description": "Analyste sécurité en alternance.",
    }
    text = offer_to_text(offer)
    assert "Alternant SOC" in text
    assert "Orange Cyberdefense" in text
    assert "Cybersécurité" in text
    assert "Analyste sécurité" in text


def test_offer_to_text_handles_missing_fields():
    offer = {"title": "Alternant Dev", "company": "Acme"}
    text = offer_to_text(offer)
    assert "Alternant Dev" in text
    assert "Acme" in text


def test_offer_to_text_handles_none_fields():
    offer = {
        "title": "Alternant",
        "company": "Corp",
        "location": None,
        "tags": None,
        "description": None,
    }
    text = offer_to_text(offer)
    assert "Alternant" in text
