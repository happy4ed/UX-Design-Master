# 화면 바탕과 Z 레이어 분석

색상 분석의 기준 단위는 **화면 전체 바탕을 뿌리로 둔 시각 레이어**다. 전체 화면의 바탕색, 그 위의 리스트·카드·시트 바탕색, 그 안의 텍스트·아이콘·강조색은 서로 다른 역할이다. 색 견본을 평면 목록으로만 보여주면 어느 면 위에 어떤 색이 놓이는지 알 수 없으므로 분석 완료로 보지 않는다. 앱·웹·문서의 참조 분석과 신규 시각 설계에 적용한다.

## 두 관계를 분리한다

1. **구성 트리:** 화면 → 영역 → 컴포넌트. `parentId`는 포함·소속 관계다. 자식이 부모의 바탕색을 그대로 갖는다는 뜻이 아니다. 투명한 자식은 `transparent/inherited`로 적고 실제 뒤에 보이는 면을 별도로 확인한다.
2. **가림·그리기 순서:** `A가 B 위에 보인다`는 겹침 지점에서만 `occlusionRelations`로 기록한다. 서로 겹치지 않는 형제의 Z 순서는 스크린샷 한 장으로 결정하지 않는다. HTML의 DOM 부모 관계나 큰 면적 순서를 CSS `z-index`로 오해하지 않는다. `depthBand`의 `canvas/content/floating`은 분석용 역할이며 구현 수치가 아니다.

## 추출 알고리즘

1. 화면의 목적·상태·테마·스크롤 위치와 의미 영역을 먼저 읽는다. 스크린샷 안의 기기 프레임·합성 배경·사진을 **앱 화면 바탕**에서 제외하고 실제 화면 경계를 정한다. 문서는 페이지 경계가 화면 경계에 해당한다.
2. 실제 화면 경계 전체에 `screen` 루트층을 만든다. 이 층의 `base`만 **전체 바탕색**이다. 여러 위치의 깨끗한 픽셀 또는 DOM의 html/body 합성 결과로 확인하고, 이미지·그라데이션이면 그 채움 유형을 기록한다. 모르면 `unknown`과 이유를 남긴다.
3. 의미 영역마다 층을 만든다. 리스트 그룹, 카드, 헤더, 시트, 검색 바, 오버레이처럼 눈에 보이는 면은 자기 `base`를 갖는다. 단순히 콘텐츠만 묶은 투명 영역도 층으로 남기되 `base`는 `transparent/inherited` 또는 `unknown`으로 구분한다. `box`는 그 영역의 실제 가시 범위다.
4. 컴포넌트를 해당 층의 `components`에 배정한다. 위치가 안 맞거나 영역이 겹쳐 배정할 수 없으면 `unassigned`로 화면 루트에 두고 이유를 남긴다. 목록 행이 그룹의 흰 바탕을 공유하는지, 행 자체에 별도의 바탕이 있는지 확인한다. 별도 면이면 행을 하위 층으로 추가한다.
5. **층마다** `base`(바탕 채움), `components`(구성), `accentColors`(글자·아이콘·상태 강조), `effects`(경계·그림자·블러)를 따로 기록한다. 같은 HEX가 두 층에서 사용되어도 역할·근거를 별개로 둔다. 소속을 모르는 색은 `unassignedColorSamples`에 남기고 임의 층에 넣지 않는다.
6. 실제 겹침 위치에서 가림 관계를 기록한다. 떠 있는 검색 바가 리스트 위를 가리면 `search above list`처럼 적는다. 반투명 오버레이는 자기 색·알파·아래층·가림 범위가 모두 필요하다. 그림자는 **어느 층에서 떨어지는지**, 블러는 **자기 콘텐츠를 흐리는지 뒤층을 흐리는지**를 구별한다.
7. **DOM이 있으면** [DOM 시각층 검사기](../assets/layout/background-layer-audit.mjs)로 계산된 배경·그림자·필터·위치·부모·stacking-context 단서를 모은다. 실제 화면의 겹침과 `elementFromPoint`를 대조한다. CSS `z-index`는 stacking context 밖의 전역 순위가 아니다. 의사 요소, canvas/WebGL, 이미지 자체 효과는 별도 시각 확인이 필요하다.
8. **스크린샷만 있으면** 층 안쪽의 여러 깨끗한 픽셀과 좌표를 측정하고 부모/자식 경계·가림을 눈으로 판정한다. 가장자리 최빈색을 화면 바탕으로 자동 지정하지 않는다. 정적 한 장으로 CSS/네이티브 그림자의 offset·blur·spread나 배경 블러 반경을 역산하지 않는다. `not-measured`를 넣고 시각적인 존재 여부와 숫자 확정을 분리한다.
9. 같은 화면의 라이트/다크, 데이터 빈/포화, 모달 열림, 스크롤 상태를 비교한다. 층 트리가 어떻게 변하고 각 층의 대비가 유지되는지 확인한다. 여러 앱의 같은 역할을 비교할 때에는 독립 표본 수를 세고 플랫폼 공식 토큰처럼 일반화하지 않는다.

## 필수 레코드와 게이트

```text
screenId / sourceType / state / sourceImage 또는 sourcePage
layers[]:
  id, parentId, depthBand, role, box
  base: {kind, color, status, evidence}
  components[]: {role, type, assignment}
  accentColors[]: {role, hex, status, evidence}
  effects: {shadow:{status,note,...}, blur:{status,note,...}}
  zEvidence
occlusionRelations[]: {above, below, status, evidence}
unassignedColorSamples[]
zLimit
```

검사기는 루트층 1개, 유효한 부모 트리, 층별 `base/components/accentColors/effects`, 겹침 근거, 미확정 효과의 이유를 요구한다. [배경 분석 검사기](../scripts/check_background_analysis.py)의 PASS는 **기록 구조의 완전성**이다. 바탕색 판정과 Z 관계가 실제 화면과 맞는지는 원본을 보며 검수한다. 채택할 디자인 토큰은 관찰 레코드와 분리하고 사용자 선정 상태를 기록한다.

## 실험 사례

[One UI Settings 캡처](https://r1.community.samsung.com/t5/others/one-ui-8-5-vs-one-ui-9-bedah-perbedaan-amp-fitur-baru-di-galaxy/td-p/39487394/highlight/true/page/2)에서는 화면 루트의 따뜻한 바탕 `#F3EFEE` 위에 계정·기능·설정 목록의 흰 표면이 있고, 보라 `#4222C3`은 제목층의 강조색이다. 목록의 Connections 아이콘과 기능 영역의 care 아이콘은 **흰 부모 표면 안에서 별도의 색 면을 그리는 컴포넌트 자식층**이다. 하단 검색은 별도의 떠 있는 층으로 목록 일부를 가린다. 검색 아래의 부드러운 그림자는 보이지만 실제 offset·blur·spread는 미측정이다. 흰색은 **화면 전체 바탕색이 아니라 각 표면의 바탕색**이다. [21개 화면의 Z 레이어 기록](../knowledge/mobile-backdrop-observations.json)에 같은 구조를 기록하되, 증거가 없는 층의 색은 비워 둔다.
