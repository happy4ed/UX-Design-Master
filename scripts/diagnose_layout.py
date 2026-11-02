"""Search internal symptom → measure → cause → fix → verify rules."""
import argparse
import json
from pathlib import Path

DATA = json.loads((Path(__file__).resolve().parents[1] / "knowledge/layout-diagnoses.json").read_text(encoding="utf-8"))["rules"]
parser = argparse.ArgumentParser(description="레이아웃·모션·텍스트 증상에서 검사 순서를 찾습니다.")
parser.add_argument("query", help="증상 또는 id의 단어")
args = parser.parse_args()
terms = args.query.casefold().split()
rows = [row for row in DATA if all(term in " ".join(row.values()).casefold() for term in terms)]
print(json.dumps({"count": len(rows), "diagnoses": rows}, ensure_ascii=False, indent=2))
