# 실측 증거에서 디자인 계약 만들기

기존 URL·스크린샷·앱 화면을 읽고 역할을 정의한 뒤, 실제 렌더에서 [스타일 증거 수집기](../assets/layout/capture-design-evidence.mjs)를 실행한다. 웹에서는 대표 화면의 라이트/다크, 초기/포화, 오버레이 열린 상태를 각각 같은 뷰포트에서 캡처하고 수집한다. 이 모듈은 **현재 보이는 영역**의 계산된 색·폰트·행간·R·gap·padding 빈도와 화면 면적·직접 텍스트량으로 가중한 후보, 바탕·그림자·블러가 있는 층 후보를 별도로 기록한다. `truncatedNodes`가 0이 아니면 표본 제한을 늘리거나 누락 범위를 명시한다. 빈도와 가중치는 시각적 의미나 브랜드 토큰의 증거가 아니다. 영역 역할·전경/배경 짝·컴포넌트 사용 맥락은 원본 캡처와 대조해 사람이 붙인다.

```js
const {captureDesignEvidence} = await import('/skills/ux-design-master/assets/layout/capture-design-evidence.mjs');
copy(JSON.stringify(captureDesignEvidence(document.body, 3000, {screen:'home', scheme:'light', data:'initial', overlay:'closed'}), null, 2));
```

수집 결과와 같은 상태의 캡처를 한 쌍으로 보관한다. `layerCandidates`의 DOM 부모는 소속 단서일 뿐 실제 겹침 순서가 아니다. 화면 전체 바탕, 영역 표면, 컴포넌트 면, 강조색을 [Z 레이어 분석](background-depth-analysis.md)으로 구분하고, 그라데이션·이미지·SVG·의사 요소는 캡처에서 따로 확인한다. 여러 상태에서 반복되는 값과 한 상태에만 있는 값도 분리한다. [레퍼런스 비교 기록](reference-research.md)에 캡처·측정 JSON·상태 ID를 연결한다.

같은 역할의 아이콘·글자·머릿글·표면은 [가시 정렬 실측기](../assets/layout/visual-alignment-audit.mjs)로 **박스와 내부 형상**을 따로 수집한다. 아이콘 슬롯과 SVG 경로의 중심·점유율, 텍스트 박스와 첫 줄 시작점·폰트·들여쓰기, 머릿글 기호와 본문 사이 간격, 도형 크기 대비 각 모서리 R을 `observations[]`에 넣는다. 캡처에서만 보이는 비트맵 여백·글리프 잉크·시각적 무게는 `uncertainty`와 직접 비교 결과로 남긴다. 단일 박스 좌표만으로 정렬 PASS를 내리지 않는다.

화면마다 `states[]`에 `id/screenId/stateId/viewport/environment/capture/measurement/alignmentSource/visualReview`를 연결한다. 수집기는 `data-measure-landmark`의 좌표와 현재 포커스 ID·문서 스크롤 위치도 기록한다. 조작 전후를 비교하면 기준선과 스크롤·포커스 결과를 `transitions[]`에 묶고 [상태별 실측 기록 검사기](../scripts/check_measurement_manifest.py)로 누락·선언한 좌표 불변식을 검사한다. `requiredStateIds`와 `requiredTransitionIds`는 프로젝트가 정하고, 로컬 증거 파일 검증이 필요하면 `fileRoot`를 둔다. 허용 차이는 프로젝트가 해당 화면의 글꼴·배치·과업에 맞춰 정한다. 검사기 PASS는 캡처의 광학 정렬이나 조작 품질 PASS가 아니다.

수집 결과를 `evidence`로, 화면·상태별 캡처와 좌표를 `states[]`, 각 측정값을 `observations[]`로 둔다. 관찰값마다 `id/screenId/stateId/target/property/value/unit/source/method/uncertainty`를 기록한다. `decisions`는 `tokens/geometry/typography/components/interactions/motion/themeAxes/rules`로 나눠 관찰 ID, 채택값, `proposed/approved` 상태와 사용자 선택 근거를 연결한다. 색·여백·R·컴포넌트·재질의 테마 확장 축에는 기준값, 변주 범위, 유지할 의미 역할과 재검증 화면을 적는다. 원본의 CSS 빈도만으로 역할 토큰이나 테마 값을 확정하지 않는다.

브라우저에서 같은 상태마다 `captureDesignEvidence(...)`와 `measureVisualAlignment(...)` 결과를 각각 JSON으로 저장한다. 프로젝트 묶음의 `states[]`에는 `measurement.source`와 `alignmentSource`로 두 파일을 연결한다. `python3 scripts/assemble_design_measurements.py --input bundle.json --out measured.json`은 CSS 후보, 아이콘 내부 경계·면적 단서, 텍스트 첫 줄·폰트, 기호 간격, R/짧은 변 비율을 화면·상태 ID가 있는 `observations[]`로 만든다. 측정되지 않은 비트맵·글리프 잉크·광학적 무게는 자동값으로 꾸며 넣지 않는다.

`python3 scripts/write_design_brief.py --input measured.json --out DESIGN.md --strict`로 검토 초안을 만든다. 상태·관찰·정렬 규칙·입력 계약·테마 축이나 승인 근거가 빠지면 초안에 `검토 필요`를 남기고 `--strict`가 실패한다. 출력에는 상태별 근거, 실제 관찰값, 의미 토큰, 보이는 정렬·타이포그래피, 컴포넌트 사용 맵, 조작·모션 흐름, 테마 확장 축을 구분한다. [제작 시스템 계약](design-system-production.md)의 토큰·슬롯·화면 사용 맵으로 옮긴 뒤 대표 화면의 경계 조건에서 다시 검증한다. DESIGN.md 생성 성공은 실제 폰트·정렬·모션 품질 PASS가 아니다.

`DESIGN.md`는 URL을 자동 복제한 최종 명세가 아니다. 원본에서 관찰한 수치, 새 제품에 맞춰 제안한 수치, 사용자에게 승인된 수치를 각기 기록한다. 사용자의 선택 전에는 확정으로 표시하지 않는다.
