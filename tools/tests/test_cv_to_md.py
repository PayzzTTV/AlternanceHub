from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cv_to_md import _clean, cv_to_text


def test_clean_collapses_whitespace():
    assert _clean("hello   world") == "hello world"


def test_clean_collapses_blank_lines():
    assert _clean("a\n\n\n\nb") == "a\n\nb"


def test_clean_strips():
    assert _clean("  hello  ") == "hello"


def test_cv_to_text_txt(tmp_path: Path):
    cv = tmp_path / "cv.txt"
    cv.write_text("Python  Cybersécurité\n\nSOC analyst")
    text = cv_to_text(cv)
    assert "Python" in text
    assert "Cybersécurité" in text


def test_cv_to_text_missing_file():
    import pytest
    with pytest.raises(FileNotFoundError):
        cv_to_text("/nonexistent/cv.pdf")


def test_cv_to_text_unsupported_format(tmp_path: Path):
    import pytest
    f = tmp_path / "cv.docx"
    f.write_text("test")
    with pytest.raises(ValueError):
        cv_to_text(f)
