"""Filter internal font candidates and inspect current-system availability."""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

DATA = json.loads((Path(__file__).resolve().parents[1] / "knowledge/font-families.json").read_text(encoding="utf-8"))


def installed(family):
    if not shutil.which("fc-match"):
        return None
    result = subprocess.run(["fc-match", "-f", "%{family}", family], capture_output=True, text=True, check=True)
    names = [part.strip().casefold() for part in result.stdout.split(",")]
    return family.casefold() in names


def main():
    parser = argparse.ArgumentParser(description="내부 폰트 후보를 사용 맥락·문자권으로 조회합니다.")
    parser.add_argument("--context", choices=DATA["contexts"])
    parser.add_argument("--script", choices=("ko", "latn", "arab"))
    parser.add_argument("--installed-only", action="store_true")
    args = parser.parse_args()
    rows = []
    for row in DATA["families"]:
        if args.context and args.context not in row["roles"]:
            continue
        if args.script and args.script not in row["scripts"]:
            continue
        found = installed(row["name"])
        if args.installed_only and found is not True:
            continue
        rows.append({**row, "installed": found})
    print(json.dumps({"count": len(rows), "families": rows}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
