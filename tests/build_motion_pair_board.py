"""Build a source-only board for unresolved multi-term motion comparisons."""

import argparse
import html
import json
from pathlib import Path

from bs4 import BeautifulSoup

from build_motion_fidelity_page import SHIM


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-html", type=Path, required=True)
    parser.add_argument("--cluster-report", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    source = BeautifulSoup(args.source_html.read_text(encoding="utf-8"), "html.parser")
    report = json.loads(args.cluster_report.read_text(encoding="utf-8"))
    rows = []
    for group in report["multiTermCandidateGroups"]:
        for pair in group["unreviewed"]:
            cells = []
            for motion_id in (pair["a"], pair["b"]):
                card = source.select_one("#m-" + motion_id)
                if not card or not card.iframe or not card.iframe.get("srcdoc"):
                    raise ValueError("Missing original: " + motion_id)
                srcdoc = card.iframe["srcdoc"].replace("<body>", "<body>" + SHIM, 1)
                cells.append(f'<section><h2>{html.escape(motion_id)}</h2><iframe srcdoc="{html.escape(srcdoc, quote=True)}"></iframe></section>')
            rows.append('<div class="row">' + ''.join(cells) + '</div>')
    page = """<!doctype html><html lang="en"><meta charset="utf-8"><title>Original motion pair board</title>
<style>*{box-sizing:border-box}body{margin:0;background:#e7e9ed;font:14px system-ui}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:8px;border-bottom:2px solid #a0a5ad}section{min-width:0}h2{margin:0 0 4px;font-size:14px}iframe{display:block;width:100%;height:270px;border:1px solid #aaa;background:white}</style><main>""" + ''.join(rows) + """</main><script>
const ms=Math.max(0,Math.min(30000,Number(new URLSearchParams(location.search).get('ms'))||0));
window.seek=async()=>{for(const frame of document.querySelectorAll('iframe')){
 const w=frame.contentWindow;const animations=w.document.getAnimations({subtree:true});
 await Promise.all(animations.map(a=>a.ready));
 for(const a of animations){a.pause();a.currentTime=ms;try{a.commitStyles();a.cancel()}catch{}}
 if(w.__auditStep)w.__auditStep(ms);
 }document.body.dataset.auditDone=String(ms)};
addEventListener('DOMContentLoaded',()=>setTimeout(window.seek,650));
</script></html>"""
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(page, encoding="utf-8")
    print(f"{len(rows)} original pairs → {args.out}")


if __name__ == "__main__":
    main()
