"""End-to-end checks for the internal One UI style motion lab."""

import asyncio
import os
from playwright.async_api import async_playwright

URL = os.environ.get(
    "ONEUI9_MOTION_LAB_URL",
    "http://127.0.0.1:8000/UX-Design-Master/samples/oneui9-motion-lab.html",
)


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 850}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        await page.goto(URL, wait_until="networkidle")
        await page.screenshot(path="/tmp/oneui9-motion-updated.png")
        assert await page.locator(".motion-card").count() == 43
        assert await page.locator(".inventory details").count() == 14, errors
        assert await page.locator(".inventory-term").count() == 414
        assert await page.locator("#speed").input_value() == "0.7"
        assert "1.13초" in await page.locator("#decision").inner_text()
        assert await page.locator("#phoneTitle").inner_text() == "설정"
        assert await page.locator(".phone-inner").evaluate("el => getComputedStyle(el).backgroundColor") == "rgb(243, 239, 238)"
        assert await page.locator(".phone-title h2").evaluate("el => getComputedStyle(el).color") == "rgb(66, 34, 195)"
        assert await page.locator(".motion-card").first.evaluate("el => getComputedStyle(el).borderTopLeftRadius") == "0px"
        assert await page.locator(".top .eyebrow").evaluate("el => getComputedStyle(el).display") == "none"
        assert "r1.community.samsung.com" in await page.locator(".gt-evidence a").get_attribute("href")
        assert await page.evaluate("fetch('../knowledge/motion-taxonomy.json').then(r=>r.json()).then(j=>j.total)") == 414
        await page.locator("#inventorySearch").fill("로고 선 따라 그리기")
        await page.locator(".inventory-term").click()
        assert "구현 후보" in await page.locator("#knowledgeDetail").inner_text()
        await page.locator("#inventorySearch").fill("")
        assert await page.locator("#reduce").get_attribute("aria-pressed") == "false"
        active = await page.evaluate("""async () => {
          for(let i=0;i<25;i++){
            if(document.getAnimations().some(a=>a.playState==='running')) return true;
            await new Promise(r=>setTimeout(r,100));
          }
          return false;
        }""")
        assert active, "preview never animated with system reduced-motion setting"

        # The reduced-motion route must keep the final state of every recipe.
        await page.locator("#reduce").click()
        ids = await page.locator(".motion-card").evaluate_all("nodes => nodes.map(n => n.dataset.id)")
        for recipe_id in ids:
            await page.locator(f'.motion-card[data-id="{recipe_id}"]').click()
            await page.wait_for_timeout(12)
            assert (await page.locator("#stage").inner_text()).strip(), recipe_id
        await page.locator('.motion-card[data-id="switch"]').click()
        await page.wait_for_timeout(40)
        assert await page.locator("#demoTrigger").get_attribute("aria-checked") == "true"
        await page.locator('.motion-card[data-id="progress"]').click()
        await page.wait_for_timeout(40)
        assert await page.locator("#dataValue").inner_text() == "76%"

        # Normal animation must reach its end state rather than only changing labels.
        await page.locator("#reduce").click()
        await page.locator('.motion-card[data-id="sheet"]').click()
        await page.wait_for_timeout(90)
        active = await page.locator("#stage").evaluate("el => el.getAnimations({subtree:true}).filter(a => a.playState === 'running').length")
        assert active >= 1, "sheet never entered an animated mid-frame"
        timing = await page.locator(".sheet").evaluate("el => el.getAnimations()[0].effect.getTiming().duration")
        assert abs(timing - (360 * 2.2 / 0.7)) < 1, timing
        await page.wait_for_function("document.querySelector('#playState').textContent.includes('재생 완료')")
        transform = await page.locator(".sheet").evaluate("el => getComputedStyle(el).transform")
        assert transform in ("none", "matrix(1, 0, 0, 1, 0, 0)"), transform
        await page.locator("#speed").evaluate("el => {el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}))}")
        assert "0.79초" in await page.locator("#decision").inner_text()
        assert await page.locator("#speedValue").inner_text() == "1.00×"
        await page.locator('.motion-card[data-id="line"]').click()
        await page.wait_for_function("document.querySelector('#playState').textContent.includes('재생 완료')")
        offset = await page.locator(".data-svg path.line").evaluate("el => getComputedStyle(el).strokeDashoffset")
        assert offset == "0px", offset

        await page.set_viewport_size({"width": 320, "height": 780})
        await page.wait_for_timeout(50)
        overflow = await page.evaluate("document.documentElement.scrollWidth > innerWidth")
        assert not overflow, "horizontal overflow at 320px"
        assert not errors, errors
        await browser.close()
    print("oneui9 motion lab: PASS (43 recipes, 14 top-level groups, 414 vocabulary, normal/reduced, 320px)")


if __name__ == "__main__":
    asyncio.run(main())
