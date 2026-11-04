"""Browser regression for anchored pins, disclosure, feedback, and responsive reports."""

import asyncio
import functools
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.async_api import async_playwright

from test_app_review_report import fixture

import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from render_app_review_report import render  # noqa: E402


async def check(directory, base_url):
    data = fixture(directory)
    (directory / "evidence.html").write_text(render(data, directory), encoding="utf-8")
    data["stage"] = "recommendations"
    data["findings"][0]["recommendations"] = [{"id": "A", "title": "금액 영역", "reason": "전체 표시", "tradeoff": "행 높이 변화", "previewScreenshot": "proposal.png"}]
    (directory / "recommendations.html").write_text(render(data, directory), encoding="utf-8")
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto(base_url + "/evidence.html")
        image = await page.locator(".shot img").bounding_box()
        mark = await page.locator(".issue-box").bounding_box()
        scale = image["width"] / 390
        assert abs(mark["x"] - (image["x"] + 300 * scale)) < 1, (image, mark)
        assert abs(mark["y"] - (image["y"] + 220 * scale)) < 1, (image, mark)
        assert await page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
        await page.locator("#pin-1").click()
        assert await page.locator("#finding-1").evaluate("element => element.open")
        await page.locator("#decision-1").select_option("accept")
        await page.locator("#feedback-1").fill("금액을 전부 보여줘")
        await page.locator("#finding-1 .save-feedback").click()
        await page.goto(base_url + "/recommendations.html")
        assert await page.locator("#feedback-1").input_value() == "금액을 전부 보여줘"
        assert await page.locator(".recommendation-image").count() == 1
        await page.locator("#pin-1").focus()
        await page.keyboard.press("Enter")
        assert await page.locator("#finding-1").evaluate("element => element.open")
        tiny = await page.evaluate("""() => [...document.querySelectorAll('body *')].filter(el => el.children.length === 0 && el.textContent.trim() && parseFloat(getComputedStyle(el).fontSize) < 13).map(el => ({tag:el.tagName,text:el.textContent.trim(),size:getComputedStyle(el).fontSize}))""")
        assert tiny == [], tiny[:8]
        await page.set_viewport_size({"width": 1440, "height": 900})
        assert await page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
        await page.emulate_media(reduced_motion="reduce")
        await page.locator("#pin-1").click()
        duration = await page.locator("#finding-1 .detail").evaluate("element => getComputedStyle(element).animationDuration")
        assert duration != "0.3s", duration
        await browser.close()


def main():
    with tempfile.TemporaryDirectory() as folder:
        directory = Path(folder)
        handler = functools.partial(SimpleHTTPRequestHandler, directory=str(directory))
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            asyncio.run(check(directory, f"http://127.0.0.1:{server.server_port}"))
        finally:
            server.shutdown()
            thread.join()
    print("app review report browser: PASS")


if __name__ == "__main__":
    main()
