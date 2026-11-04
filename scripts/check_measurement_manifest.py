#!/usr/bin/env python3
"""Check linked per-state measurement evidence and declared before/after invariants."""
import argparse
import json
from pathlib import Path


def audit(data):
    findings = []
    states = data.get("states", [])
    if not isinstance(states, list) or not states:
        return {"status": "FAIL", "findings": [{"code": "NO_STATES", "path": "states"}]}
    by_id = {}
    for index, state in enumerate(states):
        path = f"states[{index}]"
        if not isinstance(state, dict):
            findings.append({"code": "INVALID_STATE", "path": path})
            continue
        state_id = state.get("id")
        if not state_id or state_id in by_id:
            findings.append({"code": "MISSING_OR_DUPLICATE_ID", "path": path})
        else:
            by_id[state_id] = state
        for key in ("screenId", "stateId", "capture"):
            if not state.get(key):
                findings.append({"code": "MISSING_STATE_FIELD", "path": f"{path}.{key}"})
        if not state.get("alignmentSource"):
            findings.append({"code": "MISSING_ALIGNMENT_EVIDENCE", "path": f"{path}.alignmentSource"})
        viewport = state.get("viewport") if isinstance(state.get("viewport"), dict) else {}
        if not all(isinstance(viewport.get(key), (int, float)) and viewport[key] > 0 for key in ("width", "height")):
            findings.append({"code": "MISSING_VIEWPORT", "path": f"{path}.viewport"})
        environment = state.get("environment") if isinstance(state.get("environment"), dict) else {}
        for key in ("device", "dpr", "zoom", "fontLoaded", "scrollbarMode", "language"):
            if key not in environment or environment[key] in (None, ""):
                findings.append({"code": "MISSING_ENVIRONMENT", "path": f"{path}.environment.{key}"})
        measurement = state.get("measurement") if isinstance(state.get("measurement"), dict) else {}
        if not measurement.get("source") or not isinstance(measurement.get("landmarks"), list):
            findings.append({"code": "MISSING_MEASUREMENT", "path": f"{path}.measurement"})
        for item in measurement.get("landmarks", []) if isinstance(measurement.get("landmarks"), list) else []:
            if not item.get("id") or not all(isinstance(item.get(axis), (int, float)) for axis in ("x", "y")):
                findings.append({"code": "INVALID_LANDMARK", "path": f"{path}.measurement.landmarks"})
        review = state.get("visualReview") if isinstance(state.get("visualReview"), dict) else {}
        if review.get("status") not in {"PASS", "FAIL", "NOT_RUN", "NOT_APPLICABLE"}:
            findings.append({"code": "MISSING_VISUAL_REVIEW", "path": f"{path}.visualReview"})
        elif review["status"] == "PASS" and not review.get("evidence"):
            findings.append({"code": "PASS_WITHOUT_EVIDENCE", "path": f"{path}.visualReview.evidence"})
    for required in data.get("requiredStateIds", []):
        if required not in by_id:
            findings.append({"code": "MISSING_REQUIRED_STATE", "path": f"requiredStateIds.{required}"})
    file_root = data.get("fileRoot")
    if file_root:
        root = Path(file_root)
        for state in states:
            if not isinstance(state, dict):
                continue
            for key, value in (("capture", state.get("capture")), ("measurement.source", (state.get("measurement") or {}).get("source")), ("alignmentSource", state.get("alignmentSource"))):
                if isinstance(value, str) and "://" not in value and not (root / value).is_file():
                    findings.append({"code": "MISSING_EVIDENCE_FILE", "path": f"{state.get('id')}.{key}", "file": value})
    transitions = []
    for index, transition in enumerate(data.get("transitions", [])):
        path = f"transitions[{index}]"
        if not isinstance(transition, dict):
            findings.append({"code": "INVALID_TRANSITION", "path": path})
            continue
        before, after = by_id.get(transition.get("before")), by_id.get(transition.get("after"))
        if not before or not after or not transition.get("action"):
            findings.append({"code": "INVALID_TRANSITION", "path": path})
            continue
        if before.get("viewport") != after.get("viewport"):
            findings.append({"code": "VIEWPORT_MISMATCH", "path": path})
        if before.get("environment") != after.get("environment") and not transition.get("allowEnvironmentChange"):
            findings.append({"code": "ENVIRONMENT_MISMATCH", "path": path})
        result = {"id": transition.get("id", f"transition-{index+1}"), "landmarkDeltas": []}
        before_marks = {mark["id"]: mark for mark in before.get("measurement", {}).get("landmarks", []) if mark.get("id")}
        after_marks = {mark["id"]: mark for mark in after.get("measurement", {}).get("landmarks", []) if mark.get("id")}
        for rule in transition.get("stableLandmarks", []):
            mark_id, axis, limit = rule.get("id"), rule.get("axis", "x"), rule.get("maxDeltaPx")
            if not mark_id or axis not in {"x", "y"} or not isinstance(limit, (int, float)) or limit < 0:
                findings.append({"code": "INVALID_LANDMARK_RULE", "path": path})
                continue
            if mark_id not in before_marks or mark_id not in after_marks:
                findings.append({"code": "MISSING_TRANSITION_LANDMARK", "path": f"{path}.{mark_id}"})
                continue
            delta = round(after_marks[mark_id][axis] - before_marks[mark_id][axis], 2)
            result["landmarkDeltas"].append({"id": mark_id, "axis": axis, "deltaPx": delta, "maxDeltaPx": limit})
            if abs(delta) > limit:
                findings.append({"code": "LANDMARK_DRIFT", "path": f"{path}.{mark_id}", "deltaPx": delta, "maxDeltaPx": limit})
        observed = transition.get("observed", {})
        before_measurement, after_measurement = before.get("measurement") or {}, after.get("measurement") or {}
        focus_before = observed.get("focusBefore", before_measurement.get("focus"))
        focus_after = observed.get("focusAfter", after_measurement.get("focus"))
        if transition.get("preserveFocus"):
            if not focus_before or not focus_after:
                findings.append({"code": "FOCUS_NOT_MEASURED", "path": path})
            elif focus_before != focus_after:
                findings.append({"code": "FOCUS_CHANGED", "path": path})
        if transition.get("preserveScroll"):
            limit = transition.get("maxScrollDeltaPx")
            scroll_before = observed.get("scrollBeforePx", (before_measurement.get("scroll") or {}).get("y"))
            scroll_after = observed.get("scrollAfterPx", (after_measurement.get("scroll") or {}).get("y"))
            if not isinstance(limit, (int, float)) or limit < 0 or not all(isinstance(value, (int, float)) for value in (scroll_before, scroll_after)):
                findings.append({"code": "SCROLL_NOT_MEASURED", "path": path})
            elif abs(scroll_after - scroll_before) > limit:
                findings.append({"code": "SCROLL_CHANGED", "path": path, "deltaPx": round(scroll_after - scroll_before, 2)})
        transitions.append(result)
    found_transition_ids = {transition["id"] for transition in transitions}
    for required in data.get("requiredTransitionIds", []):
        if required not in found_transition_ids:
            findings.append({"code": "MISSING_REQUIRED_TRANSITION", "path": f"requiredTransitionIds.{required}"})
    return {"status": "FAIL" if findings else "PASS", "stateCount": len(states), "transitionCount": len(transitions), "findings": findings, "transitions": transitions,
            "note": "기록 완전성과 선언된 수치 불변식만 검사한다. 스크린샷의 광학 정렬과 조작 품질은 직접 확인한다."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    args = parser.parse_args()
    report = audit(json.loads(args.input.read_text(encoding="utf-8")))
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
