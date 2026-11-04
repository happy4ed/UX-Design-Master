#!/usr/bin/env python3
"""Check staged traceability of app functions, information, flows, and rendered screens."""

import argparse
import json
from pathlib import Path

STAGES = ("A1", "A2", "A3", "B", "C", "D", "final")
TIERS = {"required", "supporting", "conditional"}
DECISIONS = {"confirmed", "proposed", "unresolved", "rejected"}
SOURCES = {"user", "observed", "proposal"}


def audit(data):
    findings = []

    def add(code, at, detail):
        findings.append({"code": code, "at": at, "detail": detail})

    stage = data.get("stage")
    if stage not in STAGES:
        add("STAGE", "stage", "A1/A2/A3/B/C/D/final 중 하나가 필요합니다")
        stage = "A1"
    rank = STAGES.index(stage)
    groups = data.get("groups") if isinstance(data.get("groups"), list) else []
    features = data.get("features") if isinstance(data.get("features"), list) else []
    information = data.get("information") if isinstance(data.get("information"), list) else []
    flows = data.get("flows") if isinstance(data.get("flows"), list) else []
    screens = data.get("screens") if isinstance(data.get("screens"), list) else []
    if not groups:
        add("NO_GROUPS", "groups", "기능 집단이 없습니다")
    if not features:
        add("NO_FEATURES", "features", "개별 기능이 없습니다")
    if not information:
        add("NO_INFORMATION", "information", "필수·부가·조건부 정보 목록이 없습니다")

    def index(rows, label):
        result = {}
        for position, row in enumerate(rows):
            at = f"{label}[{position}]"
            if not isinstance(row, dict) or not row.get("id"):
                add("MISSING_ID", at, "객체와 ID가 필요합니다")
                continue
            if row["id"] in result:
                add("DUPLICATE_ID", at, f"{row['id']} 중복")
            else:
                result[row["id"]] = row
        return result

    group_index, feature_index, info_index = index(groups, "groups"), index(features, "features"), index(information, "information")
    flow_index, screen_index = index(flows, "flows"), index(screens, "screens")

    def check_hierarchy(items, label):
        for item_id, item in items.items():
            parent = item.get("parentId")
            if parent is None or parent == "":
                continue
            if parent not in items:
                add("UNKNOWN_PARENT", f"{label}.{item_id}.parentId", f"{parent} 없음")
                continue
            seen = {item_id}
            while parent:
                if parent in seen:
                    add("HIERARCHY_CYCLE", f"{label}.{item_id}.parentId", "상하위 순환")
                    break
                seen.add(parent)
                parent = items.get(parent, {}).get("parentId")

    check_hierarchy(group_index, "groups")
    check_hierarchy(feature_index, "features")
    for gid, group in group_index.items():
        if not group.get("name"):
            add("MISSING_NAME", f"groups.{gid}.name", "집단명 필요")

    for fid, feature in feature_index.items():
        at = f"features.{fid}"
        for key in ("name", "groupId", "acceptance"):
            if not feature.get(key):
                add("FEATURE_FIELD", f"{at}.{key}", "기능 명세 필수 필드")
        if feature.get("groupId") not in group_index:
            add("UNKNOWN_GROUP", f"{at}.groupId", "기능 집단 연결 없음")
        for key, allowed in (("tier", TIERS), ("source", SOURCES), ("decision", DECISIONS), ("target", {"ui", "system"})):
            if feature.get(key) not in allowed:
                add("FEATURE_CLASSIFICATION", f"{at}.{key}", f"허용값: {', '.join(sorted(allowed))}")
        if not isinstance(feature.get("inputs"), list) or not isinstance(feature.get("outputs"), list):
            add("FEATURE_IO", at, "입력·결과는 빈 배열을 포함해 각각 명시")
        if not isinstance(feature.get("interaction"), bool):
            add("FEATURE_INTERACTION_UNCLASSIFIED", at, "조작 기능인지 true/false로 명시")
        if rank >= 1 and feature.get("tier") == "required" and feature.get("decision") != "confirmed":
            add("REQUIRED_NOT_CONFIRMED", at, "A2 이후 필수 기능은 사용자 확인 상태 필요")
        if feature.get("tier") == "conditional":
            if not feature.get("condition") or not feature.get("elseBehavior"):
                add("CONDITION_UNDEFINED", at, "발동 조건과 조건이 아닐 때의 동작 필요")
            if rank >= 2 and not feature.get("conditionStateIds"):
                add("CONDITION_STATE_MISSING", at, "조건이 드러나는 상태 ID 필요")

    for iid, info in info_index.items():
        at = f"information.{iid}"
        for key in ("name", "valueSource", "displayRule", "overflowRule"):
            if not info.get(key):
                add("INFORMATION_FIELD", f"{at}.{key}", "정보의 출처·표시·넘침 계약 필요")
        for key, allowed in (("tier", TIERS), ("source", SOURCES), ("decision", DECISIONS)):
            if info.get(key) not in allowed:
                add("INFORMATION_CLASSIFICATION", f"{at}.{key}", f"허용값: {', '.join(sorted(allowed))}")
        linked = info.get("featureIds")
        if not isinstance(linked, list) or not linked:
            add("INFORMATION_UNLINKED", at, "정보를 사용하는 기능 ID 필요")
        else:
            for fid in linked:
                if fid not in feature_index:
                    add("UNKNOWN_FEATURE", f"{at}.featureIds", f"{fid} 없음")
        if info.get("tier") == "conditional" and (not info.get("condition") or not info.get("elseBehavior")):
            add("CONDITION_UNDEFINED", at, "조건과 비해당 상태의 표시 규칙 필요")
        if info.get("tier") == "conditional" and rank >= 2 and not info.get("conditionStateIds"):
            add("CONDITION_STATE_MISSING", at, "조건부 정보가 나타나는 상태 ID 필요")
        if rank >= 1 and info.get("tier") == "required" and info.get("decision") != "confirmed":
            add("REQUIRED_NOT_CONFIRMED", at, "A2 이후 필수 정보는 사용자 확인 상태 필요")

    if rank >= 1 and not flows:
        add("NO_FLOWS", "flows", "A2부터 과업 흐름 필요")
    flow_feature_ids = set()
    for flow_id, flow in flow_index.items():
        if not flow.get("name") or not isinstance(flow.get("featureIds"), list):
            add("FLOW_FIELD", f"flows.{flow_id}", "흐름명과 기능 ID 배열 필요")
        for fid in flow.get("featureIds", []):
            flow_feature_ids.add(fid)
            if fid not in feature_index:
                add("UNKNOWN_FEATURE", f"flows.{flow_id}.featureIds", f"{fid} 없음")
    if rank >= 1:
        for fid, feature in feature_index.items():
            if feature.get("decision") == "confirmed" and feature.get("interaction") and fid not in flow_feature_ids:
                add("FEATURE_MISSING_FLOW", f"features.{fid}", "확정한 조작 기능이 A2 흐름에 없음")

    if rank >= 2 and not screens:
        add("NO_SCREENS", "screens", "A3부터 화면·상태 사용 맵 필요")
    mapped_features, mapped_info, rendered_features, rendered_info, mapped_states = set(), set(), set(), set(), set()
    for sid, screen in screen_index.items():
        at = f"screens.{sid}"
        if not screen.get("title") or not isinstance(screen.get("stateIds"), list) or not screen.get("stateIds"):
            add("SCREEN_FIELD", at, "화면 역할 제목과 상태 ID 필요")
        elif len(str(screen["title"]).split()) > 2:
            add("SCREEN_TITLE_LENGTH", f"{at}.title", "화면 제목은 기능·역할을 한두 단어로 쓰고 실제 화면에서 확인")
        mapped_states.update(screen.get("stateIds") if isinstance(screen.get("stateIds"), list) else [])
        screen_features, screen_info = set(), set()
        for key, known, collected, local in (("featureIds", feature_index, mapped_features, screen_features), ("informationIds", info_index, mapped_info, screen_info)):
            values = screen.get(key)
            if not isinstance(values, list):
                add("SCREEN_FIELD", f"{at}.{key}", "ID 배열 필요")
                continue
            for value in values:
                collected.add(value)
                local.add(value)
                if value not in known:
                    add("UNKNOWN_REFERENCE", f"{at}.{key}", f"{value} 없음")
        if rank >= 3:
            if not screen.get("renderEvidence"):
                add("RENDER_EVIDENCE_MISSING", at, "B부터 실제 렌더 캡처 근거 필요")
            for key, known, collected, mapped in (("renderedFeatureIds", feature_index, rendered_features, screen_features), ("renderedInformationIds", info_index, rendered_info, screen_info)):
                values = screen.get(key)
                if not isinstance(values, list):
                    add("RENDERED_IDS_MISSING", f"{at}.{key}", "실제 캡처에서 본 ID 배열 필요")
                    continue
                for value in values:
                    collected.add(value)
                    if value not in known:
                        add("UNKNOWN_REFERENCE", f"{at}.{key}", f"{value} 없음")
                    elif value not in mapped:
                        add("RENDERED_NOT_MAPPED", f"{at}.{key}", f"{value}는 화면 책임 명세에 없음")
            for fid in screen_features:
                if feature_index.get(fid, {}).get("decision") == "confirmed" and fid not in set(screen.get("renderedFeatureIds") or []):
                    add("SCREEN_FEATURE_NOT_RENDERED", at, f"{fid}는 이 화면 명세에 있으나 캡처에서 확인되지 않음")
            for iid in screen_info:
                if info_index.get(iid, {}).get("decision") == "confirmed" and iid not in set(screen.get("renderedInformationIds") or []):
                    add("SCREEN_INFORMATION_NOT_RENDERED", at, f"{iid}는 이 화면 명세에 있으나 캡처에서 확인되지 않음")
        for fid in screen_features:
            feature = feature_index.get(fid, {})
            if feature.get("decision") == "confirmed" and feature.get("tier") == "conditional" and not set(feature.get("conditionStateIds") or []) & set(screen.get("stateIds") or []):
                add("SCREEN_CONDITION_STATE_MISSING", at, f"{fid} 조건 상태가 이 화면에 없음")
        for iid in screen_info:
            info = info_index.get(iid, {})
            if info.get("decision") == "confirmed" and info.get("tier") == "conditional" and not set(info.get("conditionStateIds") or []) & set(screen.get("stateIds") or []):
                add("SCREEN_CONDITION_STATE_MISSING", at, f"{iid} 조건 상태가 이 화면에 없음")
    if rank >= 2:
        for fid, feature in feature_index.items():
            if feature.get("decision") != "confirmed":
                continue
            if feature.get("target") == "ui" and fid not in mapped_features:
                add("FEATURE_MISSING_SCREEN", f"features.{fid}", "확정한 UI 기능의 화면 책임 없음")
            if feature.get("tier") == "conditional" and not set(feature.get("conditionStateIds") or []) & mapped_states:
                add("CONDITION_NOT_RENDERABLE", f"features.{fid}", "발동 상태가 화면 사용 맵에 없음")
            if rank >= 3 and feature.get("target") == "ui" and fid not in rendered_features:
                add("FEATURE_NOT_RENDERED", f"features.{fid}", "화면 맵에는 있으나 실제 렌더 근거에 없음")
        for iid, info in info_index.items():
            if info.get("decision") != "confirmed":
                continue
            if iid not in mapped_info:
                add("INFORMATION_MISSING_SCREEN", f"information.{iid}", "확정한 정보의 화면 책임 없음")
            if info.get("tier") == "conditional" and not set(info.get("conditionStateIds") or []) & mapped_states:
                add("CONDITION_NOT_RENDERABLE", f"information.{iid}", "조건부 정보 상태가 화면 사용 맵에 없음")
            if rank >= 3 and iid not in rendered_info:
                add("INFORMATION_NOT_RENDERED", f"information.{iid}", "화면 맵에는 있으나 실제 렌더 근거에 없음")

    if rank >= 5:
        verified = {}
        for index, row in enumerate(data.get("verification", [])):
            fid = row.get("featureId")
            if fid in verified:
                add("DUPLICATE_VERIFICATION", f"verification[{index}]", f"{fid} 중복")
            verified[fid] = row
            if fid not in feature_index or row.get("result") not in {"PASS", "FAIL", "NOT_RUN", "NOT_APPLICABLE"} or not row.get("evidence"):
                add("VERIFICATION_FIELD", f"verification[{index}]", "기능 ID·결과·실제 근거 필요")
        for fid, feature in feature_index.items():
            if feature.get("decision") != "confirmed":
                continue
            if fid not in verified:
                add("FEATURE_NOT_VERIFIED", f"features.{fid}", "D부터 실제 기능 검증 또는 NOT_RUN 기록 필요")
            elif feature.get("tier") == "conditional" and not all(verified[fid].get(key) for key in ("conditionTrueEvidence", "conditionFalseEvidence")):
                add("CONDITION_NOT_VERIFIED", f"features.{fid}", "조건이 참·거짓인 두 경우의 근거 필요")

    return {"status": "WARN" if findings else "PASS", "findings": findings,
            "counts": {"groups": len(group_index), "features": len(feature_index), "information": len(info_index), "flows": len(flow_index), "screens": len(screen_index)},
            "note": "누락·참조의 기록 검사다. 기능의 필요성·실제 구현·시각 품질 PASS는 별도 확인한다."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    report = audit(json.loads(args.input.read_text(encoding="utf-8")))
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
