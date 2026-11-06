#!/usr/bin/env python3
"""Render all registered style directions in four modes."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlencode

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "samples" / "style-book-reference-screen.html"
OUT = ROOT / "samples" / "style-book-renders"
STYLES = (
    "oneui", "material", "ios", "hifi", "glassmorphism", "neumorphism",
    "claymorphism", "flat-2", "neo-brutalism", "bauhaus-swiss", "memphis",
    "y2k-chrome", "maximalism", "editorial-print", "minimalism",
    "dark-cinematic", "aurora-mesh", "frutiger-aero", "origami-paper",
    "bento-grid", "dark-tech", "kinetic-typography", "scroll-3d",
    "grainy-gradient", "retro-pixel", "swiss-grid",
)
FREE_STYLES = STYLES[4:]
# Proposed tokens, not measurements of the reference services. These catch
# accidental fallback to one generic skin or a broken light/dark switch.
EXPECTED_FREE = {
    "glassmorphism": ("#121a30", "#dbe9f4", "25px"),
    "neumorphism": ("#252b36", "#e5e9ef", "26px"),
    "claymorphism": ("#382747", "#fff1ef", "36px"),
    "flat-2": ("#142642", "#f4f7fb", "10px"),
    "neo-brutalism": ("#221f2f", "#fff7dd", "0px"),
    "bauhaus-swiss": ("#161615", "#f4f0e7", "0px"),
    "memphis": ("#29284b", "#ffecdc", "12px"),
    "y2k-chrome": ("#140e31", "#dddaf6", "24px"),
    "maximalism": ("#27162a", "#f9efdc", "4px"),
    "editorial-print": ("#1d1d20", "#f8f6f1", "0px"),
    "minimalism": ("#101113", "#fff", "4px"),
    "dark-cinematic": ("#080c10", "#ebe8e3", "10px"),
    "aurora-mesh": ("#090d28", "#e9ecff", "20px"),
    "frutiger-aero": ("#0a4979", "#c7f3fa", "25px"),
    "origami-paper": ("#29241f", "#f4eadc", "3px"),
}
ADDITIONS = json.loads((ROOT / "references/style-book/additional-style-families.json").read_text(encoding="utf-8"))["styles"]
for style, definition in ADDITIONS.items():
    EXPECTED_FREE[style] = (definition["dark"]["bg"], definition["light"]["bg"], definition["dark"]["card-r"])


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    records = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for style in STYLES:
            for layout, viewport in (("phone", {"width": 1440, "height": 900}), ("fold", {"width": 1440, "height": 850})):
              for scheme in ("dark", "light"):
                page = browser.new_page(viewport=viewport, device_scale_factor=1)
                page.goto(HTML.as_uri() + "?" + urlencode({"style": style}))
                if layout == "fold":
                    page.locator("#layout").click()
                if scheme == "light":
                    page.locator("#scheme").click()
                card = page.locator(f'.phone[data-style="{style}"]')
                viewport_path = OUT / f"{style}-{layout}-{scheme}-viewport.png"
                card.screenshot(path=str(viewport_path))
                card.evaluate("root => { root.style.height = 'auto'; root.style.maxHeight = 'none'; root.style.overflow = 'visible' }")
                path = OUT / f"{style}-{layout}-{scheme}.png"
                card.screenshot(path=str(path))
                report = card.evaluate("""root => {
                      const all = [...root.querySelectorAll('*')];
                      const controls = [...root.querySelectorAll('button,input')];
                      const badTargets = controls.filter(el => { const r=el.getBoundingClientRect(); return r.width < 48 || r.height < 48 }).map(el=>({tag:el.tagName,label:el.getAttribute('aria-label')||el.textContent.trim(),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)}));
                      const smallControlText = controls.filter(el=>parseFloat(getComputedStyle(el).fontSize)<14).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim(),px:getComputedStyle(el).fontSize}));
                      const smallVisibleText = all.filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(el).fontSize)<14).map(el=>({label:el.textContent.trim().slice(0,30),px:getComputedStyle(el).fontSize}));
                      const overflow = all.filter(el=>el.scrollWidth>el.clientWidth+1 && !['INPUT'].includes(el.tagName)).map(el=>({tag:el.tagName,className:String(el.className),diff:el.scrollWidth-el.clientWidth}));
                      const rowPads=[...root.querySelectorAll('.row')].map(el=>({top:getComputedStyle(el).paddingTop,bottom:getComputedStyle(el).paddingBottom}));
                      const section=root.querySelector('.section'),media=root.querySelector('.media');
                      const gap=section.getBoundingClientRect().top-media.getBoundingClientRect().bottom;
                      const cs=getComputedStyle(root);
                      return {width:Math.round(root.getBoundingClientRect().width),height:Math.round(root.getBoundingClientRect().height),badTargets,smallControlText,smallVisibleText,overflow,rowPads,sectionGap:Math.round(gap),detail:{fontFamily:cs.fontFamily,iconForm:root.dataset.iconForm,svgIcons:root.querySelectorAll('.icon-btn svg,.skip svg,.play svg').length,scrubTrack:getComputedStyle(root.querySelector('.scrub')).getPropertyValue('--track-h').trim(),scrubThumb:getComputedStyle(root.querySelector('.scrub')).getPropertyValue('--thumb-w').trim(),volumeTrack:getComputedStyle(root.querySelector('.volume-row input')).getPropertyValue('--track-h').trim()},token:{bg:cs.getPropertyValue('--bg').trim(),surface:cs.getPropertyValue('--surface').trim(),accent:cs.getPropertyValue('--accent').trim(),cardR:cs.getPropertyValue('--card-r').trim(),fieldR:cs.getPropertyValue('--field-r').trim(),buttonR:cs.getPropertyValue('--button-r').trim(),font:cs.getPropertyValue('--style-font').trim(),poster:cs.getPropertyValue('--poster').trim(),panelBorder:cs.getPropertyValue('--panel-border').trim(),panelShadow:cs.getPropertyValue('--panel-shadow').trim()}};
                    }""")
                records.append({"style": style, "layout": layout, "scheme": scheme, "screenshot": str(path.relative_to(ROOT)), "viewport_screenshot": str(viewport_path.relative_to(ROOT)), **report})
                page.close()
        browser.close()
    output = ROOT / "samples" / "style-book-audit.json"
    bad = [x for x in records if x["badTargets"] or x["smallControlText"] or x["smallVisibleText"] or x["overflow"] or any(p["top"] != p["bottom"] for p in x["rowPads"])]
    signatures = {style: json.dumps(next(x["token"] for x in records if x["style"] == style and x["layout"] == "phone" and x["scheme"] == "dark"), sort_keys=True) for style in FREE_STYLES}
    duplicates = [[a, b] for i, a in enumerate(FREE_STYLES) for b in FREE_STYLES[i+1:] if signatures[a] == signatures[b]]
    token_mismatches = []
    for x in records:
        if x["style"] not in EXPECTED_FREE:
            continue
        dark_bg, light_bg, card_r = EXPECTED_FREE[x["style"]]
        expected_bg = dark_bg if x["scheme"] == "dark" else light_bg
        if x["token"]["bg"].lower() != expected_bg or x["token"]["cardR"].lower() != card_r:
            token_mismatches.append({"style": x["style"], "layout": x["layout"], "scheme": x["scheme"], "expected_bg": expected_bg, "actual_bg": x["token"]["bg"], "expected_card_r": card_r, "actual_card_r": x["token"]["cardR"]})
    detail_sample = [x["detail"] for x in records if x["layout"] == "phone" and x["scheme"] == "dark"]
    detail_diversity = {"font_families": len({x["fontFamily"] for x in detail_sample}), "icon_forms": len({x["iconForm"] for x in detail_sample}), "scrub_track_heights": len({x["scrubTrack"] for x in detail_sample}), "scrub_thumb_widths": len({x["scrubThumb"] for x in detail_sample})}
    missing_details = [x["style"] for x in records if x["detail"]["svgIcons"] != 4 or not x["detail"]["scrubTrack"] or not x["detail"]["iconForm"]]
    detail_fail = detail_diversity["font_families"] < 3 or detail_diversity["icon_forms"] < 4 or detail_diversity["scrub_track_heights"] < 6
    status = "FAIL" if bad or duplicates or token_mismatches or missing_details or detail_fail or len(records) != len(STYLES) * 4 else "PASS"
    output.write_text(json.dumps({"status": status, "meaning": "DOM geometry and proposed token application only; source-style fidelity NOT_RUN", "style_count": len(STYLES), "free_style_count": len(FREE_STYLES), "duplicate_free_style_tokens": duplicates, "proposed_token_mismatches": token_mismatches, "detail_diversity": detail_diversity, "missing_details": missing_details, "records": records}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(records)} records, {len(bad)} geometry violations, {len(duplicates)} duplicate free-style signatures, {len(token_mismatches)} proposed-token mismatches, detail diversity {detail_diversity}; {output}")
    for x in bad[:5]:
        print(x["style"], x["layout"], x["scheme"], x["badTargets"], x["smallControlText"], x["overflow"][:2])


if __name__ == "__main__":
    main()
