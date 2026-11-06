#!/usr/bin/env python3
"""Check provisional values, source grades and later evidence replacement."""

from __future__ import annotations

import copy
import json
import sys
import tempfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from reconcile_style_estimate import revise  # noqa: E402


def main() -> None:
    registry = json.loads((ROOT / "references/style-book/provisional-estimates.json").read_text())
    rows = registry["records"]
    assert len(rows) == 95
    assert set(Counter(x["style"] for x in rows).values()) == {5}
    for row in rows:
        assert row["value"] and row["basis"] and row["method"] and row["replace_when"]
        assert row["qa"].endswith("PASS")
        assert row["grade"] in ("공식", "실측", "관찰", "추정", "설계 가설")
        guide = (ROOT / "references/style-book" / f"{row['style']}.md").read_text()
        assert "### K.1 임시 추정값 적용표" in guide
        assert row["value"] in guide
    assert next(x for x in rows if x["style"] == "oneui-9" and x["key"] == "volumeTrack")["grade"] == "추정"
    assert next(x for x in rows if x["style"] == "material-3-expressive" and x["key"] == "scrubTrack")["grade"] == "공식"
    trial = copy.deepcopy(registry)
    changed = revise(trial, "oneui-9", "volumeTrack", value="20px", grade="실측",
                     basis="same-version media output screenshot x=100..120", today="2026-11-05")
    assert changed["status"] == "재검증 필요" and len(changed["history"]) == 1
    with tempfile.NamedTemporaryFile() as evidence:
        confirmed = revise(trial, "oneui-9", "volumeTrack", qa_evidence=evidence.name, today="2026-11-05")
    assert confirmed["status"] == "근거로 대체됨" and len(confirmed["history"]) == 2
    assert confirmed["value"] == "20px" and confirmed["history"][0]["value"] == "18px"
    print("PASS 95 provisional records; evidence replacement preserves history and requires QA")


if __name__ == "__main__":
    main()
