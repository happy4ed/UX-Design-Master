#!/usr/bin/env python3
"""Render a self-contained, image-anchored staged app review report."""

import argparse
import base64
import copy
import html
import json
import math
import re
import struct
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "assets/review-report-template.html"
STAGES = {"evidence": "01 · 실제 화면과 문제", "recommendations": "02 · 추천안 비교", "verification": "03 · 수정 후 재검증"}
SEVERITIES = {"blocker": "차단", "major": "중요", "minor": "다듬기"}
FEEDBACK_STATUSES = {"applied": "반영", "partially-applied": "일부 반영", "rejected": "반려", "pending": "보류"}


def esc(value):
    return html.escape(str(value), quote=True)


def png_image(path):
    raw = path.read_bytes()
    if len(raw) < 24 or raw[:8] != b"\x89PNG\r\n\x1a\n" or raw[12:16] != b"IHDR":
        raise ValueError(f"PNG 캡처가 아닙니다: {path}")
    width, height = struct.unpack(">II", raw[16:24])
    if not width or not height:
        raise ValueError(f"PNG 크기가 잘못됐습니다: {path}")
    return {"uri": "data:image/png;base64," + base64.b64encode(raw).decode("ascii"), "width": width, "height": height}


def media(path, base, allowed):
    file = Path(path)
    file = file if file.is_absolute() else base / file
    suffix = file.suffix.lower()
    if suffix not in allowed:
        raise ValueError(f"지원하지 않는 파일 형식: {file}")
    if not file.is_file():
        raise ValueError(f"근거 파일이 없습니다: {file}")
    if suffix == ".png":
        return png_image(file)
    mime = {".mp4": "video/mp4", ".webm": "video/webm"}[suffix]
    return {"uri": f"data:{mime};base64," + base64.b64encode(file.read_bytes()).decode("ascii")}


def required(obj, keys, label):
    for key in keys:
        if not isinstance(obj.get(key), str) or not obj[key].strip():
            raise ValueError(f"{label}.{key} 누락")


