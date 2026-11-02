#!/usr/bin/env python3
"""Rank unreviewed motion pairs by original action code; never infer equivalence."""

import argparse
from collections import defaultdict
import itertools
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]


def balanced_braces(text, opening):
    depth = 0
    quote = None
    escape = False
    for pos in range(opening, len(text)):
        char = text[pos]
        if quote:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                quote = None
        elif char in "'\"`":
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[opening : pos + 1]
    return ""


def action_code(srcdoc):
    page = BeautifulSoup(srcdoc, "html.parser")
    scripts = "\n".join(node.get_text() for node in page.find_all("script"))
    for marker in ("var T=function", "var F=function"):
        start = scripts.find(marker)
        if start >= 0:
            opening = scripts.find("{", start)
            body = balanced_braces(scripts, opening)
            if body:
                return marker + body
    for marker in ("function frame(", "function draw("):
        start = scripts.find(marker)
        if start >= 0:
            opening = scripts.find("{", start)
            body = balanced_braces(scripts, opening)
            if body:
                return marker + body
    styles = "\n".join(node.get_text() for node in page.find_all("style"))
    pieces = []
    for match in re.finditer(r"@keyframes\s+[\w-]+\s*\{", styles):
        block = balanced_braces(styles, match.end() - 1)
        if block:
            pieces.append(block)
    return "\n".join(pieces)


def grams(value, width):
    compact = re.sub(r"\s+", "", value.lower())
    return {compact[pos : pos + width] for pos in range(max(0, len(compact) - width + 1))}


def jaccard(left, right):
    return len(left & right) / len(left | right) if left and right else 0.0


def rank(source_path, limit):
    index = json.loads((ROOT / "knowledge/motion-concept-index.json").read_text())
    equivalence = json.loads((ROOT / "knowledge/motion-equivalence.json").read_text())
    terms = {row["id"]: row for row in index["terms"]}
    reviewed = {frozenset((row["a"], row["b"])) for row in equivalence["relations"]}
    paired_terms = set().union(*(set(pair) for pair in reviewed)) if reviewed else set()
    unpaired_terms = set(terms) - paired_terms
    source = BeautifulSoup(source_path.read_text(encoding="utf-8"), "html.parser")
    observed = {}
    for card in source.select('article[id^="m-"]'):
        motion_id = card.get("id", "")[2:]
        frame = card.find("iframe")
        if motion_id in terms and frame and frame.get("srcdoc"):
            observed[motion_id] = action_code(frame["srcdoc"])
    missing = sorted(set(terms) - set(observed))
    if missing:
        raise ValueError(f"Original source is missing {len(missing)} inventory terms: {missing[:8]}")
    empty = sorted(key for key, code in observed.items() if not code)
    if empty:
        raise ValueError(f"No source action found for {len(empty)} terms: {empty[:8]}")
    fingerprints = defaultdict(list)
    for motion_id, code in observed.items():
        signature = re.sub(r"#[0-9a-fA-F]{3,8}\b", "#COLOR", re.sub(r"\s+", "", code))
        fingerprints[signature].append(motion_id)
    exact_color_variants = [sorted(group) for group in fingerprints.values() if len(group) > 1]
    raw = {key: grams(code, 6) for key, code in observed.items()}
    normalized = {
        key: grams(re.sub(r"\b\d+(?:\.\d+)?\b", "#", code), 6)
        for key, code in observed.items()
    }
    descriptions = {key: grams(row["behavior"], 3) for key, row in terms.items()}
    candidates = []
    best_overall = {}
    best_family = {}
    for left, right in itertools.combinations(sorted(terms), 2):
        if frozenset((left, right)) in reviewed:
            continue
        raw_score = jaccard(raw[left], raw[right])
        normalized_score = jaccard(normalized[left], normalized[right])
        code_score = .55 * raw_score + .45 * normalized_score
        behavior_score = jaccard(descriptions[left], descriptions[right])
        score = .85 * code_score + .15 * behavior_score
        candidate = {
            "a": left,
            "b": right,
            "score": round(score, 4),
            "sourceCodeSimilarity": round(code_score, 4),
            "behaviorSimilarity": round(behavior_score, 4),
        }
        for endpoint in (left, right):
            if endpoint not in unpaired_terms:
                continue
            if endpoint not in best_overall or score > best_overall[endpoint]["score"]:
                best_overall[endpoint] = candidate
            if terms[left]["sourceFamily"] == terms[right]["sourceFamily"]:
                if endpoint not in best_family or score > best_family[endpoint]["score"]:
                    best_family[endpoint] = candidate
        if score > .12:
            candidates.append(candidate)
    candidates.sort(key=lambda row: (-row["score"], row["a"], row["b"]))
    return {
        "scope": "Source-code similarity ranks pairs for direct original visual and mechanism review. It never proves equivalence or source fidelity.",
        "inventoryCount": len(terms),
        "reviewedPairCount": len(reviewed),
        "unpairedTermCount": len(unpaired_terms),
        "distinctSourceActionBodiesIgnoringColors": len(fingerprints),
        "exactSourceCodeGroupsIgnoringColors": sorted(exact_color_variants),
        "coverageCandidates": [
            {
                "termId": motion_id,
                "bestOverall": best_overall.get(motion_id),
                "bestSameFamily": best_family.get(motion_id),
            }
            for motion_id in sorted(unpaired_terms)
        ],
        "rankedCandidates": candidates[:limit],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-html", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = rank(args.source_html, args.limit)
    payload = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload, end="")


if __name__ == "__main__":
    main()
