#!/usr/bin/env python3
"""Record directly inspected source-pair decisions in all motion catalogs."""

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1] / "knowledge"
KINDS = {
    "exact-alias",
    "same-core-context-variant",
    "composite-uses-core",
    "principle-applied-to-context",
    "different-motion",
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("batch", type=Path, help="JSON array of directly reviewed source pairs")
    args = parser.parse_args()
    batch = json.loads(args.batch.read_text(encoding="utf-8"))
    paths = {name: ROOT / name for name in (
        "motion-concept-index.json", "motion-pair-audit.json", "motion-equivalence.json"
    )}
    docs = {name: json.loads(path.read_text(encoding="utf-8")) for name, path in paths.items()}
    terms = {term["id"]: term for term in docs["motion-concept-index.json"]["terms"]}
    relations = docs["motion-equivalence.json"]["relations"]
    audits = docs["motion-pair-audit.json"]["pairs"]
    known = {frozenset((row["a"], row["b"])) for row in relations}
    for row in batch:
        a, b, kind = row["a"], row["b"], row["kind"]
        pair = frozenset((a, b))
        if a not in terms or b not in terms or a == b or kind not in KINDS:
            raise ValueError(f"Invalid reviewed pair: {a}, {b}, {kind}")
        if pair in known:
            raise ValueError(f"Already reviewed: {a}, {b}")
        if kind != "different-motion" and row.get("canonicalMotionId") not in pair:
            raise ValueError(f"Missing canonical member: {a}, {b}")
        if kind == "different-motion" and row.get("canonicalMotionId"):
            raise ValueError(f"Different motions cannot have a canonical member: {a}, {b}")
        frames = row.get("sourceFrames", [])
        if not frames or not row.get("reason"):
            raise ValueError(f"Source evidence and reason are required: {a}, {b}")
        known.add(pair)
        relation = {
            "a": a, "b": b, "kind": kind, "status": "PASS",
            "reason": row["reason"],
            "reviewScope": "Original source action and decisive frames; internal rendering fidelity is separate.",
            "sourceFrames": frames,
            "mechanismEvidence": row.get("mechanismEvidence", row["reason"]),
        }
        if row.get("canonicalMotionId"):
            relation["canonicalMotionId"] = row["canonicalMotionId"]
        relations.append(relation)
        audits.append({
            "a": a, "b": b, "aRole": terms[a]["role"], "bRole": terms[b]["role"],
            "aBehavior": terms[a]["behavior"], "bBehavior": terms[b]["behavior"],
            "relation": kind, "reviewStatus": "PASS", "evidence": row["reason"],
            "mechanismEvidence": relation["mechanismEvidence"],
            "timingStatus": row.get("timingStatus", "ACTION_FRAMES_OBSERVED"),
            "sourceFrames": frames, "sourceCycleMs": None,
            "internalMatchStatusById": {a: "NOT_RUN", b: "NOT_RUN"},
        })
        terms[a]["relationLinks"].append({"otherId": b, "kind": kind, "reviewStatus": "PASS"})
        terms[b]["relationLinks"].append({"otherId": a, "kind": kind, "reviewStatus": "PASS"})
    docs["motion-pair-audit.json"]["candidateCount"] = len(audits)
    for name, path in paths.items():
        path.write_text(json.dumps(docs[name], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Recorded {len(batch)} source-pair decisions; {len(relations)} total")


if __name__ == "__main__":
    main()
