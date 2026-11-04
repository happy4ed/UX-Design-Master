import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
cat = root / "knowledge"
load = lambda name: json.loads((cat / name).read_text(encoding="utf-8"))
graph = load("motion-component-graph.json")
progress = load("motion-core-progress.json")
components = load("core-components.json")
taxonomy = load("motion-taxonomy.json")

ids = {m["id"] for m in graph["motions"]}
component_ids = {c["id"] for c in components["entries"]}
source_names = {e["id"]: e["name"] for group in taxonomy["categories"] for e in group["entries"]}
assert ids == set(progress["standaloneUniqueMotionIds"]), "Every finalized motion must be tagged exactly once"
assert len(graph["motions"]) == len(ids) == graph["motionCount"]
assert {c["id"] for c in graph["components"]} == component_ids
assert len(graph["components"]) == graph["componentCount"]
assert all(m["name"] == source_names[m["id"]] for m in graph["motions"]), "Display names must follow the renamed catalog"
assert all(m["componentIds"] and set(m["componentIds"]) <= component_ids for m in graph["motions"])
assert all(m["useType"] in {u["id"] for u in graph["useTypes"]} for m in graph["motions"])
assert all(m["movementScale"] in {s["id"] for s in graph["movementScales"]} for m in graph["motions"])
assert all(m["mappingBasis"] in {"specific-state-rule", "source-family-default"} for m in graph["motions"])
edge_keys = {(e["from"], e["to"], e["type"]) for e in graph["edges"]}
assert len(edge_keys) == len(graph["edges"])
for m in graph["motions"]:
    for cid in m["componentIds"]:
        assert ("motion:" + m["id"], "component:" + cid, "candidate_for") in edge_keys
    assert ("motion:" + m["id"], "use:" + m["useType"], "has_use") in edge_keys
    assert ("motion:" + m["id"], "scale:" + m["movementScale"], "has_scale") in edge_keys

# These state-specific links catch the failure mode where family defaults suggest
# a generic icon or chart for a control whose state is already known.
by_id = {m["id"]: m for m in graph["motions"]}
for motion, component in {
    "toggle-on": "switch",
    "goal-fill": "progress-bar",
    "accordion-fold": "page-shell",
    "typing-bubble": "chat-message",
    "toast-slide": "toast",
    "matrix-sort": "data-grid",
}.items():
    assert component in by_id[motion]["componentIds"], (motion, component)
assert "accordion" not in by_id["accordion-fold"]["componentIds"], "Scene folding is not UI accordion expansion"
print("motion component graph: PASS")
