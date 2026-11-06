"""Visual regression for the iOS Liquid Glass study, including actual refraction."""

from __future__ import annotations

import os
from pathlib import Path

from PIL import ImageChops, ImageStat
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get("UXDM_STYLE_URL", "http://127.0.0.1:8000/UX-Design-Master/samples/")
OUT = ROOT / "samples/style-book-renders"


def main() -> None:
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for surface, suffix in (("style-book-component-board.html?style=ios-27", "component"), ("style-book-reference-screen.html?style=ios", "reference")):
            for light in (False, True):
                page = browser.new_page(viewport={"width": 390, "height": 950}, device_scale_factor=1)
                page.goto(URL + surface, wait_until="networkidle")
                if light:
                    page.locator("#scheme").click()
                lens = page.locator(".ios-liquid-lens").first
                assert lens.is_visible(), (surface, light)
                assert "ios-liquid-refraction" in lens.evaluate('e => getComputedStyle(e, "::before").filter')
                assert "blur(" in lens.evaluate("e => getComputedStyle(e).backdropFilter")
                page.locator(".phone.ios").screenshot(path=str(OUT / f"ios-{suffix}-phone-{'light' if light else 'dark'}.png"))
                before = lens.screenshot(path=str(OUT / f"ios-{suffix}-{'light' if light else 'dark'}.png"))
                page.add_style_tag(content=".ios .ios-liquid-lens::before{filter:none!important}")
                after = lens.screenshot()
                from io import BytesIO
                from PIL import Image

                delta = ImageStat.Stat(ImageChops.difference(Image.open(BytesIO(before)).convert("RGB"), Image.open(BytesIO(after)).convert("RGB"))).mean
                assert max(delta) > 0.8, (surface, light, delta)
                phone = page.locator(".phone.ios")
                assert phone.evaluate("e => e.scrollWidth <= e.clientWidth + 1"), (surface, light)
                if suffix == "component":
                    page.emulate_media(reduced_motion="no-preference")
                    start_width = lens.bounding_box()["width"]
                    lens.click()
                    page.wait_for_timeout(170)
                    middle_width = lens.bounding_box()["width"]
                    page.locator(".ios-glass-scene").screenshot(path=str(OUT / f"ios-motion-middle-{'light' if light else 'dark'}.png"))
                    page.wait_for_timeout(430)
                    end_width = lens.bounding_box()["width"]
                    assert end_width < middle_width < start_width, (start_width, middle_width, end_width)
                    assert page.locator("#iosGlassActions").get_attribute("aria-hidden") == "false"
                    assert page.locator("#iosGlassActions button").first.get_attribute("tabindex") == "0"
                    action_rects = [button.bounding_box() for button in page.locator("#iosGlassActions button").all()]
                    assert all(abs(rect["width"] - 48) < 0.2 and abs(rect["height"] - 48) < 0.2 for rect in action_rects), action_rects
                    assert lens.bounding_box()["x"] + end_width + 7 <= action_rects[0]["x"], (lens.bounding_box(), action_rects)
                    lens.click()
                    page.wait_for_timeout(550)
                    assert abs(lens.bounding_box()["width"] - start_width) < 1
                    tabset = page.locator(".tabset")
                    initial = tabset.evaluate('e => getComputedStyle(e, "::before").transform')
                    tabset.locator("button").nth(1).click()
                    page.wait_for_timeout(520)
                    moved = tabset.evaluate('e => getComputedStyle(e, "::before").transform')
                    assert moved != initial, (initial, moved)
                    page.set_viewport_size({"width": 320, "height": 950})
                    lens.click()
                    page.wait_for_timeout(550)
                    narrow_lens = lens.bounding_box()
                    narrow_actions = [button.bounding_box() for button in page.locator("#iosGlassActions button").all()]
                    assert all(abs(rect["width"] - 48) < 0.2 and abs(rect["height"] - 48) < 0.2 for rect in narrow_actions), narrow_actions
                    assert narrow_lens["x"] + narrow_lens["width"] + 7 <= narrow_actions[0]["x"], (narrow_lens, narrow_actions)
                    assert phone.evaluate("e => e.scrollWidth <= e.clientWidth + 1")
                    lens.click()
                    page.wait_for_timeout(550)
                    page.set_viewport_size({"width": 1280, "height": 950})
                    page.locator("#width").click()
                    lens.click()
                    page.wait_for_timeout(550)
                    fold_rects = [button.bounding_box() for button in page.locator("#iosGlassActions button").all()]
                    assert all(abs(rect["width"] - rect["height"]) < 0.2 for rect in fold_rects), fold_rects
                page.close()
        browser.close()
    print("PASS iOS glass: visible refraction in light/dark; expand/absorb and selection motion; no horizontal overflow")


if __name__ == "__main__":
    main()
