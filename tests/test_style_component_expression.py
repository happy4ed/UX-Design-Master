#!/usr/bin/env python3
"""Measure component signatures and preview geometry across non-One UI/iOS styles."""

from __future__ import annotations

import json
import re
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "references/style-book/component-expression.json").read_text())
URL = "http://127.0.0.1:8000/UX-Design-Master/samples/style-book-component-board.html"
SELECTORS = {
    "action": ".btn.primary",
    "input": ".search",
    "selected": ".tabset button[aria-selected=true]",
    "row": ".list .row",
    "card": ".card",
    "choice": ".choice label",
    "progress": "progress",
}


def solid_contrast(fg: str, bg: str) -> float | None:
    """Return WCAG contrast only when both computed colors are opaque solids."""
    if not (fg.startswith("rgb(") and bg.startswith("rgb(")):
        return None
    def luminance(value: str) -> float:
        channels = [int(x) / 255 for x in re.findall(r"\d+", value)[:3]]
        linear = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in channels]
        return sum(x * w for x, w in zip(linear, (0.2126, 0.7152, 0.0722)))
    a, b = luminance(fg), luminance(bg)
    return (max(a, b) + 0.05) / (min(a, b) + 0.05)


def inspect(page) -> dict:
    return page.locator("#phone").evaluate(
        """(root,selectors) => {
          const out={};
          for(const [role,selector] of Object.entries(selectors)){
            const e=root.querySelector(selector),s=getComputedStyle(e),r=e.getBoundingClientRect();
            out[role]={background:s.backgroundImage!=='none'?s.backgroundImage:s.backgroundColor,
              border:s.borderWidth+' '+s.borderStyle+' '+s.borderColor,
              radius:s.borderRadius,shadow:s.boxShadow,color:s.color,
              height:Math.round(r.height),fontSize:parseFloat(s.fontSize)};
          }
          const s=getComputedStyle(root);
          out.scroll={thumb:s.getPropertyValue('--scroll-thumb').trim(),track:s.getPropertyValue('--scroll-track').trim(),size:s.getPropertyValue('--scroll-size').trim()};
          const selected=root.querySelector('.tabset button[aria-selected=true]');
          const selectedStyle=getComputedStyle(selected);
          const afterStyle=getComputedStyle(selected,'::after');
          out.motion={duration:s.getPropertyValue('--motion-time').trim(),ease:s.getPropertyValue('--motion-ease').trim(),
            selected:selectedStyle.animationName==='none'?afterStyle.animationName:selectedStyle.animationName};
          out.geometry={overflow:root.scrollWidth>root.clientWidth+1,scrollable:root.scrollHeight>root.clientHeight};
          return out;
        }""",
        SELECTORS,
    )


def main() -> None:
    results: dict[str, dict] = {}
    review = ROOT / "samples/style-book-renders/component-expression"
    review.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, ignore_default_args=["--hide-scrollbars"])
        page = browser.new_page(viewport={"width": 1000, "height": 940}, device_scale_factor=1)
        for style in DATA["styles"]:
            page.goto(f"{URL}?style={style}")
            page.locator("#phone[data-icon-form]").wait_for()
            page.wait_for_function("document.getAnimations().every(a => a.playState !== 'running')", timeout=2000)
            dark = inspect(page)
            page.locator("#phone").screenshot(path=str(review / f"{style}-dark.png"))
            if style in {"skeuo-audio-hifi", "neumorphism", "claymorphism", "neo-brutalism", "bauhaus-swiss", "y2k-chrome", "origami-paper"}:
                page.locator("#phone").evaluate("e => e.scrollTop = 720")
                page.locator("#phone").screenshot(path=str(review / f"{style}-dark-lower.png"))
                page.locator("#phone").evaluate("e => e.scrollTop = 0")
            page.locator("#scheme").click()
            page.wait_for_function("document.getAnimations().every(a => a.playState !== 'running')", timeout=2000)
            light = inspect(page)
            page.locator("#phone").screenshot(path=str(review / f"{style}-light.png"))
            assert not dark["geometry"]["overflow"] and dark["geometry"]["scrollable"], style
            assert not light["geometry"]["overflow"] and light["geometry"]["scrollable"], style
            assert dark["scroll"]["thumb"] and dark["motion"]["duration"], style
            assert dark["action"]["height"] >= 48 and light["action"]["height"] >= 48, style
            for scheme, measurements in (("dark", dark), ("light", light)):
                for role in SELECTORS:
                    entry = measurements[role]
                    ratio = solid_contrast(entry["color"], entry["background"])
                    assert ratio is None or ratio >= 4.5, (style, scheme, role, ratio)
            selected = page.locator(".chipset button").nth(1)
            selected.evaluate("""e => {
              e.setAttribute('aria-pressed','true');
              getComputedStyle(e).animationName;
              const animations=e.getAnimations({subtree:true});
              if(!animations.length)throw Error('No selected motion');
              animations.forEach(a=>{a.pause();a.currentTime=0});
            }""")
            first = Image.open(BytesIO(selected.screenshot())).convert("RGB")
            selected.evaluate("""e => e.getAnimations({subtree:true}).forEach(a=>{
              a.pause();a.currentTime=a.effect.getComputedTiming().endTime;
            })""")
            last = Image.open(BytesIO(selected.screenshot())).convert("RGB")
            assert ImageChops.difference(first, last).getbbox(), f"No rendered motion frames: {style}"
            page.locator("#width").click()
            page.wait_for_function("document.getAnimations().every(a => a.playState !== 'running')", timeout=2000)
            fold_light = inspect(page)
            page.locator("#scheme").click()
            page.wait_for_function("document.getAnimations().every(a => a.playState !== 'running')", timeout=2000)
            fold_dark = inspect(page)
            for mode, measurements in (("fold-light", fold_light), ("fold-dark", fold_dark)):
                assert not measurements["geometry"]["overflow"], (style, mode)
                assert measurements["action"]["height"] >= 48, (style, mode)
            results[style] = {"dark": dark, "light": light, "fold_light": fold_light, "fold_dark": fold_dark}
        browser.close()
    signatures = {
        style: json.dumps(
            {role: results[style]["dark"][role] for role in SELECTORS},
            ensure_ascii=False,
            sort_keys=True,
        )
        for style in results
    }
    assert len(set(signatures.values())) == len(signatures), "Two styles have identical component signatures"
    assert len({results[style]["dark"]["motion"]["selected"] for style in results}) == len(results), "Style selection motion repeated"
    assert all(results[style]["dark"]["motion"]["selected"] != "none" for style in results)
    dark = lambda style, role, key: results[style]["dark"][role][key]
    assert "inset" in dark("neumorphism", "selected", "shadow")
    assert "inset" in dark("neumorphism", "input", "shadow")
    assert "inset" in dark("claymorphism", "action", "shadow")
    assert dark("neo-brutalism", "action", "border").startswith("3px")
    assert "5px" in dark("bauhaus-swiss", "card", "border")
    assert "inset" in dark("y2k-chrome", "input", "shadow")
    assert "inset" in dark("y2k-chrome", "action", "shadow")
    assert dark("origami-paper", "action", "background").startswith("linear-gradient")
    path = ROOT / "samples/style-book-component-expression-audit.json"
    path.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    print(f"PASS {len(results)} styles × phone/fold × light/dark; distinct component signatures and visible motion frames; geometry/scroll tokens present")


if __name__ == "__main__":
    main()
