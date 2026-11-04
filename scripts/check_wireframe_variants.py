#!/usr/bin/env python3
"""Check the evidence and comparability of B-stage composition alternatives."""

import argparse
import json
from pathlib import Path


def audit(data):
    warnings = []

    def warn(code, at, detail):
        warnings.append({"code": code, "at": at, "detail": detail})

    baseline = data.get("baseline") or {}
    for key in ("taskId", "viewport", "initialFixtureId", "saturatedFixtureId", "featureIds", "informationIds"):
        value = baseline.get(key)
        if not value or (key.endswith("Ids") and (not isinstance(value, list) or not value)):
            warn("BASELINE_MISSING", f"baseline.{key}", "세 안의 고정 비교 조건 필요")
    variants = data.get("variants") or []
    if not isinstance(variants, list) or len(variants) < 3:
        warn("VARIANT_COUNT", "variants", "실제 구조안 최소 3개 필요")
        variants = variants if isinstance(variants, list) else []
    ids, signatures, principles = set(), set(), set()
    for index, variant in enumerate(variants):
        if not isinstance(variant, dict):
            warn("VARIANT_FORMAT", f"variants[{index}]", "객체 필요")
            continue
        at = f"variants[{index}]"
        vid = variant.get("id")
        if not vid or vid in ids:
            warn("VARIANT_ID", at, "고유한 안 ID 필요")
        ids.add(vid)
        principle = variant.get("structurePrinciple")
        if not principle:
            warn("PRINCIPLE_MISSING", at, "주된 구조 원리 필요")
        else:
            principles.add(str(principle).strip().casefold())
        composition = variant.get("composition")
        if not isinstance(composition, dict) or not composition:
            warn("COMPOSITION_MISSING", at, "역할별 선택·공개·이동 방식 필요")
        else:
            signatures.add(tuple(sorted((str(key), str(value).strip().casefold()) for key, value in composition.items())))
        for key in ("taskFlow", "benefit", "cost", "renderEvidence", "openedStateEvidence", "narrowEvidence"):
            if not variant.get(key):
                warn("VARIANT_EVIDENCE", f"{at}.{key}", "과업·장단점·실제 화면 근거 필요")
        refs = variant.get("references")
        if not isinstance(refs, list) or not refs:
            warn("REFERENCE_MISSING", at, "현존 앱의 실제 화면 구성 근거 필요")
        else:
            for ref_index, ref in enumerate(refs):
                if not isinstance(ref, dict) or any(not ref.get(key) for key in ("app", "platform", "screen", "state", "observedPattern", "sourceRef", "checkedAt", "evidenceLevel")):
                    warn("REFERENCE_INCOMPLETE", f"{at}.references[{ref_index}]", "앱·상태·관찰·출처·확인일·증거 수준 필요")
                elif ref["evidenceLevel"] not in {"actual-interaction", "actual-screenshot", "official-screenshot"}:
                    warn("REFERENCE_LEVEL", f"{at}.references[{ref_index}]", "관찰 증거 수준 불명확")
        for key in ("featureIds", "informationIds"):
            values = variant.get(key)
            if not isinstance(values, list) or set(values) != set(baseline.get(key) or []):
                warn("UNFAIR_SCOPE", f"{at}.{key}", "확정 기능·정보 ID는 세 안에서 같아야 함")
        boundary = variant.get("boundaryEvidence") or {}
        for key in ("initial", "saturated"):
            if not boundary.get(key):
                warn("BOUNDARY_MISSING", f"{at}.boundaryEvidence.{key}", "초기·포화 렌더 근거 필요")
    if len(variants) >= 3 and len(signatures) < 3:
        warn("COMPOSITION_DUPLICATE", "variants", "역할별 구성 방식이 세 안에서 실질적으로 달라야 함")
    if len(variants) >= 3 and len(principles) < 3:
        warn("PRINCIPLE_DUPLICATE", "variants", "주된 구조 원리가 세 안에서 달라야 함")
    return {"status": "WARN" if warnings else "PASS", "warnings": warnings,
            "note": "기록과 비교 가능성만 검사한다. 실제 앱 관찰·와이어프레임 적합성은 화면을 보고 판단한다."}


def main():
    parser = argparse.ArgumentParser(description="B 구조안 구성 다양성 기록 검사")
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    result = audit(json.loads(args.input.read_text(encoding="utf-8")))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
