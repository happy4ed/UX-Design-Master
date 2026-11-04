"""Regression for the medical-expense skill evaluation's missing A1 proposals."""

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_script(name):
    path = ROOT / "scripts" / f"{name}.py"
    if str(path.parent) not in sys.path:
        sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    obligations = load_script("check_task_obligations")
    catalog = json.loads((ROOT / "knowledge/task-obligations.json").read_text())
    # The user only supplied the task; no review UI features were stated.
    a1 = {"processingTypes": ["recognition-extraction", "classification", "calculation-aggregation"], "features": []}
    report = obligations.audit(a1, catalog)
    ids = {item.get("featureId") for item in report["findings"]}
    assert {"source-result-side-by-side", "linked-pan-zoom", "source-region-highlight", "low-confidence-queue", "edit-undo", "full-result-overview", "preserve-source-values", "calculation-trace", "source-cross-check", "classification-reason", "reclassify", "classification-review-queue"} <= ids
    assert all(item.get("source") == "proposed-by-processing-type" for item in report["findings"] if item["code"] == "MISSING_OBLIGATION")
    features = [{"id": item["featureId"], "source": "proposal"} for item in report["findings"] if item["code"] == "MISSING_OBLIGATION"]
    assert obligations.audit({**a1, "features": features}, catalog)["status"] == "PASS"

    preflight = load_script("check_design_preflight")
    incomplete = preflight.check({"stage": "B", "screens": [{"id": "upload", "purpose": "서류를 고른다", "stateOrder": ["선택"]}]})
    assert {"SCREEN_CONTRACT", "MISSING_REHEARSAL"} <= {item["code"] for item in incomplete["warnings"]}

    overlap = load_script("check_control_overlap")
    controls = {"controls": [
        {"id": "stage-filter", "role": "filter", "targetData": "claims", "changes": "visible subset", "source": "user", "purposeTags": ["show-action-needed"], "outcomes": {"sample": ["c1", "c2"]}},
        {"id": "todo-first", "role": "sort", "targetData": "claims", "changes": "priority order", "source": "proposal", "purposeTags": ["show-action-needed"], "outcomes": {"sample": ["c1", "c2", "c3"]}},
    ]}
    assert "OVERLAPPING_PURPOSE" in {item["code"] for item in overlap.check(controls)["findings"]}

    multicolumn = load_script("check_multicolumn_order")
    layout = multicolumn.measure([
        {"id": "claim-a", "dom": 0, "x": 0, "y": 0, "height": 80},
        {"id": "claim-b", "dom": 1, "x": 300, "y": 0, "height": 102},
        {"id": "claim-c", "dom": 2, "x": 0, "y": 120, "height": 80},
        {"id": "claim-d", "dom": 3, "x": 300, "y": 120, "height": 80},
    ])
    assert layout["rowMajor"] == ["claim-a", "claim-b", "claim-c", "claim-d"]
    assert layout["columnMajor"] == ["claim-a", "claim-c", "claim-b", "claim-d"]
    assert layout["rowHeightDrift"][0]["heightDriftPx"] == 22

    colors = load_script("check_semantic_colors")
    sample = json.loads((ROOT / "knowledge/semantic-color-example.json").read_text())
    assert colors.check(sample)["status"] == "PASS"
    del sample["states"]["error"]["dark"]
    assert "MISSING_SCHEME" in {item["code"] for item in colors.check(sample)["warnings"]}
    visual = load_script("check_visual_direction_render")
    assert not visual.dark_color("rgba(0, 0, 0, 0)")
    assert visual.dark_color("rgb(0, 0, 0)")
    assert visual.visible_border("1px", "rgb(0, 0, 0)")
    assert not visual.visible_border("1px", "rgba(0, 0, 0, 0)")

    reference = load_script("check_reference_comparison")
    comparison = {"reference": {"identity": "named-app", "source": "source screenshot", "checkedAt": "2026-10-28", "screenState": "list", "viewport": "390x844", "visualEvidence": "capture.png", "observationLevel": "full-screen"}, "draft": {"renderEvidence": "draft.png", "screenState": "list", "viewport": "390x844", "contentFixture": "same-list", "approvedWireframeId": "B-2"}, "comparisons": {axis: {"observed": "measured", "draftMeasured": "measured", "difference": "recorded", "decision": "adopt"} for axis in reference.AXES}}
    assert reference.audit(comparison)["status"] == "PASS"
    comparison["draft"]["viewport"] = "1280x900"
    assert "VIEWPORT_MISMATCH" in {item["code"] for item in reference.audit(comparison)["findings"]}
    comparison["draft"]["viewport"] = "390x844"
    comparison["reference"]["sourceType"] = "live-web"
    assert "MISSING_MEASURED_STATE" in {item["code"] for item in reference.audit(comparison)["findings"]}
    comparison["reference"]["measuredStates"] = [{"stateId": "list", "viewport": "390x844", "capture": "capture.png", "measurement": "list.json", "truncatedNodes": 0}]
    assert reference.audit(comparison)["status"] == "PASS"
    prototype = load_script("check_prototype_contract")
    missing_demo = prototype.check({"stage": "D", "medium": "web", "flows": []})
    assert {"NO_PROTOTYPE", "NO_FLOW", "WALKTHROUGH", "CHECK_MISSING"} <= {item["code"] for item in missing_demo["warnings"]}
    complete_demo = {"stage": "D", "medium": "web", "prototypeUrl": "http://127.0.0.1/demo", "demoDataDisclosure": "가상 데이터", "walkthrough": ["열기", "누르기", "결과 보기"], "flows": [{key: "실행 근거" for key in prototype.FLOW_FIELDS}], "checks": {key: {"result": "PASS", "evidence": "실제 브라우저 확인"} for key in prototype.CHECK_FIELDS}}
    assert prototype.check(complete_demo)["status"] == "PASS"
    print("A1 obligations, B rehearsal, C color omissions, named-reference comparison, and D prototype omissions: detected")


if __name__ == "__main__":
    main()
