"""Browser regression for the motion review page, including reduced-motion systems."""
import asyncio
import os
from playwright.async_api import async_playwright


URL = os.environ.get(
    "MOTION_PREVIEW_URL",
    "http://127.0.0.1:8000/UX-Design-Master/samples/component-motion-review.html#effectGallery",
)


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto(URL, wait_until="networkidle")
        assert await page.locator(".effect-card").count() == 48
        assert await page.locator(".feel-sample").count() == 9
        assert await page.locator("#strength option").count() == 6
        assert await page.locator("#previewOverride").is_checked()
        await page.wait_for_timeout(150)
        active = await page.evaluate("document.getAnimations().filter(a => a.playState === 'running').length")
        assert active >= 58, f"preview did not animate under reduced-motion: {active}"
        await page.locator("#strength").select_option("dramatic")
        await page.locator("#feel").select_option("elastic")
        assert await page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--effect-distance').trim()") == "96px"
        assert await page.evaluate("document.documentElement.dataset.motionFeel") == "elastic"
        await page.locator("#previewOverride").uncheck()
        await page.wait_for_timeout(100)
        assert await page.evaluate("document.getAnimations().filter(a => a.playState === 'running').length") == 0
        await page.locator("#previewOverride").check()
        await page.locator("#strength").select_option("static")
        await page.wait_for_timeout(100)
        assert await page.evaluate("document.getAnimations().filter(a => a.playState === 'running').length") == 0
        assert not errors, errors
        await browser.close()
    print("motion preview: PASS (48 effects, 9 feels, 6 strengths, reduced-motion override)")


if __name__ == "__main__":
    asyncio.run(main())
