"""A connected motion graph must not silently become an alias group."""

import importlib.util
import json
from pathlib import Path


script = Path(__file__).resolve().parents[1] / "scripts/audit_motion_clusters.py"
spec = importlib.util.spec_from_file_location("audit_motion_clusters", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

terms = [{"id": name} for name in ("a", "b", "c", "isolated")]
relations = [
    {"a": "a", "b": "b", "kind": "same-core-context-variant", "status": "PASS"},
    {"a": "b", "b": "c", "kind": "same-core-context-variant", "status": "PASS"},
]
report = module.audit(terms, relations)
group = report["multiTermCandidateGroups"][0]
assert group["members"] == ["a", "b", "c"]
assert [(p["a"], p["b"]) for p in group["unreviewed"]] == [("a", "c")]
assert not group["sharedCoreFamilyReady"]
assert not group["exactAliasMergeReady"]
assert not group["canonicalNameReady"]
assert report["termsWithoutPairReview"] == ["isolated"]

with_conflict = relations + [{"a": "a", "b": "c", "kind": "different-motion", "status": "PASS"}]
group = module.audit(terms, with_conflict)["multiTermCandidateGroups"][0]
assert len(group["conflicts"]) == 1
assert not group["sharedCoreFamilyReady"]

all_aliases = [
    {"a": a, "b": b, "kind": "exact-alias", "status": "PASS"}
    for a, b in (("a", "b"), ("a", "c"), ("b", "c"))
]
group = module.audit(terms, all_aliases)["multiTermCandidateGroups"][0]
assert group["sharedCoreFamilyReady"]
assert group["exactAliasMergeReady"]
assert not group["canonicalNameReady"]  # A name has not been selected by the pair evidence.

root = script.parents[1] / "knowledge"
live_terms = json.loads((root / "motion-concept-index.json").read_text())["terms"]
live_relations = json.loads((root / "motion-equivalence.json").read_text())["relations"]
live = module.audit(live_terms, live_relations)
for group in live["multiTermCandidateGroups"]:
    assert not group["conflicts"], f"Conflicting shared-core group: {group['members']}"
    if group["sharedCoreFamilyReady"]:
        assert group["canonicalNameReady"], f"Missing one canonical name: {group['members']}"
print("motion cluster audit: PASS")
