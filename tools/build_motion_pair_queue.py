#!/usr/bin/env python3
"""Enumerate every explicit cross-reference in the 414-term source inventory."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "knowledge"


def main():
    taxonomy = json.loads((CATALOG / "motion-taxonomy.json").read_text())
    concepts = json.loads((CATALOG / "motion-concept-index.json").read_text())
    equivalence = json.loads((CATALOG / "motion-equivalence.json").read_text())
    terms = [entry for group in taxonomy["categories"] for entry in group["entries"]]
    name_to_id = {entry["name"]: entry["id"] for entry in terms}
    by_id = {term["id"]: term for term in concepts["terms"]}
    reviews = {tuple(sorted((item["a"], item["b"]))): item for item in equivalence["relations"]}
    pairs = set()
    for entry in terms:
        for name in entry["relatedTerms"]:
            other = name_to_id.get(name)
            if other and other != entry["id"]:
                pairs.add(tuple(sorted((entry["id"], other))))
    # Curated candidate relations may not be linked in relatedTerms.
    pairs.update(reviews)
    queue = []
    for a, b in sorted(pairs):
        reviewed = reviews.get((a, b))
        queue.append({
            "a": a,
            "b": b,
            "aRole": by_id[a]["role"],
            "bRole": by_id[b]["role"],
            "aBehavior": by_id[a]["behavior"],
            "bBehavior": by_id[b]["behavior"],
            "relation": reviewed["kind"] if reviewed else "UNRESOLVED",
            "reviewStatus": reviewed["status"] if reviewed else "NOT_RUN",
            "evidence": reviewed["reason"] if reviewed else None,
            "mechanismEvidence": reviewed.get("mechanismEvidence") if reviewed else None,
            "timingStatus": reviewed.get("timingStatus", "NOT_RUN") if reviewed else "NOT_RUN",
            "sourceFrames": reviewed.get("sourceFrames", []) if reviewed else [],
            "sourceCycleMs": reviewed.get("sourceCycleMs") if reviewed else None,
            "internalMatchStatusById": reviewed.get("internalMatchStatusById", {a: "NOT_RUN", b: "NOT_RUN"}) if reviewed else {a: "NOT_RUN", b: "NOT_RUN"},
        })
    priority = {"same-core-context-variant": 0, "principle-applied-to-context": 1, "composite-uses-core": 2, "different-motion": 3, "UNRESOLVED": 4}
    queue.sort(key=lambda item: (priority[item["relation"]], item["reviewStatus"] != "PASS", item["a"], item["b"]))
    output = {
        "schemaVersion": "1.0",
        "candidateCount": len(queue),
        "coveragePolicy": "Candidate discovery from source cross-references and curated comparisons; this is not an exhaustive proof that unlinked pairs differ.",
        "pairs": queue,
    }
    (CATALOG / "motion-pair-audit.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
