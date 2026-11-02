import {byId,templates} from './catalog.mjs';
import {Canvas} from './svg-core.mjs';
import {renderFlow} from './families/flow.mjs';
import {renderStructure} from './families/structure.mjs';
import {renderQuantity} from './families/quantity.mjs';
import {renderComparison} from './families/comparison.mjs';
import {renderService} from './families/service.mjs';
import {renderSpatial} from './families/spatial.mjs';
import {renderInfographic} from './families/infographic.mjs';

const familyRenderers={flow:renderFlow,structure:renderStructure,quantity:renderQuantity,comparison:renderComparison,service:renderService,spatial:renderSpatial,infographic:renderInfographic};
const allowedMotion=new Set(['none','trace','reveal','pulse','grow','focus','assemble']);
const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function supportsMotion(template,mode){
  const g=typeof template==='string'?byId[template]?.grammar:template?.grammar;
  if(mode==='assemble')return ['exploded','axonometric'].includes(g);
  if(mode==='grow')return ['bar','waterfall','stacked','ranked','scorecard'].includes(g);
  if(mode==='trace')return ['flow','sequence','state','swimlane','cycle','process','dataflow','sankey','dependency','architecture','delta','er','db','deployment','medallion'].includes(g);
  return true;
}

export function recommendedMotion(template){
  const g=typeof template==='string'?byId[template]?.grammar:template?.grammar;
  if(['exploded','axonometric'].includes(g))return 'assemble';
  if(['flow','sequence','state','swimlane','cycle','process','dataflow','sankey'].includes(g))return 'trace';
  if(['bar','waterfall','stacked','ranked','scorecard'].includes(g))return 'grow';
  if(['timeline','gantt','roadmap','stepstory','journey','factstrip'].includes(g))return 'reveal';
  if(['quadrant','matrix','access','heatmap','treemap'].includes(g))return 'focus';
  return 'pulse';
}

export function renderResult(id,options={}){
  const template=typeof id==='string'?byId[id]:id;
  if(!template)throw new Error(`알 수 없는 시각화 유형: ${id}`);
  const motion=options.motion??'none';if(!allowedMotion.has(motion))throw new Error(`지원하지 않는 모션: ${motion}`);
  if(!supportsMotion(template,motion))throw new Error(`${template.id}: ${motion} 모션을 표시할 대상이 없습니다.`);
  if(options.labels!==undefined&&(!Array.isArray(options.labels)||options.labels.some(v=>typeof v!=='string')))throw new Error('labels는 문자열 배열이어야 합니다.');
  if(options.values!==undefined&&(!Array.isArray(options.values)||options.values.some(v=>!Number.isFinite(Number(v)))))throw new Error('values는 유한한 숫자 배열이어야 합니다.');
  if(template.grammar==='bar'){
    if(Boolean(options.labels)!==Boolean(options.values))throw new Error('가변 개수 범주 막대에는 labels와 values를 함께 제공해야 합니다.');
    if(options.labels&&options.values&&options.labels.length!==options.values.length)throw new Error('범주 막대의 labels와 values 개수가 같아야 합니다.');
    if(options.labels&&options.labels.length<1||options.values&&options.values.length<1)throw new Error('범주 막대에는 한 항목 이상이 필요합니다.');
  }else{
    if(options.labels&&options.labels.length!==template.labels.length)throw new Error(`labels는 ${template.labels.length}개가 필요합니다.`);
    if(options.values&&options.values.length!==template.values.length)throw new Error(`values는 ${template.values.length}개가 필요합니다.`);
  }
  const values=options.values??template.values,grammar=template.grammar;
  if(['bar','treemap','donut','stacked','sankey','bubble','scatter','radar','polar','heatmap','scorecard','factstrip','ranked'].includes(grammar)&&values.some(v=>Number(v)<0))throw new Error(`${template.id}: 음수 데이터는 이 템플릿에서 지원하지 않습니다.`);
  if(grammar==='sankey'&&(Math.abs(values[0]-values[1]-values[2])>.001||Math.abs(values[0]-values[3]-values[4])>.001))throw new Error('생키의 유입량과 분기·결과 합계가 일치해야 합니다.');
  if(grammar==='sankey'&&options.flows!==undefined){
    const flows=options.flows;
    if(!Array.isArray(flows)||flows.some(f=>![1,2].includes(f.from)||![3,4].includes(f.to)||!Number.isFinite(f.value)||f.value<0))throw new Error('생키 flows는 {from:1|2,to:3|4,value:양수} 배열이어야 합니다.');
    for(const [index,total] of [[1,values[1]],[2,values[2]],[3,values[3]],[4,values[4]]]){
      const sum=flows.filter(f=>index<3?f.from===index:f.to===index).reduce((a,f)=>a+f.value,0);
      if(Math.abs(sum-total)>.001)throw new Error(`생키 flows의 ${index}번 항목 합계 ${sum}가 입력값 ${total}와 다릅니다.`);
    }
  }
  if(grammar==='waterfall'&&Math.abs(values[0]+values[1]+values[2]-values[3])>.001)throw new Error('워터폴의 최종 값은 시작값과 증감 합계와 일치해야 합니다.');
  const canvas=new Canvas(template,{...options,motion});const draw=familyRenderers[template.group];if(!draw)throw new Error(`렌더러 없음: ${template.group}`);draw(canvas);
  const svg=canvas.finish();return {svg,warnings:canvas.warnings,metadata:canvas.metadata(),template,fields:{labels:canvas.labels,values:canvas.values},motion};
}

export function renderTemplate(id,options={}){return renderResult(id,options).svg}

export function renderStandaloneHtml(id,options={}){
  const result=renderResult(id,options);const title=esc(result.template.name);const modes=['none','trace','reveal','pulse','grow','focus','assemble'].filter(mode=>supportsMotion(result.template,mode));const buttons=modes.map(mode=>`<button type="button" data-mode="${mode}" aria-pressed="${String(mode===result.motion)}">${{none:'정지 화면',trace:'흐름',reveal:'단계 공개',pulse:'강조',grow:'값 변화',focus:'초점',assemble:'3D 조립'}[mode]}</button>`).join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,sans-serif;color:#213141;background:#f4f2ed;margin:0;padding:24px}main{max-width:900px;margin:auto}h1{font-size:27px}.canvas{background:#fffefa;border:1px solid #d6dfdc;overflow-x:auto}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.controls button{min-height:44px;padding:8px 12px;background:white;border:1px solid #a8b8bd;border-radius:5px;color:#213141;cursor:pointer}.controls button[aria-pressed="true"]{background:#126b68;color:white}.controls button:focus-visible{outline:3px solid #a2542c;outline-offset:2px}p{line-height:1.5;color:#536477}@media(prefers-reduced-motion:reduce){.controls [data-mode]:not([data-mode="none"]){display:none}}</style></head><body><main><h1>${title}</h1><p>${esc(result.template.meaning)}</p><div class="canvas" tabindex="0" role="region" aria-label="${title} 가로 스크롤 영역">${result.svg}</div><div class="controls" aria-label="모션 선택">${buttons}<button type="button" id="pause">일시정지</button></div><script>const svg=document.querySelector('svg');document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{svg.dataset.motion=button.dataset.mode;svg.dataset.paused='false';document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('#pause').textContent='일시정지'}));document.querySelector('#pause').addEventListener('click',event=>{const paused=svg.dataset.paused!=='true';svg.dataset.paused=String(paused);event.currentTarget.textContent=paused?'재생':'일시정지'});</script></main></body></html>`;
}

export {templates,byId};
