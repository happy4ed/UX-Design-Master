"""Build a local side-by-side source/internal motion audit page.

The generated page embeds original demos from a saved research snapshot. It is
temporary audit evidence, never a runtime dependency of the design skill.
Serve the output from the repository root so the local internal preview loads.
"""

import argparse
import html
from pathlib import Path

from bs4 import BeautifulSoup


SHIM = """<script>
window.__auditNow=0;window.__auditRaf=[];
Object.defineProperty(performance,'now',{configurable:true,value:()=>window.__auditNow});
window.requestAnimationFrame=fn=>{window.__auditRaf.push(fn);return window.__auditRaf.length};
window.__auditStep=ms=>{window.__auditNow=ms;for(const fn of window.__auditRaf.splice(0))fn(ms)};
</script>"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-html", type=Path, required=True)
    parser.add_argument("--ids", nargs="+", required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    source = BeautifulSoup(args.source_html.read_text(encoding="utf-8"), "html.parser")
    rows = []
    for motion_id in args.ids:
        card = source.select_one("#m-" + motion_id)
        if not card or not card.iframe or not card.iframe.get("srcdoc"):
            raise ValueError("original demo missing: " + motion_id)
        srcdoc = card.iframe["srcdoc"].replace("<body>", "<body>" + SHIM, 1)
        safe_id = html.escape(motion_id, quote=True)
        rows.append(
            f'<div class="row"><section><h2>{safe_id} · original</h2>'
            f'<iframe class="original" srcdoc="{html.escape(srcdoc, quote=True)}"></iframe></section>'
            f'<section><h2>{safe_id} · internal</h2>'
            f'<iframe class="internal" data-id="{safe_id}"></iframe></section></div>'
        )
    page = """<!doctype html><html lang="en"><meta charset="utf-8"><title>Motion fidelity audit</title>
<style>*{box-sizing:border-box}body{margin:0;background:#e7e9ed;font:14px system-ui}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:10px;border-bottom:2px solid #a0a5ad}section{min-width:0}h2{margin:0 0 5px;font-size:14px}iframe{display:block;width:100%;height:320px;border:1px solid #aaa;background:white}</style>
<main>""" + "".join(rows) + """</main><script>
const params=new URLSearchParams(location.search);
const ms=Math.max(0,Math.min(30000,Number(params.get('sourceMs')??params.get('auditMs'))||0));
const phase=Math.max(0,Math.min(1,Number(params.get('internalPhase'))||0));
for(const frame of document.querySelectorAll('iframe.internal')){
  frame.src='/skills/ux-design-master/samples/motion-414-lab.html?auditPhase='+phase+'#'+frame.dataset.id;
  frame.addEventListener('load',()=>{
    const doc=frame.contentDocument;
    if(!doc)return;
    const style=doc.createElement('style');
    style.textContent='html,body{width:100%;height:100%;margin:0;overflow:hidden!important}.shell{padding:0!important;margin:0!important;max-width:none!important}.mast,.viewer-head,.toolbar,.meta,.library,.footer{display:none!important}.layout,.viewer{display:block!important;margin:0!important}.stage{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;min-height:0!important;border-radius:0!important;box-shadow:none!important}';
    doc.head.append(style);
    setTimeout(()=>{frame.dataset.auditTransform=doc.querySelector('.stage')?.dataset.auditTransforms||'';frame.dataset.auditState=doc.querySelector('.stage')?.dataset.auditState||''},900);
  });
}
window.seek=async()=>{
  for(const frame of document.querySelectorAll('iframe.original')){
    const w=frame.contentWindow;
    const animations=w.document.getAnimations({subtree:true});
    await Promise.all(animations.map(a=>a.ready));
    for(const a of animations){a.pause();a.currentTime=ms;try{a.commitStyles();a.cancel()}catch{}}
    if(w.__auditStep)w.__auditStep(ms);
  }
  document.body.dataset.auditDone=String(ms);
};
addEventListener('DOMContentLoaded',()=>setTimeout(window.seek,550));
</script></html>"""
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(page, encoding="utf-8")
    print(args.out)


if __name__ == "__main__":
    main()
