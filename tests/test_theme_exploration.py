import importlib.util
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("check_theme_exploration", root / "scripts/check_theme_exploration.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
archetypes = json.loads((root / "knowledge/theme-exploration-archetypes.json").read_text(encoding="utf-8"))["directions"]


def fixture(stage="C-candidates"):
    directions = []
    for item in archetypes:
        directions.append({
            "id": item["id"], "archetypeId": item["id"], "role": item["role"],
            "renderEvidence": f"screens/{item['id']}.png", "fullSizePreview": f"pages/{item['id']}.html",
            "sameScreenState": "approved-home:populated", "taskFit": item["considerWhen"],
            "accessibilityEvidence": "same-content rendered review",
            "axes": {axis: f"{item['id']}-{axis}" for axis in module.AXES},
        })
    return {"stage": stage, "approvedWireframeId": "B-2", "sameContentFixtureId": "scenario-1",
            "comparisonViewport": {"width": 900, "height": 700}, "directions": directions}


data = fixture()
assert module.check(data)["status"] == "PASS"
data["directions"][1]["axes"] = {**data["directions"][0]["axes"], "palette": "different"}
assert "COLOR_OR_SINGLE_AXIS_DUPLICATE" in {x["code"] for x in module.check(data)["warnings"]}
data = fixture()
data["directions"].pop()
assert "NINE_RENDERED_THEMES" in {x["code"] for x in module.check(data)["warnings"]}
data = fixture("final")
data["selection"] = {"selectedThemeId": "hybrid-1", "sourceThemeIds": ["native", "glass"],
                     "userDecisionEvidence": "C review", "selectedRenderEvidence": "screens/hybrid.png"}
data["productionHandoff"] = {"tokenSystem": "tokens.json", "componentStates": "states.html",
                             "appliedScreens": ["home", "settings"], "boundaryRenderEvidence": "captures/"}
data["independentReview"] = {"status": "NOT_RUN", "reason": "agent unavailable"}
assert "INDEPENDENT_NOT_CLEARED" in {x["code"] for x in module.check(data)["warnings"]}
data["independentReview"] = {"status": "PASS", "agentEvidence": "new context reviewer",
                             "artifactEvidence": "captures/", "findings": [], "blockingCount": 0}
assert module.check(data)["status"] == "PASS"
print("nine-theme exploration and independent handoff: PASS")
