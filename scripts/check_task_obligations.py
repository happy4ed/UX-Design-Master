#!/usr/bin/env python3
"""Check A1 coverage of review tasks implied by fallible processing."""

import argparse
import json
from pathlib import Path

CATALOG = Path(__file__).resolve().parents[1] / "knowledge/task-obligations.json"


def audit(spec, catalog):
    types = {item["id"]: item for item in catalog["processingTypes"]}
    declared = set(spec.get("processingTypes", []))
    features = {item["id"]: item for item in spec.get("features", []) if isinstance(item, dict) and item.get("id")}
    findings = []
    for unknown in sorted(declared - types.keys()):
        findings.append({"code": "UNKNOWN_PROCESSING_TYPE", "type": unknown, "severity": "WARN"})
    for type_id in sorted(declared & types.keys()):
        for required in types[type_id]["obligations"]:
            feature = features.get(required["id"])
            if feature is None:
                findings.append({"code": "MISSING_OBLIGATION", "type": type_id, "featureId": required["id"], "severity": "WARN", "proposal": required["proposal"], "source": "proposed-by-processing-type"})
            elif feature.get("source") not in {"user", "proposal"}:
                findings.append({"code": "MISSING_SOURCE_LABEL", "type": type_id, "featureId": required["id"], "severity": "WARN"})
    return {"status": "WARN" if findings else "PASS", "processingTypes": sorted(declared), "findings": findings, "note": "기록 누락만 검사한다. PASS는 화면 품질 또는 실제 기능 구현의 증거가 아니다."}


def main():
    parser = argparse.ArgumentParser(description="A1 처리 유형별 필수 검토 과업 점검")
    parser.add_argument("--input", required=True, type=Path, help="A1 JSON: processingTypes와 features 배열")
    args = parser.parse_args()
    result = audit(json.loads(args.input.read_text()), json.loads(CATALOG.read_text()))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
