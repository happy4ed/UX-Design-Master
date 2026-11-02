"""Guard the distinction between source names and proven motion concepts."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "knowledge"


def main():
    concepts = json.loads((ROOT / "motion-concept-index.json").read_text())
    queue = json.loads((ROOT / "motion-pair-audit.json").read_text())
    decisions = json.loads((ROOT / "motion-equivalence.json").read_text())
    ids = {term["id"] for term in concepts["terms"]}
    assert concepts["inventoryCount"] == 414 == len(ids)
    assert concepts["uniqueMechanismCount"] is None
    assert all(term["role"] and term["behavior"] for term in concepts["terms"])
    pairs = {tuple(sorted((item["a"], item["b"]))) for item in queue["pairs"]}
    assert queue["candidateCount"] == len(pairs)
    assert all(a in ids and b in ids and a != b for a, b in pairs)
    allowed = {"exact-alias", "same-core-context-variant", "principle-applied-to-context", "composite-uses-core", "different-motion"}
    reviewed = {}
    core_pairs = {
        tuple(sorted((relation["a"], relation["b"])))
        for relation in decisions["relations"]
        if relation["status"] == "PASS" and relation["kind"] in {"exact-alias", "same-core-context-variant"}
    }
    for relation in decisions["relations"]:
        pair = tuple(sorted((relation["a"], relation["b"])))
        assert pair in pairs and pair not in reviewed
        assert relation["kind"] in allowed
        assert relation["status"] in {"PASS", "PROVISIONAL", "NOT_RUN"}
        if relation["kind"] != "different-motion":
            canonical = relation["canonicalMotionId"]
            assert canonical in ids
            if canonical not in pair:
                assert relation["kind"] in {"exact-alias", "same-core-context-variant"}
                assert all(tuple(sorted((member, canonical))) in core_pairs for member in pair)
        for source_frame in relation.get("sourceFrames", []):
            assert (ROOT / source_frame.split("?", 1)[0]).exists(), source_frame
        reviewed[pair] = relation
    for item in queue["pairs"]:
        pair = tuple(sorted((item["a"], item["b"])))
        if pair in reviewed:
            assert (item["relation"], item["reviewStatus"]) == (reviewed[pair]["kind"], reviewed[pair]["status"])
        else:
            assert item["relation"] == "UNRESOLVED" and item["reviewStatus"] == "NOT_RUN"
    links_by_id = {term["id"]: {(link["otherId"], link["kind"], link["reviewStatus"]) for link in term["relationLinks"]} for term in concepts["terms"]}
    expected_links = {motion_id: set() for motion_id in ids}
    for relation in decisions["relations"]:
        a, b = relation["a"], relation["b"]
        expected_links[a].add((b, relation["kind"], relation["status"]))
        expected_links[b].add((a, relation["kind"], relation["status"]))
    assert links_by_id == expected_links, "Concept index must reflect current reviewed relations"
    print(f"motion concept audit: {len(ids)} source terms, {len(pairs)} candidate pairs, {len(reviewed)} decisions")


if __name__ == "__main__":
    main()
