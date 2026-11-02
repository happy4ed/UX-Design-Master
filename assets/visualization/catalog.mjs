// Internal visualization taxonomy and sample fixtures. No external runtime dependencies.
const e=(id,group,name,grammar,meaning,labels,values=[])=>({id,group,name,grammar,meaning,labels,values});

export const groups=[
  ['flow','순서·전이'],['structure','구조·관계'],['quantity','정량·분포'],
  ['comparison','비교·판단'],['service','서비스·업무'],['spatial','공간·구성'],['infographic','정보 요약']
];

export const templates=[
  e('decision-flow','flow','조건 흐름도','flow','조건에 따라 경로가 갈라지고 되돌아오는 절차',['접수','검토','승인','통보']),
  e('message-sequence','flow','메시지 시퀀스','sequence','주체 사이의 시간순 요청과 응답',['사용자','서버','저장소','요청','조회','응답']),
  e('state-transition','flow','상태 전이','state','상태와 전이 조건',['대기','검토','완료','보완']),
  e('event-timeline','flow','사건 타임라인','timeline','시점별 사건과 간격',['기획','제작','검수','출시'],[1,3,6,9]),
  e('handoff-lanes','flow','역할별 수영레인','swimlane','주체별 책임과 인수인계',['고객','운영','개발','접수','분류','해결']),
  e('feedback-cycle','flow','순환 루프','cycle','마지막 단계가 처음 단계의 입력이 되는 반복',['관찰','가설','실행','학습']),
  e('stage-process','flow','단계 프로세스','process','분기보다 단계별 산출물이 중요한 과정',['입력','정리','검증','전달']),
  e('schedule-gantt','flow','일정 간트','gantt','작업 기간과 겹침',['설계','구현','검수'],[1,4,3,5,6,8]),

  e('system-architecture','structure','시스템 아키텍처','architecture','시스템 구성요소·경계·연결',['사용자','웹','API','DB']),
  e('architecture-change','structure','구조 변경 비교','delta','전후 연결 구조의 차이',['이전','이후','웹','API','DB']),
  e('current-landscape','structure','현재 시스템 지형','landscape','부서·계층별 현행 시스템 분포',['영업','운영','분석','CRM','ERP','BI']),
  e('hierarchy-tree','structure','계층 트리','tree','단일 부모에서 자식으로 내려가는 구조',['본부','상담','품질','지식']),
  e('ownership-chart','structure','조직·책임도','org','조직 소속과 담당 책임',['대표','제품','기술','운영']),
  e('containment-map','structure','포함 관계도','nested','경계 안에 포함되는 영역과 요소',['제품','워크스페이스','프로젝트','문서']),
  e('layer-stack','structure','계층 스택','layers','추상화 수준과 의존 층',['화면','서비스','데이터','인프라']),
  e('dependency-graph','structure','의존 그래프','dependency','여러 부모와 순환을 포함할 수 있는 의존',['앱','인증','검색','캐시','DB']),
  e('entity-relation','structure','엔터티 관계','er','엔터티와 1:N 관계',['고객','주문','항목']),
  e('class-model','structure','클래스 모델','uml','클래스 속성과 상속·구성',['기본 사용자','관리자','권한']),
  e('deployment-map','structure','배포 구조','deployment','실행 영역·호스트·복제본',['브라우저','게이트웨이','앱 2개','DB']),
  e('database-schema','structure','DB 스키마','db','테이블·키·필드 관계',['users','orders','id','user_id']),
  e('data-pipeline','structure','데이터 흐름','dataflow','원천에서 변환·저장·소비까지',['원천','수집','정제','저장','분석']),

  e('bar-comparison','quantity','범주 막대','bar','공통 0 기준선의 범주 크기 비교',['A','B','C','D'],[24,36,30,45]),
  e('time-series','quantity','시계열 선','line','연속 시점에 따른 한 값의 변화',['1월','2월','3월','4월','5월'],[22,31,27,42,38]),
  e('scatter-distribution','quantity','산점 분포','scatter','두 정량 변수의 위치 관계',['A','B','C','D','E','F'],[20,25,35,41,52,60,15,42,30,60,47,75]),
  e('bubble-distribution','quantity','버블 분포','bubble','두 축과 크기, 세 변수 표현',['A','B','C','D'],[20,30,45,65,20,55,35,70,10,20,15,30]),
  e('running-waterfall','quantity','누적 증감','waterfall','시작값에 양·음 기여를 더한 끝값',['시작','증가','감소','결과'],[100,30,-20,110]),
  e('value-heatmap','quantity','값 히트맵','heatmap','행·열 교차값의 패턴',['월','화','수','목'],[1,3,2,4,2,4,1,3,4,3,2,1]),
  e('multi-axis-radar','quantity','다축 레이더','radar','같은 척도의 다면 점수',['속도','안정','편의','확장','비용'],[4,3,5,3,2]),
  e('cyclic-polar','quantity','주기 극좌표','polar','순환 범주의 크기',['봄','여름','가을','겨울'],[3,5,4,2]),
  e('two-point-slope','quantity','두 시점 기울기','slope','두 시점의 순위·값 변화',['A','B','C'],[4,2,3,3,4,2]),
  e('part-treemap','quantity','면적 구성비','treemap','전체 안에서 부분의 상대적 크기',['제품','운영','연구','기타'],[45,25,20,10]),
  e('quantity-sankey','quantity','양의 분기·합류','sankey','흐름의 선 두께가 양을 나타냄',['유입','직접','검색','완료','이탈'],[100,60,40,80,20]),
  e('share-donut','quantity','구성비 도넛','donut','소수 범주의 전체 비율',['직접','검색','추천'],[50,30,20]),
  e('stacked-categories','quantity','누적 막대','stacked','범주별 전체와 구성비 동시 비교',['1분기','2분기','3분기'],[25,15,10,30,20,10,34,18,13]),

  e('priority-quadrant','comparison','우선순위 사분면','quadrant','정의된 두 축의 상대 위치',['빠른 개선','핵심 투자','보류','검토']),
  e('set-overlap','comparison','집합 교집합','venn','두 집합과 공통 원소',['A 전용','공통','B 전용']),
  e('ranked-pyramid','comparison','우선순위 피라미드','pyramid','단계별 수와 중요도 차이',['핵심','중간','기반']),
  e('option-matrix','comparison','속성 비교 매트릭스','matrix','대안별 속성과 정확한 값',['A','B','C','속도','비용','지원'],[3,2,4,2,4,3,4,3,2]),
  e('swot-four','comparison','SWOT 구획','swot','강점·약점·기회·위협의 구분',['강점','약점','기회','위협']),
  e('cause-fishbone','comparison','원인 가지도','fishbone','하나의 결과에 연결되는 원인 묶음',['문제','사람','과정','도구','환경']),
  e('value-evolution','comparison','가치·성숙도 지도','wardley','가치 사슬과 발전 단계의 위치',['사용자','경험','플랫폼','공통 기반']),

  e('work-kanban','service','업무 칸반','kanban','상태별 작업량과 진행 제한',['예정','진행','완료','작업 A','작업 B']),
  e('user-journey','service','사용자 여정','journey','단계별 행동과 감정 변화',['발견','탐색','신청','결과'],[2,3,1,4]),
  e('service-blueprint','service','서비스 블루프린트','blueprint','고객 행동과 보이는/숨은 서비스 단계',['고객','직원','시스템','탐색','신청','처리']),
  e('release-story-map','service','릴리스 스토리 맵','story','과업 흐름과 버전별 범위',['탐색','선택','신청','V1','V2']),
  e('data-medallion','service','데이터 품질 단계','medallion','원본·정제·활용의 품질 계층',['원본','정제','활용']),
  e('permission-matrix','service','권한 매트릭스','access','역할과 자원의 접근 정책',['관리자','편집자','열람자','문서','설정','보고서'],[1,1,1,1,0,1,1,0,1]),

  e('exploded-parts','spatial','부품 분해도','exploded','한 물체의 부품과 조립 순서',['상판','회로','바닥']),
  e('site-axonometric','spatial','공간 조감 구성','axonometric','하나의 공간을 각도와 구역으로 설명',['입구','작업실','회의실']),

  e('fact-strip','infographic','핵심 사실 열','factstrip','서로 독립인 수치·사실을 짧게 스캔',['방문','완료','만족'],[120,84,91]),
  e('ranked-list','infographic','순위 목록','ranked','순위와 한 줄 설명',['품질','속도','비용'],[92,84,71]),
  e('paired-compare','infographic','양면 비교','comparepanel','두 대안의 장단점과 조건',['안 A','안 B','속도','비용']),
  e('milestone-roadmap','infographic','이정표 로드맵','roadmap','목표와 단계별 산출물',['조사','설계','실험','출시']),
  e('step-narrative','infographic','설명형 단계','stepstory','단계와 짧은 해설을 연결',['문제','접근','검증','결과']),
  e('balanced-scorecard','infographic','요약 성과판','scorecard','측정값과 목표를 같은 단위로 비교',['도달','참여','완료'],[68,75,82])
];

export const byId=Object.fromEntries(templates.map(t=>[t.id,t]));
