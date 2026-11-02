# UX-design-master

앱·웹·문서의 기능 구조에서 실제 렌더 검수까지 이어지는 디자인 스킬입니다. 와이어프레임 이후 같은 콘텐츠로 9개 시각 테마를 비교하고, 선택한 방향을 실제 화면에 적용한 뒤 별도 에이전트가 사용자 관점에서 검증합니다.

## 진행 흐름

1. A1 기능·콘텐츠 구조 → A2 사용·읽기 흐름 → A3 화면·페이지 분할을 사용자와 순서대로 확인합니다.
2. B에서 서로 다른 와이어프레임을 최소 3개 비교하고 구조를 고릅니다.
3. C에서 승인된 같은 구조·콘텐츠로 9개 테마를 실제 렌더해 비교합니다. 색뿐 아니라 여백, 모서리, 컴포넌트, 글꼴, 재질을 분리해 선택할 수 있습니다.
4. 선택안을 다시 렌더해 확인받고 주요 화면·페이지에 적용합니다. 상호작용이 있는 결과물은 작동하는 프로토타입으로 D의 모션과 흐름을 확인합니다.
5. 제작자가 실제 렌더를 검사하고, 별도 에이전트가 제작 맥락 없이 결과물을 검토합니다. 자동 검사 통과는 시각 품질이나 사용자 승인을 대신하지 않습니다.

작은 수정에는 영향받는 단계만 적용합니다. 제품별 간격·R·모션 수치 등은 고정하지 않고 실제 목적과 기기에서 정합니다.

## 설치

저장소 루트에 `SKILL.md`가 있습니다. Codex에서는 이 저장소를 `~/.codex/skills/ux-design-master`에, Claude Code에서는 `~/.claude/skills/ux-design-master`에 복제하거나 복사합니다. 호출 이름은 `$ux-design-master`입니다. 표시 이름은 **UX-design-master**입니다.

```bash
git clone https://github.com/happy4ed/UX-Design-Master.git ~/.codex/skills/ux-design-master
```

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
