#!/usr/bin/env python3
"""Keep the guidebook and its two live sample pages on the same style registry."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "samples"
BOOK = ROOT / "references/style-book"
ADDITIONS = json.loads((BOOK / "additional-style-families.json").read_text(encoding="utf-8"))["styles"]
DETAILS = json.loads((BOOK / "detail-decisions.json").read_text(encoding="utf-8"))
NAMES = {
    "oneui-9": "One UI 9", "material-3-expressive": "Material 3 Expressive",
    "ios-27": "iOS 27", "skeuo-audio-hifi": "오디오 하이파이",
    "glassmorphism": "글래스모피즘", "neumorphism": "뉴모피즘",
    "claymorphism": "클레이모피즘", "flat-2": "플랫 2.0",
    "neo-brutalism": "네오브루탈리즘", "bauhaus-swiss": "바우하우스·스위스",
    "memphis": "멤피스", "y2k-chrome": "Y2K 크롬",
    "maximalism": "맥시멀리즘", "editorial-print": "에디토리얼",
    "minimalism": "미니멀리즘", "dark-cinematic": "시네마틱 다크",
    "aurora-mesh": "오로라 메쉬", "frutiger-aero": "프루티거 에어로",
    "origami-paper": "오리가미 종이",
    **{style: item["name"] for style, item in ADDITIONS.items()},
}
MOTION_TYPES = {
    "oneui-9": "oneui", "material-3-expressive": "material", "ios-27": "ios",
    "skeuo-audio-hifi": "hifi", "glassmorphism": "glass",
    "neumorphism": "neumo", "claymorphism": "clay", "flat-2": "flat",
    "neo-brutalism": "brutal", "bauhaus-swiss": "grid", "memphis": "hop",
    "y2k-chrome": "shine", "maximalism": "accent",
    "editorial-print": "editorial", "minimalism": "fade",
    "dark-cinematic": "cinema", "aurora-mesh": "aurora",
    "frutiger-aero": "float", "origami-paper": "fold",
    **{style: item["motionType"] for style, item in ADDITIONS.items()},
}
assert len(DETAILS) == len(NAMES) == len(MOTION_TYPES), "style registry mismatch"


def change(filename: str, fn) -> None:
    path = SAMPLES / filename
    old = path.read_text(encoding="utf-8")
    new = fn(old)
    if old != new:
        path.write_text(new, encoding="utf-8")


def replace_const(html: str, name: str, value: object) -> str:
    token = f"const {name}=" + json.dumps(value, ensure_ascii=False, separators=(",", ":")) + ";"
    out, count = re.subn(rf"const {name}=(?:\[[^;]*\]|\{{[^;]*\}});", lambda _: token, html, count=1)
    assert count == 1, f"missing {name}"
    return out


def add_css(html: str) -> str:
    for filename in ("style-book-additional-tokens.css", "style-book-additional-effects.css"):
        link = f'<link rel="stylesheet" href="{filename}">'
        if link not in html:
            html = html.replace("</head>", link + "</head>", 1)
    return html


def guide(html: str) -> str:
    entries = [[style, NAMES[style], "플랫폼" if n < 3 else "실물" if n == 3 else "자유"] for n, style in enumerate(DETAILS)]
    html = replace_const(html, "names", entries)
    return html.replace("19개 스타일의 원문", f"{len(DETAILS)}개 스타일의 원문")


def board(html: str) -> str:
    html = replace_const(html, "names", NAMES)
    html = html.replace("19개 스타일에 적용합니다", f"{len(DETAILS)}개 스타일에 적용합니다")
    return add_css(html)


def reference(html: str) -> str:
    existing_notes = {
        "oneui": "전달 실측+캐논 · 미확인 부품은 가안",
        "material": "Compose 토큰을 기준으로 한 가안",
        "ios": "키트 전달값+공식 HIG · 미확인 상태는 가안",
        "hifi": "실물 구조 관찰+디지털 제안",
    }
    entries = [[d["preview"], NAMES[style], existing_notes.get(d["preview"], "자유 스타일 · guess 가안")]
               for style, d in DETAILS.items()]
    html = replace_const(html, "variants", entries)
    return add_css(html)


def motions(html: str) -> str:
    html = replace_const(html, "typeMap", MOTION_TYPES)
    html = html.replace("19개 스타일 · 추론", f"{len(DETAILS)}개 스타일 · 추론")
    return html


def readiness(html: str) -> str:
    styles = " ".join(sorted(DETAILS))
    html, count = re.subn(r"const ids='[^']*'\.split\(' '\);", f"const ids='{styles}'.split(' ');", html, count=1)
    assert count == 1, "readiness style list missing"
    return html.replace("19개 모두 A~L", f"{len(DETAILS)}개 모두 A~L").replace("#{2,3]", "#{2,3}")


change("style-guidebook.html", guide)
change("style-book-component-board.html", board)
change("style-book-reference-screen.html", reference)
change("style-guess-books.html", motions)
change("style-readiness-audit.html", readiness)
print(f"linked {len(DETAILS)} guide styles to component and motion samples")
