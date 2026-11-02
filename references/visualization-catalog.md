# 내부 시각화 카탈로그와 실행 계약

이 카탈로그는 구조를 확인한 뒤 구성안을 고를 때 쓰는 **내부 지식과 실행 자산**이다. [유형 데이터](../assets/visualization/catalog.mjs), [SVG 렌더러](../assets/visualization/renderer.mjs), [CLI](../scripts/render_visualization.mjs)가 한 스킬 안에 있다. 외부 링크, 외부 스킬, 외부 렌더러, CDN 또는 npm 런타임 호출은 없다. 샘플은 유형 시연용이며 실제 자료로 바꿔야 한다.

## 선택 순서

1. 기능 구조 A1·흐름 A2·화면 분할 A3에서 각 화면·페이지의 역할, 원본 문장·표, 관계·단위·불확실성을 순서에 맞춰 기록한다.
2. 그림이 필요한 이유를 `순서/전이`, `구조/관계`, `정량/분포`, `비교/판단`, `서비스/업무`, `공간/구성`, `정보 요약` 중 의미로 분류한다. 하나의 그림에 다른 의미가 섞이면 분리하거나 문법을 확장한다.
3. 최소 3개 구성안에 같은 실제 데이터를 적용해 그림의 위치, 크기, 읽기 순서, 본문과의 연결을 비교한다. 유형 자체가 선택에 영향을 주면 내부 유형 후보도 같은 데이터로 렌더해 비교한다.
4. 순서·상태·값의 **변화가 이해에 필요한 경우** 구조 선택 단계에서 저충실도 모션을 실행한다. 정지 화면에서 관계를 읽을 수 있게 하고 재생·일시정지·모션 감소를 확인한다. 최종 색·시간·이징은 시각 방향 확정 후 정한다.
5. 샘플 데이터가 아닌 원본 값과 결과물의 합계·순서·화살표·라벨·대체 설명을 대조한다. 잘리거나 생략된 라벨은 수정하거나 밀도를 나눈다.

텍스트가 있는 유형은 [텍스트 영역 설계와 렌더 검수](text-layout-qa.md)를 반드시 따른다. 도형·축·화살표 설명의 슬롯을 먼저 선언하고 실제 문구로 맞춘다. 원형·마름모 등 좁은 요소에서 글자가 넘치면 도형을 키울 여유와 연결선 경계를 다시 계산한 뒤, 제한된 글자 크기 조정 또는 원문이 보이는 참조 키를 선택한다.

## 7계열, 55개 유형

| 의미 계열 | 수 | 포함 유형 |
| --- | ---: | --- |
| 순서·전이 | 8 | 조건 흐름도, 메시지 시퀀스, 상태 전이, 사건 타임라인, 역할별 수영레인, 순환 루프, 단계 프로세스, 일정 간트 |
| 구조·관계 | 13 | 시스템 아키텍처, 구조 변경 비교, 현재 시스템 지형, 계층 트리, 조직·책임도, 포함 관계도, 계층 스택, 의존 그래프, 엔터티 관계, 클래스 모델, 배포 구조, DB 스키마, 데이터 흐름 |
| 정량·분포 | 13 | 범주 막대, 시계열 선, 산점 분포, 버블 분포, 누적 증감, 값 히트맵, 다축 레이더, 주기 극좌표, 두 시점 기울기, 면적 구성비, 양의 분기·합류, 구성비 도넛, 누적 막대 |
| 비교·판단 | 7 | 우선순위 사분면, 집합 교집합, 우선순위 피라미드, 속성 비교 매트릭스, SWOT 구획, 원인 가지도, 가치·성숙도 지도 |
| 서비스·업무 | 6 | 업무 칸반, 사용자 여정, 서비스 블루프린트, 릴리스 스토리 맵, 데이터 품질 단계, 권한 매트릭스 |
| 공간·구성 | 2 | 부품 분해도, 공간 조감 구성 |
| 정보 요약 | 6 | 핵심 사실 열, 순위 목록, 양면 비교, 이정표 로드맵, 설명형 단계, 요약 성과판 |

각 유형의 ID, 입력 라벨·값 개수, 그림의 뜻은 `catalog.mjs`를 조회한다. 대부분은 고정 예시 문법이며 **범주 막대만 현재 가변 항목 수**를 지원한다. 흐름도는 별도 [선언형 배치기](../assets/visualization/flow-layout.mjs)를 사용해 노드·연결·되돌림을 실제 입력으로 받는다. 내용이 맞지 않으면 유형 이름을 억지로 끼워 넣지 말고 내부 문법을 확장한다.

## 데이터와 모션 계약

- 입력 JSON: `template`, 선택적 `labels`, `values`, `motion`, `rtl`, `lang`, `width`, `height`, `displayWidth`, `fontFamily`, `colors`. 범주 막대의 `labels`·`values`는 함께 제공하며 같은 개수면 5개 이상도 된다. 다른 고정 문법은 카탈로그의 예시 개수와 같아야 한다. 수치는 유한한 숫자여야 한다.
- 구성비·면적·두께는 양수 계열이다. 생키는 유입량=분기 합계=결과 합계이고, **중간→결과의 실제 분할은 `flows: [{from:1|2,to:3|4,value}]`로 별도 입력**한다. `flows`가 없으면 그 구간의 선을 그리지 않고 경고한다. 워터폴은 시작값+증감=결과값이어야 한다. 값 자체가 면적·길이·두께에 반영되는지 실제 SVG에서 검수한다.
- 모션 `none/trace/reveal/pulse/grow/focus/assemble`은 정지/흐름/단계 공개/강조/값 성장/초점/3D 조립을 뜻한다. 템플릿의 추천 모션은 시작점일 뿐이다. 흐름 방향과 인과·시간·수치 의미에 맞지 않으면 `none`을 쓴다.
- SVG에 제목·설명과 정적 정보가 들어간다. 독립 HTML에는 재생 모드와 일시정지 조작이 들어간다. 운영 화면에서는 실제 콘텐츠의 표나 텍스트 대체도 제공한다.
- RTL은 방향이 있는 문법에서 좌우를 반영하며 텍스트는 다시 바로 세운다. 공간 조감/분해도는 임의 반전하지 않는다. 언어의 의미 번역은 입력 라벨과 설명을 별도로 검수한다.

