#!/usr/bin/env python3
"""Join per-state browser style and alignment captures into DESIGN.md input."""
import argparse
import json
from collections import defaultdict
from pathlib import Path


def assemble(bundle, base):
    result = {key: bundle.get(key) for key in ("project", "reference", "measurementDate", "requiredStateIds", "requiredTransitionIds", "transitions", "decisions") if key in bundle}
    result["states"] = []
    result["observations"] = list(bundle.get("observations", []))
    counts = defaultdict(lambda: defaultdict(float))
    weighted = defaultdict(lambda: defaultdict(float))
    sampled = truncated = 0

    def add_observation(state, target, prop, value, unit, source, method, uncertainty):
        if value is None:
            return
        key = f"{state['id']}:{target}:{prop}"
        if any(row.get("id") == key for row in result["observations"]):
            raise ValueError(f"중복 관찰 ID: {key}")
        result["observations"].append({"id": key, "screenId": state["screenId"], "stateId": state["stateId"], "target": target,
                                       "property": prop, "value": value, "unit": unit, "source": source, "method": method, "uncertainty": uncertainty})

    for state in bundle.get("states", []):
        source = (state.get("measurement") or {}).get("source")
        if not source:
            raise ValueError(f"{state.get('id')}: measurement.source 필요")
        style = json.loads((base / source).read_text(encoding="utf-8"))
        item = dict(state)
        item["viewport"] = item.get("viewport") or style.get("viewport")
        item["measurement"] = {"source": source, "landmarks": style.get("landmarks", []), "focus": style.get("focus"), "scroll": style.get("scroll")}
        result["states"].append(item)
        sampled += style.get("sampledNodes", 0)
        truncated += style.get("truncatedNodes", 0)
        for field, rows in style.get("observed", {}).items():
            for row in rows:
                counts[field][row["value"]] += row["count"]
            for index, row in enumerate(rows[:5], 1):
                add_observation(state, f"style.{field}.{index}", "computedStyleCandidate", row["value"], "CSS value", source,
                                f"computed style frequency: {row['count']} visible DOM nodes", "frequency does not establish semantic role or optical appearance")
        for field, rows in style.get("weighted", {}).items():
            for row in rows:
                weighted[field][row["value"]] += row["count"]
        alignment_source = state.get("alignmentSource")
        if not alignment_source:
            continue
        alignment = json.loads((base / alignment_source).read_text(encoding="utf-8"))
        for group in alignment.get("groups", []):
            group_id = group["id"]
            for entry in group.get("entries", []):
                target = f"{group_id}.{entry['id']}"
                for prop, unit in (("drawnWidthRatio", "ratio"), ("primitiveInkAreaRatio", "ratio")):
                    add_observation(state, target, prop, entry.get(prop), unit, alignment_source, "SVG screen geometry / simple primitive area", entry.get("measurementLimits", "unknown"))
                for axis in ("x", "y"):
                    add_observation(state, target, f"visualOffset.{axis}", (entry.get("visualOffset") or {}).get(axis), "CSS px", alignment_source, "drawn center minus slot center", entry.get("measurementLimits", "unknown"))
                text = entry.get("text") or {}
                for prop, unit in (("firstLineInset", "CSS px"), ("fontSize", "CSS px"), ("fontWeight", "CSS weight"), ("lineHeight", "CSS px"), ("textIndent", "CSS px")):
                    add_observation(state, target, f"text.{prop}", text.get(prop), unit, alignment_source, "Range rect / computed style", entry.get("measurementLimits", "unknown"))
                for corner, value in (entry.get("radius") or {}).items():
                    add_observation(state, target, f"{corner}.px", value.get("px"), "CSS px", alignment_source, "computed radius", "optical curve requires screenshot")
                    add_observation(state, target, f"{corner}.ratio", value.get("ratio"), "ratio of short side", alignment_source, "radius / min(width,height)", "optical curve requires screenshot")
        for row in alignment.get("markerRows", []):
            add_observation(state, row["id"], "markerGap", row.get("gapPx"), "CSS px", alignment_source, "label left minus marker right", "glyph ink and optical gap require screenshot")

    def top(table):
        return {field: [{"value": value, "count": round(count, 3)} for value, count in sorted(values.items(), key=lambda pair: -pair[1])[:12]] for field, values in table.items()}
    result["evidence"] = {"sampledNodes": sampled, "truncatedNodes": truncated, "observed": top(counts), "weighted": top(weighted),
                          "note": "화면별 CSS 후보를 합산했으며 의미 역할·승인값은 decisions에서 별도로 판단"}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    data = assemble(json.loads(args.input.read_text(encoding="utf-8")), args.input.parent)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"out": str(args.out), "states": len(data["states"]), "observations": len(data["observations"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
