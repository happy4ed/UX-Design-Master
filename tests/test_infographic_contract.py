import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "check_infographic_contract.py"
spec = importlib.util.spec_from_file_location("infographic_contract", SCRIPT)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)


def record():
    return {
        "kind": "infographic", "audience": "서비스 운영팀",
        "storyClaim": "검토가 필요한 값은 일부에 집중된다",
        "sourceSummary": "가상 검증 자료, 31건",
        "scanOrder": ["overview", "reason"],
        "panels": [
            {"id": "overview", "question": "몇 건인가", "claim": "7건이 확인 대상",
             "source": "sample.csv", "sourceData": "sample.csv", "unit": "건",
             "scale": "0부터 시작", "isPartToWhole": True, "denominator": "전체 31건",
             "encoding": {"type": "bar", "represents": "막대 길이=건수"},
             "alternative": "항목별 건수 표", "renderEvidence": "overview.svg"},
            {"id": "reason", "question": "어디에서 생겼나", "claim": "원본 대조 단계에서 발견",
             "source": "처리 흐름 명세", "sourceRelations": ["인식→검토"],
             "encoding": {"type": "process", "represents": "처리 순서"},
             "alternative": "단계 목록", "renderEvidence": "reason.svg"},
        ],
        "adaptations": [{"medium": "slide", "displaySize": "16:9 발표 화면",
                         "readingOrder": ["overview", "reason"], "renderEvidence": "slide.png"}],
    }


class InfographicContractTest(unittest.TestCase):
    def test_complete_story(self):
        self.assertEqual(module.inspect(record()), [])

    def test_invented_relationship_and_wrong_scan_order_are_caught(self):
        case = record()
        case["panels"][1]["sourceRelations"] = []
        case["scanOrder"] = ["overview", "overview"]
        issues = module.inspect(case)
        self.assertTrue(any("sourceRelations" in issue for issue in issues))
        self.assertTrue(any("scanOrder" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
