"""Build source-vs-internal action boards for verified shared motion cores."""

import argparse
import html
import json
from pathlib import Path

from bs4 import BeautifulSoup

from build_motion_fidelity_page import SHIM


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-html", type=Path, required=True)
    parser.add_argument("--progress-json", type=Path, required=True)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--count", type=int, default=6)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    source = BeautifulSoup(args.source_html.read_text(encoding="utf-8"), "html.parser")
    groups = json.loads(args.progress_json.read_text(encoding="utf-8"))["canonicalGroups"]
    rows = []
    for group in groups[args.start : args.start + args.count]:
        motion_id = group["canonicalMotionId"]
        card = source.select_one("#m-" + motion_id)
        if not card or not card.iframe or not card.iframe.get("srcdoc"):
            raise ValueError("Missing original source: " + motion_id)
        srcdoc = card.iframe["srcdoc"].replace("<body>", "<body>" + SHIM, 1)
        rows.append(
            '<div class="row"><section><h2>'
            + html.escape(motion_id)
            + ' · original</h2><iframe srcdoc="'
            + html.escape(srcdoc, quote=True)
            + '"></iframe></section><section><h2>'
            + html.escape(motion_id)
            + ' · internal</h2><canvas data-id="'
            + html.escape(motion_id, quote=True)
            + '" width="800" height="254"></canvas></section></div>'
        )
    page = """<!doctype html><html lang="ko"><meta charset="utf-8"><title>Verified motion source comparison</title>
<style>*{box-sizing:border-box}body{margin:0;background:#e7e9ed;font:14px system-ui}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:8px;border-bottom:2px solid #a0a5ad}section{min-width:0}h2{margin:0 0 4px;font-size:14px}iframe,canvas{display:block;width:100%;height:270px;border:1px solid #aaa;background:white}canvas{object-fit:contain;background:#ddd}</style><main>""" + "".join(rows) + """</main>
<script type="module">
import {renderVerified} from '../../layout/motion-verified-engine.mjs';
const ms=Math.max(0,Math.min(30000,Number(new URLSearchParams(location.search).get('ms'))||0));
window.seek=async()=>{for(const frame of document.querySelectorAll('iframe')){
 const w=frame.contentWindow;const animations=w.document.getAnimations({subtree:true});
 await Promise.all(animations.map(a=>a.ready));
 for(const a of animations){a.pause();a.currentTime=ms;try{a.commitStyles();a.cancel()}catch{}}
 if(w.__auditStep)w.__auditStep(ms);
 }for(const canvas of document.querySelectorAll('canvas[data-id]'))renderVerified(canvas,canvas.dataset.id,ms/1000);
 document.body.dataset.auditDone=String(ms)};
addEventListener('DOMContentLoaded',()=>setTimeout(window.seek,650));
</script></html>"""
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(page, encoding="utf-8")
    print(f"{len(rows)} source/internal rows → {args.out}")


if __name__ == "__main__":
    main()
