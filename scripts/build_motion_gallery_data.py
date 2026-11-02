#!/usr/bin/env python3
"""Build the compact browser index from the motion knowledge catalogs."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOGS = ROOT / "knowledge"
OUTPUT = ROOT / "assets" / "previews" / "motion-gallery-data.json"


def read(name):
    return json.loads((CATALOGS / name).read_text(encoding="utf-8"))


def main():
    taxonomy = read("motion-taxonomy.json")
    source = read("motion-source-behavior.json")
    equivalence = read("motion-equivalence.json")
    terms = {
        entry["id"]: {"name": entry["name"], "english": entry["english"]}
        for category in taxonomy["categories"]
        for entry in category["entries"]
    }
    for entry in source["entries"]:
        if entry["id"] in terms:
            terms[entry["id"]]["behavior"] = entry.get("behavior", "")
    source_frames = {}
    for relation in equivalence["relations"]:
        if relation.get("status") != "PASS" or not relation.get("sourceFrames"):
            continue
        frames = relation["sourceFrames"]
        frame = next((item for item in frames if ".html" in item), frames[0])
        for identifier in (relation["a"], relation["b"]):
            source_frames.setdefault(identifier, frame)
    output = {"terms": terms, "sourceFrames": source_frames}
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{OUTPUT}: {len(terms)} terms, {len(source_frames)} source links, {OUTPUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
