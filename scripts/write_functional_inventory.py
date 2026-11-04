#!/usr/bin/env python3
"""Write a traceable Markdown functional specification from the A1→D inventory."""

import argparse
import json
from pathlib import Path

from check_functional_inventory import audit


def cell(value):
    if value is None or value == "" or value == []:
        return "미정"
    if isinstance(value, list):
        value = ", ".join(str(item) for item in value)
    return str(value).replace("|", "\\|").replace("\n", " ")


def table(rows, columns):
    if not rows:
        return "기록 없음\n"
    output = ["| " + " | ".join(title for _, title in columns) + " |", "| " + " | ".join("---" for _ in columns) + " |"]
    for row in rows:
        output.append("| " + " | ".join(cell(row.get(key)) for key, _ in columns) + " |")
    return "\n".join(output) + "\n"


def write_spec(data):
    report = audit(data)
    lines = [f"# {cell(data.get('project') or '미정 프로젝트')} · 기능·정보 사양서", "",
             f"> 단계: {cell(data.get('stage'))} · 기록 검사: {report['status']}. 검사기 통과는 실제 기능 구현·화면 품질의 합격이 아니다.", ""]
    sections = [
        ("1. 기능 집단과 계위", data.get("groups", []), [("id", "집단 ID"), ("parentId", "상위 ID"), ("name", "집단명")]),
        ("2. 기능 계약", data.get("features", []), [("id", "기능 ID"), ("groupId", "집단"), ("parentId", "상위 기능"), ("name", "기능"), ("tier", "필수/부가/조건부"), ("target", "UI/시스템"), ("interaction", "조작 기능"), ("condition", "발동 조건"), ("elseBehavior", "비해당 동작"), ("conditionStateIds", "조건 상태"), ("inputs", "입력"), ("outputs", "결과"), ("acceptance", "수용 조건"), ("source", "출처"), ("decision", "확인 상태")]),
        ("3. 화면 정보 계약", data.get("information", []), [("id", "정보 ID"), ("name", "정보"), ("tier", "필수/부가/조건부"), ("valueSource", "값 출처"), ("featureIds", "사용 기능"), ("condition", "발동 조건"), ("elseBehavior", "비해당 표시"), ("conditionStateIds", "조건 상태"), ("displayRule", "표시"), ("overflowRule", "긴 값 처리"), ("source", "출처"), ("decision", "확인 상태")]),
        ("4. 과업 흐름 연결", data.get("flows", []), [("id", "흐름 ID"), ("name", "흐름"), ("featureIds", "기능 ID")]),
        ("5. 화면·상태 연결", data.get("screens", []), [("id", "화면 ID"), ("title", "역할 제목"), ("stateIds", "상태"), ("featureIds", "기능"), ("informationIds", "정보"), ("renderEvidence", "실제 캡처"), ("renderedFeatureIds", "실제 보이는 기능"), ("renderedInformationIds", "실제 보이는 정보")]),
        ("6. 기능 검증", data.get("verification", []), [("featureId", "기능 ID"), ("result", "결과"), ("evidence", "실행 근거"), ("conditionTrueEvidence", "조건 참"), ("conditionFalseEvidence", "조건 거짓")]),
    ]
    for title, rows, columns in sections:
        lines.extend([f"## {title}", "", table(rows, columns), ""])
    lines.extend(["## 7. 기록 누락과 미결정", ""])
    if report["findings"]:
        lines.extend(f"- `{row['code']}` {row['at']}: {row['detail']}" for row in report["findings"])
    else:
        lines.append("- 기록 연결 누락 없음. 실제 화면·동작은 별도 검증 필요.")
    lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    result = audit(data)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(write_spec(data), encoding="utf-8")
    print(json.dumps({"out": str(args.out), "status": result["status"], "findings": len(result["findings"])}, ensure_ascii=False))
    if args.strict and result["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
