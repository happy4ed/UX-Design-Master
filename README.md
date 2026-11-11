# UX-design-master

앱·웹·문서의 기능 구조에서 실제 렌더 검수까지 이어지는 디자인 스킬입니다. 와이어프레임 이후 같은 콘텐츠로 9개 시각 테마를 비교하고, 선택한 방향을 실제 화면에 적용한 뒤 별도 에이전트가 사용자 관점에서 검증합니다.

최신 릴리스: [v0.3.1](https://github.com/happy4ed/UX-Design-Master/releases/tag/v0.3.1). B 단계의 실제 앱 구성 참고·와이어프레임 다양성 검토와 동작 중 콘텐츠 잘림·행동 밀도 실측을 추가했습니다.

현재 작업본: `main` 개발 버전 ([변경 기록](CHANGELOG.md)). 상세 스타일 가이드와 컴포넌트 지식을 계속 보강하며 정식 릴리스와 구분합니다.

이번 작업본의 [웹 스타일 가이드북](samples/style-guidebook.html)에서 19개 스타일의 A~L 원문과 미확인 항목을 살피고 두 스타일을 나란히 비교할 수 있습니다. [기준 화면](samples/style-book-reference-screen.html)은 글꼴·아이콘·슬라이더 차이를 포함한 시연안입니다.

[컴포넌트 시연](samples/style-book-component-board.html)에는 13개 역할 묶음의 조작 가능한 예시가 있으며 스타일·라이트/다크·폰/폴드 폭을 바꿔 볼 수 있습니다.

One UI·iOS를 제외한 17개 스타일은 [형태·상태·모션 변환표](references/style-book/component-expression.json)를 각 가이드 E.2절과 컴포넌트 시연에 적용했습니다. 가이드북 상단에는 원본에서 관찰한 범위와 미측정 범위를 표시합니다. [68상태 렌더 실측](samples/style-book-component-expression-audit.json)은 내부 시연의 형태·대비·조작 영역·선택 모션을 검사하며 원본 복제 판정은 아닙니다.

원본에서 아직 확인되지 않은 값이 시안에 필요하면 [임시 추정·갱신 절차](references/style-estimation.md)로 추정값을 적용합니다. 웹 가이드북의 K절과 임시값 표에서 원본 사실과 구현 가설을 구분할 수 있습니다.

## 진행 흐름

1. A1 기능·콘텐츠 구조 → A2 사용·읽기 흐름 → A3 화면·페이지 분할을 사용자와 순서대로 확인합니다.
2. B에서 서로 다른 와이어프레임을 최소 3개 비교하고 구조를 고릅니다.
   현존 앱의 실제 화면 구성을 참고해 선택·정보 공개·탐색 방식을 다르게 설계하고, 같은 기능·정보와 초기·포화 자료로 비교합니다.
3. C에서 승인된 같은 구조·콘텐츠로 9개 테마를 실제 렌더해 비교합니다. 색뿐 아니라 여백, 모서리, 컴포넌트, 글꼴, 재질을 분리해 선택할 수 있습니다.
4. 선택안을 다시 렌더해 확인받고 주요 화면·페이지에 적용합니다. 상호작용이 있는 결과물은 작동하는 프로토타입으로 D의 모션과 흐름을 확인합니다.
5. 제작자가 실제 렌더를 검사하고, 별도 에이전트가 제작 맥락 없이 결과물을 검토합니다. 자동 검사 통과는 시각 품질이나 사용자 승인을 대신하지 않습니다.

시트·메뉴·확장·키보드 등 조작 후 상태에서는 필수 정보의 잘림·가림, 부가 정보의 원문 접근, 한 줄 행동의 위계·겹침·밀도를 다시 확인합니다.

작은 수정에는 영향받는 단계만 적용합니다. 제품별 간격·R·모션 수치 등은 고정하지 않고 실제 목적과 기기에서 정합니다.

## 기존 앱·웹 검수

실행 가능한 앱·웹을 실제 기기 또는 브라우저에서 캡처해 문제 위치를 화면 위에 표시합니다. **실제 화면과 발견 → 렌더된 추천안**을 단계별 HTML로 제출하고, 실제 수정 뒤 같은 조건의 재검증 HTML을 추가합니다. 각 문제를 눌러 근거를 열고 의견을 저장·내보낼 수 있습니다. 외부 CDN 없이 단일 HTML로 열리며, React·Tailwind CSS가 있는 프로젝트는 같은 계약으로 해당 스택을 사용할 수 있습니다. 접근하지 못한 화면은 검토 완료로 표시하지 않습니다.

앱·웹을 새로 설계할 때에는 기능 집단과 상하위 기능, 필수·부가·조건부 정보, 발동 조건, 입력·결과·수용 조건을 `FUNCTIONAL-SPEC.md`에 기록합니다. A2 흐름·A3 화면·B/C 실제 렌더·D 기능 검증에서 각 ID가 유지되는지 검사합니다.

## 설치

저장소 루트에 `SKILL.md`가 있습니다. Codex에서는 이 저장소를 `~/.codex/skills/ux-design-master`에, Claude Code에서는 `~/.claude/skills/ux-design-master`에 복제하거나 복사합니다. 호출 이름은 `$ux-design-master`입니다. 표시 이름은 **UX-design-master**입니다.

```bash
git clone https://github.com/happy4ed/UX-Design-Master.git ~/.codex/skills/ux-design-master
```

### Claude Code로 이전하기

개인 스킬 경로는 `~/.claude/skills/`입니다. 기존 `app-web-design-master` 설치를 삭제하고 새 스킬을 설치합니다. 이 명령은 **설치된 옛 스킬 폴더만** 지우며 제작 자료 보관 폴더는 건드리지 않습니다.

```bash
mkdir -p ~/.claude/skills
rm -rf ~/.claude/skills/app-web-design-master
git clone https://github.com/happy4ed/UX-Design-Master.git ~/.claude/skills/ux-design-master
```

이미 새 스킬을 설치했다면 다시 복제하지 않고 `git -C ~/.claude/skills/ux-design-master pull --ff-only`로 갱신합니다. Claude Code에서 `/skills`로 목록을 확인하고 `/ux-design-master`로 실행합니다. `~/.claude/skills/` 설치는 해당 컴퓨터의 터미널 Claude Code에서 사용합니다.

스킬 본문과 내부 지식은 별도 패키지 설치 없이 읽을 수 있습니다. 일부 렌더 검사기는 Python 3와 Playwright가 필요합니다. 브라우저 검사를 실행할 때에는 해당 환경에 Chromium도 준비해야 합니다. Node 기반 SVG·HTML 렌더러는 Node.js를 사용합니다. 도구가 없으면 해당 검사를 `NOT_RUN`으로 기록합니다.

## 자료 구분

| 경로 | 포함하는 것 |
| --- | --- |
| `SKILL.md`, `agents/`, `references/` | 실행 절차, 단계별 계약, 검수 원칙과 출처 설명 |
| `knowledge/` | 컴포넌트·색·모션 등 재사용 가능한 구조화 지식과 출처 URL |
| `samples/` | 이 스킬용으로 직접 만든 HTML·SVG 시연과 자체 렌더러에서 캡처한 대표 장면 |
| `assets/` | 시연과 렌더에 필요한 자체 코드·데이터 |
| `scripts/`, `tests/`, `tools/` | 제작·검사 도구와 회귀시험 |

다운로드한 레퍼런스 화면과 외부 모션 대조 캡처는 제작 과정의 서버 자료입니다. 이 저장소와 설치 스킬에는 넣지 않습니다. [직접 만든 모션 대표 장면](samples/motion-stills/index.html)은 샘플로 포함하며, [생성·출처 기록](samples/motion-stills/manifest.json)에 연결합니다. `knowledge/`에는 외부 레퍼런스의 관찰 결과와 출처 주소를 남기되 외부 이미지를 내장하거나 시연에 불러오지 않습니다.

## 주요 파일

| 경로 | 역할 |
| --- | --- |
| [SKILL.md](SKILL.md) | 단계별 진행과 승인·검증 계약 |
| [9개 테마 탐색](references/theme-exploration.md) | 같은 화면에서 시각 방향 비교·선택·제작 이월 |
| [독립 검증](references/independent-review.md) | 별도 에이전트의 최소 입력과 평가 기준 |
| [기존 앱 주석형 보고서](references/existing-app-visual-review.md) | 실제 캡처·문제 좌표·추천안·피드백·수정 전후 HTML |
| [기능·정보 사양서](references/functional-inventory.md) | A1 기능 계위·정보 분류와 A2~D 추적 |
| [모션 제작](references/motion-authoring.md) | 고유 모션 제작 명세와 매체별 적용 |
| [컴포넌트 지식](references/component-knowledge.md) | 컴포넌트 역할과 관계 |
| [테마 비교 예시](samples/theme-nine-board.html) | 9가지 시각 표현의 브라우저 예시 |
| [검사기](scripts/check_theme_exploration.py) | 9개 후보·선택안·제작 이월 기록 점검 |

브라우저 예시는 가상 콘텐츠로 만든 비교판입니다. 프로젝트의 실제 9개 시안을 대신하지 않습니다. 외부 스킬 실행에 의존하지 않습니다.

## 검증

```bash
python3 tests/test_theme_exploration.py
python3 tests/test_visual_direction_render.py
python3 tests/test_user_input_obligations.py
```

두 번째 시험은 Playwright와 Chromium이 필요합니다. 그 밖의 회귀시험은 `tests/`에 있습니다. 최종 품질은 실제 앱·웹·문서 과제를 같은 조건에서 돌리고 사용자가 보는 크기로 확인해야 합니다.
