from __future__ import annotations

import re
import sys
from pathlib import Path


def _extract_pdf(path: Path) -> str:
    try:
        from pdfminer.high_level import extract_text
    except ImportError:
        raise ImportError("pip install pdfminer.six")
    return extract_text(str(path))


def _extract_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def _clean(text: str) -> str:
    # Collapse whitespace, remove control chars
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"[^\S\n]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def cv_to_text(cv_path: str | Path) -> str:
    """Return cleaned plain text from a PDF or TXT CV."""
    path = Path(cv_path)
    if not path.exists():
        raise FileNotFoundError(f"CV not found: {path}")
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        raw = _extract_pdf(path)
    elif suffix in (".txt", ".md"):
        raw = _extract_txt(path)
    else:
        raise ValueError(f"Unsupported format: {suffix} (use .pdf or .txt)")
    return _clean(raw)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python cv_to_md.py <cv.pdf|cv.txt>")
        sys.exit(1)
    print(cv_to_text(sys.argv[1]))
