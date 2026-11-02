"""Generate traceable, perceptual color variants from internal key-color seeds."""
import json
import math
from pathlib import Path

from color_math import contrast_ratio, hex_to_oklch, normalize_hex, oklch_to_hex

ROOT = Path(__file__).resolve().parents[1]
CAT = ROOT / "knowledge"
profiles = json.loads((CAT / "web-style-profiles.json").read_text(encoding="utf-8"))["profiles"]
expansions = json.loads((CAT / "palette-expansions.json").read_text(encoding="utf-8"))["sites"]
threads = json.loads((CAT / "thread-palettes.json").read_text(encoding="utf-8"))["palettes"]
mobile = json.loads((CAT / "mobile-app-observations.json").read_text(encoding="utf-8"))["screens"]


def sample_gradient(start, end, steps=11):
    l1, c1, h1 = hex_to_oklch(start)
    l2, c2, h2 = hex_to_oklch(end)
    a1, b1 = c1 * math.cos(math.radians(h1)), c1 * math.sin(math.radians(h1))
    a2, b2 = c2 * math.cos(math.radians(h2)), c2 * math.sin(math.radians(h2))
    for i in range(steps):
        t = i / (steps - 1)
        a, b = a1 * (1 - t) + a2 * t, b1 * (1 - t) + b2 * t
        yield oklch_to_hex(l1 * (1 - t) + l2 * t, math.hypot(a, b), math.degrees(math.atan2(b, a)))[0]


def foreground_for(stops):
    samples = []
    for a, b in zip(stops, stops[1:]):
        samples.extend(sample_gradient(a, b))
    scored = [(color, min(contrast_ratio(color, sample) for sample in samples)) for color in ("#000000", "#FFFFFF")]
    color, ratio = max(scored, key=lambda row: row[1])
    return {"color": color if ratio >= 4.5 else None, "minimumContrast": round(ratio, 2), "textSafe": ratio >= 4.5}


def build_set(set_id, seed, background, evidence):
    seed, background = normalize_hex(seed), normalize_hex(background)
    lightness, chroma, hue = hex_to_oklch(seed)
    variants = []

    def add(name, L, C, H, use):
        value, mapping = oklch_to_hex(L, C, H)
        variants.append({"id": name, "hex": value, "oklch": {"L": round(L, 4), "C": round(C, 4), "h": round(H % 360, 1)}, "mapping": mapping, "contrastOnBackground": round(contrast_ratio(value, background), 2), "use": use})

    add("base", lightness, chroma, hue, "seed; confirm role in the target product")
    if chroma >= 0.018:
        add("analogous-left", lightness, chroma * 0.9, hue - 30, "related accent or low-tension gradient stop")
        add("analogous-right", lightness, chroma * 0.9, hue + 30, "related accent or low-tension gradient stop")
        add("complement", lightness, chroma * 0.9, hue + 180, "separate emphasis or contrast pair; review balance")
        add("split-complement-left", lightness, chroma * 0.85, hue + 150, "alternative emphasis")
        add("split-complement-right", lightness, chroma * 0.85, hue + 210, "alternative emphasis")
        for step in (60, 120, 240, 300):
            add(f"equal-lightness-{step}", lightness, min(chroma, 0.14), hue + step, "same perceptual lightness, different hue; contrast still needs checking")
    add("lower-chroma", lightness, chroma * 0.55, hue, "quiet support color at similar lightness")
    add("higher-chroma", lightness, chroma * 1.2, hue, "stronger accent if gamut and contrast permit")
    add("lighter", min(0.95, lightness + 0.12), chroma * 0.8, hue, "tonal highlight or surface")
    add("darker", max(0.12, lightness - 0.12), chroma * 0.8, hue, "tonal depth or foreground")
    by_id = {variant["id"]: variant for variant in variants}
    gradients = []

    def gradient(name, ids, purpose, recommended=True):
        if any(variant not in by_id for variant in ids):
            return
        stops = [by_id[variant]["hex"] for variant in ids]
        gradients.append({"id": name, "stops": ids, "colors": stops, "css": f"linear-gradient(110deg in oklab, {', '.join(f'{value} {round(i/(len(stops)-1)*100)}%' for i,value in enumerate(stops))})", "purpose": purpose, "recommendedByDefault": recommended, "foreground": foreground_for(stops)})

    gradient("analogous", ["analogous-left", "base", "analogous-right"], "related-hue wash; suitable for gentle emphasis")
    gradient("tonal", ["lighter", "base", "darker"], "same-hue depth without extra color families")
    gradient("complementary", ["base", "complement"], "high-contrast expressive transition; inspect the neutral center", False)
    return {"id": set_id, "seed": seed, "seedOklch": {"L": round(lightness, 4), "C": round(chroma, 4), "h": round(hue, 1)}, "background": background, "sourceEvidence": evidence, "variants": variants, "gradients": gradients}


def main():
    sets = []
    for profile in profiles:
        site_id = profile["id"]
        seed = expansions[site_id].get("primary", profile["projection"]["accent"])
        sets.append(build_set("site:" + site_id, seed, profile["projection"]["background"], "internal-projection; not a site's official brand palette"))
    for palette in threads:
        colors = palette["swatchesDarkToLight"]
        seed = max(colors, key=lambda value: hex_to_oklch(value)[1])
        sets.append(build_set("threads:" + palette["id"], seed, colors[0], "generated from a labeled image swatch; variants are internal proposals"))
    for screen in mobile:
        if screen["seed"] and screen["seed"]["role"] == "ui-accent":
            sets.append(build_set("mobile:" + screen["id"], screen["seed"]["hex"], screen["seed"]["background"], "raster screenshot sample; not an official platform token; variants are internal proposals"))

    output = {"schemaVersion": "1.0", "method": "OKLCH hue/chroma/lightness operations with sRGB chroma reduction; same-L refers to OKLCH L, not equal WCAG relative luminance", "sets": sets}
    target = CAT / "color-variations.json"
    target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{target}: {len(sets)} seeds, {sum(len(item['variants']) for item in sets)} variants, {sum(len(item['gradients']) for item in sets)} gradient candidates")


if __name__ == "__main__":
    main()
