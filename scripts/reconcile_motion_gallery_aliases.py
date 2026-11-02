#!/usr/bin/env python3
"""Remove already merged source aliases from the separate motion demo inventory."""

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
progress = json.loads((ROOT / "knowledge/motion-core-progress.json").read_text())
aliases = {
    member
    for group in progress["canonicalGroups"]
    for member in group["members"]
    if member != group["canonicalMotionId"]
}
group_members = {
    member for group in progress["canonicalGroups"] for member in group["members"]
}
paths = [
    ROOT / "assets/layout/motion-verified-engine.mjs",
    ROOT / "samples/motion-verified-lab.html",
]
patterns = [
    re.compile(r"(export const implementedIds=\[)([^\]]+)(\])"),
    re.compile(r"(implementedIds\.push\()([^\)]+)(\))"),
    re.compile(r"(const standaloneIds=\[)([^\]]+)(\])"),
    re.compile(r"(standaloneIds\.push\()([^\)]+)(\))"),
]
removed = set()
for path in paths:
    content = path.read_text()
    for pattern in patterns:
        def filter_aliases(match):
            ids = re.findall(r"'([^']+)'", match.group(2))
            if not ids:
                return match.group(0)
            forbidden = group_members if "standaloneIds" in match.group(1) else aliases
            removed.update(set(ids) & forbidden)
            kept = [motion_id for motion_id in ids if motion_id not in forbidden]
            return match.group(1) + ",".join(f"'{motion_id}'" for motion_id in kept) + match.group(3)

        content = pattern.sub(filter_aliases, content, count=1)
    path.write_text(content)
print(f"Removed {len(removed)} separate aliases: {', '.join(sorted(removed))}")
