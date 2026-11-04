"""Map every Core UI KB component to a motion decision checklist."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KB = json.loads((ROOT/'knowledge/core-components.json').read_text())
family = {
    'content': (['content-update','emphasis-change'], '내용과 위계를 정적으로도 읽을 수 있게 유지'),
    'actions': (['press','loading','result'], '눌림·진행·결과의 라벨과 상태'),
    'selection': (['select','deselect','active-indicator'], '선택 표시와 접근성 상태'),
    'inputs': (['focus','value-change','validation'], '값·오류·도움말을 문구와 상태로 표시'),
    'navigation': (['active-location','navigate','expand'], '현재 위치와 이동 결과를 표시'),
    'containers': (['expand','collapse','reflow'], '열림·접힘·배치를 유지'),
    'overlays': (['open','close','focus-transfer'], '레이어·초점·닫기 경로를 유지'),
    'data': (['insert','remove','reorder','value-update'], '항목 ID·순서·값·단위를 유지'),
    'feedback': (['appear','progress','dismiss'], '상태·진행·결과 문구를 유지'),
    'layout': (['responsive-reflow','scroll-position'], '읽기 순서·위치를 유지'),
    'patterns': (['step-change','state-change','item-update'], '현재 단계·값·결과를 유지')
}
overrides = {
    'scroll-area':['scroll-position','section-progress','sticky-change','pull-refresh-threshold','refresh-result'],
    'list':['insert','remove','reorder','filter'],
    'list-item':['insert','remove','reorder','value-update','swipe-action-reveal','swipe-commit','undo'],
    'data-grid':['sort','filter','row-update','selection'],
    'tab':['active-indicator','content-switch','selection-label-change'],
    'tab-bar':['active-location','navigate','active-indicator','selection-label-change'],
    'bottom-navigation':['active-location','navigate','active-indicator','selection-label-change'],
    'switch':['checked-change','pending-result','rollback'],
    'checkbox':['select','deselect','mixed-change','select-all'],
    'dialog':['open','close','focus-transfer','submit-result'],
    'bottom-sheet':['open','drag','snap-point-change','close','keyboard-resize','focus-transfer'],
    'carousel':['slide-change','page-indicator','drag-settle','edge-behavior'],
    'segmented-control':['select','deselect','active-indicator','content-switch'],
    'pagination':['page-change','active-indicator','result-update'],
    'date-picker':['open','date-select','month-change','close'],
    'search-field':['focus','query-change','suggestions','loading','no-results','clear'],
    'text-field':['focus','label-change','value-change','validation','clear'],
    'fab':['press','expand-actions','collapse-actions','scroll-visibility','drag-snap'],
    'menu':['open','item-focus','select','close'],
    'toast':['appear','stack','dismiss','swipe-dismiss','undo'],
    'page-shell':['forward-navigation','back-navigation','shared-element','focus-restore'],
    'chart':['data-update','series-focus'],
    'progress-bar':['value-update','completion'],
    'skeleton':['loading','content-arrival'],
    'tooltip':['show','hide'],
    'accordion':['expand','collapse','reflow'],
    'button':['press','loading','result','hold-confirm','slide-confirm','undo-result']
}
rows=[]
scenario_sources = ['app-motion-scenarios.json', 'component-motion-scenarios.json']
scenarios = [scenario for source in scenario_sources for scenario in json.loads((ROOT/'knowledge'/source).read_text())['scenarios']]
no_motion = {row['componentId']: row for row in json.loads((ROOT/'knowledge/component-no-motion-defaults.json').read_text())['entries']}
scenario_index = {}
for scenario in scenarios:
    for component_id in scenario['components']:
        scenario_index.setdefault(component_id, []).append(scenario['id'])
for entry in KB['entries']:
    events,static=family[entry['family']]
    component_id = entry['id']
    scenario_ids = scenario_index.get(component_id, [])
    no_motion_row = no_motion.get(component_id)
    if bool(scenario_ids) == bool(no_motion_row):
        raise ValueError(f'{component_id}: 시나리오 또는 기본 무모션 판단 중 정확히 하나가 필요')
    row = {'componentId':component_id,'name':entry['ko'],'family':entry['family'],'knownStates':entry['states'],'candidateEvents':overrides.get(component_id,events),'staticFallback':static,'decision':'context-required','defaultMotionDecision':'candidate-scenarios' if scenario_ids else 'no-motion-by-default','scenarioIds':scenario_ids,'note':'후보와 기본 판단은 구현·검증 완료 또는 사용자 승인으로 간주하지 않음'}
    if no_motion_row:
        row['noMotionReason'] = no_motion_row['reason']
        row['reconsiderWhen'] = no_motion_row['reconsiderWhen']
    rows.append(row)
path=ROOT/'knowledge/component-motion-coverage.json'
path.write_text(json.dumps({'schemaVersion':'1.1','source':'core-components.json','count':len(rows),'scenarioCount':len(scenarios),'noMotionDefaultCount':len(no_motion),'decisionMethod':'each instance: role → actual state/event → purpose → static feedback → preview → user confirmation D','entries':rows},ensure_ascii=False,indent=2)+'\n')
print(path,len(rows))
