#!/usr/bin/env python3
"""Measure C direction candidates in a browser and report likely mismatches.

Input manifest: {"directions":[{"id":"A","url":"http://...","selectors":
{"button":"...","row":"...","section":"...","primaryNav":"...",
"filter":"...","secondary":"...","selected":["..."],"appbar":"..."},
"appBarSeam":"none","allowDarkButtons":false}]}
Selectors should target representative *visible* instances of each role.
"""

import argparse
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright


JS = """selectors => {
  const read = selector => {
    if (!selector) return null;
    const el = document.querySelector(selector);
    if (!el) return null;
    const css = getComputedStyle(el), box = el.getBoundingClientRect();
    return {height:box.height,width:box.width,bg:css.backgroundColor,color:css.color,
      fontSize:css.fontSize,fontWeight:css.fontWeight,radius:css.borderTopLeftRadius,
      border:css.borderBottomWidth,borderColor:css.borderBottomColor,
      shadow:css.boxShadow,paddingTop:css.paddingTop,paddingBottom:css.paddingBottom};
  };
  const result={};
  for (const [key,value] of Object.entries(selectors)) result[key]=Array.isArray(value)?value.map(read):read(value);
  return result;
}"""


def signature(style):
    if not style:
        return None
    return tuple(style[key] for key in ("bg", "color", "fontWeight", "borderColor", "shadow"))


def render_signature(styles):
    return tuple(tuple(styles.get(key, {}).get(field) for field in fields) if styles.get(key) else None for key, fields in (
        ("button", ("height", "radius", "paddingTop", "paddingBottom")),
        ("row", ("height", "paddingTop", "paddingBottom")),
        ("section", ("paddingTop", "paddingBottom", "border", "shadow")),
    ))


def dark_color(css):
    if not css or not css.startswith("rgb"):
        return False
    try:
        parts = [x.strip() for x in css[css.index("(") + 1:css.index(")")].split(",")]
        if css.startswith("rgba") and len(parts) > 3 and float(parts[3]) < 0.5:
            return False
        values = [int(float(x)) for x in parts[:3]]
        return max(values) < 52
    except (ValueError, IndexError):
        return False


def visible_border(width, color):
    if not width or width == "0px" or color == "transparent":
        return False
    if color.startswith("rgba"):
        try:
            return float(color[color.rindex(",") + 1:color.index(")")].strip()) > 0
        except ValueError:
            return True
    return True


async def check(manifest):
    warnings, measured = [], []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        for direction in manifest.get("directions", []):
            did = direction.get("id", "<id 없음>")
            if not direction.get("viewport"):
                warnings.append({"code": "MISSING_PROJECT_VIEWPORT", "direction": did, "detail": "대상 프로젝트의 실제 창 크기를 지정하세요"})
                continue
            page = await browser.new_page(viewport=direction["viewport"])
            await page.goto(direction["url"], wait_until="networkidle")
            styles = await page.evaluate(JS, direction.get("selectors", {}))
            measured.append({"id": did, "styles": styles, "layoutSignature": render_signature(styles)})
            selectors = direction.get("selectors", {})
            for role in ("button", "row", "section", "primaryNav", "filter", "secondary"):
                if selectors.get(role) and not styles.get(role):
                    warnings.append({"code": "MISSING_RENDER_TARGET", "direction": did, "role": role})
            selected = [signature(x) for x in styles.get("selected", []) if x]
            if len(set(selected)) > 1:
                warnings.append({"code": "SELECTION_STYLE_MISMATCH", "direction": did, "signatures": selected})
            secondary, primary = styles.get("secondary"), styles.get("primaryNav")
            if secondary and primary and secondary["height"] >= primary["height"]:
                warnings.append({"code": "SECONDARY_VISUAL_WEIGHT", "direction": did, "detail": "보조 조작 높이가 1차 탐색 이상"})
            button = styles.get("button")
            if button and dark_color(button["bg"]) and not direction.get("allowDarkButtons", False):
                warnings.append({"code": "UNEXPECTED_DARK_BUTTON", "direction": did, "color": button["bg"]})
            appbar = styles.get("appbar")
            if appbar and direction.get("appBarSeam") == "none" and (appbar["shadow"] != "none" or visible_border(appbar["border"], appbar["borderColor"])):
                warnings.append({"code": "APPBAR_SEAM_CONFLICT", "direction": did, "border": appbar["border"], "shadow": appbar["shadow"]})
            await page.close()
        await browser.close()
    signatures = {json.dumps(item["layoutSignature"], ensure_ascii=False) for item in measured}
    if len(measured) >= 2 and len(signatures) == 1:
        warnings.append({"code": "SIZE_ONLY_OR_SAME_COMPONENT_DIRECTION", "detail": "방향별 버튼·행·표면 측정 서명이 같습니다. 실제 구성·타이포·시각 차이도 병렬 검토하세요."})
    return {"status": "WARN" if warnings else "PASS", "warnings": warnings, "measured": measured, "note": "자동 측정은 문제 후보만 제시한다. 실제 렌더의 시각 품질과 사용자 관점은 별도 검수한다."}


def main():
    parser = argparse.ArgumentParser(description="확인 C 대표 렌더의 컴포넌트·상태·관례 측정")
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(asyncio.run(check(json.loads(args.input.read_text()))), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
