import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
cat = root / "knowledge"
load = lambda name: json.loads((cat / name).read_text(encoding="utf-8"))
recipes = load("motion-authoring-recipes.json")
graph = load("motion-component-graph.json")
source = {x["id"]: x for x in load("motion-source-behavior.json")["entries"]}
by_id = {x["id"]: x for x in recipes["recipes"]}

assert recipes["count"] == len(by_id) == graph["motionCount"] == 343
assert set(by_id) == {x["id"] for x in graph["motions"]}
assert set(recipes["media"]) == {"app", "web", "ppt", "document"}
for motion in graph["motions"]:
    recipe = by_id[motion["id"]]
    assert recipe["name"] == motion["name"]
    assert recipe["classification"]["candidateComponentIds"] == motion["componentIds"]
    assert recipe["motionPrinciple"]["action"]
    assert recipe["motionPrinciple"]["doNotSubstitute"]
    assert recipe["evidenceAndReview"]["capturedSourceBehavior"] == source[motion["id"]]["behavior"]
    assert recipe["evidenceAndReview"]["fidelityStatus"].startswith("NOT_RUN")
    assert all(recipe["implementation"][medium] for medium in recipes["media"])
for mid in ["shutter-wipe", "text-vortex", "bar-race", "paper-cut", "morph-cut", "orbit", "ribbon-reveal", "smear"]:
    assert by_id[mid]["evidenceAndReview"]["userCorrectionApplied"]
    assert by_id[mid]["motionPrinciple"]["action"] != source[mid]["behavior"]
assert "다시 열려" in by_id["shutter-wipe"]["motionPrinciple"]["action"]
assert "맨 끝 글자" in by_id["text-vortex"]["motionPrinciple"]["action"]
assert "동시에" in by_id["stroke-then-fill"]["motionPrinciple"]["action"]
print("motion authoring recipes: PASS")
