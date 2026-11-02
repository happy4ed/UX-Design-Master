#!/usr/bin/env python3
"""Check a multi-panel infographic's source, story, and output records."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


QUANTITATIVE = {"bar", "line", "area", "pie", "donut", "treemap", "sankey", "scatter", "bubble", "number"}
RELATIONAL = {"flow", "network", "tree", "timeline", "sankey", "process"}


def inspect(record: dict) -> list[str]:
    issues: list[str] = []
    if record.get("kind") != "infographic":
        issues.append("kind must be 'infographic'")
    for field in ("audience", "storyClaim", "sourceSummary"):
        if not record.get(field):
            issues.append(f"missing infographic field: {field}")

    panels = record.get("panels")
    if not isinstance(panels, list) or not panels:
        return issues + ["panels must be a non-empty list"]
    ids: list[str] = []
    for index, panel in enumerate(panels, start=1):
        label = f"panel {index}"
        if not isinstance(panel, dict):
            issues.append(f"{label}: must be an object")
            continue
        pid = panel.get("id")
        if not isinstance(pid, str) or not pid.strip():
            issues.append(f"{label}: missing id")
        else:
            ids.append(pid)
            label = f"panel {pid}"
        for field in ("question", "claim", "source", "alternative", "renderEvidence"):
            if not panel.get(field):
                issues.append(f"{label}: missing {field}")
        encoding = panel.get("encoding")
        if not isinstance(encoding, dict) or not encoding.get("type") or not encoding.get("represents"):
            issues.append(f"{label}: encoding needs type and represents")
            continue
        typ = encoding["type"]
        if typ in QUANTITATIVE:
            for field in ("unit", "scale", "sourceData"):
                if not panel.get(field):
                    issues.append(f"{label}: quantitative panel missing {field}")
            if panel.get("isPartToWhole") and not panel.get("denominator"):
                issues.append(f"{label}: part-to-whole panel missing denominator")
            if panel.get("transformed") and not panel.get("formula"):
                issues.append(f"{label}: transformed values need formula")
        if typ in RELATIONAL and not panel.get("sourceRelations"):
            issues.append(f"{label}: relational panel needs sourceRelations")

    if len(ids) != len(set(ids)):
        issues.append("panel ids must be unique")
    scan = record.get("scanOrder")
    if not isinstance(scan, list) or set(scan) != set(ids) or len(scan) != len(ids):
        issues.append("scanOrder must contain each panel id exactly once")

    adaptations = record.get("adaptations")
    if not isinstance(adaptations, list) or not adaptations:
        issues.append("adaptations must describe at least one final medium")
    else:
        seen_media: set[str] = set()
        for index, item in enumerate(adaptations, start=1):
            label = f"adaptation {index}"
            if not isinstance(item, dict):
                issues.append(f"{label}: must be an object")
                continue
            medium = item.get("medium")
            if not medium:
                issues.append(f"{label}: missing medium")
            elif medium in seen_media:
                issues.append(f"{label}: duplicate medium {medium}")
            else:
                seen_media.add(medium)
            for field in ("displaySize", "readingOrder", "renderEvidence"):
                if not item.get(field):
                    issues.append(f"{label}: missing {field}")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    result = {"recordStatus": "PASS", "qualityStatus": "NOT_RUN", "issues": []}
    result["issues"] = inspect(json.loads(args.input.read_text(encoding="utf-8")))
    if result["issues"]:
        result["recordStatus"] = "FAIL"
    if args.report:
        args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["recordStatus"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
