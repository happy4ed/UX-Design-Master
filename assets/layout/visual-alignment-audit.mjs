/** Measure box geometry and visible-content proxies separately. No optical PASS is inferred. */
const round = value => Math.round(value * 100) / 100;
const box = rect => ({x:round(rect.left), y:round(rect.top), width:round(rect.width), height:round(rect.height), right:round(rect.right), bottom:round(rect.bottom)});
const center = rect => ({x:round(rect.left + rect.width / 2), y:round(rect.top + rect.height / 2)});
const visible = element => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const svgPrimitive = element instanceof SVGGraphicsElement;
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 &&
    (svgPrimitive ? rect.width > 0 || rect.height > 0 : rect.width > 0 && rect.height > 0);
};
const union = rects => {
  if (!rects.length) return null;
  const left = Math.min(...rects.map(rect => rect.left));
  const top = Math.min(...rects.map(rect => rect.top));
  const right = Math.max(...rects.map(rect => rect.right));
  const bottom = Math.max(...rects.map(rect => rect.bottom));
  return box({left, top, right, bottom, width:right-left, height:bottom-top});
};
function svgDrawnBounds(element) {
  const svg = element.matches('svg') ? element : element.querySelector('svg');
  if (!svg) return null;
  const parts = [...svg.querySelectorAll('path,circle,ellipse,rect,line,polyline,polygon')]
    .filter(part => !part.closest('defs,clipPath,mask,pattern,symbol') && visible(part));
  const boxes = [];
  for (const part of parts) {
    if (!part.getBBox || !part.getScreenCTM) continue;
    const b = part.getBBox(), matrix = part.getScreenCTM();
    if (!matrix || !b.width && !b.height) continue;
    const points = [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]]
      .map(([x,y]) => new DOMPoint(x,y).matrixTransform(matrix));
    const left=Math.min(...points.map(point=>point.x)), right=Math.max(...points.map(point=>point.x));
    const top=Math.min(...points.map(point=>point.y)), bottom=Math.max(...points.map(point=>point.y));
    boxes.push({left,top,right,bottom,width:right-left,height:bottom-top});
  }
  return union(boxes);
}
function svgInkProxy(element, slot) {
  const svg = element.matches('svg') ? element : element.querySelector('svg');
  if (!svg) return {areaRatio:null,strokeWidths:[]};
  const parts=[...svg.querySelectorAll('rect,circle,ellipse,path,line,polyline,polygon')]
    .filter(part=>!part.closest('defs,clipPath,mask,pattern,symbol')&&visible(part));
  const strokeWidths=[...new Set(parts.map(part=>getComputedStyle(part).strokeWidth).filter(value=>value&&value!=='0px'))];
  if (!parts.length || parts.some(part=>!['rect','circle','ellipse'].includes(part.tagName.toLowerCase()))) return {areaRatio:null,strokeWidths};
  let area=0;
  for (const part of parts) {
    const b=part.getBBox(),m=part.getScreenCTM();
    if (!m) return {areaRatio:null,strokeWidths};
    const factor=part.tagName.toLowerCase()==='rect'?1:Math.PI/4;
    area+=b.width*b.height*factor*Math.abs(m.a*m.d-m.b*m.c);
  }
  return {areaRatio:slot.width&&slot.height?round(area/(slot.width*slot.height)):null,strokeWidths};
}
function textLines(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const lines=[];
  while (walker.nextNode()) {
    const node=walker.currentNode;
    if (!node.textContent.trim()) continue;
    const range=document.createRange(); range.selectNodeContents(node);
    lines.push(...[...range.getClientRects()].filter(rect=>rect.width&&rect.height).map(box));
    range.detach?.();
  }
  return lines.sort((a,b)=>a.y-b.y || a.x-b.x);
}
function radius(element, rect) {
  const style=getComputedStyle(element);
  const scale=Math.min(rect.width,rect.height);
  const corners=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'];
  return Object.fromEntries(corners.map(key=>{
    const raw=style[key];
    const px=raw?.trim().endsWith('px') ? parseFloat(raw) : null;
    return [key,{css:raw,px:Number.isFinite(px)?round(px):null,ratio:Number.isFinite(px)&&scale?round(px/scale):null}];
  }));
}
const spread = values => values.length < 2 ? null : round(Math.max(...values)-Math.min(...values));
export function measureVisualAlignment(root=document) {
  const elements=[...root.querySelectorAll('[data-align-group]')].filter(visible);
  const groups=new Map();
  for (const element of elements) {
    const groupId=element.dataset.alignGroup, kind=element.dataset.alignKind || 'shape';
    const rect=element.getBoundingClientRect(), style=getComputedStyle(element);
    const drawn=kind==='icon' ? svgDrawnBounds(element) : null;
    const ink=kind==='icon' ? svgInkProxy(element,rect) : {areaRatio:null,strokeWidths:[]};
    const lines=kind==='text' ? textLines(element) : [];
    const entry={id:element.id || element.dataset.measureId || `${groupId}-${(groups.get(groupId)?.length||0)+1}`,
      kind, box:box(rect), boxCenter:center(rect), drawnBounds:drawn,
      drawnCenter:drawn?{x:round(drawn.x+drawn.width/2),y:round(drawn.y+drawn.height/2)}:null,
      drawnWidthRatio:drawn?round(drawn.width/rect.width):null,
      primitiveInkAreaRatio:ink.areaRatio,strokeWidths:ink.strokeWidths,
      visualOffset:drawn?{x:round(drawn.x+drawn.width/2-(rect.left+rect.width/2)),y:round(drawn.y+drawn.height/2-(rect.top+rect.height/2))}:null,
      text:lines.length?{firstLineBox:lines[0],firstLineInset:round(lines[0].x-rect.left),fontSize:style.fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,textIndent:style.textIndent,letterSpacing:style.letterSpacing}:null,
      radius:radius(element,rect),
      measurementLimits:kind==='icon'&&!drawn?'SVG 형상이 없어 내부 가시 경계 미측정':kind==='icon'?'단순 SVG 도형 면적은 겹침·획·마스크를 제외한 근사치; 경로와 비트맵의 실제 잉크는 미측정':kind==='text'?'Range는 글자 전진 폭이며 실제 잉크 외곽이 아님':'도형 경계는 그림자·광학 무게를 포함하지 않음'};
    if (!groups.has(groupId)) groups.set(groupId,[]);
    groups.get(groupId).push(entry);
  }
  const markerRows=[...root.querySelectorAll('[data-measure-marker-row]')].filter(visible).map((row,index)=>{
    const marker=row.querySelector('[data-list-marker]'), label=row.querySelector('[data-list-label]');
    if (!marker||!label||!visible(marker)||!visible(label)) return {id:row.id||`marker-${index+1}`,status:'NOT_MEASURED',reason:'명시적인 기호와 문구 슬롯 필요'};
    const m=marker.getBoundingClientRect(),l=label.getBoundingClientRect();
    return {id:row.id||`marker-${index+1}`,status:'MEASURED',markerBox:box(m),labelBox:box(l),gapPx:round(l.left-m.right),labelInsetFromRowPx:round(l.left-row.getBoundingClientRect().left)};
  });
  return {schemaVersion:'1.1',groups:[...groups].map(([id,entries])=>({id,entries,comparison:{boxCenterXSpreadPx:spread(entries.map(e=>e.boxCenter.x)),boxCenterYSpreadPx:spread(entries.map(e=>e.boxCenter.y)),drawnWidthRatioSpread:spread(entries.map(e=>e.drawnWidthRatio).filter(v=>v!==null)),primitiveInkAreaRatioSpread:spread(entries.map(e=>e.primitiveInkAreaRatio).filter(v=>v!==null)),visualOffsetXSpreadPx:spread(entries.map(e=>e.visualOffset?.x).filter(v=>v!==undefined)),firstLineInsetSpreadPx:spread(entries.map(e=>e.text?.firstLineInset).filter(v=>v!==undefined)),fontSizes:[...new Set(entries.map(e=>e.text?.fontSize).filter(Boolean))],radiusRatios:[...new Set(entries.map(e=>e.radius.borderTopLeftRadius.ratio).filter(v=>v!==null))]}})),markerRows,
    note:'박스·SVG 경로·텍스트 Range의 측정 후보. SVG 스트로크·그림자·비트맵 투명 여백·실제 글리프 잉크·시각적 무게는 캡처와 사람의 판단이 필요하며, 수치 차이만으로 FAIL/PASS를 주지 않음'};
}