## 생성

스킬 루트에서 다음 명령을 실행한다.

```bash
node scripts/render_visualization.mjs --list
node scripts/render_visualization.mjs --template decision-flow --out /tmp/decision.svg --motion trace
node scripts/render_visualization.mjs --template quantity-sankey --input /tmp/data.json --out /tmp/sankey.html --format html --motion trace
```

예시 입력:

```json
{
  "template": "quantity-sankey",
  "labels": ["유입", "직접", "검색", "완료", "이탈"],
  "values": [100, 60, 40, 80, 20],
  "flows": [{"from":1,"to":3,"value":50},{"from":1,"to":4,"value":10},{"from":2,"to":3,"value":30},{"from":2,"to":4,"value":10}],
  "lang": "ko"
}
```

CLI의 경고는 라벨 생략 등 검수 필요 신호다. 출력 후 실제 브라우저에서 좁은 폭·포화 자료·언어/RTL·모션 감소·일시정지·파일 재열기를 확인한다. [레이아웃 검사 모듈](../assets/visualization/layout-audit.mjs)의 `auditSvgLayout`과 `probeMotion`을 실행하고, 움직임은 시간 차이가 있는 화면 두 장을 실제로 비교한다. 단순히 CSS 애니메이션 이름이 존재한다는 사실을 동작 확인으로 취급하지 않는다.

## 선언형 흐름도와 삽입 크기

노드·연결·되돌림을 좌표 없이 선언하려면 [9노드 예제](../assets/visualization/claim-flow-example.json)처럼 `nodes:[{id,label,subtitle?,shape?,emphasis?}]`, `edges:[{from,to,kind?,label?}]`를 입력한다. `kind`는 `next` 또는 `return`이다. 입력하지 않은 관계나 문구는 생성하지 않는다. 배치기는 1~4열을 지그재그로 배치하고 라벨에 맞춰 노드 폭을 조정한다. 지원하지 않는 긴 경로는 선을 관통시켜 그리지 않고 경고한다.

```bash
node scripts/render_flow_diagram.mjs --input assets/visualization/claim-flow-example.json --out /tmp/claim-flow.svg
python3 tests/test_diagram_quality.py
```

`Canvas(template,{width,height,displayWidth,arrowSize,fontFamily,colors})`의 SVG는 `data-display-width`와 `max-width`를 포함한다. 기본 확대 상한은 원본의 1.25배이며 화살촉 8 단위는 선 굵기와 독립이다. 좁은 폭에서는 `min-width`를 유지하고 **가로 스크롤 영역이나 단계 목록**을 제공한다. SVG만 문서에 붙여 여백 밖으로 넘치게 하지 않는다. 글꼴은 부모에서 상속하고, 제목·보조 글의 굵기는 별도로 지정한다. 실제 표시 크기에서 일반 라벨 13~16px, 보조 라벨 11~13px을 목표로 검수한다. 검사 통과는 판독 가능의 증명이 아니므로 실제 화면과 최종 내보내기를 다시 본다.

## 3D 좌표에서 SVG 생성

공간 조감·부품 분해는 평면 모양을 흉내 낸 그림이 아니라 내부 [3D 투영 모듈](../assets/visualization/project3d.mjs)로 `(x,y,z)` 정사영을 계산한다. 상자마다 실제 너비·깊이·높이를 입력하면 보이는 윗면과 양쪽 측면을 SVG 다각형으로 만든다. [장면 렌더러](../assets/visualization/scene3d.mjs)는 장면의 모든 상자가 들어오도록 카메라를 맞추고 앞뒤 순서대로 그린다.

```bash
node scripts/render_spatial_scene.mjs --input scene.json --out scene.svg
```

`scene.json`에는 `title`, `description`, `motion`, `parts`를 둔다. 각 부품은 `label`, `bounds:{x0,y0,z0,x1,y1,z1}`, 선택적 면 색상 `top/left/right`, 조립 이동량 `drop`을 가진다. [3D 입력 예제](../assets/visualization/sample-3d-scene.json)를 참고한다. 세 변의 길이는 양수여야 하며 색상은 팔레트 키 또는 16진 색상만 허용한다. 복잡한 자유형 메시나 원근 렌더링은 이 경로에 포함되지 않는다.

## 구성 선택 예제

[구성 선택 실험](../samples/composition-review.html)은 가상 예약 관리 화면의 공통 역할·같은 콘텐츠를 유지하고 균형형/작업 우선형/흐름 설명형 와이어프레임 3개를 비교한다. 초기 1건/포화 8건, 정지/5개 모션, 일시정지를 직접 시험한다. 화면의 승인을 대신하는 자동 추천기가 아니라, A에서 확인한 구조를 B에서 어떤 증거로 비교할지 보여주는 실행 예제다.
