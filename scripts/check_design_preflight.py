#!/usr/bin/env python3
"""Check that B/C rehearsal evidence has been recorded before presentation.

This deliberately does not score design quality. The actual rendered screens
and the user's decisions remain the source of quality judgment.
"""

import argparse
import json
from pathlib import Path

REHEARSAL = (
    "screenPurposeAndStateOrder",
    "controlOverlap",
    "businessRuleFixtures",
    "multicolumnOrderAndAlignment",
    "sourceVsComputedValues",
    "priorFeedbackPropagation",
    "functionalInventoryCoverage",
)
C_FIELDS = (
    "componentMeasurements",
    "selectionStyleSignature",
    "controlVisualHierarchy",
    "axisMixing",
    "semanticColorExamples",
    "platformConventionCheck",
)


def check(data):
    warnings = []
    stage = data.get("stage")
    if stage not in {"B", "C"}:
        warnings.append({"code": "STAGE", "at": "stage", "detail": "B 또는 C가 필요합니다."})
    for screen in data.get("screens", []):
        sid = screen.get("id", "<id 없음>")
        if not screen.get("purpose") or not screen.get("stateOrder") or not screen.get("renderEvidence"):
            warnings.append({"code": "SCREEN_CONTRACT", "at": sid, "detail": "목적·상태 순서·실제 렌더 근거가 필요합니다."})
    if not data.get("screens"):
        warnings.append({"code": "NO_SCREENS", "at": "screens", "detail": "검토할 화면이 없습니다."})
    rehearsal = data.get("rehearsal", {})
    for key in REHEARSAL:
        item = rehearsal.get(key)
        if not isinstance(item, dict) or item.get("result") not in {"PASS", "FAIL", "NOT_APPLICABLE"} or not item.get("evidence"):
            warnings.append({"code": "MISSING_REHEARSAL", "at": f"rehearsal.{key}", "detail": "결과와 근거가 필요합니다."})
    if stage == "C":
        directions = data.get("visualDirections", [])
        if len(directions) < 9:
            warnings.append({"code": "VISUAL_DIRECTIONS", "at": "visualDirections", "detail": "같은 승인 구조의 실제 렌더 테마 9개가 필요합니다."})
        for direction in directions:
            did = direction.get("id", "<id 없음>")
            for key in C_FIELDS:
                if not direction.get(key):
                    warnings.append({"code": "MISSING_C_CONTRACT", "at": f"visualDirections.{did}.{key}", "detail": "방향별 실측·검토 기록이 필요합니다."})
    return {"status": "WARN" if warnings else "PASS", "warnings": warnings, "note": "기록 완전성만 검사한다. PASS는 사용성·일관성·시각 품질의 PASS가 아니다."}


def main():
    parser = argparse.ArgumentParser(description="확인 B·C 제시 전 리허설 기록 검사")
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(check(json.loads(args.input.read_text())), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
