#!/usr/bin/env python3
"""Share the sample's style rules with its component coverage board."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / "samples"
HTML = ROOT / "style-book-reference-screen.html"
CSS = ROOT / "style-book-core.css"


def main() -> None:
    body = HTML.read_text(encoding="utf-8")
    blocks = re.findall(r"<style>\s*(.*?)\s*</style>", body, flags=re.S)
    if not blocks:
        print(f"already external: {CSS}")
        return
    if len(blocks) != 2:
        raise SystemExit(f"expected two style blocks, found {len(blocks)}")
    CSS.write_text("\n\n".join(blocks) + "\n", encoding="utf-8")
    body = re.sub(r"<style>\s*.*?\s*</style>", '<link rel="stylesheet" href="style-book-core.css">', body, count=1, flags=re.S)
    body = re.sub(r"<style>\s*.*?\s*</style>", "", body, count=1, flags=re.S)
    HTML.write_text(body, encoding="utf-8")
    print(f"shared {CSS} between reference screen and component board")


if __name__ == "__main__":
    main()
