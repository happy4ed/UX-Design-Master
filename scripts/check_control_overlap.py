#!/usr/bin/env python3
"""Find duplicate or competing controls from real fixture outcomes."""

import argparse
import itertools
import json
from pathlib import Path


def check(data):
    controls = data.get("controls", [])
    findings = []
    for control in controls:
        if not control.get("id") or not control.get("targetData") or not control.get("changes") or not control.get("outcomes"):
            findings.append({"code": "INCOMPLETE_CONTROL", "controls": [control.get("id")], "detail": "대상 자료·바뀌는 것·fixture별 결과 집합/순서가 필요합니다."})
        if control.get("source") not in {"user", "proposal"}:
            findings.append({"code": "MISSING_SOURCE", "controls": [control.get("id")], "detail": "사용자 요청 또는 제안 표시가 필요합니다."})
    for a, b in itertools.combinations(controls, 2):
        if not a.get("id") or not b.get("id") or a.get("targetData") != b.get("targetData"):
            continue
        shared = set(a.get("outcomes", {})) & set(b.get("outcomes", {}))
        if shared and all(a["outcomes"][key] == b["outcomes"][key] for key in shared):
            findings.append({"code": "SAME_RESULTS", "controls": [a["id"], b["id"]], "fixtures": sorted(shared), "detail": "같은 시험 자료에서 결과 집합과 순서가 같습니다. 하나를 합치거나 유지 이유를 적으세요."})
        overlap = set(a.get("purposeTags", [])) & set(b.get("purposeTags", []))
        if overlap and a.get("role") != b.get("role"):
            findings.append({"code": "OVERLAPPING_PURPOSE", "controls": [a["id"], b["id"]], "purposeTags": sorted(overlap), "detail": "역할은 다르지만 같은 과업을 강조합니다. 둘 다 필요한 이유를 화면에서 검토하세요."})
    return {"status": "WARN" if findings else "PASS", "findings": findings, "note": "겹침 후보를 찾는다. 제거·유지 판단은 실제 사용자 과업과 화면을 보고 결정한다."}


def main():
    parser = argparse.ArgumentParser(description="화면 조작의 결과·목적 중복 후보 검사")
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(check(json.loads(args.input.read_text())), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
