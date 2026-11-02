#!/usr/bin/env python3
"""Expose multi-term motion families without inferring aliases from transitivity."""

import argparse
import itertools
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "knowledge/motion-concept-index.json"
RELATIONS = ROOT / "knowledge/motion-equivalence.json"
CORE_KINDS = {"exact-alias", "same-core-context-variant"}


def audit(terms, relations):
    term_ids = {row["id"] for row in terms}
    by_pair = {}
    adjacency = defaultdict(set)
    for row in relations:
        a, b = row["a"], row["b"]
        if a not in term_ids or b not in term_ids or a == b:
            raise ValueError(f"Invalid relation endpoints: {a}, {b}")
        pair = frozenset((a, b))
        if pair in by_pair:
            raise ValueError(f"Duplicate relation: {a}, {b}")
        by_pair[pair] = row
        if row["kind"] in CORE_KINDS and row["status"] == "PASS":
            adjacency[a].add(b)
            adjacency[b].add(a)

    groups = []
    visited = set()
    for start in sorted(adjacency):
        if start in visited:
            continue
        stack = [start]
        members = set()
        while stack:
            current = stack.pop()
            if current in members:
                continue
            members.add(current)
            stack.extend(adjacency[current] - members)
        visited.update(members)
        if len(members) < 2:
            continue
        members = sorted(members)
        pair_status = []
        for a, b in itertools.combinations(members, 2):
            row = by_pair.get(frozenset((a, b)))
            pair_status.append({
                "a": a,
                "b": b,
                "kind": row["kind"] if row else "UNREVIEWED",
                "status": row["status"] if row else "NOT_RUN",
            })
        shared_core_ready = all(
            pair["kind"] in CORE_KINDS and pair["status"] == "PASS"
            for pair in pair_status
        )
        alias_ready = all(
            pair["kind"] == "exact-alias" and pair["status"] == "PASS"
            for pair in pair_status
        )
        canonical_candidates = sorted({
            by_pair[frozenset((a, b))].get("canonicalMotionId")
            for a, b in itertools.combinations(members, 2)
            if frozenset((a, b)) in by_pair and by_pair[frozenset((a, b))].get("canonicalMotionId")
        })
        groups.append({
            "members": members,
            "pairwise": pair_status,
            "unreviewed": [p for p in pair_status if p["kind"] == "UNREVIEWED"],
            "conflicts": [p for p in pair_status if p["kind"] not in CORE_KINDS and p["kind"] != "UNREVIEWED"],
            "sharedCoreFamilyReady": shared_core_ready,
            "exactAliasMergeReady": alias_ready,
            "canonicalCandidates": canonical_candidates,
            "canonicalNameReady": shared_core_ready and len(canonical_candidates) == 1,
        })

    covered = set().union(*(set(pair) for pair in by_pair)) if by_pair else set()
    return {
        "inventoryCount": len(term_ids),
        "reviewedRelationCount": len(by_pair),
        "termsWithoutPairReview": sorted(term_ids - covered),
        "multiTermCandidateGroups": [group for group in groups if len(group["members"]) >= 3],
        "allCoreCandidateGroups": groups,
        "policy": "Graph connections generate candidates only. Every pair in a group must be directly reviewed before a shared-core family is ready; only all-PASS exact aliases can be merged as one name.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Write JSON report to this path")
    args = parser.parse_args()
    terms = json.loads(INDEX.read_text(encoding="utf-8"))["terms"]
    relations = json.loads(RELATIONS.read_text(encoding="utf-8"))["relations"]
    report = audit(terms, relations)
    payload = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload, end="")


if __name__ == "__main__":
    main()
