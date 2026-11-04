import {Canvas} from './svg-core.mjs';
import {layoutText,estimatedWidth} from './text-layout.mjs';

/** Layout a declared linear or branched process. Edges must be supplied; no relationship is invented. */
export function renderDeclarativeFlow(spec){
  const nodes=spec?.nodes,edges=spec?.edges;
  if(!Array.isArray(nodes)||!nodes.length||!Array.isArray(edges))throw new Error('nodes와 edges 배열이 필요합니다.');
  const ids=new Set(nodes.map(node=>node.id));
  if(ids.size!==nodes.length||nodes.some(node=>!node.id||!node.label))throw new Error('노드 id와 label이 필요하며 id는 중복될 수 없습니다.');
  if(edges.some(edge=>!ids.has(edge.from)||!ids.has(edge.to)||!['next','return'].includes(edge.kind??'next')))throw new Error('모든 연결의 양끝과 kind(next/return)를 확인하세요.');
  const columns=Math.min(4,Math.max(1,Number(spec.columns??3)));
  const fontSize=Number(spec.fontSize??14),nodeHeight=Number(spec.nodeHeight??80),gap=Number(spec.gap??32),rowGap=Number(spec.rowGap??44),margin=Number(spec.margin??44);
  if([fontSize,nodeHeight,gap,rowGap,margin].some(v=>!Number.isFinite(v)||v<=0))throw new Error('레이아웃 수치는 양수여야 합니다.');
  let nodeWidth=156;
  for(const node of nodes){
    while(nodeWidth<196&&!layoutText(node.label,{x:0,y:0,w:nodeWidth-24,h:nodeHeight-24,size:fontSize,minSize:fontSize,maxLines:2}).fits)nodeWidth+=4;
  }
  const width=margin*2+columns*nodeWidth+(columns-1)*gap;
  const rowCount=Math.ceil(nodes.length/columns),height=margin+rowCount*nodeHeight+(rowCount-1)*rowGap+58;
  const template={id:spec.id??'declared-flow',name:spec.title??'흐름도',meaning:spec.description??'입력된 노드와 연결의 흐름',labels:nodes.map(node=>node.label),values:[]};
  const c=new Canvas(template,{...spec,width,height,displayWidth:spec.displayWidth??Math.min(640,Math.round(width*1.25)),minDisplayWidth:spec.minDisplayWidth??width});
  const positions=new Map();
  nodes.forEach((node,index)=>{
    const row=Math.floor(index/columns),slot=index%columns,col=row%2?columns-1-slot:slot;
    const x=margin+col*(nodeWidth+gap),y=margin+row*(nodeHeight+rowGap);
    positions.set(node.id,{x,y,w:nodeWidth,h:nodeHeight,cx:x+nodeWidth/2,cy:y+nodeHeight/2,row,col});
  });
  // Draw connections before nodes, then reserve text regions inside each node.
  let returnIndex=0;
  for(const edge of edges){
    const a=positions.get(edge.from),b=positions.get(edge.to),kind=edge.kind??'next';
    if(kind==='return'){
      const sameRow=a.row===b.row;
      if(sameRow){
        const rail=Math.max(10,a.y-20-returnIndex*14),fromX=a.cx,toX=b.cx;
        c.path(`M${fromX} ${a.y} V${rail} H${toX} V${b.y}`,'none','orange',1.7,`class="viz-edge viz-return" data-role="return" data-arrow-size="${c.arrowSize}" marker-end="url(#${c.id}-arrow-orange)"`);
        if(edge.label)c.textBox(Math.min(fromX,toX)+10,rail-18,Math.max(80,Math.abs(fromX-toX)-20),20,edge.label,{size:13,minSize:13,maxLines:1,padding:0,color:'orange',weight:400,role:'edge-label'});
      }else{
        const railX=margin/2-returnIndex*9,fromY=a.cy,toY=b.cy;
        c.path(`M${a.x} ${fromY} H${railX} V${toY} H${b.x}`,'none','orange',1.7,`class="viz-edge viz-return" data-role="return" data-arrow-size="${c.arrowSize}" marker-end="url(#${c.id}-arrow-orange)"`);
        if(edge.label)c.textBox(railX+8,Math.max(a.y,b.y)+nodeHeight+8,width-margin-railX-8,20,edge.label,{size:13,minSize:13,maxLines:1,padding:0,color:'orange',weight:400,role:'edge-label'});
      }
      returnIndex++;continue;
    }
    if(a.row===b.row){
      const sign=b.cx>a.cx?1:-1;
      c.arrow(a.cx+sign*a.w/2,a.cy,b.cx-sign*b.w/2,b.cy);
      if(edge.label)c.edgeLabel(a.cx+sign*a.w/2,a.cy,b.cx-sign*b.w/2,b.cy,edge.label,{size:13,minSize:13,height:22});
    }else if(Math.abs(a.row-b.row)===1&&a.col===b.col){
      const sign=b.cy>a.cy?1:-1;
      c.arrow(a.cx,a.cy+sign*a.h/2,b.cx,b.cy-sign*b.h/2);
      if(edge.label)c.textBox(a.cx+10,Math.min(a.cy,b.cy)+nodeHeight/2,36,20,edge.label,{size:13,minSize:13,maxLines:1,padding:0,weight:400,role:'edge-label'});
    }else{
      // Avoid silently drawing an arrow through unrelated nodes.
      c.warnings.push(`자동 연결 경로 미지원: ${edge.from} → ${edge.to}. 경유점 지정 또는 구조 변경 필요`);
    }
  }
  for(const node of nodes){
    const p=positions.get(node.id),selected=node.emphasis===true;
    if(node.shape==='diamond'){
      c.poly(`${p.cx},${p.y} ${p.x+p.w},${p.cy} ${p.cx},${p.y+p.h} ${p.x},${p.cy}`,selected?'tealLight':'white','teal',`data-node="true" data-box-padding="12"`);
      c.shapeText(p.x,p.y,p.w,p.h,node.label,{shape:'diamond',size:fontSize,minSize:13,maxLines:2,padding:10,weight:600,role:'diamond-label'});
    }else c.box(p.x,p.y,p.w,p.h,node.label,{fill:selected?'tealLight':'white',stroke:selected?'teal':'line',size:fontSize,weight:500,subtitle:node.subtitle??'',subtitleSize:13,subtitleMinSize:13,padding:12});
  }
  if(nodes.some(node=>estimatedWidth(node.label,fontSize)>nodeWidth-24))c.warnings.push('긴 노드 라벨은 두 줄로 배치됨. 실제 표시 폭에서 읽기 검수 필요');
  return {svg:c.finish(),warnings:c.warnings,metadata:c.metadata(),positions:Object.fromEntries(positions)};
}
