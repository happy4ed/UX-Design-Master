"""A staged report must anchor observed problems to actual PNG pixels."""

import copy
import json
import subprocess
import struct
import sys
import tempfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from render_app_review_report import render  # noqa: E402


def make_png(path, width=390, height=844, color=(237, 244, 238)):
    def chunk(kind, value):
        body = kind + value
        return struct.pack(">I", len(value)) + body + struct.pack(">I", zlib.crc32(body) & 0xffffffff)
    pixels = b"".join(b"\x00" + bytes(color) * width for _ in range(height))
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(pixels)) + chunk(b"IEND", b""))


def fixture(directory):
    make_png(directory / "before.png")
    make_png(directory / "proposal.png", color=(224, 240, 235))
    make_png(directory / "after.png", color=(218, 237, 231))
    return {"reportId": "review-test", "project": "검수 예제", "purpose": "목록에서 서류를 선택한다", "reviewedAt": "2026-11-04",
            "stage": "evidence", "screens": [{"id": "list-initial", "title": "내역", "state": "첫 진입", "device": "Android", "viewport": "390×844 dp", "screenshot": "before.png", "reviewStatus": "REVIEWED", "capturePath": "앱 실행 → 내역"}],
            "findings": [{"id": "F-01", "screenId": "list-initial", "severity": "major", "title": "행 끝이 잘림", "rect": {"x": 300, "y": 220, "width": 64, "height": 48}, "observed": "금액 끝자리가 가려짐", "impact": "금액을 확인할 수 없음", "evidence": "내역 화면 첫 번째 행", "verify": "같은 폰트·폭에서 전체 금액 표시"}],
            "notReviewed": ["로그인 후 화면: 접근 자료 없음"]}


def check():
    with tempfile.TemporaryDirectory() as folder:
        directory = Path(folder)
        data = fixture(directory)
        evidence_html = render(data, directory)
        assert "data:image/png;base64," in evidence_html
        assert 'id="pin-1"' in evidence_html and 'id="finding-1"' in evidence_html
        assert "left:76.9231%;top:26.0664%" in evidence_html
        assert "금액 끝자리가 가려짐" in evidence_html
        assert "로그인 후 화면" in evidence_html
        assert "의견 JSON 내보내기" in evidence_html
        assert "prefers-reduced-motion" in evidence_html
        injection = copy.deepcopy(data)
        injection["findings"][0]["title"] = "<script>alert(1)</script>"
        assert "&lt;script&gt;alert(1)&lt;/script&gt;" in render(injection, directory)
        data["stage"] = "recommendations"
        data["findings"][0]["recommendations"] = [{"id": "A", "title": "행 폭 재배치", "reason": "금액 영역 확보", "tradeoff": "메모 줄바꿈", "previewScreenshot": "proposal.png"}]
        data["feedbackResponses"] = [{"findingId": "F-01", "userComment": "금액을 전부 보여줘", "status": "applied", "response": "금액 슬롯을 넓힌 안을 시연에 반영"}]
        recommendations_html = render(data, directory)
        assert "추천안 A" in recommendations_html and "행 폭 재배치" in recommendations_html
        assert "금액을 전부 보여줘" in recommendations_html and "금액 슬롯을 넓힌 안" in recommendations_html
        assert recommendations_html.count("data:image/png;base64,") == 2
        data["stage"] = "verification"
        data["findings"][0].update({"afterScreenshot": "after.png", "verificationResult": "PASS", "verificationNote": "같은 크기에서 금액 전체 표시"})
        verification_html = render(data, directory)
        assert "수정 전" in verification_html and "수정 후" in verification_html and "재검증 PASS" in verification_html
        pending = copy.deepcopy(data)
        pending["findings"][0].pop("afterScreenshot")
        pending["findings"][0]["verificationResult"] = "NOT_RUN"
        pending["findings"][0]["verificationNote"] = "수정 전이므로 재검증하지 않음"
        pending_html = render(pending, directory)
        assert "재검증 NOT_RUN" in pending_html and 'alt="수정 후 화면"' not in pending_html
        bad = copy.deepcopy(data)
        bad["findings"][0]["rect"]["x"] = 380
        try:
            render(bad, directory)
        except ValueError as error:
            assert "PNG 밖" in str(error)
        else:
            raise AssertionError("이미지 밖 좌표를 허용함")
        bad = copy.deepcopy(data)
        bad["findings"][0]["afterScreenshot"] = "missing.png"
        try:
            render(bad, directory)
        except ValueError as error:
            assert "근거 파일이 없습니다" in str(error)
        else:
            raise AssertionError("없는 수정 후 캡처를 허용함")
        output = directory / "report.html"
        output.write_text(verification_html, encoding="utf-8")
        assert output.is_file()
        source = directory / "review.json"
        source.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        command = [sys.executable, str(ROOT / "scripts/render_app_review_report.py"), "--input", str(source), "--out", str(output)]
        run = subprocess.run(command, capture_output=True, text=True)
        assert run.returncode == 0, run.stdout + run.stderr
        return output.stat().st_size


if __name__ == "__main__":
    print(f"staged app review report: PASS ({check()} bytes)")
