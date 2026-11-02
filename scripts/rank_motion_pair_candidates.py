#!/usr/bin/env python3
"""Rank unreviewed source terms for visual comparison; never decide equivalence."""

import argparse
import itertools
import json
import math
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def grams(value):
    value = "".join(str(value).lower().split())
    return set(value[i : i + 3] for i in range(max(0, len(value) - 2)))


def cosine(left, right):
    return sum(left[k] * right[k] for k in left.keys() & right.keys()) / (
        math.sqrt(sum(v * v for v in left.values()))
        * math.sqrt(sum(v * v for v in right.values()))
    ) if left and right else 0.0


def jaccard(left, right):
    a, b = set(left), set(right)
    return len(a & b) / len(a | b) if a and b else 0.0


def rank(index, taxonomy, cues, reviewed, limit):
    records = {row["id"]: row for row in index["terms"]}
    tax = {row["id"]: row for category in taxonomy["categories"] for row in category["entries"]}
    cue = {row["id"]: row for row in cues["entries"]}
    known = {frozenset((row["a"], row["b"])) for row in reviewed["relations"]}
    core_graph = defaultdict(set)
    for row in reviewed["relations"]:
        if row["status"] == "PASS" and row["kind"] in {"exact-alias", "same-core-context-variant"}:
            core_graph[row["a"]].add(row["b"])
            core_graph[row["b"]].add(row["a"])
    cluster_pairs = set()
    visited = set()
    for start in core_graph:
        if start in visited:
            continue
        stack, members = [start], set()
        while stack:
            current = stack.pop()
            if current in members:
                continue
            members.add(current)
            stack.extend(core_graph[current] - members)
        visited.update(members)
        if len(members) >= 3:
            cluster_pairs.update(frozenset(pair) for pair in itertools.combinations(members, 2))
    docs = {key: grams(row.get("behavior", "")) for key, row in records.items()}
    frequency = Counter(g for doc in docs.values() for g in doc)
    weights = {
        key: {g: math.log((len(docs) + 1) / (frequency[g] + 1)) + 1 for g in doc}
        for key, doc in docs.items()
    }
    candidates = []
    for a, b in itertools.combinations(sorted(records), 2):
        if frozenset((a, b)) in known:
            continue
        behavior = cosine(weights[a], weights[b])
        axes = jaccard(tax[a].get("motionAxes", []), tax[b].get("motionAxes", []))
        phases = jaccard(cue[a].get("phaseOrder", []), cue[b].get("phaseOrder", []))
        family = 1 if records[a].get("sourceFamily") == records[b].get("sourceFamily") else 0
        score = .64 * behavior + .22 * axes + .10 * phases + .04 * family
        if score <= 0 and frozenset((a, b)) not in cluster_pairs:
            continue
        candidates.append({"a": a, "b": b, "priority": "cluster-closure" if frozenset((a, b)) in cluster_pairs else "similarity-lead", "score": round(score, 4),
                           "behaviorSimilarity": round(behavior, 3), "axisSimilarity": round(axes, 3),
                           "phaseSimilarity": round(phases, 3), "sameSourceFamily": bool(family)})
    candidates.sort(key=lambda row: (row["priority"] != "cluster-closure", -row["score"], row["a"], row["b"]))
    return {"scope": "Unreviewed candidate ranking only. Similarity is not proof; inspect original motion and decisive intermediate frames before changing names or counts.",
            "inventoryCount": len(records), "knownRelationCount": len(known), "rankedCandidates": candidates[:limit]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    data = [json.loads((ROOT / name).read_text(encoding="utf-8")) for name in (
        "knowledge/motion-concept-index.json",
        "knowledge/motion-taxonomy.json",
        "knowledge/motion-construction-cues.json",
        "knowledge/motion-equivalence.json",
    )]
    report = rank(*data, limit=args.limit)
    payload = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload, end="")


if __name__ == "__main__":
    main()
