"""Build an offline font menu that never pretends a missing font is rendered."""
import argparse
import html
import json
from pathlib import Path
from query_fonts import DATA, installed


def make_page():
    entries = [{**row, "installed": installed(row["name"])} for row in DATA["families"]]
    entries.sort(key=lambda row: (row["installed"] is not True, row["name"]))
    cards = []
    for row in entries:
        family = html.escape(row["name"], quote=True)
        status = "설치 확인" if row["installed"] else "파일 미연결·미확인"
        style = f' style="font-family:&quot;{family}&quot;,sans-serif"' if row["installed"] else ""
        cards.append(f'<article class="card" data-roles="{html.escape(" ".join(row["roles"]))}" data-scripts="{html.escape(" ".join(row["scripts"]))}"><div class="top"><strong>{family}</strong><span class="{("ok" if row["installed"] else "missing")}">{status}</span></div><p class="sample"{style}>한글 문장의 균형과 숫자 0123456789<br>Design starts with meaning. تجربة عربية</p><small>{html.escape(row["character"])} · {html.escape(", ".join(row["roles"]))}</small><p class="avoid">주의: {html.escape(row["avoid"])}</p></article>')
    pairings = []
    by_id = {row["id"]: row for row in entries}
    for pair in DATA["pairings"]:
        body, display = by_id[pair["body"]], by_id[pair["display"]]
        ready = body["installed"] and display["installed"]
        pairings.append(f'<tr><td>{html.escape(body["name"])} + {html.escape(display["name"])}</td><td>{html.escape(pair["use"])}</td><td>{html.escape(pair["rule"])}</td><td>{"둘 다 설치" if ready else "파일 연결 후 비교"}</td></tr>')
    return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>폰트 선택 검토</title><style>body{{margin:0;background:#f5f4ef;color:#1f303b;font-family:Pretendard,Arial,sans-serif}}main{{max-width:1160px;margin:auto;padding:32px 20px 80px}}h1{{font-size:clamp(28px,4vw,42px);margin:0 0 8px}}p{{line-height:1.5}}.intro{{max-width:760px;color:#536477}}.controls{{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}}label{{font-size:13px;font-weight:700}}select,input{{display:block;margin-top:6px;min-height:44px;padding:9px;border:1px solid #adbdb9;background:white;font:inherit}}input{{width:min(360px,80vw)}}.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}}.card{{padding:17px;background:#fff;border:1px solid #ced8d3;min-width:0}}.top{{display:flex;justify-content:space-between;gap:10px;align-items:baseline}}.top strong{{font-size:17px}}.top span{{font-size:11px;white-space:nowrap}}.ok{{color:#0d7063}}.missing{{color:#945b2d}}.sample{{font-size:22px;line-height:1.45;min-height:78px;margin:13px 0;overflow-wrap:anywhere}}.card:has(.missing) .sample{{color:#8a9494}}small,.avoid{{font-size:12px;color:#536477}}.avoid{{margin:10px 0 0}}table{{border-collapse:collapse;width:100%;min-width:700px}}th,td{{border-bottom:1px solid #ced8d3;padding:10px;text-align:left;font-size:13px}}.table-wrap{{overflow:auto;background:white}}h2{{margin-top:42px}}</style></head><body><main><h1>폰트 선정 검토</h1><p class="intro">내부 후보 {len(entries)}종·조합 {len(pairings)}종. 현재 시스템에서 정확한 이름으로 설치가 확인된 서체만 그 서체로 렌더합니다. 미연결 후보의 문장은 기본 폰트로 표시하며 실제 모양을 대표하지 않습니다.</p><div class="controls"><label>사용 맥락<select id="context"><option value="">전체</option>{''.join(f'<option value="{html.escape(x)}">{html.escape(x)}</option>' for x in DATA["contexts"])}</select></label><label>문자권<select id="script"><option value="">전체</option><option value="ko">한글</option><option value="latn">라틴</option><option value="arab">아랍어</option></select></label><label>실제 문구<input id="sample" value="한글 문장의 균형과 숫자 0123456789"></label></div><div class="grid" id="grid">{''.join(cards)}</div><h2>조합 후보</h2><div class="table-wrap"><table><thead><tr><th>본문 + 제목</th><th>용도</th><th>검토 규칙</th><th>현재 상태</th></tr></thead><tbody>{''.join(pairings)}</tbody></table></div></main><script>const cards=[...document.querySelectorAll('.card')];function update(){{const role=document.querySelector('#context').value,script=document.querySelector('#script').value,sample=document.querySelector('#sample').value;for(const card of cards){{card.hidden=!!((role&&!card.dataset.roles.split(' ').includes(role))||(script&&!card.dataset.scripts.split(' ').includes(script)));card.querySelector('.sample').innerHTML=sample.replace(/[&<>]/g,ch=>({{'&':'&amp;','<':'&lt;','>':'&gt;'}}[ch]))+'<br>Design starts with meaning. تجربة عربية'}}}}document.querySelectorAll('select,input').forEach(el=>{{el.addEventListener('input',update);el.addEventListener('change',update)}});update();</script></body></html>'''


def main():
    parser = argparse.ArgumentParser(description="로컬 글꼴 설치 상태가 표시된 오프라인 프리뷰를 만듭니다.")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    Path(args.out).write_text(make_page(), encoding="utf-8")
    print(json.dumps({"out": args.out, "families": len(DATA["families"]), "installed": sum(installed(row["name"]) is True for row in DATA["families"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
