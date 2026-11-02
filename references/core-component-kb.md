# 기본 UI 컴포넌트 지식 기반

기본 컴포넌트 ID를 모션 후보와 연결할 때는 [모션 × 컴포넌트 지식 그래프](motion-component-graph.md)를 사용한다. 연결은 후보 관계이며 컴포넌트별 실제 사건·전후 상태에서 다시 검증한다.

[KB JSON](../knowledge/core-components.json)은 자체 통합 분류와 유형이 지정된 관계를 제공한다. 2026-10-26 현재 **지식 개념 122개 = 컴포넌트·일반 패턴 104 + 시각 기초 10 + 구조 개념 8**, 기능 분류 11개, junction 12개다. 플랫폼을 막론한 보편적 컴포넌트 총수라는 뜻은 아니다. 상태·색·크기를 새 항목으로 합산하지 않는다. 표현 변형을 독립 정의한 경우 상위 관계를 명시한다.

## 필요한 항목만 조회

프로젝트의 실제 컴포넌트와 의미 역할을 먼저 파악한다. 그 후 이름·역할 후보를 찾거나 혼동을 해소할 때 사용한다. 전체 JSON을 매번 읽지 않는다.

```bash
python3 scripts/query_core.py --query "chip" --limit 4
python3 scripts/query_core.py --id checkbox --relations
python3 scripts/query_core.py --id toolbar --relations
```

명령 경로는 이 스킬 디렉터리를 기준으로 한다. id/name/ko/definition/distinction/aliases/anatomy를 검색한다. `level`이 visual/structure인 항목을 조작 widget으로 자동 생성하지 않는다. Chunk는 의미 묶음, Checkmark는 상태 표시, Checkbox는 입력이다. Select/Combobox/Listbox, App Bar/Toolbar, Tabs/Segmented/주요 경로 탐색의 역할은 계약으로 구분한다.

[일상어 역할 문장 30개와 혼동쌍 12개](../knowledge/ui-role-phrases.json)도 같은 검색기로 조회한다. 예: `python3 scripts/query_core.py --query "켜고 끄기"`. 결과의 후보를 모두 적용하지 말고 `roleQuestion`에 답해 실제 상태 변화와 목적지를 확정한다. 컴포넌트마다 동작 예시가 필요하면 대표 인스턴스를 실제 HTML/앱 화면에 렌더하고 초기·포화·키보드 상태를 검증한다.

## 관계를 해석하는 방법

- `categorized_in`: 사전 내 기능 분류이며 상속이나 DOM 부모가 아니다.
- `is_a`: 하위 종류 → 상위 종류. 상위의 의미 계약을 유지한다.
- `variant_of`: 관련 기반을 공유하는 변형. 같은 접근성 role/API를 보장하지 않는다.
- `can_contain`: 컨테이너 → 포함 가능한 부품. 모든 인스턴스의 필수 자식이 아니다.
- `controls`: 입력·명령 → 영향받는 값/상태/영역.
- `anchors`: 트리거/기준점 → popup. 실제 배치와 DOM 소유는 따로 확인한다.
- `labels` / `describes`: 이름 또는 설명을 제공하는 요소 → 대상.
- `overlays`: 전면 표면 → 가려지는 영역. 모달성·입력 차단을 외형만으로 추정하지 않는다.
- `alternative_to`: 과업·데이터·입력 조건이 맞을 때의 대안. 동등한 의미나 호환 API가 아니다.
- `contrast_with`: 비슷한 외형의 다른 역할을 구분한다.
- `participates_in`: 컴포넌트 → 여러 요소의 동작 계약을 묶는 junction.

상위 종류, 구성 가능한 부모, 의미 소유자, 실제 DOM/플랫폼 부모, 레이어·앵커는 별개다. 입력값·선택·실행 대상·focus·공간 점유까지 연결해야 재현 가능한 구조가 된다.

## Junction을 신규 디자인과 분석에 적용

Junction은 새 기본 컴포넌트가 아니라 여러 요소가 공유하는 상태·이벤트·포커스·공간의 결합 계약이다. 레이블–입력–검증, 트리거–메뉴, 탭–패널, 선택 그룹, 카드–내부 행동, 양식 제출, 검색–필터–결과, 오버레이 수명, 패널 resize, 미디어 제어, 펼침–공간, chip–선택값의 12개를 정의했다.

분석에서는 실제로 그 관계가 있는지 근거를 확인한다. 신규 설계에서는 공유 상태, 트리거와 확정 시점, 입력 대상, 포커스/스크롤 복귀, hit 영역 충돌, 주변 요소의 공간 변화까지 계약으로 만든다. 단순 조합 가능 목록만으로 구현을 끝내지 않는다.

## 공간·조작 기준

[컴포넌트 계약](component-contract.md)과 [공간 계약](component-knowledge.md)의 네 경계를 적용한다. 관찰된 시각 외곽과 실제 hitBounds를 구분하며, 부모 inset·자식 padding·형제 gap·반복 슬롯·예약 영역을 정의한다. 목표 플랫폼의 논리 단위와 기준을 확인한다.

KB의 touchProfiles는 확인 날짜의 공식 자료를 연결한다. 웹 WCAG 2.2 AA 24×24 CSS px는 간격 등 예외가 있고 AAA 강화 기준은 44×44 CSS px다. Apple HIG의 현재 iOS/iPadOS 제어 크기 표는 기본 44×44pt와 최소 28×28pt를 구분한다. Android Compose 지침은 조작 가능한 요소에 48dp 최소 target을 안내한다. 이 숫자들을 하나의 고정 44px 규칙으로 섞지 않는다. 기본/권장 설계 목표·최소 조건·예외·실제 입력 범위는 별도로 검토한다.

SVG 개념 그림은 자체 예제 좌표와 일부 조작 경계를 보여준다. 원본 치수 측정이나 생산용 구현·접근성 적합성 증명이 아니다. 압축된 예제의 각 키·cell을 실제 터치 크기로 재사용하지 않는다.

## 외부 패턴과 연결

핵심 KB에서 기본 역할·결합 계약을 정한 뒤 [Affect UI 패턴 목록](component-knowledge.md) 같은 외부 지식에서 복합 후보를 찾는다. 외부 상용 이름을 새 primitive로 등록하지 말고 기존/변형/합성/미확인/신규 후보를 구분한다. 신규 UI에는 기존 사용자 합의·최소 3개 와이어프레임 비교 절차가 그대로 적용된다.
