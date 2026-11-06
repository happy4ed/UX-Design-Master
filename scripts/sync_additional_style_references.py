#!/usr/bin/env python3
"""Put browser-observed style references in B and keep guesses separate."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "references/style-book"
DATA = json.loads((BOOK / "additional-style-references.json").read_text(encoding="utf-8"))
EXPRESSIONS_PATH = BOOK / "component-expression.json"
expressions = json.loads(EXPRESSIONS_PATH.read_text(encoding="utf-8"))

for style, data in DATA["styles"].items():
    path = BOOK / f"{style}.md"
    body = path.read_text(encoding="utf-8")
    rows = []
    for source in data["references"]:
        rows.append(
            f"| {source['id']} | {source['kind']} | [{source['name']}]({source['url']}) | "
            f"{source['observed']} | {source['boundary']} | {DATA['checked_on']} |"
        )
    section = (
        "## B. 근거 목록\n\n"
        "| ID | 자료 성격 | 원본 | 화면에서 확인한 특징 | 아직 확인하지 않은 것 | 확인일 |\n"
        "|---|---|---|---|---|---|\n"
        + "\n".join(rows)
        + "\n\n"
        "위 행은 원본의 **확인한 부분**만 기록한다. 나머지 토큰·컴포넌트·모션은 현재 `guess`다. "
        "외부 원본 캡처는 이 배포 스킬에 포함하지 않는다.\n\n"
        f"현재 샘플의 차이: {data['sample_gap']}\n\n"
    )
    body, count = re.subn(r"## B\. 근거 목록\n[\s\S]*?(?=## C\.)", lambda _: section, body, count=1)
    assert count == 1, style
    path.write_text(body, encoding="utf-8")
    expressions["source_evidence"][style] = {
        "ids": ", ".join(source["id"] for source in data["references"]),
        "observed": " / ".join(source["observed"] for source in data["references"]),
        "missing": "실제 CSS 값·기기별 상태·모션 중간 프레임 전수",
    }

EXPRESSIONS_PATH.write_text(json.dumps(expressions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"updated source observations for {len(DATA['styles'])} styles")
