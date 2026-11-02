# 색상·그라데이션 지식 그래프

Threads 원본은 **3개 팔레트, 각 6색**이다. 사이트별 내부 시연 팔레트는 기존 3색에서 **30개 사이트 각각 7색**으로 확장했다. 7색은 배경·표면·본문·경계·주 강조·보조 강조·제3 강조로 구성한다. [색 확장 데이터](../knowledge/palette-expansions.json)의 세 강조색은 서로 다른 색상각을 활용하며, 관찰값이 아닌 내부 디자인 제안이다. 원본 사이트의 공식 색상으로 해석하지 않는다.

[그래프 데이터](../knowledge/color-knowledge-graph.json)는 Threads 게시물의 3개 팔레트, 이전에 조사한 30개 사이트의 색상 표본과 내부 시연 팔레트, 사이트를 다시 열어 측정한 CSS 그라데이션을 연결한다. [색 변주와 구조군 비교 화면](../samples/color-variation-review.html)에서 30개 사이트를 중복 없이 훑고 생성한 변주·그라데이션을 볼 수 있다. [Threads 라벨 원본 기록](../knowledge/thread-palettes.json), [사이트 그라데이션 관찰](../knowledge/web-gradient-observations.json), 기존 [스타일 프로필](../knowledge/web-style-profiles.json)을 함께 둔다.

## 노드와 관계

| 노드 | 뜻 | 주요 관계 |
| --- | --- | --- |
| `source` | 게시물 이미지, 이전 DOM 표본, 이번 CSS 측정 | `presents_palette`, `samples_site`, `records_gradient` |
| `site` | 조사한 웹사이트 | `observed_text_color`, `observed_background_color`, `observed_gradient`, `inspires_projection` |
| `palette` | 출처가 이름·코드를 표시한 팔레트 또는 내부 시연용 조합 | `has_swatch`(순서·역할·증거 구분) |
| `gradient` | 특정 사이트 요소의 계산된 `background-image` | `contains_color`(CSS에 나타난 순서) |
| `color` | HEX 또는 원본 CSS 색상 | `next_lighter_in`(게시물의 어두운→밝은 순서) |
| `style_family` | 표본 화면의 구조 유사도에 따른 탐색용 묶음 | `member_of_style_family` |
| `color_variant` | 키 컬러에서 내부 생성한 목적별 색상 변주 | 원본 팔레트·시드 색과 연결 |
| `gradient_candidate` | 변주색으로 내부 생성한 2~3색 그라데이션 | 색상 스톱과 연결 |
| `mobile_screen` | iOS 27·One UI 9 기본 앱 캡처의 화면 상태와 목적 | `contains_component`, `sampled_raster_color`, `observed_gradient` |
| `mobile_component` | 화면 안에서 판정한 역할·유형 | 화면의 하위 요소 |
| `background_analysis` | 화면별 Z 레이어 기록의 뿌리 | `has_visual_layer`, `has_edge_pixel_clue` |
| `visual_layer` | 화면 바탕 또는 영역의 바탕·구성·강조·효과 | `contains_visual_layer`, `has_base_color`, `has_accent_color`, `visually_occludes` |

`image-label`은 게시물 이미지에 쓰인 HEX 값이다. `computed-style-sample`은 이전 1440×900 표본의 DOM 색상 출현 빈도이며 공식 디자인 토큰이 아니다. `computed-style-live`는 이번에 다시 연 페이지의 현재 CSS `background-image`다. `internal-projection`은 과거 스타일 맵의 시연색으로 **원본 사이트의 정확한 색상이라고 주장하지 않는다**. 페이지마다 캡처 시점·로드 상태가 다르고, 그라데이션은 로드된 DOM의 서로 다른 CSS 표현을 최대 10개만 보존한다. 관찰값 0개는 그 사이트 전체에 그라데이션이 없다는 뜻이 아니다.

기본 앱 화면의 `manual-raster-analysis`는 [21개 화면](mobile-app-study.md)을 눈으로 읽어 영역·역할을 적은 기록이다. `raster-pixel-sample`과 `raster-approximation`은 캡처의 픽셀 색과 색 전이이며 원본 앱의 디자인 토큰이나 그라데이션 정의가 아니다. 추가 표본의 색 역할이 미확인인 경우 최빈색을 키 컬러로 채우지 않는다.

