#!/usr/bin/env python3
"""Check evidence completeness for a named-reference visual comparison."""

import argparse
import json
from pathlib import Path

AXES = ("gridAlignment", "typography", "spacing", "surfacesDepth", "colorRoles", "assets", "states")
REFERENCE_FIELDS = ("identity", "source", "checkedAt", "screenState", "viewport", "visualEvidence", "observationLevel")


def audit(data):
    findings = []

    def warn(code, at, detail):
        findings.append({"code": code, "at": at, "detail": detail})

    reference = data.get("reference", {})
    draft = data.get("draft", {})
    for key in REFERENCE_FIELDS:
        if not reference.get(key):
            warn("MISSING_REFERENCE_EVIDENCE", f"reference.{key}", "지정 레퍼런스의 실제 관찰 근거가 필요합니다.")
    for key in ("renderEvidence", "screenState", "viewport", "contentFixture", "approvedWireframeId"):
        if not draft.get(key):
            warn("MISSING_DRAFT_EVIDENCE", f"draft.{key}", "승인된 구조와 같은 콘텐츠의 실제 가안이 필요합니다.")
    if reference.get("viewport") and draft.get("viewport") and reference["viewport"] != draft["viewport"]:
        warn("VIEWPORT_MISMATCH", "draft.viewport", "원본과 가안을 같은 뷰포트에서 비교하세요.")
    if reference.get("screenState") and draft.get("screenState") and reference["screenState"] != draft["screenState"]:
        warn("STATE_MISMATCH", "draft.screenState", "원본과 가안의 화면 상태가 다릅니다.")
    if reference.get("observationLevel") in {"thumbnail", "partial-crop"}:
        warn("LIMITED_REFERENCE", "reference.observationLevel", "부분 근거만으로 전체 화면 스타일을 확정하지 마세요.")
    comparisons = data.get("comparisons", {})
    for axis in AXES:
        item = comparisons.get(axis)
        if not isinstance(item, dict) or not all(item.get(key) for key in ("observed", "draftMeasured", "difference", "decision")):
            warn("MISSING_AXIS_COMPARISON", f"comparisons.{axis}", "원본 관찰·가안 실측·차이·채택/수정/의도적 변경을 기록하세요.")
    return {"status": "WARN" if findings else "PASS", "findings": findings, "note": "근거와 비교 기록의 완전성만 검사한다. 시각 유사도나 디자인 품질의 PASS가 아니다."}


def main():
    parser = argparse.ArgumentParser(description="지정 레퍼런스 원본·가안 비교 계약 검사")
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(audit(json.loads(args.input.read_text())), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
