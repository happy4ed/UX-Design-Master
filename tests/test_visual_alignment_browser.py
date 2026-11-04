"""Real browser regression: equal icon boxes can hide different visible drawings."""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]


async def check():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto((ROOT / "tests/fixtures/visual-alignment-measurement.html").as_uri())
        source = (ROOT / "assets/layout/visual-alignment-audit.mjs").read_text()
        await page.add_script_tag(content=source.replace("export function measureVisualAlignment", "function measureVisualAlignment") + "\nwindow.measureVisualAlignment=measureVisualAlignment;")
        result = await page.evaluate("() => window.measureVisualAlignment(document)")
        groups = {row["id"]: row for row in result["groups"]}
        icons = groups["icons"]["comparison"]
        assert icons["boxCenterYSpreadPx"] == 0, icons
        assert icons["drawnWidthRatioSpread"] > 0.3, icons
        assert icons["primitiveInkAreaRatioSpread"] > 0.3, icons
        assert groups["lines"]["entries"][0]["drawnBounds"]["height"] >= 24
        assert groups["labels"]["comparison"]["firstLineInsetSpreadPx"] >= 8
        assert groups["labels"]["comparison"]["fontSizes"] == ["16px", "18px"]
        assert len(groups["surfaces"]["comparison"]["radiusRatios"]) == 2
        assert result["markerRows"][1]["gapPx"] - result["markerRows"][0]["gapPx"] >= 12
        assert "수치 차이만으로 FAIL/PASS" in result["note"]
        await browser.close()


def main():
    asyncio.run(check())
    print("visible icon, text, marker, and radius measurements: PASS")


if __name__ == "__main__":
    main()
