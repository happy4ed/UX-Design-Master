#!/usr/bin/env python3
"""Measure Korean word splits, overflow, and obscured controls in rendered HTML.

This is an independent, internal implementation. Exit codes: 0 clean,
1 measured failures, 2 inspection could not run. Orphans are warnings.
"""

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


MEASURE = r"""(scopeSelector) => {
  const scope = document.querySelector(scopeSelector);
  if (!scope) return { error: `Scope not found: ${scopeSelector}` };
  const hangul = /[\uAC00-\uD7A3]/u;
  const word = /[\uAC00-\uD7A3\u3131-\u318E\p{L}\p{N}]/u;
  const space = /[\s\u00A0\u200B]/u;
  const blockTags = new Set(['H1','H2','H3','H4','H5','H6','P','LI','TD','TH','BUTTON','A','LABEL','FIGCAPTION','BLOCKQUOTE','DD','DT']);
  const ignoreTags = new Set(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','OPTION','TEXTAREA']);
  const issues = [];
  const blocks = new Map();
  let budget = 60000;
  const visible = el => {
    for (let n=el;n && n!==document.documentElement;n=n.parentElement) {
      const s=getComputedStyle(n);
      if (s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse') return false;
    }
    return el.getClientRects().length>0;
  };
  const owner = node => {
    let p=node.parentElement;
    while (p && p!==scope && !blockTags.has(p.tagName)) p=p.parentElement;
    return p||node.parentElement;
  };
  const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
  let n;
  while ((n=walker.nextNode()) && budget>0) {
    const p=n.parentElement;
    if (!p||ignoreTags.has(p.tagName)||!n.nodeValue.trim()||!visible(p)) continue;
    const root=owner(n);
    if (!root||!visible(root)) continue;
    if (!blocks.has(root)) blocks.set(root,[]);
    blocks.get(root).push(n);
    budget-=n.nodeValue.length;
  }
  const ident=el => el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'');
  const role=el => {
    if (el.closest('pre,code,kbd,samp')) return 'code';
    if (/^H[1-6]$/.test(el.tagName)) return 'heading';
    if (el.matches('td,th,button') || el.getBoundingClientRect().width/(parseFloat(getComputedStyle(el).fontSize)||16)<9) return 'narrow';
    return 'body';
  };
  const scrollable=el => {for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);if(/^(auto|scroll)$/.test(s.overflowX))return true;}return false;};
  for (const [el,nodes] of blocks) {
    const chars=[];
    let lastNode=null;
    for (const node of nodes) {
      if (lastNode && lastNode!==node) {
        const between=document.createRange();
        try { between.setStartAfter(lastNode);between.setEndBefore(node);if(between.cloneContents().querySelector('br')) chars.push({break:true}); } catch {}
      }
      for (let i=0;i<node.length;i++) {
        const ch=node.data[i];
        if (space.test(ch)){chars.push({space:true});continue;}
        const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);
        const rect=[...range.getClientRects()].find(r=>r.width>0&&r.height>0);
        if(rect) chars.push({ch,top:rect.top,height:rect.height});
      }
      lastNode=node;
    }
    let prev=null,gap=false,line=0,lastTop=null;
    const lines=[''];
    for(const c of chars){
      if(c.space||c.break){gap=true;if(lines[line]&&!lines[line].endsWith(' '))lines[line]+=' ';continue;}
      if(lastTop!==null&&Math.abs(c.top-lastTop)>Math.max(3,c.height*.45)){line++;lines[line]='';}
      c.line=line;lastTop=c.top;lines[line]+=c.ch;
      if(prev&&!gap&&prev.line!==c.line&&word.test(prev.ch)&&word.test(c.ch)&&(hangul.test(prev.ch)||hangul.test(c.ch))){
        issues.push({kind:'split',element:ident(el),role:role(el),snippet:`${prev.ch}/${c.ch}`,line:c.line});
      }
      prev=c;gap=false;
    }
    const fullLines=lines.map(x=>x.trim()).filter(Boolean);
    if(fullLines.length>1&&role(el)!=='narrow'){
      const tail=fullLines.at(-1).replace(/\s/g,'');
      if(tail.length<=2&&hangul.test(tail)) issues.push({kind:'orphan',element:ident(el),role:role(el),snippet:tail});
    }
    const cs=getComputedStyle(el);
    if(el.clientWidth>0&&el.scrollWidth>el.clientWidth+1&&!scrollable(el)&&cs.textOverflow!=='ellipsis'){
      issues.push({kind:'overflow',element:ident(el),role:role(el),pixels:Math.round(el.scrollWidth-el.clientWidth)});
    }
  }
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push({kind:'page-overflow',element:'html',pixels:document.documentElement.scrollWidth-innerWidth});
  const taps=[...scope.querySelectorAll('button,a[href],[role="button"],input[type="button"],input[type="submit"],summary')];
  for(const el of taps){
    if(!visible(el))continue;
    const name=(el.innerText||el.value||el.getAttribute('aria-label')||'').trim();
    if(!name)continue;
    const css=getComputedStyle(el);
    if(css.textOverflow!=='ellipsis'&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1)){
      issues.push({kind:'control-clipped',element:ident(el),label:name.slice(0,50)});
    }
    el.scrollIntoView({block:'center',inline:'center'});
    const r=el.getBoundingClientRect();
    if(r.width>0&&r.height>0){
      const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      if(!hit||!(hit===el||el.contains(hit)))issues.push({kind:'control-blocked',element:ident(el),label:name.slice(0,50),by:hit?ident(hit):'outside-viewport'});
    }
  }
  return {issues,scannedBlocks:blocks.size,scannedControls:taps.length,truncated:budget<=0};
}"""


