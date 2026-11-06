#!/usr/bin/env python3
"""Exercise reference-screen sliders at slow/fast drag, tap and both ends."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "samples" / "style-book-reference-screen.html"
OUT = ROOT / "samples" / "style-book-drag-test.json"


def main() -> None:
    rows = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(HTML.as_uri())
        for style in ("oneui", "material", "ios", "hifi"):
            control = page.locator(f'.phone[data-style="{style}"] .volume-row input')
            control.scroll_into_view_if_needed()
            box = control.bounding_box()
            if not box:
                raise RuntimeError(f"no slider bounding box: {style}")
            y = box["y"] + box["height"] / 2
            left = box["x"] + 8
            right = box["x"] + box["width"] - 8
            page.mouse.click(left, y)
            tapped = int(control.input_value())
            page.mouse.move(left, y)
            page.mouse.down()
            page.mouse.move(right, y, steps=24)
            page.mouse.up()
            slow = int(control.input_value())
            page.mouse.move(right, y)
            page.mouse.down()
            page.mouse.move(left, y, steps=2)
            page.mouse.up()
            fast = int(control.input_value())
            page.mouse.click(right, y)
            end = int(control.input_value())
            ok = tapped < slow and fast < slow and end > fast
            rows.append({"style": style, "tap_near_start": tapped, "slow_to_end": slow, "fast_to_start": fast, "tap_near_end": end, "pass": ok})
        browser.close()
    OUT.write_text(json.dumps({"status": "PASS" if all(r["pass"] for r in rows) else "FAIL", "rows": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(OUT)
    print("PASS" if all(r["pass"] for r in rows) else "FAIL", rows)


if __name__ == "__main__":
    main()
