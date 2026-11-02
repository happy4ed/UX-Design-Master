#!/usr/bin/env python3
"""Check required evidence for a D-stage interactive prototype.

This checks the completeness of the record, not whether the prototype works.
"""

import argparse
import json
from pathlib import Path

FLOW_FIELDS = ("start", "action", "result", "returnPath", "evidence")
CHECK_FIELDS = (
    "scroll", "primaryControls", "navigation", "branchAndRecovery",
    "motionAndStaticFeedback", "keyboardAndFocus", "touchViewport",
    "boundaryContent", "reducedMotion", "primaryActionCoverage",
    "motionPreviewEnvironment", "routeContinuity",
)


def check(data):
    warnings = []

    def warn(code, at, detail):
        warnings.append({"code": code, "at": at, "detail": detail})

    if data.get("stage") != "D":
        warn("STAGE", "stage", "확인 D 기록이어야 합니다.")
    if data.get("medium") == "read-only-document":
        if not data.get("renderEvidence"):
            warn("DOCUMENT_RENDER", "renderEvidence", "읽기 전용 문서의 실제 페이지 미리보기 근거가 필요합니다.")
        return {"status": "WARN" if warnings else "PASS", "warnings": warnings, "note": "기록 완전성만 검사합니다."}
    if data.get("medium") not in {"app", "web", "interactive-document"}:
        warn("MEDIUM", "medium", "매체를 app/web/interactive-document/read-only-document로 지정하세요.")
    if not data.get("prototypeUrl"):
        warn("NO_PROTOTYPE", "prototypeUrl", "직접 열어 조작할 프로토타입 위치가 필요합니다.")
    if not data.get("demoDataDisclosure"):
        warn("DEMO_SCOPE", "demoDataDisclosure", "데모 데이터와 미구현 범위를 밝혀야 합니다.")
    if not data.get("walkthrough") or len(data["walkthrough"]) < 3:
        warn("WALKTHROUGH", "walkthrough", "사용자가 따라갈 3단계 이상의 시연 경로가 필요합니다.")
    flows = data.get("flows", [])
    if not flows:
        warn("NO_FLOW", "flows", "시작부터 결과·복귀까지의 대표 과업이 필요합니다.")
    for index, flow in enumerate(flows):
        for field in FLOW_FIELDS:
            if not flow.get(field):
                warn("FLOW_FIELD", f"flows[{index}].{field}", "경로 단계와 실제 조작 근거가 필요합니다.")
    checks = data.get("checks", {})
    for field in CHECK_FIELDS:
        item = checks.get(field)
        if not isinstance(item, dict) or item.get("result") not in {"PASS", "FAIL", "NOT_APPLICABLE"} or not item.get("evidence"):
            warn("CHECK_MISSING", f"checks.{field}", "결과와 실제 실행 근거가 필요합니다.")
        elif item["result"] == "FAIL":
            warn("CHECK_FAIL", f"checks.{field}", "제시 전 수정하거나 실패 범위를 명시해야 합니다.")
    return {"status": "WARN" if warnings else "PASS", "warnings": warnings, "note": "기록 완전성만 검사합니다. PASS는 실제 동작·사용성·모션 품질의 PASS가 아닙니다."}


def main():
    parser = argparse.ArgumentParser(description="확인 D 조작형 프로토타입 기록 검사")
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(check(json.loads(args.input.read_text())), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
