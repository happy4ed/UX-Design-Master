"""Turn measured evidence and explicit decisions into a reviewable DESIGN.md draft."""
import argparse
import json
from pathlib import Path


def table(rows, keys):
    if not rows:
        return "아직 결정되지 않음\n"
    lines = ["| " + " | ".join(keys) + " |", "| " + " | ".join("---" for _ in keys) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(str(row.get(key, "")).replace("|", "\\|") for key in keys) + " |")
    return "\n".join(lines) + "\n"


def make_brief(data):
    project = data.get("project", "미정 프로젝트")
    evidence = data.get("evidence", {})
    observed = evidence.get("observed", {})
    decisions = data.get("decisions", {})
    lines = [f"# {project} 디자인 계약 초안", "", "## 출처와 상태", "",
             f"- 기준 화면: {data.get('reference', '미기록')}",
             f"- 관찰 화면 폭: {evidence.get('viewport', {}).get('width', '미기록')}px",
             f"- 관찰 노드: {evidence.get('sampledNodes', '미기록')}개",
             "- 관찰값은 자동 추출한 빈도이며 승인된 토큰이 아니다.", ""]
    lines += ["## 관찰값 상위 후보", ""]
    for field in ("color", "backgroundColor", "fontFamily", "fontSize", "lineHeight", "borderRadius", "gap"):
        values = observed.get(field, [])[:5]
        lines.append(f"- {field}: " + (", ".join(f"{v['value']} ({v['count']})" for v in values) if values else "측정 안 됨"))
    lines += ["", "## 선택된 역할 토큰", "", table(decisions.get("tokens", []), ("role", "value", "status", "reason")),
              "## 반복 컴포넌트", "", table(decisions.get("components", []), ("id", "role", "shared", "states")),
              "## 배치·타이포그래피 규칙", "", table(decisions.get("rules", []), ("scope", "rule", "test")),
              "## 미결정 및 검증", ""]
    required = {"background", "text", "accent", "status", "surface"}
    chosen = {row.get("role") for row in decisions.get("tokens", [])}
    missing = sorted(required - chosen)
    lines.append("- 누락된 기본 색 역할: " + (", ".join(missing) if missing else "없음"))
    lines.append("- 실제 폰트 로딩·글리프·초기/포화·긴 번역·RTL·모션 감소를 대표 화면에서 검증")
    lines.append("- 사용자 확인 A/B/C/D 상태를 별도 기록하고 미승인 값은 확정 토큰으로 쓰지 않음")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description="실측값과 선택값을 구분한 DESIGN.md 초안을 생성합니다.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    result = make_brief(data)
    Path(args.out).write_text(result, encoding="utf-8")
    print(json.dumps({"out": args.out, "tokens": len(data.get("decisions", {}).get("tokens", []))}, ensure_ascii=False))


if __name__ == "__main__":
    main()
