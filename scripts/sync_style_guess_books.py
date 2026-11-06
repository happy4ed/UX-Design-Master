#!/usr/bin/env python3
"""Add explicit, replaceable guess books to every built-in style guide."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "references/style-book"
PROFILES = json.loads((BOOK / "guess-presets.json").read_text(encoding="utf-8"))["styles"]
DETAILS = json.loads((BOOK / "detail-decisions.json").read_text(encoding="utf-8"))
CORE_CSS = (ROOT / "samples/style-book-core.css").read_text(encoding="utf-8") + "\n" + (ROOT / "samples/style-book-additional-tokens.css").read_text(encoding="utf-8")
CONFIRMED = json.loads((BOOK / "confirmed-style-values.json").read_text(encoding="utf-8"))["styles"]

COMPONENTS = [
    ("앱바·탐색", "principle", "화면 제목·목적지·현재 위치"),
    ("주·보조 버튼", "control", "기본·누름·비활성·포커스"),
    ("아이콘 버튼", "control", "아이콘 실루엣·광학 중심·48 이상 조작 영역"),
    ("검색·텍스트 입력", "field", "빈 값·포커스·오류·긴 입력"),
    ("탭·필터 칩", "selection", "현재/다른 선택, 키보드 이동"),
    ("체크·라디오·스위치", "selection", "체크/해제·선택·토글의 서로 다른 의미"),
    ("슬라이더", "selection", "트랙·채움·썸·값, 드래그/키보드"),
    ("목록 행", "content", "한 줄/두 줄/긴 값/빈 값"),
    ("카드·정보 묶음", "content", "내부 여백·제목·본문·선택"),
    ("진행·상태", "content", "0/중간/100, 색 외의 문자·기호"),
    ("대화상자", "overlay", "열기·닫기·오류·포커스 복귀"),
    ("바텀 시트", "overlay", "열기·끌기/닫기·배경 가림"),
    ("토스트·빈/오류 상태", "overlay", "피드백 노출·복구·읽을 시간"),
]
MOTIONS = [
    ("주 행동 눌림", "버튼", "탭/클릭", "떠 있거나 기본인 조작 → 눌린 조작 → 정착"),
    ("선택 상태", "탭·칩·체크", "선택 변경", "이전 선택 → 현재 선택의 형태·색·표지"),
    ("연속값 변화", "슬라이더·진행", "입력/값 변경", "이전 값 → 새 값과 수치 동기화"),
    ("임시 면 진입", "시트·대화상자", "열기/닫기", "숨김 → 앞쪽 층 → 원래 화면 복귀"),
    ("화면 전환", "탐색 화면", "앞으로/뒤로", "이전 화면 → 새 화면, 빈 프레임 없이"),
]
MOTION_TIME_SCALE = [1.0, 1.0, 1.0, 1.0, 1.0]

def override(style: str, section: str, name: str) -> dict | None:
    value = CONFIRMED.get(style, {}).get(section, {}).get(name)
    if value is None:
        return None
    assert value.get("source") and value.get("date") and value.get("sameStateEvidence") and value.get("renderUpdated") is True, (style, section, name, "measured evidence and updated render required")
    return value

def section_e(style: str, p: dict, d: dict) -> str:
    rows = "\n".join(
        f"| {name} | {role} | {override(style, 'components', name).get('value') if override(style, 'components', name) else p[key]} | "
        f"{('관찰 · ' + override(style, 'components', name)['source'] + ' · ' + override(style, 'components', name)['date']) if override(style, 'components', name) else ('`guess` — ' + p['principle'] + '에서 추론. 실제 원본 부품 발견 시 같은 상태에서 교체')} |"
        for name, key, role in COMPONENTS
    )
    return (
        "\n### E.4. 기본 컴포넌트북 — guess 구현\n\n"
        "원본에서 모든 부품을 보지 못해도 아래 규칙으로 **실제 조작 가능한 기본 레퍼런스**를 만든다. "
        "`guess`는 미구현이 아니라 현재 사용 가능한 추론안이다. 앱·웹은 같은 역할을 유지하고 문서에서는 조작을 상태·다음 행동으로 번역한다. "
        f"[작동 샘플과 모션북](../../samples/style-guess-books.html?style={style})에서 확인한다.\n\n"
        f"| 부품 | 데이터·상태 경계 | 형태/표현 규칙 | 등급·근거·교체 조건 |\n|---|---|---|---|\n{rows}\n\n"
        f"글꼴: {d['font']} · `guess` 구현에서는 실제 프로젝트 글꼴을 선택하고 글자 확대를 검수한다. "
        f"아이콘: {d['icon']} · 실루엣 중심을 박스 중심과 별도로 실측한다. "
        f"슬라이더: 재생 위치는 {d['scrub']}; 음량은 {d['volume']}. "
        "이 값 가운데 원본 관찰로 확인된 부분과 추론 부분은 E.1의 등급을 유지하고, 추론 부분에 `guess`를 붙인다.\n"
    )

def section_c(style: str, p: dict, d: dict) -> str:
    css_name = d["preview"]
    dark = re.search(rf"\.{re.escape(css_name)}\{{([^}}]+)\}}", CORE_CSS)
    light = re.search(rf"\.light \.{re.escape(css_name)}\{{([^}}]+)\}}", CORE_CSS)
    assert dark and light, style
    def values(block: str) -> dict[str, str]:
        return dict(re.findall(r"--([\w-]+):([^;]+);?", block))
    dark_values, light_values = values(dark.group(1)), values(light.group(1))
    tokens = [
        ("화면 바탕", "bg"), ("전경 글자", "fg"), ("정보 면", "surface"),
        ("조작 면", "ctrl"), ("경계", "line"), ("강조", "accent"),
        ("강조 위 글자", "on-accent"), ("카드 R", "card-r"),
        ("입력 R", "field-r"), ("버튼 R", "button-r"),
    ]
    rows_list = []
    for name, key in tokens:
        confirmed = override(style, "tokens", key)
        light_value = confirmed.get("light") if confirmed else light_values.get(key, dark_values.get(key, "상위 규칙 상속"))
        dark_value = confirmed.get("dark") if confirmed else dark_values.get(key, "상위 규칙 상속")
        grade = "관찰" if confirmed else "guess"
        source = confirmed["source"] if confirmed else f"style-book-core.css .{css_name}; {p['principle']}"
        date = confirmed["date"] if confirmed else "2026-11-05"
        rows_list.append(f"| {name} | `{light_value}` | `{dark_value}` | {'px' if key.endswith('-r') else 'CSS color/paint'} | {grade} | {source} | {date} |")
    rows = "\n".join(rows_list)
    return (
        "\n### C.1. 작동하는 기본 토큰 — guess 구현\n\n"
        "C절의 원본 미확인 칸을 구현 공백으로 남기지 않는다. 아래는 [기준 화면 CSS](../../samples/style-book-core.css)의 실제 적용값이다. "
        "공식 토큰이나 외부 원본 실측값이 아니며 화면/다크·라이트의 대비와 조작 상태를 렌더로 검토한다. "
        "제품에 복사할 고정값이 아니라 대체 가능한 기본 레퍼런스다.\n\n"
        f"| 이름 | 라이트 기준 화면 | 다크 기준 화면 | 단위 | 근거 등급 | 출처·추론 근거 | 확인일 |\n|---|---|---|---|---|---|---|\n{rows}\n"
    )

def section_k(style: str, p: dict) -> str:
    return (
        "\n### K.2. guess 교체 기록\n\n"
        f"[기본 레퍼런스](../../samples/style-guess-books.html?style={style})의 C.1 토큰·E.4 부품·G.1 모션은 `{p['principle']}`을 구현한 `guess`이다. "
        "A는 스타일 신원, B는 실제 출처만 기록하고 추론으로 출처를 꾸며내지 않는다. "
        "D/F/H/I/J는 이 기본 레퍼런스를 기기·과업·문구·접근성에 맞게 재배치·확장하는 계약이다. "
        "L의 내부 렌더 PASS는 원본 일치 판정이 아니다. 새 원본에서 같은 부품과 상태를 발견하면 "
        "원본 화면의 값·프레임을 실측 → 현재 guess와 차이 기록 → 코드와 책 수정 → 다시 렌더 검수 → 해당 항목의 `guess` 태그 제거 순으로 갱신한다.\n"
    )

def section_g(style: str, p: dict) -> str:
    rows_list = []
    for index, (name, target, trigger, start) in enumerate(MOTIONS):
        confirmed = override(style, "motions", name)
        behavior = confirmed.get("value", p["motion"]) if confirmed else p["motion"]
        duration = confirmed.get("duration", round(p["duration"] * MOTION_TIME_SCALE[index])) if confirmed else round(p["duration"] * MOTION_TIME_SCALE[index])
        easing = confirmed.get("ease", p["ease"]) if confirmed else p["ease"]
        grade = f"관찰 · {confirmed['source']} · {confirmed['date']}" if confirmed else "`guess`"
        rows_list.append(f"| {name} | {target} | {trigger} | {start} | {behavior} · {duration}ms · `{easing}` | 움직임 없이 끝 상태 즉시 표시 | {grade} · [재생](../../samples/style-guess-books.html?style={style}#motion-demo) |")
    rows = "\n".join(rows_list)
    return (
        "\n### G.1. 기본 모션북 — guess 구현\n\n"
        f"이 계열의 알려진 시각 원리 `{p['principle']}`에서 `{p['motion']}`을 추론했다. "
        "원본 동영상이 없어도 시연을 구현한다. 원본 움직임이라고 주장하지 않으며 나중에 실제 영상이 확인되면 궤적·축·중간 프레임·정착을 비교하고 `guess`를 제거하거나 수정한다.\n\n"
        "| 이름 | 대상 | 트리거 | 시작→끝 | 시간·곡선 | 모션 감소 | 등급·시연 |\n|---|---|---|---|---|---|---|\n"
        f"{rows}\n\n"
        "모든 시연은 중단·역전·반복 클릭에서 상태와 시각이 어긋나지 않아야 한다. 실제 제품의 시간은 대상 크기·맥락·기기에서 재측정하며 이 표의 값은 기본 샘플값이다.\n"
    )

def main() -> None:
    assert set(PROFILES) == set(DETAILS), "every registered style needs a guess profile"
    for style, p in PROFILES.items():
        path = BOOK / f"{style}.md"
        body = path.read_text(encoding="utf-8")
        body = re.sub(r"\n### E\.4\. 기본 컴포넌트북 — guess 구현[\s\S]*?(?=\n## F\.)", "", body)
        body = re.sub(r"\n### G\.1\. 기본 모션북 — guess 구현[\s\S]*?(?=\n## H\.)", "", body)
        body = re.sub(r"\n### C\.1\. 작동하는 기본 토큰 — guess 구현[\s\S]*?(?=\n## D\.)", "", body)
        body = re.sub(r"\n### K\.2\. guess 교체 기록[\s\S]*?(?=\n## L\.)", "", body)
        assert all(f"\n## {x}." in body for x in "CDFHKL"), path
        body = body.replace("\n## D.", section_c(style, p, DETAILS[style]) + "\n## D.", 1)
        body = body.replace("\n## F.", section_e(style, p, DETAILS[style]) + "\n## F.", 1)
        body = body.replace("\n## H.", section_g(style, p) + "\n## H.", 1)
        body = body.replace("\n## L.", section_k(style, p) + "\n## L.", 1)
        path.write_text(body, encoding="utf-8")
    print(f"Synced C.1 tokens, E.4 13 components, G.1 5 motions, K.2 revision contracts in {len(PROFILES)} guides")

if __name__ == "__main__":
    main()
