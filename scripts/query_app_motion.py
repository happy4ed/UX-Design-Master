"""Find named interaction scenarios by component or everyday motion description."""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser(description='컴포넌트별 앱 상호작용 시나리오 후보 검색')
parser.add_argument('--component', default='')
parser.add_argument('--query', default='')
args = parser.parse_args()
knowledge = Path(__file__).resolve().parents[1] / 'knowledge'
sources = [json.loads((knowledge / name).read_text()) for name in ('app-motion-scenarios.json', 'component-motion-scenarios.json')]
no_motion = {row['componentId']: row for row in json.loads((knowledge / 'component-no-motion-defaults.json').read_text())['entries']}
terms = args.query.casefold().split()
rows = []
for row in (scenario for source in sources for scenario in source['scenarios']):
    if args.component and args.component not in row['components']:
        continue
    haystack = ' '.join(str(row[key]) for key in ('id', 'ko', 'en', 'event', 'fromTo', 'motion')).casefold()
    if not all(term in haystack for term in terms):
        continue
    rows.append(row)
static_decision = no_motion.get(args.component) if args.component else None
print(json.dumps({'status': 'candidate-only; 실제 구현·원본 일치·기기 검증 완료가 아님', 'matches': len(rows), 'noMotionDefault': static_decision, 'scenarios': rows}, ensure_ascii=False, indent=2))
