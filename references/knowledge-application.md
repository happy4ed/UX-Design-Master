# 지식 기반을 결과물에 연결하기

스킬의 카탈로그는 선택지다. 실제 결과물에는 **관련 있는 영역마다** `적용 / 검토 후 미선택 / 제외 / 해당 없음` 판단과 이유를 남긴다. 적용 항목은 어느 화면·컴포넌트·문서 페이지에 구현했는지와 실제 검증 결과를 연결한다. 선택 후보를 모두 시각 효과로 넣거나 목록 전체를 결과물에 붙이지 않는다.

[영역 목록](../knowledge/knowledge-coverage.json)은 의미·레퍼런스·구조·컴포넌트·데이터·기하·타이포그래피·색·자산·상호작용·모션·다국어·렌더 검수와 모바일/랜딩/시각화/문서의 조건부 영역을 담는다. 큰 신규 디자인과 분석에서는 기본 영역을 모두 **검토**한다. 해당하지 않는 영역에는 이유를 적는다. 좁은 수정에서는 영향받은 영역만 `focusAreas`에 넣는다.

발표 자료에는 `presentation` 태그로 `slide-narrative`, 여러 패널의 인포그래픽에는 `infographic` 태그로 `infographic-story`를 조건부 필수 영역으로 추가한다. 슬라이드의 주장·근거와 최종 파일 검수, 인포그래픽의 전체 주장·패널 계보·매체별 변형을 실제 산출물 위치와 연결한다. 단일 차트 하나에는 인포그래픽 전체 이야기 계약을 억지로 적용하지 않는다.

`interaction`은 [컴포넌트별 입력 계약](multi-input-contract.md)의 실제 인스턴스 목록과 연결한다. 카탈로그의 역할 예시만 선택했다고 적용 완료로 표시하지 않는다. 마우스·터치·키보드에서 허용/불허/조건부와 대체 조작을 명세하고 실제 구현에서 검증한다.

`color` 영역은 [화면 바탕과 Z 레이어 분석](background-depth-analysis.md)의 화면 전체 바탕, 층별 바탕·구성·강조·효과와 가림 관계의 적용/미선택/미확정 판단과 연결한다. 평면 팔레트만 적힌 기록은 `color` 적용 완료로 보지 않는다. 스크린샷에서 확인되지 않는 효과 수치는 `NOT_RUN`이나 `unknown`과 이유를 남긴다.

진행 문서나 결과물 명세에 간결한 표를 유지한다.

| 화면·페이지 | 지식 영역 | 판단과 이유 | 적용 위치 | 검증 상태·근거 |
| --- | --- | --- | --- | --- |

JSON이 필요하면 [예제](../assets/knowledge-application-example.json)를 복사해 범위에 맞게 고친 뒤 다음을 실행한다.

```bash
python3 scripts/check_knowledge_application.py --input manifest.json --stage plan
python3 scripts/check_knowledge_application.py --input manifest.json --stage final
```

`new-design`은 각 주요 화면·대표 페이지의 초기/포화 조건을 요구한다. `final`은 적용 항목의 위치와 PASS/FAIL/NOT_RUN/NOT_APPLICABLE 검증 상태를 요구하며 PASS에는 실제 근거가 있어야 한다. 검사기 PASS는 기록의 완전성을 뜻한다. 시각적 정렬·동작의 품질은 실제 렌더에서 따로 판정한다. 미검증을 PASS로 바꾸지 않는다.
