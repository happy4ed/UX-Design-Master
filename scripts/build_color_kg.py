"""Build the internal, provenance-aware color and gradient knowledge graph."""
import json
import math
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = ROOT / 'knowledge'
old = json.loads((ROOT.parents[1] / 'artifacts/component-knowledge/style-map/style-map.json').read_text())
threads = json.loads((CAT / 'thread-palettes.json').read_text())
gradients = json.loads((CAT / 'web-gradient-observations.json').read_text())
expansions = json.loads((CAT / 'palette-expansions.json').read_text())['sites']
families = json.loads((CAT / 'style-families.json').read_text())['families']
variations = json.loads((CAT / 'color-variations.json').read_text())['sets']
mobile = json.loads((CAT / 'mobile-app-observations.json').read_text())['screens']
backdrops = {row['screenId']: row for row in json.loads((CAT / 'mobile-backdrop-observations.json').read_text())['screens']}
nodes, edges = {}, []

def blend(a, b, amount):
    """Mix two neutral anchors for an internal UI surface or rule."""
    av = [int(a[i:i+2], 16) for i in (1, 3, 5)]
    bv = [int(b[i:i+2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x * (1 - amount) + y * amount):02X}' for x, y in zip(av, bv))

def metrics(hex_value):
    rgb = [int(hex_value[i:i+2],16)/255 for i in (1,3,5)]
    linear = [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    red,green,blue = linear
    l=(.4122214708*red+.5363325363*green+.0514459929*blue)**(1/3)
    m=(.2119034982*red+.6806995451*green+.1073969566*blue)**(1/3)
    s=(.0883024619*red+.2817188376*green+.6299787005*blue)**(1/3)
    L=.2104542553*l+.7936177850*m-.0040720468*s
    a=1.9779984951*l-2.4285922050*m+.4505937099*s
    b=.0259040371*l+.7827717662*m-.8086757660*s
    luminance=.2126*red+.7152*green+.0722*blue
    return {'oklch':{'L':round(L,4),'C':round(math.hypot(a,b),4),'h':round(math.degrees(math.atan2(b,a))%360,1)},'relativeLuminance':round(luminance,5)}

def node(key, kind, **fields):
    nodes.setdefault(key, {**fields, 'id':key, 'kind':kind})
    return key

def edge(source, relation, target, **fields):
    edges.append({'source':source, 'relation':relation, 'target':target, **fields})

def color(raw):
    raw = raw.strip()
    key = 'color:' + raw.lower()
    hex_value = None
    if re.fullmatch(r'#[0-9a-fA-F]{6}', raw):
        hex_value = raw.upper()
    match = re.fullmatch(r'rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', raw)
    if match and all(int(v)<=255 for v in match.groups()):
        hex_value = '#' + ''.join(f'{int(v):02X}' for v in match.groups())
        key = 'color:' + hex_value.lower()
    node(key, 'color', css=raw, hex=hex_value, **(metrics(hex_value) if hex_value else {}))
    return key

thread_source = node('source:' + threads['source']['id'], 'source', **threads['source'])
for palette in threads['palettes']:
    pid = node('palette:threads:' + palette['id'], 'palette', name=palette['name'], ko=palette['ko'], family=palette['family'], evidenceClass='image-label', ordered='dark-to-light', imageIndex=palette['imageIndex'])
    edge(thread_source, 'presents_palette', pid, evidence='image-label')
    previous = None
    for index, swatch in enumerate(palette['swatchesDarkToLight']):
        cid = color(swatch)
        edge(pid, 'has_swatch', cid, order=index, role='tone', evidence='image-label')
        if previous:
            prev=nodes[previous]['relativeLuminance'];current=nodes[cid]['relativeLuminance']
            edge(previous, 'next_lighter_in', cid, palette=pid, contrastRatio=round((max(prev,current)+.05)/(min(prev,current)+.05),2), deltaOklchLightness=round(nodes[cid]['oklch']['L']-nodes[previous]['oklch']['L'],4))
        previous = cid

sample_source = node('source:style-map-30', 'source', type='measured-homepage-snapshot', path='artifacts/component-knowledge/style-map/style-map.json', checkedAt=old['checkedAt'], note='DOM counts from sampled viewport; no claim of official brand tokens')
for sample in old['samples']:
    sid = node('site:' + sample['id'], 'site', name=sample['name'], url=sample['url'], kindOfSite=sample['kind'])
    edge(sample_source, 'samples_site', sid, checkedAt=sample['checkedAt'])
    projection = sample['projection']
    pid = node('palette:projection:' + sample['id'], 'palette', name=sample['name'] + ' internal projection', evidenceClass='internal-projection', tone=projection['tone'], sourceSite=sid, note='Seven-color design proposal inspired by the sampled site; chromatic additions are curated, not observed or official site tokens')
    edge(sid, 'inspires_projection', pid, evidence='internal-projection')
    extra = expansions[sample['id']]
    roles = {
        'background': projection['background'],
        'surface': blend(projection['background'], projection['ink'], .045),
        'ink': projection['ink'],
        'border': blend(projection['background'], projection['ink'], .22),
        'primary': extra.get('primary', projection['accent']),
        'secondary': extra['secondary'],
        'tertiary': extra['tertiary'],
    }
    if len({v.lower() for v in roles.values()}) != 7:
        raise ValueError(f'{sample["id"]}: projected palette must contain seven distinct colors')
    for order, (role, value) in enumerate(roles.items()):
        edge(pid, 'has_swatch', color(value), order=order, role=role, evidence='internal-projection')
    for role in ('text','background'):
        for raw, count in sample['evidence'].get('colors',{}).get(role,[]):
            edge(sid, 'observed_' + role + '_color', color(raw), domCount=count, checkedAt=sample['checkedAt'], evidence='computed-style-sample')

gradient_re = re.compile(r'(?:rgba?|hsla?|oklch|lab)\([^()]*\)|#[0-9a-fA-F]{3,8}')
for row in gradients['observations']:
    sid = 'site:' + row['siteId']
    if sid not in nodes: continue
    observation = row.get('observation')
    nodes[sid]['gradientSampleStatus'] = 'measured' if observation else 'unavailable'
    if not observation: continue
    source_id = node('source:gradient:' + row['siteId'], 'source', type='computed-homepage-gradient', url=observation['url'], checkedAt=row['checkedAt'], method=gradients['method'], totalUnique=observation['totalUnique'])
    edge(sid, 'has_gradient_observation', source_id)
    for index, item in enumerate(observation['gradients']):
        gid = node(f'gradient:{row["siteId"]}:{index+1}', 'gradient', css=item['css'], gradientType='radial' if 'radial-gradient(' in item['css'] else 'conic' if 'conic-gradient(' in item['css'] else 'linear', element={'tag':item['tag'],'className':item['className'],'width':item['width'],'height':item['height']}, inFirstViewport=item['inFirstViewport'], evidenceClass='computed-style-live')
        edge(source_id, 'records_gradient', gid)
        edge(sid, 'observed_gradient', gid, checkedAt=row['checkedAt'])
        seen = set()
        for order, raw in enumerate(gradient_re.findall(item['css'])):
            cid = color(raw)
            if cid not in seen: edge(gid, 'contains_color', cid, order=order, evidence='computed-css-expression')
            seen.add(cid)

for family in families:
    fid = node('style-family:' + family['id'], 'style_family', representative=family['representative'], structure=family['structure'], pairwiseMinimum=family['pairwiseMinimum'], method='structural-similarity-of-sampled-homepages')
    for site_id in family['members']:
        edge('site:' + site_id, 'member_of_style_family', fid, evidence='derived-style-group')

for screen in mobile:
    source_id = node('source:mobile:' + screen['id'], 'source', type='published-raster-screen', page=screen['sourcePage'], image=screen['sourceImage'], sourceClass=screen['sourceClass'], checkedAt='2026-10-28')
    sid = node('mobile-screen:' + screen['id'], 'mobile_screen', platform=screen['platform'], app=screen['app'], state=screen['state'], localImage=screen['image'], purpose=screen['purpose'], evidenceClass='manual-raster-analysis')
    edge(source_id, 'shows_mobile_screen', sid, evidence='published-raster-screen')
    for index, component in enumerate(screen['components'], 1):
        cid = node(f"mobile-component:{screen['id']}:{index:02d}", 'mobile_component', role=component['role'], componentType=component['type'], evidence=component['evidence'], sourceNodeId=component.get('sourceNodeId'), catalogMapping=component.get('catalogMapping'), imageBox=component.get('box'))
        edge(sid, 'contains_component', cid, evidence='manual-raster-analysis')
    for item in screen['colors']:
        edge(sid, 'sampled_raster_color', color(item['hex']), role=item['role'], evidence='raster-pixel-sample')
    if screen.get('observedGradient'):
        grad = screen['observedGradient']
        gid = node('gradient:mobile:' + screen['id'], 'gradient', gradientType='raster-field', description=grad['kind'], evidenceClass='raster-approximation', note=grad['note'])
        edge(sid, 'observed_gradient', gid, evidence='raster-approximation')
        for order, value in enumerate(grad['colors']):
            edge(gid, 'contains_color', color(value), order=order, evidence='raster-pixel-sample')
    backdrop = backdrops[screen['id']]
    bid = node('backdrop:mobile:' + screen['id'], 'background_analysis', layerCount=len(backdrop['layers']), evidenceClass=backdrop['evidenceClass'], schemaVersion='2.0')
    edge(sid, 'has_background_analysis', bid, evidence='manual-raster-layer-hypothesis')
    layer_ids = {}
    for layer in backdrop['layers']:
        lid = node(f"visual-layer:mobile:{screen['id']}:{layer['id']}", 'visual_layer', role=layer['role'], depthBand=layer['depthBand'], box=layer['box'], baseStatus=layer['base']['status'], componentRoles=[item['role'] for item in layer['components']], shadowStatus=layer['effects']['shadow']['status'], blurStatus=layer['effects']['blur']['status'])
        layer_ids[layer['id']] = lid
        edge(bid, 'has_visual_layer', lid, evidence=layer['zEvidence'])
        if layer['base']['color']:
            edge(lid, 'has_base_color', color(layer['base']['color']), role=layer['base'].get('sourceRole'), evidence=layer['base']['evidence'])
        for accent in layer['accentColors']:
            edge(lid, 'has_accent_color', color(accent['hex']), role=accent['role'], evidence=accent['evidence'])
    for layer in backdrop['layers']:
        if layer['parentId'] is not None:
            edge(layer_ids[layer['parentId']], 'contains_visual_layer', layer_ids[layer['id']], evidence='semantic-region-parent')
    for relation in backdrop['occlusionRelations']:
        edge(layer_ids[relation['above']], 'visually_occludes', layer_ids[relation['below']], evidence=relation['evidence'])
    edge(bid, 'has_edge_pixel_clue', color(backdrop['edgeClues']['dominantEdgeFamily']), support=backdrop['edgeClues']['support'], samples=backdrop['edgeClues']['sampleCount'], evidence='unclassified-raster-edge; not a token')

for group in variations:
    prefix, item_id = group['id'].split(':', 1)
    source_id = {'site': 'palette:projection:', 'threads': 'palette:threads:', 'mobile': 'mobile-screen:'}[prefix] + item_id
    seed_id = color(group['seed'])
    for variant in group['variants']:
        vid = 'variant:' + group['id'] + ':' + variant['id']
        node(vid, 'color_variant', hex=variant['hex'], oklch=variant['oklch'], mapping=variant['mapping'], contrastOnBackground=variant['contrastOnBackground'], use=variant['use'], evidenceClass='internal-generated')
        edge(source_id, 'offers_variant', vid, evidence='internal-generated')
        edge(seed_id, 'derived_color_variant', vid, operation=variant['id'])
        edge(vid, 'renders_as_color', color(variant['hex']))
    for gradient in group['gradients']:
        gid = 'gradient-candidate:' + group['id'] + ':' + gradient['id']
        node(gid, 'gradient_candidate', css=gradient['css'], purpose=gradient['purpose'], recommendedByDefault=gradient['recommendedByDefault'], foreground=gradient['foreground'], evidenceClass='internal-generated')
        edge(source_id, 'offers_gradient_candidate', gid, evidence='internal-generated')
        for order, value in enumerate(gradient['colors']):
            edge(gid, 'contains_color', color(value), order=order, evidence='internal-generated')

counts = Counter(n['kind'] for n in nodes.values())
output = {'schemaVersion':'1.0','description':'Source, site, palette, gradient, and color graph with observed vs projected provenance','counts':dict(counts),'nodes':list(nodes.values()),'edges':edges}
path = CAT / 'color-knowledge-graph.json'
path.write_text(json.dumps(output, ensure_ascii=False, indent=2)+'\n')
print(f'{path}: {len(nodes)} nodes, {len(edges)} edges, {counts}')
