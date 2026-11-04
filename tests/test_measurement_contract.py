"""Measured state evidence must survive into DESIGN.md and catch state drift."""
import copy
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from check_interaction_contract import validate as validate_interaction  # noqa: E402
from check_measurement_manifest import audit as audit_manifest  # noqa: E402
from check_multicolumn_order import measure as measure_multicolumn, check as check_multicolumn  # noqa: E402
from write_design_brief import audit_input, make_brief  # noqa: E402
from assemble_design_measurements import assemble  # noqa: E402


def state(state_id, x):
    return {"id": state_id, "screenId": "history", "stateId": state_id,
            "viewport": {"width": 390, "height": 844},
            "environment": {"device": "mobile-web", "dpr": 2, "zoom": 1, "fontLoaded": True, "scrollbarMode": "overlay", "language": "ko"},
            "capture": f"{state_id}.png", "alignmentSource": f"{state_id}-alignment.json", "measurement": {"source": f"{state_id}.json", "landmarks": [{"id": "title", "x": x, "y": 80}]},
            "visualReview": {"status": "PASS", "evidence": f"review-{state_id}.md"}}


def sample():
    observations = [
        {"id": "icon-ink", "screenId": "history", "stateId": "before", "target": "toolbar icon", "property": "drawnWidthRatio", "value": 0.7, "unit": "ratio", "source": "before.json", "method": "SVG getBBox + screenCTM", "uncertainty": "stroke and optical mass need screenshot"},
        {"id": "text-start", "screenId": "history", "stateId": "before", "target": "row title", "property": "firstLineInset", "value": 9, "unit": "CSS px", "source": "before.json", "method": "Range rect", "uncertainty": "not glyph ink"},
        {"id": "marker-gap", "screenId": "history", "stateId": "before", "target": "heading marker", "property": "gap", "value": 12, "unit": "CSS px", "source": "before.json", "method": "marker/label rect difference", "uncertainty": "visual gap checked in screenshot"},
        {"id": "corner-ratio", "screenId": "history", "stateId": "before", "target": "action surface", "property": "radiusRatio", "value": 0.2, "unit": "ratio", "source": "before.json", "method": "CSS radius / short side", "uncertainty": "optical curvature checked in screenshot"},
    ]
    return {"project": "실측 검증 예제", "reference": "local fixture", "measurementDate": "2026-11-04",
            "states": [state("before", 20), state("after", 20)], "requiredStateIds": ["before", "after"],
            "transitions": [{"id": "filter", "before": "before", "after": "after", "action": "filter pending",
                             "stableLandmarks": [{"id": "title", "axis": "x", "maxDeltaPx": 0}],
                             "preserveFocus": True, "preserveScroll": True, "maxScrollDeltaPx": 0,
                             "observed": {"focusBefore": "filter", "focusAfter": "filter", "scrollBeforePx": 0, "scrollAfterPx": 0}}],
            "observations": observations,
            "evidence": {"sampledNodes": 120, "truncatedNodes": 0, "observed": {"fontSize": [{"value": "16px", "count": 10}]}, "weighted": {}},
            "decisions": {"tokens": [{"role": role, "value": value, "status": "approved", "basis": "user-choice", "reason": "fixture"} for role, value in
                                     (("canvas.background", "#fff"), ("surface.background", "#eee"), ("text.primary", "#111"), ("accent.primary", "#176e68"), ("status.error", "#a43"))],
                          "geometry": [{"scope": "history.toolbar", "property": "icon visual center", "observed": "drawn vs box", "value": "align visible bounds", "status": "proposed", "evidenceIds": ["icon-ink"], "test": "same-size screenshot"},
                                       {"scope": "history.heading", "property": "marker gap / radius", "observed": "12px / 0.2", "value": "project choice", "status": "proposed", "evidenceIds": ["marker-gap", "corner-ratio"], "test": "small and large surface"}],
                          "typography": [{"scope": "history.row", "property": "first-line inset", "value": "9 CSS px", "status": "proposed", "evidenceIds": ["text-start"], "test": "long copy"}],
                          "components": [{"id": "toolbar", "role": "actions", "shared": "global", "states": "before/after", "slots": "icon/text"}],
                          "interactions": [{"scope": "history.filter", "contract": "input manifest", "result": "filtered", "status": "proposed", "test": "mouse/touch/keyboard"}],
                          "motion": [{"scope": "history.filter", "trigger": "tap", "fromTo": "all→pending", "motion": "content reflow", "staticFallback": "count changes", "status": "proposed", "test": "before/middle/end"}],
                          "themeAxes": [{"axis": "radius", "base": "corner-ratio", "variation": "per size", "invariant": "component role", "status": "proposed", "test": "same screen"}],
                          "rules": [{"scope": "history", "rule": "preserve title x", "status": "proposed", "evidenceIds": ["text-start"], "test": "filter transition"}]}}


data = sample()
assert audit_manifest(data)["status"] == "PASS"
assert audit_input(data) == []
no_alignment = copy.deepcopy(data)
del no_alignment["states"][0]["alignmentSource"]
assert "MISSING_ALIGNMENT_EVIDENCE" in {row["code"] for row in audit_manifest(no_alignment)["findings"]}
no_motion = copy.deepcopy(data)
del no_motion["decisions"]["motion"]
assert any("모션 흐름 없음" in finding for finding in audit_input(no_motion))
brief = make_brief(data)
for text in ("아이콘", "광학 정렬", "머릿글", "모션 흐름", "테마 확장 축", "icon-ink", "corner-ratio", "filter pending"):
    assert text in brief, text
