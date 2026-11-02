"""Summarize only repeated, comparable mobile screenshot measurements."""
import json
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = ROOT / "knowledge"
full = json.loads((CAT / "mobile-platform-analysis-full.json").read_text(encoding="utf-8"))
rows = {row["id"]: row for row in json.loads((CAT / "mobile-app-observations.json").read_text(encoding="utf-8"))["screens"]}
by_code = {row["id"]: row for row in full["screens"]}


def anchor(ids, label, caveat):
    samples = [{"screen": rows[("ios27" if by_code[code]["platform"].startswith("iOS") else "oneui9") + "-study-" + code.lower()]["id"],
                "firstAnchorImagePx": by_code[code]["grid"]["x"][0],
                "reference400": round(by_code[code]["grid"]["x"][0] / by_code[code]["width"] * 400, 1)} for code in ids]
    values = [sample["reference400"] for sample in samples]
    return {"label": label, "sampleCount": len(samples), "independentAppCount": len({rows[sample["screen"]]["app"] for sample in samples}),
            "samples": samples, "medianReference400": round(statistics.median(values), 1),
            "rangeReference400": [min(values), max(values)], "unit": "이미지 폭 400px 환산값. pt/dp 단위 아님",
            "status": "candidate", "caveat": caveat}


output = {
    "schemaVersion": "1.0", "sourceScreens": len(rows),
    "rule": "공통 후보는 비교 가능한 화면 3장 이상, 앱 2개 이상에서만 제시한다. 같은 앱의 연속 캡처는 하나의 맥락으로 센다. 분포와 예외를 함께 적고 픽셀을 공식 토큰으로 승격하지 않는다.",
    "candidates": [
        anchor(["A", "C", "M", "U", "S", "F"], "iOS 27 화면의 첫 왼쪽 정렬선", "6개 앱 화면에서 비슷한 시작점이 보인다. 내부 열과 계층은 화면마다 다르며 AirPods A/B는 같은 앱의 연속 캡처다."),
        anchor(["N", "L", "R"], "One UI 9 Beta 앱 화면의 첫 왼쪽 정렬선", "3개 앱은 한 베타 기기에서 캡처했다. 이후 Settings는 더 안쪽에서 시작한다. 플랫폼 고정값은 아니다."),
    ],
    "repeatedPatterns": [
        {"pattern": "설정·속성의 그룹 행", "iosScreens": ["ios27-calendar-event-detail", "ios27-study-a", "ios27-study-b", "ios27-study-s"], "oneuiScreens": ["oneui9-settings-home", "oneui9-study-l", "oneui9-study-r"], "interpretation": "역할은 반복되지만 행 높이·표면·구분선은 앱과 상태에 따라 다르다. A/B는 같은 앱 맥락이다."},
        {"pattern": "입력·선택 제어", "iosScreens": ["ios27-calendar-event-create", "ios27-study-c", "ios27-study-s"], "oneuiScreens": ["oneui9-study-p", "oneui9-study-n"], "interpretation": "선택 묶음·입력·스위치·실행 행은 알약형 외형이 같아도 행동으로 구분해야 한다."},
        {"pattern": "미디어 제어 묶음", "iosScreens": ["ios27-study-u"], "oneuiScreens": ["oneui9-study-k"], "interpretation": "양쪽 플랫폼에서 역할이 반복되지만 플랫폼별 한 화면으로 공통 치수를 정할 수 없다."},
    ],
    "colorObservations": [
        {"label": "iOS 설정·폼의 밝은 중성 배경", "screens": ["ios27-study-a", "ios27-study-b", "ios27-calendar-event-detail", "ios27-calendar-event-create"], "distinctApps": 2, "rasterColors": ["#F2F2F6", "#F3F2F7"], "status": "색 경향만 참고. AirPods와 Calendar는 각 앱의 연속 상태"},
        {"label": "One UI 9 두 앱의 따뜻한 배경", "screens": ["oneui9-settings-home", "oneui9-calculator-scientific"], "distinctApps": 2, "rasterColors": ["#F3EFEE", "#F5EFEF"], "status": "테마·기기 영향 가능. 플랫폼 토큰 아님"},
    ],
    "notEstablished": [
        "정확한 pt/dp 여백·갭 배수·행 높이·R·글자 크기·터치 영역",
        "기본 앱 전반에 통용되는 iOS 또는 One UI 9 브랜드 팔레트",
        "공통 그라데이션 스톱: Weather 1장은 데이터 종속",
        "정지 화면만으로 확인할 수 없는 모션·눌림 상태·화면 전환",
    ],
}
target = CAT / "mobile-common-values.json"
target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{target}: {output['sourceScreens']} screens, {len(output['candidates'])} measured candidate distributions")
