"""Measure real browser clipping and action-row geometry after interaction."""

import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]


async def check():
    source = (ROOT / "assets/layout/runtime-content-audit.mjs").read_text(encoding="utf-8")
    source = source.replace("export function auditRuntimeContent", "window.auditRuntimeContent = function auditRuntimeContent")
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.set_content("""<style>
          #amount { width: 72px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          #note { width: 72px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          #actions { display: flex; width: 180px; }
          #actions button { width: 110px; flex: none; }
          #actions button + button { margin-left: -12px; }
        </style>
        <div id='amount' data-information-id='amount' data-content-critical>123,456,789원</div>
        <div id='note' data-information-id='note' data-content-supporting data-full-content-target='note-detail'>Long supporting explanation</div>
        <div id='actions' data-action-group><button id='save'>Save</button><button id='cancel'>Cancel</button></div>
        <button id='expand' onclick="document.querySelector('#amount').style.width='220px'">Expand</button>""")
        await page.add_script_tag(content=source)
        first = await page.evaluate("auditRuntimeContent()")
        codes = {row["code"] for row in first}
        assert "CRITICAL_CONTENT_CLIPPED" in codes
        assert "ACTION_HIT_OVERLAP" in codes
        assert "SUPPORTING_CONTENT_NO_FULL_PATH" not in codes
        row = next(row for row in first if row["code"] == "ACTION_ROW_REVIEW")
        assert row["count"] == 2 and row["minGapPx"] < 0
        await page.locator("#expand").click()
        second = await page.evaluate("auditRuntimeContent()")
        assert "CRITICAL_CONTENT_CLIPPED" not in {row["code"] for row in second}
        await browser.close()
    print("runtime content and action geometry: PASS")


if __name__ == "__main__":
    asyncio.run(check())
