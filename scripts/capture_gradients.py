"""Capture computed CSS gradients on the 30 previously sampled homepages."""
import json
import argparse
import subprocess
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROFILES = json.loads((ROOT / 'knowledge/web-style-profiles.json').read_text())['profiles']
OUTPUT = ROOT / 'knowledge/web-gradient-observations.json'
SCRIPT = r"""(() => {
  const found = [], seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const box = el.getBoundingClientRect();
    if (box.width < 12 || box.height < 8) continue;
    const css = getComputedStyle(el).backgroundImage;
    if (!css || !/gradient\(/i.test(css) || seen.has(css)) continue;
    seen.add(css);
    found.push({tag:el.tagName.toLowerCase(),className:typeof el.className==='string'?el.className.slice(0,120):'',css,width:Math.round(box.width),height:Math.round(box.height),inFirstViewport:box.bottom>0&&box.top<innerHeight});
  }
  found.sort((a,b)=>(Number(b.inFirstViewport)-Number(a.inFirstViewport)) || (b.width*b.height-a.width*a.height));
  return {url:location.href,title:document.title,totalUnique:found.length,gradients:found.slice(0,10)};
})()"""

def browser(*args):
    result = subprocess.run(['agent-browser', *args], capture_output=True, text=True, timeout=35)
    if result.returncode:
        raise RuntimeError((result.stderr or result.stdout).strip()[:240])
    return result.stdout

parser = argparse.ArgumentParser()
parser.add_argument('--retry-errors', action='store_true')
args = parser.parse_args()
existing = {row['siteId']:row for row in json.loads(OUTPUT.read_text())['observations']} if args.retry_errors and OUTPUT.exists() else {}
rows = []
for index, profile in enumerate(PROFILES, 1):
    if args.retry_errors and profile['id'] in existing and 'error' not in existing[profile['id']]:
        rows.append(existing[profile['id']]);continue
    row = {'siteId': profile['id'], 'sourceUrl': profile['url'], 'checkedAt': date.today().isoformat()}
    try:
        browser('open', profile['url'])
        row['observation'] = json.loads(browser('eval', SCRIPT))
        print(f"{index:02d}/30 {profile['id']}: {row['observation']['totalUnique']} unique", flush=True)
    except Exception as exc:
        row['error'] = str(exc)
        print(f"{index:02d}/30 {profile['id']}: ERROR {exc}", flush=True)
    rows.append(row)

OUTPUT.write_text(json.dumps({'schemaVersion':'1.0','method':'computed background-image of loaded homepage DOM; up to ten distinct gradients per site','observations':rows}, ensure_ascii=False, indent=2)+'\n')
print(OUTPUT, flush=True)
