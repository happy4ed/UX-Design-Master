#!/usr/bin/env python3
"""Summarize source-motion concepts and the reviewed catalog count."""

import json
from pathlib import Path

from audit_motion_clusters import audit


ROOT = Path(__file__).resolve().parents[1]
CATALOGS = ROOT / "knowledge"
NON_STANDALONE_ROLES = {
    "motion-principle",
    "timing-parameter",
    "repetition-parameter",
    "umbrella-term",
    "layout-format",
}


def main():
    index = json.loads((CATALOGS / "motion-concept-index.json").read_text())
    equivalence = json.loads((CATALOGS / "motion-equivalence.json").read_text())
    report = audit(index["terms"], equivalence["relations"])
    ready = [group for group in report["allCoreCandidateGroups"] if group["sharedCoreFamilyReady"]]
    if any(group["conflicts"] or group["unreviewed"] or not group["canonicalNameReady"] for group in ready):
        raise ValueError("A ready shared-core group has unresolved evidence or naming")
    reductions = sum(len(group["members"]) - 1 for group in ready)
    roles = {term["id"]: term["role"] for term in index["terms"]}
    non_standalone = sorted(motion_id for motion_id, role in roles.items() if role in NON_STANDALONE_ROLES)
    mixed_groups = [group["members"] for group in ready if any(member in non_standalone for member in group["members"])]
    if mixed_groups:
        raise ValueError(f"A non-standalone knowledge term was merged into a standalone core: {mixed_groups}")
    standalone_candidates = index["inventoryCount"] - len(non_standalone)
    pass_reviewed = {
        motion_id
        for relation in equivalence["relations"]
        if relation["status"] == "PASS"
        for motion_id in (relation["a"], relation["b"])
    }
    standalone_without_pass = sorted(
        motion_id for motion_id, role in roles.items()
        if role not in NON_STANDALONE_ROLES and motion_id not in pass_reviewed
    )
    if standalone_without_pass:
        raise ValueError(f"Standalone source motions without a completed comparison: {standalone_without_pass}")
    grouped_members = {member for group in ready for member in group["members"]}
    singleton_ids = sorted(
        motion_id for motion_id, role in roles.items()
        if role not in NON_STANDALONE_ROLES and motion_id not in grouped_members
    )
    unique_ids = sorted(singleton_ids + [group["canonicalCandidates"][0] for group in ready])
    if len(unique_ids) != len(set(unique_ids)) or len(unique_ids) != standalone_candidates - reductions:
        raise ValueError("Final catalog count does not match its explicit canonical inventory")
    payload = {
        "schemaVersion": "1.1",
        "countPolicy": "Catalog count under the reviewed source-action taxonomy: exclude principles, timing/repetition parameters, umbrella terms, and layout formats; merge only directly pairwise reviewed all-PASS shared-core groups; retain composites and materially different actions. Every standalone source term has a completed comparison. A new contradictory source observation requires revising this versioned count. Demo implementation fidelity is a separate review.",
        "countFinalizedAsOf": "2026-11-02",
        "sourceTermCount": index["inventoryCount"],
        "reviewedPairCount": report["reviewedRelationCount"],
        "verifiedSharedCoreGroupCount": len(ready),
        "sourceTermsInVerifiedGroups": sum(len(group["members"]) for group in ready),
        "verifiedCoreReductions": reductions,
        "upperBoundAfterVerifiedMerges": index["inventoryCount"] - reductions,
        "nonStandaloneRoleTypes": sorted(NON_STANDALONE_ROLES),
        "nonStandaloneKnowledgeTerms": non_standalone,
        "standaloneRecipeCandidateCount": standalone_candidates,
        "standaloneCoreUpperBound": standalone_candidates - reductions,
        "finalizedStandaloneCoreCount": len(unique_ids),
        "standaloneTermsWithoutPassReview": standalone_without_pass,
        "standaloneSingletonMotionIds": singleton_ids,
        "standaloneUniqueMotionIds": unique_ids,
        "termsWithoutAnyPairReview": len(report["termsWithoutPairReview"]),
        "canonicalGroups": [
            {"canonicalMotionId": group["canonicalCandidates"][0], "members": group["members"]}
            for group in ready
        ],
    }
    out = CATALOGS / "motion-core-progress.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"{payload['sourceTermCount']} source terms; {len(non_standalone)} non-standalone terms; {payload['finalizedStandaloneCoreCount']} catalog-unique motion recipes after {reductions} verified reductions")


if __name__ == "__main__":
    main()
