"""Build a traceable DESIGN.md draft from measured states and explicit decisions."""
import argparse
import json
from pathlib import Path
from check_measurement_manifest import audit as audit_manifest


def cell(value):
    if value is None or value == "" or value == []:
        return "미정"
    if isinstance(value, (list, dict)):
        value = json.dumps(value, ensure_ascii=False)
    return str(value).replace("|", "\\|").replace("\n", " ")


def table(rows, columns):
    if not rows:
        return "미기록\n"
    lines = ["| " + " | ".join(title for _, title in columns) + " |",
             "| " + " | ".join("---" for _ in columns) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(cell(row.get(key)) for key, _ in columns) + " |")
    return "\n".join(lines) + "\n"


def audit_input(data):
    findings = []
    states = data.get("states", [])
    observations = data.get("observations", [])
    decisions = data.get("decisions", {})
    if not states:
        findings.append("화면·상태·뷰포트별 실측 기록이 없음")
    if not observations:
        findings.append("요소별 관찰값과 단위·측정 방법이 없음")
    measurement_result = audit_manifest(data)
    findings.extend(f"실측 기록 {item['code']}: {item['path']}" for item in measurement_result['findings'])
    observed_ids = {row.get("id") for row in observations if isinstance(row, dict)}
    state_keys = {(row.get("screenId"), row.get("stateId")) for row in states if isinstance(row, dict)}
    for index, row in enumerate(observations):
        for key in ("id", "screenId", "stateId", "target", "property", "value", "unit", "source", "method", "uncertainty"):
            if key not in row or row[key] in (None, ""):
                findings.append(f"observations[{index}].{key} 누락")
        if (row.get("screenId"), row.get("stateId")) not in state_keys:
            findings.append(f"observations[{index}]: 기록되지 않은 화면·상태를 참조")
    for section in ("tokens", "geometry", "typography", "interactions", "motion", "themeAxes", "rules"):
        for index, row in enumerate(decisions.get(section, [])):
            if row.get("status") == "approved" and not (row.get("evidenceIds") or row.get("basis") == "user-choice"):
                findings.append(f"decisions.{section}[{index}]: 승인값의 관찰 근거 또는 사용자 선택 근거 없음")
            for evidence_id in row.get("evidenceIds", []):
                if evidence_id not in observed_ids:
                    findings.append(f"decisions.{section}[{index}]: 없는 관찰 ID {evidence_id}")
    for section, message in (("geometry", "광학 정렬·간격·R 채택 규칙 없음"),
                             ("typography", "글꼴·줄바꿈·들여쓰기 결정 없음"),
                             ("components", "컴포넌트 역할·공통/전용 사용 맵 없음"),
                             ("interactions", "입력 방식별 컴포넌트 계약 연결 없음"),
                             ("motion", "입력에 따른 전후 상태·정적 대안의 모션 흐름 없음"),
                             ("themeAxes", "테마 확장 축과 보존 조건 없음")):
        if not decisions.get(section):
            findings.append(message)
    for section, required in (("components", ("id", "role", "shared", "states", "slots")),
                              ("interactions", ("scope", "contract", "result", "status", "test")),
                              ("motion", ("scope", "trigger", "fromTo", "motion", "staticFallback", "status", "test"))):
        for index, row in enumerate(decisions.get(section, [])):
            for key in required:
                if not row.get(key):
                    findings.append(f"decisions.{section}[{index}].{key} 누락")
    for index, row in enumerate(decisions.get("themeAxes", [])):
        for key in ("axis", "base", "variation", "invariant", "status", "test"):
            if not row.get(key):
                findings.append(f"decisions.themeAxes[{index}].{key} 누락")
    chosen = {str(row.get("role", "")).split(".")[0] for row in decisions.get("tokens", [])}
    if "canvas" in chosen:
        chosen.add("background")
    missing_roles = {"background", "text", "accent", "status", "surface"} - chosen
    if missing_roles:
        findings.append("기본 색 역할 누락: " + ", ".join(sorted(missing_roles)))
    return list(dict.fromkeys(findings))


def section(lines, title, rows, columns):
    lines.extend([title, "", table(rows, columns), ""])


