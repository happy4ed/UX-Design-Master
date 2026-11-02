#!/usr/bin/env python3
"""Apply reviewed action names while keeping the original catalog IDs stable."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "knowledge/motion-functional-name-audit.json"
TAXONOMY = ROOT / "knowledge/motion-taxonomy.json"


def main():
    decisions = json.loads(AUDIT.read_text(encoding="utf-8"))["decisions"]
    if len({row["id"] for row in decisions}) != len(decisions):
        raise ValueError("Duplicate IDs in functional name audit")
    taxonomy = json.loads(TAXONOMY.read_text(encoding="utf-8"))
    entries = {entry["id"]: entry for category in taxonomy["categories"] for entry in category["entries"]}
    for row in decisions:
        entry = entries[row["id"]]
        if entry["name"] not in (row["oldName"], row["newName"]):
            raise ValueError(f"Unexpected existing name for {row['id']}: {entry['name']}")
        if row["nearestMotionId"] not in entries:
            raise ValueError(f"Unknown comparison motion: {row['nearestMotionId']}")
        entry["name"] = row["newName"]
    TAXONOMY.write_text(json.dumps(taxonomy, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Applied {len(decisions)} motion action names")


if __name__ == "__main__":
    main()
