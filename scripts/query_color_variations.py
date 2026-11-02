"""Inspect cached seed variants or generate a review set for a new key color."""
import argparse
import json
from pathlib import Path

from build_color_variations import build_set

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "knowledge/color-variations.json").read_text(encoding="utf-8"))
parser = argparse.ArgumentParser()
parser.add_argument("--site", help="site id, e.g. stripe")
parser.add_argument("--thread", help="Threads palette id, e.g. blue-hour")
parser.add_argument("--mobile", help="mobile screen id, e.g. oneui9-settings-home")
parser.add_argument("--hex", help="arbitrary new #RRGGBB key color")
parser.add_argument("--background", default="#FFFFFF", help="background for contrast checks when using --hex")
parser.add_argument("--mode", choices=["all", "hue", "chroma", "tone", "gradients"], default="all")
args = parser.parse_args()
if sum(bool(value) for value in (args.site, args.thread, args.mobile, args.hex)) != 1:
    parser.error("choose exactly one of --site, --thread, --mobile, --hex")
key = "site:" + args.site if args.site else "threads:" + args.thread if args.thread else "mobile:" + args.mobile if args.mobile else None
item = next((row for row in data["sets"] if row["id"] == key), None) if key else build_set("ad-hoc", args.hex, args.background, "internal-generated from a user-provided key color")
if item is None:
    parser.error(f"unknown seed: {key}")
if args.mode == "hue":
    item = {**item, "variants": [row for row in item["variants"] if row["id"].startswith(("base", "analogous", "complement", "split", "equal-lightness"))], "gradients": []}
elif args.mode == "chroma":
    item = {**item, "variants": [row for row in item["variants"] if row["id"] in {"base", "lower-chroma", "higher-chroma"}], "gradients": []}
elif args.mode == "tone":
    item = {**item, "variants": [row for row in item["variants"] if row["id"] in {"base", "lighter", "darker"}], "gradients": []}
elif args.mode == "gradients":
    item = {**item, "variants": [], "gradients": item["gradients"]}
print(json.dumps(item, ensure_ascii=False, indent=2))
