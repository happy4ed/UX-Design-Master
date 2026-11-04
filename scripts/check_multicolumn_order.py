#!/usr/bin/env python3
"""Measure multicolumn reading order, row drift, and post-sort order."""

import argparse
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright

JS = """({selector,attribute}) => [...document.querySelectorAll(selector)].map((el,index)=>{
  const r=el.getBoundingClientRect();return {id:el.getAttribute(attribute)||String(index),dom:index,x:r.x,y:r.y,width:r.width,height:r.height};
})"""


def clustered(items, axis, tolerance):
    groups = []
    for item in sorted(items, key=lambda entry: (entry[axis], entry["dom"])):
        if not groups or item[axis] - groups[-1][0][axis] > tolerance:
            groups.append([item])
        else:
            groups[-1].append(item)
    return groups


def measure(items, mode, tolerance):
    if not isinstance(tolerance, (int, float)) or tolerance <= 0:
        raise ValueError("rowGroupingTolerancePx must be a positive project value")
    if mode not in {"row-major", "column-major"}:
        raise ValueError("readingMode must be row-major or column-major")
    rows = clustered(items, "y", tolerance)
    columns = clustered(items, "x", tolerance)
    row = [item for group in rows for item in sorted(group, key=lambda entry: entry["x"])]
    column = [item for group in columns for item in sorted(group, key=lambda entry: entry["y"])]
    drift = [{"y": round(group[0]["y"], 2), "heightDriftPx": round(max(x["height"] for x in group) - min(x["height"] for x in group), 2)} for group in rows if len(group) > 1]
    intended = row if mode == "row-major" else column
    return {"domOrder": [x["id"] for x in sorted(items, key=lambda x: x["dom"])], "rowMajor": [x["id"] for x in row], "columnMajor": [x["id"] for x in column], "intendedOrder": [x["id"] for x in intended], "rowHeightDrift": drift}


async def check(spec):
    warnings, scenarios = [], []
    tolerance = spec.get("rowGroupingTolerancePx")
    max_drift = spec.get("maxRowHeightDriftPx")
    if not isinstance(tolerance, (int, float)) or tolerance <= 0 or not isinstance(max_drift, (int, float)) or max_drift < 0:
        return {"status": "FAIL", "warnings": [{"code": "MISSING_PROJECT_MEASUREMENT_LIMITS", "message": "rowGroupingTolerancePx와 maxRowHeightDriftPx를 대상 레이아웃에 맞춰 명시하세요."}], "scenarios": []}
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport=spec.get("viewport", {"width": 1280, "height": 900}))
        await page.goto(spec["url"], wait_until="networkidle")
        tests = [{"name": "default", "expectedOrder": spec.get("expectedOrder")}] + spec.get("sortScenarios", [])
        for scenario in tests:
            if scenario.get("triggerSelector"):
                await page.locator(scenario["triggerSelector"]).click()
            items = await page.evaluate(JS, {"selector": spec["itemSelector"], "attribute": spec.get("dataIdAttribute", "data-id")})
            report = measure(items, spec.get("readingMode", "row-major"), tolerance)
            scenarios.append({"name": scenario["name"], **report})
            if scenario.get("expectedOrder") and report["intendedOrder"] != scenario["expectedOrder"]:
                warnings.append({"code": "ORDER_MISMATCH", "scenario": scenario["name"], "expected": scenario["expectedOrder"], "actual": report["intendedOrder"]})
            if report["domOrder"] != report["intendedOrder"]:
                warnings.append({"code": "DOM_VISUAL_ORDER_MISMATCH", "scenario": scenario["name"], "dom": report["domOrder"], "visual": report["intendedOrder"]})
            if any(x["heightDriftPx"] > max_drift for x in report["rowHeightDrift"]):
                warnings.append({"code": "ROW_HEIGHT_DRIFT", "scenario": scenario["name"], "rows": report["rowHeightDrift"]})
        await browser.close()
    return {"status": "WARN" if warnings else "PASS", "warnings": warnings, "scenarios": scenarios, "note": "DOM·좌표·높이 후보만 측정한다. 읽기 흐름은 실제 화면에서 확인한다."}


def main():
    parser = argparse.ArgumentParser(description="2열 이상 목록의 읽기·정렬 실측")
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(asyncio.run(check(json.loads(args.input.read_text()))), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
