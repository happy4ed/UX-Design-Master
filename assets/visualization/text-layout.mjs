// Text fitting for SVG. Every label has an explicit region; overflow is
// reported so callers can use a short key and show the full copy outside.
const glyphWidth=(ch,size)=>{
  if(/[\u1100-\u11ff\u2e80-\ua7ff\uac00-\ud7af]/u.test(ch))return size;
  if(/[ilI.,:;!|']/u.test(ch))return size*.31;
  if(/[MW@#%]/u.test(ch))return size*.82;
  if(/\s/u.test(ch))return size*.32;
  if(/[A-Z0-9]/u.test(ch))return size*.63;
  return size*.55;
};
export const estimatedWidth=(line,size)=>Array.from(line).reduce((sum,ch)=>sum+glyphWidth(ch,size),0);

function wrapParagraph(source,width,size){
  const words=source.trim().split(/\s+/u).filter(Boolean),lines=[];let line='';
  for(const word of words){
    if(estimatedWidth(word,size)>width)return null;
    const next=line?`${line} ${word}`:word;
    if(line&&estimatedWidth(next,size)>width){lines.push(line);line=word}else line=next;
  }
  if(line)lines.push(line);
  return lines;
}

// Text fit is monotone for a fixed region and font: once a size fits, smaller
// sizes also fit. Search the half-pixel candidate range by its midpoint so
// long labels do not rerun wrapping at every size. Keep the exact minimum as
// a candidate even when the range is not a multiple of 0.5px.
function largestFittingSize(size,minSize,evaluate){
  if(!Number.isFinite(size)||!Number.isFinite(minSize)||size<minSize)return null;
  const count=Math.floor((size-minSize)/.5);
  const sizes=Array.from({length:count+1},(_,i)=>size-i*.5);
  if(sizes.at(-1)>minSize+1e-7)sizes.push(minSize);
  const cache=new Map();
  const at=index=>{if(!cache.has(index))cache.set(index,evaluate(sizes[index]));return cache.get(index)};
  if(at(0))return at(0);
  if(!at(sizes.length-1))return null;
  let lo=0,hi=sizes.length-1;
  while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(at(mid))hi=mid;else lo=mid}
  return at(hi);
}

export function layoutText(value,{x,y,w,h,size=13,minSize=10,maxLines=3,align='middle',valign='middle',padding=0,lineRatio=1.27,paragraphGap=.55}={}){
  const text=String(value??'').trim(),innerW=w-padding*2,innerH=h-padding*2;
  if(!text||innerW<=0||innerH<=0)return {fits:false,lines:[]};
  const result=largestFittingSize(size,minSize,fontSize=>{
    const lines=[];let failed=false;
    // One newline is a hard line break; a blank line adds paragraph spacing.
    const paragraphs=text.split(/\n\s*\n/u);
    paragraphs.forEach((paragraph,pi)=>{
      for(const hardLine of paragraph.split('\n')){
        const wrapped=wrapParagraph(hardLine,innerW,fontSize);
        if(!wrapped){failed=true;break}
        wrapped.forEach((content,i)=>lines.push({text:content,paragraphStart:pi>0&&i===0}));
      }
    });
    if(failed||lines.length>maxLines)return null;
    const lineStep=fontSize*lineRatio,paraStep=fontSize*paragraphGap;
    const blockH=fontSize+Math.max(0,lines.length-1)*lineStep+lines.filter(v=>v.paragraphStart).length*paraStep;
    if(blockH>innerH)return null;
    const firstTop=valign==='top'?y+padding:valign==='bottom'?y+h-padding-blockH:y+(h-blockH)/2;
    let top=firstTop;const positioned=lines.map((line,i)=>{if(i){top+=lineStep;if(line.paragraphStart)top+=paraStep}return {...line,y:top+fontSize*.84}});
    const tx=align==='start'?x+padding:align==='end'?x+w-padding:x+w/2;
    return {fits:true,fontSize,lines:positioned,x:tx,anchor:align==='middle'?'middle':align==='end'?'end':'start',region:{x,y,w,h},blockH};
  });
  return result??{fits:false,lines:[],region:{x,y,w,h}};
}

// Decide in this order: original type size, permitted region growth, bounded
// type reduction. The caller owns the shape and must supply collision-free
// `available` geometry; growth is never inferred across a neighboring item.
export function planTextRegion(value,region,{available=region,size=13,minSize=10,maxLines=3,align='middle',valign='middle',padding=0,lineRatio=1.27,paragraphGap=.55}={}){
  const opts={size,minSize:size,maxLines,align,valign,padding,lineRatio,paragraphGap};
  let layout=layoutText(value,{...region,...opts});
  if(layout.fits)return {decision:'fit',layout};
  if(available!==region){
    layout=layoutText(value,{...available,...opts});
    if(layout.fits)return {decision:'grow-region',layout};
  }
  layout=layoutText(value,{...available,...opts,minSize});
  if(layout.fits)return {decision:available!==region?'grow-and-shrink':'shrink-font',layout};
  return {decision:'external-reference',layout};
}

// Find the widest continuous strip shared by every sampled height in a glyph
// band. Polygon and SVG path inputs may move the text away from the box center.
const intersectIntervals=(a,b)=>{
  const out=[];
  for(const [al,ar] of a)for(const [bl,br] of b){const left=Math.max(al,bl),right=Math.min(ar,br);if(right>left)out.push([left,right])}
  return out;
};
function polygonIntervals(points,y){
  const xs=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    if((a.y<=y&&y<b.y)||(b.y<=y&&y<a.y))xs.push(a.x+(y-a.y)*(b.x-a.x)/(b.y-a.y));
  }
  xs.sort((a,b)=>a-b);const out=[];
  for(let i=0;i+1<xs.length;i+=2)out.push([xs[i],xs[i+1]]);
  return out;
}
function sampledIntervals(contains,region,y){
  const out=[],step=Math.max(1,region.w/160);let left=null;
  for(let x=region.x;x<=region.x+region.w+step/2;x+=step){
    const inside=x<=region.x+region.w&&contains(x,y);
    if(inside&&left===null)left=x;
    if(!inside&&left!==null){out.push([left,Math.min(x,region.x+region.w)]);left=null}
  }
  if(left!==null)out.push([left,region.x+region.w]);
  return out;
}
export function shapeLineSpan(shape,region,top,bottom,padding=5,cache){
  const {x,y,w,h}=region,kind=typeof shape==='string'?shape:shape?.kind;
  if(![x,y,w,h,top,bottom,padding].every(Number.isFinite)||w<=0||h<=0||bottom<=top)return null;
  let intervals=[];
  if(kind==='circle'||kind==='ellipse'||kind==='diamond'||kind==='rect'){
    const cy=y+h/2,rx=w/2,ry=h/2,distance=Math.max(Math.abs(top-cy),Math.abs(bottom-cy));
    if(kind!=='rect'&&distance>=ry)return null;
    const half=kind==='diamond'?rx*(1-distance/ry):kind==='rect'?rx:rx*Math.sqrt(1-(distance/ry)**2);
    intervals=[[x+rx-half,x+rx+half]];
  }else{
    const ys=Array.from({length:5},(_,i)=>top+.05+(bottom-top-.1)*i/4);
    const points=shape?.points;
    const contains=shape?.contains??(shape?.path?.isPointInFill?((px,py)=>shape.path.isPointInFill(new DOMPoint(px,py))):null);
    if(kind!=='polygon'&&kind!=='path'&&kind!=='custom')return null;
    if(kind==='polygon'&&(!Array.isArray(points)||points.length<3))return null;
    if(kind!=='polygon'&&typeof contains!=='function')return null;
    for(const py of ys){
      const key=Math.round(py);
      const current=kind==='polygon'?polygonIntervals(points,py):cache?.get(key)??sampledIntervals(contains,region,key);
      if(kind!=='polygon'&&cache&&!cache.has(key))cache.set(key,current);
      intervals=intervals.length?intersectIntervals(intervals,current):current;
      if(!intervals.length)return null;
    }
  }
  const safe=intervals.map(([left,right])=>({left:left+padding,right:right-padding})).filter(v=>v.right>v.left);
  if(!safe.length)return null;
  return safe.reduce((best,v)=>v.right-v.left>best.right-best.left?v:best);
}
export function shapeLineWidth(shape,region,top,bottom,padding=5){
  const span=shapeLineSpan(shape,region,top,bottom,padding);
  return span?span.right-span.left:0;
}

function wrapAtBands(text,spanAt,size,lineStep,paraStep,maxLines,measureText){
  const lines=[];let offset=0;
  const paragraphs=text.split(/\n\s*\n/u);
  for(let pi=0;pi<paragraphs.length;pi++){
    if(pi)offset+=paraStep;
    for(const hardLine of paragraphs[pi].split('\n')){
      const words=hardLine.trim().split(/\s+/u).filter(Boolean);
      if(!words.length){offset+=lineStep;continue}
      let current='';
      for(const word of words){
        const next=current?`${current} ${word}`:word;
        let span=spanAt(offset),width=span?span.right-span.left:0;
        if(measureText(next,size)>width&&current){
          lines.push({text:current,offset,...span,width,paragraphStart:pi>0&&lines.length===0});
          if(lines.length>=maxLines)return null;
          offset+=lineStep;current=word;span=spanAt(offset);width=span?span.right-span.left:0;
        }else current=next;
        if(measureText(current,size)>width)return null;
      }
      if(current){const span=spanAt(offset);if(!span)return null;lines.push({text:current,offset,...span,width:span.right-span.left,paragraphStart:pi>0});if(lines.length>maxLines)return null;offset+=lineStep}
    }
  }
  return lines;
}

export function layoutShapeText(value,{shape='circle',x,y,w,h,size=13,minSize=10,maxLines=7,padding=6,lineRatio=1.27,paragraphGap=.55,measureText=estimatedWidth}={}){
  const text=String(value??'').trim(),region={x,y,w,h};
  if(!text||w<=0||h<=0)return {fits:false,lines:[],region};
  const bandCache=new Map();
  const result=largestFittingSize(size,minSize,fontSize=>{
    const step=fontSize*lineRatio,paraStep=fontSize*paragraphGap;
    let best=null;
    for(let start=y+padding;start<=y+h-padding-fontSize;start+=1){
      const spanAt=offset=>shapeLineSpan(shape,region,start+offset,start+offset+fontSize,padding,bandCache);
      const lines=wrapAtBands(text,spanAt,fontSize,step,paraStep,maxLines,measureText);
      if(!lines?.length)continue;
      const blockH=lines.at(-1).offset+fontSize;
      if(start+blockH>y+h-padding)continue;
      const centerError=Math.abs(start+blockH/2-(y+h/2));
      // Prefer a centered block; among equally centered layouts use fewer lines.
      const score=centerError*4+lines.length*1.5;
      if(!best||score<best.score)best={lines,start,blockH,score};
    }
    if(!best)return null;
    return {fits:true,fontSize,region,shape,blockH:best.blockH,x:x+w/2,anchor:'middle',lines:best.lines.map(line=>({...line,x:(line.left+line.right)/2,y:best.start+line.offset+fontSize*.84}))};
  });
  return result??{fits:false,lines:[],region,shape};
}
