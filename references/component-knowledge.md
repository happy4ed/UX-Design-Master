# 컴포넌트 패턴 지식과 외부 목록

## 기본 정의를 먼저 확인

기본 컴포넌트 의미·상하위·구성·junction은 [Core UI KB](core-component-kb.md)를 먼저 조회한다. 아래 목록은 그 기본 요소를 활용하는 외부 복합 패턴 후보다.

## 구성과 동작 계약 조회

[내부 컴포넌트 계약 지식](../knowledge/astryx-component-contracts.json)은 역할별로 검토한 동작·기존 요소와의 연결·경계와 원본 속성 이름 및 타입을 제공한다. 구성 요소와 하위 요소, 표시 변형, 구현 훅, 제공자·별칭은 서로 다른 단위다. 공개 이름만 수집한 항목은 `static-export`이며 속성과 동작이 확인된 계약이 아니다.

```bash
python3 scripts/query_component_contracts.py --query "선택" --limit 5
python3 scripts/query_component_contracts.py --core-id table --limit 5
python3 scripts/query_component_contracts.py --query TourStep --include-unreviewed
python3 scripts/query_component_contracts.py --query Button --limit 1 --full
python3 scripts/query_component_contracts.py --types --query ButtonProps
```

화면별 기능과 컴포넌트를 정의할 때 해당 역할 및 상위 ID로 조회해 하위 슬롯·필수 데이터·상태·인터랙션·키보드와 경계 사례를 프로젝트 계약으로 구체화한다. `attributes`는 문서 속성, `sourceTypeDeclarations`는 구문상 직접 선언, `nativeContract`는 네이티브 추가·제외 속성이다. 구문 추출은 상속·합성 타입을 완전히 펼친 결과가 아니며, `slotsReference`처럼 미해결된 공유 정의도 기록한다. 속성 목록은 특정 라이브러리의 관찰 기록이며 그대로 코드 의존성이나 기본 수치로 사용하지 않는다. 단순 이름 일치 또는 관련 후보는 의미·행동을 대조해 확정하고 미확인 export에는 필요한 설계 가정을 기록한다. 사용자에게 보이는 시안과 실제 검증에 선택된 요소의 계약을 반영한다.

기본 조회에서 적합한 요소가 나오지 않거나 내보내기 이름을 사용자가 지정한 경우 `--include-unreviewed`로 전체 공개 이름을 추가 조회한다. 미분류 항목은 공개 이름·정의 파일·호출 시그니처의 근거로만 사용하고, 사용자 과업에 필요한 의미와 상태를 따로 확정한다. 네이티브 대상이면 해당 `nativeContract`의 플랫폼별 속성·웹 전용 제외 항목을 함께 대조한다. 함수 인자와 타입을 컴포넌트 UI로 자동 간주하지 않는다.

## Affect UI 목록

