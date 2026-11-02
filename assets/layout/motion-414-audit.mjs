// Review evidence is intentionally sparse. Unreviewed entries must never inherit
// a PASS from their family, from DOM animation existence, or from pixel change.
const reviewed = {
  'light-sweep': {referenceObserved:true,sampleTarget:'빛이 지나가는 로고 표면',sampleSuitable:'NOT_RUN',semanticMatch:'NOT_RUN'},
  'shine-sweep': {referenceObserved:true,sampleTarget:'빛이 로고 면 안에서만 지나가는 아이콘',sampleSuitable:'PASS',semanticMatch:'NOT_RUN',canonicalMotionId:'light-sweep',aliasOrVariant:'로고 형태 안으로 제한한 변형',note:'원본·내부 3시점 비교에서 빛띠의 가시성을 확인했다. 정확한 시간 위상 일치는 미검사.'},
  'screen-dive': {referenceObserved:true,sampleTarget:'장면이 담긴 노트북 화면',sampleSuitable:'NOT_RUN',semanticMatch:'NOT_RUN'},
  'line-draw': {referenceObserved:true,sampleTarget:'화살촉이 따라가는 그래프 경로',sampleSuitable:'PASS',semanticMatch:'PASS',note:'원본과 내부의 시작·중간·종료 장면에서 경로가 그려지고 화살촉이 끝을 따라가는 동작을 확인했다. 정확한 재생 시간은 미검사.'},
  'odometer': {referenceObserved:true,sampleTarget:'자릿수별 숫자 릴과 누적 값',sampleSuitable:'PASS',semanticMatch:'PASS',note:'원본과 내부의 시작·중간·종료 장면에서 자릿수별 세로 굴림과 12,480 최종값을 확인했다. 정확한 재생 시간은 미검사.'},
  'odometer-roll': {referenceObserved:true,sampleTarget:'순차로 멈추는 숫자 릴과 완료 밑줄',sampleSuitable:'PASS',semanticMatch:'PASS',note:'원본과 내부의 시작·중간·종료 장면에서 숫자 릴과 48,210 완료 밑줄을 확인했다. 정확한 재생 시간은 미검사.'},
  'punch-in': {referenceObserved:true,sampleTarget:'중간 프레임 없이 한 번에 확대되는 보라색 사각형',sampleSuitable:'PASS',semanticMatch:'PASS',note:'원본 CSS의 50% 단일 점프와 내부 구현을 25/55/75% 위상에서 대조했다. 정확한 제품 재생 시간은 미검사.'},
  'snap-zoom': {referenceObserved:true,sampleTarget:'1→1.25→1.6→2.1배로 계단 확대되는 주황색 사각형',sampleSuitable:'PASS',semanticMatch:'PASS',note:'원본 CSS의 세 단계 확대와 내부 구현을 25/55/75% 위상에서 대조했다. 정확한 제품 재생 시간은 미검사.'},
  'zoom': {referenceObserved:true,sampleTarget:'점 배경과 중앙 사각형이 함께 확대되는 전체 장면',sampleSuitable:'PASS',semanticMatch:'PASS',note:'원본 4초 ease-in-out 장면의 배경·중앙 요소 동시 1→1.7배 확대를 내부 중간·끝 장면과 대조했다. 반복 역방향은 별도 검사가 필요하다.'},
  'float-bob': {referenceObserved:true,sampleTarget:'상하로 뜨는 번개 아이콘과 반응하는 바닥 그림자',sampleSuitable:'PASS',semanticMatch:'PASS',note:'원본 0.5초·1.5초 장면과 내부 같은 위상을 대조했다. 2초 상하 왕복, 4초 미세 기울기, 그림자 폭의 반대 변화를 구현했다.'},
  'shape-morph': {referenceObserved:true,sampleTarget:'크기와 둥글기가 함께 변하는 도형',sampleSuitable:'NOT_RUN',semanticMatch:'NOT_RUN'},
  'roadmap-path': {referenceObserved:true,sampleTarget:'이정표가 놓인 곡선 경로',sampleSuitable:'NOT_RUN',semanticMatch:'NOT_RUN'},
  'arrow-chain': {referenceObserved:true,sampleTarget:'연결 화살표와 단계 상자',sampleSuitable:'NOT_RUN',semanticMatch:'NOT_RUN'},
  'branch-flow': {referenceObserved:true,sampleTarget:'마름모 질문과 두 갈래 경로',sampleSuitable:'NOT_RUN',semanticMatch:'NOT_RUN'},
  'cycle-loop': {referenceObserved:true,sampleTarget:'순환 단계와 시계 방향 연결 호',sampleSuitable:'PASS',semanticMatch:'NOT_RUN',note:'단계 사이 화살표 호를 추가했다. 시점별 원본 대조는 남아 있다.'},
  'timeline-axis': {referenceObserved:true,sampleTarget:'과거 실선·현재 점·미래 점선',sampleSuitable:'NOT_RUN',semanticMatch:'NOT_RUN'},
  'chevron-steps': {referenceObserved:true,sampleTarget:'맞물리는 화살 띠와 진행 막대',sampleSuitable:'PASS',semanticMatch:'NOT_RUN',note:'맞물림과 진행 막대의 최종 프레임을 확인했다. 시점별 원본 대조는 남아 있다.'},
  'morph-cut': {referenceObserved:false,sampleTarget:'얼굴 도형',sampleSuitable:'FAIL',semanticMatch:'NOT_RUN',note:'실제 영상 두 테이크의 보간을 정적 도형으로 충분히 설명하지 못한다.'}
};
const relationCandidates = {
  'light-sweep': {other:'shine-sweep',kind:'같은 광 스윕 원리의 로고 형태 변형',status:'PASS'},
  'shine-sweep': {other:'light-sweep',kind:'같은 광 스윕 원리의 로고 형태 변형',status:'PASS'},
  'tv-off': {other:'squeeze-line',kind:'서로 다른 축의 동작',status:'PASS'},
  'squeeze-line': {other:'tv-off',kind:'서로 다른 축의 동작',status:'PASS'},
  'shape-morph': {other:'morph-cut',kind:'도형 변환과 영상 보간',status:'PROVISIONAL'},
  'morph-cut': {other:'shape-morph',kind:'영상 보간과 도형 변환',status:'PROVISIONAL'}
};
export function motionAudit(id){
  return {referenceObserved:false,sampleTarget:'미선정',sampleSuitable:'NOT_RUN',semanticMatch:'NOT_RUN',canonicalMotionId:id,aliasOrVariant:null,...reviewed[id],relation:relationCandidates[id]||null};
}
