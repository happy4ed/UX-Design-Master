"""Query palette and gradient records without loading the full graph into context."""
import argparse
import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'knowledge/color-knowledge-graph.json'
graph = json.loads(path.read_text())
nodes = {node['id']:node for node in graph['nodes']}
parser = argparse.ArgumentParser()
parser.add_argument('--site', help='Site id, e.g. stripe')
parser.add_argument('--mobile', help='Mobile screen id, e.g. oneui9-settings-home')
parser.add_argument('--palette', help='Palette name/id, e.g. blue-hour')
parser.add_argument('--kind', choices=['palette','gradient','color','site','source','style_family','color_variant','gradient_candidate','mobile_screen','mobile_component'])
parser.add_argument('--query', default='')
parser.add_argument('--limit', type=int, default=12)
args = parser.parse_args()
results = []
for node in graph['nodes']:
    if args.kind and node['kind'] != args.kind: continue
    if args.site and not (node['id']=='site:'+args.site or node['id'].startswith(('palette:projection:'+args.site,'gradient:'+args.site+':','source:gradient:'+args.site,'variant:site:'+args.site+':','gradient-candidate:site:'+args.site+':'))): continue
    if args.mobile and not (node['id']=='mobile-screen:'+args.mobile or node['id'].startswith(('source:mobile:'+args.mobile,'mobile-component:'+args.mobile+':','gradient:mobile:'+args.mobile,'variant:mobile:'+args.mobile+':','gradient-candidate:mobile:'+args.mobile+':'))): continue
    if args.palette and args.palette.casefold() not in (node['id']+' '+node.get('name','')).casefold(): continue
    if args.query and args.query.casefold() not in json.dumps(node,ensure_ascii=False).casefold(): continue
    neighbors = [dict(relation=edge['relation'], node=nodes[edge['target']], **{k:v for k,v in edge.items() if k not in ('source','relation','target')}) for edge in graph['edges'] if edge['source']==node['id']]
    results.append({'node':node,'outgoing':neighbors})
    if len(results)>=args.limit: break
print(json.dumps({'count':len(results),'results':results},ensure_ascii=False,indent=2))
