#!/usr/bin/env python3
"""Check component coverage and interactions across all style previews."""

from __future__ import annotations

import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DETAILS = json.loads((ROOT / "references/style-book/detail-decisions.json").read_text())
URL = os.environ.get("UXDM_COMPONENT_BOARD_URL", "http://127.0.0.1:8000/UX-Design-Master/samples/style-book-component-board.html")
REQUIRED = {"appbar", "search", "tabs", "buttons", "chips", "choices", "sliders", "list", "card", "progress", "feedback", "states", "navigation"}


def audit(page) -> dict:
    return page.locator("#phone").evaluate("""root => {
      const shown = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
      const badTargets = [...root.querySelectorAll('button,input[type=search],input[type=range]')].filter(shown).filter(el => {let r=el.getBoundingClientRect();return r.width<48||r.height<48}).map(el=>el.getAttribute('aria-label')||el.textContent.trim());
      const badLabels = [...root.querySelectorAll('.choice label')].filter(el=>el.getBoundingClientRect().height<48).map(el=>el.textContent.trim());
      const smallText = [...root.querySelectorAll('*')].filter(shown).filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(el).fontSize)<14).map(el=>el.textContent.trim().slice(0,20));
      return {badTargets,badLabels,smallText,overflow:root.scrollWidth>root.clientWidth+1,groups:[...root.querySelectorAll('[data-component]')].map(el=>el.dataset.component)};
    }""")


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 900})
        for style in DETAILS:
            page.goto(URL + "?style=" + style)
            page.locator("#phone[data-icon-form]").wait_for()
            page.wait_for_timeout(500)  # Initial style-specific animations must settle before target measurement.
            result = audit(page)
            assert REQUIRED.issubset(result["groups"]), (style, result["groups"])
            assert not (result["badTargets"] or result["badLabels"] or result["smallText"] or result["overflow"]), (style, result)
            if style in {"bento-grid", "dark-tech", "kinetic-typography", "scroll-3d", "grainy-gradient", "retro-pixel", "swiss-grid"}:
                assert page.locator(".style-study").is_visible(), style
                if style in {"bento-grid", "kinetic-typography", "grainy-gradient", "swiss-grid"}:
                    page.locator("#phone").screenshot(path=f"/tmp/uxdm-style-study-{style}.png")
        page.goto(URL + "?style=material-3-expressive")
        page.locator('.tabset button').nth(1).click()
        assert page.locator('.tabset button').nth(1).get_attribute("aria-selected") == "true"
        page.locator('#volume').fill("80")
        assert page.locator('#volumeValue').inner_text() == "80%"
        page.locator('#sheetBtn').click()
        assert page.locator('#sheet').is_visible()
        page.locator('#closeSheet').click()
        assert not page.locator('#sheet').is_visible()
        page.locator('#dialogBtn').click()
        assert page.locator('#dialog').is_visible()
        page.locator('#closeDialog').click()
        assert not page.locator('#dialog').is_visible()
        page.locator('#toastBtn').click()
        assert page.locator('#toast').is_visible()
        page.set_viewport_size({"width": 1280, "height": 900})
        page.locator('#width').click()
        assert not audit(page)["overflow"]
        page.locator("#phone").evaluate("e => e.scrollTop = 0")
        page.screenshot(path="/tmp/uxdm-style-component-board-review.png")
        browser.close()
    print(f"PASS {len(DETAILS)} styles × 13 component groups; targets, text, overflow and interactive states")


if __name__ == "__main__":
    main()
