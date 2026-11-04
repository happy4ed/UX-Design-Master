#!/usr/bin/env python3
"""Build candidate motion→component knowledge links from the maintained catalogs.

These are semantic recommendations, not claims that all 343 recipes were rendered
inside every linked component. Product-specific fit still needs a real preview.
"""

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = ROOT / "knowledge"


def read(name):
    return json.loads((CAT / name).read_text(encoding="utf-8"))


taxonomy = read("motion-taxonomy.json")
progress = read("motion-core-progress.json")
components = read("core-components.json")
unique = set(progress["standaloneUniqueMotionIds"])
component_by_id = {item["id"]: item for item in components["entries"]}

# Contextual defaults are intentionally narrow. Specific actions below override
# them, preventing a screen transition from being recommended for every button.
defaults = {
    "family-01": ("spatial-exploration", "large", ["image", "media-player", "canvas-input"]),
    "family-02": ("spatial-emphasis", "large", ["image", "media-player", "carousel"]),
    "family-03": ("scene-transition", "screen", ["page-shell", "carousel", "tab-panel"]),
    "family-04": ("text-reveal", "medium", ["heading", "text"]),
    "family-05": ("physical-feedback", "medium", ["button", "icon", "card"]),
    "family-06": ("media-effect", "large", ["image", "media-player"]),
    "family-07": ("scene-transition", "screen", ["page-shell", "carousel", "tab-panel"]),
    "family-08": ("ambient-background", "large", ["surface", "section", "page-shell"]),
    "family-09": ("text-emphasis", "large", ["heading", "text"]),
    "family-10": ("text-transformation", "medium", ["heading", "text"]),
    "family-11": ("scene-transition", "screen", ["page-shell", "carousel", "tab-panel"]),
    "family-12": ("data-change", "medium", ["chart", "meter", "progress-bar"]),
    "family-13": ("icon-feedback", "small", ["icon", "icon-button", "status-indicator"]),
    "family-14": ("social-feedback", "medium", ["feed", "notification-item", "button"]),
    "family-15": ("graphic-explanation", "medium", ["image", "chart", "canvas-input"]),
    "family-16": ("ambient-background", "large", ["surface", "section", "page-shell"]),
    "family-17": ("title-opening", "large", ["heading", "section", "page-shell"]),
    "family-18": ("numeric-feedback", "medium", ["badge", "meter", "chart"]),
    "family-19": ("diagram-explanation", "medium", ["chart", "timeline", "stepper"]),
}

uses = {
    "spatial-exploration": "공간·대상 탐색",
    "spatial-emphasis": "시점·초점 강조",
    "scene-transition": "화면·장면 전환",
    "text-reveal": "글자 공개",
    "text-emphasis": "글자 강조",
    "text-transformation": "글자 형태 변화",
    "physical-feedback": "입력·물리 피드백",
    "media-effect": "영상·이미지 효과",
    "ambient-background": "배경 분위기",
    "data-change": "데이터 변화 설명",
    "icon-feedback": "아이콘 상태 피드백",
    "social-feedback": "소셜·알림 피드백",
    "graphic-explanation": "그래픽 구조 설명",
    "title-opening": "표제·도입 연출",
    "numeric-feedback": "숫자 변화 강조",
    "diagram-explanation": "도식 관계 설명",
}

scales = {
    "small": "한 요소 안의 작은 변화: 아이콘·배지·짧은 이동",
    "medium": "요소 크기 정도의 이동·변형: 카드·글자·차트 부분",
    "large": "영역 대부분을 바꾸는 이동·변형: 제목·이미지·배경 구역",
    "screen": "화면 전체 또는 화면 경계를 지나는 변화",
}

