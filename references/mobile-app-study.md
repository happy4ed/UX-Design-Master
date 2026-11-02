# iOS 27 · One UI 9 기본 앱 화면 추출

색상·효과를 볼 때는 [배경·표면·깊이 분석 계약](background-depth-analysis.md)과 [21개 화면의 배경 기록](../knowledge/mobile-backdrop-observations.json)을 함께 확인한다. 스크린샷에서 확인할 수 없는 그림자·블러 수치는 미측정으로 표시한다.

[화면별 구조·컴포넌트·색상 데이터](../knowledge/mobile-app-observations.json)에 **21개 화면(iOS 27 10장, One UI 9 계열 11장)**을 기록했다. 처음 7장에 기존 [고해상도 화면 분석 14장](../knowledge/mobile-platform-analysis-full.json)을 스킬 내부 자산으로 합쳤다. 추가 14장의 전체 노드·그리드·근거는 원본 분석 파일에 보존하고, 원본 캡처 파일은 스킬에 포함하지 않고 원본 게시물 주소만 출처로 기록한다. 분석 순서는 화면 내용 읽기 → 목적과 상태 → 영역과 읽기 순서 → 컴포넌트 역할 → 정렬·간격·표면 → 화면 색 표본이다. 원본 이미지 좌표의 영역은 추정 위치이며 pt/dp 또는 실제 터치 영역이 아니다. 정적 캡처에서 동작을 확인할 수 없으면 후보/미확인으로 남긴다.

## 플랫폼 관례와 관찰된 부재

21개 상단 영역을 같은 크롭으로 다시 비교했다. **없는 선·그림자도 관찰값**으로 기록하되 보이지 않는 효과의 CSS 값이나 OS 전체 규칙으로 확대하지 않는다.

| 플랫폼·표본 | 상단과 본문에서 보인 관계 | 새 화면에 적용할 조건 |
| --- | --- | --- |
| One UI 9 Settings 홈·Calendar 월·Calculator 공학 모드 | 상단 조작/제목 영역과 본문이 같은 바탕으로 이어지고, 경계에 별도 1px 선이나 드롭 그림자가 보이지 않음 | 이 표본을 기준으로 한 앱 화면에서는 웹의 app bar 하단 divider·shadow를 기본으로 넣지 않음 |
| One UI 9 Beta Notes·앱 알림 목록·모드 및 루틴 | 화면마다 도구줄·내용 구획은 다르지만, 상단 바를 웹 사이트 헤더처럼 강한 선으로 분리한 근거는 없음 | 도구줄 내부의 경계와 앱바/본문 경계를 혼동하지 않고 해당 화면 크롭 재확인 |
| iOS 27 Calendar 생성·상세, AirPods 설정, Sounds & Haptics | 상단 조작줄은 본문 바탕 또는 그룹 표면과 연결되며 독립된 진한 헤더 선은 관찰되지 않음. 일부 목록 행 구분선은 별도 | 목록 내부 divider를 상단 내비게이션 경계로 복사하지 않음. 스크롤 상태·소재에 따라 달라질 수 있으므로 대상 화면 검증 |

플랫폼 관례가 웹 구조군의 선·그림자와 충돌하면 화면의 과업과 선택한 플랫폼 표본을 우선한다. 경계가 실제로 관찰된 다른 상태나 사용자 브랜드 요구는 예외로 기록한다. 시각 방향 C의 대표 렌더에서 앱바 아래 선·그림자 유무를 직접 확인한다.

새 비교 페이지는 실제 표시 크기에서 표·긴 설명·한글 줄바꿈을 다시 검수한다. 이전 비교 화면의 캡처와 검수 기록은 배포 스킬에서 제외했다.

