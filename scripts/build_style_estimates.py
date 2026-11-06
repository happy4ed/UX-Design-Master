#!/usr/bin/env python3
"""Record provisional visual decisions without promoting them to source facts."""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "references" / "style-book"
AUDIT = ROOT / "samples" / "style-book-audit.json"
OUTPUT = BOOK / "provisional-estimates.json"
ANCHORS = {
    ("oneui-9", "scrubTrack"): ("관찰", "oneui-9.md E: 미디어 재생 위치 트랙 약 2dp", "동일 부품의 해당 버전 관찰값; px 시연은 1:1 가정", "중간"),
    ("oneui-9", "scrubThumb"): ("관찰", "oneui-9.md E: 미디어 재생 위치 링 썸 약 16dp", "동일 부품의 해당 버전 관찰값; px 시연은 1:1 가정", "중간"),
    ("oneui-9", "volumeTrack"): ("추정", "oneui-9.md E: 미디어 출력 음량 막대 약 18dp", "미디어 출력의 같은 역할을 기준 화면 수평 음량에 임시 적용; 일반 설정 슬라이더로 일반화 금지", "낮음"),
    ("material-3-expressive", "scrubTrack"): ("공식", "material-3-expressive.md E: Compose SliderTokens 16dp", "기준 화면 재생 위치에 공식 일반 Slider 트랙을 시연 적용", "높음"),
    ("material-3-expressive", "scrubThumb"): ("공식", "material-3-expressive.md E: Compose SliderTokens 손잡이 폭 4dp", "기준 화면 재생 위치에 공식 일반 Slider 손잡이를 시연 적용", "높음"),
    ("material-3-expressive", "volumeTrack"): ("추정", "material-3-expressive.md E: Compose SliderTokens 16dp", "전용 음량 토큰 미확인; 같은 플랫폼의 일반 Slider를 임시 매핑", "낮음"),
    ("ios-27", "scrubTrack"): ("관찰", "ios-27.md E: Music 재생 위치 7pt 캡슐", "같은 미디어 역할의 전달 실측 요약값을 시연에 적용", "중간"),
    ("ios-27", "volumeTrack"): ("관찰", "ios-27.md E: Music 음량 7pt 캡슐", "오디오 음량은 플랫폼 volume view 역할로 처리; 외형만 시연", "중간"),
}
KEYS = {
    "fontFamily": ("글꼴 대체", "family"),
    "iconForm": ("시연 아이콘 형상", "form"),
    "scrubTrack": ("재생 위치 트랙", "px"),
    "scrubThumb": ("재생 위치 손잡이 폭", "px"),
    "volumeTrack": ("음량 트랙", "px"),
}


def main() -> None:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    details = json.loads((BOOK / "detail-decisions.json").read_text(encoding="utf-8"))
    if audit["status"] != "PASS":
        raise SystemExit("reference render audit must pass before registering candidates")
    prior = {}
    if OUTPUT.exists():
        prior = {(row["style"], row["key"]): row for row in json.loads(OUTPUT.read_text(encoding="utf-8")).get("records", [])}
    records = []
    for style, detail in details.items():
        four = [x for x in audit["records"] if x["style"] == detail["preview"]]
        if len(four) != 4:
            raise SystemExit(f"{style}: expected four render states")
        sample = next(x for x in four if x["layout"] == "phone" and x["scheme"] == "dark")
        geometry_pass = all(not (x["badTargets"] or x["smallControlText"] or x.get("smallVisibleText") or x["overflow"]) for x in four)
        for key, (label, unit) in KEYS.items():
            value = sample["detail"][key]
            anchor = ANCHORS.get((style, key))
            if anchor:
                grade, basis, method, confidence = anchor
            else:
                grade, basis, method, confidence = (
                    "설계 가설",
                    f"detail-decisions.json {style}.{key}; style-book-audit.json {detail['preview']} 4상태",
                    "같은 스타일의 기존 내부 가안에서 역할별 계산 스타일을 읽고 폰/폴드·라이트/다크의 기능형으로 시험",
                    "낮음",
                )
            if key == "scrubThumb" and style == "ios-27":
                method += "; 1px은 실제 보이는 썸 크기가 아니라 CSS에서 썸을 숨기는 시연 구현값"
            number = int(value[:-2]) if unit == "px" and value.endswith("px") else None
            uncertainty = None if number is None or grade == "공식" else [max(1, round(number * 0.8)), max(1, round(number * 1.2))]
            candidate = {
                "style": style, "key": key, "label": label, "scope": "기준 화면·폰/폴드·라이트/다크; 원본 플랫폼 확정값 아님",
                "value": value, "unit": unit, "range": uncertainty, "grade": grade, "confidence": confidence,
                "basis": basis, "method": method, "qa": "4상태 DOM_GEOMETRY_PASS" if geometry_pass else "FAIL",
                "not_checked": ["원본과 동일 화면 비교", "실기기 대비·광학 정렬", "모든 입력 상태"],
                "replace_when": "같은 버전·부품·상태의 공식 토큰 또는 원본 실측이 확보되거나 제품 검수에서 실패하면 재측정",
                "checked_on": date.today().isoformat(), "status": "활성 임시값", "history": [],
            }
            old = prior.get((style, key))
            if old and old.get("status") in ("근거로 대체됨", "재검증 필요"):
                candidate = old
            records.append(candidate)
        path = BOOK / f"{style}.md"
        body = path.read_text(encoding="utf-8")
        body = re.sub(r"\n### K\.1 임시 추정값 적용표\n.*?(?=\n## L\.)", "", body, flags=re.S)
        lines = ["\n### K.1 임시 추정값 적용표\n",
                 "원본의 미확인 사실은 K절에 남긴다. 아래 값은 기준 화면을 구현하기 위한 임시 추정/설계 가설이며 출처 원본과 일치한다는 뜻이 아니다. 새 근거가 생기면 [추정·갱신 절차](../style-estimation.md)로 교체한다.\n",
                 "| 부품/속성 | 현재 임시값 | 등급·신뢰도 | 근거·추론 | 검증·교체 조건 |",
                 "|---|---|---|---|---|"]
        for row in records[-len(KEYS):]:
            lines.append(f"| {row['label']} | {row['value']} | {row['grade']}·{row['confidence']} ({row['status']}) | {row['basis']}; {row['method']} | {row['qa']}; 새 원본/공식값 확보 시 교체 |")
        if "\n## L." not in body:
            raise SystemExit(f"{style}: L section missing")
        path.write_text(body.replace("\n## L.", "\n".join(lines) + "\n\n## L.", 1), encoding="utf-8")
    OUTPUT.write_text(json.dumps({"schema": 1, "meaning": "provisional implementation values; not source fidelity", "generated_from": ["references/style-book/detail-decisions.json", "samples/style-book-audit.json"], "records": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(records)} provisional records for {len(details)} styles; {OUTPUT}")


if __name__ == "__main__":
    main()
