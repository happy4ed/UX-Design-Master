import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
core = json.loads((root / 'knowledge/core-components.json').read_text())
coverage = json.loads((root / 'knowledge/component-motion-coverage.json').read_text())
scenarios = json.loads((root / 'knowledge/app-motion-scenarios.json').read_text())
component_scenarios = json.loads((root / 'knowledge/component-motion-scenarios.json').read_text())
no_motion = json.loads((root / 'knowledge/component-no-motion-defaults.json').read_text())
all_scenarios = scenarios['scenarios'] + component_scenarios['scenarios']
ids = {entry['id'] for entry in core['entries']}
assert len({row['id'] for row in all_scenarios}) == len(all_scenarios)
assert len({row['componentId'] for row in no_motion['entries']}) == len(no_motion['entries'])
assert {row['componentId'] for row in no_motion['entries']} <= ids
assert all(row['reason'] and row['reconsiderWhen'] for row in no_motion['entries'])
for row in all_scenarios:
    assert row['components'] and set(row['components']) <= ids
    assert all(row[key] for key in ('ko', 'en', 'event', 'fromTo', 'motion', 'staticFallback'))

by_component = {row['componentId']: row for row in coverage['entries']}
for row in all_scenarios:
    assert row['event'] in by_component[row['components'][0]]['candidateEvents'], row['id']
    for component_id in row['components']:
        assert row['id'] in by_component[component_id]['scenarioIds'], (row['id'], component_id)
assert coverage['count'] == len(ids) == 122
assert coverage['scenarioCount'] == len(all_scenarios)
assert coverage['noMotionDefaultCount'] == len(no_motion['entries'])
assert all(row['defaultMotionDecision'] in ('candidate-scenarios', 'no-motion-by-default') for row in coverage['entries'])
assert all(bool(row['scenarioIds']) == (row['defaultMotionDecision'] == 'candidate-scenarios') for row in coverage['entries'])
assert not ({component_id for row in all_scenarios for component_id in row['components']} & {row['componentId'] for row in no_motion['entries']})
assert {component_id for row in all_scenarios for component_id in row['components']} | {row['componentId'] for row in no_motion['entries']} == ids
assert 'swipe-action-reveal' in by_component['list-item']['candidateEvents']
assert 'snap-point-change' in by_component['bottom-sheet']['candidateEvents']
assert 'rollback' in by_component['switch']['candidateEvents']

result = subprocess.run(
    ['python3', str(root / 'scripts/query_core.py'), '--query', '화면 가운데 뜨는 창', '--limit', '4'],
    capture_output=True, text=True, check=True,
)
found = json.loads(result.stdout)
assert found['matchedPhrase'] == '가운데 뜨는 창'
assert {'dialog', 'popover'} <= {row['id'] for row in found['entries']}
assert any(set(row['ids']) == {'dialog', 'popover'} for row in found['roleQuestion'])
popup = subprocess.run(
    ['python3', str(root / 'scripts/query_core.py'), '--query', '팝업을 띄워줘', '--limit', '4'],
    capture_output=True, text=True, check=True,
)
assert json.loads(popup.stdout)['matchedPhrase'] == '팝업'
static_query = subprocess.run(['python3', str(root / 'scripts/query_app_motion.py'), '--component', 'divider'], capture_output=True, text=True, check=True)
assert json.loads(static_query.stdout)['noMotionDefault']['componentId'] == 'divider'
dynamic_query = subprocess.run(['python3', str(root / 'scripts/query_app_motion.py'), '--component', 'kanban'], capture_output=True, text=True, check=True)
assert any(row['id'] == 'kanban-card-transfer' for row in json.loads(dynamic_query.stdout)['scenarios'])
print('named scenarios, component events, and natural-language disambiguation: PASS')
