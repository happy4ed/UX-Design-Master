"""Browser regression for diagram display scale, geometry and data fidelity."""
import asyncio
import json
import subprocess
import tempfile
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
AUDIT_URL = "http://127.0.0.1:8000/UX-Design-Master/assets/visualization/layout-audit.mjs"
BASE_URL = "http://127.0.0.1:8000/UX-Design-Master/samples/interaction-keyboard-review.html"
V1 = WORKSPACE / "artifacts/design-skill-experiments/eval-2026-10-27/A/viz/d5-claim-flow-static.svg"


def render(script, data, output):
    subprocess.run(["node", str(ROOT / "scripts" / script), "--input", str(data), "--out", str(output)], check=True, capture_output=True, text=True)
    return output.read_text(encoding="utf-8")


async def audit(page, svg, width, *, scroll=True, max_display_scale=None):
    await page.set_viewport_size({"width": width, "height": 900})
    await page.goto(BASE_URL)
    body = f'<main style="width:{width}px;max-width:100%;margin:0"><div style="overflow-x:auto" role="region">{svg}</div></main>' if scroll else f'<main style="width:{width}px;max-width:100%;margin:0">{svg}</main>'
    await page.set_content(body)
    options = {"minimumTextPx": 13, "narrowViewportWidth": 360}
    if max_display_scale is not None:
        options["maxDisplayScale"] = max_display_scale
    return await page.evaluate(f"""async () => {{const m=await import('{AUDIT_URL}');return m.auditSvgLayout(document.querySelector('svg'),{json.dumps(options)})}}""")


async def main():
    with tempfile.TemporaryDirectory() as temp:
        tmp = Path(temp)
        flow = render("render_flow_diagram.mjs", ROOT / "assets/visualization/claim-flow-example.json", tmp / "flow.svg")
        assert 'markerUnits="userSpaceOnUse"' in flow
        assert 'markerWidth="8"' in flow and 'font-weight="700"' not in flow
        assert 'data-display-width="640"' in flow
        assert flow.count('data-node="true"') == 9
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            page = await browser.new_page()
            at640 = await audit(page, flow, 640)
            serious = ("regionOverflow", "textOverlap", "arrowGaps", "displayScaleWarnings", "textSizeWarnings", "narrowTextWarnings", "arrowHeadWarnings", "shaftWarnings", "nodeGapWarnings", "paddingWarnings", "lineShapeWarnings")
            assert all(not at640[key] for key in serious), json.dumps({key: at640[key] for key in serious if at640[key]}, ensure_ascii=False)
            at930 = await audit(page, flow, 930)
            assert not at930["displayScaleWarnings"]
            actual = await page.locator("svg").evaluate("node => node.getBoundingClientRect().width")
            assert actual <= 640.5, actual
            at360 = await audit(page, flow, 360)
            assert not at360["narrowTextWarnings"] and not at360["narrowViewportFailure"], at360

            await audit(page, flow.replace('data-motion="none"', 'data-motion="trace"'), 640)
            moving = await page.evaluate(f"""async () => {{const m=await import('{AUDIT_URL}');return m.probeMotion(document.querySelector('svg'))}}""")
            assert moving["moving"] and moving["waitMs"] >= 1000, moving

            old = await audit(page, V1.read_text(encoding="utf-8"), 930, scroll=False, max_display_scale=1.25)
            assert old["displayScaleWarnings"], old
            assert old["arrowHeadWarnings"], old
            assert old["shaftWarnings"] or old["nodeGapWarnings"], old

            spec = json.loads((ROOT / "assets/visualization/claim-flow-example.json").read_text(encoding="utf-8"))
            spec["colors"] = {"paper": "#151d26", "white": "#202b36", "ink": "#f4f7f8", "muted": "#ccd9df", "line": "#a8bdc8", "teal": "#7be0cb", "tealLight": "#173c39", "orange": "#ffc49a", "orangeLight": "#49332c"}
            dark = tmp / "dark.json"
            dark.write_text(json.dumps(spec, ensure_ascii=False), encoding="utf-8")
            run = subprocess.run(["node", str(ROOT / "scripts/render_flow_diagram.mjs"), "--input", str(dark), "--out", str(tmp / "dark.svg")], check=True, capture_output=True, text=True)
            assert not json.loads(run.stdout)["warnings"] or all("긴 노드" in w or "도표 내부 참조" in w for w in json.loads(run.stdout)["warnings"]), run.stdout
            await browser.close()

        bar_data = tmp / "bar.json"
        bar_data.write_text(json.dumps({"labels": ["A", "B", "C", "D", "E"], "values": [1, 2, 3, 4, 5]}))
        subprocess.run(["node", str(ROOT / "scripts/render_visualization.mjs"), "--template", "bar-comparison", "--input", str(bar_data), "--out", str(tmp / "bar.svg")], check=True, capture_output=True, text=True)
        bar_svg = (tmp / "bar.svg").read_text()
        assert 'viewBox="0 0 520 274"' in bar_svg and '>E</tspan>' in bar_svg
        sankey_data = tmp / "sankey.json"
        sankey_data.write_text(json.dumps({"values": [100, 60, 40, 80, 20], "flows": [{"from": 1, "to": 3, "value": 50}, {"from": 1, "to": 4, "value": 10}, {"from": 2, "to": 3, "value": 30}, {"from": 2, "to": 4, "value": 10}]}))
        run = subprocess.run(["node", str(ROOT / "scripts/render_visualization.mjs"), "--template", "quantity-sankey", "--input", str(sankey_data), "--out", str(tmp / "sankey.svg")], check=True, capture_output=True, text=True)
        assert not json.loads(run.stdout)["warnings"]
        assert (tmp / "sankey.svg").read_text().count('stroke-opacity=".72"') == 4
        sankey_data.write_text(json.dumps({"values": [100, 60, 40, 80, 20]}))
        absent = subprocess.run(["node", str(ROOT / "scripts/render_visualization.mjs"), "--template", "quantity-sankey", "--input", str(sankey_data), "--out", str(tmp / "sankey-unknown.svg")], capture_output=True, text=True)
        assert absent.returncode == 2 and 'stroke-opacity=".72"' not in (tmp / "sankey-unknown.svg").read_text()
    print("diagram quality regression: PASS (flow, scale, narrow, old failure, dark, bar, sankey)")


if __name__ == "__main__":
    asyncio.run(main())