drift = copy.deepcopy(data)
drift["states"][1]["measurement"]["landmarks"][0]["x"] = 27
assert "LANDMARK_DRIFT" in {row["code"] for row in audit_manifest(drift)["findings"]}
drift["transitions"][0]["observed"]["focusAfter"] = "body"
assert "FOCUS_CHANGED" in {row["code"] for row in audit_manifest(drift)["findings"]}
auto = copy.deepcopy(data)
del auto["transitions"][0]["observed"]
for item in auto["states"]:
    item["measurement"]["focus"] = "filter"
    item["measurement"]["scroll"] = {"x": 0, "y": 0}
assert audit_manifest(auto)["status"] == "PASS"
auto["states"][1]["measurement"]["scroll"]["y"] = 14
assert "SCROLL_CHANGED" in {row["code"] for row in audit_manifest(auto)["findings"]}
missing = copy.deepcopy(data)
missing["decisions"]["geometry"][0]["evidenceIds"] = ["invented"]
assert any("없는 관찰 ID" in item for item in audit_input(missing))

interaction = json.loads((ROOT / "assets/interaction-contract-example.json").read_text())
assert validate_interaction(interaction) == []
broken = copy.deepcopy(interaction)
del broken["components"][0]["modes"]["rightClick"]
assert any("rightClick" in issue for issue in validate_interaction(broken))
broken = copy.deepcopy(interaction)
broken["components"][0]["modes"]["doubleTap"] = {"status": "supported", "behavior": "zoom"}
assert any("tapConflictPolicy" in issue for issue in validate_interaction(broken))
broken = copy.deepcopy(interaction)
del broken["components"][0]["motionFlow"]
assert any("motionFlow" in issue for issue in validate_interaction(broken))
items = [{"id": "A", "dom": 0, "x": 0, "y": 0, "height": 30},
         {"id": "B", "dom": 1, "x": 120, "y": 2, "height": 38},
         {"id": "C", "dom": 2, "x": 0, "y": 45, "height": 30}]
assert measure_multicolumn(items, "row-major", 3)["rowMajor"] == ["A", "B", "C"]
assert measure_multicolumn(items, "row-major", 1)["rowMajor"] == ["A", "B", "C"]
assert measure_multicolumn(items, "row-major", 3)["rowHeightDrift"][0]["heightDriftPx"] == 8
import asyncio  # noqa: E402
assert asyncio.run(check_multicolumn({"url": "unused"}))["status"] == "FAIL"
with tempfile.TemporaryDirectory() as directory:
    source, target = Path(directory) / "measured.json", Path(directory) / "DESIGN.md"
    source.write_text(json.dumps(data, ensure_ascii=False))
    run = subprocess.run([sys.executable, str(ROOT / "scripts/write_design_brief.py"), "--input", str(source), "--out", str(target), "--strict"], capture_output=True, text=True)
    assert run.returncode == 0, run.stdout + run.stderr
    assert "icon-ink" in target.read_text()
    bad = copy.deepcopy(data)
    bad["decisions"]["geometry"][0]["evidenceIds"] = ["invented"]
    source.write_text(json.dumps(bad, ensure_ascii=False))
    run = subprocess.run([sys.executable, str(ROOT / "scripts/write_design_brief.py"), "--input", str(source), "--out", str(target), "--strict"], capture_output=True, text=True)
    assert run.returncode == 1
    style = {"viewport": {"width": 390, "height": 844}, "sampledNodes": 8, "truncatedNodes": 0,
             "observed": {"backgroundColor": [{"value": "rgb(255, 255, 255)", "count": 4}]},
             "weighted": {"backgroundColor": [{"value": "rgb(255, 255, 255)", "count": 0.8}]},
             "landmarks": [{"id": "title", "x": 20, "y": 80}], "focus": "filter", "scroll": {"x": 0, "y": 0}}
    alignment = {"groups": [{"id": "icons", "entries": [{"id": "icon-a", "drawnWidthRatio": 0.75, "primitiveInkAreaRatio": 0.56,
                 "visualOffset": {"x": 1, "y": 0}, "measurementLimits": "path ink unknown", "text": None,
                 "radius": {"borderTopLeftRadius": {"px": 8, "ratio": 0.2}}}]}],
                 "markerRows": [{"id": "marker-a", "gapPx": 12}]}
    Path(directory, "before-style.json").write_text(json.dumps(style))
    Path(directory, "before-alignment.json").write_text(json.dumps(alignment))
    bundle = {"project": "assembly", "reference": "fixture", "states": [{**state("before", 20), "measurement": {"source": "before-style.json"}, "alignmentSource": "before-alignment.json"}],
              "decisions": {}}
    assembled = assemble(bundle, Path(directory))
    assert assembled["states"][0]["measurement"]["focus"] == "filter"
    assert any(row["property"] == "primitiveInkAreaRatio" for row in assembled["observations"])
    assert any(row["property"] == "markerGap" for row in assembled["observations"])
    assert any(row["property"] == "computedStyleCandidate" for row in assembled["observations"])
    assert assembled["evidence"]["observed"]["backgroundColor"][0]["count"] == 4
print("state evidence, DESIGN.md traceability, input modes, and motion flow: PASS")