def validate_and_load(data, base):
    required(data, ("reportId", "project", "purpose", "reviewedAt"), "report")
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,80}", data["reportId"]):
        raise ValueError("reportId는 영문·숫자·마침표·밑줄·하이픈 80자 이내로 지정하세요")
    stage = data.get("stage")
    if stage not in STAGES:
        raise ValueError("stage는 evidence/recommendations/verification 중 하나여야 합니다")
    screens = data.get("screens")
    if not isinstance(screens, list) or not screens:
        raise ValueError("실제 캡처가 연결된 screens[]가 필요합니다")
    screen_map = {}
    for screen in screens:
        required(screen, ("id", "title", "state", "device", "viewport", "screenshot", "capturePath"), "screen")
        if screen["id"] in screen_map:
            raise ValueError(f"화면 ID 중복: {screen['id']}")
        if screen.get("reviewStatus") != "REVIEWED":
            raise ValueError(f"{screen['id']}: 캡처한 화면만 screens[]에 넣고 미검토 화면은 notReviewed[]에 적으세요")
        screen_map[screen["id"]] = {**screen, "image": media(screen["screenshot"], base, {".png"})}
    findings = data.get("findings")
    if not isinstance(findings, list):
        raise ValueError("findings[]가 필요합니다. 발견이 없으면 빈 배열로 둡니다")
    ids = set()
    for finding in findings:
        required(finding, ("id", "screenId", "title", "observed", "impact", "evidence", "verify"), "finding")
        if finding["id"] in ids:
            raise ValueError(f"발견 ID 중복: {finding['id']}")
        ids.add(finding["id"])
        if finding["screenId"] not in screen_map:
            raise ValueError(f"{finding['id']}: 없는 화면 ID {finding['screenId']}")
        if finding.get("severity") not in SEVERITIES:
            raise ValueError(f"{finding['id']}: severity는 blocker/major/minor 중 하나")
        screen = screen_map[finding["screenId"]]
        rect = finding.get("rect") or {}
        size = screen["image"]
        if not all(isinstance(rect.get(key), (int, float)) and not isinstance(rect[key], bool) and math.isfinite(rect[key]) for key in ("x", "y", "width", "height")):
            raise ValueError(f"{finding['id']}: rect에는 PNG 픽셀 좌표 x/y/width/height가 필요합니다")
        if rect["x"] < 0 or rect["y"] < 0 or rect["width"] <= 0 or rect["height"] <= 0 or rect["x"] + rect["width"] > size["width"] or rect["y"] + rect["height"] > size["height"]:
            raise ValueError(f"{finding['id']}: rect가 {size['width']}×{size['height']} PNG 밖에 있습니다")
        if stage in {"recommendations", "verification"}:
            recs = finding.get("recommendations")
            if not isinstance(recs, list) or not recs:
                raise ValueError(f"{finding['id']}: 추천 단계에는 렌더된 추천안이 필요합니다")
            rec_ids = set()
            for rec in recs:
                required(rec, ("id", "title", "reason", "tradeoff"), f"{finding['id']}.recommendation")
                if rec["id"] in rec_ids:
                    raise ValueError(f"{finding['id']}: 추천안 ID {rec['id']} 중복")
                rec_ids.add(rec["id"])
                if not rec.get("previewScreenshot") and not rec.get("motionPreview") and not rec.get("prototypeUrl"):
                    raise ValueError(f"{finding['id']}/{rec['id']}: 실제 추천안 미리보기 또는 동작 원형이 필요합니다")
                if rec.get("previewScreenshot"):
                    rec["image"] = media(rec["previewScreenshot"], base, {".png"})
                if rec.get("motionPreview"):
                    rec["video"] = media(rec["motionPreview"], base, {".mp4", ".webm"})
                if rec.get("prototypeUrl") and urlparse(rec["prototypeUrl"]).scheme not in {"http", "https"}:
                    raise ValueError(f"{finding['id']}/{rec['id']}: prototypeUrl은 http(s)만 허용합니다")
        if stage == "verification":
            required(finding, ("verificationNote",), finding["id"])
            if finding.get("verificationResult") not in {"PASS", "FAIL", "NOT_RUN"}:
                raise ValueError(f"{finding['id']}: verificationResult 필요")
            if finding["verificationResult"] != "NOT_RUN" and not finding.get("afterScreenshot"):
                raise ValueError(f"{finding['id']}: 재검증 PASS/FAIL에는 수정 후 PNG가 필요합니다")
            if finding.get("afterScreenshot"):
                finding["afterImage"] = media(finding["afterScreenshot"], base, {".png"})
                if (finding["afterImage"]["width"], finding["afterImage"]["height"]) != (screen["image"]["width"], screen["image"]["height"]):
                    raise ValueError(f"{finding['id']}: 수정 전후 PNG 크기가 달라 같은 조건 비교를 할 수 없습니다")
    if not isinstance(data.get("notReviewed", []), list):
        raise ValueError("notReviewed는 미검토 범위의 문자열 목록입니다")
    if any(not isinstance(row, str) or not row.strip() for row in data.get("notReviewed", [])):
        raise ValueError("notReviewed에는 미검토 화면과 이유를 문장으로 적으세요")
    responses = data.get("feedbackResponses", [])
    if not isinstance(responses, list):
        raise ValueError("feedbackResponses는 사용자 의견 처리 기록의 배열입니다")
    response_ids = set()
    for response in responses:
        required(response, ("findingId", "userComment", "response"), "feedbackResponse")
        if response["findingId"] not in ids:
            raise ValueError(f"없는 발견 ID의 피드백 처리: {response['findingId']}")
        if response["findingId"] in response_ids:
            raise ValueError(f"피드백 처리 ID 중복: {response['findingId']}")
        response_ids.add(response["findingId"])
        if response.get("status") not in FEEDBACK_STATUSES:
            raise ValueError(f"{response['findingId']}: 피드백 처리 상태가 필요합니다")
    return screen_map


