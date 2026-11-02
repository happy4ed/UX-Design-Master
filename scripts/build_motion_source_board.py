"""Build a local, seekable evidence board from a saved motion-menu HTML page."""

import argparse
import html
import re
from pathlib import Path


HOOK = """<script>
window.__auditNow=0;window.__auditRaf=[];
const __nativeMatchMedia=window.matchMedia.bind(window);
window.matchMedia=q=>q.includes('prefers-reduced-motion')?{matches:false}:__nativeMatchMedia(q);
Object.defineProperty(performance,'now',{configurable:true,value:()=>window.__auditNow});
window.requestAnimationFrame=fn=>{window.__auditRaf.push(fn);return window.__auditRaf.length};
window.__auditStep=ms=>{window.__auditNow=ms;for(const fn of window.__auditRaf.splice(0))fn(ms)};
</script>"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("ids", nargs="+")
    parser.add_argument("--live", action="store_true", help="Keep the original animation running")
    args = parser.parse_args()
    source = args.source.read_text()
    cards = []
    for motion_id in args.ids:
        article = re.search(
            rf'<article class="mo-card" id="m-{re.escape(motion_id)}"(.*?)</article>',
            source,
            re.S,
        )
        if not article:
            raise SystemExit(f"Missing motion: {motion_id}")
        iframe = re.search(r'<iframe[^>]*srcdoc="(.*?)"', article.group(1), re.S)
        if not iframe:
            raise SystemExit(f"Missing original demo: {motion_id}")
        content = html.unescape(iframe.group(1))
        if not args.live:
            content = content.replace("<body>", "<body>" + HOOK, 1)
        cards.append(
            f'<section><h2>{html.escape(motion_id)}</h2>'
            f'<iframe srcdoc="{html.escape(content, quote=True)}"></iframe></section>'
        )
    rows = [f'<div class="row">{"".join(cards[i:i+2])}</div>' for i in range(0, len(cards), 2)]
    board = """<!doctype html><html lang="en"><meta charset="utf-8"><title>Original motion evidence</title>
<style>*{box-sizing:border-box}body{margin:0;background:#e7e9ed;font:14px system-ui}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:8px;border-bottom:2px solid #a0a5ad}section{min-width:0}h2{margin:0 0 4px;font-size:14px}iframe{display:block;width:100%;height:270px;border:1px solid #aaa;background:white}</style><main>"""
    board += "".join(rows)
    if args.live:
        board += "</main></html>"
    else:
        board += """</main><script>
const ms=Number(new URLSearchParams(location.search).get('ms')||1200);
window.seek=async()=>{for(const frame of document.querySelectorAll('iframe')){
 const w=frame.contentWindow;
 for(let n=0;n<100;n++){
  if(w.document.readyState==='complete'&&(!w.document.querySelector('canvas')||w.__auditRaf?.length))break;
  await new Promise(resolve=>setTimeout(resolve,50));
 }
 const animations=w.document.getAnimations({subtree:true});
 await Promise.all(animations.map(a=>a.ready));
 for(const a of animations){a.pause();a.currentTime=ms;try{a.commitStyles();a.cancel()}catch{}}
 if(w.__auditStep){w.__auditStep(ms);w.__auditStep(ms)}
 }document.body.dataset.auditDone=String(ms)};
addEventListener('DOMContentLoaded',()=>window.seek());
</script></html>"""
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(board)
    print(f"Captured {len(cards)} original demos: {args.output}")


if __name__ == "__main__":
    main()
