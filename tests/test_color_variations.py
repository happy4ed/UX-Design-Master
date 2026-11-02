"""Regression checks for color variation geometry and source coverage."""
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from color_math import contrast_ratio, delta_oklab, hex_to_oklch, oklch_to_hex  # noqa: E402
from build_color_variations import foreground_for  # noqa: E402
from check_background_analysis import check_catalog, check_record  # noqa: E402

CAT = ROOT / "knowledge"


class ColorVariationTests(unittest.TestCase):
    def test_color_round_trip(self):
        for value in ("#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#7C6CF2"):
            output, _ = oklch_to_hex(*hex_to_oklch(value))
            self.assertLess(delta_oklab(value, output), 0.002, value)

    def test_sets_and_same_lightness(self):
        catalog = json.loads((CAT / "color-variations.json").read_text())
        profiles = json.loads((CAT / "web-style-profiles.json").read_text())["profiles"]
        sets = {row["id"]: row for row in catalog["sets"]}
        self.assertEqual({"site:" + row["id"] for row in profiles}, {key for key in sets if key.startswith("site:")})
        self.assertEqual(3, sum(key.startswith("threads:") for key in sets))
        for row in sets.values():
            seed_l, _, seed_h = hex_to_oklch(row["seed"])
            variants = {v["id"]: v for v in row["variants"]}
            for variant in variants.values():
                self.assertRegex(variant["hex"], r"^#[0-9A-F]{6}$")
                self.assertAlmostEqual(contrast_ratio(variant["hex"], row["background"]), variant["contrastOnBackground"], delta=0.011)
                if variant["id"].startswith("equal-lightness") or variant["id"] in ("analogous-left", "analogous-right", "complement"):
                    self.assertLess(abs(hex_to_oklch(variant["hex"])[0] - seed_l), 0.003)
            if "complement" in variants:
                desired = (seed_h + 180) % 360
                actual = hex_to_oklch(variants["complement"]["hex"])[2]
                self.assertLess(abs((actual - desired + 180) % 360 - 180), 3)
            for gradient in row["gradients"]:
                self.assertEqual(foreground_for(gradient["colors"]), gradient["foreground"])
                self.assertEqual(len(gradient["stops"]), len(gradient["colors"]))
                self.assertTrue(all(re.fullmatch(r"#[0-9A-F]{6}", color) for color in gradient["colors"]))

    def test_style_families_partition_sources(self):
        families = json.loads((CAT / "style-families.json").read_text())["families"]
        sites = [site for family in families for site in family["members"]]
        self.assertEqual(30, len(sites))
        self.assertEqual(30, len(set(sites)))
        self.assertTrue(all(family["representative"] in family["members"] for family in families))

    def test_mobile_screens_have_traceable_sources_and_roles(self):
        rows = json.loads((CAT / "mobile-app-observations.json").read_text())["screens"]
        sets = {row["id"] for row in json.loads((CAT / "color-variations.json").read_text())["sets"]}
        graph = json.loads((CAT / "color-knowledge-graph.json").read_text())
        node_ids = {node["id"] for node in graph["nodes"]}
        self.assertEqual(sum(len(row["components"]) for row in rows), sum(node["kind"] == "mobile_component" for node in graph["nodes"]))
        self.assertEqual(21, len(rows))
        self.assertEqual(21, len({row["id"] for row in rows}))
        self.assertEqual(10, sum(row["platform"] == "iOS 27" for row in rows))
        self.assertEqual(11, sum(row["platform"] == "One UI 9" for row in rows))
        for row in rows:
            self.assertTrue(row["sourcePage"].startswith("https://"))
            self.assertNotIn("image", row)
            self.assertNotIn("sourceImage", row)
            iw, ih = row["imageSize"]
            fx, fy, fw, fh = row["frame"]
            self.assertTrue(0 <= fx < fx + fw <= iw)
            self.assertTrue(0 <= fy < fy + fh <= ih)
            for region in row["regions"]:
                x, y, w, h = region["box"]
                self.assertTrue(fx <= x < x + w <= fx + fw, (row["id"], region["id"]))
                self.assertTrue(fy <= y < y + h <= fy + fh, (row["id"], region["id"]))
            self.assertTrue(row["purpose"] and row["hierarchy"] and row["components"])
            self.assertTrue(row["screenFamily"])
            if row.get("fullAnalysisScreenId"):
                self.assertTrue(all(component.get("sourceNodeId") and component.get("catalogMapping") for component in row["components"]))
            self.assertIn("mobile-screen:" + row["id"], node_ids)
            if row["seed"]:
                self.assertEqual("ui-accent", row["seed"]["role"])
                self.assertIn("mobile:" + row["id"], sets)
            else:
                self.assertNotIn("mobile:" + row["id"], sets)

    def test_shared_mobile_values_have_independent_samples(self):
        common = json.loads((CAT / "mobile-common-values.json").read_text())
        screens = {row["id"]: row for row in json.loads((CAT / "mobile-app-observations.json").read_text())["screens"]}
        self.assertEqual(len(screens), common["sourceScreens"])
        for candidate in common["candidates"]:
            samples = candidate["samples"]
            self.assertGreaterEqual(len(samples), 3)
            self.assertEqual(len(samples), candidate["sampleCount"])
            self.assertEqual(len({screens[sample["screen"]]["app"] for sample in samples}), candidate["independentAppCount"])
            self.assertGreaterEqual(candidate["independentAppCount"], 2)
            self.assertEqual([min(sample["reference400"] for sample in samples), max(sample["reference400"] for sample in samples)], candidate["rangeReference400"])

    def test_backdrop_analysis_is_complete_without_invented_effect_values(self):
        catalog = json.loads((CAT / "mobile-backdrop-observations.json").read_text())
        screens = json.loads((CAT / "mobile-app-observations.json").read_text())["screens"]
        graph = json.loads((CAT / "color-knowledge-graph.json").read_text())
        self.assertEqual([], check_catalog(catalog))
        self.assertEqual({row["id"] for row in screens}, {row["screenId"] for row in catalog["screens"]})
        self.assertEqual(len(screens), sum(node["kind"] == "background_analysis" for node in graph["nodes"]))
        self.assertEqual(sum(len(row["layers"]) for row in catalog["screens"]), sum(node["kind"] == "visual_layer" for node in graph["nodes"]))
        for row in catalog["screens"]:
            self.assertEqual("screen", row["layers"][0]["id"])
            self.assertIsNone(row["layers"][0]["parentId"])
            self.assertEqual("canvas", row["layers"][0]["depthBand"])
            for layer in row["layers"]:
                expected_shadow = "raster-observed" if row["screenId"] == "oneui9-settings-home" and layer["id"] == "search" else "not-measured"
                self.assertEqual(expected_shadow, layer["effects"]["shadow"]["status"])
                self.assertEqual("not-measured", layer["effects"]["blur"]["status"])
            self.assertEqual(8, row["edgeClues"]["sampleCount"])
            original = next(screen for screen in screens if screen["id"] == row["screenId"])
            roles = {item["role"] for item in original["colors"]}
            recorded = {layer["base"].get("sourceRole") for layer in row["layers"] if layer["base"].get("sourceRole")}
            recorded.update(accent["role"] for layer in row["layers"] for accent in layer["accentColors"])
            recorded.update(item["role"] for item in row["unassignedColorSamples"])
            self.assertEqual(roles, recorded, row["screenId"])
        broken = dict(catalog["screens"][0])
        broken["layers"] = [{**broken["layers"][0], "parentId":"missing"}]
        self.assertTrue(any("missing parent" in issue for issue in check_record(broken)))
        invented = dict(catalog["screens"][0])
        invented["layers"] = [{**invented["layers"][0], "effects": {**invented["layers"][0]["effects"], "blur":{"status":"not-measured", "note":"unknown", "radius":18}}}, *invented["layers"][1:]]
        self.assertTrue(any("unverified numeric" in issue for issue in check_record(invented)))
        settings = next(row for row in catalog["screens"] if row["screenId"] == "oneui9-settings-home")
        layers = {layer["id"]:layer for layer in settings["layers"]}
        self.assertEqual("#F3EFEE", layers["screen"]["base"]["color"])
        self.assertEqual("#FFFFFF", layers["settings-list"]["base"]["color"])
        self.assertEqual("#4222C3", layers["title"]["accentColors"][0]["hex"])
        self.assertEqual("transparent/inherited", layers["title"]["base"]["kind"])
        self.assertEqual("feature", layers["care-icon"]["parentId"])
        self.assertEqual("settings-list", layers["connection-icon"]["parentId"])
        self.assertNotEqual(layers["connection-icon"]["base"]["color"], layers["settings-list"]["base"]["color"])
        self.assertEqual("floating", layers["search"]["depthBand"])
        self.assertIn({"above":"search","below":"settings-list","status":"visual-observed","evidence":"원본 캡처의 겹침"}, settings["occlusionRelations"])


if __name__ == "__main__":
    unittest.main()
