"""Keep the catalog count and executable inventory in sync with reviewed relations."""

import importlib.util
import json
import re
from pathlib import Path


root = Path(__file__).resolve().parents[1]
catalogs = root / "knowledge"
spec = importlib.util.spec_from_file_location("audit_motion_clusters", root / "scripts/audit_motion_clusters.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

index = json.loads((catalogs / "motion-concept-index.json").read_text())
relations = json.loads((catalogs / "motion-equivalence.json").read_text())
displayed = json.loads((catalogs / "motion-core-progress.json").read_text())
report = module.audit(index["terms"], relations["relations"])
ready = [group for group in report["allCoreCandidateGroups"] if group["sharedCoreFamilyReady"]]
reductions = sum(len(group["members"]) - 1 for group in ready)

assert displayed["sourceTermCount"] == len(index["terms"])
assert displayed["reviewedPairCount"] == len(relations["relations"])
assert displayed["verifiedSharedCoreGroupCount"] == len(ready)
assert displayed["sourceTermsInVerifiedGroups"] == sum(len(group["members"]) for group in ready)
assert displayed["verifiedCoreReductions"] == reductions
assert displayed["upperBoundAfterVerifiedMerges"] == len(index["terms"]) - reductions
non_standalone = [term for term in index["terms"] if term["role"] in displayed["nonStandaloneRoleTypes"]]
assert displayed["nonStandaloneKnowledgeTerms"] == sorted(term["id"] for term in non_standalone)
assert displayed["standaloneRecipeCandidateCount"] == len(index["terms"]) - len(non_standalone)
assert displayed["standaloneCoreUpperBound"] == displayed["standaloneRecipeCandidateCount"] - reductions
assert displayed["finalizedStandaloneCoreCount"] == displayed["standaloneCoreUpperBound"]
assert len(displayed["standaloneUniqueMotionIds"]) == displayed["finalizedStandaloneCoreCount"]
assert len(set(displayed["standaloneUniqueMotionIds"])) == displayed["finalizedStandaloneCoreCount"]
pass_reviewed = {motion_id for row in relations["relations"] if row["status"] == "PASS" for motion_id in (row["a"], row["b"])}
assert displayed["standaloneTermsWithoutPassReview"] == []
assert all(term["id"] in pass_reviewed for term in index["terms"] if term["role"] not in displayed["nonStandaloneRoleTypes"])
assert displayed["termsWithoutAnyPairReview"] == len(report["termsWithoutPairReview"])
assert all(group["canonicalNameReady"] and not group["conflicts"] for group in ready)
engine = (root / "assets/layout/motion-verified-engine.mjs").read_text()
gallery = (root / "samples/motion-verified-lab.html").read_text()
implemented = re.search(r"export const implementedIds=\[([^\]]+)\]", engine)
assert implemented, "The new gallery needs an explicit canonical renderer inventory"
rendered_ids = set(re.findall(r"'([^']+)'", implemented.group(1)))
for pushed in re.findall(r"implementedIds\.push\(([^)]*)\)", engine):
    rendered_ids.update(re.findall(r"'([^']+)'", pushed))
supplement = (root / "assets/layout/motion-verified-supplement.mjs").read_text()
supplement_ids = set(re.findall(r"^  '([^']+)'\(c,t\)", supplement, re.MULTILINE))
rendered_ids.update(supplement_ids)
variant_match = re.search(r"export const contextVariantIds=\[([^\]]+)\]", engine)
variant_ids = set(re.findall(r"'([^']+)'", variant_match.group(1))) if variant_match else set()
rendered_ids.update(variant_ids)
name_audit = json.loads((catalogs / "motion-functional-name-audit.json").read_text())
taxonomy = json.loads((catalogs / "motion-taxonomy.json").read_text())
names = {entry["id"]: entry["name"] for category in taxonomy["categories"] for entry in category["entries"]}
assert len(name_audit["decisions"]) == 33
assert all(names[row["id"]] == row["newName"] for row in name_audit["decisions"])
assert {row["id"] for row in name_audit["decisions"] if row["decision"] == "merge-context-variant"} == {"free-ship"}
assert "free-ship" in variant_ids and "free-ship" not in displayed["standaloneUniqueMotionIds"]
canonical_ids = {group["canonicalMotionId"] for group in displayed["canonicalGroups"]}
group_member_ids = {member for group in displayed["canonicalGroups"] for member in group["members"]}
standalone_match = re.search(r"const standaloneIds=\[([^\]]+)\]", gallery)
standalone_ids = set(re.findall(r"'([^']+)'", standalone_match.group(1))) if standalone_match else set()
for pushed in re.findall(r"standaloneIds\.push\(([^)]*)\)", gallery):
    standalone_ids.update(re.findall(r"'([^']+)'", pushed))
standalone_ids.update(supplement_ids - variant_ids)
standalone_ids.update(set(displayed["standaloneSingletonMotionIds"]) - variant_ids)
assert rendered_ids == canonical_ids | standalone_ids | variant_ids, "Every rendered demo needs an explicit reviewed role"
assert set(displayed["standaloneUniqueMotionIds"]) <= rendered_ids, "Every unique catalog motion needs an executable demo"
assert rendered_ids - set(displayed["standaloneUniqueMotionIds"]) - variant_ids == {"ping-pong", "arc"}
assert len(variant_ids) == 10, "Previously accepted variants and the reviewed delivery progress variant must remain available"
assert not standalone_ids & canonical_ids
assert not standalone_ids & group_member_ids, "A reviewed shared-core alias must not appear as a separate demo"
assert set(displayed["standaloneSingletonMotionIds"]) | canonical_ids == set(displayed["standaloneUniqueMotionIds"])
assert not variant_ids & (canonical_ids | standalone_ids)
for motion_id in standalone_ids:
    assert any(
        row["status"] == "PASS" and motion_id in (row["a"], row["b"])
        and (row.get("sourceFrames") or row.get("evidence") or row.get("reason"))
        for row in relations["relations"]
    ), f"Standalone candidate lacks direct source comparison: {motion_id}"
for motion_id in variant_ids:
    assert any(
        row["status"] == "PASS" and row["kind"] in {"same-core-context-variant", "exact-alias"}
        and motion_id in (row["a"], row["b"])
        and (row.get("evidence") or row.get("reason"))
        for row in relations["relations"]
    ), f"Context variant lacks direct source comparison: {motion_id}"
assert "고유 모션 확정 수" in gallery
assert "motion-414-engine" not in engine + gallery
assert "motion-414-audit" not in gallery, "Old preview PASS must not certify new examples"
print("motion core progress: PASS")
