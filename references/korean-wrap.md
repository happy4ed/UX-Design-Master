# 한글 줄바꿈과 실제 렌더 검수

한글 문구는 폭만 맞으면 끝나지 않는다. 문장 부호의 행 시작, 짧은 마지막 줄, 잘린 긴 단어, 조사만 남은 줄, 글꼴 교체 후 재흐름을 실제 화면에서 본다. 문구를 임의로 줄여 의미를 잃게 만들지 않는다.

## 검수 순서

1. 실제 글꼴·굵기·데이터를 넣고 모바일/태블릿/데스크톱, 초기/포화, 긴 번역, RTL 조건을 렌더한다.
2. [브라우저 줄바꿈 검사기](../assets/layout/korean-wrap-audit.mjs)의 `auditKoreanWrap(document.body)`를 콘솔이나 브라우저 자동화에서 실행한다. 이 모듈은 각 글자의 실제 행 좌표를 읽어 `split-korean-word`, `punctuation-at-line-start`, `opening-punctuation-at-line-end`, `short-last-line`, `clipped-horizontal-text`, `page-overflow`, `control-clipped`, `control-blocked` 후보를 반환한다. 행마다 텍스트를 같이 남긴다. 병렬 실행용 [HTML 검사 명령](../scripts/check_korean_wrap.py)은 모바일·데스크톱 폭, 150%·200% 글자 확대, 200% 화면 확대를 별도 사례로 기록하고 실패와 경고를 나눈다. 실행 불가 환경은 `NOT_RUN`으로 남긴다.
3. 결과를 실제 화면으로 확인한다. 한두 글자 마지막 행은 무조건 오류가 아니다. 카드 폭·문구·글자 크기·줄높이·문단 폭을 함께 보고 수정한다. 의도적인 코드 블록·스크롤 영역은 예외로 기록한다.
4. 수정 뒤 같은 폭·배율과 두 데이터 경계에서 다시 실행한다. 컴포넌트 한 곳의 폭을 바꾸면 같은 그리드 안의 다른 컴포넌트도 검수한다. 제목·본문은 어절을 우선 보존한다. 좁은 표 칸과 버튼은 영역 확대·줄수·말줄임을 콘텐츠 계약으로 결정하고, URL·코드는 별도 줄바꿈을 허용한다. CSS 한 값을 전체 요소에 일괄 적용해 통과시키지 않는다.

브라우저 개발자 콘솔 예:

```js
const {auditKoreanWrap} = await import('/skills/ux-design-master/assets/layout/korean-wrap-audit.mjs');
console.table(auditKoreanWrap(document.body).findings);
```

자동화 명령 예: `python3 scripts/check_korean_wrap.py http://127.0.0.1:8000/page.html --widths 390,768,1280 --text 150,200 --zoom 200`. 이미 실행 중인 Chromium이 있으면 `--cdp-url`을 쓴다. `--json`은 상태·폭·배율·각 요소의 실패 후보를 기계가 읽을 수 있게 출력한다.

이 검사는 자동 승인 도구가 아니다. 화면 밖 요소, 동적으로 접힌 영역, 브라우저의 줄바꿈과 폰트 로딩 상태에 영향을 받는다. 그래서 실제 렌더 이미지와 함께 판단한다.
