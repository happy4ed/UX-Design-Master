"""Check that design knowledge decisions and final render evidence are recorded."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / "knowledge/knowledge-coverage.json").read_text(encoding="utf-8"))
DECISIONS = {"applied", "considered", "excluded", "not-applicable", "pending"}
VERIFICATIONS = {"PASS", "FAIL", "NOT_RUN", "NOT_APPLICABLE"}


def audit(data, stage):
    errors = []
    mode = data.get("mode")
    if mode not in {"new-design", "analysis", "targeted-fix"}:
        errors.append("mode는 new-design, analysis, targeted-fix 중 하나여야 합니다.")
    surfaces = data.get("surfaces")
    if not isinstance(surfaces, list) or not surfaces:
        return {"status": "FAIL", "errors": errors + ["surfaces가 비어 있습니다."]}
    valid_areas = set(CATALOG["areaMeaning"])
    for surface in surfaces:
        sid = surface.get("id") or "<id 없음>"
        rows = surface.get("knowledge", [])
        if not isinstance(rows, list):
            errors.append(f"{sid}: knowledge는 배열이어야 합니다.")
            continue
        areas = [row.get("area") for row in rows]
        if len(areas) != len(set(areas)):
            errors.append(f"{sid}: 같은 지식 영역이 중복되었습니다.")
        required = set(CATALOG["baseAreas"]) if mode in {"new-design", "analysis"} else set(data.get("focusAreas", []))
        for tag in surface.get("tags", []):
            if tag in CATALOG["conditionalAreas"]:
                required.add(CATALOG["conditionalAreas"][tag])
        if mode == "targeted-fix" and not required:
            errors.append(f"{sid}: targeted-fix에는 focusAreas가 필요합니다.")
        for area in sorted(required - set(areas)):
            errors.append(f"{sid}: {area} 검토 기록이 없습니다.")
        for row in rows:
            area = row.get("area")
            decision = row.get("decision")
            if area not in valid_areas:
                errors.append(f"{sid}: 알 수 없는 영역 {area}")
            if decision not in DECISIONS:
                errors.append(f"{sid}/{area}: decision 값이 잘못되었습니다.")
                continue
            if not str(row.get("reason", "")).strip():
                errors.append(f"{sid}/{area}: 선택 또는 제외 이유가 없습니다.")
            if stage == "final" and decision == "pending":
                errors.append(f"{sid}/{area}: 최종 산출물에 pending이 남았습니다.")
            if stage == "final" and decision == "applied":
                if not str(row.get("artifact", "")).strip():
                    errors.append(f"{sid}/{area}: 적용 위치 또는 산출물 경로가 없습니다.")
                if row.get("verification") not in VERIFICATIONS:
                    errors.append(f"{sid}/{area}: PASS/FAIL/NOT_RUN/NOT_APPLICABLE 검증 상태가 없습니다.")
                if row.get("verification") == "PASS" and not str(row.get("evidence", "")).strip():
                    errors.append(f"{sid}/{area}: PASS의 실제 검증 근거가 없습니다.")
        if mode == "new-design":
            conditions = set(surface.get("conditions", []))
            for condition in ("initial", "saturated"):
                if condition not in conditions:
                    errors.append(f"{sid}: {condition} 경계 조건이 없습니다.")
    return {"status": "FAIL" if errors else "PASS", "surfaces": len(surfaces), "errors": errors}


def main():
    parser = argparse.ArgumentParser(description="관련 디자인 지식의 적용·제외·검증 기록을 점검합니다.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--stage", choices=("plan", "final"), default="final")
    args = parser.parse_args()
    data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    result = audit(data, args.stage)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