def render(data, base):
    data = copy.deepcopy(data)
    screens = validate_and_load(data, base)
    stage = data["stage"]
    findings = data["findings"]
    feedback_responses = {row["findingId"]: row for row in data.get("feedbackResponses", [])}
    finding_numbers = {row["id"]: index + 1 for index, row in enumerate(findings)}
    sections = []
    for screen_index, screen in enumerate(screens.values(), 1):
        image = screen["image"]
        rows = [(finding_numbers[row["id"]], row) for row in findings if row["screenId"] == screen["id"]]
        pins = []
        cards = []
        for number, row in rows:
            rect = row["rect"]
            left, top = rect["x"] / image["width"] * 100, rect["y"] / image["height"] * 100
            width, height = rect["width"] / image["width"] * 100, rect["height"] / image["height"] * 100
            pins.append(f'<span class="issue-box" style="left:{left:.4f}%;top:{top:.4f}%;width:{width:.4f}%;height:{height:.4f}%" aria-hidden="true"></span><button class="pin" id="pin-{number}" type="button" data-jump="finding-{number}" style="left:{left:.4f}%;top:{top:.4f}%" aria-label="문제 {number}: {esc(row["title"])} 상세 보기">{number}</button>')
            recommendation_html = ""
            if stage in {"recommendations", "verification"}:
                options = []
                for rec in row["recommendations"]:
                    preview = ""
                    if rec.get("image"):
                        preview += f'<img class="recommendation-image" src="{rec["image"]["uri"]}" alt="{esc(rec["title"])} 렌더 미리보기" loading="lazy">'
                    if rec.get("video"):
                        preview += f'<video class="recommendation-video" controls preload="metadata" src="{rec["video"]["uri"]}" aria-label="{esc(rec["title"])} 모션 시연"></video>'
                    if rec.get("prototypeUrl"):
                        preview += f'<a class="prototype-link" href="{esc(rec["prototypeUrl"])}" target="_blank" rel="noopener noreferrer">작동하는 원형 열기 ↗</a>'
                    options.append(f'<article class="option"><div class="option-kicker">추천안 {esc(rec["id"])}</div><h5>{esc(rec["title"])}</h5><p>{esc(rec["reason"])}</p><p class="tradeoff">고려할 점 · {esc(rec["tradeoff"])}</p>{preview}</article>')
                recommendation_html = '<div class="option-grid">' + "".join(options) + '</div>'
            verification_html = ""
            if stage == "verification":
                comparison = ""
                if row.get("afterImage"):
                    comparison = f'<div class="compare"><figure><img src="{image["uri"]}" alt="수정 전 화면" loading="lazy"><figcaption>수정 전</figcaption></figure><figure><img src="{row["afterImage"]["uri"]}" alt="수정 후 화면" loading="lazy"><figcaption>수정 후</figcaption></figure></div>'
                verification_html = f'<div class="verification"><strong>재검증 {esc(row["verificationResult"])}</strong><p>{esc(row["verificationNote"])}</p>{comparison}</div>'
            feedback_response_html = ""
            if row["id"] in feedback_responses:
                response = feedback_responses[row["id"]]
                feedback_response_html = f'<div class="feedback-response"><strong>이전 의견 처리 · {FEEDBACK_STATUSES[response["status"]]}</strong><p><b>사용자 의견</b>{esc(response["userComment"])}</p><p><b>처리 결과</b>{esc(response["response"])}</p></div>'
            cards.append(f'''<details class="finding" id="finding-{number}" data-finding-id="{esc(row["id"])}" tabindex="-1">
              <summary><span class="finding-num">{number:02d}</span><span><span class="severity {esc(row["severity"])}">{SEVERITIES[row["severity"]]}</span><strong>{esc(row["title"])}</strong></span><span class="expand" aria-hidden="true">↗</span></summary>
              <div class="detail"><p><b>실제 관찰</b>{esc(row["observed"])}</p><p><b>사용자 영향</b>{esc(row["impact"])}</p><p><b>화면 근거</b>{esc(row["evidence"])}</p><p><b>재확인 조건</b>{esc(row["verify"])}</p><button class="locate" type="button" data-jump="pin-{number}">화면의 {number}번 위치 보기</button>{feedback_response_html}{recommendation_html}{verification_html}
              <div class="feedback"><label for="feedback-{number}">이 문제에 대한 의견</label><select id="decision-{number}" data-decision="{esc(row["id"])}" aria-label="문제 {number} 검토 결정"><option value="unreviewed">검토 전</option><option value="accept">수용</option><option value="revise">수정 요청</option><option value="reject">반려</option></select><textarea id="feedback-{number}" data-feedback="{esc(row["id"])}" rows="3" placeholder="의견을 적고 저장하세요"></textarea><button class="save-feedback" type="button">의견 저장</button></div></div>
            </details>''')
        max_width = 440 if image["height"] > image["width"] else 920
        sections.append(f'''<section class="screen" id="screen-{screen_index}"><div class="screen-head"><div><span class="eyebrow">SCREEN {screen_index:02d} / {esc(screen["state"])}</span><h2>{esc(screen["title"])}</h2><p>{esc(screen["capturePath"])}</p></div><span class="screen-count">문제 {len(rows)}건</span></div><div class="screen-grid"><div class="capture"><div class="shot" style="--frame-max:{max_width}px"><img src="{image["uri"]}" alt="{esc(screen["title"])} 실제 캡처" width="{image["width"]}" height="{image["height"]}">{''.join(pins)}</div><p class="caption">{esc(screen["device"])} · {esc(screen["viewport"])} · PNG {image["width"]}×{image["height"]}px · {esc(screen["state"])}</p></div><div class="finding-list">{''.join(cards) if cards else '<p class="empty">이 캡처에서 확정된 문제 없음. 다른 상태의 합격을 뜻하지 않습니다.</p>'}</div></div></section>''')
    stage_links = data.get("stageReports") or {}
    if not isinstance(stage_links, dict):
        raise ValueError("stageReports는 단계별 HTML 링크 객체여야 합니다")
    stage_nav_parts = []
    for key, label in STAGES.items():
        link = stage_links.get(key)
        if link:
            if not isinstance(link, str):
                raise ValueError(f"stageReports.{key}: 문자열 링크 필요")
            scheme = urlparse(link).scheme
            if scheme not in {"", "http", "https"} or link.startswith("//"):
                raise ValueError(f"stageReports.{key}: 허용되지 않은 링크")
            stage_nav_parts.append(f'<a class="stage-step {"current" if key == stage else ""}" href="{esc(link)}">{esc(label)}</a>')
        else:
            stage_nav_parts.append(f'<span class="stage-step {"current" if key == stage else ""}">{esc(label)}</span>')
    stage_nav = "".join(stage_nav_parts)
    counts = {key: sum(row["severity"] == key for row in findings) for key in SEVERITIES}
    not_reviewed = data.get("notReviewed", [])
    not_reviewed_html = "".join(f"<li>{esc(row)}</li>" for row in not_reviewed) or "<li>기록된 미검토 범위 없음</li>"
    template = TEMPLATE.read_text(encoding="utf-8")
    values = {"__TITLE__": esc(data["project"]), "__PURPOSE__": esc(data["purpose"]), "__DATE__": esc(data["reviewedAt"]),
              "__STAGE__": esc(STAGES[stage]), "__STAGE_NAV__": stage_nav, "__REPORT_ID__": esc(data["reportId"]),
              "__SCREEN_COUNT__": str(len(screens)), "__FINDING_COUNT__": str(len(findings)),
              "__BLOCKER_COUNT__": str(counts["blocker"]), "__MAJOR_COUNT__": str(counts["major"]), "__MINOR_COUNT__": str(counts["minor"]),
              "__SCREEN_SECTIONS__": "".join(sections), "__NOT_REVIEWED__": not_reviewed_html}
    for key, value in values.items():
        template = template.replace(key, value)
    return template


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    output = render(data, args.input.parent)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(output, encoding="utf-8")
    print(json.dumps({"out": str(args.out), "stage": data["stage"], "screens": len(data["screens"]), "findings": len(data["findings"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
