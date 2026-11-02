"""Meaningful regressions for the production design-system graph checker."""

import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("check_design_system", ROOT / "scripts/check_design_system.py")
CHECKER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECKER)
EXAMPLE = json.loads((ROOT / "assets/design-system-production-example.json").read_text(encoding="utf-8"))


class DesignSystemCheckerTest(unittest.TestCase):
    def test_valid_two_theme_manifest(self):
        result = CHECKER.audit(EXAMPLE)
        self.assertEqual(result["status"], "PASS", result)

    def test_missing_theme_and_unknown_component_are_errors(self):
        data = copy.deepcopy(EXAMPLE)
        del data["tokens"]["canvas.background"]["refs"]["dark"]
        data["surfaces"][0]["instances"].append({"id": "ghost", "component": "missing"})
        codes = {row["code"] for row in CHECKER.audit(data)["errors"]}
        self.assertIn("MISSING_THEME_REF", codes)
        self.assertIn("UNKNOWN_COMPONENT", codes)

    def test_cycle_and_type_mismatch(self):
        data = copy.deepcopy(EXAMPLE)
        data["tokens"]["canvas.background"]["refs"]["light"] = "canvas.foreground"
        data["tokens"]["canvas.foreground"]["refs"]["light"] = "canvas.background"
        data["tokens"]["button.primary.inset"]["ref"] = "action.background"
        codes = {row["code"] for row in CHECKER.audit(data)["errors"]}
        self.assertIn("ALIAS_CYCLE", codes)
        self.assertIn("TYPE_MISMATCH", codes)

    def test_cross_theme_edges_do_not_form_false_cycle(self):
        data = copy.deepcopy(EXAMPLE)
        data["tokens"]["canvas.background"]["refs"]["light"] = "canvas.foreground"
        data["tokens"]["canvas.foreground"]["refs"]["dark"] = "canvas.background"
        codes = {row["code"] for row in CHECKER.audit(data)["errors"]}
        self.assertNotIn("ALIAS_CYCLE", codes)

    def test_primitive_change_reaches_component_and_screen(self):
        old = copy.deepcopy(EXAMPLE)
        new = copy.deepcopy(EXAMPLE)
        new["tokens"]["color.blue.600"]["value"] = "#2459C0"
        delta = CHECKER.changes(old, new)
        impact = CHECKER.affected(new, delta["changed"])
        self.assertEqual(delta["changed"], ["color.blue.600"])
        self.assertIn("button", impact["components"])
        self.assertIn("search", impact["surfaces"])

    def test_direct_primitive_is_warning(self):
        data = copy.deepcopy(EXAMPLE)
        data["tokens"]["button.primary.background"]["ref"] = "color.blue.600"
        result = CHECKER.audit(data)
        self.assertEqual(result["status"], "WARN")
        self.assertIn("DIRECT_PRIMITIVE", {row["code"] for row in result["warnings"]})

    def test_unpaired_component_colors_are_warning(self):
        data = copy.deepcopy(EXAMPLE)
        data["contrastPairs"] = data["contrastPairs"][:1]
        result = CHECKER.audit(data)
        self.assertIn("UNPAIRED_COLOR_ROLE", {row["code"] for row in result["warnings"]})


if __name__ == "__main__":
    unittest.main()
