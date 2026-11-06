#!/usr/bin/env python3
"""Keep each style guide's component-expression contract in sync with the preview."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "references/style-book"
DATA = json.loads((BOOK / "component-expression.json").read_text())
LABELS = [
    ("principle", "형태 원리"),
    ("action", "행동·눌림"),
    ("input", "입력"),
    ("selection", "선택·해제"),
    ("content", "목록·카드·덮개"),
    ("motion", "모션 느낌"),
]


def section(style: str, values: dict[str, str]) -> str:
    evidence = DATA["source_evidence"][style]
    rows = "\n".join(
        f"| {label} | {values[key]} | 설계 가설 | B·E절의 관찰/제안을 기능별로 변환; 원본 부품·동작 직접 실측 전 |"
        for key, label in LABELS
    )
    return (
        "\n### E.2. 컴포넌트별 형태·상태·모션 변환\n\n"
        "색 토큰만 바꿔 스타일을 적용했다고 판정하지 않는다. 아래는 "
        "[시연용 변환표](component-expression.json)의 기능형 **설계 가설**이다. "
        "원본 사례 B절에서 확인된 성격과 E절의 부품 제안을 분리한다. "
        "실제 원본 부품의 형상·누름·선택·모션을 확인하기 전에는 원본 일치로 쓰지 않는다. "
        "같은 콘텐츠로 [13개 역할 보드](../../samples/style-book-component-board.html)에서 확인한다.\n\n"
        f"**원본 관찰 범위:** B절 {evidence['ids']} — {evidence['observed']}. "
        f"**원본에서 아직 측정하지 못한 것:** {evidence['missing']}. "
        "내부 [컴포넌트 계산 스타일·렌더 측정](../../samples/style-book-component-expression-audit.json)은 원본 실측이 아니다.\n\n"
        "| 층 | 현재 시연 규칙 | 등급 | 근거·남은 측정 |\n"
        "|---|---|---|---|\n"
        f"{rows}\n\n"
        "검증: 폰/폴드 × 라이트/다크에서 기본·선택·눌림·포커스와 읽기 대비를 "
        "실제 렌더로 확인한다. 새 원본 화면·동영상이 확보되면 같은 역할·상태에서 치수와 "
        "움직임을 측정하여 이 가설과 차이를 기록한다.\n"
    )


def main() -> None:
    for style, values in DATA["styles"].items():
        path = BOOK / f"{style}.md"
        body = path.read_text()
        body = re.sub(r"\n### E\.2\.[\s\S]*?(?=\n## F\.)", "", body)
        marker = re.search(r"\n## F\. [^\n]+", body)
        assert marker, path
        body = body[: marker.start()] + section(style, values) + body[marker.start() :]
        path.write_text(body)
    print(f"Synced E.2 in {len(DATA['styles'])} style guides")


if __name__ == "__main__":
    main()
