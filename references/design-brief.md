# 실측 증거에서 디자인 계약 만들기

기존 URL·스크린샷·앱 화면을 읽고 역할을 정의한 뒤, 실제 렌더에서 [스타일 증거 수집기](../assets/layout/capture-design-evidence.mjs)를 실행한다. 이 모듈은 계산된 색·폰트·행간·R·gap·padding의 빈도를 기록한다. 빈도는 시각적 중요도나 브랜드 토큰의 증거가 아니다. 영역 역할·대비·컴포넌트 사용 맥락을 사람이 붙인다.

```js
const {captureDesignEvidence} = await import('/skills/ux-design-master/assets/layout/capture-design-evidence.mjs');
copy(JSON.stringify(captureDesignEvidence(document.body), null, 2));
```

수집 결과를 `evidence`로, 사용자와 선택한 역할 토큰·컴포넌트·배치 규칙을 `decisions`로 가진 JSON을 만든다. `python3 scripts/write_design_brief.py --input measured.json --out DESIGN.md`로 검토 초안을 만든다. 출력은 관찰값과 선택값을 분리하고 누락된 기본 색 역할을 표시한다. 폰트·간격·모션의 실제 적용은 대표 화면과 경계 조건에서 다시 검증한다.

`DESIGN.md`는 URL을 자동 복제한 최종 명세가 아니다. 원본에서 관찰한 수치, 새 제품에 맞춰 제안한 수치, 사용자에게 승인된 수치를 각기 기록한다. 사용자의 선택 전에는 확정으로 표시하지 않는다.
