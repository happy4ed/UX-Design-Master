# 구조화된 시각화 입력과 검증

그림을 직접 그리기 전에 실제 자료의 목적·출처·결론·유형·라벨·값·모션을 JSON으로 선언한다. [시각화 스펙 파이프라인](../scripts/render_visual_spec.mjs)은 필수 필드를 확인하고 내부 SVG/HTML 렌더러에 전달한 뒤 검수 보고서를 만든다. 외부 렌더러나 스킬을 호출하지 않는다.

```json
{
  "schemaVersion":"1.0",
  "purpose":"유입량이 어디로 분기되는지 설명",
  "source":"내부 집계표 2026-10",
  "claim":"유입 100건 중 완료 80건",
  "template":"quantity-sankey",
  "labels":["유입","직접","검색","완료","이탈"],
  "values":[100,60,40,80,20],
  "motion":"trace",
  "lang":"ko"
}
```

```bash
node scripts/render_visual_spec.mjs --input spec.json --out result.html --report result.qa.json
```

값의 개수·유한성, 생키·워터폴 합계, 유형에 맞지 않는 모션은 내부 렌더러가 거부한다. 보고서는 긴 라벨과 렌더 경고를 검토 후보로 표시한다. SVG/HTML 결과를 실제 브라우저에서 열어 작은 폭, 텍스트 충돌, 화살표 접점, 모션을 직접 검사한 뒤 PASS를 기록한다. 스펙 유효성과 실제 시각 품질은 별도 판정이다.
