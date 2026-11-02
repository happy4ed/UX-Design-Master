"""Validate that color analysis is attached to a screen-rooted Z layer tree."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT / "knowledge/mobile-backdrop-observations.json"
HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
STATUSES = {"measured", "raster-observed", "manual-raster-inference", "inferred", "none-observed", "unknown", "not-measured"}


def check_record(row):
    issues = []
    key = row.get("screenId", row.get("target", "<unnamed>"))
    for field in ("sourceType", "state", "layers", "occlusionRelations", "unassignedColorSamples", "evidenceClass", "zLimit"):
        if field not in row:
            issues.append(f"{key}: missing {field}")
    if issues:
        return issues
    layers = row["layers"]
    if not layers:
        return [f"{key}: no Z layers"]
    ids = [layer.get("id") for layer in layers]
    if len(ids) != len(set(ids)):
        issues.append(f"{key}: duplicate layer id")
    roots = [layer for layer in layers if layer.get("parentId") is None]
    if len(roots) != 1 or roots[0].get("depthBand") != "canvas":
        issues.append(f"{key}: expected one screen-wide canvas root")
    id_set = set(ids)
    for layer in layers:
        lid = layer.get("id", "<unnamed>")
        parent = layer.get("parentId")
        if parent is not None and parent not in id_set:
            issues.append(f"{key}/{lid}: missing parent {parent}")
        if parent == lid:
            issues.append(f"{key}/{lid}: self-parenting")
        for field in ("depthBand", "role", "box", "base", "components", "accentColors", "effects", "zEvidence"):
            if field not in layer:
                issues.append(f"{key}/{lid}: missing {field}")
        if any(field not in layer for field in ("base", "effects", "accentColors")):
            continue
        base = layer["base"]
        if base.get("status") not in STATUSES:
            issues.append(f"{key}/{lid}: invalid base status")
        if base.get("color") and not HEX.fullmatch(base["color"]):
            issues.append(f"{key}/{lid}: invalid base color")
        if not base.get("color") and not base.get("evidence"):
            issues.append(f"{key}/{lid}: unknown base needs reason")
        for accent in layer["accentColors"]:
            if not HEX.fullmatch(accent.get("hex", "")) or not accent.get("evidence"):
                issues.append(f"{key}/{lid}: accent lacks color/evidence")
        for effect in ("shadow", "blur"):
            value = layer["effects"].get(effect, {})
            if value.get("status") not in STATUSES:
                issues.append(f"{key}/{lid}: missing {effect} status")
            if value.get("status") in {"unknown", "not-measured"} and not value.get("note"):
                issues.append(f"{key}/{lid}: {effect} uncertainty needs reason")
            if value.get("status") in {"unknown", "not-measured"} and any(name in value for name in ("radius", "offsetX", "offsetY", "spread", "opacity")):
                issues.append(f"{key}/{lid}: unverified numeric {effect}")
    parents = {layer.get("id"): layer.get("parentId") for layer in layers}
    for lid in ids:
        seen = set()
        current = lid
        while current in parents and current is not None:
            if current in seen:
                issues.append(f"{key}/{lid}: parent cycle")
                break
            seen.add(current)
            current = parents[current]
    for relation in row["occlusionRelations"]:
        if relation.get("above") not in id_set or relation.get("below") not in id_set or relation.get("above") == relation.get("below"):
            issues.append(f"{key}: invalid occlusion relation")
        if not relation.get("evidence"):
            issues.append(f"{key}: occlusion requires evidence")
    if row["sourceType"] == "raster":
        clues = row.get("edgeClues", {})
        if len(clues.get("samples", [])) != clues.get("sampleCount") or not HEX.fullmatch(clues.get("dominantEdgeFamily", "")):
            issues.append(f"{key}: edge-pixel provenance incomplete")
    if not (row.get("sourceImage") or row.get("sourcePage") or row.get("sourceFile")):
        issues.append(f"{key}: missing source pointer")
    return issues


def check_catalog(data):
    rows = data.get("screens", data.get("analyses", []))
    issues = [issue for row in rows for issue in check_record(row)]
    if not rows:
        issues.append("no background records")
    ids = [row.get("screenId", row.get("target")) for row in rows]
    if len(ids) != len(set(ids)):
        issues.append("duplicate screenId")
    return issues


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT)
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    issues = check_catalog(data)
    if issues:
        print("\n".join(issues))
        raise SystemExit(1)
    print(f"PASS: {len(data.get('screens', data.get('analyses', [])))} screen-rooted Z layer analyses have required evidence")
