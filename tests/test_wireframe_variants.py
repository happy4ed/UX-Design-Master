"""B alternatives need real reference evidence and different composition logic."""

import copy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from check_wireframe_variants import audit  # noqa: E402
from check_design_preflight import check as preflight  # noqa: E402


def fixture():
    baseline = {"taskId": "review-bills", "viewport": "390x844", "initialFixtureId": "few", "saturatedFixtureId": "many", "featureIds": ["filter", "inspect"], "informationIds": ["amount", "status"]}
    variants = []
    for index, pattern in enumerate(("inline-list", "context-sheet", "detail-screen"), 1):
        variants.append({"id": f"W{index}", "structurePrinciple": pattern,
                         "composition": {"choose-record": pattern, "inspect": "inline"},
                         "taskFlow": "open→choose→inspect", "benefit": "can inspect", "cost": "one more step",
                         "renderEvidence": "wireframe.png", "openedStateEvidence": "opened.png", "narrowEvidence": "narrow.png",
                         "boundaryEvidence": {"initial": "few.png", "saturated": "many.png"},
                         "featureIds": list(baseline["featureIds"]), "informationIds": list(baseline["informationIds"]),
                         "references": [{"app": "Observed app", "platform": "iOS", "screen": "Records", "state": "open", "observedPattern": pattern,
                                         "sourceRef": "https://example.org/official-screen", "checkedAt": "2026-11-04", "evidenceLevel": "official-screenshot"}]})
    return {"baseline": baseline, "variants": variants}


def check():
    data = fixture()
    assert audit(data)["status"] == "PASS"
    same = copy.deepcopy(data)
    same["variants"][2]["composition"] = same["variants"][1]["composition"]
    assert "COMPOSITION_DUPLICATE" in {row["code"] for row in audit(same)["warnings"]}
    missing = copy.deepcopy(data)
    missing["variants"][1]["informationIds"].remove("amount")
    missing["variants"][1]["references"] = []
    codes = {row["code"] for row in audit(missing)["warnings"]}
    assert {"UNFAIR_SCOPE", "REFERENCE_MISSING"} <= codes
    gate = preflight({"stage": "B", "screens": [{"id": "S1", "purpose": "Inspect", "stateOrder": ["entry", "open"], "renderEvidence": "render.png"}], "rehearsal": {}})
    missing_fields = {row["at"] for row in gate["warnings"]}
    assert {"rehearsal.runtimeContentAccess", "rehearsal.actionRowDensity"} <= missing_fields
    print("wireframe composition variants: PASS")


if __name__ == "__main__":
    check()
