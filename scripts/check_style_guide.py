#!/usr/bin/env python3
"""Check A–L style-guide evidence structure; a PASS is not visual approval."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "references" / "style-book"
SECTIONS = "ABCDEFGHIJKL"
COMPONENTS = [
    "앱바", "뒤로", "아이콘 버튼", "주 버튼", "보조 버튼", "글자 버튼", "떠 있는 버튼",
    "세그먼트", "칩", "입력", "검색", "목록 행", "서브헤더", "묶음", "카드", "구분선",
    "스위치", "체크", "라디오", "슬라이더", "재생 위치", "음량", "미디어 버튼",
    "진행", "대화상자", "바텀 시트", "팝업 메뉴", "토스트", "스낵바", "탭",
    "아래 내비", "상태 표시", "빈 상태", "오류 상태", "이미지", "포스터",
]
GRADE_RE = re.compile(r"공식|실측|관찰|파생|제안|미확인|추정|설계 가설|guess")
URL_RE = re.compile(r"https?://\S+")
DETAILS = json.loads((BOOK / "detail-decisions.json").read_text(encoding="utf-8"))
ESTIMATES = json.loads((BOOK / "provisional-estimates.json").read_text(encoding="utf-8"))["records"]
EXPRESSIONS = json.loads((BOOK / "component-expression.json").read_text(encoding="utf-8"))["styles"]


def section(body: str, letter: str) -> str:
    found = re.search(rf"(?m)^## {letter}\.\s+.*$", body)
    if not found:
        return ""
    next_section = re.search(r"(?m)^## [A-L]\.\s+", body[found.end():])
    end = found.end() + next_section.start() if next_section else len(body)
    return body[found.end():end].strip()


def check(path: Path, strict: bool) -> tuple[list[str], list[str]]:
    body = path.read_text(encoding="utf-8")
    errors: list[str] = []
    warnings: list[str] = []
    for letter in SECTIONS:
        if not section(body, letter):
            errors.append(f"{letter} section missing/empty")
    a, b, c, d, e, j, k, l = [section(body, x) for x in "ABCDeJKL".upper()]
    for item in ("분류", "대상 버전", "확인일"):
        if item not in a:
            errors.append(f"A: {item} missing")
    if not URL_RE.search(b):
        if "사용자 지정 스타일" in b and "guess" in b:
            warnings.append("B: user-named style has no source image or URL; all visual decisions remain guess")
        else:
            errors.append("B: source URL missing")
    if "확인일" not in b:
        errors.append("B: source check date missing")
    if not GRADE_RE.search(c):
        errors.append("C: provenance grade missing")
    if "라이트" not in c or "다크" not in c:
        errors.append("C: light/dark pair missing")
    for row in c.splitlines():
        if not row.startswith("|") or re.match(r"\|\s*:?-{3,}", row):
            continue
        cells = [x.strip() for x in row.strip("|").split("|")]
        if not cells or cells[0] in {"이름", "항목", "역할", "토큰", "Token"}:
            continue
        if len(cells) < 7:
            errors.append(f"C: value row needs seven fields: {cells[0]}")
            continue
        if not GRADE_RE.search(cells[4]):
            errors.append(f"C: provenance grade absent: {cells[0]}")
        if not cells[5]:
            errors.append(f"C: source/position absent: {cells[0]}")
        if not re.search(r"\d{4}-\d\d-\d\d", cells[6]):
            errors.append(f"C: check date absent: {cells[0]}")
    if "폰" not in d or not ("폴드" in d or "태블릿" in d):
        errors.append("D: phone and fold/tablet missing")
    missing = [name for name in COMPONENTS if name not in e and not (name in {"빈 상태", "오류 상태"} and "빈/오류 상태" in e)]
    if missing:
        errors.append("E: components missing: " + ", ".join(missing))
    detail = DETAILS.get(path.stem)
    expression = EXPRESSIONS.get(path.stem)
    if expression:
        if "### E.2. 컴포넌트별 형태·상태·모션 변환" not in e:
            errors.append("E.2: component expression table missing")
        for key in ("principle", "action", "input", "selection", "content", "motion"):
            if expression.get(key, "") not in e:
                errors.append(f"E.2: {key} decision not synchronized with guide")
        if "설계 가설" not in e or "원본 일치" not in e:
            errors.append("E.2: inference grade and original-comparison boundary missing")
    if detail is None:
        errors.append("E.1: style detail decision missing")
    else:
        if "## E.1. 글꼴·아이콘·슬라이더 결정" not in body:
            errors.append("E.1: font/icon/slider contract missing")
        for key in ("font", "icon", "scrub", "volume", "grade", "source", "iconForm", "sliderForm"):
            if not detail.get(key):
                errors.append(f"E.1: {key} decision missing")
        for value in (detail.get("font"), detail.get("icon"), detail.get("scrub"), detail.get("volume")):
            if value and value not in e:
                errors.append("E.1: detail decision not synchronized with guide")
    component_rows = [line for line in e.splitlines() if line.startswith("|") and not re.match(r"\|\s*:?-{3,}", line)]
    if len(component_rows) < 25:
        warnings.append(f"E: only {max(0, len(component_rows)-1)} component rows; grouped entries need instance-level contracts before production use")
    data_rows = [line for line in component_rows if not line.startswith("| 컴포넌트") and not line.startswith("| 부품")]
    if data_rows and sum("미확인" in line for line in data_rows) / len(data_rows) > 0.75:
        warnings.append("E: more than 75% of component rows contain unknowns; use as a research map, not a finished implementation guide")
    if "48" not in j or "14" not in j:
        errors.append("J: 48px/dp target and 14px/sp type override missing")
    if not ("미확인" in body or "없음" in k):
        errors.append("K: unknown status missing")
    provisional = [row for row in ESTIMATES if row["style"] == path.stem]
    if "### K.1 임시 추정값 적용표" not in k or len(provisional) != 5:
        errors.append("K.1: five provisional visual decisions missing")
    for row in provisional:
        for field in ("value", "grade", "basis", "method", "confidence", "qa", "replace_when", "checked_on"):
            if not row.get(field):
                errors.append(f"K.1: {row['key']} {field} missing")
        if row["value"] not in k:
            errors.append(f"K.1: {row['key']} not synchronized with guide")
        if row["status"] == "재검증 필요":
            errors.append(f"K.1: {row['key']} changed but same-task render QA is pending")
        if row["grade"] in ("추정", "설계 가설") and not row["qa"].endswith("PASS"):
            errors.append(f"K.1: {row['key']} has no passing geometry check")
    if not any(x in l for x in ("PASS", "FAIL", "NOT_RUN")):
        errors.append("L: measurement result status missing")
    if not re.search(r"(?:\.html|\.png|\.webp|\.json)", l):
        warnings.append("L: render or measurement path missing")
    if "NOT_RUN" in l:
        warnings.append("L: validation not run")
    if path.name not in {"oneui-9.md", "material-3-expressive.md", "ios-27.md", "skeuo-audio-hifi.md"}:
        sources = len(re.findall(r"https?://", b))
        if sources < 3:
            warnings.append(f"B: only {sources} example/source URL(s); three real services required before production use")
    if strict and warnings:
        errors.extend(warnings)
        warnings = []
    return errors, warnings


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("paths", nargs="*", type=Path)
    p.add_argument("--strict", action="store_true", help="also fail on unvalidated renders and source gaps")
    args = p.parse_args()
    paths = args.paths or sorted(x for x in BOOK.glob("*.md") if x.name != "README.md")
    failed = 0
    for path in paths:
        errors, warnings = check(path, args.strict)
        failed += bool(errors)
        print(f"{'FAIL' if errors else 'PASS'} {path.name}: {len(errors)} error(s), {len(warnings)} warning(s)")
        for item in errors:
            print("  ERROR", item)
        for item in warnings:
            print("  WARN ", item)
    print(f"checked {len(paths)} guide(s), failed {failed}; structural PASS is not visual quality PASS")
    return int(bool(failed))


if __name__ == "__main__":
    raise SystemExit(main())
