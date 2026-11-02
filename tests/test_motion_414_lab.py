"""Browser proof that every internal motion vocabulary entry has a live scene."""
import asyncio
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8000/UX-Design-Master/samples/motion-414-lab.html"


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 900})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_function("window.motion414?.entries?.length === 414")
        assert await page.locator(".card").count() == 414
        assert await page.locator("#familySelect option").count() == 15
        assert await page.evaluate("window.motion414.ontology.groups.find(x=>x.id==='typography').sourceFamilies.length") == 4
        assert await page.evaluate("window.motion414.ontology.groups.find(x=>x.id==='transition-reveal').sourceFamilies.length") == 3
        assert await page.evaluate("window.motion414.audit('chevron-steps').sampleSuitable") == "PASS"
        assert await page.evaluate("window.motion414.audit('morph-cut').sampleSuitable") == "FAIL"
        assert await page.evaluate("window.motion414.audit('light-sweep').semanticMatch") == "NOT_RUN"
        assert await page.evaluate("window.motion414.audit('shine-sweep').canonicalMotionId") == "light-sweep"
        assert await page.evaluate("window.motion414.audit('shine-sweep').sampleSuitable") == "PASS"
        await page.evaluate("window.motion414.select('shine-sweep')")
        assert await page.locator(".m414-shine-band").count() == 1
        assert "20도" in await page.locator("#instruction").text_content()
        assert await page.locator(".card").first.evaluate("el => getComputedStyle(el).borderTopLeftRadius") == "0px"
        assert await page.locator(".card").first.evaluate("el => el.getBoundingClientRect().width") > 300
        assert await page.locator(".mast .eyebrow").count() == 0
        results = await page.evaluate("window.motion414.playAll()")
        assert len(results) == 414
        assert len({item["id"] for item in results}) == 414
        assert all(item["count"] > 0 and item["target"] for item in results)
        groups = {}
        for item in results:
            groups.setdefault(item["signature"], []).append(item["id"])
        duplicates = [ids for ids in groups.values() if len(ids) > 1]
        print(f"unique motion signatures: {len(groups)}/414; repeated groups: {len(duplicates)}")
        print("largest repeated groups:", sorted(duplicates, key=len, reverse=True)[:10])
        reveal_ids = ["cross-dissolve", "pixel-dissolve", "iris-wipe", "wipe", "mask-reveal", "morph-cut", "glitch", "rgb-split", "light-sweep", "screen-dive", "line-draw", "shape-morph"]
        reveal_signatures = [next(item["signature"] for item in results if item["id"] == motion_id) for motion_id in reveal_ids]
        assert len(set(reveal_signatures)) == len(reveal_ids), "전환·리빌 12개 중 키프레임 중복"
        diagram_ids = ["roadmap-path", "arrow-chain", "branch-flow", "cycle-loop", "timeline-axis", "chevron-steps"]
        diagram_signatures = [next(item["signature"] for item in results if item["id"] == motion_id) for motion_id in diagram_ids]
        assert len(set(diagram_signatures)) == len(diagram_ids), "도식 6개 중 키프레임 중복"
        for motion_id in diagram_ids:
            await page.evaluate("id => window.motion414.select(id)", motion_id)
            await page.evaluate("document.querySelector('#stage').getAnimations({subtree:true}).forEach(animation => animation.finish())")
            await page.locator("#stage").screenshot(path=f"/tmp/motion-414-{motion_id}.png")
        for motion_id, selector in [("light-sweep", ".m414-light-band"), ("screen-dive", ".m414-laptop"), ("line-draw", ".m414-draw-arrow"), ("shape-morph", ".m414-morph-shape")]:
            await page.evaluate("id => window.motion414.select(id)", motion_id)
            assert await page.locator(selector).count() == 1, motion_id
            frames = await page.locator(selector).evaluate("el => el.getAnimations()[0].effect.getKeyframes()")
            assert len(frames) >= 2, motion_id
            await page.locator("#stage").screenshot(path=f"/tmp/motion-414-{motion_id}.png")

        await page.evaluate("window.motion414.select('tv-off')")
        assert await page.locator("#stage").get_attribute("data-target") == "전체 화면 전환"
        await page.wait_for_timeout(80)
        tv_frames = await page.locator(".m414-screen.old").evaluate(
            "el => el.getAnimations()[0].effect.getKeyframes()"
        )
        assert any("scale(0.02, 0.025)" in frame.get("transform", "") for frame in tv_frames), tv_frames
        assert await page.locator("#modeControl").is_visible()
        await page.locator("#usageMode").select_option("exit")
        assert await page.locator(".m414-screen.next").evaluate("el => getComputedStyle(el).opacity") == "0"
        await page.locator("#usageMode").select_option("transition")
        await page.screenshot(path="/tmp/motion-414-tv-off.png", full_page=True)

        await page.evaluate("window.motion414.select('squeeze-line')")
        squeeze_frames = await page.locator(".m414-screen.old").evaluate(
            "el => el.getAnimations()[0].effect.getKeyframes()"
        )
        assert any("scale(0.025, 1)" in frame.get("transform", "") for frame in squeeze_frames), squeeze_frames
        assert tv_frames != squeeze_frames
        await page.screenshot(path="/tmp/motion-414-squeeze.png", full_page=True)
        assert await page.locator("#speed").input_value() == "0.7"
        await page.locator("#speed").evaluate(
            "el => {el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}))}"
        )
        assert "1.54초" in await page.locator("#time").inner_text()
        assert "0.7초" in await page.locator("#cue").inner_text()
        assert "세로 선" in await page.locator("#instruction").text_content()

        await page.locator("#reduce").click()
        assert await page.locator("#reduce").get_attribute("aria-pressed") == "true"
        assert "최종 상태" in await page.locator("#playState").inner_text()
        await page.set_viewport_size({"width": 320, "height": 750})
        await page.screenshot(path="/tmp/motion-414-mobile.png", full_page=True)
        assert not await page.evaluate("document.documentElement.scrollWidth > innerWidth")
        overflowing = await page.evaluate("""() => [...document.querySelectorAll('.mast h1,.viewer-head h2,.meta dd,.card strong,.card em,.card small')].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.textContent.trim()).slice(0,10)""")
        assert not overflowing, overflowing
        assert not errors, errors
        await browser.close()
    print("motion 414 technical gate: PASS (414 animated scenes, 12 reveal signatures, TV off/squeeze line, speed, reduced, 320px); semantic fidelity: FAIL until repeated groups are resolved")


if __name__ == "__main__":
    asyncio.run(main())