def make_brief(data):
    evidence = data.get("evidence", {})
    decisions = data.get("decisions", {})
    states = data.get("states", [])
    observations = data.get("observations", [])
    findings = audit_input(data)
    lines = [f"# {cell(data.get('project') or '미정 프로젝트')} DESIGN.md — 실측 기반 초안", "",
             "> 관찰값·설계 제안·사용자 승인값은 서로 다른 상태다. 이 파일 생성만으로 화면 품질이나 테마 확장을 승인하지 않는다.", "",
             "## 1. 출처와 실측 범위", "", f"- 레퍼런스: {cell(data.get('reference'))}",
             f"- 측정 기준: {cell(data.get('measurementDate'))}",
             f"- 상태 기록: {len(states)}건 / 관찰값: {len(observations)}건",
             f"- 자동 수집 표본: {cell(evidence.get('sampledNodes'))}개; 표본 밖 노드: {cell(evidence.get('truncatedNodes'))}개",
             "- CSS 빈도·DOM 부모는 의미 역할, 실제 가림 순서, 광학 정렬의 증거가 아니다.", ""]
    state_rows = [{"id": s.get("id"), "screenId": s.get("screenId"), "stateId": s.get("stateId"), "viewport": s.get("viewport"), "capture": s.get("capture"), "measurement": (s.get("measurement") or {}).get("source"), "visualReview": (s.get("visualReview") or {}).get("status")} for s in states]
    section(lines, "### 화면·상태·기기별 근거", state_rows, [("id", "기록 ID"), ("screenId", "화면"), ("stateId", "상태"), ("viewport", "뷰포트"), ("capture", "캡처"), ("measurement", "수치 근거"), ("visualReview", "직접 확인")])
    section(lines, "### 조작 전후 비교", data.get("transitions", []), [("id", "비교 ID"), ("before", "이전 상태"), ("action", "조작"), ("after", "이후 상태"), ("stableLandmarks", "기준선 계약"), ("observed", "스크롤·포커스 실측")])
    section(lines, "## 2. 관찰값 — 채택 토큰과 분리", observations, [("id", "관찰 ID"), ("target", "대상"), ("property", "속성"), ("value", "값"), ("unit", "단위"), ("method", "방법"), ("uncertainty", "불확실성")])
    lines.extend(["### 계산 스타일 상위 후보", ""])
    for field in ("color", "backgroundColor", "fontFamily", "fontSize", "fontWeight", "lineHeight", "borderRadius", "gap", "paddingLeft"):
        common = ", ".join(f"{v['value']} ({v['count']})" for v in evidence.get("observed", {}).get(field, [])[:5]) or "측정 안 됨"
        weighted = ", ".join(f"{v['value']} ({v['count']})" for v in evidence.get("weighted", {}).get(field, [])[:3]) or "측정 안 됨"
        lines.append(f"- {field}: 빈도 {common}; 가중 후보 {weighted}")
    lines.extend(["", "## 3. 제작 결정 — 근거와 승인 상태", ""])
    section(lines, "### 의미 토큰", decisions.get("tokens", []), [("role", "역할"), ("value", "채택값"), ("status", "상태"), ("evidenceIds", "관찰 ID"), ("basis", "선택 근거"), ("reason", "이유")])
    section(lines, "### 광학 정렬·기호 간격·크기별 R", decisions.get("geometry", []), [("scope", "적용 범위"), ("property", "측정 항목"), ("observed", "관찰"), ("value", "채택값"), ("status", "상태"), ("evidenceIds", "근거 ID"), ("test", "재검증")])
    section(lines, "### 타이포그래피·줄바꿈", decisions.get("typography", []), [("scope", "적용 범위"), ("property", "속성"), ("value", "채택값"), ("status", "상태"), ("evidenceIds", "근거 ID"), ("test", "재검증")])
    section(lines, "### 컴포넌트 사용 맵", decisions.get("components", []), [("id", "컴포넌트"), ("role", "역할"), ("shared", "공통/전용"), ("states", "상태"), ("slots", "측정 슬롯")])
    section(lines, "### 입력·상태", decisions.get("interactions", []), [("scope", "인스턴스"), ("contract", "입력 계약"), ("result", "상태 결과"), ("status", "상태"), ("test", "재검증")])
    section(lines, "### 모션 흐름", decisions.get("motion", []), [("scope", "화면·사건"), ("trigger", "트리거"), ("fromTo", "전후 상태"), ("motion", "움직임"), ("staticFallback", "정적 대안"), ("status", "상태"), ("test", "재검증")])
    lines.extend(["### 테마 확장 축", "", "같은 의미 역할을 유지한 변주만 기록한다. 색·여백·R·컴포넌트·재질은 원본 CSS 빈도에서 자동 생성하지 않는다.", ""])
    lines.append(table(decisions.get("themeAxes", []), [("axis", "축"), ("base", "기준"), ("variation", "변주 범위"), ("invariant", "보존 조건"), ("status", "상태"), ("test", "대표 화면 검증")]))
    section(lines, "### 화면별 배치·콘텐츠 규칙", decisions.get("rules", []), [("scope", "적용 범위"), ("rule", "규칙"), ("status", "상태"), ("evidenceIds", "근거 ID"), ("test", "재검증")])
    lines.extend(["## 4. 미결정·검증 게이트", ""])
    chosen = {str(row.get("role", "")).split(".")[0] for row in decisions.get("tokens", [])}
    if "canvas" in chosen:
        chosen.add("background")
    missing = sorted({"background", "text", "accent", "status", "surface"} - chosen)
    lines.append("- 누락된 기본 색 역할: " + (", ".join(missing) if missing else "없음"))
    lines.extend(f"- 검토 필요: {finding}" for finding in findings)
    if not findings:
        lines.append("- 기록 필드는 채워짐. 실제 렌더·조작 품질은 별도 확인 필요.")
    lines.extend(["- 초기/포화, 좁은 폭, 150/200% 글자 확대, 긴 영어·RTL, 필요한 테마를 대표 화면에서 직접 확인한다.",
                  "- 아이콘 내부 형상·글리프 시각 무게·머릿글 기호 간격·크기별 R은 캡처와 실측값을 나란히 비교한다.",
                  "- A1/B/C/D 승인 상태를 별도 기록한다. 미승인 값을 최종 토큰이나 테마 확장 입력으로 쓰지 않는다.", ""])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="실측값과 선택값을 분리해 DESIGN.md 초안을 생성")
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--strict", action="store_true", help="미결정·근거 누락 시 종료 코드 1")
    args = parser.parse_args()
    data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    findings = audit_input(data)
    Path(args.out).write_text(make_brief(data), encoding="utf-8")
    print(json.dumps({"out": args.out, "states": len(data.get("states", [])), "observations": len(data.get("observations", [])), "reviewFindings": findings}, ensure_ascii=False))
    if args.strict and findings:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