SCALE_TEXT = r"""(factor) => {
  for(const el of document.body.querySelectorAll('*')){
    const style=getComputedStyle(el),size=parseFloat(style.fontSize);
    if(size)el.style.setProperty('font-size',`${size*factor}px`,'important');
    if(style.lineHeight.endsWith('px'))el.style.setProperty('line-height',`${parseFloat(style.lineHeight)*factor}px`,'important');
  }
}"""


def numbers(value):
    return [int(x) for x in value.split(",") if x.strip()]


def target_url(value):
    parsed = urlparse(value)
    if parsed.scheme in ("http", "https", "file"):
        return value
    path = Path(value).resolve()
    if not path.is_file():
        raise ValueError(f"HTML file not found: {value}")
    return path.as_uri()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", help="HTTP URL or local HTML file")
    parser.add_argument("--widths", default="390,768,1280")
    parser.add_argument("--text", default="150,200", help="Percent scales in addition to 100")
    parser.add_argument("--zoom", default="200", help="Approximate browser zoom by reducing CSS viewport width")
    parser.add_argument("--scope", default="body")
    parser.add_argument("--cdp-url", help="Use an already-running Chromium CDP endpoint")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    try:
        url = target_url(args.target)
        widths = numbers(args.widths)
        variants = [("base", 100)] + [("text", n) for n in numbers(args.text)] + [("zoom", n) for n in numbers(args.zoom)]
        if not widths or any(n<180 for n in widths) or any(p<=100 or p>400 for mode,p in variants if mode!="base"):
            raise ValueError("Invalid width or scale")
        cases=[]
        with sync_playwright() as playwright:
            browser=(playwright.chromium.connect_over_cdp(args.cdp_url) if args.cdp_url
                     else playwright.chromium.launch(headless=True))
            try:
                for width in widths:
                    for mode,percent in variants:
                        css_width=round(width*100/percent) if mode=="zoom" else width
                        page=browser.new_page(viewport={"width":css_width,"height":900})
                        try:
                            page.goto(url,wait_until="domcontentloaded",timeout=15000)
                            page.evaluate("document.fonts.ready")
                            if mode=="text": page.evaluate(SCALE_TEXT,percent/100)
                            result=page.evaluate(MEASURE,args.scope)
                            if result.get("error"):raise ValueError(result["error"])
                            cases.append({"width":width,"cssWidth":css_width,"mode":mode,"percent":percent,**result})
                        finally:
                            page.close()
            finally:
                browser.close()
        blockers={"split","overflow","page-overflow","control-clipped","control-blocked"}
        failures=sum(item["kind"] in blockers for case in cases for item in case["issues"])
        output={"target":url,"cases":cases,"failureCount":failures,"status":"FAIL" if failures else "PASS",
                "note":"Text scaling and zoom are browser approximations; verify on supported devices."}
        if args.json: print(json.dumps(output,ensure_ascii=False,indent=2))
        else:
            print(f"Korean wrap: {output['status']} · {failures} failures · {len(cases)} cases")
            for case in cases:
                if case["issues"]:
                    print(f"  {case['width']}px {case['mode']} {case['percent']}%:")
                    for issue in case["issues"][:12]:print(f"    {issue['kind']}: {issue['element']} {issue.get('snippet',issue.get('label',''))}")
        return 1 if failures else 0
    except Exception as exc:
        print(f"Korean wrap: NOT_RUN · {exc}",file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
