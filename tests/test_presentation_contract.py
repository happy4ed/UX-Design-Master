import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "check_presentation_contract.py"
spec = importlib.util.spec_from_file_location("presentation_contract", SCRIPT)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)


def record():
    return {
        "kind": "presentation",
        "audience": "가족 의료비 서비스 검토팀",
        "coreQuestion": "인식값을 믿고 수정할 수 있는가?",
        "viewingContext": "회의실 화면 공유와 배포 PDF",
        "deliveryFormat": ["pptx", "pdf"],
        "slides": [
            {
                "id": "s1",
                "role": "data",
                "claim": "검토가 필요한 인식값을 먼저 보여준다",
                "evidence": [{"source": "2026-10-28 실험 표본", "use": "낮은 신뢰도 7건"}],
                "readingOrder": ["title", "chart", "source"],
                "visual": {
                    "type": "chart", "sourceData": "sample.csv", "unit": "건",
                    "scale": "0부터 시작", "alternative": "값을 나열한 표",
                    "isPartToWhole": True, "denominator": "전체 31건",
                },
                "renderEvidence": {"preview": "s1.png", "exported": "deck.pdf"},
            }
        ],
    }


class PresentationContractTest(unittest.TestCase):
    def test_complete_record_and_existing_exports(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            (base / "s1.png").write_bytes(b"preview")
            (base / "deck.pdf").write_bytes(b"export")
            self.assertEqual(module.inspect(record(), base, check_files=True), [])

    def test_unverifiable_numbers_and_missing_final_file_are_reported(self):
        case = record()
        case["slides"][0]["visual"]["denominator"] = ""
        case["slides"][0]["evidence"] = []
        with tempfile.TemporaryDirectory() as tmp:
            issues = module.inspect(case, Path(tmp), check_files=True)
        self.assertTrue(any("denominator" in issue for issue in issues))
        self.assertTrue(any("needs evidence" in issue for issue in issues))
        self.assertTrue(any("file not found" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
