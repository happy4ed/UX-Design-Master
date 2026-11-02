"""Create a local, deterministic viewing page for two original motion demos.

This is a temporary research workbench. It embeds source demos from a saved
snapshot into /tmp; it is not a runtime dependency of the design skill.
"""

import argparse
import html
from pathlib import Path

from bs4 import BeautifulSoup


SHIM = """<script>
window.__auditNow=0; window.__auditRaf=[];
Object.defineProperty(performance,'now',{configurable:true,value:()=>window.__auditNow});
window.requestAnimationFrame=fn=>{window.__auditRaf.push(fn);return window.__auditRaf.length};
window.__auditStep=ms=>{window.__auditNow=ms;for(const fn of window.__auditRaf.splice(0))fn(ms)};
</script>"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-html", type=Path, required=True)
    parser.add_argument("--ids", nargs="+", required=True)
    parser.add_argument("--out", type=Path, default=Path("/tmp/motion-original-pair.html"))
    parser.add_argument("--live", action="store_true", help="Let original demos run naturally instead of freezing requestAnimationFrame")
    args = parser.parse_args()
    if len(args.ids) < 2 or len(args.ids) % 2:
        parser.error("--ids requires an even number of motion IDs")
    source = BeautifulSoup(args.source_html.read_text(encoding="utf-8"), "html.parser")
    frames = []
    for motion_id in args.ids:
        card = source.select_one("#m-" + motion_id)
        if not card or not card.iframe or not card.iframe.get("srcdoc"):
            raise ValueError("original demo missing: " + motion_id)
        srcdoc = card.iframe["srcdoc"]
        if not args.live:
            srcdoc = srcdoc.replace("<body>", "<body>" + SHIM, 1)
        frames.append(f'<section><h2>{html.escape(motion_id)}</h2><iframe srcdoc="{html.escape(srcdoc, quote=True)}"></iframe></section>')
    rows = [f'<div class="pair">{frames[i]}{frames[i + 1]}</div>' for i in range(0, len(frames), 2)]
    page = """<!doctype html><html lang="en"><meta charset="utf-8"><title>Original motion pair audit</title>
    <style>*{box-sizing:border-box}body{margin:0;background:#e7e9ed;font:14px system-ui}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;border-bottom:2px solid #a0a5ad}section{min-width:0}h2{margin:0 0 7px;font-size:16px}iframe{display:block;width:100%;height:235px;border:1px solid #aaa;background:white}</style>
    <main>""" + "".join(rows) + """</main><script>
    window.seek=async function(ms){const freeze=new URLSearchParams(location.search).has('auditMs');for(const iframe of document.querySelectorAll('iframe')){
      const w=iframe.contentWindow;const animations=w.document.getAnimations({subtree:true});
      await Promise.all(animations.map(animation=>animation.ready));
      for(const animation of animations){animation.pause();animation.currentTime=ms;if(freeze){try{animation.commitStyles();animation.cancel();}catch{}}}
      iframe.dataset.rafBefore=String(w.__auditRaf?.length??-1);
      if(w.__auditStep)w.__auditStep(ms);
      iframe.dataset.rafAfter=String(w.__auditRaf?.length??-1);
      iframe.dataset.canvasWidth=String(w.document.querySelector('canvas')?.width??-1);
    }document.body.dataset.auditDone=String(ms);await new Promise(r=>setTimeout(r,30));return {time:ms,frames:document.querySelectorAll('iframe').length};};
    const auditRaw=new URLSearchParams(location.search).get('auditMs');
    if(auditRaw!==null)addEventListener('DOMContentLoaded',()=>setTimeout(()=>window.seek(Math.max(0,Math.min(30000,Number(auditRaw)||0))),450));
    </script></html>"""
    args.out.write_text(page, encoding="utf-8")
    print(args.out)


if __name__ == "__main__":
    main()
