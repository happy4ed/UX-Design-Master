#!/usr/bin/env python3
"""Replace a provisional style value with new evidence, preserving its history."""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path

from build_style_estimates import OUTPUT, main as sync_guides


def revise(registry: dict, style: str, key: str, *, value: str | None = None,
           grade: str | None = None, basis: str | None = None,
           qa_evidence: str | None = None, today: str) -> dict:
    row = next((x for x in registry["records"] if x["style"] == style and x["key"] == key), None)
    if row is None:
        raise ValueError(f"unknown style/key: {style}/{key}")
    old = {k: v for k, v in row.items() if k != "history"}
    if qa_evidence:
        if row["status"] != "재검증 필요":
            raise ValueError("record new evidence before verifying")
        if not Path(qa_evidence).is_file():
            raise ValueError("QA evidence file not found")
        row["history"].append(old)
        row["status"] = "근거로 대체됨"
        row["qa"] = f"실제 화면 재검증 PASS: {qa_evidence}"
        row["checked_on"] = today
    else:
        if not (value and grade and basis):
            raise ValueError("value, grade and source basis are required")
        if grade not in ("공식", "실측", "관찰"):
            raise ValueError("new evidence grade must be official, measured or observed")
        row["history"].append(old)
        row.update(value=value, grade=grade, basis=basis, method="새 근거와 이전 임시값의 차이를 같은 부품·상태에서 대조",
                   confidence="높음" if grade in ("공식", "실측") else "중간",
                   qa="NOT_RUN: 실제 화면·상태 재검증 필요", checked_on=today, status="재검증 필요")
    return row


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--style", required=True)
    p.add_argument("--key", required=True)
    p.add_argument("--value")
    p.add_argument("--grade", choices=("공식", "실측", "관찰"))
    p.add_argument("--basis", help="Version-matched source ID, URL or measured image coordinates")
    p.add_argument("--qa-evidence", help="Existing same-task screenshot/report path; confirms a pending revision")
    p.add_argument("--date", default=date.today().isoformat())
    args = p.parse_args()
    registry = json.loads(OUTPUT.read_text(encoding="utf-8"))
    row = revise(registry, args.style, args.key, value=args.value, grade=args.grade,
                 basis=args.basis, qa_evidence=args.qa_evidence, today=args.date)
    OUTPUT.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sync_guides()
    print(f"{row['style']}/{row['key']}: {row['status']} · {row['value']} · {row['qa']}")


if __name__ == "__main__":
    main()