# Specific component anatomy and state have priority over the family default.
# The value is (use type, movement scale, compatible component IDs).
overrides = {
    "impact-shake": ("physical-feedback", "small", ["card", "alert", "icon"]),
    "line-draw": ("graphic-explanation", "medium", ["chart", "timeline", "image"]),
    "shape-morph": ("graphic-explanation", "medium", ["icon", "image", "chart"]),
    "count-up": ("numeric-feedback", "small", ["badge", "meter", "chart"]),
    "pop-in": ("physical-feedback", "small", ["button", "badge", "icon"]),
    "smear": ("physical-feedback", "large", ["image", "card", "page-shell"]),
    "burst": ("physical-feedback", "medium", ["icon", "button", "status-indicator"]),
    "particles": ("graphic-explanation", "large", ["image", "heading", "page-shell"]),
    "bar-grow": ("data-change", "medium", ["chart"]),
    "bar-race": ("data-change", "large", ["chart"]),
    "bar-swap": ("data-change", "medium", ["chart"]),
    "stacked-build": ("data-change", "medium", ["chart"]),
    "waterfall-steps": ("data-change", "medium", ["chart"]),
    "goal-fill": ("data-change", "medium", ["progress-bar", "meter"]),
    "line-chart-draw": ("data-change", "medium", ["chart"]),
    "area-fill": ("data-change", "medium", ["chart"]),
    "point-pop": ("data-change", "small", ["chart"]),
    "peak-callout": ("data-change", "small", ["chart", "tooltip"]),
    "line-cross": ("data-change", "medium", ["chart"]),
    "pie-sweep": ("data-change", "medium", ["chart"]),
    "donut-split": ("data-change", "medium", ["chart"]),
    "treemap-split": ("data-change", "medium", ["chart"]),
    "waffle-fill": ("data-change", "medium", ["chart"]),
    "isotype-row": ("data-change", "medium", ["chart"]),
    "odometer-roll": ("numeric-feedback", "small", ["badge", "meter", "chart"]),
    "number-punch": ("numeric-feedback", "medium", ["badge", "chart"]),
    "delta-badge": ("numeric-feedback", "small", ["badge", "chart"]),
    "percent-ring": ("data-change", "medium", ["meter", "progress-bar", "chart"]),
    "check-draw": ("icon-feedback", "small", ["checkmark", "checkbox", "status-indicator"]),
    "heart-burst": ("icon-feedback", "small", ["icon-button", "rating", "button"]),
    "star-fill": ("icon-feedback", "small", ["rating", "icon", "status-indicator"]),
    "toggle-on": ("physical-feedback", "small", ["switch", "toggle-button"]),
    "badge-count": ("numeric-feedback", "small", ["badge", "notification-item"]),
    "spinner-arc": ("icon-feedback", "small", ["spinner", "button"]),
    "dots-wave": ("icon-feedback", "small", ["spinner", "chat-message"]),
    "breathe-pulse": ("icon-feedback", "small", ["icon", "status-indicator"]),
    "wiggle-hint": ("icon-feedback", "small", ["icon-button", "button"]),
    "subscribe-button": ("social-feedback", "small", ["button", "notification-item"]),
    "follow-pill": ("social-feedback", "small", ["button", "toggle-button"]),
    "like-counter": ("social-feedback", "small", ["icon-button", "badge"]),
    "save-bookmark": ("social-feedback", "small", ["icon-button", "button"]),
    "share-fling": ("social-feedback", "large", ["icon-button", "action-sheet"]),
    "swipe-up-hint": ("social-feedback", "small", ["bottom-sheet", "icon"]),
    "chat-bubble-pop": ("social-feedback", "medium", ["chat-message"]),
    "typing-bubble": ("social-feedback", "small", ["chat-message", "status-indicator"]),
    "comment-rise": ("social-feedback", "medium", ["chat-message", "feed"]),
    "reply-thread": ("social-feedback", "medium", ["chat-message", "feed"]),
    "reaction-float": ("social-feedback", "medium", ["feed", "icon"]),
    "toast-slide": ("social-feedback", "medium", ["toast"]),
    "notification-stack": ("social-feedback", "medium", ["notification-item", "feed"]),
    "live-badge": ("social-feedback", "small", ["badge", "status-indicator"]),
    "new-tag-flash": ("social-feedback", "small", ["tag", "badge"]),
    "story-progress": ("social-feedback", "medium", ["progress-bar", "carousel"]),
    "island-alert": ("social-feedback", "medium", ["banner", "toast"]),
    "location-pin": ("social-feedback", "medium", ["image", "icon"]),
    "caption-pop": ("social-feedback", "small", ["text", "media-player"]),
    "sticker-slap": ("social-feedback", "medium", ["image", "card"]),
    "arrow-point": ("graphic-explanation", "medium", ["image", "chart"]),
    "highlight-box": ("graphic-explanation", "medium", ["image", "chart"]),
    "before-after-label": ("graphic-explanation", "medium", ["image", "carousel"]),
    "marching-ants": ("graphic-explanation", "small", ["canvas-input", "image"]),
    "trim-path": ("graphic-explanation", "medium", ["chart", "icon"]),
    "accordion-fold": ("scene-transition", "screen", ["page-shell", "image"]),
    "exploded-view": ("spatial-exploration", "large", ["image", "canvas-input"]),
    "cutaway": ("spatial-exploration", "large", ["image", "canvas-input"]),
    "turntable": ("spatial-exploration", "large", ["image", "canvas-input"]),
    "layer-peel": ("graphic-explanation", "large", ["image", "card"]),
    "iso-build": ("graphic-explanation", "large", ["image", "chart"]),
    "stock-left": ("numeric-feedback", "small", ["badge", "status-indicator", "meter"]),
    "level-up": ("numeric-feedback", "medium", ["progress-bar", "badge"]),
    "countdown": ("numeric-feedback", "small", ["badge", "meter", "text"]),
    "needle-gauge": ("data-change", "medium", ["meter", "chart"]),
    "roadmap-path": ("diagram-explanation", "large", ["timeline", "stepper", "chart"]),
    "arrow-chain": ("diagram-explanation", "medium", ["stepper", "chart"]),
    "branch-flow": ("diagram-explanation", "large", ["tree-view", "chart"]),
    "cycle-loop": ("diagram-explanation", "medium", ["chart"]),
    "timeline-axis": ("diagram-explanation", "medium", ["timeline"]),
    "chevron-steps": ("diagram-explanation", "medium", ["stepper"]),
    "tree-split": ("diagram-explanation", "large", ["tree-view", "chart"]),
    "matrix-sort": ("diagram-explanation", "medium", ["table", "data-grid"]),
    "venn-overlap": ("diagram-explanation", "medium", ["chart"]),
    "radial-map": ("diagram-explanation", "large", ["chart", "tree-view"]),
    "position-map": ("diagram-explanation", "medium", ["chart"]),
    "before-after-card": ("diagram-explanation", "medium", ["card", "carousel"]),
    "ab-checklist": ("diagram-explanation", "medium", ["list", "checkmark"]),
    "pros-cons": ("diagram-explanation", "medium", ["list", "table"]),
    "plan-pick": ("diagram-explanation", "medium", ["card", "radio"]),
    "problem-solution": ("diagram-explanation", "medium", ["section", "card"]),
    "callout-bubble": ("diagram-explanation", "small", ["tooltip", "popover"]),
    "row-box": ("diagram-explanation", "medium", ["list-item", "card"]),
    "point-three": ("diagram-explanation", "medium", ["list", "stepper"]),
    "caution-card": ("diagram-explanation", "small", ["alert", "card"]),
    "leader-label": ("diagram-explanation", "small", ["tooltip", "chart"]),
    "icon-tiles": ("diagram-explanation", "medium", ["layout-grid", "icon"]),
}

