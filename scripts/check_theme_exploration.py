#!/usr/bin/env python3
"""Check evidence and diversity in the nine-theme C→production handoff.

This checks records and explicit axes, not actual visual quality or approval.
"""

import argparse
import json
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / "knowledge/theme-exploration-archetypes.json").read_text(encoding="utf-8"))
AXES = CATALOG["axes"]
ARCHETYPES = {x["id"] for x in CATALOG["directions"]}
NON_COLOR_AXES = [x for x in AXES if x != "palette"]


def check(data):
    warnings = []

    def warn(code, at, detail):
        warnings.append({"code": code, "at": at, "detail": detail})

    stage = data.get("stage")
    if stage not in {"C-candidates", "C-selected", "final"}:
        warn("STAGE", "stage", "C-candidates / C-selected / final 중 하나가 필요합니다")
    for key in ("approvedWireframeId", "sameContentFixtureId", "comparisonViewport"):
        if not data.get(key):
            warn("COMPARISON_BASIS", key, "같은 승인 구조·콘텐츠·표시 크기를 기록하세요")

    directions = data.get("directions", [])
    if len(directions) != 9:
        warn("NINE_RENDERED_THEMES", "directions", f"렌더된 테마 9개가 필요합니다. 현재 {len(directions)}개")
    ids = [d.get("id") for d in directions]
    if len(set(ids)) != len(ids):
        warn("DUPLICATE_ID", "directions", "테마 ID가 중복됩니다")
    previews = [d.get("renderEvidence") for d in directions if d.get("renderEvidence")]
    if len(set(previews)) != len(previews):
        warn("REUSED_PREVIEW", "directions", "서로 다른 테마에 같은 렌더 이미지를 재사용했습니다")
    screen_states = {d.get("sameScreenState") for d in directions if d.get("sameScreenState")}
    if len(screen_states) > 1:
        warn("DIFFERENT_SCREEN_STATE", "directions", "9개 테마를 같은 화면·상태에서 비교하세요")
    roles = [d.get("role") for d in directions]
    for role in ("grounded", "expressive", "experimental"):
        if role not in roles:
            warn("MISSING_ROLE", "directions", f"{role} 계열이 없습니다")
    for d in directions:
        did = d.get("id", "<id 없음>")
        if d.get("archetypeId") not in ARCHETYPES and not (d.get("replacementFor") in ARCHETYPES and d.get("replacementReason")):
            warn("ARCHETYPE_OR_REPLACEMENT", did, "탐색 원형 또는 제품 사유가 있는 교체 기록이 필요합니다")
        if not d.get("renderEvidence") or not d.get("fullSizePreview"):
            warn("RENDER_EVIDENCE", did, "실제 대표 화면과 원래 표시 크기 미리보기가 필요합니다")
        if not d.get("sameScreenState"):
            warn("STATE_EVIDENCE", did, "비교에 사용한 화면·상태를 적으세요")
        if not d.get("taskFit") or not d.get("accessibilityEvidence"):
            warn("FIT_AND_ACCESSIBILITY", did, "과업 적합성과 접근성 검토 근거가 필요합니다")
        axes = d.get("axes", {})
        for axis in AXES:
            if not axes.get(axis):
                warn("MISSING_AXIS", f"{did}.axes.{axis}", "테마별 축 값을 적으세요")

    for a, b in combinations(directions, 2):
        aa, bb = a.get("axes", {}), b.get("axes", {})
        if all(aa.get(x) and bb.get(x) for x in NON_COLOR_AXES):
            changed = [x for x in NON_COLOR_AXES if aa[x] != bb[x]]
            if len(changed) < 2:
                warn("COLOR_OR_SINGLE_AXIS_DUPLICATE", f"{a.get('id')}↔{b.get('id')}", "색을 제외한 시각 문법 축이 두 개 이상 달라야 합니다")
    for axis in ("composition", "spacing", "radius", "componentStyle", "material", "typography"):
        values = {json.dumps(d.get("axes", {}).get(axis), ensure_ascii=False, sort_keys=True) for d in directions if d.get("axes", {}).get(axis)}
        if len(directions) == 9 and len(values) == 1:
            warn("NO_AXIS_VARIATION", axis, "9개 안에서 이 축이 전혀 변하지 않았습니다")

    if stage in {"C-selected", "final"}:
        selection = data.get("selection", {})
        if not selection.get("userDecisionEvidence") or not selection.get("selectedThemeId"):
            warn("USER_SELECTION", "selection", "사용자가 선택·조합한 근거와 새 방향 ID가 필요합니다")
        if not selection.get("selectedRenderEvidence"):
            warn("SELECTED_RENDER", "selection", "선택·조합안을 다시 렌더한 근거가 필요합니다")
        if selection.get("selectedThemeId") not in ids and not selection.get("sourceThemeIds"):
            warn("HYBRID_SOURCES", "selection", "새 조합안이면 어떤 테마의 축을 합쳤는지 적으세요")
    if stage == "final":
        handoff = data.get("productionHandoff", {})
        for key in ("tokenSystem", "componentStates", "appliedScreens", "boundaryRenderEvidence"):
            if not handoff.get(key):
                warn("PRODUCTION_HANDOFF", f"productionHandoff.{key}", "선택 테마가 실제 결과물에 이월된 근거가 필요합니다")
        review = data.get("independentReview", {})
        if review.get("status") not in {"PASS", "FAIL", "NOT_RUN"}:
            warn("INDEPENDENT_REVIEW", "independentReview.status", "별도 에이전트 검수 결과가 필요합니다")
        if review.get("status") in {"PASS", "FAIL"} and not (review.get("agentEvidence") and review.get("artifactEvidence") and review.get("findings") is not None):
            warn("INDEPENDENT_EVIDENCE", "independentReview", "별도 에이전트·실제 결과물·발견 기록이 필요합니다")
        if review.get("status") == "NOT_RUN" and not review.get("reason"):
            warn("INDEPENDENT_NOT_RUN_REASON", "independentReview", "미실행 이유를 기록하세요")
        if review.get("status") in {"FAIL", "NOT_RUN"}:
            warn("INDEPENDENT_NOT_CLEARED", "independentReview", "별도 검증이 통과하지 않아 릴리즈 준비 PASS가 아닙니다")
        if review.get("blockingCount", 0) > 0:
            warn("OPEN_BLOCKING_FINDINGS", "independentReview", "차단 문제가 남아 있습니다")
    return {"status": "WARN" if warnings else "PASS", "warnings": warnings,
            "note": "기록·축 다양성의 후보만 검사한다. PASS는 렌더 품질, 사용자 승인, 독립 검수의 대체물이 아니다."}


def main():
    parser = argparse.ArgumentParser(description="확인 C 9개 테마 탐색과 선택안 제작 이월 기록 점검")
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(check(json.loads(args.input.read_text(encoding="utf-8"))), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
