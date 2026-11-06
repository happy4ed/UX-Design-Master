#!/usr/bin/env python3
"""Keep font/icon/slider contracts in guides and file:// preview data in sync."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "references" / "style-book"
DATA = BOOK / "detail-decisions.json"
JS = BOOK / "detail-decisions.js"


def main() -> None:
    details = json.loads(DATA.read_text(encoding="utf-8"))
    for style, item in details.items():
        path = BOOK / f"{style}.md"
        if not path.is_file():
            raise SystemExit(f"missing guide: {path}")
        body = path.read_text(encoding="utf-8")
        if "## E.1. 글꼴·아이콘·슬라이더 결정" in body:
            body = re.sub(r"\n## E\.1\. 글꼴·아이콘·슬라이더 결정\n.*?(?=\n## F\.)", "", body, flags=re.S)
        rows = [("글꼴", item["font"]), ("아이콘", item["icon"]), ("재생 위치", item["scrub"]), ("음량", item["volume"])]
        table = "\n## E.1. 글꼴·아이콘·슬라이더 결정\n\n"
        table += "이 표는 컴포넌트별 구분이 누락되지 않도록 한 적용 계약이다. `제안`은 시연용 방향이며 원본 재현값이 아니다. 폰/폴드와 라이트/다크에서 각 부품의 기본·누름·포커스·끌기 상태를 따로 확인한다.\n\n"
        table += "| 부품 | 형태·사용 규칙 | 근거 등급 | 상세 근거 |\n|---|---|---|---|\n"
        for name, value in rows:
            table += f"| {name} | {value} | {item['grade']} | {item['source']} |\n"
        table += "\n시연 SVG·CSS의 실제 속성은 [기준 화면](../../samples/style-book-reference-screen.html)에서 확인한다. 근거 없는 시연값은 이 가이드의 원본값으로 승격하지 않는다.\n"
        if "\n## F." not in body:
            raise SystemExit(f"F section missing: {path}")
        body = body.replace("\n## F.", table + "\n## F.", 1)
        path.write_text(body, encoding="utf-8")
    JS.write_text("window.STYLE_DETAILS = " + json.dumps(details, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"synced {len(details)} guides and {JS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
