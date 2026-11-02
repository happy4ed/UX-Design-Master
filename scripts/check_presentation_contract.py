#!/usr/bin/env python3
"""Check the completeness of a presentation design record, never visual quality."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


FACT_ROLES = {"evidence", "data", "comparison", "process", "case", "decision", "summary"}
QUANTITATIVE_VISUALS = {"chart", "quantitative-diagram", "data-infographic"}


def inspect(record: dict, base: Path | None = None, check_files: bool = False) -> list[str]:
    issues: list[str] = []
    if record.get("kind") != "presentation":
        issues.append("kind must be 'presentation'")
    for field in ("audience", "coreQuestion", "viewingContext", "deliveryFormat"):
        if not record.get(field):
            issues.append(f"missing deck field: {field}")
    slides = record.get("slides")
    if not isinstance(slides, list) or not slides:
        return issues + ["slides must be a non-empty list"]

    seen: set[str] = set()
    for index, slide in enumerate(slides, start=1):
        label = f"slide {index}"
        if not isinstance(slide, dict):
            issues.append(f"{label}: must be an object")
            continue
        slide_id = slide.get("id")
        if not isinstance(slide_id, str) or not slide_id.strip():
            issues.append(f"{label}: missing id")
        elif slide_id in seen:
            issues.append(f"{label}: duplicate id {slide_id}")
        else:
            seen.add(slide_id)
            label = f"slide {slide_id}"

        role = slide.get("role")
        if not role:
            issues.append(f"{label}: missing role")
        if not slide.get("claim"):
            if not (slide.get("purpose") and slide.get("exceptionReason")):
                issues.append(f"{label}: missing claim or explained purpose-only exception")

        evidence = slide.get("evidence", [])
        if role in FACT_ROLES and not evidence and not slide.get("exceptionReason"):
            issues.append(f"{label}: fact-bearing role needs evidence or an exception reason")
        if not isinstance(evidence, list):
            issues.append(f"{label}: evidence must be a list")
        else:
            for ev_index, item in enumerate(evidence, start=1):
                if not isinstance(item, dict) or not item.get("source") or not item.get("use"):
                    issues.append(f"{label}: evidence {ev_index} needs source and use")

        order = slide.get("readingOrder")
        if not isinstance(order, list) or not order or len(order) != len(set(map(str, order))):
            issues.append(f"{label}: readingOrder must be a non-empty unique list")

        visual = slide.get("visual", {})
        if visual and not isinstance(visual, dict):
            issues.append(f"{label}: visual must be an object")
        elif isinstance(visual, dict) and visual.get("type") in QUANTITATIVE_VISUALS:
            for field in ("sourceData", "unit", "scale", "alternative"):
                if not visual.get(field):
                    issues.append(f"{label}: quantitative visual missing {field}")
            if visual.get("isPartToWhole") and not visual.get("denominator"):
                issues.append(f"{label}: part-to-whole visual missing denominator")

        render = slide.get("renderEvidence", {})
        if not isinstance(render, dict):
            issues.append(f"{label}: renderEvidence must be an object")
            continue
        for field in ("preview", "exported"):
            value = render.get(field)
            if not value:
                issues.append(f"{label}: renderEvidence missing {field}")
            elif check_files and base is not None and not (base / str(value)).is_file():
                issues.append(f"{label}: {field} file not found: {value}")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Presentation design JSON")
    parser.add_argument("--check-files", action="store_true", help="Require preview/export files to exist")
    parser.add_argument("--report", type=Path, help="Write the result as JSON")
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    issues = inspect(data, args.input.parent, args.check_files)
    result = {"recordStatus": "PASS" if not issues else "FAIL", "qualityStatus": "NOT_RUN", "issues": issues}
    if args.report:
        args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
