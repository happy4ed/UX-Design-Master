#!/usr/bin/env python3
"""Check that the standalone skill can be moved without broken local links."""

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [ROOT / "SKILL.md", ROOT / "agents/openai.yaml", ROOT / "references/theme-exploration.md",
            ROOT / "references/independent-review.md", ROOT / "knowledge/core-components.json",
            ROOT / "samples/theme-nine-board.html", ROOT / "samples/motion-stills/index.html",
            ROOT / "samples/motion-stills/manifest.json"]
problems = [f"missing: {path.relative_to(ROOT)}" for path in required if not path.is_file()]

# Raster images are permitted only when captured from this skill's authored renderer
# and explicitly accounted for in the manifest. Downloaded comparison captures stay server-only.
authored_rasters = set()
manifest_path = ROOT / "samples/motion-stills/manifest.json"
if manifest_path.is_file():
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("origin") != "self-authored-renderer-capture":
        problems.append("motion stills must declare self-authored renderer origin")
    for key in ("renderer", "gallery", "captureScript"):
        if not (ROOT / manifest.get(key, "")).is_file():
            problems.append(f"motion stills missing {key}")
    for motion in manifest.get("motions", []):
        if not motion.get("id") or len(motion.get("frames", [])) < 2:
            problems.append("motion stills need a named motion and multiple frames")
        for frame in motion.get("frames", []):
            name = frame.get("file", "")
            if Path(name).name != name or not name.endswith(".png"):
                problems.append(f"invalid motion still path: {name}")
                continue
            image_path = manifest_path.parent / name
            authored_rasters.add(image_path)
            if not image_path.is_file():
                problems.append(f"missing authored motion still: {name}")
            elif hashlib.sha256(image_path.read_bytes()).hexdigest() != frame.get("sha256"):
                problems.append(f"motion still hash mismatch: {name}")
raster_suffixes = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".tif", ".tiff"}
for path in ROOT.rglob("*"):
    if ".git" in path.parts or not path.is_file():
        continue
    if path.suffix.lower() in raster_suffixes and path not in authored_rasters:
        problems.append(f"unaccounted raster image in release: {path.relative_to(ROOT)}")
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
