#!/usr/bin/env python3
"""Register seven user-named guess style families without inventing original sources."""
from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BOOK=ROOT/'references/style-book'
DATA=json.loads((BOOK/'additional-style-families.json').read_text(encoding='utf-8'))['styles']
DATE='2026-11-05'
COMPONENTS=[
 '앱바','뒤로','아이콘 버튼','주 버튼','보조 버튼','글자 버튼','떠 있는 버튼','세그먼트','칩','입력','검색','목록 행','서브헤더','묶음','카드','구분선','스위치','체크','라디오','슬라이더','재생 위치','음량','미디어 버튼','진행','대화상자','바텀 시트','팝업 메뉴','토스트','스낵바','탭','아래 내비','상태 표시','빈 상태','오류 상태','이미지','포스터'
]
FIELDS=('principle','control','field','selection','content','overlay','motion','motionType','duration','ease')

def json_file(name):return json.loads((BOOK/name).read_text(encoding='utf-8'))
def write_json(name,data):(BOOK/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def role_for(name):
    if name in ('앱바','뒤로','탭','아래 내비','서브헤더'):return 'principle'
    if name in ('아이콘 버튼','주 버튼','보조 버튼','글자 버튼','떠 있는 버튼','미디어 버튼'):return 'control'
    if name in ('입력','검색'):return 'field'
    if name in ('세그먼트','칩','스위치','체크','라디오','슬라이더','재생 위치','음량'):return 'selection'
    if name in ('대화상자','바텀 시트','팝업 메뉴','토스트','스낵바'):return 'overlay'
    return 'content'

def guide(style,p,detail,expression):
    token_rows=[]
    for label,key in [('화면 바탕','bg'),('전경 글자','fg'),('정보 면','surface'),('조작 면','ctrl'),('경계','line'),('강조','accent'),('강조 위 글자','on-accent'),('카드 R','card-r'),('입력 R','field-r'),('버튼 R','button-r')]:
        token_rows.append(f"| {label} | `{p['light'].get(key,p['dark'].get(key))}` | `{p['dark'][key]}` | {'px' if key.endswith('-r') else 'CSS color/paint'} | guess | 사용자 지정 스타일 {p['number']}번 설명과 형태 원리; 내부 시연값 | {DATE} |")
    component_rows=[f"| {name} | {p[role_for(name)]} | 기본·선택·포커스·오류·긴 내용은 과업에 따라 확장; 조작 영역 48 이상 | guess; 기존 계열 {p['closest']}과 차이 검토 |" for name in COMPONENTS]
    expression_rows=[f"| {label} | {expression[key]} | 설계 가설 | 사용자 지정 특징과 기존 컴포넌트 역할에서 추론; 원본 일치 아님 |" for key,label in [('principle','형태 원리'),('action','행동·눌림'),('input','입력'),('selection','선택·해제'),('content','목록·카드·덮개'),('motion','모션 느낌')]]
    return f'''# {p['name']} — guess 기본 스타일 가이드

## A. 신원

| 이름 | 분류 | 계열·기원 | 대상 버전 | 가이드 버전 | 확인일 |
|---|---|---|---|---|---|
| {p['name']} | 자유 | 사용자 지정 스타일 {p['number']}번; {p['principle']} | 특정 플랫폼 없음 | guess-0.1 | {DATE} |

구별점: {p['distinction']} 가까운 기존 계열은 `{p['closest']}`이며 이름만 바꾼 변형으로 합치지 않는다.

## B. 근거 목록

| 번호 | 종류 | 관찰·입력 | 원본 상태 | 확인일 |
|---|---|---|---|---|
| U{p['number']} | 사용자 지정 스타일 | {p['name']}: {p['distinction']} | 원본 URL·이미지 없음; `guess` 기본 레퍼런스 | {DATE} |

추론으로 실제 출처를 꾸며내지 않는다. 새 레퍼런스가 제공되면 같은 화면과 상태에서 실측해 B에 원본 URL·캡처 조건을 추가한다.

## C. 기초 토큰 — 라이트/다크

| 이름 | 라이트 | 다크 | 단위 | 근거 등급 | 출처·추론 | 확인일 |
|---|---|---|---|---|---|---|
{chr(10).join(token_rows)}

값은 [기준 화면 CSS](../../samples/style-book-additional-tokens.css)의 실제 작동값이다. 원본값이 아닌 `guess`이며, 콘텐츠 대비·상태색·그라데이션 전 구간은 제품 화면에서 다시 확인한다.

## D. 기기 모드 · 레이아웃

| 모드 | 구성 원칙 | 검증 |
|---|---|---|
| 폰 | 한 열과 명확한 주 행동; {p['principle']} | 좁은 폭·긴 한국어·200% 글자 |
| 폴드 펼침 | 같은 읽기 순서를 두 칸에 재배치 | 힌지·포커스·스크롤 독립성 |
| 태블릿 | 넓은 열에 과도한 카드 반복 없이 정보 묶음 조정 | 빈 여백·열 정렬·조작 영역 |

폰/폴드/태블릿의 폭은 대상 기기에서 결정한다. 아래 추정값을 공통 절대 좌표로 옮기지 않는다.

## E. 컴포넌트 명세

원본이 없어도 부품을 구현한다. 다음 36개는 기본 목록이며 실제 제품에서는 기능·정보 계약으로 추가·제외한다. [작동하는 13개 대표 역할](../../samples/style-guess-books.html?style={style}#components)에서 형태와 상태를 비교한다.

| 컴포넌트 | 스타일 적용 규칙 | 상태·데이터·조작 | 근거 등급 |
|---|---|---|---|
{chr(10).join(component_rows)}

## E.1. 글꼴·아이콘·슬라이더 결정

| 부품 | 형태·사용 규칙 | 근거 등급 | 상세 근거 |
|---|---|---|---|
| 글꼴 | {detail['font']} | guess | {detail['source']} |
| 아이콘 | {detail['icon']} | guess | {detail['source']} |
| 재생 위치 | {detail['scrub']} | guess | {detail['source']} |
| 음량 | {detail['volume']} | guess | {detail['source']} |

### E.2. 컴포넌트별 형태·상태·모션 변환

| 층 | 현재 시연 규칙 | 등급 | 근거·남은 측정 |
|---|---|---|---|
{chr(10).join(expression_rows)}

각 규칙은 원본 일치가 아닌 설계 가설이다. 새 원본에서 같은 부품·상태가 보이면 실측해 교체한다.

## F. 과업 패턴

| 패턴 | 구성 원칙 | 실패 조건 |
|---|---|---|
| 탐색→상세 | {p['content']} | 카드가 정보 계위를 대신함 |
| 선택→피드백 | {p['selection']} | 색만으로 선택 의미를 전달함 |
| 입력→오류→복구 | {p['field']} | 오류 때문에 입력값·포커스가 사라짐 |

## G. 인터랙션

| 동작 | 스타일 반응 | 접근성 |
|---|---|---|
| 탭·클릭 | {p['motion']} | 움직임 감소 시 끝 상태 즉시 표시 |
| 키보드 | 포커스 윤곽·선택 상태를 동작과 동기화 | Tab·Enter·Space·Esc 경로 |
| 스크롤·드래그 | 장면 또는 값이 실제 입력에 따라 변함 | 중단·역전·대체 조작 제공 |

## H. 문구

제목은 목적·화면 역할을 짧게 쓴다. {p['name']}의 장식 문구가 기능 이름을 대신하지 않는다. 한글·영문 긴 문구와 RTL에서 줄바꿈·정렬을 확인한다.

## I. 허용·금지

| 허용 | 금지 |
|---|---|
| {p['principle']}을 과업에 필요한 영역에 적용 | 외형 때문에 필수 정보·조작을 가리기 |
| {p['distinction']} | 가까운 스타일 `{p['closest']}`의 효과를 그대로 복사 |

## J. 접근성

앱 조작 영역 48 이상과 모바일 조작 글자 14 이상을 시작 하한으로 확인 C에서 사용자에게 실제 기기 크기로 보여준다. 웹·문서는 매체별 하한을 별도로 확인한다. 색 대비, 150/200% 글자 확대, 키보드 순서, 모션 감소, 터치·드래그 대체를 검수한다.

## K. 미확인과 guess 교체

원본 URL·실제 부품 치수·원본 모션은 미확인이다. 현재 C/E/G의 값은 `guess`로 **구현하여 사용 가능한 기본 레퍼런스**다. 근거가 생기면 원본 상태를 실측하고 현재 결과와 비교해 값·샘플을 고친 뒤 해당 `guess`만 제거한다.

## L. 검증 렌더

- [기본 컴포넌트북·모션북](../../samples/style-guess-books.html?style={style}): 작동 가안. 원본 대조 **NOT_RUN**.
- 폰/폴드 × 라이트/다크의 내부 기하 검사는 기준 화면을 렌더한 뒤 결과를 기록한다. 내부 PASS는 원본 충실도 PASS가 아니다.
'''

def main():
    details=json_file('detail-decisions.json')
    guesses=json_file('guess-presets.json')
    expressions=json_file('component-expression.json')
    reference_file=BOOK/'additional-style-references.json'
    references=json.loads(reference_file.read_text(encoding='utf-8'))['styles'] if reference_file.exists() else {}
    css=[]
    for style,p in DATA.items():
        if style in details and style not in guesses['styles']:
            raise SystemExit(f'inconsistent registry: {style}')
        detail={"preview":style,"font":p['font'],"icon":p['icon'],"scrub":p['scrub'],"volume":p['volume'],"grade":"guess","source":f"additional-style-families.json {style}; 사용자 지정 스타일 {p['number']}","iconForm":p['iconForm'],"sliderForm":p['sliderForm']}
        details[style]=detail
        guesses['styles'][style]={key:p[key] for key in FIELDS}
        expression={"principle":p['principle'],"action":p['control'],"input":p['field'],"selection":p['selection'],"content":p['content'],"motion":p['motion']}
        expressions['styles'][style]=expression
        sources=references.get(style,{}).get('references',[])
        expressions['source_evidence'][style]=(
            {"ids":", ".join(s['id'] for s in sources),"observed":" / ".join(s['observed'] for s in sources),"missing":"실제 CSS 값·기기별 상태·모션 중간 프레임 전수"}
            if sources else
            {"ids":f"U{p['number']}","observed":"사용자 지정 스타일 특징 문구만 제공; 원본 화면 관찰 없음","missing":"원본 이미지·실제 CSS·상태·모션 전체"}
        )
        path=BOOK/f'{style}.md'
        if not path.exists():path.write_text(guide(style,p,detail,expression),encoding='utf-8')
        css.append(f".{style}"+'{'+''.join(f'--{key}:{value};' for key,value in p['dark'].items())+'}')
        css.append(f".light .{style}"+'{'+''.join(f'--{key}:{value};' for key,value in p['light'].items())+'}')
    write_json('detail-decisions.json',details)
    write_json('guess-presets.json',guesses)
    write_json('component-expression.json',expressions)
    (BOOK/'detail-decisions.js').write_text('window.STYLE_DETAILS = '+json.dumps(details,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    (ROOT/'samples/style-book-additional-tokens.css').write_text('/* Seven user-named guess style token sets. */\n'+'\n'.join(css)+'\n',encoding='utf-8')
    print(f'registered {len(DATA)} additional styles; {len(details)} total')

if __name__=='__main__':main()