motion_nodes = []
edges = []
for family in taxonomy["categories"]:
    family_id = family["id"]
    default_use, default_scale, default_components = defaults[family_id]
    for item in family["entries"]:
        if item["id"] not in unique:
            continue
        motion_id = item["id"]
        use, scale, component_ids = overrides.get(motion_id, (default_use, default_scale, default_components))
        assert use in uses and scale in scales
        assert len(component_ids) == len(set(component_ids))
        assert all(cid in component_by_id for cid in component_ids), (motion_id, component_ids)
        motion_nodes.append({
            "id": motion_id,
            "name": item["name"],
            "english": item.get("english", ""),
            "sourceFamilyId": family_id,
            "sourceFamily": family["name"],
            "useType": use,
            "movementScale": scale,
            "motionAxes": item.get("motionAxes", []),
            "componentIds": component_ids,
            "implementation": item.get("implementation", "knowledge-only"),
            "demo": "motion-verified-lab.html#" + motion_id,
            "mappingBasis": "specific-state-rule" if motion_id in overrides else "source-family-default",
        })
        edges.append({"from": "motion:" + motion_id, "to": "use:" + use, "type": "has_use"})
        edges.append({"from": "motion:" + motion_id, "to": "scale:" + scale, "type": "has_scale"})
        edges.append({"from": "motion:" + motion_id, "to": "source-family:" + family_id, "type": "classified_in"})
        for axis in item.get("motionAxes", []):
            edges.append({"from": "motion:" + motion_id, "to": "axis:" + axis, "type": "changes_axis"})
        for cid in component_ids:
            edges.append({"from": "motion:" + motion_id, "to": "component:" + cid, "type": "candidate_for", "basis": "specific-state-rule" if motion_id in overrides else "source-family-default"})

assert len(motion_nodes) == progress["finalizedStandaloneCoreCount"] == 343
assert {n["id"] for n in motion_nodes} == unique
assert all(n["componentIds"] for n in motion_nodes)
assert len({(e["from"], e["to"], e["type"]) for e in edges}) == len(edges)

component_nodes = [{"id": c["id"], "name": c["ko"], "family": c["family"], "interactive": c["interactive"]} for c in components["entries"]]
axes = sorted({a for item in motion_nodes for a in item["motionAxes"]})
graph = {
    "schemaVersion": "1.0",
    "motionCount": len(motion_nodes),
    "componentCount": len(component_nodes),
    "relationStatus": "candidate; source-family defaults and specific state rules, not product-level approval",
    "movementScaleMeaning": "Changes in visible spatial footprint relative to the animated target. Small/medium/large/screen are comparison tags, not measured pixel distances or animation intensity. Record actual distances and duration when applying a motion.",
    "useTypes": [{"id": key, "name": value} for key, value in uses.items()],
    "movementScales": [{"id": key, "name": value} for key, value in scales.items()],
    "axes": axes,
    "sourceFamilies": [{"id": c["id"], "name": c["name"]} for c in taxonomy["categories"]],
    "motions": motion_nodes,
    "components": component_nodes,
    "edges": edges,
    "counts": {
        "uses": dict(Counter(x["useType"] for x in motion_nodes)),
        "scales": dict(Counter(x["movementScale"] for x in motion_nodes)),
        "mappingBasis": dict(Counter(x["mappingBasis"] for x in motion_nodes)),
        "componentLinks": sum(len(x["componentIds"]) for x in motion_nodes),
        "linkedComponents": len({cid for x in motion_nodes for cid in x["componentIds"]}),
    },
}
(CAT / "motion-component-graph.json").write_text(json.dumps(graph, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f'{len(motion_nodes)} motions, {graph["counts"]["componentLinks"]} candidate links, {graph["counts"]["linkedComponents"]} linked components')
