import {auditSvgGeometry} from './geometry-audit.mjs';

const box=node=>node.getBoundingClientRect();
const overlap=(a,b)=>({w:Math.min(a.left+a.width,b.left+b.width)-Math.max(a.left,b.left),h:Math.min(a.top+a.height,b.top+b.height)-Math.max(a.top,b.top)});
function screenRegion(node,x,y,w,h){
  const m=node.parentNode.getScreenCTM(),points=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([px,py])=>new DOMPoint(px,py).matrixTransform(m));
  const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y));
  return {left,top,width:Math.max(...points.map(p=>p.x))-left,height:Math.max(...points.map(p=>p.y))-top};
}

export function auditSvgLayout(svg,{tolerance=2}={}){
  const regionOverflow=[],textOverlap=[],edgeCaptionGap=[],pathOverflow=[],shapeLineOverflow=[];
  const displayScaleWarnings=[],textSizeWarnings=[],narrowTextWarnings=[];
  const sourceWidth=Number(svg.dataset.sourceWidth??svg.viewBox.baseVal.width),shownWidth=svg.getBoundingClientRect().width,scale=shownWidth/sourceWidth;
  if(scale>1.25+.01)displayScaleWarnings.push({scale:+scale.toFixed(2),limit:1.25,shownWidth,sourceWidth});
  if(svg.dataset.displayWidth&&shownWidth>Number(svg.dataset.displayWidth)+tolerance)displayScaleWarnings.push({shownWidth,intended:Number(svg.dataset.displayWidth)});
  const texts=[...svg.querySelectorAll('text')].map(node=>({node,b:box(node)}));
  for(const {node,b} of texts){
    const px=parseFloat(getComputedStyle(node).fontSize)*scale,role=node.dataset.role??'free-label';
    const aux=role.includes('subtitle')||role.includes('edge')||role.includes('caption')||role.includes('note');
    const min=aux?11:13,max=aux?13:16;
    if(px<min-.2||px>max+.2)textSizeWarnings.push({text:node.textContent,role,px:+px.toFixed(1),expected:`${min}–${max}`});
    if(px<11-.2)narrowTextWarnings.push({text:node.textContent,role,px:+px.toFixed(1),shownWidth});
    if(!node.dataset.region)continue;
    const [x,y,w,h]=node.dataset.region.split(',').map(Number),r=screenRegion(node,x,y,w,h);
    if(b.left<r.left-tolerance||b.top<r.top-tolerance||b.right>r.left+r.width+tolerance||b.bottom>r.top+r.height+tolerance)
      regionOverflow.push({text:node.textContent,role:node.dataset.role,region:r,actual:{left:b.left,top:b.top,w:b.width,h:b.height}});
  }
  for(const node of svg.querySelectorAll('text[data-path-length]')){
    const length=Number(node.dataset.pathLength),padding=Number(node.dataset.endPadding)||0,actual=node.getComputedTextLength();
    const pathId=node.querySelector('textPath')?.getAttribute('href')?.slice(1),path=pathId?svg.querySelector(`[id="${pathId}"]`):null;
    const measured=path?.getTotalLength();
    if(actual>length-2*padding+tolerance||measured&&Math.abs(measured-length)>Math.max(4,length*.05))pathOverflow.push({text:node.textContent,actual,declared:length,measured});
  }
  for(const node of svg.querySelectorAll('text[data-shape] tspan[data-line-width]')){
    const available=Number(node.dataset.lineWidth),actual=node.getComputedTextLength();
    if(actual>available+tolerance)shapeLineOverflow.push({text:node.textContent,available,actual,shape:node.parentNode.dataset.shape});
  }
  for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
    const o=overlap(texts[i].b,texts[j].b);
    if(o.w>3&&o.h>3)textOverlap.push({first:texts[i].node.textContent,second:texts[j].node.textContent,width:o.w,height:o.h});
  }
  for(const {node,b} of texts.filter(v=>v.node.dataset.role==='edge-label')){
    for(const edge of svg.querySelectorAll('line.viz-edge')){
      const m=edge.getScreenCTM(),p1=new DOMPoint(+edge.getAttribute('x1'),+edge.getAttribute('y1')).matrixTransform(m),p2=new DOMPoint(+edge.getAttribute('x2'),+edge.getAttribute('y2')).matrixTransform(m);
      if(Math.abs(p1.y-p2.y)>1||Math.min(p1.x,p2.x)>b.right||Math.max(p1.x,p2.x)<b.left)continue;
      const gap=Math.max(b.top-p1.y,p1.y-b.bottom,0);
      if(gap<tolerance)edgeCaptionGap.push({text:node.textContent,gap});
    }
  }
  const geometry=auditSvgGeometry(svg,{connectorTolerance:tolerance,centerTolerance:4});
  const narrowViewport=window.innerWidth<=360&&narrowTextWarnings.length>0;
  const scrollRegion=svg.closest('[role="region"]');
  const narrowAlternative=scrollRegion?.scrollWidth>scrollRegion?.clientWidth||svg.dataset.narrowAlternative==='steps';
  return {id:geometry.id,regionOverflow,pathOverflow,shapeLineOverflow,textOverlap,edgeCaptionGap,arrowGaps:geometry.arrowGaps,centerWarnings:geometry.opticalCenters,clippedText:geometry.clippedText,displayScaleWarnings,textSizeWarnings,narrowTextWarnings,narrowViewportFailure:narrowViewport&&!narrowAlternative,arrowHeadWarnings:geometry.arrowHeadWarnings,shaftWarnings:geometry.shaftWarnings,nodeGapWarnings:geometry.nodeGapWarnings,paddingWarnings:geometry.paddingWarnings,lineShapeWarnings:geometry.lineShapeWarnings,fitDecisions:[...svg.querySelectorAll('text[data-fit-decision]')].reduce((out,node)=>(out[node.dataset.fitDecision]=(out[node.dataset.fitDecision]??0)+1,out),{})};
}

export async function probeMotion(svg,{delay=280}={}){
  const motion=svg.dataset.motion,paused=svg.dataset.paused==='true',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,forced=svg.dataset.forceMotion==='true';
  if(motion==='none'||paused||reduced&&!forced)return {motion,paused,reduced,forced,expectedStopped:true,moving:false};
  const selectors={trace:'.viz-tracer',reveal:'.viz-text',pulse:'.viz-shape',grow:'.viz-data:not(text)',focus:'.viz-shape',assemble:'.viz-part'};
  const target=svg.querySelector(selectors[motion]??'.viz-shape');
  if(!target)return {motion,moving:false,reason:'animation-target-missing'};
  const sample=()=>{const s=getComputedStyle(target);return [s.transform,s.opacity,s.strokeDashoffset,s.filter,s.animationName].join('|')};
  const style=getComputedStyle(target);
  const parseTimes=value=>value.split(',').map(v=>v.trim().endsWith('ms')?parseFloat(v):parseFloat(v)*1000).filter(Number.isFinite);
  const waitMs=Math.max(delay,Math.max(0,...parseTimes(style.animationDelay))+Math.max(0,...parseTimes(style.animationDuration))+40);
  await new Promise(resolve=>setTimeout(resolve,waitMs));const before=sample();
  await new Promise(resolve=>setTimeout(resolve,Math.max(120,Math.min(400,Math.max(0,...parseTimes(style.animationDuration))/4))));
  const after=sample();
  return {motion,paused,reduced,forced,moving:before!==after,animation:getComputedStyle(target).animationName,waitMs};
}
