from scraper.deduplicator import offer_hash


def test_offer_hash_is_deterministic() -> None:
    first = offer_hash("Analyste SOC alternance", "Acme")
    second = offer_hash("Analyste SOC alternance", "Acme")
    assert first == second


def test_offer_hash_normalizes_case_and_spaces() -> None:
    first = offer_hash(" Analyste SOC ", " ACME ")
    second = offer_hash("analyste soc", "acme")
    assert first == second
