"""Find mobile design roles and optional platform implementation candidates."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "knowledge"
PATTERNS = json.loads((ROOT / "mobile-patterns.json").read_text(encoding="utf-8"))["patterns"]
BINDINGS = json.loads((ROOT / "mobile-platform-bindings.json").read_text(encoding="utf-8"))["bindings"]
ALIASES = {
    "탭": "tabbar segmented tabs", "하단": "tabbar bottom-action-bar bottom-sheet",
    "목록": "list list-row reorder pagination", "검색": "search search-results",
    "선택": "segmented checkbox radio switch picker-sheet", "입력": "text-field multiline otp",
    "버튼": "primary-button icon-button fab", "로딩": "spinner progress skeleton",
    "오류": "alert-dialog toast inline-error", "키보드": "keyboard-avoid text-field multiline",
    "바텀시트": "bottom-sheet present-sheet", "세이프에어리어": "safe-area",
}


def main():
    parser = argparse.ArgumentParser(description="내부 모바일 패턴 73개에서 역할 후보를 찾습니다.")
    parser.add_argument("--term", default="", help="이름, ID, 역할 점검 문구")
    parser.add_argument("--family", default="", help="패턴 계열")
    parser.add_argument("--platform", choices=("swiftui", "flutter", "reactNative"))
    args = parser.parse_args()
    query = args.term.casefold().strip()
    aliases = ALIASES.get(query, "").split()
    rows = []
    for row in PATTERNS:
        if args.family and row["family"] != args.family:
            continue
        haystack = " ".join(str(row.get(key, "")) for key in ("id", "name", "family", "designCheck")).casefold()
        if query and ((row["id"] not in aliases) if aliases else (query not in haystack)):
            continue
        found = dict(row)
        if args.platform:
            found["platformCandidate"] = BINDINGS.get(row["id"], {}).get(args.platform)
        rows.append(found)
    print(json.dumps({"count": len(rows), "patterns": rows}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
