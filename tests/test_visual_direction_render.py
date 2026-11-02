"""Regression for the four visual-direction failures from the C evaluation."""

import asyncio
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/check_visual_direction_render.py"
spec = importlib.util.spec_from_file_location("check_visual_direction_render", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


async def main():
    url = (ROOT / "tests/fixtures/visual-direction-fail.html").as_uri()
    selectors = {"button": ".primary", "row": ".row", "section": ".section", "primaryNav": ".nav", "secondary": ".sort", "selected": [".selected-a", ".selected-b"], "appbar": ".appbar"}
    report = await module.check({"directions": [
        {"id": "first", "url": url, "selectors": selectors, "appBarSeam": "none", "viewport": {"width": 900, "height": 700}},
        {"id": "second", "url": url, "selectors": selectors, "appBarSeam": "none", "viewport": {"width": 900, "height": 700}},
    ]})
    codes = {item["code"] for item in report["warnings"]}
    assert {"SECONDARY_VISUAL_WEIGHT", "SELECTION_STYLE_MISMATCH", "UNEXPECTED_DARK_BUTTON", "APPBAR_SEAM_CONFLICT", "SIZE_ONLY_OR_SAME_COMPONENT_DIRECTION"} <= codes, codes
    print("visual direction render checker: five required failure signals detected")


if __name__ == "__main__":
    asyncio.run(main())
