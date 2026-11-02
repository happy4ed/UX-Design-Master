#!/usr/bin/env python3
"""Warn about missing semantic color roles and declared contrast failures."""

import argparse
import json
from pathlib import Path

from color_math import contrast_ratio, hex_to_oklch, normalize_hex

REQUIRED = ("emphasis", "caution", "error", "complete", "progress")


def hue_gap(a, b):
    distance = abs(a - b) % 360
    return min(distance, 360 - distance)


def check(data):
    warnings = []

    def warn(code, at, detail):
        warnings.append({"code": code, "at": at, "detail": detail})

    try:
        key_lightness, _, key_hue = hex_to_oklch(data["keyColor"])
    except (KeyError, ValueError, TypeError):
        key_lightness, key_hue = None, None
        warn("MISSING_KEY_COLOR", "keyColor", "#RRGGBB 키 컬러가 필요합니다.")
    canvas = data.get("canvas", {})
    states = data.get("states", {})
    for role in REQUIRED:
        item = states.get(role)
        if not isinstance(item, dict):
            warn("MISSING_ROLE", f"states.{role}", "상태 역할이 없습니다.")
            continue
        if not item.get("label") or not item.get("symbol"):
            warn("MISSING_NONCOLOR_CUE", f"states.{role}", "색 외의 글자와 기호가 필요합니다.")
        if key_lightness is not None and item.get("light", {}).get("text"):
            try:
                lightness = hex_to_oklch(item["light"]["text"])[0]
                if abs(lightness - key_lightness) > 0.08 and not item.get("lightnessReason"):
                    warn("LIGHTNESS_DRIFT", f"states.{role}.light.text", f"키 컬러와 OKLCH L 차이 {abs(lightness-key_lightness):.3f}; 대비 보정 이유를 기록하세요.")
            except (ValueError, TypeError):
                pass
        for scheme in ("light", "dark"):
            tones = item.get(scheme)
            bg = canvas.get(scheme)
            if not isinstance(tones, dict) or not bg:
                warn("MISSING_SCHEME", f"states.{role}.{scheme}", "모드별 색과 전체 바탕이 필요합니다.")
                continue
            for key in ("text", "mark", "tintSurface", "tintText"):
                if key not in tones:
                    warn("MISSING_LAYER", f"states.{role}.{scheme}.{key}", "의미 색의 층이 누락되었습니다.")
            for key, background, minimum in (("text", bg, 4.5), ("mark", bg, 3.0), ("tintText", tones.get("tintSurface"), 4.5)):
                if not tones.get(key) or not background:
                    continue
                try:
                    ratio = contrast_ratio(tones[key], background)
                    if ratio < minimum:
                        warn("LOW_CONTRAST", f"states.{role}.{scheme}.{key}", f"{ratio:.2f}:1 < {minimum}:1")
                except (ValueError, TypeError):
                    warn("INVALID_COLOR", f"states.{role}.{scheme}.{key}", "#RRGGBB 형식이 필요합니다.")
    palette = []
    for role, item in states.items():
        try:
            palette.append((role, hex_to_oklch(item["light"]["text"])[2], item.get("symbol")))
        except (KeyError, ValueError, TypeError):
            pass
    for index, (role_a, hue_a, symbol_a) in enumerate(palette):
        for role_b, hue_b, symbol_b in palette[index + 1:]:
            if hue_gap(hue_a, hue_b) < 30 and (not symbol_a or symbol_a == symbol_b):
                warn("CLOSE_HUE_NO_DISTINCT_CUE", f"states.{role_a}+{role_b}", f"색상각 차이 {hue_gap(hue_a, hue_b):.1f}°, 기호가 같거나 없습니다.")
    if key_hue is not None and "caution" in states:
        try:
            caution_hue = hex_to_oklch(states["caution"]["light"]["text"])[2]
            if hue_gap((key_hue + 180) % 360, caution_hue) < 20:
                warn("COMPLEMENT_CAUTION_COLLISION", "states.caution", "키 컬러 보색 변주와 주의색이 가까워 사용 역할을 확인하세요.")
        except (KeyError, ValueError, TypeError):
            pass
    encoding = data.get("dataEncoding", {})
    for key in ("related", "categories", "ordered", "trend"):
        if not encoding.get(key):
            warn("MISSING_DATA_ENCODING", f"dataEncoding.{key}", "데이터 부호 규칙 또는 실제 예시가 필요합니다.")
    return {"status": "WARN" if warnings else "PASS", "warnings": warnings, "note": "기록과 명시한 색 값만 검사한다. 실제 화면의 가독성·의미 전달 품질을 증명하지 않는다."}


def main():
    parser = argparse.ArgumentParser(description="확인 C 의미 색 체계 기록 검사")
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(check(json.loads(args.input.read_text())), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
