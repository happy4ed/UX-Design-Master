#!/usr/bin/env node
/** Recommend chart grammar from data shape, semantic roles and the reader's task. No npm dependencies. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const knowledge=JSON.parse(fs.readFileSync(path.join(here,'../knowledge/thread-chart-types.json'),'utf8'));
const post=Object.fromEntries(knowledge.charts.map(chart=>[chart.id,chart]));
const renderer={line:'time-series',bar:'bar-comparison',scatter:'scatter-distribution',heatmap:'value-heatmap',stacked:'stacked-categories'};
const legacy={
  trend:['line','two-point-slope'],ranking:['bar','ranked-list'],composition:['stacked','treemap'],
  share:['donut','stacked'],relationship:['scatter','bubble-distribution'],matrix:['heatmap','option-matrix'],
  cumulative:['waterfall','bar'],flow:['quantity-sankey','data-pipeline'],profile:['multi-axis-radar','bar'],
  cycle:['cyclic-polar','line'],geography:[null,'bar']
};
const validTasks=new Set(['trend','ranking','composition','share','relationship','matrix','cumulative','flow','profile','cycle','geography','attrition','hierarchy','concentration','two-way-mix','comparison']);
const args=process.argv.slice(2);
const arg=(name)=>{const at=args.indexOf(name);return at<0?null:args[at+1]};
const emit=(value)=>console.log(JSON.stringify(value,null,2));
const fail=(message)=>{console.error(message);process.exit(1)};

if(args.includes('--list')){emit({tasks:[...validTasks],threadCharts:knowledge.charts.map(({id,name,renderer})=>({id,name,renderer}))});process.exit(0)}
if(arg('--goal')){
  const goal=arg('--goal'),pair=legacy[goal];
  if(!pair)fail(`알 수 없는 목표: ${goal}`);
  const map=(id)=>id?post[id]?.renderer??renderer[id]??id:null;
  emit({goal,primary:map(pair[0]),alternative:map(pair[1]),note:'목표만으로는 데이터 적합성을 검증하지 못함. 실제 행과 역할을 --input으로 제공할 것.'});
  process.exit(0);
}
if(!arg('--input'))fail('사용법: node scripts/choose_chart.mjs --input data.json | --goal trend | --list');
let input;
try{input=JSON.parse(fs.readFileSync(arg('--input'),'utf8'))}catch(error){fail(`입력 JSON을 읽을 수 없음: ${error.message}`)}
const rows=input.rows;
if(!Array.isArray(rows)||!rows.length||rows.some(row=>!row||typeof row!=='object'||Array.isArray(row)))fail('rows에 객체 형태의 실제 데이터가 필요함');
const roles=input.roles??{};
const task=input.task??null;
if(task&&!validTasks.has(task))fail(`지원하지 않는 task: ${task}`);
for(const [role,column] of Object.entries(roles)){
  if(typeof column!=='string'||!column||rows.some(row=>!Object.hasOwn(row,column)))fail(`roles.${role} 열이 모든 행에 있어야 함: ${column}`);
}
const values=(role)=>roles[role]?rows.map(row=>row[roles[role]]):[];
const numeric=(role)=>values(role).length>0&&values(role).every(v=>typeof v==='number'&&Number.isFinite(v));
const nonnegative=(role)=>numeric(role)&&values(role).every(v=>v>=0);
const distinct=(role)=>new Set(values(role).map(String)).size;
const present=(role)=>values(role).length>0&&values(role).every(v=>v!==null&&v!==undefined&&String(v).length);
const hasPart=present('category')&&nonnegative('value')&&!roles.group&&!roles.parent;
const count=rows.length;
const warnings=[];
const candidates=[];
function add(id,score,reason,checks=[]){
  const chart=post[id];
  candidates.push({id,name:chart?.name??id,score,reason,renderer:chart?.renderer??renderer[id]??null,checks});
}
function warn(message){if(!warnings.includes(message))warnings.push(message)}

if(present('time')&&numeric('value'))add('line',task==='trend'||!task?96:72,'시간 순서에 따른 연속 값',['누락 시점과 시간 간격 확인']);
if(numeric('x')&&numeric('y'))add('scatter',task==='relationship'||!task?94:68,'두 정량 변수의 관계',['상관을 인과로 해석하지 않기']);
if(hasPart){
  if(distinct('category')!==count)warn('같은 범주가 여러 행에 있음: 범주별 합산 규칙을 먼저 정해야 함');
  add('bar',task==='ranking'||task==='comparison'?96:task?67:85,'공통 기준선에서 범주별 값을 정확히 비교');
  if((task==='share'||task==='composition'||input.partWhole===true)&&distinct('category')===count){
    if(values('value').reduce((a,b)=>a+b,0)===0)warn('구성비의 합계가 0이라 전체 비율을 계산할 수 없음');
    else if(count<=4){
      add('donut',input.showTotal===true?95:task==='share'?87:79,'소수 부분의 대략적인 전체 비율; 중앙에는 실제 합계만 표기',['동일한 분모 확인']);
      add('pie',task==='share'&&input.showTotal!==true?92:76,'소수 부분의 대략적인 전체 비율',['정확한 순위 비교에는 막대 사용']);
      add('waffle',input.unitGrid===true?97:input.denominator?80:70,'동일 단위의 칸으로 비율을 거칠게 읽음',['칸 수와 반올림 규칙 명시']);
    }else{
      add('treemap',count<=20?86:73,'많은 부분의 상대 면적을 한 화면에 배치',['작은 부분의 라벨 처리']);
      warn('부분이 많아 파이·도넛의 각도 비교가 어려움');
    }
  }
  if(task==='concentration'){
    if(values('value').some(v=>v>0))add('pareto',96,'내림차순 막대와 누적 비율로 상위 범주의 기여를 확인',['80/20 결론을 미리 가정하지 않기']);
    else warn('파레토의 누적 비율을 계산할 양수가 없음');
  }
}
if(present('stage')&&numeric('value')){
  const stages=values('value');
  if(task==='attrition'||input.orderedStages===true){
    if(input.sameCohort!==true)warn('퍼널에는 동일 코호트·동일 단위라는 확인이 필요함');
    if(stages.some((v,i)=>i>0&&v>stages[i-1]))warn('단계 값이 증가함: 유입·재진입이 있다면 퍼널 정의를 다시 확인');
    if(input.sameCohort===true&&stages.every((v,i)=>i===0||v<=stages[i-1])&&stages.every(v=>v>=0))add('funnel',96,'같은 집단의 단계별 잔존과 이탈',['분모·기간·단계 순서 확인']);
    else add('bar',73,'단계 값은 보이지만 퍼널 보존 조건은 아직 성립하지 않음');
  }
}
if(present('category')&&roles.parent&&nonnegative('value')){
  const ids=new Set(values('category').map(String));
  const parents=values('parent').filter(v=>v!==null&&v!==''&&v!==undefined).map(String);
  const edges=new Map(rows.map(row=>[String(row[roles.category]),row[roles.parent]===null||row[roles.parent]===undefined||row[roles.parent]===''?null:String(row[roles.parent])]));
  const rootCount=[...edges.values()].filter(parent=>parent===null).length;
  const hasCycle=[...edges.keys()].some(id=>{const seen=new Set();let cursor=id;while(cursor!==null){if(seen.has(cursor))return true;seen.add(cursor);cursor=edges.get(cursor)??null}return false});
  if(ids.size!==count)warn('계층 노드 ID가 중복됨');
  else if(parents.some(v=>!ids.has(v)))warn('계층의 일부 부모 ID가 행에 없음');
  else if(rootCount!==1||hasCycle)warn('선버스트에는 루트 하나와 순환 없는 부모·자식 관계가 필요함');
  else if(task==='hierarchy'||!task){
    add('sunburst',93,'부모·자식 계층의 구성비를 여러 고리로 표현',['순환·중복 집계·작은 라벨 확인']);
    add('treemap',84,'계층의 잎 값을 면적으로 비교',['부모 값의 중복 합산 방지']);
  }
}
if(numeric('delta')&&Number.isFinite(input.startValue)){
  const end=input.startValue+values('delta').reduce((a,b)=>a+b,0);
  if(Number.isFinite(input.endValue)&&Math.abs(end-input.endValue)>1e-8)warn(`시작값+증감=${end}, 제공된 끝값=${input.endValue}: 폭포 차트의 합계 불일치`);
  else add('waterfall',task==='cumulative'||!task?97:75,'시작값에 순서대로 양·음 기여를 더해 끝값을 설명',[`계산된 끝값 ${end}`]);
}
if(present('category')&&present('group')&&nonnegative('value')){
  const groups=distinct('group'),categories=distinct('category');
  const keys=rows.map(row=>`${row[roles.category]}\u0000${row[roles.group]}`);
  if(new Set(keys).size!==keys.length)warn('두 범주 조합에 중복 행이 있음: 합산 규칙을 먼저 정해야 함');
  else if(keys.length!==categories*groups)warn('두 범주 조합에 빈 셀이 있음: 0인지 누락인지 확인해야 함');
  else if(task==='two-way-mix'||input.twoWayComposition===true){
    if(categories<=8&&groups<=6&&values('value').some(v=>v>0))add('marimekko',96,'범주별 전체 크기(폭)와 내부 구성(높이)을 동시에 비교',['폭·높이·면적의 분모를 각각 표기']);
    else warn('마리메코의 범주 수가 많거나 전체 값이 0임; 누적 막대와 합계표를 검토');
    add('stacked',81,'범주별 구성은 누적 막대로, 전체 크기는 합계와 함께 표시');
  }else if(task==='matrix')add('heatmap',94,'두 범주 축의 교차값 패턴',['색상만으로 값 전달하지 않기']);
}
if(task==='geography')warn('현재 내부 지도 렌더러가 없음; 지리 위치가 핵심이면 별도 구현 필요');
if(!Object.keys(roles).length)warn('roles가 비어 있음: 데이터 열의 의미를 지정해야 차트 후보를 판별할 수 있음');
if(!task)warn('독자의 질문(task)이 없어 데이터 형태에 맞는 후보만 제시함; 목적을 확인해야 최적안을 고를 수 있음');
candidates.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
const unique=[...new Map(candidates.map(c=>[c.id,c])).values()];
emit({task,rows:count,recommendation:unique[0]??null,alternatives:unique.slice(1,4),warnings,decisionStatus:!task||!unique.length?'needs-human-decision':'provisional',note:'추천은 초안이다. 실제 수치·단위·라벨·분모를 원본과 대조하고 렌더 후 판독성을 검수한다. renderer=null은 내부 지식만 있고 전용 렌더러는 아직 없다는 뜻이다.'});
