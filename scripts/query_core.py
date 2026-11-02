"""Read the core component KB by role/name or ID, optionally with typed relations."""
from pathlib import Path
import argparse,json
p=argparse.ArgumentParser(description='Core UI KB의 정의·계층·결합 관계를 검색합니다.')
p.add_argument('--id',default='');p.add_argument('--query',default='');p.add_argument('--family',default='');p.add_argument('--level',choices=['component','visual','structure']);p.add_argument('--relations',action='store_true');p.add_argument('--limit',type=int,default=8)
a=p.parse_args();catalog=Path(__file__).resolve().parents[1]/'knowledge';d=json.loads((catalog/'core-components.json').read_text());phrases=json.loads((catalog/'ui-role-phrases.json').read_text());terms=a.query.casefold().split();aliasIds=phrases['phrases'].get(a.query.strip(),'').split()
rows=[]
for e in d['entries']:
 hay=' '.join([e['id'],e['name'],e['ko'],e['definition'],e['distinction'],*e['aliases'],*e['anatomy']]).casefold()
 if a.id and e['id']!=a.id:continue
 if a.family and e['family']!=a.family:continue
 if a.level and e['level']!=a.level:continue
 if aliasIds:
  if e['id'] not in aliasIds:continue
 elif not all(t in hay for t in terms):continue
 score=100-aliasIds.index(e['id']) if aliasIds else sum(10*(t in ' '.join([e['id'],e['name'],e['ko'],*e['aliases']]).casefold())+3*(t in e['definition'].casefold()) for t in terms)
 rows.append((score,e))
rows.sort(key=lambda x:-x[0]);shown=[e for _,e in rows[:max(a.limit,0)]];selected={e['id'] for e in shown}
out=dict(counting=d['counting'],matches=len(rows),entries=shown)
if aliasIds:out['roleQuestion']=[row for row in phrases['confusions'] if len(set(row['ids'])&selected)>1]
if a.relations:
 edges=[e for e in d['edges'] if e['source'] in selected or e['target'] in selected]
 junctionIds={e['target'] for e in edges if e['type']=='participates_in'}
 out.update(relationTypes=d['relationTypes'],edges=edges,junctions=[j for j in d['junctions'] if j['id'] in junctionIds])
print(json.dumps(out,ensure_ascii=False,indent=2))
