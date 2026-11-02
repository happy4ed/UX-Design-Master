#!/usr/bin/env python3
"""Check that the standalone skill can be moved without broken local links."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [ROOT / "SKILL.md", ROOT / "agents/openai.yaml", ROOT / "references/theme-exploration.md",
            ROOT / "references/independent-review.md", ROOT / "knowledge/core-components.json",
            ROOT / "samples/theme-nine-board.html"]
problems = [f"missing: {path.relative_to(ROOT)}" for path in required if not path.is_file()]

# Downloaded reference captures belong to the server-only research archive.
# Keep the distributable skill limited to authored HTML/SVG and structured observations.
raster_suffixes = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".tif", ".tiff"}
for path in ROOT.rglob("*"):
    if ".git" in path.parts or not path.is_file():
        continue
    if path.suffix.lower() in raster_suffixes:
        problems.append(f"raster image in release: {path.relative_to(ROOT)}")
    if path != Path(__file__).resolve() and path.suffix.lower() in {".md", ".json", ".html", ".svg", ".js", ".mjs", ".py", ".css"}:
        content = path.read_text(encoding="utf-8")
        if any(marker in content for marker in ("mobile-samples/", "motion-dedup-evidence/", "motion-fidelity-evidence/")):
            problems.append(f"private comparison path in release: {path.relative_to(ROOT)}")
        if re.search(r"https?://[^\s\"']+\.(?:png|jpe?g|webp|gif)(?:[?\"'\s]|$)", content, re.IGNORECASE):
            problems.append(f"direct third-party image URL in release: {path.relative_to(ROOT)}")

skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
if not skill.startswith("---\nname: ux-design-master\n"):
    problems.append("SKILL.md name must be ux-design-master")
if "UX-design-master" not in (ROOT / "agents/openai.yaml").read_text(encoding="utf-8"):
    problems.append("display name must be UX-design-master")

for path in ROOT.rglob("*.md"):
    content = path.read_text(encoding="utf-8")
    if "app-web-design-master" in content:
        problems.append(f"old skill name: {path.relative_to(ROOT)}")
    for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", content):
        target = target.split("#", 1)[0].strip()
        if target and "://" not in target and not target.startswith("mailto:"):
            if not (path.parent / target).exists():
                problems.append(f"broken link: {path.relative_to(ROOT)} -> {target}")

if problems:
    print("release package: FAIL")
    for problem in problems:
        print(problem)
    raise SystemExit(1)
print("release package: PASS")
