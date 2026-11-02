#!/usr/bin/env python3
"""Build a role-aware audit index for every source motion term.

This does not invent a count of unique mechanisms. A shared browser keyframe is
implementation evidence, never proof that two source motions mean the same thing.
"""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "knowledge"

ROLE_BY_FAMILY = {
    "family-01": "camera-operation",
    "family-02": "camera-or-edit-operation",
    "family-03": "transition-or-reveal",
    "family-04": "typography-recipe",
    "family-05": "timing-or-motion-principle",
    "family-06": "temporal-or-visual-effect",
    "family-07": "transition-or-reveal",
    "family-08": "animated-background-pattern",
    "family-09": "typography-recipe",
    "family-10": "typography-recipe",
    "family-11": "transition-or-reveal",
    "family-12": "data-visualization-recipe",
    "family-13": "icon-or-logo-recipe",
    "family-14": "interface-feedback-recipe",
    "family-15": "graphic-technique",
    "family-16": "animated-background-pattern",
    "family-17": "title-sequence-recipe",
    "family-18": "numeric-interface-recipe",
    "family-19": "diagram-recipe",
}

ROLE_OVERRIDES = {
    "kinetic-typography": "umbrella-term",
    "lower-third": "layout-format",
    "split-screen": "layout-format",
    "pip": "layout-format",
    "easing": "timing-parameter",
    "ease-out": "timing-parameter",
    "slow-motion": "time-treatment",
    "time-lapse": "time-treatment",
    "freeze-frame": "time-treatment",
    "reverse": "time-treatment",
    "speed-ramp": "time-treatment",
    "loop": "repetition-parameter",
    "ping-pong": "repetition-parameter",
    "hold": "timing-parameter",
    "beat-sync": "timing-parameter",
    "motion-blur": "rendering-effect",
    "motion-trail": "rendering-effect",
    "smear": "rendering-effect",
    "film-grain": "rendering-effect",
    "bloom-glow": "rendering-effect",
    "lens-flare": "rendering-effect",
    "light-leak": "rendering-effect",
    "particles": "particle-system",
    "stagger": "timing-parameter",
    "arc": "motion-principle",
    "anticipation": "motion-principle",
    "follow-through": "motion-principle",
    "overlapping-action": "motion-principle",
    "secondary-action": "motion-principle",
    "squash-stretch": "motion-principle",
    "overshoot": "motion-principle",
    "bounce": "motion-principle",
    "motion-path": "path-following-technique",
    "trim-path": "path-reveal-technique",
    "cutaway": "spatial-diagram-technique",
    "exploded-view": "spatial-diagram-technique",
    "detail-inset": "spatial-diagram-technique",
    "iso-build": "spatial-diagram-technique",
    "variable-weight": "typography-technique",
    "pixelate": "rendering-effect",
}

# These strings are names used in source descriptions, not additional items in
# the 414-term inventory. They must never inflate its concept count.
LEXICAL_ALIASES = {
    "pixel-dissolve": ["grid dissolve"],
    "iris-wipe": ["원 팝 전환"],
    "screen-dive": ["push-through", "screen-into-cut"],
    "rgb-split": ["chromatic aberration"],
}


def main():
    taxonomy = json.loads((CATALOG / "motion-taxonomy.json").read_text())
    source = json.loads((CATALOG / "motion-source-behavior.json").read_text())
    equivalence = json.loads((CATALOG / "motion-equivalence.json").read_text())
    source_by_id = {entry["id"]: entry for entry in source["entries"]}
    links_by_id = {}
    for relation in equivalence["relations"]:
        for current, other in ((relation["a"], relation["b"]), (relation["b"], relation["a"])):
            links_by_id.setdefault(current, []).append({"otherId": other, "kind": relation["kind"], "reviewStatus": relation["status"]})
    terms = []
    for family in taxonomy["categories"]:
        for entry in family["entries"]:
            motion_id = entry["id"]
            links = links_by_id.get(motion_id, [])
            terms.append({
                "id": motion_id,
                "sourceFamily": entry["familyId"],
                "role": ROLE_OVERRIDES.get(motion_id, ROLE_BY_FAMILY[entry["familyId"]]),
                "behavior": source_by_id[motion_id]["behavior"],
                "lexicalAliases": LEXICAL_ALIASES.get(motion_id, []),
                "normalizationStatus": "SOURCE_TEXT_CLASSIFIED",
                "relationLinks": links,
                "conceptResolution": "PARTIAL_SOURCE_VISUAL_REVIEW" if any(link["reviewStatus"] == "PASS" for link in links) else "SOURCE_TEXT_RELATION_CANDIDATE" if links else "UNRESOLVED",
            })
    assert len(terms) == 414 and len({term["id"] for term in terms}) == 414
    output = {
        "schemaVersion": "1.0",
        "inventoryCount": 414,
        "uniqueMechanismCount": None,
        "countPolicy": "Do not calculate unique mechanisms from reviewed pairs alone. First discover candidates across all 414 source terms, inspect original action for each plausible relation, resolve multi-term groups without assuming transitivity, and merge only proven exact aliases. Roles, names, text similarity, and shared browser keyframes are not proof.",
        "terms": terms,
    }
    (CATALOG / "motion-concept-index.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
