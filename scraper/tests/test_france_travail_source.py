from scraper.sources.france_travail_rss import _map_france_travail_json_item
from scraper.sources.france_travail_rss import _fetch_from_json_api


def test_map_france_travail_json_item() -> None:
    apply_url = (
        "https://labonnealternance.apprentissage.beta.gouv.fr/recherche"
    )
    payload = {
        "workplace": {
            "name": "DIRECTION INTERMINISTERIELLE DU NUMERIQUE (DINUM)",
            "location": {"address": "20 AVENUE DE SEGUR 75007 PARIS"},
        },
        "apply": {
            "url": apply_url,
        },
        "contract": {"duration": 12},
        "offer": {
            "title": "Developpeur web",
            "publication": {"creation": "2024-07-23T13:23:01.000Z"},
        },
    }
    mapped = _map_france_travail_json_item(payload)
    assert mapped["title"] == "Developpeur web"
    assert mapped["company"].startswith("DIRECTION INTERMINISTERIELLE")
    assert mapped["location"] == "Paris"
    assert mapped["source_url"].startswith(
        "https://labonnealternance.apprentissage.beta.gouv.fr"
    )
    assert mapped["published_at"] == "2024-07-23T13:23:01.000Z"
    assert mapped["duration"] == "12"


def test_fetch_supports_jobs_envelope(monkeypatch) -> None:
    class DummyResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def read(self):
            payload = (
                '{"jobs":[{"workplace":{"name":"DINUM"},'
                '"offer":{"title":"Analyste SOC",'
                '"publication":{"creation":"2024-01-01T00:00:00Z"}},'
                '"apply":{"url":"https://example.org/job"},'
                '"contract":{"duration":12}}]}'
            )
            return (
                payload.encode("utf-8")
            )

    monkeypatch.setenv("FRANCE_TRAVAIL_API_URL", "https://example.org/api")
    monkeypatch.setattr(
        "scraper.sources.france_travail_rss.urlopen",
        lambda req, timeout=30, context=None: DummyResponse(),
    )

    entries = _fetch_from_json_api()
    assert len(entries) == 1
    assert entries[0]["title"] == "Analyste SOC"
