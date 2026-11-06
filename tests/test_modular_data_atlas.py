#!/usr/bin/env python3
"""Verify the image-derived trial is readable and genuinely interactive."""

from playwright.sync_api import sync_playwright


URL = "http://127.0.0.1:8000/UX-Design-Master/samples/modular-data-atlas.html"


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for width in (390, 768, 1280):
            page = browser.new_page(viewport={"width": width, "height": 900})
            page.goto(URL)
            assert page.locator("#ring-number").inner_text() == "73%"
            assert page.locator("#pixels i").count() == 100
            assert page.locator("#bars button").count() == 4
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f"overflow at {width}"
            tiny = page.evaluate("""() => [...document.querySelectorAll('body *')].filter(e => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 13).map(e => [e.tagName, e.textContent.trim(), getComputedStyle(e).fontSize])""")
            assert not tiny, f"undersized text at {width}: {tiny}"
            page.locator("#tab-weekend").click()
            assert page.locator("#ring-number").inner_text() == "43%"
            assert page.locator("#sum-active").inner_text() == "57%"
            assert page.locator("#stack").get_attribute("aria-label") == "주말 버스 18 철도 25 도보 44 자전거 13"
            page.locator("#bars button[data-item=walk]").click()
            assert "주말 조사 100명 중 44명" in page.locator("#inspect-body").inner_text()
            assert page.evaluate("document.activeElement?.dataset.item") == "walk"
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f"overflow after action at {width}"
            page.screenshot(path=f"/tmp/modular-data-atlas-{width}.png", full_page=True)
            if width == 390:
                page.locator("#tab-weekend").focus()
                page.keyboard.press("ArrowLeft")
                assert page.locator("#ring-number").inner_text() == "73%"
                assert page.evaluate("document.activeElement?.id") == "tab-weekday"
            page.close()
        reduced = browser.new_page(reduced_motion="reduce")
        reduced.goto(URL)
        assert reduced.locator("#bars button").first.evaluate("e => getComputedStyle(e.querySelector('.fill')).transitionDuration") == "0s"
        reduced.close()
        for width in (390, 1280):
            page = browser.new_page(viewport={"width": width, "height": 850})
            page.goto(URL.replace("modular-data-atlas.html", "modular-data-atlas-components.html"))
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            page.get_by_role("switch").click()
            assert page.get_by_role("switch").get_attribute("aria-checked") == "true"
            page.locator("#range").fill("75")
            assert page.locator("#range-value").inner_text() == "75%"
            page.locator("#open-dialog").click()
            assert page.locator("#dialog").is_visible()
            page.keyboard.press("Escape")
            assert not page.locator("#dialog").is_visible()
            page.screenshot(path=f"/tmp/data-atlas-components-{width}.png", full_page=True)
            page.close()
        browser.close()
    print("PASS modular data atlas: 390/768/1280, filters, focus, chart values, reduced motion")


if __name__ == "__main__":
    main()
