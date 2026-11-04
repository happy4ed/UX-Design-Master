"""A1 functions and information must survive into flows, screens, and rendered evidence."""

import copy
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from check_functional_inventory import audit  # noqa: E402
from check_design_preflight import check as check_preflight  # noqa: E402
from write_functional_inventory import write_spec  # noqa: E402


def sample(stage="final"):
    return {"stage": stage,
            "groups": [{"id": "records", "name": "진료 기록", "parentId": None}, {"id": "claims", "name": "청구", "parentId": "records"}],
            "features": [
                {"id": "view", "name": "내역 보기", "groupId": "records", "parentId": None, "tier": "required", "target": "ui", "source": "user", "decision": "confirmed", "inputs": [], "outputs": ["진료 내역"], "acceptance": "금액과 상태가 보인다", "interaction": False},
                {"id": "upload", "name": "서류 올리기", "groupId": "claims", "parentId": "view", "tier": "conditional", "condition": "청구 전", "elseBehavior": "업로드 숨김", "conditionStateIds": ["before-claim"], "target": "ui", "source": "proposal", "decision": "confirmed", "inputs": ["사진"], "outputs": ["인식 결과"], "acceptance": "사진을 선택하고 결과를 검토한다", "interaction": True},
                {"id": "total", "name": "합계 계산", "groupId": "claims", "parentId": None, "tier": "supporting", "target": "system", "source": "observed", "decision": "confirmed", "inputs": ["원본 금액"], "outputs": ["합계"], "acceptance": "원본 값과 식을 추적한다", "interaction": False}],
            "information": [
                {"id": "amount", "name": "진료 금액", "tier": "required", "valueSource": "원본 영수증", "featureIds": ["view"], "displayRule": "전체 값", "overflowRule": "행 재배치", "source": "user", "decision": "confirmed"},
                {"id": "hint", "name": "안내", "tier": "supporting", "valueSource": "제품 문구", "featureIds": ["upload"], "displayRule": "업로드 전", "overflowRule": "여러 줄", "source": "proposal", "decision": "confirmed"},
                {"id": "error", "name": "오류", "tier": "conditional", "condition": "인식 실패", "elseBehavior": "표시 안 함", "conditionStateIds": ["upload-error"], "valueSource": "인식기 상태", "featureIds": ["upload"], "displayRule": "원인과 재시도", "overflowRule": "여러 줄", "source": "observed", "decision": "confirmed"}],
            "flows": [{"id": "claim", "name": "서류 청구", "featureIds": ["view", "upload", "total"]}],
            "screens": [{"id": "history", "title": "내역", "stateIds": ["initial", "before-claim", "upload-error"], "featureIds": ["view", "upload"], "informationIds": ["amount", "hint", "error"], "renderEvidence": "history.png", "renderedFeatureIds": ["view", "upload"], "renderedInformationIds": ["amount", "hint", "error"]}],
            "verification": [{"featureId": "view", "result": "PASS", "evidence": "내역 화면 조작"},
                             {"featureId": "upload", "result": "PASS", "evidence": "업로드 흐름", "conditionTrueEvidence": "청구 전에서 표시", "conditionFalseEvidence": "완료에서 숨김"},
                             {"featureId": "total", "result": "NOT_RUN", "evidence": "실제 계산 자료 없음"}]}


def check():
    data = sample()
    assert audit(data)["status"] == "PASS", audit(data)
    spec = write_spec(data)
    assert all(text in spec for text in ("필수/부가/조건부", "서류 올리기", "진료 금액", "청구 전", "upload-error", "실제 보이는 정보"))
    for stage in ("A1", "A2", "A3", "B", "C", "D", "final"):
        assert audit(sample(stage))["status"] == "PASS", stage
    missing = copy.deepcopy(data)
    missing["screens"][0]["informationIds"].remove("amount")
    assert "INFORMATION_MISSING_SCREEN" in {row["code"] for row in audit(missing)["findings"]}
    missing = copy.deepcopy(data)
    missing["screens"][0]["renderedFeatureIds"].remove("upload")
    assert "FEATURE_NOT_RENDERED" in {row["code"] for row in audit(missing)["findings"]}
    assert "SCREEN_FEATURE_NOT_RENDERED" in {row["code"] for row in audit(missing)["findings"]}
    missing = copy.deepcopy(data)
    missing["features"][1]["condition"] = ""
    assert "CONDITION_UNDEFINED" in {row["code"] for row in audit(missing)["findings"]}
    missing = copy.deepcopy(data)
    del missing["features"][0]["interaction"]
    assert "FEATURE_INTERACTION_UNCLASSIFIED" in {row["code"] for row in audit(missing)["findings"]}
    missing = copy.deepcopy(data)
    missing["features"][0]["decision"] = "proposed"
    assert "REQUIRED_NOT_CONFIRMED" in {row["code"] for row in audit(missing)["findings"]}
    missing = copy.deepcopy(data)
    missing["screens"][0]["stateIds"].remove("before-claim")
    assert "SCREEN_CONDITION_STATE_MISSING" in {row["code"] for row in audit(missing)["findings"]}
    missing = copy.deepcopy(data)
    missing["screens"][0]["title"] = "우리의 소중한 진료 기록"
    assert "SCREEN_TITLE_LENGTH" in {row["code"] for row in audit(missing)["findings"]}
    missing = copy.deepcopy(data)
    missing["flows"][0]["featureIds"].remove("upload")
    assert "FEATURE_MISSING_FLOW" in {row["code"] for row in audit(missing)["findings"]}
    missing = copy.deepcopy(data)
    missing["verification"][1]["conditionFalseEvidence"] = ""
    assert "CONDITION_NOT_VERIFIED" in {row["code"] for row in audit(missing)["findings"]}
    missing = copy.deepcopy(data)
    missing["groups"][0]["parentId"] = "claims"
    assert "HIERARCHY_CYCLE" in {row["code"] for row in audit(missing)["findings"]}
    preflight = check_preflight({"stage": "B", "screens": [{"id": "history", "purpose": "내역 확인", "stateOrder": ["initial"], "renderEvidence": "history.png"}], "rehearsal": {}})
    assert any(row["at"] == "rehearsal.functionalInventoryCoverage" for row in preflight["warnings"])
    with tempfile.TemporaryDirectory() as folder:
        source = Path(folder) / "inventory.json"
        source.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        run = subprocess.run([sys.executable, str(ROOT / "scripts/check_functional_inventory.py"), "--input", str(source)], capture_output=True, text=True)
        assert run.returncode == 0, run.stdout + run.stderr
        target = Path(folder) / "FUNCTIONAL-SPEC.md"
        run = subprocess.run([sys.executable, str(ROOT / "scripts/write_functional_inventory.py"), "--input", str(source), "--out", str(target), "--strict"], capture_output=True, text=True)
        assert run.returncode == 0 and "서류 올리기" in target.read_text(), run.stdout + run.stderr


if __name__ == "__main__":
    check()
    print("functional inventory A1→D traceability: PASS")