[화면 바탕과 Z 레이어 분석](background-depth-analysis.md)은 모든 색상 분석에 적용한다. [모바일 Z 레이어 기록](../knowledge/mobile-backdrop-observations.json)은 21개 화면을 **화면 전체 바탕 → 의미 영역·컴포넌트**의 소속 트리로 기록하고, 실제로 확인한 가림 관계만 별도 연결한다. 각 층의 바탕·구성·강조·효과는 독립 필드다. 색을 특정 층에 배정할 증거가 없으면 비워 둔다. 가장자리 픽셀군은 바탕색 토큰이 아니다. 웹 레퍼런스는 [DOM 시각층 검사기](../assets/layout/background-layer-audit.mjs)의 부모·계산 스타일·stacking-context 단서와 실제 렌더를 대조한다.

색상 노드의 `oklch`와 `relativeLuminance`, 팔레트 인접 관계의 `contrastRatio`는 기록된 HEX에서 계산한 파생값이다. 명도만 같은 색을 목표로 삼지 않는다. 후보를 고를 때 명도·채도·색상각·대비의 분화 목적을 먼저 정하고 실제 전경/배경 대비와 출력 환경을 검수한다. 이미지에 있는 색상 순서가 UI 역할을 결정하지 않으므로 배경/본문/강조/상태 역할은 프로젝트에서 새로 설계한다.

## 키 컬러 변주와 레퍼런스 중복 줄이기

[색 변주 데이터](../knowledge/color-variations.json)는 30개 사이트의 **내부 시연용** 키 컬러, Threads 이미지의 3개 시드와 [기본 앱 캡처](mobile-app-study.md)의 UI 강조색 2개에서 생성했다. 총 35개 시드마다 유사색 ±30°, 보색 180°, 분할 보색, 동일 OKLCH 명도의 색상각 변주, 채도 증감, 밝고 어두운 변주와 유사색·톤·보색 그라데이션을 둔다. 후보의 `sourceEvidence`를 확인한다. 사이트용 시드와 생성색은 원본 사이트의 공식 색이 아니다. 앱 시드는 JPG 픽셀 표본이며 OS 토큰이 아니다. 실제로 관찰·승인한 키 컬러는 `--hex`로 별도 계산한다.

1. 먼저 배경·본문·강조·상태 등 **역할**과 대비 목표를 정한다. 강조가 필요하면 보색/분할 보색, 차분한 연결이면 유사색, 깊이가 필요하면 같은 색상각의 명도 변화를 비교한다. 동일 명도의 다른 색상각은 다른 의미 범주를 비슷한 시각 무게로 배치할 때 쓴다.
2. OKLCH 색상각을 돌리면 일부 색은 sRGB 밖으로 나간다. 내부 생성기는 L·색상각을 유지하고 채도를 줄여 색역에 맞춘다. `mapping.gamutReduced`와 실제 HEX를 확인한다. 동일 OKLCH 명도는 동일한 상대 휘도나 전경 대비를 보장하지 않는다.
3. 단색 후보는 실제 배경과 대비를 확인한다. 그라데이션 위 본문은 시작·중간·끝 전체에서 대비를 확인하고, 텍스트가 겹치는 구간을 실제 렌더로 검수한다. `foreground.textSafe`는 검정/흰색 4.5:1 표본 검사에 통과했다는 좁은 의미다. 글자 외의 선·경계·상태 의미에는 각각의 기준과 비색상 단서를 검토한다.
4. [스타일 구조군](../knowledge/style-families.json)은 30개 사이트를 17개 탐색용 군으로 묶는다. 같은 군의 사이트를 중복 추천하는 대신 군별 대표를 먼저 보여주고, 선택된 군의 개별 색·서체·간격 차이를 살핀다. 이 유사도는 제한된 홈페이지 표본의 구조 비교다.

## 조회와 갱신

```bash
python3 scripts/query_color_kg.py --palette blue-hour
python3 scripts/query_color_kg.py --site stripe --kind gradient --limit 5
python3 scripts/query_color_kg.py --kind palette --query projection --limit 5
python3 scripts/query_color_variations.py --site stripe --mode gradients
python3 scripts/query_color_variations.py --hex '#7C6CF2' --background '#FFFFFF' --mode hue
python3 scripts/query_color_variations.py --mobile oneui9-settings-home --mode gradients
python3 scripts/build_color_variations.py
python3 scripts/build_style_families.py
python3 scripts/capture_gradients.py --retry-errors
python3 scripts/build_color_kg.py
```

명령은 스킬 디렉터리 기준이다. 이번 그래프는 색상 **관찰 근거**와 조합의 **시각 후보**를 찾는 도구다. 사이트의 글꼴·여백·콘텐츠 밀도·표면 처리와 분리해 팔레트만 복제하지 않는다. 그라데이션은 정보 계층·브랜드 표현·상태 피드백 중 목적이 있을 때만 후보로 제시하고, 정적 단색 대안과 실제 화면을 비교한 뒤 사용자와 선정한다.
