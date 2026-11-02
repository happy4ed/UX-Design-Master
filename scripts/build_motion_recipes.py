#!/usr/bin/env python3
"""Compile per-motion authoring contracts from the internal motion catalogs.

The generated contract distinguishes captured source wording, later user
corrections, and target-project parameters. It does not certify fidelity.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = ROOT / "knowledge"


def load(name):
    return json.loads((CAT / name).read_text(encoding="utf-8"))


taxonomy = load("motion-taxonomy.json")
graph = load("motion-component-graph.json")
source = {x["id"]: x for x in load("motion-source-behavior.json")["entries"]}
cues = {x["id"]: x for x in load("motion-construction-cues.json")["entries"]}
families = load("motion-family-policy.json")["families"]
terms = {e["id"]: e for c in taxonomy["categories"] for e in c["entries"]}

# These supersede older captured wording where the user later specified the
# decisive behavior. The old wording remains in sourceSnapshot for provenance.
corrections = {
    "shutter-wipe": {
        "action": "조리개 날이 찰칵 닫혀 화면을 완전히 가리고, 닫힌 순간 장면을 교체한 뒤 날이 다시 열려 다음 화면을 드러낸다.",
        "avoid": "단순 원형 마스크가 한 방향으로 닫히기만 하는 동작으로 대체하지 않는다.",
    },
    "brush-wipe": {
        "action": "붓 끝이 자유 곡선을 따라 움직이고 실제 붓 자국의 폭·가장자리·겹침이 생기며 칠한 영역부터 다음 화면이 드러난다.",
        "avoid": "직선 마스크나 균일한 사각형 채우기로 대체하지 않는다.",
    },
    "text-vortex": {
        "action": "긴 문장의 맨 끝 글자부터 각각 늘어나며 휘어 들어가고, 글자별 회전 속도가 중심에 가까울수록 빨라지며 연속적으로 빨려 들어간다.",
        "avoid": "문장 전체를 한 덩어리로 회전시키거나 구멍 도형을 남기거나 글자가 끊겨 순간 이동하게 하지 않는다.",
    },
    "bar-race": {
        "action": "가로 막대 길이가 실제 값에 따라 변하고, 순위가 바뀌는 순간 막대가 새 순위 행으로 직접 이동한다.",
        "avoid": "막대를 목록 바깥으로 보냈다가 다시 들여오지 않는다.",
    },
    "stroke-then-fill": {
        "action": "선과 면이 같은 진행률로 동시에 완성되어 하나의 형상이 함께 채워진다.",
        "avoid": "선을 모두 그린 다음 면을 별도 단계로 채우지 않는다.",
    },
    "paper-cut": {
        "action": "텍스트나 도형의 실제 외곽을 따라 종이가 절개되고, 오려낸 조각이 종이 면에서 분리되며 아래 층이 보인다.",
        "avoid": "직사각형 구멍을 열거나 단순 클립 패스로만 대체하지 않는다.",
    },
    "morph-cut": {
        "action": "같은 인물의 전후 테이크 사이에서 얼굴의 위치·각도·표정을 추적해 중간 형상을 보간하여 점프컷의 튐을 잇는다.",
        "avoid": "두 얼굴 그림을 단순 crossfade하거나 얼굴 윤곽만 흔드는 것을 실제 모프 컷으로 표시하지 않는다.",
    },
    "orbit": {
        "action": "대상은 고정하고 카메라가 대상 둘레를 이동한다. 대상의 보이는 면과 바닥·배경의 원근이 함께 바뀐다.",
        "avoid": "카메라가 고정된 채 대상을 평면 회전시키는 동작으로 바꾸지 않는다.",
    },
    "ribbon-reveal": {
        "action": "실제 리본이 내용을 가린 상태에서 매듭이 풀리고 양쪽 띠가 말리며 벗겨져, 가려져 있던 내용이 순서대로 드러난다.",
        "avoid": "단순 색 띠가 지나가는 화면 와이프로 대체하지 않는다.",
    },
    "smear": {
        "action": "손이나 대상이 빠르게 이동하는 한두 중간 프레임에서 실제 형태의 윤곽 전체가 진행 방향으로 길게 늘어난 뒤 정상 형태로 돌아온다.",
        "avoid": "타원형 잔상이나 블러만으로 대체하지 않는다.",
    },
}

use_states = {
    "spatial-exploration": ("탐색할 대상과 현재 시점이 보인다", "대상과 새 시점이 함께 읽힌다"),
    "spatial-emphasis": ("원래 시점·초점의 대상이 보인다", "강조 대상과 새 시점이 읽힌다"),
    "scene-transition": ("나가는 화면과 들어올 화면의 상태가 준비된다", "들어온 화면이 빈 프레임 없이 온전히 남는다"),
    "text-reveal": ("텍스트 자리와 읽기 순서가 정해진다", "전체 문구가 읽히는 상태로 남는다"),
    "text-emphasis": ("강조 전에도 핵심 문구가 접근 가능하다", "강조 후 문구 전체가 읽힌다"),
    "text-transformation": ("변형 전 문구가 의미와 위치를 가진다", "변형 후 문구가 읽히거나 의도한 다음 내용으로 이어진다"),
    "physical-feedback": ("입력 전 상태와 조작 대상이 명확하다", "입력 결과와 다음 조작 가능 상태가 명확하다"),
    "media-effect": ("원본 이미지·영상의 내용이 준비된다", "효과 뒤에도 핵심 내용이 읽힌다"),
    "ambient-background": ("전경 정보가 읽히는 기본 배경이 있다", "전경을 방해하지 않는 배경 상태가 유지된다"),
    "data-change": ("이전 값과 다음 값의 데이터 출처가 정해진다", "최종 값·단위·범례가 정적으로도 읽힌다"),
    "icon-feedback": ("아이콘의 이전 상태와 의미가 정해진다", "새 상태를 색·움직임 외의 기호나 글자로도 알 수 있다"),
    "social-feedback": ("사용자 사건과 이전 상태가 명확하다", "반응·알림·완료 상태와 취소 경로가 읽힌다"),
    "graphic-explanation": ("도형·이미지의 설명 대상이 정해진다", "최종 구조와 라벨이 모두 읽힌다"),
    "title-opening": ("도입 전에도 문구의 읽기 순서가 정해진다", "완성된 표제와 다음 내용이 읽힌다"),
    "numeric-feedback": ("원값·새 값·단위가 정해진다", "최종 숫자와 의미가 정적으로도 읽힌다"),
    "diagram-explanation": ("도식의 원값·노드·관계가 정해진다", "모든 관계·라벨·화살촉이 정적으로도 판독된다"),
}

recipes = []
for linked in graph["motions"]:
    mid = linked["id"]
    entry, snapshot, cue = terms[mid], source[mid], cues[mid]
    policy = families[entry["familyId"]]
    correction = corrections.get(mid, {})
    before, after = use_states[linked["useType"]]
    action = correction.get("action") or snapshot.get("behavior") or "원본 동작 설명 확인 필요"
    recipes.append({
        "id": mid,
        "name": linked["name"],
        "english": linked["english"],
        "classification": {
            "useType": linked["useType"],
            "movementScale": linked["movementScale"],
            "changeProperties": linked["motionAxes"],
            "sourceFamilyId": linked["sourceFamilyId"],
            "candidateComponentIds": linked["componentIds"],
            "candidateStatus": "candidate_for; verify against the actual component state",
        },
        "motionPrinciple": {
            "target": "Choose an actual instance of a candidate component whose state change exposes this action",
            "triggerCandidates": entry.get("triggerCandidates") or policy.get("triggerCandidates", []),
            "initialState": before,
            "action": action,
            "decisiveMiddle": "동작 정의의 핵심 변화가 보이는 프레임을 직접 선택·검증한다",
            "phaseCuesFromSource": cue.get("phaseOrder", []),
            "settledState": after,
            "doNotSubstitute": correction.get("avoid") or snapshot.get("contrast") or "다른 모션의 공통 키프레임만 이름을 바꿔 쓰지 않는다",
            "interruption": "재입력·취소·역전 시 현재 보이는 상태에서 잇거나 완료 상태로 즉시 정착하도록 제품에서 정한다",
        },
        "parameters": {
            "sourceDurationSeconds": cue.get("sourceDurationSeconds", []),
            "sourceMeasures": cue.get("measures", []),
            "directionCues": cue.get("directions", []),
            "distanceAndAngle": "실제 대상 크기·뷰포트·기기에서 정하고 렌더로 측정",
            "durationAndEase": "원본 관찰값과 제품 설계값을 분리해 기록; 복사 적용 금지",
            "repeatPolicy": "기본은 사건당 1회; 반복이 의미를 전달하면 별도 합의",
        },
        "implementation": {
            "webRouteCandidates": entry.get("webRoutes") or policy.get("routes", []),
            "sourceProductionRoutes": cue.get("productionRoutes", []),
            "app": "상태 모델을 네이티브 애니메이션·벡터·캔버스/3D 중 표현 가능한 경로로 구현; 시스템 움직임 감소와 뒤로 가기를 연결",
            "web": "상태를 DOM/ARIA와 동기화하고 CSS/WAAPI/SVG/Canvas/WebGL 중 동작을 재현하는 경로를 선택; 정지 프레임과 모션 감소 제공",
            "ppt": "단계별 편집 가능한 도형 전환으로 핵심 동작이 재현되면 사용; 마스크·물성·3D·합성은 로컬 렌더 영상으로 삽입하고 마지막 상태를 정지 슬라이드로 제공",
            "document": "인쇄·PDF에는 시작/결정적 중간/끝 도해 또는 최종 정지 상태를 제공; HTML 문서의 필수 상호작용만 웹 경로로 구현",
        },
        "fallback": {
            "sourceStaticFallback": entry.get("staticFallback") or policy.get("staticFallback", ""),
            "reducedMotion": entry.get("reducedMotion") or policy.get("reducedMotion", ""),
        },
        "evidenceAndReview": {
            "capturedSourceBehavior": snapshot.get("behavior", ""),
            "capturedProductionPrompt": snapshot.get("productionPrompt", ""),
            "sourceObservationStatus": snapshot.get("observationStatus", "UNKNOWN"),
            "userCorrectionApplied": mid in corrections,
            "demo": linked["demo"],
            "demoImplementation": linked["implementation"],
            "mustCompare": ["moving target", "start state", "change axis and path", "event order", "decisive middle frame", "settled state", "repetition or reversal"],
            "fidelityStatus": "NOT_RUN: this compiled contract alone does not verify source-to-output fidelity",
        },
    })

assert len(recipes) == graph["motionCount"] == 343
assert len({x["id"] for x in recipes}) == len(recipes)
assert all(x["motionPrinciple"]["action"] and x["classification"]["candidateComponentIds"] for x in recipes)
out = {
    "schemaVersion": "1.0",
    "purpose": "Per-motion authoring contracts for app, web, presentation, and document output",
    "contractStatus": "compiled from internal source text, later user corrections, taxonomy and component KG; individual source/output fidelity is separate",
    "count": len(recipes),
    "media": ["app", "web", "ppt", "document"],
    "userCorrectedMotionIds": sorted(corrections),
    "recipes": recipes,
}
(CAT / "motion-authoring-recipes.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f'{len(recipes)} motion contracts; {len(corrections)} explicit user corrections')
