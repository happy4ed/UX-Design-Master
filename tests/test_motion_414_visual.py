"""Rendered-frame audit for every vocabulary motion, not only WAAPI existence."""
import asyncio
import io
import os
from PIL import Image, ImageChops
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8000/UX-Design-Master/samples/motion-414-lab.html"


async def frame(page, fraction):
    await page.evaluate(
        """fraction => {
          for(const animation of document.querySelector('#stage').getAnimations({subtree:true})){
            animation.pause();
            const timing=animation.effect.getTiming();
            animation.currentTime=timing.delay+timing.duration*fraction;
          }
        }""",
        fraction,
    )
    await page.wait_for_timeout(20)
    return Image.open(io.BytesIO(await page.locator("#stage").screenshot())).convert("RGB")


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto(URL, wait_until="networkidle")
        ids = await page.evaluate("window.motion414.entries.map(x=>x.id)")
        selected = os.environ.get("MOTION_IDS")
        if selected:
            ids = [motion_id.strip() for motion_id in selected.split(",") if motion_id.strip()]
        failures = []
        for position, entry_id in enumerate(ids, 1):
            await page.evaluate("id=>window.motion414.select(id)", entry_id)
            first = await frame(page, 0.01)
            middle = await frame(page, 0.72)
            difference = ImageChops.difference(first, middle)
            if difference.getbbox() is None:
                failures.append(entry_id)
            if position % 80 == 0:
                print(f"visual audit: {position}/{len(ids)}", flush=True)
        assert not failures, f"no rendered change: {failures}"
        assert not errors, errors
        await browser.close()
    print(f"motion 414 visual: PASS ({len(ids)} start/mid frame pairs changed)")


if __name__ == "__main__":
    asyncio.run(main())
