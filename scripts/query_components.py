"""Search locally authored component knowledge without installing a UI library."""
import argparse,json
from pathlib import Path
p=argparse.ArgumentParser(description='역할·요소·과업으로 컴포넌트 패턴 목록을 검색합니다.')
p.add_argument('--query',default='');p.add_argument('--family',default='');p.add_argument('--kind',default='');p.add_argument('--limit',type=int,default=10);p.add_argument('--list-families',action='store_true')
a=p.parse_args();d=json.loads((Path(__file__).resolve().parents[1]/'knowledge/affectui-components.json').read_text())
if a.list_families:print(json.dumps(sorted({e['family'] for e in d['entries']}),ensure_ascii=False,indent=2));raise SystemExit()
terms=a.query.casefold().split();rows=[]
for e in d['entries']:
 hay=' '.join([e['name'],e['slug'],e['sourceCategory'],e['family'],e['role'],e['selectionNote'],*e['anatomy'],*e['canonicalKinds']]).casefold()
 if terms and not all(t in hay for t in terms):continue
 if a.family and a.family.casefold() not in e['family'].casefold():continue
 if a.kind and a.kind not in e['canonicalKinds']:continue
 rows.append(e)
print(json.dumps(dict(matches=len(rows),shown=min(len(rows),max(a.limit,0)),scope='자체 재해석 후보. 실제 행동·터치 크기·간격을 검증한 결과 아님.',spatialContract=d['spatialContract'],entries=rows[:max(a.limit,0)]),ensure_ascii=False,indent=2))
