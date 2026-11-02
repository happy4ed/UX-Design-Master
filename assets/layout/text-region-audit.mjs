// Browser QA for web, app previews, and browser-rendered documents.
// Mark designed text slots with data-text-region and optional constraints.
const rectJSON=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
const intersection=(a,b)=>({width:Math.min(a.right,b.right)-Math.max(a.left,b.left),height:Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)});
function glyphRects(element){
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),rects=[];
  while(walker.nextNode()){
    const node=walker.currentNode;if(!node.textContent.trim()||node.parentElement?.closest('[data-text-region]')!==element)continue;
    const range=document.createRange();range.selectNodeContents(node);
    rects.push(...[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(rectJSON));range.detach?.();
  }
  return rects;
}
export function auditTextRegions(root=document,{selector='[data-text-region]',tolerance=2}={}){
  const slots=[...root.querySelectorAll(selector)].filter(el=>getComputedStyle(el).display!=='none').map((element,index)=>{
    const rect=rectJSON(element.getBoundingClientRect()),glyphs=glyphRects(element),style=getComputedStyle(element),id=element.id||element.dataset.textRegion||`slot-${index+1}`;
    return {element,id,rect,glyphs,style};
  });
  const overflow=[],lineLimit=[],fontFloor=[],paragraphGap=[],collisions=[];
  for(const slot of slots){
    const {element,id,rect,glyphs,style}=slot;
    for(const g of glyphs)if(g.left<rect.left-tolerance||g.right>rect.right+tolerance||g.top<rect.top-tolerance||g.bottom>rect.bottom+tolerance){overflow.push({id,glyph:g,region:rect});break}
    if(element.scrollWidth>element.clientWidth+tolerance||element.scrollHeight>element.clientHeight+tolerance)overflow.push({id,scroll:[element.scrollWidth,element.scrollHeight],client:[element.clientWidth,element.clientHeight]});
    const maxLines=Number(element.dataset.textMaxLines),tops=[...new Set(glyphs.map(g=>Math.round(g.top/2)*2))];
    if(maxLines>0&&tops.length>maxLines)lineLimit.push({id,actual:tops.length,max:maxLines});
    const minFont=Number(element.dataset.textMinFont),fontSize=parseFloat(style.fontSize);
    if(minFont>0&&fontSize+.1<minFont)fontFloor.push({id,actual:fontSize,min:minFont});
    const minParagraphGap=Number(element.dataset.paragraphGapMin),paragraphs=[...element.querySelectorAll('[data-paragraph],p')];
    if(minParagraphGap>0&&paragraphs.length>1)for(let i=1;i<paragraphs.length;i++){
      const previous=paragraphs[i-1].getBoundingClientRect(),current=paragraphs[i].getBoundingClientRect(),gap=current.top-previous.bottom;
      if(gap+tolerance<minParagraphGap)paragraphGap.push({id,index:i,gap,min:minParagraphGap});
    }
  }
  for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
    const a=slots[i],b=slots[j];if(intersection(a.rect,b.rect).width<0||intersection(a.rect,b.rect).height<0)continue;
    for(const ga of a.glyphs)for(const gb of b.glyphs){const hit=intersection(ga,gb);if(hit.width>3&&hit.height>3){collisions.push({first:a.id,second:b.id,width:hit.width,height:hit.height});break}}
  }
  return {slots:slots.length,overflow,lineLimit,fontFloor,paragraphGap,collisions};
}

// Measure the size the user actually sees. In SVG, computed font-size is in
// viewBox units, so multiply by the element's screen transform. This catches
// a 20-unit chart label that renders at 8px after the SVG is scaled down.
export function auditRenderedFontFloor(root=document,{minimumPx=13,exceptions=[]}={}){
  const ignore=new Set(exceptions),failures=[];
  let measured=0;
  for(const element of root.querySelectorAll('body *')){
    if(['SCRIPT','STYLE','NOSCRIPT','TITLE','DESC'].includes(element.tagName))continue;
    if(![...element.childNodes].some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim()))continue;
    if(element.closest('svg defs,svg symbol,[aria-hidden="true"]'))continue;
    const style=getComputedStyle(element);
    if(style.display==='none'||style.visibility!=='visible'||Number(style.opacity)===0)continue;
    const rect=element.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)continue;
    const nominal=parseFloat(style.fontSize);
    if(!Number.isFinite(nominal))continue;
    let scale=1;
    if(element instanceof SVGElement){
      const matrix=element.getScreenCTM();
      if(!matrix)continue;
      scale=Math.min(Math.hypot(matrix.a,matrix.b),Math.hypot(matrix.c,matrix.d));
    }else if(element.offsetHeight>0){
      scale=Math.min(1,rect.height/element.offsetHeight);
    }
    const actualPx=nominal*scale;
    const id=element.id||element.getAttribute('data-text-region')||element.tagName.toLowerCase();
    measured++;
    if(actualPx+.1<minimumPx&&!ignore.has(element)&&!element.closest('[data-font-floor-exception]')){
      failures.push({id,tag:element.tagName.toLowerCase(),text:element.textContent.trim().slice(0,80),nominalPx:nominal,actualPx:Math.round(actualPx*100)/100,minimumPx});
    }
  }
  return {measured,minimumPx,failures};
}
