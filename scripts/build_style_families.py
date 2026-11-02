"""Group similar sampled site styles without deleting or merging source profiles."""
import json
import math
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = ROOT / "knowledge"
profiles = json.loads((CAT / "web-style-profiles.json").read_text(encoding="utf-8"))["profiles"]
gradients = json.loads((CAT / "web-gradient-observations.json").read_text(encoding="utf-8"))["observations"]
colors = json.loads((CAT / "color-variations.json").read_text(encoding="utf-8"))["sets"]
colors_by_site = {row["id"].split(":", 1)[1]: row for row in colors if row["id"].startswith("site:")}
by_id = {row["id"]: row for row in profiles}


def tone_family(tone):
    if tone in {"dark", "mono"}:
        return "dark-neutral"
    if tone in {"bright", "soft", "warm", "knowledge", "editorial", "utility", "catalog"}:
        return "light-content"
    return "expressive"


def proximity(a, b, divisor):
    return max(0, 1 - abs(a - b) / divisor)


def measured_px(value, fallback=0):
    try:
        return float(str(value).replace("px", ""))
    except ValueError:
        return fallback


def font_family_group(value):
    family = value.lower()
    if "egyptian" in family or re.search(r"(?<!sans-)serif", family):
        return "serif"
    if "mija" in family or "headline" in family and "inter" not in family:
        return "display"
    return "sans"


def similarity(a, b):
    x, y = a["projection"], b["projection"]
    tx, ty = x["tokens"], y["tokens"]
    ox, oy = a["observed"], b["observed"]
    measured_gap = lambda row: row["gaps"][0]["cssPx"] if row["gaps"] else 0
    icon_density = lambda row: math.log1p(row["iconElements"]["svg"] + row["iconElements"]["iconFonts"])
    terms = {
        "surface": 0.24 * (x["surfaceMode"] == y["surfaceMode"]),
        "alignment": 0.15 * (x["alignment"] == y["alignment"]),
        "toneFamily": 0.10 * (tone_family(x["tone"]) == tone_family(y["tone"])),
        "icon": 0.08 * (x["iconTreatment"] == y["iconTreatment"] or {x["iconTreatment"], y["iconTreatment"]} == {"minimal", "quiet"}),
        "headingScale": 0.07 * proximity(tx["heading"], ty["heading"], 40),
        "gap": 0.05 * proximity(tx["gap"], ty["gap"], 24),
        "radius": 0.04 * proximity(tx["radius"], ty["radius"], 16),
        "section": 0.04 * proximity(tx["section"], ty["section"], 80),
        "nav": 0.03 * proximity(tx["nav"], ty["nav"], 32),
        "observedFontClass": 0.08 * (font_family_group(ox["heading"]["fontFamily"]) == font_family_group(oy["heading"]["fontFamily"])),
        "observedHeading": 0.05 * proximity(measured_px(ox["heading"]["fontSize"]), measured_px(oy["heading"]["fontSize"]), 80),
        "observedGap": 0.03 * proximity(measured_gap(ox), measured_gap(oy), 24),
        "observedIconDensity": 0.025 * proximity(icon_density(ox), icon_density(oy), 4),
        "observedNavHeight": 0.015 * proximity((ox["nav"].get("box") or {}).get("h", 0), (oy["nav"].get("box") or {}).get("h", 0), 120),
    }
    return round(sum(terms.values()), 4)


def motif(css):
    css = css.lower()
    if "conic-gradient(" in css:
        return "conic"
    if "radial-gradient(" in css and "linear-gradient(" in css:
        return "layered-radial-linear"
    if "radial-gradient(" in css:
        return "radial-glow"
    if "linear-gradient(" in css:
        if "rgba(" in css or " / " in css:
            return "alpha-or-tonal-layer"
        return "linear-color-or-tone"
    return "other"


gradient_by_site = {row["siteId"]: Counter(motif(item["css"]) for item in (row.get("observation") or {}).get("gradients", [])) for row in gradients}
clusters = [[row["id"]] for row in profiles]
threshold = 0.76
while True:
    choices = []
    for i in range(len(clusters)):
        for j in range(i + 1, len(clusters)):
            values = [similarity(by_id[a], by_id[b]) for a in clusters[i] for b in clusters[j]]
            if min(values) >= threshold:
                choices.append((sum(values) / len(values), i, j))
    if not choices:
        break
    _, i, j = max(choices)
    clusters[i] = sorted(clusters[i] + clusters[j])
    del clusters[j]

families = []
for index, members in enumerate(sorted(clusters, key=lambda members: (-len(members), members)), 1):
    representative = max(members, key=lambda candidate: sum(similarity(by_id[candidate], by_id[other]) for other in members if other != candidate))
    sample = by_id[representative]["projection"]
    motif_counts = Counter()
    for member in members:
        motif_counts.update(gradient_by_site.get(member, Counter()))
    families.append({
        "id": f"style-family-{index:02d}",
        "representative": representative,
        "members": members,
        "structure": {"surfaceMode": sample["surfaceMode"], "alignment": sample["alignment"], "toneFamily": tone_family(sample["tone"])},
        "pairwiseMinimum": round(min((similarity(by_id[a], by_id[b]) for i, a in enumerate(members) for b in members[i + 1:]), default=1), 3),
        "distinctKeyColors": {member: colors_by_site[member]["seed"] for member in members},
        "observedGradientMotifs": dict(motif_counts),
        "interpretation": "Same sampled structural style family; colors, details, content and current site may differ. Keep each source profile."
    })

neighbors = {}
for row in profiles:
    near = sorted(((other["id"], similarity(row, other)) for other in profiles if other["id"] != row["id"]), key=lambda item: (-item[1], item[0]))[:3]
    neighbors[row["id"]] = [{"site": site, "structuralSimilarity": score} for site, score in near]

output = {"schemaVersion": "1.0", "basis": "Internal structural similarity of one sampled homepage per site. Color is deliberately separate so a shared layout can have distinct palettes.", "threshold": threshold, "families": families, "nearest": neighbors}
target = CAT / "style-families.json"
target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{target}: {len(profiles)} sites → {len(families)} families; {sum(len(f['members'])>1 for f in families)} multi-site families")