| 화면 | 상위 구조 | 중요한 컴포넌트 판정 | 색과 표면 관찰 |
| --- | --- | --- | --- |
| iOS 27 Calendar 일정 상세 | 일정 정보 → 시간표 → 장소 → 속성 → 삭제 | 상단 닫기/편집은 버튼, 시간표는 시각화, 속성은 grouped row | 밝은 중성 배경과 흰 그룹 표면. 파랑은 일정색일 수 있어 앱 키 컬러로 채택하지 않음 |
| iOS 27 Calendar 일정 생성 | 작성 대상 → 제목/시간 → 장소/참석자 → 옵션 | Event/Reminder는 작성 대상을 바꾸는 segmented control. 행별 입력·선택 역할 분리 | 동일 중성 배경과 필드. 파랑 이벤트 줄은 데이터 종속 |
| iOS 27 Passwords 진행 | 설명 → 계정별 상태 목록 | 각 계정은 반복 상태 행, 마지막은 진행 스피너 | 흰 배경과 단일 목록 컨테이너. 녹색은 완료 상태색 |
| One UI 9 Settings 홈 | 큰 제목 영역 → 계정 → 카테고리 → 하단 검색 | 설정 항목은 navigation row, 검색은 별도 지속 제어 | 따뜻한 중성 배경, 흰 그룹 표면, 보라 제목. 큰 상단 여유는 한 손 조작과 연관된 구조 후보 |
| One UI 9 Calendar 월 | 월/도구 → 요일 → 7열 날짜 → 추가 | 날짜 그리드와 이벤트 데이터 마크를 분리. 하단 추가는 행동 | 흰 열린 그리드. 분홍/보라 등은 이벤트 카테고리색 |
| One UI 9 Calculator 공학 모드 | 결과 → 함수 → 숫자/연산 | 4열 키패드, 연산 열의 명확한 기능·색 구분 | 카드 컨테이너 없이 알약형 키를 반복. 분홍 계열 연산색 |
| One UI 9 Weather 지표 | 위치 → 2열 측정값 → 하단 도구 | 반복 타일은 데이터 묶음이며 탭 가능 여부 미확인. UV 바·바람 나침반·압력 게이지는 서로 다른 시각화 | 청색→청록→청색 전면 배경과 반투명 타일. 날씨·장소에 따라 달라질 수 있음 |

## 보강한 14개 화면

| 플랫폼 | 추가 앱·화면 | 비교할 수 있는 역할 |
| --- | --- | --- |
| iOS 27 | AirPods 설정 상단·스크롤 아래, Calendar 자연어 입력, Mail 검색, Music 아티스트 상세, Sounds & Haptics, Safari 메뉴 | 그룹 행·폼·검색·미디어 제어·오버레이의 반복과 차이 |
| One UI 9 Beta | Quick Panel, 위치 권한, Samsung Notes 도구, 앱 알림 목록, 모드 및 루틴, 전화 통화, 잠금화면 미디어 | 토글/슬라이더·라디오 선택·설정 목록·도구 팔레트·미디어 제어의 반복과 차이 |

추가 14장은 기존 수동 구조 분석의 사진과 판정 기록을 내부화한 것이다. iOS AirPods 두 장은 **한 앱의 연속 캡처**로, Calendar 생성 두 장은 **같은 앱의 서로 다른 작성 상태**로 센다. One UI Beta 자료와 이후 One UI 9 캡처는 버전·기기·테마가 다를 수 있어 같은 숫자로 합치지 않는다.

## 공통값의 자격

[반복값 데이터](../knowledge/mobile-common-values.json)는 비교 가능한 화면 **3장 이상, 서로 다른 앱 2개 이상**에서만 구조 후보를 제시하고 표본별 값을 공개한다. 현재 iOS 27의 첫 왼쪽 정렬선은 6개 앱 화면에서 가로 400px 비교틀로 환산하면 **15.0–17.9**, 중앙값 **16.2**다. One UI 9 Beta의 3개 앱 화면은 **13.1–14.8**, 중앙값 **14.0**이지만 한 게시물·기기 표본이며 이후 Settings 화면은 더 안쪽에서 시작한다. 이 값은 **이미지 비율 비교값**이고 pt/dp 또는 플랫폼 공식 토큰이 아니다.

iOS 밝은 중성 배경은 AirPods·Calendar 두 앱에서, One UI 따뜻한 중성 배경은 Settings·Calculator 두 앱에서 반복해 보인다. 색은 캡처 상태와 테마의 영향을 받는다. 정확한 R·행 높이·갭 배수·글자 크기·터치 영역·모션·공통 그라데이션 스톱은 이 표본만으로 확정하지 않는다. 같은 앱 안의 여러 행을 여러 독립 앱의 증거처럼 세지 않는다.

