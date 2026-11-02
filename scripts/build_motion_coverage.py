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
    'scroll-area':['scroll-position','section-progress','sticky-change'],
    'list':['insert','remove','reorder','filter'],
    'data-grid':['sort','filter','row-update','selection'],
    'tab':['active-indicator','content-switch'],
    'switch':['checked-change'],
    'dialog':['open','close','focus-transfer'],
    'carousel':['slide-change','page-indicator'],
    'chart':['data-update','series-focus'],
    'progress-bar':['value-update','completion'],
    'skeleton':['loading','content-arrival'],
    'tooltip':['show','hide'],
    'toast':['appear','dismiss'],
    'accordion':['expand','collapse','reflow'],
    'button':['press','loading','result']
}
rows=[]
for entry in KB['entries']:
    events,static=family[entry['family']]
    rows.append({'componentId':entry['id'],'name':entry['ko'],'family':entry['family'],'knownStates':entry['states'],'candidateEvents':overrides.get(entry['id'],events),'staticFallback':static,'decision':'context-required','note':'가능한 사건 목록이며 이 컴포넌트의 모션 적용을 승인하거나 강제하지 않음'})
path=ROOT/'knowledge/component-motion-coverage.json'
path.write_text(json.dumps({'schemaVersion':'1.0','source':'core-components.json','count':len(rows),'decisionMethod':'each instance: role → actual state/event → purpose → static feedback → preview → user confirmation D','entries':rows},ensure_ascii=False,indent=2)+'\n')
print(path,len(rows))
