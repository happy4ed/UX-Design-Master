# 실측 증거에서 디자인 계약 만들기

기존 URL·스크린샷·앱 화면을 읽고 역할을 정의한 뒤, 실제 렌더에서 [스타일 증거 수집기](../assets/layout/capture-design-evidence.mjs)를 실행한다. 웹에서는 대표 화면의 라이트/다크, 초기/포화, 오버레이 열린 상태를 각각 같은 뷰포트에서 캡처하고 수집한다. 이 모듈은 **현재 보이는 영역**의 계산된 색·폰트·행간·R·gap·padding 빈도와 화면 면적·직접 텍스트량으로 가중한 후보, 바탕·그림자·블러가 있는 층 후보를 별도로 기록한다. `truncatedNodes`가 0이 아니면 표본 제한을 늘리거나 누락 범위를 명시한다. 빈도와 가중치는 시각적 의미나 브랜드 토큰의 증거가 아니다. 영역 역할·전경/배경 짝·컴포넌트 사용 맥락은 원본 캡처와 대조해 사람이 붙인다.

```js
const {captureDesignEvidence} = await import('/skills/ux-design-master/assets/layout/capture-design-evidence.mjs');
copy(JSON.stringify(captureDesignEvidence(document.body, 3000, {screen:'home', scheme:'light', data:'initial', overlay:'closed'}), null, 2));
```

수집 결과와 같은 상태의 캡처를 한 쌍으로 보관한다. `layerCandidates`의 DOM 부모는 소속 단서일 뿐 실제 겹침 순서가 아니다. 화면 전체 바탕, 영역 표면, 컴포넌트 면, 강조색을 [Z 레이어 분석](background-depth-analysis.md)으로 구분하고, 그라데이션·이미지·SVG·의사 요소는 캡처에서 따로 확인한다. 여러 상태에서 반복되는 값과 한 상태에만 있는 값도 분리한다. [레퍼런스 비교 기록](reference-research.md)에 캡처·측정 JSON·상태 ID를 연결한다.

수집 결과를 `evidence`로, 사용자와 선택한 역할 토큰·컴포넌트·배치 규칙을 `decisions`로 가진 JSON을 만든다. `python3 scripts/write_design_brief.py --input measured.json --out DESIGN.md`로 검토 초안을 만든다. 출력은 관찰값과 선택값을 분리하고 누락된 기본 색 역할을 표시한다. 폰트·간격·모션의 실제 적용은 대표 화면과 경계 조건에서 다시 검증한다.

`DESIGN.md`는 URL을 자동 복제한 최종 명세가 아니다. 원본에서 관찰한 수치, 새 제품에 맞춰 제안한 수치, 사용자에게 승인된 수치를 각기 기록한다. 사용자의 선택 전에는 확정으로 표시하지 않는다.
