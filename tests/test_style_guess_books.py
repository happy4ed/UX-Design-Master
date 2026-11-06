"""Browser smoke test for all inferred style reference books."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
STYLES = json.loads((ROOT / "references/style-book/guess-presets.json").read_text())["styles"]
URL = "http://127.0.0.1:8000/UX-Design-Master/samples/style-guess-books.html"

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto(URL)
    page.locator("#componentRows tr").first.wait_for()
    assert page.locator("#style option").count() == len(STYLES)
    for style in STYLES:
        page.locator("#style").select_option(style)
        assert page.locator("#componentRows tr").count() == 13, style
        assert page.locator("#motionRows tr").count() == 5, style
        assert page.locator(".motion-card").count() == 5, style
        assert page.locator("#board").get_attribute("src") == f"style-book-component-board.html?style={style}"
        names = set()
        for index in range(5):
            page.locator(f"[data-play='{index}']").click()
            stage = page.locator(".motion-stage").nth(index)
            assert "go" in stage.get_attribute("class")
            name = stage.locator(".motion-target").evaluate("el => getComputedStyle(el).animationName")
            assert name != "none", (style, index, name)
            names.add(name)
        assert len(names) == 5, (style, names)
    page.locator("#style").select_option("scroll-3d")
    assert page.locator("#scroll3d-demo").is_visible()
    before = page.locator(".space-object").evaluate("el => getComputedStyle(el).transform")
    page.locator(".space-scroll").evaluate("el => el.scrollTop = 450")
    page.wait_for_function("document.querySelector('.space-readout').textContent !== '진행 0%'")
    after = page.locator(".space-object").evaluate("el => getComputedStyle(el).transform")
    assert before != after, "Scroll 3D scene did not respond to scroll"
    page.locator("#style").select_option("origami-paper")
    page.emulate_media(reduced_motion="reduce")
    page.locator("[data-play='0']").click()
    target = page.locator(".motion-stage").first.locator(".motion-target")
    assert target.evaluate("el => getComputedStyle(el).animationName") == "none"
    page.locator("#forceMotion").click()
    page.locator("[data-play='0']").click()
    assert target.evaluate("el => getComputedStyle(el).animationName") != "none"
    page.frame_locator("#board").locator("body.force-motion").wait_for()
    page.emulate_media(reduced_motion="no-preference")
    page.screenshot(path="/tmp/style-guess-books-desktop.png", full_page=True)
    page.set_viewport_size({"width": 390, "height": 844})
    assert not page.evaluate("document.documentElement.scrollWidth > innerWidth")
    page.screenshot(path="/tmp/style-guess-books-mobile.png", full_page=True)
    page.goto("http://127.0.0.1:8000/UX-Design-Master/samples/style-readiness-audit.html")
    page.locator("#rows tr").first.wait_for()
    assert page.locator("#rows tr").count() == len(STYLES)
    assert "guess" in page.locator("#rows tr").first.inner_text()
    print(f"PASS: {len(STYLES)} styles × 13 component rows × 5 distinct motion scenes, 390px layout, audit {len(STYLES)} rows")
    browser.close()
