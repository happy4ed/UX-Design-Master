"""Search the 30 original-source web style profiles without loading the full catalog."""
import argparse
import json
from pathlib import Path

data=json.loads((Path(__file__).resolve().parents[1]/'knowledge/web-style-profiles.json').read_text())['profiles']
families=json.loads((Path(__file__).resolve().parents[1]/'knowledge/style-families.json').read_text())['families']
family_by_site={site:family for family in families for site in family['members']}
ap=argparse.ArgumentParser()
ap.add_argument('--query',default='')
ap.add_argument('--kind',default='')
ap.add_argument('--name',default='')
ap.add_argument('--limit',type=int,default=6)
ap.add_argument('--list-kinds',action='store_true')
ap.add_argument('--diverse',action='store_true',help='return at most one site from each similar structural family')
ap.add_argument('--family',default='',help='filter by style-family id')
a=ap.parse_args()
if a.list_kinds:
    print('\n'.join(sorted({r['kind'] for r in data})))
    raise SystemExit
q=a.query.casefold()
rows=[]
seen_families=set()
for r in sorted(data,key=lambda item:(item['id']!=family_by_site[item['id']]['representative'],item['name'])) if a.diverse else data:
    if a.kind and r['kind']!=a.kind:continue
    if a.name and a.name.casefold() not in r['name'].casefold():continue
    p=r['projection'];hay=' '.join([r['name'],r['kind'],p['tone'],p['alignment'],p['surfaceMode'],p['surfaceDescription'],p['iconTreatment']]).casefold()
    if q and q not in hay:continue
    family=family_by_site[r['id']]
    if a.family and family['id']!=a.family:continue
    if a.diverse and family['id'] in seen_families:continue
    seen_families.add(family['id'])
    rows.append({'id':r['id'],'name':r['name'],'kind':r['kind'],'url':r['url'],'styleFamily':family['id'],'familyMembers':family['members'],'observed':{'heading':r['observed']['heading'],'gaps':r['observed']['gaps'],'radii':r['observed']['radii'],'leftAnchors':r['observed']['leftAnchors'],'iconElements':r['observed']['iconElements']},'projection':p})
print(json.dumps(rows[:max(0,a.limit)],ensure_ascii=False,indent=2))
