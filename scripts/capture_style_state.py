#!/usr/bin/env python3
"""Capture one visible web UI state and computed style evidence outside the skill bundle."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
COLLECTOR = (ROOT / "assets/layout/capture-design-evidence.mjs").read_text(encoding="utf-8").replace(
    "export function captureDesignEvidence", "function captureDesignEvidence", 1
)


def collect(page, root_selector: str, limit: int, state: dict) -> dict:
    return page.evaluate(
        """({source, rootSelector, limit, state}) => {
          const root = document.querySelector(rootSelector);
          if (!root) throw new Error('root selector not found: ' + rootSelector);
          return new Function('root', 'limit', 'state', source + '; return captureDesignEvidence(root, limit, state)')(root, limit, state);
        }""",
        {"source": COLLECTOR, "rootSelector": root_selector, "limit": limit, "state": state},
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True)
    parser.add_argument("--out", type=Path, required=True, help="JSON output outside the distributed skill")
    parser.add_argument("--root", default="body", help="CSS selector of the screen or component to inspect")
    parser.add_argument("--state", required=True, help="Name of the captured interaction state")
    parser.add_argument("--width", type=int, required=True)
    parser.add_argument("--height", type=int, required=True)
    parser.add_argument("--dpr", type=float, default=1.0)
    parser.add_argument("--color-scheme", choices=("light", "dark", "no-preference"), default="no-preference")
    parser.add_argument("--click", action="append", default=[], help="Read-only UI control selector; repeat in action order")
    parser.add_argument("--wait-ms", type=int, default=0)
    parser.add_argument("--limit", type=int, default=3000)
    args = parser.parse_args()
    if urlparse(args.url).scheme not in {"http", "https", "file"}:
        parser.error("--url must be http(s) or file://")
    if min(args.width, args.height, args.limit, args.dpr) <= 0 or args.wait_ms < 0:
        parser.error("width, height, DPR and limit must be positive; wait-ms cannot be negative")
    output = args.out.resolve()
    image = output.with_suffix(".png")
    output.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": args.width, "height": args.height}, device_scale_factor=args.dpr,
                                color_scheme=args.color_scheme)
        page.goto(args.url, wait_until="domcontentloaded")
        page.locator(args.root).wait_for(state="visible")
        page.evaluate("async () => { if (document.fonts?.ready) await document.fonts.ready; }")
        for selector in args.click:
            page.locator(selector).click()
        if args.wait_ms:
            page.wait_for_timeout(args.wait_ms)
        evidence = collect(page, args.root, args.limit, {"name": args.state, "actions": args.click})
        page.screenshot(path=str(image), full_page=False)
        report = {"sourceUrl": page.url, "capturedAt": datetime.now(timezone.utc).isoformat(),
                  "screenshot": str(image), "rootSelector": args.root,
                  "viewport": {"width": args.width, "height": args.height},
                  "environment": {"dpr": args.dpr, "colorScheme": args.color_scheme}, "evidence": evidence,
                  "status": "TRUNCATED" if evidence["truncatedNodes"] else "RECORDED",
                  "note": "Computed CSS and geometry are candidates. The screenshot needs human layer, material and motion review."}
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        browser.close()
    print(f"{report['status']} {output} {image} material={evidence['materialCandidateCount']} shape={evidence['shapeCandidateCount']}")


if __name__ == "__main__":
    main()
