"""Use the style evidence collector in a real browser on a material and shape state."""

from __future__ import annotations

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get("UXDM_COMPONENT_BOARD_URL", "http://127.0.0.1:8000/UX-Design-Master/samples/style-book-component-board.html")
SOURCE = (ROOT / "assets/layout/capture-design-evidence.mjs").read_text(encoding="utf-8").replace("export function captureDesignEvidence", "function captureDesignEvidence")


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 950})
        page.goto(URL + "?style=ios-27", wait_until="networkidle")
        page.locator("#iosLens").click()
        page.wait_for_timeout(550)
        result = page.evaluate("source => new Function(source + '; return captureDesignEvidence(document.querySelector(\"#phone\"), 3000, {style:\"ios-27\", state:\"open\"})')()", SOURCE)
        assert result["truncatedNodes"] == 0
        assert any("ios-liquid-refraction" in str(item["pseudo"]) for item in result["materialCandidates"])
        circles = [item for item in result["shapeCandidates"] if item["declaredShape"] == "circle"]
        assert len(circles) == 2, circles
        assert all(abs(item["width"] - item["height"]) < 1 and item["width"] >= 48 for item in circles), circles
        browser.close()
    print("PASS live style evidence: refractive pseudo-element and two rendered circles recorded")


if __name__ == "__main__":
    main()
