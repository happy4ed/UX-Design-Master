#!/usr/bin/env python3
"""Check that the style guidebook renders complete, readable contracts."""

from __future__ import annotations

import os

from playwright.sync_api import sync_playwright


def main() -> None:
    url = os.environ.get("UXDM_GUIDEBOOK_URL", "http://127.0.0.1:8000/UX-Design-Master/samples/style-guidebook.html")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for width in (390, 1280):
            page = browser.new_page(viewport={"width": width, "height": 850})
            page.goto(url)
            page.locator("#stats .stat").first.wait_for()
            assert page.locator("#nav button").count() == 26
            assert page.locator("#tabs button").count() == 12
            page.locator("#overviewTable tr").nth(26).wait_for(state="attached")
            assert page.locator("#overviewTable tr").count() == 27
            assert "One UI 9" in page.locator("#title").inner_text()
            page.locator('#tabs button[data-tab="E"]').click()
            assert "슬라이더" in page.locator("#panels").inner_text()
            assert page.locator(".links a").filter(has_text="컴포넌트·모션 샘플").get_attribute("href") == "style-guess-books.html?style=oneui-9"
            assert page.locator(".sample-links a").count() == 2
            assert page.locator(".sample-links a").nth(0).get_attribute("href") == "style-book-component-board.html?style=oneui-9"
            assert page.locator(".sample-links a").nth(1).get_attribute("href") == "style-guess-books.html?style=oneui-9#motion-demo"
            slider = page.locator('.row-sample-link[aria-label="슬라이더 시연 보기"]')
            assert slider.get_attribute("href") == "style-book-component-board.html?style=oneui-9#component-sliders"
            slider.click()
            assert page.locator("#component-sliders").is_visible()
            assert page.locator("#style").input_value() == "oneui-9"
            page.goto(url)
            page.locator('#tabs button[data-tab="G"]').click()
            assert page.locator('.row-sample-link[aria-label="화면 전환 시연 보기"]').get_attribute("href") == "style-guess-books.html?style=oneui-9#motion-4"
            page.locator('#tabs button[data-tab="E"]').click()
            page.goto(url + "?style=scroll-3d")
            page.locator('#tabs button[data-tab="E"]').click()
            page.wait_for_function("document.querySelector('.sample-links a')?.getAttribute('href') === 'style-book-component-board.html?style=scroll-3d'")
            page.locator(".sample-links a").first.click()
            assert page.locator("#style").input_value() == "scroll-3d"
            assert page.locator("#phone").get_attribute("class") == "phone scroll-3d"
            page.goto(url + "?style=scroll-3d")
            page.locator('#tabs button[data-tab="G"]').click()
            page.locator(".sample-links a").nth(1).click()
            assert page.locator("#style").input_value() == "scroll-3d"
            assert page.locator(".motion-card").count() == 5
            page.goto(url)
            page.locator('#tabs button[data-tab="E"]').click()
            first_table = page.locator("#panels .md table").first
            assert first_table.locator("thead th").count() == first_table.locator("tbody tr").first.locator("td").count()
            if width == 1280:
                page.locator("#panels .table-scroll").first.screenshot(path="/tmp/uxdm-guidebook-table-before.png")
            page.locator("#compare").select_option("ios-27")
            page.locator("#panels > .panel").nth(1).wait_for()
            assert page.locator("#panels > .panel").count() == 2
            assert "iOS 27" in page.locator("#panels > .panel").last.inner_text()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f"horizontal overflow at {width}"
            if width == 1280:
                page.screenshot(path="/tmp/uxdm-style-guidebook-review.png")
                page.locator("#compare").select_option("")
                for index in range(26):
                    button = page.locator("#nav button").nth(index)
                    expected = button.inner_text().splitlines()[0]
                    button.click()
                    page.wait_for_function("(name) => document.querySelector('#title').textContent === name", arg=expected)
                    assert "A–L 12/12절" in page.locator("#stats").inner_text()
                    page.locator('#tabs button[data-tab="E"]').click()
                    assert "E.1. 글꼴·아이콘·슬라이더 결정" in page.locator("#panels").inner_text()
                for style in ("bento-grid", "dark-tech", "kinetic-typography", "scroll-3d", "grainy-gradient", "retro-pixel", "swiss-grid"):
                    page.goto(url + "?style=" + style)
                    page.locator('#tabs button[data-tab="B"]').click()
                    assert page.locator("#panels .md a[href^='https://']").count() >= 1, style
                    assert "현재 샘플의 차이" in page.locator("#panels").inner_text(), style
                    if style == "bento-grid":
                        page.screenshot(path="/tmp/uxdm-bento-reference-guide.png")
            page.close()
        preview = browser.new_page(viewport={"width": 1440, "height": 900})
        preview.goto(url.replace("style-guidebook.html", "style-book-reference-screen.html?style=material"))
        track = preview.locator(".material .scrub").evaluate("e => getComputedStyle(e).getPropertyValue('--track-h').trim()")
        assert track == "16px", track
        assert preview.locator(".material .play svg").count() == 1
        preview.close()
        browser.close()
    print("PASS guidebook: 26 guides, 12 sections, component/motion links, comparison, 390/1280 width")


if __name__ == "__main__":
    main()