2026-10-26의 [실제 목록](https://www.affectui.com/components)에서 Components 65개를 확인했다. [텍스트 색인](https://www.affectui.com/llms.txt)은 64개로 `Plan vs Actual`이 빠져 있어 실제 탐색 목록으로 보완했다. 화면 15·블록 11·일러스트 24·모션 8은 컴포넌트 65개와 구분하며 조사 산출물에 보조 목록으로 보존했다.

[컴포넌트 지식 JSON](../knowledge/affectui-components.json)은 이름·원본 URL·분류·자체 의미 역할·anatomy 후보·기존 기본 요소 연결·혼동 주의점을 가진다. 원본 코드·스타일·치수·마케팅 설명문을 복사한 자료가 아니다. 역할·슬롯 분해는 우리의 재해석이며 원본 구현 API를 설명하지 않는다. 원본 이름만 확인한 항목은 근거 수준을 낮춰 기록했다.

## 필요할 때 검색

목록 전체를 매번 컨텍스트에 싣지 않는다. 과업·역할·콘텐츠에 맞는 후보만 찾는다.

```bash
python3 scripts/query_components.py --query "승인" --limit 6
python3 scripts/query_components.py --kind text-input --limit 6
python3 scripts/query_components.py --list-families
```

명령은 이 스킬 디렉터리를 기준으로 한다. 스크립트가 없다면 JSON의 name/family/role/anatomy/canonicalKinds/selectionNote를 검색한다.

1. [의미 분석](semantic-design.md)으로 사용자 과업과 필요한 역할을 먼저 정의한다.
2. 프로젝트의 실제 컴포넌트 목록을 먼저 확인하고, 이 목록은 누락된 **패턴 후보**를 찾는 데 사용한다.
3. source name, 제품 의미 역할, 기본 요소, 복합 패턴을 구분한다. Agent Inbox/Approval Card 같은 이름을 새 primitive로 추가하지 않는다. Segmented Control은 외형 명칭이며 tab·필터·설정값의 의미를 문맥으로 판별한다.
4. canonicalKinds는 조합 가능한 자체 분류 후보다. 완전한 anatomy나 실제 DOM/접근성 역할·구현·지원 상태를 보증하지 않는다.
5. 데이터 계약·역할·행동이 맞을 때만 기존/변형/합성/미확인/신규 후보 중 하나로 매핑한다. 사이트에 없는 checkbox/switch 등을 새로운 발명으로 취급하지 않는다. Affect UI가 UI 전체의 완전한 사전은 아니다.
6. 후보를 선택한 뒤 공간·입력·상태 계약을 새 제품에 맞게 정의한다. 원본의 장식·glow·motion·배치를 기본값으로 따라 하지 않는다. 새 UI의 구조·와이어프레임·시각 방향 확인은 기존 절차를 따른다.

## 모든 조작 요소에 연결할 공간 계약

목록 수집은 터치 영역과 간격 측정을 대신하지 않는다. `spatial-contract-v1`은 아래 네 경계를 독립적으로 정의한다.

| 경계 | 의미 | 근거·미확인 |
| --- | --- | --- |
| visibleBounds | 보이는 아이콘·글자·표면의 외곽 | 이미지/렌더에서 관찰 가능 |
| componentBounds | 배경·내부 padding·슬롯을 포함한 컴포넌트 영역 | 프로젝트/계산값이 없으면 추정 |
| hitBounds | 실제 클릭·터치·입력 대상 범위 | 코드·DOM·실제 조작으로 확인; 스크린샷만으로 확정 금지 |
| layoutSlot | 부모가 배정한 자리와 이웃과의 배치 관계 | 부모 inset·공통 열·행·gap·예약 슬롯을 함께 추론 |

- 부모 영역을 요소 외곽에 맞춰 잘라 버리지 않는다. 부모→슬롯→요소를 연결하고 top/right/bottom/left inset, 반복 행 높이, 열 폭, 인접 gap, 그룹 간 간격을 도출한다.
- 빈 공간을 임의로 모두 padding이라고 부르지 않는다. 부모 inset / 자식 내부 padding / 형제 gap / 들여쓰기 / 가변 여유 / 예약 슬롯의 후보를 구분하고 반복 표본으로 검토한다.
- 공간 분할의 균일성은 영역별 공통 규칙으로 검사한다. 타이틀·보조 설명·조작 열처럼 역할이 다른 공간까지 같은 폭으로 강제하지 않는다.
- 조작 가능한 자식마다 고유 hitBounds와 적용 대상을 둔다. 카드 전체 링크와 내부 메뉴, OTP의 시각 칸과 입력 단위, 메시지 도구의 작은 아이콘, 승인/거절 등의 겹침·경쟁을 확인한다.
- 최소 조작 크기·이격은 대상 플랫폼·입력 방식·접근성 요구의 실제 기준과 논리 단위로 정한다. 이미지 px를 dp/pt/CSS px로 가정하거나 모든 플랫폼에 같은 숫자를 적용하지 않는다. 실제 영역/추정 영역/새 설계에서 확보할 영역을 구별한다.
- 터치 여유, 화면 safe area, 부모 padding, 이웃 gap은 별개다. hit 영역 확장이 이웃을 침범하거나 clipping에 잘리지 않는지, 가려진 요소가 계속 입력을 받지 않는지 확인한다.
- 정렬과 간격 관계는 초기/포화·글자 확대·폭 변화에서 같은 토큰으로 유지되는지 검증한다. 정확한 규격이 없으면 TBD로 두고 제안을 관찰값으로 바꾸지 않는다.

지금의 JSON에는 원본 컴포넌트별 실제 터치 크기·R·padding·gap이 들어 있지 않다. 위 계약은 이후 분석과 신규 설계에서 채워야 할 지침이다.
