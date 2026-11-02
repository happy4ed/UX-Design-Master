"""Select landing sections from available evidence, without inventing proof."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'knowledge/landing-sections.json').read_text())
SECTIONS = {row['id']: row for row in DATA['sections']}

def plan(kind, evidence):
    if kind not in DATA['journeys']:
        raise ValueError(f'unknown kind: {kind}')
    available = set(evidence)
    selected, unavailable = [], []
    for section_id in DATA['journeys'][kind]:
        section = SECTIONS[section_id]
        absent = [item for item in section['needs'] if item not in available]
        row = {'id': section_id, 'family': section['family'], 'role': section['role']}
        if absent:
            row['missingEvidence'] = absent
            unavailable.append(row)
        else:
            selected.append(row)
    if not any(row['family'] == 'promise' for row in selected):
        unavailable.insert(0, {'id': 'required-promise', 'missingEvidence': ['specific-outcome or real-product-visual']})
    if not any(row['family'] == 'action' for row in selected):
        unavailable.append({'id': 'required-action', 'missingEvidence': ['conversion-action']})
    return {'kind': kind, 'selected': selected, 'heldForEvidence': unavailable,
            'review': '선택된 순서는 와이어프레임 후보이며, 실제 증거와 콘텐츠를 사용자와 확인한 뒤 확정한다.'}

def main():
    parser = argparse.ArgumentParser(description='실제 증거가 있는 랜딩 섹션만 조합합니다.')
    parser.add_argument('--kind', choices=DATA['journeys'])
    parser.add_argument('--evidence', nargs='*', default=[], help='예: specific-outcome real-product-visual conversion-action')
    parser.add_argument('--list-evidence', action='store_true')
    args = parser.parse_args()
    if args.list_evidence:
        print(json.dumps(sorted({need for row in DATA['sections'] for need in row['needs']}), ensure_ascii=False, indent=2))
    else:
        if not args.kind:
            parser.error('--kind is required unless --list-evidence is set')
        print(json.dumps(plan(args.kind, args.evidence), ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
