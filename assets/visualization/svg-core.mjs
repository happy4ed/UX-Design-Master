import {layoutText,planTextRegion,layoutShapeText} from './text-layout.mjs';
import {planPathText} from './path-text.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const n=value=>Number.isFinite(Number(value))?Number(value):0;

function wrap(value,limit=12,maxLines=3){
  const source=String(value??'').trim();
  if(!source)return [''];
  const hasWhitespace=/\s/.test(source);
  const words=hasWhitespace?source.split(/\s+/):Array.from(source);
  const lines=[];let line='';
  for(const word of words){
    const candidate=line?`${line}${hasWhitespace?' ':''}${word}`:word;
    if(Array.from(candidate).length>limit&&line){lines.push(line);line=word}else line=candidate;
  }
  if(line)lines.push(line);
  const out=[];
  for(const item of lines){
    if(Array.from(item).length<=limit)out.push(item);
    else for(let at=0,chars=Array.from(item);at<chars.length;at+=limit)out.push(chars.slice(at,at+limit).join(''));
  }
  if(out.length>maxLines){const kept=out.slice(0,maxLines);kept[maxLines-1]=`${Array.from(kept[maxLines-1]).slice(0,Math.max(1,limit-1)).join('')}…`;return kept}
  return out;
}

export class Canvas{
  constructor(template,options={}){
    this.template=template;this.options=options;this.parts=[];this.defs=[];
    this.width=Number(options.width??520);this.height=Number(options.height??260);
    if(!Number.isFinite(this.width)||!Number.isFinite(this.height)||this.width<=0||this.height<=0)throw new Error('Canvas width/height는 양수여야 합니다.');
    this.displayWidth=Number(options.displayWidth??Math.round(this.width*1.25));
    if(!Number.isFinite(this.displayWidth)||this.displayWidth<=0)throw new Error('displayWidth는 양수여야 합니다.');
    this.arrowSize=Number(options.arrowSize??8);if(!Number.isFinite(this.arrowSize)||this.arrowSize<=0)throw new Error('arrowSize는 양수여야 합니다.');
    this.fonts=[];
    this.labels=Array.isArray(options.labels)?options.labels:template.labels;
    this.values=Array.isArray(options.values)?options.values:template.values;
    this.id=`viz-${template.id.replace(/[^a-z0-9-]/g,'')}`;this.partIndex=0;this.warnings=[];this.truncated=new Set();this.rtl=Boolean(options.rtl)&&!['exploded','axonometric'].includes(template.grammar);
    if(this.displayWidth/this.width>1.25+.001)this.warnings.push(`표시 배율 ${(this.displayWidth/this.width).toFixed(2)} > 권장 상한 1.25`);
    if(options.colors&&Object.values(options.colors).some(value=>typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value)))throw new Error('색 토큰은 #RRGGBB 형식이어야 합니다.');
    this.colors={ink:'#213141',muted:'#536477',line:'#75868c',faint:'#e4ebe8',teal:'#126b68',tealLight:'#dcece7',orange:'#a2542c',orangeLight:'#f7e8dc',blue:'#386d91',blueLight:'#e1ebf2',white:'#ffffff',paper:'#fffefa',...(options.colors??{})};
    const luminance=value=>{const h=String(value).replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return null;const rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};
    const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return x===null||y===null?null:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
    for(const [front,back,min] of [['ink','paper',4.5],['ink','white',4.5],['muted','paper',4.5],['line','paper',3],['teal','tealLight',4.5],['orange','orangeLight',4.5]]){
      const ratio=contrast(this.colors[front],this.colors[back]);
      if(ratio!==null&&ratio<min)this.warnings.push(`색 대비 ${front}/${back} ${ratio.toFixed(2)}:1 < ${min}:1`);
    }
  }
  label(index,fallback='항목'){return String(this.labels?.[index]??`${fallback} ${index+1}`)}
  value(index,fallback=0){return n(this.values?.[index]??fallback)}
  push(markup){this.parts.push(markup);return markup}
  rect(x,y,w,h,fill='white',stroke='line',r=5,extra=''){const c=this.colors;return this.push(`<rect class="viz-shape ${['teal','blue','orange'].includes(fill)||['teal','blue','orange'].includes(stroke)?'viz-data':''}" style="--i:${this.partIndex++}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c[fill]||fill}" stroke="${c[stroke]||stroke}" stroke-width="1.4" ${extra}/>`)}
  line(x1,y1,x2,y2,color='line',width=1.5,dash=''){const c=this.colors;return this.push(`<line class="viz-guide" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c[color]||color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`)}
  arrow(x1,y1,x2,y2,color='teal',width=1.8,dash='',role='connector'){
    const c=this.colors,index=this.partIndex++;
    const length=Math.hypot(x2-x1,y2-y1);if(length<this.arrowSize*2)this.warnings.push(`화살 몸통 ${length.toFixed(1)} < 화살촉 크기×2 (${this.arrowSize*2})`);
    return this.push(`<line class="viz-edge" data-role="${role}" data-arrow-size="${this.arrowSize}" data-shaft-length="${length.toFixed(2)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c[color]||color}" stroke-width="${width}" marker-end="url(#${this.id}-arrow-${color})" ${dash?`stroke-dasharray="${dash}"`:''}/><circle class="viz-tracer" cx="${x1}" cy="${y1}" r="5.2" fill="${c[color]||color}" stroke="${c.paper}" stroke-width="1.3" style="--dx:${x2-x1}px;--dy:${y2-y1}px;--i:${index}" aria-hidden="true"/>`);
  }
  connectBoxes(a,b,color='teal',width=1.8){
    const dx=b.x-a.x,dy=b.y-a.y;if(!dx&&!dy)throw new Error('연결할 두 상자의 중심이 같습니다.');
    const edge=(box,vx,vy)=>{const tx=vx?box.w/2/Math.abs(vx):Infinity,ty=vy?box.h/2/Math.abs(vy):Infinity,t=Math.min(tx,ty);return [box.x+vx*t,box.y+vy*t]};
    const [x1,y1]=edge(a,dx,dy),[x2,y2]=edge(b,-dx,-dy);
    return this.arrow(+x1.toFixed(2),+y1.toFixed(2),+x2.toFixed(2),+y2.toFixed(2),color,width);
  }
  path(d,fill='none',stroke='line',width=1.5,extra=''){const c=this.colors;const attrs=extra.includes('class="')?extra.replace('class="','class="viz-shape viz-path '):`class="viz-shape viz-path" ${extra}`;return this.push(`<path d="${d}" fill="${c[fill]||fill}" stroke="${c[stroke]||stroke}" stroke-width="${width}" ${attrs}/>`)}
  circle(cx,cy,r,fill='white',stroke='line',extra=''){const c=this.colors;return this.push(`<circle class="viz-shape ${['teal','blue','orange'].includes(fill)||['teal','blue','orange'].includes(stroke)?'viz-data':''}" style="--i:${this.partIndex++}" cx="${cx}" cy="${cy}" r="${r}" fill="${c[fill]||fill}" stroke="${c[stroke]||stroke}" stroke-width="1.4" ${extra}/>`)}
  ellipse(cx,cy,rx,ry,fill='white',stroke='line',extra=''){const c=this.colors;return this.push(`<ellipse class="viz-shape" style="--i:${this.partIndex++}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c[fill]||fill}" stroke="${c[stroke]||stroke}" stroke-width="1.4" ${extra}/>`)}
  poly(points,fill='white',stroke='line',extra=''){const c=this.colors;return this.push(`<polygon class="viz-shape" style="--i:${this.partIndex++}" points="${points}" fill="${c[fill]||fill}" stroke="${c[stroke]||stroke}" stroke-width="1.4" ${extra}/>`)}
  text(x,y,value,{size=13,color='ink',weight=400,anchor='start',max=22,lines=3,lineHeight=16,extra=''}={}){
    const c=this.colors;const words=wrap(value,max,lines);if(words.some(line=>line.endsWith('…'))){this.warnings.push(`도표 내부 약칭: ${String(value)}`);this.truncated.add(String(value))}
    this.fonts.push({size,weight,role:'free-label'});
    const tspans=words.map((line,i)=>`<tspan x="${x}" dy="${i?lineHeight:0}">${esc(line)}</tspan>`).join('');
    return this.push(`<text class="viz-text ${['teal','blue','orange'].includes(color)?'viz-data':''}" style="--i:${this.partIndex++}" x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${c[color]||color}" text-anchor="${anchor}" ${this.rtl?`transform="translate(${2*x} 0) scale(-1 1)"`:''} ${extra}>${tspans}</text>`);
  }
  textBox(x,y,w,h,value,{size=13,minSize=10,maxLines=3,padding=4,align='middle',valign='middle',color='ink',weight=500,lineRatio=1.27,paragraphGap=.55,role='bounded-label',available}={}){
    const region={x,y,w,h},plan=planTextRegion(value,region,{available:available??region,size,minSize,maxLines,padding,align,valign,lineRatio,paragraphGap});
    let {layout}=plan,decision=plan.decision;
    if(!layout.fits){
      const index=this.labels.indexOf(String(value));
      const key=index>=0?String(index+1):'※';
      this.truncated.add(String(value));this.warnings.push(`도표 내부 참조 ${key}: ${String(value)}`);
      layout=layoutText(key,{x,y,w,h,size,minSize:Math.min(size,minSize),maxLines:1,padding,align,valign});
    }
    this.fonts.push({size:layout.fontSize,weight,role});
    const c=this.colors,tspans=layout.lines.map(line=>`<tspan x="${layout.x}" y="${line.y.toFixed(2)}">${esc(line.text)}</tspan>`).join('');
    return this.push(`<text class="viz-text ${['teal','blue','orange'].includes(color)?'viz-data':''}" style="--i:${this.partIndex++}" data-role="${role}" data-fit-decision="${decision}" data-region="${[layout.region.x,layout.region.y,layout.region.w,layout.region.h].join(',')}" x="${layout.x}" font-size="${layout.fontSize}" font-weight="${weight}" fill="${c[color]||color}" text-anchor="${layout.anchor}" ${this.rtl?`transform="translate(${2*layout.x} 0) scale(-1 1)"`:''}>${tspans}</text>`);
  }
  shapeText(x,y,w,h,value,{shape='circle',size=13,minSize=10,maxLines=7,padding=6,lineRatio=1.27,paragraphGap=.55,color='ink',weight=500,role='shape-label',measureText}={}){
    const context=typeof document==='undefined'?null:document.createElement('canvas').getContext('2d');
    const font=this.options.fontFamily??(typeof document!=='undefined'?getComputedStyle(document.body).fontFamily:'sans-serif');
    const measure=measureText??(context?((text,fontSize)=>{context.font=`${weight} ${fontSize}px ${font}`;return context.measureText(text).width}):undefined);
    const opts={shape,x,y,w,h,size,minSize,maxLines,padding,lineRatio,paragraphGap,measureText:measure};
    let layout=layoutShapeText(value,opts),decision=layout.fits?(layout.fontSize<size?'shrink-font':'fit'):'external-reference';
    if(!layout.fits){
      this.truncated.add(String(value));this.warnings.push(`도형 밖에 원문 배치: ${String(value)}`);
      layout=layoutShapeText('원문 ↑',{...opts,size:Math.min(size,12),minSize:Math.min(minSize,10),maxLines:2});
      if(!layout.fits)return this.push('');
    }
    this.fonts.push({size:layout.fontSize,weight,role});const c=this.colors;
    const tspans=layout.lines.map(line=>`<tspan x="${line.x.toFixed(2)}" y="${line.y.toFixed(2)}" data-line-width="${line.width.toFixed(2)}">${esc(line.text)}</tspan>`).join('');
    return this.push(`<text class="viz-text" style="--i:${this.partIndex++}" data-role="${role}" data-fit-decision="${decision}" data-shape="${typeof shape==='string'?shape:shape.kind}" data-region="${[x,y,w,h].join(',')}" x="${layout.x}" font-size="${layout.fontSize}" font-weight="${weight}" fill="${c[color]||color}" text-anchor="middle" ${this.rtl?`transform="translate(${2*layout.x} 0) scale(-1 1)"`:''}>${tspans}</text>`);
  }
  edgeLabel(x1,y1,x2,y2,value,{gap=6,height=19,side='above',size=11,minSize=9,color='muted',weight=400}={}){
    const left=Math.min(x1,x2)+3,width=Math.abs(x2-x1)-6,top=(y1+y2)/2+(side==='above'?-gap-height:gap);
    return this.textBox(left,top,Math.max(width,14),height,value,{size,minSize,maxLines:1,padding:0,color,weight,role:'edge-label'});
  }
  textOnPath(d,pathLength,value,{size=13,minSize=10,color='ink',weight=500,endPadding=12,role='path-label'}={}){
    const plan=planPathText(value,{pathLength,size,minSize,endPadding}),index=this.partIndex++,id=`${this.id}-text-path-${index}`;
    let shown=plan.text;
    if(plan.decision==='external-reference'){
      const labelIndex=this.labels.indexOf(String(value));shown=labelIndex>=0?String(labelIndex+1):'※';
      this.truncated.add(String(value));this.warnings.push(`경로 글자 참조 ${shown}: ${String(value)}`);
    }
    this.defs.push(`<path id="${id}" d="${esc(d)}"/>`);
    this.fonts.push({size:plan.fontSize,weight,role});
    return this.push(`<text class="viz-text" style="--i:${index}" data-role="${role}" data-fit-decision="${plan.decision}" data-path-length="${pathLength}" data-end-padding="${endPadding}" font-size="${plan.fontSize}" font-weight="${weight}" fill="${this.colors[color]||color}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(shown)}</textPath></text>`);
  }
  rotatedTextBox(cx,cy,w,h,value,angle,options={}){
    if(![cx,cy,w,h,angle].every(Number.isFinite)||w<=0||h<=0)throw new Error('회전 글자의 좌표·크기·각도를 확인하세요.');
    this.push(`<g transform="rotate(${angle} ${cx} ${cy})">`);
    this.textBox(cx-w/2,cy-h/2,w,h,value,{...options,role:options.role??'rotated-label'});
    this.push('</g>');
  }
  box(x,y,w,h,label,{fill='white',stroke='line',size=13,max=16,weight=500,subtitle='',subtitleSize=11,subtitleMinSize=9,subtitleWeight=400,padding=12,r=5}={}){
    this.rect(x,y,w,h,fill,stroke,r,`data-node="true" data-box-padding="${padding}"`);
    this.textBox(x+padding,y+padding,w-2*padding,subtitle?h-2*padding-subtitleSize-6:h-2*padding,label,{size,minSize:Math.min(size,10),maxLines:subtitle?2:3,padding:0,weight,role:subtitle?'box-title':'box-label'});
    if(subtitle)this.textBox(x+padding,y+h-padding-subtitleSize-3,w-2*padding,subtitleSize+4,subtitle,{size:subtitleSize,minSize:Math.min(subtitleMinSize,subtitleSize),maxLines:1,padding:0,color:'muted',weight:subtitleWeight,role:'box-subtitle'});
  }
  badge(x,y,text,fill='tealLight',color='teal'){this.rect(x,y,Math.max(36,String(text).length*7+20),22,fill,'none',11);this.text(x+10,y+15,text,{size:10,color,weight:600,max:20})}
  metadata(){const scale=this.displayWidth/this.width,sizes=this.fonts.map(font=>font.size*scale);return {sourceWidth:this.width,sourceHeight:this.height,displayWidth:this.displayWidth,scale,minTextPx:sizes.length?Math.min(...sizes):null,maxTextPx:sizes.length?Math.max(...sizes):null,arrowSize:this.arrowSize,warnings:this.warnings}}
  finish(){
    const arrow=this.arrowSize,ids=['teal','orange','blue','muted'].map(key=>`<marker id="${this.id}-arrow-${key}" markerUnits="userSpaceOnUse" markerWidth="${arrow}" markerHeight="${arrow}" refX="${arrow*.875}" refY="${arrow/2}" orient="auto"><path d="M0 0 L${arrow} ${arrow/2} L0 ${arrow} Z" fill="${this.colors[key]}"/></marker>`).join('');
    const body=this.parts.join('');const title=esc(this.template.name);const desc=esc(`${this.template.meaning}. 예시 자료: ${this.labels.join(', ')}.`);
    let legend='',height=this.height;
    if(this.truncated.size){
      const sep=this.height+10;legend=`<line x1="22" y1="${sep}" x2="${this.width-22}" y2="${sep}" stroke="${this.colors.line}"/><text x="24" y="${sep+21}" direction="ltr" text-anchor="start" font-size="13" font-weight="600" fill="${this.colors.ink}">전체 문구</text>`;
      let y=sep+41,index=0;
      for(const item of this.truncated){
        const lines=wrap(item,48,999);const x=this.rtl?this.width-26:55,anchor='start';
        legend+=`<text x="24" y="${y}" direction="ltr" text-anchor="start" font-size="13" fill="${this.colors.teal}">${++index}.</text>`;
        legend+=`<text x="${x}" y="${y}" text-anchor="${anchor}" direction="${this.rtl?'rtl':'ltr'}" font-size="13" fill="${this.colors.ink}">${lines.map((line,i)=>`<tspan x="${x}" dy="${i?19:0}">${esc(line)}</tspan>`).join('')}</text>`;
        y+=lines.length*19+12;
      }
      height=y+9;
    }
    const motion=['none','trace','reveal','pulse','grow','focus','assemble'].includes(this.options.motion)?this.options.motion:'none';
    const style=`<style>
@keyframes viz-dash{0%{stroke-dashoffset:0;opacity:.45}50%{opacity:1}100%{stroke-dashoffset:-36;opacity:.45}}
@keyframes viz-travel{0%{transform:translate(0,0);opacity:0}12%{opacity:1}85%{opacity:1}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes viz-appear{0%,8%{opacity:.14}32%,78%{opacity:1}100%{opacity:.14}}
@keyframes viz-pulse{50%{opacity:.25}}
@keyframes viz-grow{0%,8%{transform:scaleY(.12)}38%,78%{transform:scaleY(1)}100%{transform:scaleY(.12)}}
@keyframes viz-focus{50%{filter:brightness(1.45);opacity:.5}}
@keyframes viz-assemble{from{transform:translateY(var(--drop))}to{transform:translateY(0)}}
svg[data-motion="trace"] .viz-edge,svg[data-motion="trace"] .viz-path{stroke-dasharray:10 6;animation:viz-dash 1.15s linear infinite}
.viz-tracer{display:none;pointer-events:none}
svg[data-motion="trace"] .viz-tracer{display:block;animation:viz-travel 1.45s linear infinite;animation-delay:calc(min(var(--i),12)*90ms)}
svg[data-motion="reveal"] .viz-shape,svg[data-motion="reveal"] .viz-text{animation:viz-appear 2.4s ease-in-out infinite;animation-delay:calc(min(var(--i),12)*70ms)}
svg[data-motion="pulse"] .viz-shape,svg[data-motion="pulse"] .viz-data{animation:viz-pulse 1.6s ease-in-out infinite}
svg[data-motion="grow"] .viz-data:not(text){transform-box:fill-box;transform-origin:center bottom;animation:viz-grow 2.4s ease-in-out infinite}
svg[data-motion="focus"] .viz-shape,svg[data-motion="focus"] .viz-data{animation:viz-focus 1.6s ease-in-out infinite}
svg[data-motion="assemble"] .viz-part{animation:viz-assemble 2.1s ease-in-out infinite alternate}
svg[data-paused="true"] *{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){svg:not([data-force-motion="true"]) *{animation:none!important;opacity:1!important}}
</style>`;
    const minWidth=Number(this.options.minDisplayWidth??this.width);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${height}" role="img" aria-labelledby="${this.id}-title ${this.id}-desc" data-motion="${motion}" data-paused="false" data-source-width="${this.width}" data-display-width="${this.displayWidth}" data-min-display-width="${minWidth}" data-arrow-size="${arrow}" style="width:100%;max-width:${this.displayWidth}px;min-width:${minWidth}px;height:auto;display:block;background:${this.colors.paper};font-family:${esc(this.options.fontFamily??'var(--viz-font, inherit)')}" lang="${this.options.lang==='ar'?'ar':this.options.lang==='en'?'en':'ko'}" direction="${this.rtl?'rtl':'ltr'}"><title id="${this.id}-title">${title}</title><desc id="${this.id}-desc">${desc}</desc><defs>${ids}${this.defs.join('')}</defs>${style}<g ${this.rtl?`transform="translate(${this.width} 0) scale(-1 1)"`:''}>${body}</g>${legend}</svg>`;
  }
}

export const clamp=(v,min,max)=>Math.max(min,Math.min(max,n(v)));
export const point=(cx,cy,r,angle)=>[cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];
