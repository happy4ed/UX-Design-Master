# 기능·정보 누락 방지 명세

앱·웹의 A1 기능 구조를 메뉴 목록으로 끝내지 않는다. 사용자 과업과 도메인 자료에서 기능 집단을 만들고 **상위 집단 → 하위 기능 → 조건부 변형**을 ID로 연결한다. 기능과 화면에 나타날 정보는 별도 목록이다. 정보에는 **필수 / 부가 / 조건부**, 값의 출처, 표시·잘림 규칙, 사용하는 기능을 적는다. 기능에는 **필수 / 부가 / 조건부**, 발동 조건과 조건이 아닐 때의 동작, 입력·결과·수용 조건, 사용자 요청/제안/관찰 출처와 확인 상태를 적는다. 사용자가 제공하지 않은 도메인 필드나 기능은 확정으로 쓰지 않는다.

| 단계 | 의무 연결 | 사용자에게 확인할 것 |
| --- | --- | --- |
| A1 | 기능 집단·계위, 기능과 정보의 분류·조건·입력·결과·출처 | 필수 누락·과잉, 조건부 기능의 발동 이유, 부가 정보의 필요성 |
| A2 | 확정된 조작 기능 → 실제 과업 흐름·예외·복구 | 모든 필수 기능이 어느 흐름에서 쓰이는지 |
| A3 | 확정된 UI 기능·필수 정보 → 화면/상태 ID | 어느 화면에서 입력·결과·조건별 값을 보고 조작하는지 |
| B/C | 화면별 `renderEvidence`와 실제 보이는 기능·정보 ID | 명세에 있는데 화면에 빠진 항목, 불필요한 중복 설명 |
| D/최종 | 기능별 실제 조작·결과·오류/복구의 증거와 판정 | 실제로 되는지, 접근하지 못한 기능은 무엇인지 |

`python3 scripts/check_functional_inventory.py --input functional-inventory.json`으로 참조 누락과 단계별 증거 공백을 찾는다. `python3 scripts/write_functional_inventory.py --input functional-inventory.json --out FUNCTIONAL-SPEC.md --strict`로 같은 ID가 연결된 사양서를 만든다. 검사기의 PASS는 **기록 연결**에 대한 결과다. 실제 기능이 올바르게 구현됐다는 뜻은 아니다. 기능이나 정보가 바뀌면 관련 흐름·화면·컴포넌트·시험 자료와 다음 단계의 렌더 증거를 함께 갱신한다.

JSON의 주요 필드:

- `stage`: `A1`, `A2`, `A3`, `B`, `C`, `D`, `final`.
- `groups[]`: `id/name/parentId`(최상위는 `null`). 순환되는 계위는 허용하지 않는다.
- `features[]`: `id/name/groupId/parentId/tier/target/source/decision/interaction/inputs/outputs/acceptance`. `tier`는 `required`, `supporting`, `conditional`, `target`은 `ui` 또는 `system`, `decision`은 `confirmed`, `proposed`, `unresolved`, `rejected`다. 조작 가능 여부를 `interaction: true/false`로 명시하고 `conditional`에는 `condition/elseBehavior/conditionStateIds`를 추가한다. A2 이후 필수 기능·정보는 확인되지 않은 제안 상태로 둘 수 없다.
- `information[]`: `id/name/tier/valueSource/featureIds/displayRule/overflowRule/source/decision`. 조건부 정보에는 `condition`과 `elseBehavior`를 적는다.
- A2부터 `flows[]`에 `id/featureIds`를, A3부터 `screens[]`에 `id/featureIds/informationIds/stateIds`를 둔다. B부터 화면마다 `renderEvidence/renderedFeatureIds/renderedInformationIds`를 실제 캡처에서 확인해 기록한다. D부터 `verification[]`에 기능 ID별 `result/evidence`를 둔다.

정보·기능 ID는 화면의 텍스트와 일대일일 필요가 없다. 화면에 그 기능이 **발견되고 실행되고 결과가 읽히는지** 확인하고 ID를 붙인다. 숨은 시스템 기능은 관련 결과·상태의 검증 증거를 남긴다. 부가 정보가 없다고 경고를 자동으로 없애지 말고, 사용자 과업에 정말 필요 없는지 판단한다. 조건부 기능은 조건이 참일 때와 거짓일 때의 화면·행동을 모두 확인한다.

기존 앱 진단에서는 독립 평가자가 목적만 듣고 먼저 실제 화면을 검토한다. 그 뒤 제작자는 이 목록과 실제 캡처·조작을 대조해 **명세에만 있고 화면에 빠진 기능**, **UI에 있으나 명세에 없는 기능**, **조건이 맞지 않을 때 나타나는 기능**, **필수 정보 누락**을 주석형 HTML 보고서의 발견으로 기록한다. 불확실한 요구는 결함으로 단정하지 않고 확인 필요로 표시한다.