## 출처와 해석 한계

- iOS 27 Calendar의 [일정 상세](https://9to5mac.com/2026/09/03/apples-calendar-app-in-ios-27-has-brand-new-design-for-key-features/)와 일정 생성은 9to5Mac의 iOS 27/26 비교 이미지다. **왼쪽 기기만 iOS 27**로 기록했다. 이미지 안의 기기 프레임·배경은 앱 디자인 계산에서 제외한다.
- iOS 27 Passwords는 [Apple iOS 27 제품 페이지](https://www.apple.com/os/ios/)의 부분 화면이다. 전체 기기 캡처가 아니므로 안전 영역·하단 내비게이션을 추론하지 않는다. Apple은 [iOS 27 UI 키트](https://developer.apple.com/design/resources/)도 제공하지만, 여기의 수치는 키트 토큰을 읽은 결과가 아니다.
- One UI 9 네 화면은 [Samsung Members 비교 게시물](https://r1.community.samsung.com/t5/others/one-ui-8-5-vs-one-ui-9-bedah-perbedaan-amp-fitur-baru-di-galaxy/td-p/39487394/highlight/true/page/2)의 작성자가 One UI 9로 표시한 2026-09-17 캡처다. 공식 디자인 가이드나 OS 전체의 불변 규칙으로 취급하지 않는다.
- 추가 iOS 화면은 MacStories의 [iOS/iPadOS 27 리뷰](https://www.macstories.net/stories/ios-and-ipados-27-review/)에 포함된 캡처, 추가 One UI 화면은 [Samsung Members의 One UI 9 Beta 후기](https://r1.community.samsung.com/t5/갤럭시-s/후기-oneui9-beta-변경점-살펴보기-달라진-점은/td-p/38008048)와 Samsung Members 유럽 Quick Panel 게시물의 캡처다. 원본·추출 영역·컴포넌트 매핑은 내부 JSON에 남긴다. 리뷰와 사용자 게시물은 공식 디자인 토큰 자료가 아니다.
- JPEG에서 읽은 HEX는 픽셀 표본이다. 디스플레이 테마·콘텐츠·스크린샷 압축의 영향을 받는다. CSS/SwiftUI/Android 리소스 토큰으로 역추정하지 않는다. 일정색·상태색·날씨 그라데이션은 앱 브랜딩과 구분한다.

## 새 디자인에 쓰는 방법

1. 실제로 만들 앱의 목적과 화면 상태를 먼저 정의한 뒤, 위 7개 중 **같은 역할**의 화면을 찾는다. Settings 목록을 Calendar 그리드와 같은 '카드 스타일'로 묶지 않는다.
2. 원본의 구조 원칙(큰 제목과 조작 영역, grouped row, 격자 정렬, 수치 타일, 키패드 간격)을 새 화면의 데이터 양과 터치 영역에 맞춰 재설계한다. 화면 속 영역 좌표를 실제 pt/dp로 복사하지 않는다.
3. 안정적인 UI 강조로 볼 여지가 있는 Settings 제목과 Calculator 연산키 두 색만 [내부 색 변주](../knowledge/color-variations.json)에 시드로 넣었다. 같은 캡처의 테마색일 수 있으므로 새 프로젝트의 배경·역할·대비에 맞춰 다시 선택한다. 나머지 데이터색은 앱 전체 키 컬러로 확장하지 않는다.
4. 화면의 요소 역할은 [모바일 패턴 KB](../knowledge/mobile-patterns.json)에 매핑하고, 없는 복합 유형만 새 후보로 남긴다. 탭·버튼·스위치·검색·데이터 영역을 시각형만으로 판정하지 않는다.

```bash
python3 scripts/query_color_variations.py --mobile oneui9-settings-home --mode hue
python3 scripts/query_color_variations.py --mobile oneui9-calculator-scientific --mode gradients
python3 scripts/query_color_kg.py --mobile oneui9-weather-metrics --kind mobile_screen
python3 scripts/build_mobile_common_values.py
```
