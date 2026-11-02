"""Build visual evidence sheets from a local snapshot of the reference page.

This is an audit tool. It does not load external source code in the skill preview.
Usage: python3 tests/build_motion_comparison.py --source-html /tmp/giting-motion-menu.html --ids light-sweep shine-sweep
"""
import argparse
import asyncio
import io
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright
from playwright.async_api import TimeoutError as PlaywrightTimeoutError

DEFAULT_URL = "http://127.0.0.1:8000/UX-Design-Master/samples/motion-414-lab.html"
FRACTIONS = (0.02, 0.5, 0.98)
AUDIT_SHIM = """<script>
window.__auditNow=0;window.__auditRaf=[];
Object.defineProperty(performance,'now',{configurable:true,value:()=>window.__auditNow});
window.requestAnimationFrame=callback=>{window.__auditRaf.push(callback);return window.__auditRaf.length};
window.__auditStep=ms=>{window.__auditNow=ms;const callbacks=window.__auditRaf.splice(0);for(const callback of callbacks)callback(ms)};
</script>"""


async def seek(page, fraction, loop_ms=4000, scope=None, animation_duration_ms=None, absolute_ms=None):
    await page.evaluate(
        """({fraction,scope,animationDurationMs,absoluteMs}) => {
          const root=scope ? document.querySelector(scope) : document;
          const animations = root.getAnimations({subtree:true});
          const total = animationDurationMs || Math.max(1, ...animations.map(animation => {
            const timing = animation.effect.getTiming();
            return (Number(timing.delay) || 0) + (Number.isFinite(timing.duration) ? timing.duration : 0);
          }));
          for (const animation of animations) {
            animation.pause();
            animation.currentTime = absoluteMs === null ? total * fraction : absoluteMs;
          }
        }""",
        {"fraction": fraction, "scope": scope, "animationDurationMs": animation_duration_ms, "absoluteMs": absolute_ms},
    )
    await page.evaluate("ms => { if (window.__auditStep) window.__auditStep(ms); }", loop_ms * fraction if absolute_ms is None else absolute_ms)
    await page.wait_for_timeout(25)


async def shot(page, selector=None):
    png = await (page.locator(selector).screenshot(timeout=8000) if selector else page.screenshot(timeout=8000))
    return Image.open(io.BytesIO(png)).convert("RGB")


def fit(image, width=540, height=310):
    result = Image.new("RGB", (width, height), "#f5f6f8")
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    result.paste(image, ((width - image.width) // 2, (height - image.height) // 2))
    return result


async def build(args):
    if args.timestamps_ms and not args.reference_only:
        raise ValueError("--timestamps-ms is for source-only action-phase inspection; compare internal action phases separately")
    source = BeautifulSoup(Path(args.source_html).read_text(encoding="utf-8"), "html.parser")
    if args.all:
        taxonomy_path = Path(__file__).resolve().parents[1] / "knowledge/motion-taxonomy.json"
        taxonomy = json.loads(taxonomy_path.read_text())
        args.ids = [item["id"] for group in taxonomy["categories"] for item in group["entries"]]
    args.output.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = (await playwright.chromium.connect_over_cdp(args.cdp_url)
                   if args.cdp_url else await playwright.chromium.launch(headless=True))
        reference = await browser.new_page(viewport={"width": 800, "height": 230}, reduced_motion="no-preference")
        internal = None
        if not args.reference_only:
            internal = await browser.new_page(viewport={"width": 1280, "height": 800}, reduced_motion="no-preference")
            await internal.goto(args.url, wait_until="networkidle")
        for motion_id in args.ids:
            if args.resume and (args.output / f"{motion_id}.png").exists():
                continue
            card = source.select_one("#m-" + motion_id)
            if card is None or card.iframe is None or not card.iframe.get("srcdoc"):
                raise ValueError("Reference demo missing: " + motion_id)
            source_html = card.iframe["srcdoc"]
            duration_match = re.search(r"/1000\)\)\s*%\s*([\d.]+)", source_html)
            if not args.timestamps_ms and args.duration_ms is None:
                raise ValueError(f"Source sampling times unverified for {motion_id}; inspect the original demo and pass --timestamps-ms for action phases or --duration-ms for a full cycle")
            loop_ms = args.duration_ms or (float(duration_match.group(1)) * 1000 if duration_match else 1)
            source_html = source_html.replace("<body>", "<body>" + AUDIT_SHIM, 1)
            samples = ([(f"{ms:g}ms", None, ms) for ms in args.timestamps_ms]
                       if args.timestamps_ms else [(f"{fraction:.0%}", fraction, None) for fraction in (args.fractions or FRACTIONS)])
            try:
                await reference.set_content(source_html, timeout=10000)
                if internal:
                    await internal.evaluate("id => window.motion414.select(id)", motion_id)
                sheet = Image.new("RGB", (540 * len(samples), 2 * 340 if internal else 340), "white")
                draw = ImageDraw.Draw(sheet)
                for index, (label, fraction, absolute_ms) in enumerate(samples):
                    await seek(reference, fraction or 0, loop_ms, animation_duration_ms=args.duration_ms, absolute_ms=absolute_ms)
                    if internal:
                        await seek(internal, fraction, scope="#stage")
                        if args.debug_selector:
                            values = await internal.locator(args.debug_selector).evaluate_all("nodes => nodes.map(node => ({text:node.textContent,opacity:getComputedStyle(node).opacity,visibility:getComputedStyle(node).visibility,animations:node.getAnimations().map(a=>({time:a.currentTime,timing:a.effect.getTiming()}))}))")
                            print("DEBUG", motion_id, fraction, values, flush=True)
                    original = fit(await shot(reference))
                    x = index * 540
                    sheet.paste(original, (x, 30))
                    draw.text((x + 8, 8), f"REFERENCE {motion_id} @ {label}", fill="#18283d")
                    if internal:
                        recreated = fit(await shot(internal, "#stage"))
                        sheet.paste(recreated, (x, 370))
                        draw.text((x + 8, 348), f"INTERNAL {motion_id} @ {label}", fill="#18283d")
                path = args.output / f"{motion_id}.png"
                sheet.save(path)
                print(path, flush=True)
            except PlaywrightTimeoutError as error:
                print(f"CAPTURE_TIMEOUT {motion_id}: {str(error).splitlines()[0]}", flush=True)
        await browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-html", type=Path, required=True)
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--output", type=Path, default=Path("/tmp/motion-comparison"))
    parser.add_argument("--ids", nargs="+", default=[])
    parser.add_argument("--all", action="store_true", help="Capture every demo in the source snapshot")
    parser.add_argument("--reference-only", action="store_true", help="Capture source frames without internal rendering")
    parser.add_argument("--resume", action="store_true", help="Skip output images already present")
    parser.add_argument("--fractions", nargs="+", type=float, help="Normalized source-loop timestamps (0..1)")
    parser.add_argument("--duration-ms", type=float, help="Observed full cycle length when normalized phase comparison is needed")
    parser.add_argument("--timestamps-ms", nargs="+", type=float, help="Observed action-phase timestamps; source-only capture without requiring an exact cycle period")
    parser.add_argument("--debug-selector", help="Print computed styles for internal nodes at each sampled phase")
    parser.add_argument("--cdp-url", help="Connect to an existing browser instead of launching one")
    asyncio.run(build(parser.parse_args()))
