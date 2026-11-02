"""Browser regression for keyboard navigation and accessible image viewing."""
import asyncio
import os
from playwright.async_api import async_playwright

URL = os.environ.get(
    "KEYBOARD_PREVIEW_URL",
    "http://127.0.0.1:8000/UX-Design-Master/samples/interaction-keyboard-review.html",
)


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto(URL, wait_until="networkidle")
        assert await page.locator(".thumb").count() == 3

        await page.keyboard.press("Tab")
        assert await page.evaluate("document.activeElement.className") == "jump"
        await page.keyboard.press("Tab")
        assert await page.evaluate("document.activeElement.className") == "thumb"
        await page.keyboard.press("Enter")
        assert await page.locator("#viewer").evaluate("el => el.open")
        assert await page.locator("#viewerCount").inner_text() == "1 / 3"
        assert await page.evaluate("document.activeElement.id") == "closeViewer"
        await page.keyboard.press("ArrowRight")
        assert await page.locator("#viewerCount").inner_text() == "2 / 3"
        assert await page.locator("#viewerImage").get_attribute("alt")
        await page.keyboard.press("ArrowRight")
        assert await page.locator("#viewerCount").inner_text() == "3 / 3"
        assert await page.locator("#nextImage").is_disabled()
        await page.keyboard.press("ArrowLeft")
        assert await page.locator("#viewerCount").inner_text() == "2 / 3"
        for _ in range(5):
            await page.keyboard.press("Tab")
            assert await page.evaluate("document.querySelector('#viewer').contains(document.activeElement) || document.querySelector('#viewer') === document.activeElement"), await page.evaluate("document.activeElement.outerHTML.slice(0,160)")
        await page.keyboard.press("Escape")
        assert not await page.locator("#viewer").evaluate("el => el.open")
        await page.wait_for_function("document.querySelector('#viewer').dataset.focusRestored === 'true'")
        assert await page.evaluate("document.activeElement.className") == "thumb"

        await page.locator("#tab-purpose").focus()
        await page.keyboard.press("ArrowRight")
        assert await page.locator("#tab-keys").get_attribute("aria-selected") == "true"
        assert await page.evaluate("document.activeElement.id") == "tab-keys", await page.evaluate("document.activeElement.outerHTML.slice(0,160)")
        await page.keyboard.press("Tab")
        assert await page.evaluate("document.activeElement.id") == "panel-keys"
        await page.keyboard.press("Shift+Tab")
        assert await page.evaluate("document.activeElement.id") == "tab-keys"
        await page.keyboard.press("Home")
        assert await page.locator("#tab-purpose").get_attribute("aria-selected") == "true"
        await page.locator("#save").focus()
        await page.keyboard.press("Space")
        assert await page.locator("#actionStatus").inner_text() == "저장 실행"
        await page.keyboard.press("Tab")
        assert await page.evaluate("document.activeElement.id") == "share"
        assert not errors, errors
        await browser.close()
    print("keyboard preview: PASS (Tab, Shift+Tab, arrows, Home, Space, Escape, focus return)")


if __name__ == "__main__":
    asyncio.run(main())
