// Browser-side geometry candidate finder. It does not replace visual review.
const center=b=>({x:b.x+b.width/2,y:b.y+b.height/2});
const contains=(b,p)=>p.x>=b.x&&p.x<=b.x+b.width&&p.y>=b.y&&p.y<=b.y+b.height;
function segmentDistance(line,p){const x1=+line.getAttribute('x1'),y1=+line.getAttribute('y1'),x2=+line.getAttribute('x2'),y2=+line.getAttribute('y2'),dx=x2-x1,dy=y2-y1,t=Math.max(0,Math.min(1,((p.x-x1)*dx+(p.y-y1)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-x1-dx*t,p.y-y1-dy*t)}
function borderDistance(b,p){
  const x=Math.max(b.x,Math.min(p.x,b.x+b.width)),y=Math.max(b.y,Math.min(p.y,b.y+b.height));
  if(contains(b,p))return Math.min(p.x-b.x,b.x+b.width-p.x,p.y-b.y,b.y+b.height-p.y);
  return Math.hypot(p.x-x,p.y-y);
}
function shapeDistance(shape,p){
  if(shape.node.tagName.toLowerCase()==='circle'){
    const node=shape.node,cx=+node.getAttribute('cx'),cy=+node.getAttribute('cy'),r=+node.getAttribute('r');
    return Math.abs(Math.hypot(p.x-cx,p.y-cy)-r);
  }
  return borderDistance(shape.box,p);
}
export function auditSvgGeometry(svg,{connectorTolerance=2,centerTolerance=4}={}){
  const id=svg.closest('[data-id]')?.dataset.id??svg.querySelector('title')?.textContent??'svg';
  const [,,canvasWidth,canvasHeight]=svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const shapes=[...svg.querySelectorAll('rect,circle:not(.viz-tracer),ellipse,polygon')].map(node=>({node,box:node.getBBox()})).filter(({box})=>box.width>8&&box.height>8&&box.width*box.height<canvasWidth*canvasHeight*.27);
  const centerShapes=shapes.filter(({node})=>node.matches('rect'));
  const guides=[...svg.querySelectorAll('line.viz-guide')];
  const arrowGaps=[];
  for(const line of svg.querySelectorAll('line.viz-edge,path[marker-end]')){
    if(line.dataset.role==='axis')continue;
    const point=line.tagName.toLowerCase()==='path'?line.getPointAtLength(line.getTotalLength()):{x:Number(line.getAttribute('x2')),y:Number(line.getAttribute('y2'))};
    const {x,y}=point;
    const candidates=[...shapes.map(s=>({distance:shapeDistance(s,{x,y}),node:s.node})),...guides.map(node=>({distance:segmentDistance(node,{x,y}),node}))].sort((a,b)=>a.distance-b.distance);
    if(candidates[0]?.distance>connectorTolerance)arrowGaps.push({x,y,distance:+candidates[0].distance.toFixed(1)});
  }
  const opticalCenters=[];
  for(const node of svg.querySelectorAll('text[text-anchor="middle"]')){
    const b=node.getBBox(),p=center(b);
    const matches=centerShapes.filter(s=>contains(s.box,p)&&s.box.width>=b.width*.8&&s.box.height>=b.height*.8).sort((a,b)=>a.box.width*a.box.height-b.box.width*b.box.height);
    if(matches.length!==1)continue;
    const containing=matches[0];
    const target=center(containing.box),dx=p.x-target.x,dy=p.y-target.y;
    if(Math.abs(dx)>centerTolerance||node.dataset.role==='box-label'&&Math.abs(dy)>centerTolerance)
      opticalCenters.push({text:node.textContent,dx:+dx.toFixed(1),dy:+dy.toFixed(1)});
  }
  const clippedText=[];const svgBox=svg.getBoundingClientRect();
  for(const node of svg.querySelectorAll('text')){const b=node.getBoundingClientRect();if(b.left<svgBox.left-1||b.right>svgBox.right+1||b.top<svgBox.top-1||b.bottom>svgBox.bottom+1)clippedText.push(node.textContent)}
  const markers=[...svg.querySelectorAll('marker')];
  const arrowHeadWarnings=markers.filter(marker=>marker.getAttribute('markerUnits')!=='userSpaceOnUse').map(marker=>({id:marker.id,reason:'화살촉이 선 굵기에 비례해 커짐'}));
  const shaftWarnings=[];
  for(const edge of svg.querySelectorAll('line.viz-edge')){
    const length=Math.hypot(+edge.getAttribute('x2')-edge.getAttribute('x1'),+edge.getAttribute('y2')-edge.getAttribute('y1'));
    const marker=svg.querySelector(`#${CSS.escape(edge.getAttribute('marker-end')?.match(/#([^)]+)/)?.[1]??'')}`);
    const size=+(marker?.getAttribute('markerWidth')??svg.dataset.arrowSize??8)*(marker?.getAttribute('markerUnits')==='userSpaceOnUse'?1:+edge.getAttribute('stroke-width')||1);
    if(length<size*2)shaftWarnings.push({length:+length.toFixed(1),arrowSize:+size.toFixed(1),reason:'화살 몸통이 화살촉 크기×2보다 짧음'});
  }
  const explicit=shapes.some(({node})=>node.dataset.node==='true');
  const infer=svg.querySelectorAll('line.viz-edge:not([data-role="axis"])').length>=2;
  const nodes=shapes.filter(({node,box})=>(node.dataset.node==='true'||!explicit&&infer&&node.matches('rect,polygon')&&box.width>=60&&box.height>=30)&&!node.closest('defs'));
  const nodeGapWarnings=[];
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
    const a=nodes[i].box,b=nodes[j].box;
    const overlapY=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
    const overlapX=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x);
    const gapX=Math.max(b.x-a.x-a.width,a.x-b.x-b.width),gapY=Math.max(b.y-a.y-a.height,a.y-b.y-b.height);
    const gap=overlapY>Math.min(a.height,b.height)*.35&&gapX>=0?gapX:overlapX>Math.min(a.width,b.width)*.35&&gapY>=0?gapY:null;
    if(gap!==null&&gap<16)nodeGapWarnings.push({a:i,b:j,gap:+gap.toFixed(1),minimum:16});
    else if(gap!==null&&gap<32&&[...svg.querySelectorAll('line.viz-edge')].some(line=>{
      const start={x:+line.getAttribute('x1'),y:+line.getAttribute('y1')},end={x:+line.getAttribute('x2'),y:+line.getAttribute('y2')};
      return (borderDistance(a,start)<3&&borderDistance(b,end)<3)||(borderDistance(b,start)<3&&borderDistance(a,end)<3);
    }))nodeGapWarnings.push({a:i,b:j,gap:+gap.toFixed(1),minimum:32});
  }
  const paddingWarnings=[];
  for(const {node,box:b} of nodes){
    const declared=Number(node.dataset.boxPadding);
    if(node.dataset.boxPadding!==undefined&&declared<12)paddingWarnings.push({box:node.dataset.node,padding:declared,minimum:12});
    if(node.dataset.boxPadding!==undefined)continue;
    for(const text of svg.querySelectorAll('text[data-role="box-label"],text[data-role="box-title"]')){
      const t=text.getBBox(),cx=t.x+t.width/2,cy=t.y+t.height/2;
      if(!contains(b,{x:cx,y:cy})||t.width>b.width||t.height>b.height)continue;
      const inset=Math.min(t.x-b.x,b.x+b.width-t.x-t.width,t.y-b.y,b.y+b.height-t.y-t.height);
      if(inset<12)paddingWarnings.push({text:text.textContent,padding:+inset.toFixed(1),minimum:12});
    }
  }
  const lineShapeWarnings=[];
  for(const path of svg.querySelectorAll('path.viz-return')){
    const length=path.getTotalLength();let nearest=Infinity;
    for(let offset=16;offset<length-16;offset+=Math.max(5,length/60)){
      const p=path.getPointAtLength(offset);
      for(const shape of nodes)nearest=Math.min(nearest,shapeDistance(shape,p));
    }
    if(nearest<16)lineShapeWarnings.push({path:path.dataset.role,nearest:+nearest.toFixed(1),minimum:16});
  }
  return {id,arrowGaps,opticalCenters,clippedText,arrowHeadWarnings,shaftWarnings,nodeGapWarnings,paddingWarnings,lineShapeWarnings};
}
