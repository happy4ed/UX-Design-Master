import {drawSupplement,supplementIds} from './motion-verified-supplement.mjs?rev=2026-11-02-lite5';
export {supplementIds};
// Internal demonstrations for source-verified shared motion cores.
// Each recipe owns its subject and movement; no family-wide fallback is allowed.
const W=800,H=254, TAU=Math.PI*2;
const C={ink:'#141821',paper:'#f3efe8',blue:'#4fb8e8',orange:'#e07a3f',green:'#1a8f63',pink:'#ed4e72',violet:'#7657f0',white:'#fff'};
const clamp=x=>Math.max(0,Math.min(1,x));
const mix=(a,b,p)=>a+(b-a)*p;
const ease=p=>{p=clamp(p);return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2};
const out=p=>1-Math.pow(1-clamp(p),3);
const back=p=>{p=clamp(p);return 1+2.7*Math.pow(p-1,3)+1.7*Math.pow(p-1,2)};
const seg=(t,start,length)=>clamp((t-start)/length);
const frac=x=>x-Math.floor(x);
const jittered=(step,index,range)=>Math.sin(step*19.7+index*43.1)*range;
const glyphFields=new Map();
function glyphField(word){
  if(glyphFields.has(word))return glyphFields.get(word);
  const w=400,h=127,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.font='800 47px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(word,w/2,h/2);
  const data=ctx.getImageData(0,0,w,h).data,mask=new Uint8Array(w*h);for(let i=0;i<mask.length;i++)mask[i]=data[i*4+3]>100?1:0;
  const distance=target=>{const d=new Float32Array(w*h);for(let i=0;i<d.length;i++)d[i]=mask[i]===target?0:1e4;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(x)d[i]=Math.min(d[i],d[i-1]+1);if(y){d[i]=Math.min(d[i],d[i-w]+1);if(x)d[i]=Math.min(d[i],d[i-w-1]+1);if(x<w-1)d[i]=Math.min(d[i],d[i-w+1]+1)}}
    for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(x<w-1)d[i]=Math.min(d[i],d[i+1]+1);if(y<h-1){d[i]=Math.min(d[i],d[i+w]+1);if(x)d[i]=Math.min(d[i],d[i+w-1]+1);if(x<w-1)d[i]=Math.min(d[i],d[i+w+1]+1)}}return d};
  const inside=distance(1),outside=distance(0),field=new Float32Array(w*h);for(let i=0;i<field.length;i++)field[i]=inside[i]-outside[i];glyphFields.set(word,field);return field;
}
const fill=(c,color)=>{c.fillStyle=color;c.fillRect(0,0,W,H)};
const rounded=(c,x,y,w,h,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()};
const label=(c,text,x,y,size=58,color=C.white)=>{c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='800 '+size+'px system-ui,sans-serif';c.fillText(text,x,y)};
function simpleScreen(c,which){fill(c,which==='A'?C.orange:C.blue);label(c,which,W/2,H/2,96,which==='A'?C.white:C.ink)}
function sourceScreen(c,which,accent){fill(c,which==='A'?C.ink:accent);label(c,which,W/2,H/2,96,which==='A'?C.paper:C.ink)}
function landscapeScene(c,night){
  fill(c,night?'#111720':'#f3efe8');
  if(night){c.fillStyle='#f6efe1';c.beginPath();c.arc(W*.72,H*.26,H*.115,0,TAU);c.fill();c.fillStyle='#111720';c.beginPath();c.arc(W*.75,H*.22,H*.115,0,TAU);c.fill();for(let i=0;i<26;i++){const x=frac(Math.sin(i*71.8)*43758.5)*W,y=frac(Math.sin(i*39.2)*9271.8)*H*.53;c.fillStyle=i%3?'#aab3bb':'#f3efe8';c.fillRect(x,y,2.5,2.5)}}else{c.fillStyle='#f05032';c.beginPath();c.arc(W*.72,H*.27,H*.14,0,TAU);c.fill()}
  c.fillStyle=night?'#512e2b':'#b47a72';c.beginPath();c.moveTo(0,H*.7);c.quadraticCurveTo(W*.28,H*.48,W*.57,H*.74);c.quadraticCurveTo(W*.78,H*.57,W,H*.7);c.lineTo(W,H);c.lineTo(0,H);c.closePath();c.fill();
  c.fillStyle=night?'#893e30':'#8e3b2f';c.beginPath();c.moveTo(0,H);c.quadraticCurveTo(W*.45,H*.62,W,H*.82);c.lineTo(W,H);c.closePath();c.fill();
}
function transitionState(t){
  const u=t%4;
  if(u<.4)return {from:'A',to:'B',p:0};
  if(u<1.8)return {from:'A',to:'B',p:(u-.4)/1.4};
  if(u<2.4)return {from:'B',to:'A',p:0};
  if(u<3.8)return {from:'B',to:'A',p:(u-2.4)/1.4};
  return {from:'A',to:'B',p:0};
}
function bolt(c,x,y,size,color=C.white){c.save();c.translate(x,y);c.scale(size,size);c.fillStyle=color;c.beginPath();[[.12,-.5],[-.24,.06],[.06,.06],[-.12,.5],[.26,-.08],[-.04,-.08]].forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fill();c.restore()}
function mark(c,x,y,size,color=C.orange){rounded(c,x-size/2,y-size/2,size,size,size*.25,color);bolt(c,x,y,size*.65)}
function wavePath(c,y,amp,phase){c.beginPath();c.moveTo(0,H+2);for(let x=0;x<=W+6;x+=6)c.lineTo(x,y+amp*Math.sin(x/W*Math.PI*3+phase));c.lineTo(W,H+2);c.closePath()}
function isoCube(c,x,y,s,h,top='#2bb5a4',left='#d5ded9',right='#8b9c9a'){
  const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fill()};
  poly([[x,y-h],[x+s,y-h+s*.47],[x,y-h+s*.94],[x-s,y-h+s*.47]],top);
  poly([[x-s,y-h+s*.47],[x,y-h+s*.94],[x,y+s*.94],[x-s,y+s*.47]],left);
  poly([[x,y-h+s*.94],[x+s,y-h+s*.47],[x+s,y+s*.47],[x,y+s*.94]],right);
}
function drawBell(c,x,y,s,color){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=color;c.beginPath();c.moveTo(-.46,.42);c.quadraticCurveTo(-.3,.15,-.3,-.15);c.arc(0,-.15,.3,Math.PI,0);c.quadraticCurveTo(.3,.15,.46,.42);c.closePath();c.fill();c.beginPath();c.arc(0,.51,.075,0,TAU);c.fill();c.beginPath();c.arc(0,-.51,.065,0,TAU);c.fill();c.restore()}
function draw(id,c,t){
  c.clearRect(0,0,W,H);
  if(id==='bauhaus-tiles'){
    fill(c,C.paper);const s=H/2,colors=['#f05032',C.ink,'#f05032',C.ink];
    for(let row=0;row<2;row++)for(let col=0;col<8;col++){
      const i=row*8+col,p=seg(frac(t/2+i*.137),0,.5),angle=Math.floor(t/2+i*.137)*Math.PI/2+ease(p)*Math.PI/2;
      c.save();c.translate(col*s+s/2,row*s+s/2);c.rotate(angle);c.fillStyle=colors[i%4];
      if(i%4===0){c.beginPath();c.arc(0,0,s*.39,0,TAU);c.fill()}
      else if(i%4===1){c.beginPath();c.arc(0,0,s*.42,0,Math.PI);c.closePath();c.fill()}
      else if(i%4===2){c.fillRect(-s*.4,-s*.4,s*.8,s*.8)}
      else{c.beginPath();c.moveTo(0,-s*.43);c.lineTo(s*.43,s*.43);c.lineTo(-s*.43,s*.43);c.fill()}
      c.restore();
    }
  } else if(id==='before-after-card'){
    fill(c,C.ink);
    const cw=W*.36,ch=H*.66;
    const card=(x,title,value,scale)=>{if(scale<=0)return;c.save();c.translate(x,H/2);c.scale(scale,scale);rounded(c,-cw/2,-ch/2,cw,ch,H*.06,'#20252f');if(title==='AFTER'){c.strokeStyle='#2fc78d';c.lineWidth=2.5;c.beginPath();c.roundRect(-cw/2,-ch/2,cw,ch,H*.06);c.stroke()}label(c,title,0,-ch*.32,H*.051,title==='AFTER'?'#2fc78d':'#a4abb6');label(c,value,0,-ch*.02,H*.145,title==='AFTER'?C.paper:'#a4abb6');rounded(c,-cw*.36,ch*.28,cw*.72,5,2,'#404650');rounded(c,-cw*.36,ch*.28,cw*.72*(title==='BEFORE'?1:1-.89*out(seg(t,1.8,1))),5,2,title==='BEFORE'?'#a4abb6':'#2fc78d');c.restore()};
    card(W*.25,'BEFORE','3시간',back(seg(t,.4,.4)));
    const arrow=out(seg(t,.9,.5));c.strokeStyle='#2fc78d';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(W*.25+cw/2+6,H/2);c.lineTo(W*.25+cw/2+6+(W*.5-cw-14)*arrow,H/2);c.stroke();if(arrow>.85){const tip=W*.75-cw/2-8;c.beginPath();c.moveTo(tip-9,H/2-6);c.lineTo(tip,H/2);c.lineTo(tip-9,H/2+6);c.stroke()}
    card(W*.75,'AFTER','20분',back(seg(t,1.4,.45)));
  } else if(id==='checker-scroll'){
    fill(c,'#18a98e');c.save();c.translate(W/2,H/2);c.rotate(-Math.PI/12);c.translate(-W,-W);const s=H/4,offset=frac(t/4)*s*2;c.fillStyle=C.ink;
    for(let y=-2*s;y<W*2;y+=s)for(let x=-2*s;x<W*2;x+=s)if(((x/s+y/s)&1)===0)c.fillRect(x+offset,y+offset,s,s);c.restore();
  } else if(id==='iris-wipe'){
    fill(c,'#e7d6bc');const r=Math.hypot(W/2,H/2)*ease(seg(t,.6,1.05));c.save();c.beginPath();c.arc(W/2,H/2,r,0,TAU);c.clip();fill(c,C.green);label(c,'화면 B',W/2,H/2,50);c.restore();
  } else if(id==='countdown'){
    fill(c,C.ink);const p=t%4.4;if(p<3){const n=3-Math.floor(p),q=frac(p),r=H*.34;c.strokeStyle='#4b515b';c.lineWidth=7;c.beginPath();c.arc(W/2,H/2,r,0,TAU);c.stroke();c.strokeStyle=C.pink;c.lineCap='round';c.beginPath();c.arc(W/2,H/2,r,-Math.PI/2,-Math.PI/2+TAU*(1-q));c.stroke();c.save();c.translate(W/2,H/2);const sc=back(seg(q,0,.25));c.scale(sc,sc);label(c,String(n),0,0,H*.55);c.restore()}else label(c,'시작!',W/2,H/2,H*.38,C.green);
  } else if(id==='wipe'){
    fill(c,C.orange);const p=ease(seg(t,.6,1.05));c.save();c.beginPath();c.rect(0,0,W*p,H);c.clip();fill(c,C.blue);label(c,'화면 B',W/2,H/2,50);c.restore();
  } else if(id==='odometer-roll'){
    fill(c,C.ink);const target='48,210',size=H*.42,space=H*.3,start=W/2-target.length*space/2;c.save();c.beginPath();c.rect(0,H*.26,W,H*.48);c.clip();
    [...target].forEach((ch,i)=>{const x=start+i*space+space/2;if(ch===','){label(c,',',x,H/2+H*.06,H*.4);return}const digit=Number(ch),spins=2+(target.length-i)%3,pos=out(seg(t,.4+i*.12,2.2))*(spins*10+digit);for(let j=-1;j<=1;j++){const v=Math.floor(pos)+j,y=H/2+(v-pos)*H*.56;label(c,String(((v%10)+10)%10),x,y,size)}});c.restore();rounded(c,start,H*.79,space*target.length*out(seg(t,2.8,.8)),H*.03,0,'#f05032');
  } else if(id==='dip-to-black'){
    const s=transitionState(t),color='#f05032';sourceScreen(c,s.p<.5?s.from:s.to,color);if(s.p>0){const alpha=s.p<.5?ease(s.p/.45):1-ease((s.p-.55)/.45);c.fillStyle='rgba(0,0,0,'+clamp(alpha)+')';c.fillRect(0,0,W,H)}
  } else if(id==='horizontal-split'){
    const s=transitionState(t),color='#6b5ae0';sourceScreen(c,s.from,color);const q=ease(s.p);c.save();c.beginPath();c.rect(0,0,W*q,H/2+.5);c.rect(W-W*q,H/2-.5,W*q,H/2+.5);c.clip();sourceScreen(c,s.to,color);c.restore();
  } else if(id==='light-sweep'){
    fill(c,C.ink);rounded(c,300,65,200,70,13,'#283750');c.save();c.beginPath();c.roundRect(300,65,200,70,13);c.clip();label(c,'LOGO',W/2,100,29,'#e7d6bc');const x=mix(260,575,ease(seg(t,1.43,.65)));c.translate(x,0);c.transform(1,0,-.32,1,0,0);const grad=c.createLinearGradient(-28,0,28,0);grad.addColorStop(0,'#ffffff00');grad.addColorStop(.5,'#ffffffc5');grad.addColorStop(1,'#ffffff00');c.fillStyle=grad;c.fillRect(-28,45,56,110);c.restore();
  } else if(id==='line-tunnel'){
    fill(c,C.paper);const phase=frac(t),base=H*.05;for(let i=0;i<11;i++){const s=base*Math.pow(1.55,i+phase);if(s>W*.9)break;c.strokeStyle=i%4===0?C.orange:C.ink;c.lineWidth=Math.max(1.5,s*.04);c.strokeRect(W/2-s,H/2-s*.62,s*2,s*1.24)}
  } else if(id==='liquid-wipe'){
    const s=transitionState(t),color='#f05032';sourceScreen(c,s.from,color);const q=ease(s.p*1.2),surface=H*1.18-H*1.4*q,amp=H*.08*(1-q*.6);c.save();wavePath(c,surface,amp,s.p*9);c.clip();sourceScreen(c,s.to,color);c.restore();
  } else if(id==='multi-stripe-wipe'){
    const s=transitionState(t),color='#ed4e72';sourceScreen(c,s.from,color);
    const rows=6,rowH=H/rows;
    for(let i=0;i<rows;i++){
      const q=out(seg(s.p,i*.065,.61)),w=W*q;
      if(q<=0)continue;
      c.save();c.beginPath();c.rect(i%2?W-w:0,rowH*i,w,rowH+.6);c.clip();sourceScreen(c,s.to,color);c.restore();
    }
  } else if(id==='bars-wipe'){
    const s=transitionState(t),color='#ed4e72';sourceScreen(c,s.from,color);
    const bars=11,barW=W/bars;
    for(let i=0;i<bars;i++){
      const q=out(seg(s.p,Math.abs(i-(bars-1)/2)*.035,.68)),h=H*q;
      if(q<=0)continue;
      c.save();c.beginPath();c.rect(i*barW,H/2-h/2,barW+.7,h);c.clip();sourceScreen(c,s.to,color);c.restore();
    }
  } else if(id==='sliding-panels'){
    const s=transitionState(t),color='#6b5ae0';sourceScreen(c,s.from,color);
    const panels=4,panelW=W/panels;
    for(let i=0;i<panels;i++){
      const q=out(seg(s.p,i*.1,.62)),h=H*q;
      if(q<=0)continue;
      c.save();c.beginPath();c.rect(i*panelW,H-h,panelW+.7,h);c.clip();sourceScreen(c,s.to,color);c.restore();
    }
  } else if(id==='float-bob'){
    fill(c,C.paper);const q=Math.sin(t*TAU/2.6),y=H*.48-q*H*.11,rot=q*.045;
    c.fillStyle='#d8d5d0';c.beginPath();c.ellipse(W/2,H*.85,49-8*q,7-1.5*q,0,0,TAU);c.fill();
    c.save();c.translate(W/2,y);c.rotate(rot);rounded(c,-47,-47,94,94,25,'#18a98e');bolt(c,0,0,70,C.white);c.restore();
  } else if(id==='goal-fill'){
    fill(c,C.ink);const p=.58+.32*(.5+.5*Math.sin(t*TAU/3.5)),x=W*.12,y=H*.53,w=W*.76;
    rounded(c,x,y,w,30,15,'#214f86');rounded(c,x,y,w*p,30,15,'#2f86e9');
    const marker=x+w*.8;c.strokeStyle=C.white;c.lineWidth=3;c.beginPath();c.moveTo(marker,y-19);c.lineTo(marker,y+44);c.stroke();
    label(c,'목표 80',marker,y-34,20,C.white);c.textAlign='left';c.textBaseline='middle';c.font='800 31px system-ui,sans-serif';c.fillStyle='#2f86e9';c.fillText(Math.round(p*100)+'%',x,y+68);
  } else if(id==='pendulum'){
    fill(c,C.paper);const pivotX=W/2,pivotY=H*.1,len=H*.69,angle=.62*Math.sin(t*TAU/3);
    c.strokeStyle='#d8d5d0';c.lineWidth=1.5;c.beginPath();c.arc(pivotX,pivotY,len,Math.PI/2-.62,Math.PI/2+.62);c.stroke();
    const x=pivotX+Math.sin(angle)*len,y=pivotY+Math.cos(angle)*len;
    c.strokeStyle=C.ink;c.lineWidth=3;c.beginPath();c.moveTo(pivotX,pivotY);c.lineTo(x,y);c.stroke();
    c.fillStyle=C.ink;c.beginPath();c.arc(pivotX,pivotY,5,0,TAU);c.fill();c.fillStyle='#2f86e9';c.beginPath();c.arc(x,y,19,0,TAU);c.fill();c.fillStyle='#86bcff';c.beginPath();c.arc(x-5,y-5,5,0,TAU);c.fill();
  } else if(id==='marquee-stack'){
    fill(c,C.ink);const rows=[['한정 · 오늘 한정 · 오늘 한정 · 오늘 한정 · ',47,'#f1a112',C.ink,64],['신상 공개 · 신상 공개 · 신상 공개 · ',68,C.ink,C.white,-90],['예약 받는 중 · 예약 받는 중 · 예약 받는 중 · ',42,'#f1a112',C.ink,116],['마지막 날 · 마지막 날 · 마지막 날 · ',97,C.ink,'#f1a112',-145]];
    let y=0;for(const [copy,height,bg,fg,speed] of rows){c.save();c.beginPath();c.rect(0,y,W,height);c.clip();c.fillStyle=bg;c.fillRect(0,y,W,height);c.font=`800 ${Math.round(height*.82)}px system-ui,sans-serif`;c.textAlign='left';c.textBaseline='middle';c.fillStyle=fg;const tile=c.measureText(copy).width;let x=-((t*speed)%tile)-tile;while(x<W){c.fillText(copy,x,y+height/2+1);x+=tile}c.restore();y+=height}
  } else if(id==='bar-swap'){
    fill(c,C.paper);const vals=[82,48,64],xs=[W*.22,W*.5,W*.78],base=H*.84,scale=H*.0058;
    const cycle=t%4,q=cycle<1.5?ease(seg(cycle,.35,1)):cycle<2.3?1:1-ease(seg(cycle,2.3,1));
    c.strokeStyle='#b8b8b4';c.lineWidth=2;c.beginPath();c.moveTo(38,base+.5);c.lineTo(W-38,base+.5);c.stroke();
    vals.forEach((v,i)=>{const x=i===0?mix(xs[0],xs[1],q):i===1?mix(xs[1],xs[0],q):xs[2],h=v*scale;
      rounded(c,x-58,base-h,116,h,4,i===0?'#2f86e9':C.ink);label(c,String(v),x,base-h-19,21,i===0?'#2f86e9':C.ink);
    });
  } else if(id==='liquid-fill'){
    fill(c,C.ink);const cycle=t%4,p=cycle<2.2?ease(seg(cycle,.25,2)):1-ease(seg(cycle,2.5,1.2));
    const off=document.createElement('canvas');off.width=W;off.height=H;const o=off.getContext('2d');
    o.font='800 176px system-ui,sans-serif';o.textAlign='center';o.textBaseline='middle';o.fillStyle=C.white;o.fillText('가득',W/2,H*.53);
    o.globalCompositeOperation='source-in';const y=H*.86-p*H*.69;
    o.fillStyle='#f04b35';o.beginPath();o.moveTo(0,H);for(let x=0;x<=W;x+=6)o.lineTo(x,y+9*Math.sin(x/W*TAU*2+t*2));o.lineTo(W,H);o.closePath();o.fill();
    c.font='800 176px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineWidth=3;c.strokeStyle=C.white;c.strokeText('가득',W/2,H*.53);c.drawImage(off,0,0);
  } else if(id==='brush-wipe'){
    const s=transitionState(t),accent='#e94b70';sourceScreen(c,s.from,accent);
    if(s.p>=.98){sourceScreen(c,s.to,accent)}else if(s.p>0){
      const off=document.createElement('canvas');off.width=W;off.height=H;const o=off.getContext('2d');sourceScreen(o,s.to,accent);
      const mask=document.createElement('canvas');mask.width=W;mask.height=H;const m=mask.getContext('2d');m.strokeStyle=C.white;m.lineCap='round';m.lineJoin='round';m.lineWidth=H*.47;
      let activeTip=null;
      for(let row=0;row<3;row++){
        const q=ease(seg(s.p,row*.19,.57));if(q<=0)continue;
        const from=row%2?W+H*.2:-H*.2,to=row%2?-H*.2:W+H*.2,base=H*(.16+row*.34);
        m.beginPath();for(let j=0;j<=40;j++){
          const u=q*j/40,x=mix(from,to,u),phase=x/W*TAU*1.15+row*.7;
          const y=base+H*.062*Math.sin(phase)+H*.028*Math.sin(phase*2.3);
          if(j===0)m.moveTo(x,y);else m.lineTo(x,y);
        }m.stroke();
        if(q>.02&&q<.98){const x=mix(from,to,q),phase=x/W*TAU*1.15+row*.7,y=base+H*.062*Math.sin(phase)+H*.028*Math.sin(phase*2.3);activeTip={x,y,flip:row%2?-1:1}}
      }
      o.globalCompositeOperation='destination-in';o.drawImage(mask,0,0);o.globalCompositeOperation='source-over';c.drawImage(off,0,0);
      if(activeTip){c.save();c.translate(activeTip.x,activeTip.y);c.scale(activeTip.flip,1);c.rotate(-.32);
        rounded(c,-7,-13,36,26,5,'#d6bd90');rounded(c,27,-10,35,20,3,'#9ca4aa');rounded(c,57,-7,86,14,6,'#262a30');
        c.fillStyle='#e9d8b5';c.beginPath();c.moveTo(-7,-13);c.lineTo(-33,0);c.lineTo(-7,13);c.closePath();c.fill();c.restore()}
    }
  } else if(id==='diagonal-panels'){
    const s=transitionState(t),accent='#6856df';sourceScreen(c,s.from,accent);
    const slant=.6,U=W+slant*H,bw=U/4;
    for(let i=0;i<4;i++){
      const q=out(s.p*1.7-i*.22);if(q<=0)continue;
      const u=i*bw+(1-q)*U;
      c.save();c.beginPath();c.moveTo(u,0);c.lineTo(u+bw+1,0);c.lineTo(u+bw+1-slant*H,H);c.lineTo(u-slant*H,H);c.closePath();c.clip();sourceScreen(c,s.to,accent);c.restore();
    }
  } else if(id==='grid-flip'){
    const s=transitionState(t),accent='#2ca8df';fill(c,C.ink);
    const scenes=['A','B'].map(which=>{const off=document.createElement('canvas');off.width=W;off.height=H;sourceScreen(off.getContext('2d'),which,accent);return off});
    const rows=3,cols=3,cw=W/cols,ch=H/rows;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const u=clamp((s.p-(row+col)*.075)/.58),backFace=u>=.5,face=backFace?scenes[1]:scenes[0],scale=Math.max(.015,backFace?(u-.5)*2:1-u*2),x=col*cw,y=row*ch;
      c.drawImage(face,x,y,cw,ch,x+cw*(1-scale)/2,y,cw*scale+.4,ch+.4);
    }
  } else if(id==='stacked-build'){
    fill(c,C.ink);const xs=[W*.18,W*.39,W*.6,W*.81],base=H*.82,segmentHeights=[[48,39,36],[35,54,42],[52,37,46],[40,60,43]],colors=['#2e86df','#83b3e3','#28578b'];
    for(let i=0;i<4;i++){let stacked=0;for(let layer=0;layer<3;layer++){
      const full=segmentHeights[i][layer],p=out(seg(t,.25+i*.16+layer*.24,.55)),height=full*p;
      if(height>0)rounded(c,xs[i]-47,base-stacked-height,94,height,3,colors[layer]);stacked+=height;
    }}
  } else if(id==='motion-path'){
    fill(c,C.ink);const path=u=>({x:W*(.06+.88*u),y:H*(.75-.49*u+.13*Math.sin(u*TAU))}),p=frac(t/4);
    for(let i=0;i<=56;i++){const u=i/56,pt=path(u);c.fillStyle=u<p?'#2e86df':'#66707e';c.beginPath();c.arc(pt.x,pt.y,2,0,TAU);c.fill()}
    const pt=path(p),next=path(Math.min(1,p+.005)),angle=Math.atan2(next.y-pt.y,next.x-pt.x);
    c.save();c.translate(pt.x,pt.y);c.rotate(angle);c.fillStyle=C.paper;c.beginPath();c.moveTo(23,0);c.lineTo(-20,-11);c.lineTo(-8,0);c.lineTo(-20,11);c.closePath();c.fill();c.restore();
  } else if(id==='orbit-shapes'){
    fill(c,C.ink);const cx=W/2,cy=H/2;
    for(let ring=0;ring<4;ring++){const rx=65+ring*56,ry=25+ring*19;c.strokeStyle='#66707e';c.lineWidth=1;c.setLineDash([2,8]);c.beginPath();c.ellipse(cx,cy,rx,ry,-.1,0,TAU);c.stroke();c.setLineDash([])}
    const bodies=[{ring:0,phase:0,speed:1.3,kind:'circle',color:C.violet,size:11},{ring:1,phase:2,speed:-.9,kind:'circle',color:C.paper,size:11},{ring:2,phase:1,speed:.65,kind:'square',color:C.violet,size:23},{ring:3,phase:3,speed:-.52,kind:'circle',color:C.paper,size:16}];
    bodies.forEach(b=>{const a=b.phase+t*b.speed,rx=65+b.ring*56,ry=25+b.ring*19,x=cx+rx*Math.cos(a),y=cy+ry*Math.sin(a);if(b.kind==='square'){c.save();c.translate(x,y);c.rotate(a*.6);c.fillStyle=b.color;c.fillRect(-b.size/2,-b.size/2,b.size,b.size);c.restore()}else{c.fillStyle=b.color;c.beginPath();c.arc(x,y,b.size,0,TAU);c.fill()}});
  } else if(id==='barber-stripes'){
    fill(c,'#ef9b0c');c.fillStyle=C.ink;const phase=(t*52)%150,slant=H*.48;
    for(let x=-250+phase;x<W+250;x+=150){c.beginPath();c.moveTo(x,0);c.lineTo(x+75,0);c.lineTo(x+75-slant,H);c.lineTo(x-slant,H);c.closePath();c.fill()}
  } else if(id==='kaleidoscope'){
    fill(c,'#111426');const radius=Math.hypot(W/2,H/2)+60,half=TAU/24,turn=t*.12;
    c.save();c.translate(W/2,H/2);c.rotate(turn);
    for(let sector=0;sector<12;sector++){
      c.save();c.rotate(sector*TAU/12);c.beginPath();c.moveTo(0,0);c.lineTo(radius*Math.cos(-half),radius*Math.sin(-half));c.lineTo(radius*Math.cos(half),radius*Math.sin(half));c.closePath();c.clip();
      if(sector%2)c.scale(1,-1);
      c.fillStyle=sector%2?'#291752':'#20163d';c.fillRect(0,-radius,radius*2,radius*2);
      for(let i=0;i<9;i++){
        const distance=H*.1+i*H*.24,drift=Math.sin(t*.6+i*1.7)*H*.055;
        const x=distance+drift,y=Math.sin(i*2.4+t*.5)*distance*.18;
        c.fillStyle=['#f16b8a','#48d5c1','#f2c95f','#806df5'][i%4];c.globalAlpha=.78;
        c.beginPath();c.ellipse(x,y,H*(.07+i%3*.02),H*(.04+i%2*.03),t*.13+i*.3,0,TAU);c.fill();
        c.strokeStyle='#b9a5ff';c.lineWidth=3;c.beginPath();c.arc(x+H*.04,y-H*.035,H*.065,0,Math.PI*.8);c.stroke();
      }
      c.globalAlpha=1;c.restore();
    }
    for(let side=0;side<6;side++){const a=side*TAU/6+Math.PI/6,r=H*.13;c.fillStyle=side%2?'#ffffff12':'#8fe1e51d';c.beginPath();c.moveTo(0,0);c.lineTo(r*Math.cos(a),r*Math.sin(a));c.lineTo(r*Math.cos(a+TAU/6),r*Math.sin(a+TAU/6));c.closePath();c.fill()}
    c.strokeStyle='#d2f9ff99';c.lineWidth=2;c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6+Math.PI/6,x=H*.13*Math.cos(a),y=H*.13*Math.sin(a);i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.stroke();c.restore();
  } else if(id==='soft-wave'){
    fill(c,C.paper);
    for(let row=0;row<2;row++){
      c.strokeStyle=row?'#17191e':'#f04d35';c.lineWidth=row?4:25;c.lineCap='round';c.beginPath();
      for(let x=-10;x<=W+10;x+=5){const y=H*(row?.49:.43)+H*(row?.17:.2)*Math.sin(x/W*TAU*1.35-t*1.05+row*.65);x===-10?c.moveTo(x,y):c.lineTo(x,y)}c.stroke();
    }
  } else if(id==='polka-drift'){
    fill(c,C.paper);const offset=(t*42)%90;
    for(let row=-2;row<8;row++)for(let col=-2;col<17;col++){
      const x=col*90+(row%2?45:0)+offset,y=row*55+offset*.55;
      c.fillStyle=row%2?C.pink:C.ink;c.beginPath();c.arc(x,y,row%2?21:8,0,TAU);c.fill();
    }
  } else if(id==='dot-wave'){
    fill(c,C.pink);
    for(let row=0;row<11;row++)for(let col=0;col<39;col++){
      const x=col*22-6,y=row*24+6,wave=Math.sin(col*.23-t*2.1+row*.14),radius=2.5+8.5*(.5+.5*wave);
      c.fillStyle=col%5===0?C.white:(wave>0?C.paper:C.ink);c.beginPath();c.arc(x,y,radius,0,TAU);c.fill();
    }
  } else if(id==='blob-morph'){
    fill(c,C.paper);const blobs=[{x:W*.23,y:H*.51,r:H*.23,color:'#6b55e7',seed:0},{x:W*.58,y:H*.45,r:H*.27,color:C.ink,seed:1},{x:W*.84,y:H*.66,r:H*.15,color:'#4b3a9b',seed:2},{x:W*.43,y:H*.72,r:H*.13,color:'#7657f0',seed:3}];
    for(const b of blobs){c.fillStyle=b.color;c.beginPath();for(let i=0;i<=48;i++){
      const a=i*TAU/48,rad=b.r*(1+.15*Math.sin(a*3+t*.85+b.seed*1.7)+.12*Math.sin(a*5-t*.62+b.seed));
      const x=b.x+Math.cos(a)*rad+Math.sin(t*.45+b.seed)*H*.027,y=b.y+Math.sin(a)*rad+Math.cos(t*.37+b.seed)*H*.03;
      i?c.lineTo(x,y):c.moveTo(x,y);
    }c.closePath();c.fill()}
  } else if(id==='floating-shapes'){
    fill(c,'#6856df');const pieces=[[-.04,.74,93,-.26,C.ink],[.22,1.05,92,.48,C.paper],[.56,.94,72,.35,C.ink],[.91,.67,84,.58,C.paper],[1.01,.78,72,-.38,C.ink]];
    pieces.forEach(([px,py,len,rot,color],i)=>{const x=W*px+Math.sin(t*.67+i*1.9)*H*.08,y=H*py+Math.cos(t*.55+i*.9)*H*.07;c.save();c.translate(x,y);c.rotate(rot+Math.sin(t*.4+i)*.08);rounded(c,-len/2,-14,len,28,14,color);c.restore()});
    c.strokeStyle=C.paper;c.lineWidth=7;c.lineCap='round';for(let i=0;i<2;i++){const x=W*(.65+i*.15)+Math.sin(t*.4+i)*H*.07,y=H*(.3+i*.67)+Math.cos(t*.6+i)*H*.08;c.beginPath();for(let j=0;j<18;j++){const xx=x+j*4,yy=y+Math.sin(j*.7+t*.3)*7;j?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.stroke()}
  } else if(id==='liquid-gauge'){
    fill(c,C.ink);const cx=W/2,cy=H/2,r=H*.38,p=.72*out(seg(t,.25,1.7));
    c.save();c.beginPath();c.arc(cx,cy,r,0,TAU);c.clip();c.fillStyle='#352b7b';c.fillRect(cx-r,cy-r,r*2,r*2);
    c.fillStyle='#6d59df';c.beginPath();const surface=cy+r-2*r*p;c.moveTo(cx-r,cy+r);for(let x=cx-r;x<=cx+r+3;x+=3)c.lineTo(x,surface+H*.035*Math.sin((x-cx)/r*TAU+t*1.8));c.lineTo(cx+r,cy+r);c.closePath();c.fill();c.restore();
    c.strokeStyle=C.paper;c.lineWidth=3;c.beginPath();c.arc(cx,cy,r,0,TAU);c.stroke();label(c,Math.round(p*100)+'%',cx,cy,48,C.ink);
  } else if(id==='halftone-pulse'){
    fill(c,C.ink);for(let row=0;row<13;row++)for(let col=0;col<38;col++){
      const x=col*22-6,y=row*22-5,d=Math.hypot((x-W/2)/W,(y-H/2)/H),pulse=.5+.5*Math.sin(d*23-t*2.3),r=1+8*pulse;
      c.fillStyle=d<.29?C.paper:C.pink;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
    }
  } else if(id==='nested-squares'){
    fill(c,C.ink);c.save();c.translate(W/2,H/2);c.rotate(.29*Math.sin(t*.65));
    for(let i=10;i>=0;i--){const s=15+i*19;c.strokeStyle=i%3===0?'#f04d35':C.paper;c.lineWidth=2.5;c.strokeRect(-s/2,-s/2,s,s)}c.restore();
  } else if(id==='polygon-tunnel'){
    fill(c,C.paper);const phase=frac(t/3.5);for(let i=12;i>=0;i--){const r=H*.025*Math.pow(1.46,i+phase),a=Math.PI/6;c.strokeStyle=i%4===0?'#715af0':C.ink;c.lineWidth=Math.max(1.5,r*.018);c.beginPath();for(let j=0;j<6;j++){const theta=a+j*TAU/6,x=W/2+r*Math.cos(theta),y=H/2+r*Math.sin(theta);j?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.stroke()}
  } else if(id==='drop-zoom'){
    const s=transitionState(t),color='#6653ba',p=s.p,a=ease(clamp(p*1.3));fill(c,C.ink);
    if(a<1){c.save();c.globalAlpha=1-a;c.translate(W/2,H/2+H*.25*a);c.scale(1-.55*a,1-.55*a);c.translate(-W/2,-H/2);sourceScreen(c,s.from,color);c.restore()}
    const b=seg(p,.3,.7);if(b>0){const q=back(b);c.save();c.globalAlpha=clamp(b*3);c.translate(W/2,H/2-H*.5*(1-q));c.scale(1.35-.35*q,1.35-.35*q);c.translate(-W/2,-H/2);sourceScreen(c,s.to,color);c.restore()}
  } else if(id==='stack-cards'){
    const s=transitionState(t),color='#2aa9dc',q=ease(s.p);fill(c,C.ink);
    c.save();c.translate(W/2,H/2-H*.06*q);c.scale(1-.12*q,1-.12*q);c.translate(-W/2,-H/2);sourceScreen(c,s.from,color);c.fillStyle='rgba(0,0,0,'+(.45*q)+')';c.fillRect(0,0,W,H);c.restore();
    if(s.p>0){const y=H*(1-out(s.p*1.1));c.fillStyle='#1118';c.fillRect(0,y-H*.025,W,H*.025);c.save();c.translate(0,y);sourceScreen(c,s.to,color);c.restore()}
  } else if(id==='concentric-arcs'){
    fill(c,C.ink);for(let ring=0;ring<4;ring++){const r=H*(.12+ring*.11),speed=[.8,-.55,1.25,-.4][ring],a=t*speed+ring*.6;c.strokeStyle=ring%2?C.paper:'#f04d35';c.lineWidth=ring===0?11:16;c.beginPath();c.arc(W/2,H/2,r,a,a+Math.PI*(1.1+ring*.12));c.stroke()}
  } else if(id==='icon-bounce'){
    fill(c,C.paper);const ground=H*.72,phase=t%3.6,fall=phase<.65?Math.pow(1-seg(phase,0,.65),2)*H*.8:0;
    const bounce1=phase>=.65&&phase<1.2?Math.sin((phase-.65)/.55*Math.PI)*H*.25:0;
    const bounce2=phase>=1.2&&phase<1.65?Math.sin((phase-1.2)/.45*Math.PI)*H*.1:0;
    const lift=fall+bounce1+bounce2,shadow=1-.5*clamp(lift/(H*.7));c.fillStyle='#c9c8c4';c.beginPath();c.ellipse(W/2,ground+54,42*shadow,6*shadow,0,0,TAU);c.fill();mark(c,W/2,ground-lift,80,'#2f86e9');
  } else if(id==='squash-pop'){
    fill(c,C.ink);const pulse=Math.max(0,Math.sin(t*TAU/1.5)),sy=1-.28*pulse,sx=1+.21*pulse;c.save();c.translate(W/2,H*.66+H*.12*pulse);c.scale(sx,sy);mark(c,0,0,95,'#2f86e9');c.restore();
  } else if(id==='star-fill'){
    fill(c,C.ink);const cx=W/2,cy=H/2,r=H*.37,p=out(seg(t,.25,1.8));
    const star=()=>{c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath()};
    star();c.fillStyle='#593044';c.fill();c.save();star();c.clip();c.fillStyle=C.pink;c.fillRect(cx-r,cy+r-2*r*p,2*r,2*r*p);c.restore();
    if(p>.92){for(let i=0;i<4;i++){const a=i*TAU/4+t*.4,x=cx+Math.cos(a)*r*1.25,y=cy+Math.sin(a)*r*1.25;c.strokeStyle=C.paper;c.lineWidth=2;c.beginPath();c.moveTo(x-5,y);c.lineTo(x+5,y);c.moveTo(x,y-5);c.lineTo(x,y+5);c.stroke()}}
  } else if(id==='toggle-on'){
    fill(c,C.paper);const p=ease(seg(t,.3,.75)),x=W/2-105,y=H/2-47;
    rounded(c,x,y,210,94,47,p>.5?C.pink:'#b8bdc3');c.fillStyle=C.white;c.beginPath();c.arc(x+47+p*116,H/2,38,0,TAU);c.fill();
  } else if(id==='spinner-arc'){
    fill(c,C.ink);const cx=W/2,cy=H/2,r=H*.26,a=t*2.2,span=.35+Math.PI*(.6+.35*Math.sin(t*1.5));
    c.strokeStyle='#176657';c.lineWidth=14;c.lineCap='round';c.beginPath();c.arc(cx,cy,r,0,TAU);c.stroke();c.strokeStyle='#20b598';c.beginPath();c.arc(cx,cy,r,a,a+span);c.stroke();
  } else if(id==='percent-ring'){
    fill(c,C.ink);const cx=W/2,cy=H/2,r=H*.34,p=.71*out(seg(t,.25,1.8));
    c.lineWidth=17;c.lineCap='round';c.strokeStyle='#7a3025';c.beginPath();c.arc(cx,cy,r,0,TAU);c.stroke();c.strokeStyle='#f04d35';c.beginPath();c.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+TAU*p);c.stroke();label(c,Math.round(p*100)+'%',cx,cy,46,C.paper);
  } else if(id==='typing-bubble'){
    fill(c,'#1f2e43');c.fillStyle='#2d415c';c.beginPath();c.arc(W*.23,H*.22,H*.49,0,TAU);c.fill();
    const x=W*.1,y=H*.39,p=out(seg(t,1.8,.5)),width=mix(96,270,p);rounded(c,x,y,width,58,24,C.white);
    c.fillStyle=C.white;c.beginPath();c.moveTo(x+9,y+48);c.lineTo(x-3,y+64);c.lineTo(x+34,y+56);c.fill();
    if(p<.9){for(let i=0;i<3;i++){const opacity=.35+.65*(.5+.5*Math.sin(t*4-i*.85));c.globalAlpha=opacity;c.fillStyle='#74869c';c.beginPath();c.arc(x+30+i*24,y+29,6,0,TAU);c.fill()}c.globalAlpha=1}else{c.textAlign='left';c.textBaseline='middle';c.fillStyle=C.ink;c.font='700 22px system-ui,sans-serif';c.fillText('지금 출발할게',x+22,y+29)}
  } else if(id==='chat-bubble-pop'){
    fill(c,'#1f2e43');c.fillStyle='#2d415c';c.beginPath();c.arc(W*.23,H*.22,H*.49,0,TAU);c.fill();
    const messages=[{text:'오늘 뭐 먹지?',x:W*.09,y:H*.14,bg:C.white,fg:C.ink,start:.15},{text:'떡볶이 어때',x:W*.7,y:H*.47,bg:'#2f86e9',fg:C.white,start:.75},{text:'좋아 바로 가자',x:W*.09,y:H*.72,bg:C.white,fg:C.ink,start:1.35}];
    messages.forEach((item,i)=>{const p=back(seg(t,item.start,.35));if(p<=0)return;c.save();c.translate(item.x,item.y+22*(1-p));c.scale(Math.max(.02,p),Math.max(.02,p));const w=i===1?160:185;rounded(c,0,-21,w,42,18,item.bg);c.fillStyle=item.bg;c.beginPath();c.moveTo(i===1?w-20:20,16);c.lineTo(i===1?w+4:-4,28);c.lineTo(i===1?w-40:41,16);c.fill();c.textAlign='center';c.textBaseline='middle';c.font='700 19px system-ui,sans-serif';c.fillStyle=item.fg;c.fillText(item.text,w/2,0);c.restore()});
  } else if(id==='reaction-float'){
    fill(c,'#1f2e43');c.fillStyle='#2d415c';c.beginPath();c.arc(W*.23,H*.22,H*.49,0,TAU);c.fill();
    for(let i=0;i<10;i++){const u=frac(t*.34+i*.17),x=W*.84+Math.sin(u*6+i)*H*.13,y=H*.9-u*H*1.1;c.globalAlpha=Math.sin(u*Math.PI);label(c,i%3?'♥':'☺',x,y,24+i%2*11,i%3?C.pink:'#ffb612')}c.globalAlpha=1;
  } else if(id==='confetti-fall'){
    fill(c,'#6856df');for(let i=0;i<76;i++){
      const seed=Math.sin(i*51.17)*43758.5453,x0=frac(seed),y0=frac(seed*13.37),u=frac(y0+t*(.12+(i%5)*.019));
      const x=W*x0+Math.sin(t*1.1+i)*H*.08,y=H*(u*1.4-.2);c.save();c.translate(x,y);c.rotate(t*(i%2?1:-1)+i*.4);c.fillStyle=i%4?C.paper:C.ink;c.fillRect(-4,-6,8+(i%3)*3,12);c.restore();
    }
  } else if(id==='elastic-slide'){
    const s=transitionState(t),color='#2aa9dc';sourceScreen(c,s.from,color);
    if(s.p>0){const q=back(s.p);c.save();c.translate(-W*(1-q),0);sourceScreen(c,s.to,color);c.restore()}
  } else if(id==='line-boil'){
    fill(c,C.ink);const step=Math.floor(t*8),jitter=n=>Math.sin(step*19+n*43)*H*.012;
    const star=(cx,cy,r)=>{c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=(i%2?r*.5:r)+jitter(i),x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath()};
    c.lineWidth=3;c.strokeStyle='#1db59b';star(W*.29,H*.53,H*.28);c.stroke();
    c.strokeStyle=C.paper;c.beginPath();for(let i=0;i<=24;i++){const a=i*TAU/24,rr=H*(.21+.025*Math.sin(a*5+step*.9))+jitter(i+30),x=W*.69+Math.cos(a)*rr,y=H*.55+Math.sin(a)*rr*.7;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.stroke();
  } else if(id==='stop-motion'){
    fill(c,C.paper);const step=Math.floor(t*8),parts=['한','컷','한','컷'];
    parts.forEach((ch,i)=>{const x=W*.27+i*W*.15+jittered(step,i,9),y=H*.5+jittered(step,i+8,7),ang=jittered(step,i+14,.055);c.save();c.translate(x,y);c.rotate(ang);label(c,ch,3,5,69,'#b8b1aa');label(c,ch,0,0,69,i%2?'#e98a0a':C.ink);c.restore()});
  } else if(id==='marching-ants'){
    fill(c,C.paper);const x=W*.35,y=H*.18,w=W*.3,h=H*.64;
    rounded(c,x+25,y+H*.22,68,78,10,'#18a98e');c.fillStyle='#126b5e';c.beginPath();c.arc(x+w-65,y+H*.38,43,0,TAU);c.fill();
    c.strokeStyle=C.ink;c.lineWidth=2;c.setLineDash([9,7]);c.lineDashOffset=-t*24;c.strokeRect(x,y,w,h);c.setLineDash([]);
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){if(row===1&&col===1)continue;const hx=x+col*w/2,hy=y+row*h/2;c.fillStyle=C.paper;c.fillRect(hx-6,hy-6,12,12);c.strokeStyle=C.ink;c.lineWidth=1.5;c.strokeRect(hx-6,hy-6,12,12)}
  } else if(id==='turntable'){
    fill(c,C.ink);const cx=W/2,baseY=H*.76,angle=t*TAU/4,R=H*.39,ry=H*.09,half=H*.18,height=H*.43;
    c.fillStyle='#252b33';c.beginPath();c.ellipse(cx,baseY+15,R+5,ry+4,0,0,TAU);c.fill();
    const plate=c.createLinearGradient(0,baseY-ry,0,baseY+ry);plate.addColorStop(0,'#747982');plate.addColorStop(1,'#41464e');c.fillStyle=plate;c.beginPath();c.ellipse(cx,baseY,R,ry,0,0,TAU);c.fill();
    for(let i=0;i<8;i++){const a=angle+i*TAU/8,x=cx+Math.cos(a)*R*.82,y=baseY+Math.sin(a)*ry*.82;c.fillStyle=i===0?'#ed5275':'#b0b4b8';c.beginPath();c.arc(x,y,i===0?6:3,0,TAU);c.fill()}
    const project=([x,y,z])=>{const xr=x*Math.cos(angle)+z*Math.sin(angle),zr=-x*Math.sin(angle)+z*Math.cos(angle),s=1.13+zr/1100;return [cx+xr*s,baseY-y*s+zr*.26,zr]};
    const sides=[{verts:[[-half,0,half],[half,0,half],[half,height,half],[-half,height,half]],n:[0,0,1],color:'#e95879',logo:true},{verts:[[half,0,-half],[-half,0,-half],[-half,height,-half],[half,height,-half]],n:[0,0,-1],color:'#c6476a'},{verts:[[half,0,half],[half,0,-half],[half,height,-half],[half,height,half]],n:[1,0,0],color:'#aa3f60'},{verts:[[-half,0,-half],[-half,0,half],[-half,height,half],[-half,height,-half]],n:[-1,0,0],color:'#d64c70'}];
    sides.filter(face=>-face.n[0]*Math.sin(angle)+face.n[2]*Math.cos(angle)>.01).sort((a,b)=>{const az=a.verts.reduce((s,v)=>s+project(v)[2],0),bz=b.verts.reduce((s,v)=>s+project(v)[2],0);return az-bz}).forEach(face=>{const pts=face.verts.map(project);c.fillStyle=face.color;c.strokeStyle='#7d354d';c.lineWidth=2;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();if(face.logo){const dot=project([0,height*.53,half+.5]);c.fillStyle=C.paper;c.beginPath();c.arc(dot[0],dot[1],9,0,TAU);c.fill()}});
    const top=[[-half,height,-half],[half,height,-half],[half,height,half],[-half,height,half]].map(project);c.fillStyle='#f7e9e8';c.strokeStyle='#bfaeb3';c.lineWidth=2;c.beginPath();top.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();
    c.strokeStyle='#a7abb0';c.lineWidth=2;c.beginPath();c.ellipse(cx,baseY,R,ry,0,0,Math.PI);c.stroke();
  } else if(id==='ink-splash'){
    fill(c,C.paper);const p=back(seg(t,.25,.65)),cx=W/2,cy=H/2,r=H*.32*Math.max(0,p);
    c.fillStyle=C.pink;c.beginPath();for(let i=0;i<36;i++){const a=i*TAU/36,spike=i%3===0?1.18:.78,rr=r*spike*(1+.07*Math.sin(i*7));const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.fill();
    for(let i=0;i<13;i++){const a=i*TAU/13,d=r*(1.55+.22*Math.sin(i*5)),size=3+(i%4)*3;c.beginPath();c.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,size*Math.max(0,p),0,TAU);c.fill()}
    if(p>.55)label(c,'물감',cx,cy,51,C.white);
  } else if(id==='ransom-collage'){
    fill(c,C.paper);c.fillStyle='#b8b5ad';for(let x=5;x<W*.31;x+=9)for(let y=8;y<H*.48;y+=9){c.globalAlpha=.3;c.fillRect(x,y,2,2)}c.globalAlpha=1;
    const chars=['스','크','랩'],colors=[C.pink,C.ink,'#efc532'],positions=[W*.35,W*.47,W*.59];
    chars.forEach((ch,i)=>{const p=back(seg(t,.25+i*.27,.38));if(p<=0)return;c.save();c.translate(positions[i],H*.56+(1-p)*H*.45);c.rotate((i%2?-.09:.08)*(1-p));c.scale(Math.max(.01,p),Math.max(.01,p));rounded(c,-38,-47,75,88,1,colors[i]);label(c,ch,0,0,60,i===2?C.ink:C.white);c.restore()});
    c.fillStyle=C.ink;for(let i=0;i<32;i++)c.fillRect(W*.57+i*10,H*.82,5,16);
  } else if(id==='paper-cut'){
    fill(c,C.ink);const sheetX=W*.15,sheetY=H*.12,sheetW=W*.7,sheetH=H*.76,cx=W/2,cy=H*.51,word='CUT',font='900 145px system-ui,sans-serif',cut=out(seg(t,.25,1.45)),fall=out(seg(t,1.75,.75));
    rounded(c,sheetX+10,sheetY+8,sheetW,sheetH,14,'#e7a63e');
    const paper=document.createElement('canvas');paper.width=W;paper.height=H;const pc=paper.getContext('2d');pc.fillStyle=C.paper;pc.beginPath();pc.roundRect(sheetX,sheetY,sheetW,sheetH,14);pc.fill();pc.font=font;pc.textAlign='center';pc.textBaseline='middle';const wordW=pc.measureText(word).width;
    pc.save();pc.beginPath();pc.rect(0,0,cx-wordW/2+wordW*cut,H);pc.clip();pc.globalCompositeOperation='destination-out';pc.fillText(word,cx,cy);pc.restore();c.drawImage(paper,0,0);
    if(cut>0){c.save();c.translate(cx+fall*W*.27,cy-fall*H*.28);c.rotate(fall*.2);c.scale(1-fall*.58,1-fall*.58);c.globalAlpha=cut;c.font=font;c.textAlign='center';c.textBaseline='middle';c.fillStyle=C.paper;c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=10+15*fall;c.fillText(word,0,0);c.restore()}
    if(cut>0&&cut<1){c.save();c.beginPath();c.rect(0,0,cx-wordW/2+wordW*cut,H);c.clip();c.font=font;c.textAlign='center';c.textBaseline='middle';c.strokeStyle='#b87332';c.lineWidth=2;c.strokeText(word,cx,cy);c.restore();c.fillStyle='#e7a63e';c.beginPath();c.arc(cx-wordW/2+wordW*cut,cy+H*.29,4,0,TAU);c.fill()}
  } else if(id==='icon-tiles'){
    fill(c,C.ink);const labels=['밤에도','잠금','백업'],symbols=['◐','▢','☁'];
    for(let i=0;i<3;i++){const p=back(seg(t,.2+i*.25,.45));if(p<=0)continue;const x=W*(.18+i*.32),y=H*.5;c.save();c.translate(x,y);c.scale(Math.max(.01,p),Math.max(.01,p));rounded(c,-W*.145,-H*.38,W*.29,H*.76,13,'#20242d');label(c,symbols[i],0,-H*.1,64,'#f1b32c');label(c,labels[i],0,H*.2,24,C.paper);c.restore()}
  } else if(id==='hud-assemble'){
    fill(c,C.ink);const p=out(seg(t,.25,1.4)),cx=W*.5,cy=H*.49,r=H*.35;
    c.strokeStyle='#3ad5e3';c.lineWidth=3;c.beginPath();c.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+TAU*p);c.stroke();
    c.strokeStyle='#dce6e6';c.lineWidth=1;for(let i=0;i<40;i++){const a=i*TAU/40-p*.4,d=r*1.15;c.beginPath();c.moveTo(cx+Math.cos(a)*d,cy+Math.sin(a)*d);c.lineTo(cx+Math.cos(a)*(d+(i%5?5:12))*p,cy+Math.sin(a)*(d+(i%5?5:12))*p);c.stroke()}
    for(let i=0;i<4;i++){const x=W*.08,y=H*(.25+i*.16);rounded(c,x,y,W*.18,5,0,'#4a4f57');rounded(c,x,y,W*.18*p*(.45+.15*(i%3)),5,0,i%2?'#dce6e6':'#3ad5e3')}
    if(p>.45)label(c,'가동',cx,cy,75,C.paper);
    c.textAlign='left';c.textBaseline='middle';c.font='600 14px monospace';c.fillStyle='#b7bdc5';for(let i=0;i<4;i++)c.fillText('0x'+(40960+i*941).toString(16).toUpperCase(),W*.87,H*(.3+i*.15));
  } else if(id==='waterfall-steps'){
    fill(c,C.paper);const values=[-45,18,21,27,14],xs=[W*.13,W*.28,W*.43,W*.58,W*.73],barW=W*.09,scale=1.35,base=H*.38;let running=0;
    for(let i=0;i<values.length;i++){const prev=running,rise=values[i],p=out(seg(t,.2+i*.3,.48));running+=rise*p;
      const y0=base-prev*scale,y1=base-running*scale,top=Math.min(y0,y1),height=Math.abs(y1-y0);
      if(i>0){c.strokeStyle='#959a9f';c.lineWidth=1.5;c.beginPath();c.moveTo(xs[i-1]+barW,y0);c.lineTo(xs[i],y0);c.stroke()}
      if(p>0)rounded(c,xs[i],top,barW,Math.max(height,5),2,i%2?'#2f86e9':C.ink);
    }
  } else if(id==='sparkline-scroll'){
    fill(c,C.ink);const pts=[],count=34,phase=t*.34;
    for(let i=0;i<count;i++){const u=i/(count-1),x=W*(.06+.88*u),y=H*(.51+.22*Math.sin((u+phase)*TAU*2.2)+.09*Math.sin((u+phase)*TAU*5));pts.push([x,y])}
    c.strokeStyle='#13aa92';c.lineWidth=4;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
    const [lastX,lastY]=pts.at(-1);c.fillStyle=C.paper;c.beginPath();c.arc(lastX,lastY,7,0,TAU);c.fill();label(c,(22.6+8*Math.sin(t*.7)).toFixed(1),W*.89,H*.18,30,C.paper);
  } else if(id==='line-chart-draw'){
    fill(c,C.ink);const values=[.76,.63,.69,.48,.53,.31,.39,.21,.27,.13],left=W*.06,right=W*.94,top=H*.15,bottom=H*.82,p=out(seg(t,.2,2.4));
    c.strokeStyle='#176657';c.lineWidth=1;for(let i=0;i<4;i++){const y=mix(top,bottom,i/3);c.beginPath();c.moveTo(left,y);c.lineTo(right,y);c.stroke()}
    c.strokeStyle='#13aa92';c.lineWidth=5;c.lineCap='round';c.lineJoin='round';c.beginPath();
    const point=i=>[mix(left,right,i/(values.length-1)),mix(top,bottom,values[i])];let end=null;
    for(let i=0;i<values.length;i++){const u=i/(values.length-1);if(u>p)break;const [x,y]=point(i);i?c.lineTo(x,y):c.moveTo(x,y);end=[x,y]}
    const segment=p*(values.length-1),whole=Math.floor(segment);if(whole<values.length-1&&p>0){const a=point(whole),b=point(whole+1),q=segment-whole;end=[mix(a[0],b[0],q),mix(a[1],b[1],q)];c.lineTo(...end)}c.stroke();
    if(end){c.fillStyle=C.paper;c.beginPath();c.arc(end[0],end[1],7,0,TAU);c.fill()}
  } else if(id==='dot-globe'){
    fill(c,C.ink);const cx=W/2,cy=H/2,r=H*.37,turn=t*.45;
    c.fillStyle='#124e48';c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();
    for(let lat=-75;lat<=75;lat+=12)for(let lon=0;lon<360;lon+=12){const a=lat*Math.PI/180,b=lon*Math.PI/180+turn,z=Math.cos(a)*Math.cos(b),x=cx+r*Math.cos(a)*Math.sin(b),y=cy-r*Math.sin(a);if(z<-.08)continue;c.globalAlpha=.4+.6*Math.max(0,z);c.fillStyle=C.paper;c.beginPath();c.arc(x,y,1.2+z*.8,0,TAU);c.fill()}c.globalAlpha=1;
    const targets=[[-.3,.18],[.06,-.22],[.23,.04]],p=seg(t,.4,2);for(let i=0;i<3;i++){const q=out(seg(p,i*.3,.28));if(q<=0)continue;const x=cx+targets[i][0]*r,y=cy+targets[i][1]*r;c.strokeStyle='#28c9ab';c.lineWidth=3;c.beginPath();c.moveTo(cx,cy);c.lineTo(mix(cx,x,q),mix(cy,y,q));c.stroke();if(q>.9){c.fillStyle=C.paper;c.beginPath();c.arc(x,y,5,0,TAU);c.fill()}}
  } else if(id==='treemap-split'){
    fill(c,C.ink);const x=W*.08,y=H*.18,w=W*.84,h=H*.64,p=out(seg(t,.25,1.4)),gap=6,leftW=w*.42,rightX=x+leftW+gap,rightW=w-leftW-gap;
    rounded(c,x,y,leftW,h,5,'#6b58df');label(c,'42%',x+leftW*.24,y+H*.18,28,C.ink);
    if(p>0){rounded(c,rightX,y,rightW,h*(.55+.45*(1-p))-gap/2,4,'#a49adb');if(p>.25){rounded(c,rightX,y+h*.55+gap/2,rightW*p,h*.45-gap/2,4,'#453b85')}}
  } else if(id==='ink-bleed'){
    fill(c,C.paper);const p=out(seg(t,.15,1.9)),dry=1-out(seg(p,.56,.44)),xs=[W*.34,W*.45,W*.56,W*.66];
    for(let i=0;i<220;i++){const x=frac(Math.sin(i*12.9898)*43758.5)*W,y=frac(Math.sin(i*78.233)*24634.6)*H;c.fillStyle='#6a625b';c.globalAlpha=.045;c.fillRect(x,y,1,1)}c.globalAlpha=1;
    xs.forEach((x,i)=>{const q=out(seg(p,i*.08,.67));if(q<=0||dry<=0)return;const y=H*.5+Math.sin(i*2.1)*H*.04,r=H*(.015+.24*q);
      c.fillStyle='#21252a';c.globalAlpha=.28*dry;c.beginPath();for(let j=0;j<48;j++){const a=j*TAU/48,rough=1+.13*Math.sin(a*7+i*3)+.1*Math.sin(a*13-i),rr=r*rough;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.82;j?c.lineTo(px,py):c.moveTo(px,py)}c.closePath();c.fill();
      c.globalAlpha=.17*dry;for(let j=0;j<34;j++){const a=j*TAU/34+i,rr=r*(.8+.35*frac(Math.sin(j*31+i*7)*9271)),px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.83;c.beginPath();c.arc(px,py,1.1+(j%3)*.7,0,TAU);c.fill()}c.globalAlpha=1;
    });
    const textAlpha=out(seg(p,.27,.64));if(textAlpha>0){c.globalAlpha=textAlpha;['번','지','다'].forEach((ch,i)=>label(c,ch,W*(.37+i*.13),H/2,H*.49,i===1?'#1c708d':C.ink));c.globalAlpha=1}
  } else if(id==='blur-focus'){
    fill(c,C.ink);const p=out(seg(t,.2,2)),blur=(1-p)*14;c.save();c.filter='blur('+blur.toFixed(1)+'px)';c.globalAlpha=.4+.6*p;label(c,'또렷하게',W/2,H/2,H*.34,C.paper);c.restore();
  } else if(id==='text-mosaic'){
    fill(c,C.ink);const cols=4,rows=2,margin=H*.055,gap=10,cw=(W-2*margin-gap*3)/4,ch=(H-2*margin-gap)/2;
    const fonts=['900 63px "Baekmuk Headline"','400 63px "Baekmuk Batang"','700 61px "SamsungOneKoreanOTF"','400 62px "UnGungseo"','700 62px "NanumGothic"','400 60px "UnTaza"','400 61px "UnPen"','700 63px "UnBatang"'];
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const i=row*cols+col,p=out(seg(t,.15+i*.17,.37)),x=margin+col*(cw+gap),y=margin+row*(ch+gap);
      rounded(c,x,y,cw,ch,10,p>.82&&i%3===0?'#6856df':'#292646');
      if(p<.08)continue;c.save();c.globalAlpha=p;c.translate(x+cw/2,y+ch/2);c.rotate((i%4-1.5)*.04);c.fillStyle=i%3===0?C.ink:C.paper;c.textAlign='center';c.textBaseline='middle';c.font=fonts[i];c.fillText('글',0,0);c.restore();
    }
  } else if(id==='mosaic-flash'){
    const s=transitionState(t),accent='#2aa9dc';sourceScreen(c,s.from,accent);
    const cols=5,rows=3,cw=W/cols,ch=H/rows;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const i=row*cols+col,delay=((i*7)%15)/15*.45,q=out(seg(s.p,delay,.5));if(q<=0)continue;
      c.save();c.beginPath();c.rect(col*cw,row*ch,cw+.5,ch+.5);c.clip();c.globalAlpha=q;sourceScreen(c,s.to,accent);c.restore();
    }
  } else if(id==='text-flag'){
    fill(c,C.ink);const left=W*.15,right=W*.87,top=H*.25,bottom=H*.78,flag=document.createElement('canvas');flag.width=W;flag.height=H;const f=flag.getContext('2d');
    f.fillStyle='#e99a0a';f.fillRect(left,top,right-left,bottom-top);label(f,'펄럭펄럭',(left+right)/2,(top+bottom)/2,68,C.ink);
    c.strokeStyle=C.paper;c.lineWidth=4;c.beginPath();c.moveTo(left,top-H*.13);c.lineTo(left,bottom+H*.08);c.stroke();
    for(let x=Math.floor(left);x<right;x+=2){const sw=Math.min(2,right-x),phase=(x-left)/(right-left)*TAU*1.2-t*1.5,shift=H*.05*Math.sin(phase);c.drawImage(flag,x,top,sw,bottom-top,x,top+shift,sw+1,bottom-top)}
  } else if(id==='underwater-warp'){
    const grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#61cbd4');grad.addColorStop(.2,'#2589a9');grad.addColorStop(.64,'#125a80');grad.addColorStop(1,'#073349');fill(c,grad);
    // Refracted daylight: the edges sway and converge toward the surface.
    for(let i=0;i<8;i++){
      const x=W*(i+.32)/8+H*.09*Math.sin(t*.52+i*2.17),spread=H*(.13+.035*Math.sin(t*.7+i));
      const ray=c.createLinearGradient(x-spread,0,x+spread,0);ray.addColorStop(0,'#d9ffef00');ray.addColorStop(.5,'#d9ffef21');ray.addColorStop(1,'#d9ffef00');
      c.fillStyle=ray;c.beginPath();c.moveTo(x-spread*.26,0);c.lineTo(x+spread*.26,0);
      for(let y=H;y>=0;y-=12)c.lineTo(x+spread*(.26+y/H*.72)+H*.035*Math.sin(y/H*5+t*.8+i),y);
      for(let y=0;y<=H;y+=12)c.lineTo(x-spread*(.26+y/H*.72)+H*.035*Math.sin(y/H*5+t*.8+i),y);
      c.closePath();c.fill();
    }
    // Moving caustics make the background read as water instead of sliding stripes.
    c.save();c.globalCompositeOperation='screen';c.lineCap='round';
    for(let row=0;row<5;row++)for(let col=-1;col<13;col++){
      const x=col*W/11+H*.055*Math.sin(t*.8+row*.91+col*.54),y=H*(.1+row*.19)+H*.035*Math.cos(t*.63+col*.7);
      const rx=W*.06*(1+.18*Math.sin(t+row+col)),ry=H*.035*(1+.2*Math.cos(t*.76+col));
      c.strokeStyle=`rgba(128,244,236,${.11+.07*(1-row/5)})`;c.lineWidth=1.3+1.3*(1-row/5);
      c.beginPath();c.moveTo(x-rx,y);c.bezierCurveTo(x-rx*.4,y-ry,x+rx*.45,y-ry*.9,x+rx,y);
      c.bezierCurveTo(x+rx*.4,y+ry,x-rx*.45,y+ry*.8,x-rx,y);c.stroke();
    }c.restore();
    c.strokeStyle='#b8fff16a';c.lineWidth=2;c.beginPath();for(let x=0;x<=W;x+=5){const y=H*.055+H*.017*Math.sin(x/W*TAU*2-t*.85)+H*.009*Math.sin(x/W*TAU*5+t*.65);x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
    for(let i=0;i<17;i++){const x=W*frac(i*.618+.015*Math.sin(t*.3+i)),y=H*frac(i*.317-t*(.016+i%3*.008));c.strokeStyle=`rgba(190,255,248,${.19+i%4*.06})`;c.lineWidth=1;c.beginPath();c.arc(x,y,1.4+i%4,0,TAU);c.stroke()}
    const source=document.createElement('canvas');source.width=W;source.height=H;const s=source.getContext('2d');label(s,'물속에서',W/2,H/2,79,C.paper);
    const vertical=document.createElement('canvas');vertical.width=W;vertical.height=H;const v=vertical.getContext('2d');
    for(let x=0;x<W;x+=2){const yShift=H*.045*Math.sin(x/W*TAU*2.3-t*1.7)+H*.018*Math.sin(x/W*TAU*4.5+t*.9);v.drawImage(source,x,0,2,H,x,yShift,2.3,H)}
    for(let y=0;y<H;y+=2){const xShift=H*.02*Math.sin(y/H*TAU*1.6+t*1.2);c.drawImage(vertical,0,y,W,2,xShift,y,W,2.3)}
  } else if(id==='text-fan'){
    fill(c,C.ink);const cx=W/2,cy=H*.88,p=out(seg(t,.2,1.1)),chars=['부','채','처','럼','펼','쳐'];
    chars.forEach((ch,i)=>{const angle=(i-2.5)*.39*p,r=H*(.38+.18*p),x=cx+Math.sin(angle)*r,y=cy-Math.cos(angle)*r;c.save();c.translate(x,y);c.rotate(angle*.22);c.globalAlpha=.55+.45*p;label(c,ch,0,0,47,i%2?'#9f8cff':C.paper);c.restore()});
    c.strokeStyle='#6655c944';c.lineWidth=2;c.beginPath();c.arc(cx,cy,H*.56,Math.PI*1.2,Math.PI*1.8);c.stroke();
  } else if(id==='accordion-fold'){
    const p=out(seg(t,.3,1.3)),scene=document.createElement('canvas');scene.width=W;scene.height=H;const o=scene.getContext('2d');fill(o,C.paper);
    o.fillStyle='#f04d35';o.beginPath();o.arc(W*.78,H*.36,H*.14,0,TAU);o.fill();o.fillStyle='#b88379';o.beginPath();o.moveTo(0,H*.7);o.quadraticCurveTo(W*.3,H*.4,W*.6,H*.85);o.lineTo(W,H);o.lineTo(0,H);o.fill();o.fillStyle='#91392f';o.beginPath();o.moveTo(W*.3,H);o.quadraticCurveTo(W*.62,H*.55,W,H*.75);o.lineTo(W,H);o.fill();
    fill(c,C.ink);const panels=6,sw=W/panels,totalWidth=mix(W*.12,W,p),startX=(W-totalWidth)/2;let x=startX;
    for(let i=0;i<panels;i++){const weight=1+(i%2?-.36:.36)*(1-p),visible=totalWidth*weight/panels;
      c.drawImage(scene,i*sw,0,sw,H,x,0,visible+.8,H);
      const shade=c.createLinearGradient(x,0,x+visible,0),alpha=(1-p)*.42;
      shade.addColorStop(0,i%2?`rgba(0,0,0,${alpha})`:'rgba(0,0,0,0)');shade.addColorStop(1,i%2?'rgba(0,0,0,0)':`rgba(0,0,0,${alpha})`);
      c.fillStyle=shade;c.fillRect(x,0,visible,H);if(i>0){c.strokeStyle=`rgba(40,35,32,${(1-p)*.55})`;c.lineWidth=2;c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke()}x+=visible;
    }
  } else if(id==='time-lapse'){
    const p=frac(t/4),night=out(seg(p,.38,.27)),sky=c.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,`rgb(${Math.round(mix(237,16,night))},${Math.round(mix(145,21,night))},${Math.round(mix(66,36,night))})`);
    sky.addColorStop(1,`rgb(${Math.round(mix(243,38,night))},${Math.round(mix(195,53,night))},${Math.round(mix(126,80,night))})`);fill(c,sky);
    const x=mix(W*.15,W*.82,p),y=H*(.73-.5*Math.sin(p*Math.PI));c.shadowColor=night>.5?'#ffe7b8':'#fff0aa';c.shadowBlur=24;c.fillStyle=night>.5?'#ffe9ac':'#fff0b1';c.beginPath();c.arc(x,y,H*.1,0,TAU);c.fill();c.shadowBlur=0;
  } else if(id==='speed-ramp'){
    fill(c,C.ink);const u=frac(t/4),p=u<.25?u*.45:u<.62?.1125+(u-.25)*2.05:.871+(u-.62)*.34;
    rounded(c,mix(W*.1,W*.88,clamp(p))-H*.12,H*.38,H*.24,H*.24,13,'#4fb8e8');
  } else if(id==='squeeze-swap'){
    fill(c,C.ink);const u=frac(t/4),q=u<.5?ease(u*2):ease((u-.5)*2),sx=u<.5?1-q*.92:.08+q*.92;
    c.save();c.translate(W/2,H/2);c.scale(sx,1+.2*(1-sx));label(c,u<.5?'말랑':'탱탱',0,0,H*.42,C.pink);c.restore();
  } else if(id==='word-morph'){
    fill(c,C.ink);const p=ease(seg(t,.35,1.65)),a=glyphField('아이디어'),b=glyphField('완성'),w=400,h=127;
    const off=document.createElement('canvas');off.width=w;off.height=h;const o=off.getContext('2d'),image=o.createImageData(w,h);
    const scaleA=1-.5*p,scaleB=2-p;
    for(let i=0;i<a.length;i++){const x=i%w,y=Math.floor(i/w),ax=Math.round(w/2+(x-w/2)/scaleA),bx=Math.round(w/2+(x-w/2)/scaleB);
      const da=ax>=0&&ax<w?a[y*w+ax]*scaleA:100,db=bx>=0&&bx<w?b[y*w+bx]*scaleB:100,d=mix(da,db,p);
      const alpha=Math.round(clamp(.5-d/3)*255),j=i*4;image.data[j]=243;image.data[j+1]=239;image.data[j+2]=232;image.data[j+3]=alpha}
    o.putImageData(image,0,0);c.imageSmoothingEnabled=true;c.drawImage(off,0,0,W,H);
  } else if(id==='text-corridor'){
    fill(c,C.ink);const vx=W/2,hy=H*.6;c.strokeStyle='#087d6e';c.lineWidth=1;
    for(let i=-9;i<=9;i++){c.beginPath();c.moveTo(vx,hy);c.lineTo(vx+i*W*.13,H);c.stroke()}
    for(let i=0;i<12;i++){const depth=Math.pow(frac(i/12+t*.18),2),y=hy+depth*(H-hy);c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}
    for(let side of [-1,1])for(let i=0;i<6;i++){const q=frac(i/6+t*.14),scale=.25+q*1.4,x=vx+side*(H*.08+q*W*.43),y=hy-q*H*.18;c.save();c.translate(x,y);c.scale(scale,scale);label(c,'나아가',0,0,31,i%2?'#10a78d':C.paper);c.restore()}
  } else if(id==='split-invert'){
    fill(c,C.paper);label(c,'반전',W/2,H/2,H*.44,C.ink);const phase=t%4,p=phase<.35?0:phase<1.5?ease(seg(phase,.35,1.15)):phase<2?1:phase<3.3?1-ease(seg(phase,2,1.3)):0,boundary=mix(W+H*.7,-H*1.4,p);
    if(p>0){c.save();c.beginPath();c.moveTo(boundary,0);c.lineTo(W,0);c.lineTo(W,H);c.lineTo(boundary+H*.7,H);c.closePath();c.clip();fill(c,C.ink);label(c,'반전',W/2,H/2,H*.44,C.paper);c.restore()}
  } else if(id==='diagonal-split'){
    const s=transitionState(t),accent='#2aa9dc',p=out(s.p),boundary=-H*.65+(W+H*.65)*p;sourceScreen(c,s.from,accent);
    if(p>0){c.save();c.beginPath();c.moveTo(-H*.65,0);c.lineTo(boundary,0);c.lineTo(boundary+H*.65,H);c.lineTo(0,H);c.closePath();c.clip();sourceScreen(c,s.to,accent);c.restore()}
  } else if(id==='text-sandwich'){
    fill(c,C.ink);const phase=t%4,gap=phase<.4?0:phase<1.2?out(seg(phase,.4,.8)):phase<2.1?1:phase<3?1-out(seg(phase,2.1,.9)):0;
    const cx=W/2,halfGap=52*gap;c.font='800 75px system-ui,sans-serif';c.textBaseline='middle';c.fillStyle=C.paper;
    c.textAlign='right';c.fillText('MO',cx-10-halfGap,H/2);c.textAlign='left';c.fillText('TION',cx+10+halfGap,H/2);
    if(gap>.03){c.save();c.globalAlpha=gap;rounded(c,cx-32,H/2-35,64,70,13,'#e47a3b');c.restore()}
  } else if(id==='text-cylinder'){
    fill(c,C.paper);const words=['간','다','계','속'],cx=W/2;
    for(let col=0;col<4;col++){const x=cx+(col-1.5)*W*.13,phase=t*(col%2?-.7:.7)+col*.45;
      for(let row=-2;row<=2;row++){const z=row*.8+phase,cy=H/2+Math.sin(z)*H*.35,scale=.35+.65*Math.max(0,Math.cos(z));c.save();c.globalAlpha=.25+.75*scale;c.translate(x,cy);c.scale(scale,scale);label(c,words[(row+col+12)%4],0,0,61,C.ink);c.restore()}
    }c.globalAlpha=1;
  } else if(id==='ring-text'){
    fill(c,C.ink);c.save();c.translate(W/2,H/2);const glyphs=['돌','아','가','는','글','자'];
    for(let ring=0;ring<5;ring++){const r=H*(.12+ring*.16),count=8+ring*5,spin=t*(ring%2?.25:-.19);
      for(let i=0;i<count;i++){const a=i*TAU/count+spin,x=r*Math.cos(a),y=r*Math.sin(a);c.save();c.translate(x,y);c.rotate(a+Math.PI/2);label(c,glyphs[(i+ring)%glyphs.length],0,0,Math.max(15,23+ring*3),i%3?C.paper:'#19af9a');c.restore()}
    }c.restore();
  } else if(id==='network-pulse'){
    fill(c,C.ink);const nodes=[];for(let row=0;row<5;row++)for(let col=0;col<15;col++)nodes.push([W*(col/14)+Math.sin(row*17+col*3)*H*.035,H*(.16+row*.17)+Math.cos(col*7+row*2)*H*.035]);
    c.strokeStyle='#177f73';c.lineWidth=1.4;for(let row=0;row<5;row++)for(let col=0;col<14;col++){const a=nodes[row*15+col],b=nodes[row*15+col+1];c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();if(row<4&&col%2===0){const d=nodes[(row+1)*15+col+(col%3===0?1:0)];c.beginPath();c.moveTo(...a);c.lineTo(...d);c.stroke()}}
    nodes.forEach(([x,y],i)=>{c.fillStyle=i%19===0?C.paper:'#168777';c.beginPath();c.arc(x,y,i%19===0?6:3,0,TAU);c.fill()});
    for(let i=0;i<26;i++){const a=nodes[(i*11)%nodes.length],b=nodes[(i*11+1)%nodes.length],p=frac(t*.28+i*.137),x=mix(a[0],b[0],p),y=mix(a[1],b[1],p);c.fillStyle='#6be1cf';c.beginPath();c.arc(x,y,3.5,0,TAU);c.fill()}
  } else if(id==='branch-flow'){
    fill(c,C.ink);const p=out(seg(t,.35,1.7)),cx=W*.2,cy=H*.5;
    c.strokeStyle='#36cfe2';c.lineWidth=2;c.beginPath();c.moveTo(cx,cy-42);c.lineTo(cx+58,cy);c.lineTo(cx,cy+42);c.lineTo(cx-58,cy);c.closePath();c.stroke();label(c,'조건?',cx,cy,24,C.paper);
    const targets=[{x:W*.62,y:H*.27,text:'바로 시작'},{x:W*.62,y:H*.72,text:'다시 보기'}];
    targets.forEach((v,i)=>{const q=out(seg(p,i*.18,.52));if(q<=0)return;const start=cx+58,mid=W*.43,ty=v.y;c.strokeStyle='#b7c1c4';c.lineWidth=2;c.beginPath();c.moveTo(start,cy);c.lineTo(mix(start,mid,q),cy);if(q>.5){const r=(q-.5)*2;c.lineTo(mid,mix(cy,ty,r));c.lineTo(mix(mid,v.x,r),ty)}c.stroke();
      if(q>.88){rounded(c,v.x,ty-29,W*.26,58,13,'#292d37');c.strokeStyle='#9da8b3';c.strokeRect(v.x,ty-29,W*.26,58);label(c,v.text,v.x+W*.13,ty,25,C.paper)}
      label(c,i?'아니오':'예',W*.38,ty-H*.09,16,'#97a6ad');
    });
  } else if(id==='subscribe-button'){
    fill(c,'#281f22');const p=out(seg(t,.48,.38)),confirm=out(seg(t,1.48,.42)),x=W*.43,y=H*.5,w=mix(114,172,confirm);
    c.fillStyle='#433033';c.beginPath();c.arc(W*.18,H*.25,95,0,TAU);c.arc(W*.84,H*.76,73,0,TAU);c.fill();
    c.save();c.translate(x,y);const bounce=1+.13*Math.sin(p*Math.PI)*Math.exp(-p*2);c.scale(bounce,1/bounce);rounded(c,-w/2,-25,w,50,25,confirm>.5?'#f4ece6':'#f34d31');label(c,confirm>.5?'구독 중':'구독',0,0,24,confirm>.5?'#283032':C.white);c.restore();
    if(confirm>.45){const bellX=x+w*.7+27,wiggle=Math.sin(t*19)*(1-confirm)*.2;c.save();c.translate(bellX,y);c.rotate(wiggle);c.strokeStyle='#f3eae3';c.lineWidth=3;c.beginPath();c.arc(0,-2,12,Math.PI*1.1,Math.PI*1.9);c.lineTo(15,13);c.lineTo(-15,13);c.closePath();c.stroke();c.beginPath();c.arc(0,17,3,0,TAU);c.fillStyle='#f3eae3';c.fill();c.restore()}
  } else if(id==='follow-pill'){
    fill(c,'#281f22');const p=out(seg(t,.35,.65)),changed=out(seg(t,1.4,.42));
    c.fillStyle='#443035';c.beginPath();c.arc(W*.2,H*.24,95,0,TAU);c.arc(W*.83,H*.78,66,0,TAU);c.fill();
    c.fillStyle='#f15135';c.beginPath();c.arc(W*.19,H/2,29,0,TAU);c.fill();c.fillStyle=C.white;c.beginPath();c.arc(W*.19,H/2-8,9,0,TAU);c.fill();c.beginPath();c.ellipse(W*.19,H/2+14,16,8,0,Math.PI,TAU);c.fill();
    c.textAlign='left';c.textBaseline='middle';c.font='700 23px system-ui,sans-serif';c.fillText('mapo.daily',W*.24,H*.47);c.font='15px system-ui,sans-serif';c.fillStyle='#bcb5b5';c.fillText('팔로워 1.2만',W*.24,H*.61);
    const buttonX=mix(W+70,W*.64,p),bw=mix(96,132,changed);rounded(c,buttonX,H/2-24,bw,48,24,changed>.5?'#e9e4df':'#f15135');label(c,changed>.5?'✓ 팔로잉':'팔로우',buttonX+bw/2,H/2,20,changed>.5?'#25292c':C.white);
  } else if(id==='swipe-up-hint'){
    fill(c,'#2b2227');const q=frac(t/1.7),rise=H*.13*q;
    for(let i=0;i<2;i++){const y=H*.45+i*H*.1-rise;c.globalAlpha=(1-q)*(.9-i*.24);c.strokeStyle=C.paper;c.lineWidth=5;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(W/2-19,y+11);c.lineTo(W/2,y-6);c.lineTo(W/2+19,y+11);c.stroke()}c.globalAlpha=1;
    label(c,'위로 밀어서 더 보기',W/2,H*.83,20,C.paper);
  } else if(id==='arrow-point'){
    fill(c,'#292523');const p=out(seg(t,.3,1.35)),start=[W*.2,H*.43],control=[W*.43,H*.02],end=[W*.66,H*.59];
    rounded(c,W*.69,H*.55,106,46,10,'#5d5955');label(c,'다음',W*.69+53,H*.55+23,19,C.paper);
    const point=u=>[(1-u)*(1-u)*start[0]+2*(1-u)*u*control[0]+u*u*end[0],(1-u)*(1-u)*start[1]+2*(1-u)*u*control[1]+u*u*end[1]];
    c.strokeStyle='#ffcf38';c.lineWidth=6;c.lineCap='round';c.lineJoin='round';c.beginPath();const steps=80;for(let i=0;i<=steps;i++){const u=Math.min(p,i/steps),[x,y]=point(u);i?c.lineTo(x,y):c.moveTo(x,y);if(u>=p)break}c.stroke();
    const head=out(seg(t,1.65,.18));if(head>0){const dx=end[0]-control[0],dy=end[1]-control[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,nx=-uy,ny=ux,wing=11*head,back=22*head;
      c.beginPath();c.moveTo(end[0]-ux*back+nx*wing,end[1]-uy*back+ny*wing);c.lineTo(end[0],end[1]);c.lineTo(end[0]-ux*back-nx*wing,end[1]-uy*back-ny*wing);c.stroke()}
  } else if(id==='location-pin'){
    fill(c,'#2b2826');const impact=out(seg(t,.25,.62)),settle=out(seg(t,.87,.42)),px=W*.31,ground=H*.77;
    c.fillStyle='#74644744';c.beginPath();c.ellipse(px,ground,31+impact*9,5,0,0,TAU);c.fill();
    const y=mix(-H*.25,ground-53,impact)-Math.sin(settle*Math.PI)*H*.035*(1-settle);c.save();c.translate(px,y);c.scale(1+.17*Math.sin(impact*Math.PI),1-.16*Math.sin(impact*Math.PI));c.fillStyle='#f4a10b';c.beginPath();c.moveTo(0,30);c.bezierCurveTo(-31,-8,-24,-31,0,-31);c.bezierCurveTo(24,-31,31,-8,0,30);c.fill();c.fillStyle=C.paper;c.beginPath();c.arc(0,-9,9,0,TAU);c.fill();c.restore();
    const tag=out(seg(t,1.25,.55));if(tag>0){c.globalAlpha=tag;rounded(c,W*.4,H*.45,224*tag,58,16,'#e9e4db');if(tag>.5)label(c,'성수동 카페',W*.4+112,H*.45+29,22,C.ink);c.globalAlpha=1}
  } else if(id==='scramble-decode'){
    fill(c,C.ink);const word=[...'정답을 찾다'],symbols=[...'ㅃㅉㄲㄴㅁㅅㅈㅊㅎㄹㅂㅍ'],gap=13;c.font='800 63px system-ui,sans-serif';const widths=word.map(ch=>Math.max(48,c.measureText(ch).width)),total=widths.reduce((a,b)=>a+b,0)+gap*(word.length-1);let cursor=(W-total)/2;
    word.forEach((ch,i)=>{const p=out(seg(t,.22+i*.17,.33)),x=cursor+widths[i]/2,y=H/2;cursor+=widths[i]+gap;
      if(p<.98){const step=Math.floor(t*14),pick=symbols[Math.abs((step*7+i*11)%symbols.length)];label(c,pick,x,y,63,i%2?C.violet:C.paper)}else label(c,ch,x,y,63,i%2?C.violet:C.paper);
      if(p>.9&&ch!==' '){c.fillStyle=i%2?'#6a50cb':'#efeee9';c.fillRect(x-widths[i]*.32,H*.78,widths[i]*.64,2)}});
  } else if(id==='reply-thread'){
    fill(c,'#203045');const messages=[['이거 어디서 샀어요?',W*.15,H*.23],['성수 매장에서요!',W*.27,H*.48],['고마워요 🙌',W*.38,H*.73]];
    messages.forEach(([msg,x,y],i)=>{const p=out(seg(t,.3+i*.62,.5));if(!p)return;const lineY=y+H*.035;c.font='600 17px system-ui,sans-serif';const bubbleWidth=Math.min(W-x+10,c.measureText(msg).width+58);
      if(i){const prev=messages[i-1];c.strokeStyle='#5291bb';c.lineWidth=2;c.beginPath();c.moveTo(prev[1]+8,prev[2]+H*.075);c.lineTo(prev[1]+8,lineY);c.lineTo(x-11,lineY);c.stroke()}
      c.save();c.globalAlpha=p;c.translate(0,(1-p)*H*.09);rounded(c,x-15,y-15,bubbleWidth,40,18,i%2?'#395676':'#2e4867');c.fillStyle='#48a0ed';c.beginPath();c.arc(x+5,y+5,10,0,TAU);c.fill();c.textAlign='left';c.textBaseline='middle';c.font='600 17px system-ui,sans-serif';c.fillStyle=C.paper;c.fillText(msg,x+23,y+5);c.restore()});
  } else if(id==='comment-rise'){
    fill(c,'#203045');const comments=[['j.y','완전 멋져요'],['momo','어디에서 샀어요?'],['soo','저도 궁금해요'],['ari','사진 더 보여줘요']];
    const step=Math.max(0,(t-.2)/.85),count=Math.min(comments.length,Math.floor(step)+1);
    for(let i=0;i<count;i++){const [name,body]=comments[i],age=count-1-i,appear=age===0?out(seg(t,.2+i*.85,.35)):1,y=H*.78-age*H*.22+H*.15*(1-appear);
      const bx=W*.12,avatarX=bx+25,nameX=bx+49;c.font='700 18px system-ui,sans-serif';const nameWidth=c.measureText(name).width;c.font='16px system-ui,sans-serif';const bodyWidth=c.measureText(body).width,bodyX=nameX+nameWidth+20,bubbleWidth=Math.min(W-bx-20,bodyX+bodyWidth-bx+22);
      c.save();c.globalAlpha=appear*(1-age*.13);rounded(c,bx,y-19,bubbleWidth,38,19,'#2e4867');c.fillStyle=i%2?'#52a8ec':'#f0694e';c.beginPath();c.arc(avatarX,y,11,0,TAU);c.fill();c.font='700 18px system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillStyle=C.paper;c.fillText(name,nameX,y);c.font='16px system-ui,sans-serif';c.fillText(body,bodyX,y);c.restore()}
  } else if(id==='hex-grid'){
    fill(c,'#116d66');const side=H*.18,dx=side*1.5,dy=Math.sqrt(3)*side,phase=t%5;
    for(let col=-1;col<W/dx+2;col++)for(let row=-1;row<H/dy+2;row++){
      const x=col*dx,y=row*dy+(col%2?dy/2:0),random=frac(Math.sin(col*127.1+row*311.7)*43758.5453),delay=.2+random*.85,q=phase<2.55?out(seg(phase,delay,.52)):1-out(seg(phase,2.65+delay,.52)),flip=Math.max(.02,Math.abs(Math.cos(Math.PI*q))),back=q>.5;
      c.save();c.translate(x,y);c.scale(flip,1);c.fillStyle=back?'#0c7773':['#5ebfa8','#3fae9b','#8bcbb8','#23a58f'][(Math.abs(col*7+row*11))%4];c.strokeStyle='#116d66';c.lineWidth=5;c.beginPath();for(let k=0;k<6;k++){const a=TAU*k/6;k?c.lineTo(side*Math.cos(a),side*Math.sin(a)):c.moveTo(side*Math.cos(a),side*Math.sin(a))}c.closePath();c.fill();c.stroke();c.restore();
    }
  } else if(id==='eclipse-circle'){
    fill(c,'#f74b31');const x=W/2,y=H/2,r=H*.32,phase=t*.7,dx=H*.045*Math.cos(phase),dy=H*.035*Math.sin(phase);
    c.fillStyle='#f0ece5';c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.strokeStyle=C.ink;c.lineWidth=4;c.beginPath();c.arc(x+dx,y+dy,r,0,TAU);c.stroke();
    c.fillStyle=`rgba(247,75,49,${.15+.12*Math.sin(phase)})`;c.beginPath();c.arc(x+dx*.45,y+dy*.45,r*.92,0,TAU);c.fill();
  } else if(id==='karaoke-ball'){
    fill(c,C.ink);const chars=[...'같이불러요'],positions=[W*.27,W*.35,W*.51,W*.59,W*.67],phase=frac(t/4)*chars.length;
    chars.forEach((ch,i)=>label(c,ch,positions[i],H*.56,55,i<phase?C.pink:'#706c70'));
    const index=Math.min(chars.length-1,Math.floor(phase)),local=frac(phase),next=positions[Math.min(index+1,positions.length-1)],ballX=mix(positions[index],next,local),impactY=H*.56-55*.58-H*.035,ballY=impactY-H*.2*Math.sin(local*Math.PI);
    c.fillStyle=C.paper;c.beginPath();c.arc(ballX,ballY,H*.035,0,TAU);c.fill();
  } else if(id==='highlighter'){
    fill(c,'#f34c31');const x=W*.28,y=H*.27,w=W*.44,h=H*.47,p=out(seg(t,.3,1.35));rounded(c,x,y,w,h,0,C.paper);
    label(c,'말의 힘',W/2,H/2,64,C.ink);
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#f9a52b88';c.fillRect(x+W*.02,H*.35,(w-W*.04)*p,H*.31);if(p>0&&p<.995){c.fillStyle='#e97d1e';c.fillRect(x+W*.02+(w-W*.04)*p-6,H*.35,6,H*.31)}c.restore();
  } else if(id==='outline-fill'){
    fill(c,C.ink);const rows=[['집중모드',H*.25],['집중모드',H*.52],['집중모드',H*.79]];
    rows.forEach(([copy,y],i)=>{const x=W*.16,p=out(seg(t,.25+i*.36,.9));c.font='800 68px system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';c.lineWidth=2.5;c.strokeStyle='#ef4c34';c.strokeText(copy,x,y);const width=c.measureText(copy).width;c.save();c.beginPath();c.rect(x,y-48,width*p,96);c.clip();c.fillStyle='#ef4c34';c.fillText(copy,x,y);c.restore()});
  } else if(id==='punch-zoom'){
    fill(c,C.ink);const p=out(seg(t,.2,.65)),hit=seg(t,.85,.45),scale=mix(.12,1.13,p)-.13*out(hit),shake=hit>0&&hit<1?Math.sin(hit*30)*H*.023*(1-hit):0;
    c.save();c.translate(W/2+shake,H/2);c.scale(scale,scale);label(c,'돌파',0,0,109,C.paper);c.restore();
    if(hit>0&&hit<1){c.strokeStyle=`rgba(243,239,232,${1-hit})`;c.lineWidth=2;c.beginPath();c.arc(W/2,H/2,H*.33+hit*H*.22,0,TAU);c.stroke()}
  } else if(id==='text-zoom-through'){
    fill(c,C.paper);const p=out(seg(t,.25,1.6)),first=out(seg(p,0,.6)),second=out(seg(p,.48,.52));
    c.save();c.translate(W/2,H/2);c.scale(mix(.65,8,first),mix(.65,8,first));c.globalAlpha=1-out(seg(p,.45,.28));label(c,'하나',0,0,90,C.pink);c.restore();
    if(second>0){c.save();c.translate(W/2,H/2);const s=mix(.06,1,second);c.scale(s,s);c.globalAlpha=second;label(c,'다음',0,0,94,C.ink);c.restore()}
  } else if(id==='headline-swap'){
    fill(c,'#6657df');const stripY=H*.3,stripH=H*.4;rounded(c,0,stripY,W,stripH,0,C.ink);rounded(c,0,stripY,145,stripH,0,C.paper);label(c,'속보',72,stripY+stripH/2,41,C.ink);
    c.save();c.beginPath();c.rect(155,stripY,W-155,stripH);c.clip();const p=out(seg(t,.55,.55)),x=W*.25,y=stripY+stripH/2;c.save();c.translate(-p*W*.8,0);label(c,'신제품 출시',x+W*.14,y,48,C.paper);c.restore();if(p>.4){c.globalAlpha=out(seg(p,.4,.45));label(c,'오늘 공개',x+W*.14+(1-p)*W*.7,y,48,C.paper)}c.restore();
  } else if(id==='iso-build'){
    fill(c,C.ink);const cx=W/2,baseY=H*.73;c.fillStyle='#45474c';c.beginPath();c.moveTo(cx,baseY-H*.16);c.lineTo(cx+H*.3,baseY);c.lineTo(cx,baseY+H*.16);c.lineTo(cx-H*.3,baseY);c.closePath();c.fill();
    for(let i=0;i<4;i++){const p=out(seg(t,.25+i*.46,.45));if(p<=0)continue;const targetY=baseY-i*H*.16,y=mix(-H*.35,targetY,p)-H*.04*Math.sin(Math.PI*p);isoCube(c,cx,y,H*.13,H*.12,'#ed5a78','#b52e54','#7c2343')}
  } else if(id==='isometric-grid'){
    fill(c,C.ink);const tw=24,th=tw*.47,cx=W/2,cy=H*.55;
    const grid=(i,j)=>[cx+(i-j)*tw,cy+(i+j)*th],diamond=(x,y)=>{c.beginPath();c.moveTo(x,y-th);c.lineTo(x+tw,y);c.lineTo(x,y+th);c.lineTo(x-tw,y);c.closePath();c.stroke()};
    c.strokeStyle='#596166';c.lineWidth=1;
    for(let i=-13;i<=13;i++)for(let j=-13;j<=13;j++){const [x,y]=grid(i,j);if(x<-tw||x>W+tw||y<-th||y>H+th)continue;diamond(x,y)}
    const glyph=['01110','10001','10001','11111','10001','10001','10001'],blocks=[];
    glyph.forEach((line,row)=>[...line].forEach((value,col)=>{if(value!=='1')return;const i=row-3+col-2,j=row-3-(col-2),[x,y]=grid(i,j);blocks.push({x,y,row,col})}));
    blocks.sort((a,b)=>a.y-b.y).forEach(({x,y,row,col})=>{const order=(row*5+col)%17,delay=.25+order*.075,p=out(seg(t,delay,.52));if(!p)return;
      c.fillStyle=`rgba(0,0,0,${.12*p})`;c.beginPath();c.ellipse(x,y+th*.6,tw*.9,th*.7,0,0,TAU);c.fill();isoCube(c,x,y-th,tw*.93,H*.12*p,'#19b99e','#d7eee6','#84bcb3')});
  } else if(id==='story-progress'){
    fill(c,'#392630');c.fillStyle='#604050';c.beginPath();c.arc(W*.18,H*.3,H*.39,0,TAU);c.fill();
    const segment=W*.19,gap=W*.012,start=W*.07,elapsed=frac(t/8)*8,page=Math.min(3,Math.floor(elapsed/2));
    for(let i=0;i<4;i++){rounded(c,start+i*(segment+gap),H*.08,segment,6,3,'#867782');if(i<page)rounded(c,start+i*(segment+gap),H*.08,segment,6,3,C.paper);else if(i===page)rounded(c,start+i*(segment+gap),H*.08,segment*frac(elapsed/2),6,3,C.paper)}
    c.fillStyle='#f36c8b';c.beginPath();c.arc(W*.1,H*.24,12,0,TAU);c.fill();c.textAlign='left';c.textBaseline='middle';c.font='700 17px system-ui,sans-serif';c.fillStyle=C.paper;c.fillText('mapo.daily',W*.13,H*.24);label(c,`${page+1} / 4`,W/2,H*.72,48,C.paper);
  } else if(id==='bar-grow'){
    fill(c,C.paper);const vals=[.48,.68,.22],xs=[W*.24,W*.5,W*.76],base=H*.83;
    c.strokeStyle=C.ink;c.lineWidth=2;c.beginPath();c.moveTo(W*.07,base);c.lineTo(W*.94,base);c.stroke();
    vals.forEach((v,i)=>{const p=out(seg(t,.3+i*.32,.8)),h=H*v*p;rounded(c,xs[i]-W*.055,base-h,W*.11,h,4,C.ink)});
  } else if(id==='isotype-row'){
    fill(c,C.ink);const rows=[[7,'#7657f0',H*.36],[4,'#9daebf',H*.72]];
    rows.forEach(([count,color,y],row)=>{for(let i=0;i<10;i++){const p=out(seg(t,.25+row*.6+i*.13,.28)),x=W*.09+i*W*.066,filled=i<count;
      c.save();c.globalAlpha=filled?.15+.85*p:.16;c.fillStyle=filled?color:'#7d7894';c.beginPath();c.arc(x,y-10,6,0,TAU);c.fill();rounded(c,x-8,y-2,16,14,6,c.fillStyle);c.restore()}
      label(c,`${count}/10`,W*.86,y-2,35,color)});
  } else if(id==='gradient-flow'){
    fill(c,C.ink);const off=document.createElement('canvas');off.width=W;off.height=H;const o=off.getContext('2d');label(o,'흐르는 색',W/2,H/2,87,C.white);
    o.globalCompositeOperation='source-in';const shift=frac(t/4)*W*1.7-W*.35,g=o.createLinearGradient(shift,0,shift+W*.85,0);g.addColorStop(0,'#4b42da');g.addColorStop(.35,'#866dea');g.addColorStop(.64,'#f0e5ee');g.addColorStop(1,'#4b42da');fill(o,g);c.drawImage(off,0,0);
  } else if(id==='fluid-gradient'){
    fill(c,'#175a50');const colors=['#80c7b8','#4f6be6','#1ec1a6','#1d768b'];
    colors.forEach((color,i)=>{const x=W*(.22+.19*i)+W*.1*Math.sin(t*(.47+i*.09)+i),y=H*(.28+.15*(i%2))+H*.18*Math.cos(t*(.34+i*.07)+i*2),r=W*(.23+.05*(i%2));const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'db');g.addColorStop(.48,color+'70');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(0,0,W,H)});
  } else if(id==='split-halves'){
    fill(c,C.ink);const p=out(seg(t,.35,1.2));c.save();c.globalAlpha=out(seg(p,.48,.5));label(c,'속마음',W/2,H/2,71,C.violet);c.restore();
    c.save();c.translate(-W*.17*p,-H*.3*p);c.beginPath();c.rect(0,0,W,H/2);c.clip();label(c,'겉모습',W/2,H/2,89,C.paper);c.restore();
    c.save();c.translate(W*.17*p,H*.3*p);c.beginPath();c.rect(0,H/2,W,H/2);c.clip();label(c,'겉모습',W/2,H/2,89,C.paper);c.restore();
  } else if(id==='lens-flare'){
    const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#020715');bg.addColorStop(.55,'#111b32');bg.addColorStop(1,'#030711');fill(c,bg);
    label(c,'LOGO',W*.67,H*.52,70,'#7488ad');const phase=frac(t/4),x=mix(W*.13,W*.78,phase),y=H*.48+H*.055*Math.sin(phase*TAU),power=.75+.25*Math.sin(phase*Math.PI);
    c.save();c.globalCompositeOperation='screen';
    for(const [radius,alpha,color] of [[H*.75,.14,'131,184,255'],[H*.43,.29,'87,153,255'],[H*.24,.53,'255,199,137'],[H*.095,.9,'255,240,200']]){
      const g=c.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,`rgba(${color},${alpha*power})`);g.addColorStop(.27,`rgba(${color},${alpha*.37*power})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(0,0,W,H)}
    const streak=c.createLinearGradient(0,0,W,0),mid=x/W;streak.addColorStop(0,'#81adff00');streak.addColorStop(Math.max(0,mid-.32),'#81adff18');streak.addColorStop(mid,'#fff7dbec');streak.addColorStop(Math.min(1,mid+.32),'#76a9ff22');streak.addColorStop(1,'#81adff00');
    c.shadowColor='#78adff';c.shadowBlur=25;c.fillStyle=streak;c.fillRect(0,y-4,W,8);c.shadowBlur=0;c.fillRect(0,y-1.2,W,2.4);
    const beam=(angle,length,width,opacity)=>{c.save();c.translate(x,y);c.rotate(angle);const g=c.createLinearGradient(-length,0,length,0);g.addColorStop(0,'#fff4d800');g.addColorStop(.5,`rgba(255,250,224,${opacity*power})`);g.addColorStop(1,'#fff4d800');c.fillStyle=g;c.fillRect(-length,-width/2,length*2,width);c.restore()};
    beam(Math.PI/2,H*.42,2.3,.77);beam(.77,H*.28,1.4,.34);beam(-.77,H*.28,1.4,.34);
    const core=c.createRadialGradient(x,y,0,x,y,H*.046);core.addColorStop(0,'#ffffff');core.addColorStop(.23,'#fffefa');core.addColorStop(.5,'#fff5d5e8');core.addColorStop(1,'#fff5d500');c.fillStyle=core;c.fillRect(x-H*.06,y-H*.06,H*.12,H*.12);
    for(let i=0;i<6;i++){const q=(i+1)/7,gx=x+(W/2-x)*q*2.7,gy=mix(y,H*.51,q),r=H*(.022+i*.017),hue=i%3===0?'129,214,255':i%3===1?'255,180,156':'152,130,255';
      c.fillStyle=`rgba(${hue},${(.055+i*.008)*power})`;c.strokeStyle=`rgba(${hue},${(.19-i*.016)*power})`;c.lineWidth=1.7;c.beginPath();for(let k=0;k<6;k++){const a=TAU*k/6+phase*.2;k?c.lineTo(gx+r*Math.cos(a),gy+r*Math.sin(a)):c.moveTo(gx+r*Math.cos(a),gy+r*Math.sin(a))}c.closePath();c.fill();c.stroke()}
    c.restore();
  } else if(id==='boot-sequence'){
    fill(c,C.ink);const lines=['> 연결 준비','> 자료 불러오는 중','> 구성 완료','OK'],phase=t%4.6;
    c.textAlign='left';c.textBaseline='middle';c.font='600 25px ui-monospace,monospace';
    lines.forEach((line,i)=>{const q=seg(phase,.15+i*.52,.42);if(!q)return;c.fillStyle=i===3?'#58d2a0':'#c4d0d3';c.fillText(line.slice(0,Math.ceil(line.length*q)),W*.16,H*.2+i*H*.16)});
    const show=out(seg(phase,2.45,.65));if(show){c.save();c.globalAlpha=show;label(c,'READY',W*.72,H*.57,63,'#60e0a9');c.restore()}
  } else if(id==='color-blocks'){
    const phase=Math.floor((t%4)/.75),palettes=[['#f14c34',C.paper,C.ink],['#1c6e73','#fdcf60','#332235'],['#7a57e0','#f4e8e2','#211a35'],['#ea8950','#145948','#f7e9b5'],['#143b57','#edc767','#f1ede7'],['#f14c34',C.paper,C.ink]],colors=palettes[phase];
    fill(c,colors[2]);c.fillStyle=colors[0];c.fillRect(0,0,W*.4,H);c.fillStyle=colors[1];c.fillRect(W*.4,0,W*.37,H*.5);c.fillStyle=colors[1];c.fillRect(W*.77,H*.5,W*.23,H*.5);
  } else if(id==='cloud-sky'){
    const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#247eac');sky.addColorStop(1,'#97d2e1');fill(c,sky);
    for(let layer=0;layer<3;layer++)for(let i=-1;i<5;i++){const speed=(layer+1)*13,cycle=W+W*.34,x=((i*W*.34+layer*W*.12-t*speed)%cycle+cycle)%cycle-W*.15,y=H*(.22+layer*.24)+H*.025*Math.sin(i+layer),scale=.55+layer*.28,r=H*.105*scale;
      c.fillStyle=layer===2?'#f7f6f0':layer===1?'#ecf5f2c9':'#c0e5eeb0';
      rounded(c,x-r*2.8,y-r*.12,r*5.6,r*1.15,r*.58,c.fillStyle);
      [[-1.9,.05,1],[-.9,-.55,1.25],[.2,-.77,1.4],[1.4,-.25,1.1],[2.25,.06,.85]].forEach(([ox,oy,sc])=>{c.beginPath();c.arc(x+ox*r,y+oy*r,r*sc,0,TAU);c.fill()})}
  } else if(id==='dice-roll'){
    fill(c,'#141821');const p=out(seg(t,.25,1.65)),ax=(1-p)*TAU*1.75+.32,ay=(1-p)*TAU*1.4-.38,az=(1-p)*TAU*1.2+.06,cx=mix(W*.20,W*.39,p),floorY=H*.82;
    const floor=c.createLinearGradient(0,floorY-20,0,H);floor.addColorStop(0,'#25303c');floor.addColorStop(1,'#11161e');c.fillStyle=floor;c.fillRect(0,floorY,W,H-floorY);
    c.strokeStyle='#4b5964';c.lineWidth=1;c.globalAlpha=.55;c.beginPath();c.moveTo(0,floorY+.5);c.lineTo(W,floorY+.5);c.stroke();c.globalAlpha=1;
    const rotate=([x,y,z])=>{const rx=x,ry=y*Math.cos(ax)-z*Math.sin(ax),rz=y*Math.sin(ax)+z*Math.cos(ax),sx=rx*Math.cos(ay)+rz*Math.sin(ay),sz=-rx*Math.sin(ay)+rz*Math.cos(ay);return [sx*Math.cos(az)-ry*Math.sin(az),sx*Math.sin(az)+ry*Math.cos(az),sz]};
    const projection=v=>{const [x,y,z]=rotate(v),scale=280/(5-z);return [x*scale,-y*scale,scale]};
    let lowest=-Infinity;for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])lowest=Math.max(lowest,projection([x,y,z])[1]);
    const hop=H*.16*(1-p)*Math.pow(Math.max(0,Math.sin(3.5*Math.PI*p)),2),cy=floorY-lowest-hop;
    const shadow=c.createRadialGradient(cx,floorY,8,cx,floorY,100);shadow.addColorStop(0,`rgba(0,0,0,${.52-.22*hop/(H*.16)})`);shadow.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=shadow;c.beginPath();c.ellipse(cx,floorY+3,105,17,0,0,TAU);c.fill();
    const project=v=>{const [x,y,s]=projection(v);return [cx+x,cy+y,s]};
    const faces=[{n:[0,0,1],u:[1,0,0],v:[0,1,0],value:5},{n:[0,0,-1],u:[-1,0,0],v:[0,1,0],value:2},{n:[1,0,0],u:[0,0,-1],v:[0,1,0],value:3},{n:[-1,0,0],u:[0,0,1],v:[0,1,0],value:4},{n:[0,1,0],u:[1,0,0],v:[0,0,-1],value:1},{n:[0,-1,0],u:[1,0,0],v:[0,0,1],value:6}];
    const patterns={1:[[0,0]],2:[[-.48,-.48],[.48,.48]],3:[[-.48,-.48],[0,0],[.48,.48]],4:[[-.48,-.48],[.48,-.48],[-.48,.48],[.48,.48]],5:[[-.48,-.48],[.48,-.48],[0,0],[-.48,.48],[.48,.48]],6:[[-.48,-.5],[-.48,0],[-.48,.5],[.48,-.5],[.48,0],[.48,.5]]};
    faces.map(face=>({...face,normal:rotate(face.n)})).filter(face=>face.normal[2]>.025).sort((a,b)=>a.normal[2]-b.normal[2]).forEach(face=>{
      const point=(u,v,off=0)=>face.n.map((n,i)=>n*(1+off)+face.u[i]*u+face.v[i]*v),corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>project(point(u,v)));
      const light=.73+.19*face.normal[2]+.07*face.normal[1],shade=Math.round(245*light),surface=c.createLinearGradient(corners[0][0],corners[0][1],corners[2][0],corners[2][1]);surface.addColorStop(0,`rgb(${Math.min(255,shade+23)},${Math.min(255,shade+24)},${Math.min(255,shade+26)})`);surface.addColorStop(1,`rgb(${shade-15},${shade-13},${shade-10})`);
      c.fillStyle=surface;c.strokeStyle='#c6cacf';c.lineWidth=3;c.lineJoin='round';c.beginPath();corners.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();
      const inset=[[-.91,-.91],[.91,-.91],[.91,.91],[-.91,.91]].map(([u,v])=>project(point(u,v,.013)));c.strokeStyle='rgba(255,255,255,.43)';c.lineWidth=1.2;c.beginPath();inset.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.stroke();
      patterns[face.value].forEach(([u,v])=>{
        const pip=(radius,depth)=>{c.beginPath();for(let i=0;i<20;i++){const a=i*TAU/20,[x,y]=project(point(u+radius*Math.cos(a),v+radius*Math.sin(a),depth));i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath()};
        pip(.154,.014);c.fillStyle='#aab1b6';c.fill();
        pip(.13,-.014);c.fillStyle='#7d858d';c.fill();
        pip(.108,-.044);const [px,py,ps]=project(point(u,v,-.044)),well=c.createRadialGradient(px-ps*.038,py-ps*.045,1,px,py,ps*.13);well.addColorStop(0,'#07090c');well.addColorStop(.72,'#181d24');well.addColorStop(1,'#454e57');c.fillStyle=well;c.fill();
        pip(.154,.014);c.strokeStyle='rgba(255,255,255,.48)';c.lineWidth=.75;c.stroke();
      })
    });
    c.textAlign='left';c.textBaseline='middle';c.font='700 17px ui-monospace,monospace';c.fillStyle='#9ba7b5';c.fillText(p>.98?'RESULT':'ROLL',W*.67,H*.32);if(p>.98)label(c,'5',W*.75,H*.58,82,C.paper);
  } else if(id==='grid-zoom'){
    fill(c,'#19a998');const pulse=out(seg(t%4,.25,1.35)),scale=1+pulse,spacing=H*.22*scale;
    c.strokeStyle=C.ink;c.lineWidth=3;c.beginPath();for(let x=W/2+((t*.04)%1)*spacing;x<W+spacing;x+=spacing){c.moveTo(x,0);c.lineTo(x,H)}for(let x=W/2+((t*.04)%1)*spacing;x>-spacing;x-=spacing){c.moveTo(x,0);c.lineTo(x,H)}for(let y=H/2;y<H+spacing;y+=spacing){c.moveTo(0,y);c.lineTo(W,y)}for(let y=H/2;y>-spacing;y-=spacing){c.moveTo(0,y);c.lineTo(W,y)}c.stroke();
    if(pulse>.46){c.globalAlpha=out(seg(pulse,.46,.4));c.strokeStyle='#155f5d';c.lineWidth=1.5;c.beginPath();for(let x=W/2+spacing/2;x<W+spacing;x+=spacing){c.moveTo(x,0);c.lineTo(x,H)}for(let x=W/2-spacing/2;x>-spacing;x-=spacing){c.moveTo(x,0);c.lineTo(x,H)}for(let y=H/2+spacing/2;y<H+spacing;y+=spacing){c.moveTo(0,y);c.lineTo(W,y)}for(let y=H/2-spacing/2;y>-spacing;y-=spacing){c.moveTo(0,y);c.lineTo(W,y)}c.stroke();c.globalAlpha=1}
    rounded(c,W/2-5,H/2-5,10,10,0,C.paper);
  } else if(id==='badge-count'){
    fill(c,C.ink);drawBell(c,W/2,H*.53,H*.6,C.paper);const step=Math.min(3,Math.floor(Math.max(0,t-.45)/.7)+1),p=back(seg(t,.45+(step-1)*.7,.4));
    if(t>.45){const x=W*.57,y=H*.24;c.save();c.translate(x,y);c.scale(Math.max(.05,p),Math.max(.05,p));c.fillStyle='#f15767';c.beginPath();c.arc(0,0,25,0,TAU);c.fill();label(c,String(step),0,1,25,C.white);c.restore()}
  } else if(id==='bell-shake'){
    fill(c,C.paper);const start=.38,elapsed=Math.max(0,t-start),amp=elapsed?Math.exp(-elapsed*1.4):0,angle=.38*amp*Math.sin(elapsed*18);
    c.save();c.translate(W/2,H*.28);c.rotate(angle);drawBell(c,0,H*.28,H*.57,C.ink);c.restore();
    if(elapsed>.55){const q=out(seg(elapsed,.55,.75));c.fillStyle='#ef663d';c.beginPath();c.arc(W*.54+W*.1*q,H*.23-H*.12*q,9+5*q,0,TAU);c.fill()}
  } else if(id==='bar-race'){
    fill(c,C.ink);const rows=[{name:'부산',from:78,to:61,color:'#f3874a',initial:0,final:1},{name:'대전',from:62,to:44,color:'#72cc9d',initial:1,final:2},{name:'서울',from:46,to:83,color:'#48b0ee',initial:2,final:0}],valuePhase=ease(seg(t,.3,2.2)),swap=ease(seg(t,1.25,.9)),barX=W*.25,barW=W*.43;
    rows.forEach(row=>{const y=H*(.21+mix(row.initial,row.final,swap)*.28),x=barX,value=mix(row.from,row.to,valuePhase),h=H*.16,w=barW*value/100;
      rounded(c,x,y,w,h,6,row.color);c.textBaseline='middle';c.font='700 20px system-ui,sans-serif';c.fillStyle='#13212b';c.textAlign='left';c.fillText(row.name,x+14,y+h/2);c.textAlign='right';c.fillText(String(Math.round(value)),x+w-13,y+h/2)});
  } else if(id==='domino-letters'){
    fill(c,C.ink);const word='차례차례',px=73,gap=107,x0=W/2-gap*(word.length-1)/2-29,ground=H*.79,phase=t%4;
    c.fillStyle='#91384f';c.fillRect(0,ground,W,3);
    for(let i=0;i<word.length;i++){const q=phase<2.8?Math.pow(seg(phase,.4+i*.24,.3),2):1-ease(seg(phase,2.8+(word.length-1-i)*.06,.7)),angle=(i===word.length-1?Math.PI/2:.79)*q;
      c.save();c.translate(x0+i*gap+px*.45,ground);c.rotate(angle);c.font=`800 ${px}px system-ui,sans-serif`;c.fillStyle=q>.01?'#ee5877':C.paper;c.textAlign='center';c.textBaseline='middle';c.fillText(word[i],-px*.45,-px*.49);c.restore()}
  } else if(id==='wave-letters'){
    fill(c,C.ink);const word='물결을타요',px=77;c.font=`800 ${px}px system-ui,sans-serif`;const widths=Array.from(word,ch=>c.measureText(ch).width),total=widths.reduce((a,b)=>a+b,0);let x=W/2-total/2;
    for(let i=0;i<word.length;i++){const a=TAU*t/2-i*.75,y=H*.14*Math.sin(a);c.save();c.translate(x+widths[i]/2,H/2+y);c.rotate(Math.cos(a)*.18);c.textAlign='center';c.textBaseline='middle';c.fillStyle=Math.sin(a)<-.6?'#f0a019':C.paper;c.fillText(word[i],0,0);c.restore();x+=widths[i]}
  } else if(id==='ripple-ring'){
    fill(c,C.ink);const phase=t%4.5,cx=W/2,cy=H/2,r=H*.25,appear=back(seg(phase,.35,.48));
    for(let i=0;i<3;i++){const q=seg(phase,.7+i*.35,1.35);if(q<=0||q>=1)continue;const size=r*(1.8+q*2.2);c.globalAlpha=(1-q)*.75;c.strokeStyle='#59a7fa';c.lineWidth=3.5;c.beginPath();c.roundRect(cx-size/2,cy-size/2,size,size,size*.26);c.stroke()}c.globalAlpha=1;
    if(appear>0){c.save();c.translate(cx,cy);c.scale(appear,appear);rounded(c,-r*.8,-r*.8,r*1.6,r*1.6,r*.42,'#3489e8');c.fillStyle=C.paper;c.beginPath();[[-.08,-.57],[-.5,.04],[-.1,.04],[-.35,.56],[.5,-.12],[.1,-.12]].forEach(([x,y],i)=>i?c.lineTo(x*r,y*r):c.moveTo(x*r,y*r));c.closePath();c.fill();c.restore()}
  } else if(id==='live-badge'){
    const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#593543');bg.addColorStop(1,'#20202c');fill(c,bg);c.fillStyle='rgba(255,255,255,.04)';c.beginPath();c.arc(W*.21,H*.2,H*.53,0,TAU);c.arc(W*.83,H*.89,H*.48,0,TAU);c.fill();
    const phase=t%8,b=back(seg(phase,.4,.42));if(b>0){const x=W*.11,y=H*.17;c.save();c.translate(x,y);c.scale(b,b);rounded(c,0,0,H*.4,H*.19,10,'#e53834');rounded(c,H*.42,0,H*.46,H*.19,10,'rgba(0,0,0,.55)');c.fillStyle=`rgba(255,255,255,${.45+.55*Math.cos(TAU*phase)**2})`;c.beginPath();c.arc(H*.082,H*.095,H*.035,0,TAU);c.fill();c.font='800 24px system-ui,sans-serif';c.fillStyle=C.white;c.textAlign='left';c.textBaseline='middle';c.fillText('LIVE',H*.135,H*.095);c.font='600 19px system-ui,sans-serif';c.textAlign='center';c.fillText(`${Math.round(mix(1832,1904,phase/8)).toLocaleString('en-US')}명`,H*.65,H*.095);c.restore()}
  } else if(id==='new-tag-flash'){
    const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#553441');bg.addColorStop(1,'#20202b');fill(c,bg);const x=W*.25,y=H*.18,cw=W*.5,ch=H*.64;
    rounded(c,x,y,cw,ch,16,'rgba(255,255,255,.17)');c.fillStyle=C.paper;c.font='700 24px system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillText('가을 신메뉴',x+23,y+ch-28);
    const phase=t%4,b=back(seg(phase,.8,.4)),sh=seg(phase,1.3,.6);if(b>0){c.save();c.translate(x+cw-10,y+12);c.rotate(.18);c.scale(b,b);rounded(c,-54,-20,108,40,9,'#ee526c');label(c,'NEW',0,1,24,C.white);if(sh>0&&sh<1){c.save();c.beginPath();c.roundRect(-54,-20,108,40,9);c.clip();const beam=c.createLinearGradient(-80+180*sh,0,-52+180*sh,0);beam.addColorStop(0,'rgba(255,255,255,0)');beam.addColorStop(.5,'rgba(255,255,255,.83)');beam.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=beam;c.fillRect(-80+180*sh,-25,30,50);c.restore()}c.restore()}
  } else if(id==='square-snap'){
    fill(c,'#f05234');const phase=(t%2)/2,turn=Math.floor(t/2)+(phase<.55?(phase<.25?-.06*Math.sin(phase/.25*Math.PI):back(seg(phase,.25,.3))):1),size=H*.62;
    c.save();c.translate(W/2,H/2);c.rotate(turn*Math.PI/2);c.strokeStyle=C.ink;c.lineWidth=9;c.strokeRect(-size/2,-size/2,size,size);c.fillStyle=C.paper;c.fillRect(-size*.34,-size*.34,size*.68,size*.68);c.restore();
  } else if(id==='ping-pong'){
    fill(c,C.ink);const phase=(t%4)/4,tri=phase<.5?phase*2:(1-phase)*2,u=ease(tri),left=W*.22,right=W*.78,base=H*.7,x=mix(left,right,u),y=base-Math.sin(u*Math.PI)*H*.38;
    c.fillStyle='#34404d';c.fillRect(left-8,H*.3,5,base-H*.3+10);c.fillRect(right+3,H*.3,5,base-H*.3+10);c.fillRect(left,base+11,right-left,3);
    c.strokeStyle='rgba(244,241,234,.4)';c.lineWidth=2;c.setLineDash([4,8]);c.beginPath();for(let i=0;i<=40;i++){const q=i/40,px=mix(left,right,q),py=base-Math.sin(q*Math.PI)*H*.38;i?c.lineTo(px,py):c.moveTo(px,py)}c.stroke();c.setLineDash([]);
    c.save();c.translate(x,y);c.rotate(u*TAU);rounded(c,-18,-18,36,36,8,'#3489e8');c.restore();rounded(c,W*.25,H*.9-3,W*.5,6,3,'#46515c');rounded(c,W*.25,H*.9-3,W*.5*u,6,3,'#3489e8');c.fillStyle=C.paper;c.beginPath();c.arc(W*.25+W*.5*u,H*.9,8,0,TAU);c.fill();label(c,phase<.5?'▶':'◀',W*.21,H*.9,18,C.paper);
  } else if(id==='trim-path'){
    fill(c,C.ink);const pts=Array.from({length:121},(_,i)=>{const u=i/120;return [W*(.06+.88*u),H*(.5+Math.sin(u*TAU*1.5)*.28)]});
    c.lineCap='round';c.strokeStyle='rgba(244,241,234,.13)';c.lineWidth=8;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
    [[0,'#17a88a'],[.33,C.paper],[.66,'#7cd1c2']].forEach(([offset,color])=>{const head=((t/2+offset)%1)*1.3,start=Math.max(0,head-.3),end=Math.min(1,head);if(end<=start)return;c.strokeStyle=color;c.lineWidth=11;c.beginPath();let first=true;pts.forEach(([x,y],i)=>{const u=i/120;if(u<start||u>end)return;first?(c.moveTo(x,y),first=false):c.lineTo(x,y)});c.stroke()});c.lineCap='butt';
  } else if(id==='ripple-interference'){
    fill(c,C.ink);const spacing=H/5,maxR=Math.hypot(W,H);[[W*.3,H*.55,C.paper],[W*.7,H*.45,'#eea018']].forEach(([x,y,color])=>{c.strokeStyle=color;c.lineWidth=3;for(let j=0;j*spacing<maxR;j++){const r=(j+frac(t/2))*spacing;c.globalAlpha=clamp(1-r/maxR*1.3);c.beginPath();c.arc(x,y,r,0,TAU);c.stroke()}});c.globalAlpha=1;
  } else if(id==='dot-rings'){
    fill(c,'#ec5272');const gap=H*.085,cx=W/2,cy=H/2;for(let ring=1;ring*gap<Math.hypot(W,H)/2;ring++){const count=7*ring,rot=(ring%2?1:-1)*(TAU/count)*2*t/8;c.fillStyle=ring%2?C.paper:C.ink;for(let i=0;i<count;i++){const a=rot+i*TAU/count;c.beginPath();c.arc(cx+ring*gap*Math.cos(a),cy+ring*gap*Math.sin(a),H*.022,0,TAU);c.fill()}}
  } else if(id==='dot-spiral'){
    fill(c,C.ink);const cx=W/2,cy=H/2,rot=TAU*t/8;for(let i=1;i<720;i++){const a=i*2.39996+rot,r=H*.034*Math.sqrt(i)*(1+.05*Math.sin(TAU*t/4-i*.06)),x=cx+r*Math.cos(a),y=cy+r*Math.sin(a);if(x<-10||x>W+10||y<-10||y>H+10)continue;c.fillStyle=i%3?C.paper:'#ed5272';c.beginPath();c.arc(x,y,H*(.01+.02*Math.sqrt(i/720)),0,TAU);c.fill()}
  } else if(id==='gravity-flip'){
    fill(c,C.paper);const word='거꾸로',px=H*.32,phase=t%4,bounce=q=>{q=clamp(q);const n=7.5625,d=2.75;if(q<1/d)return n*q*q;if(q<2/d)return n*(q-=1.5/d)*q+.75;if(q<2.5/d)return n*(q-=2.25/d)*q+.9375;return n*(q-=2.625/d)*q+.984375};
    c.fillStyle=C.ink;c.fillRect(0,0,W,3);c.fillRect(0,H-3,W,3);c.font=`800 ${px}px system-ui,sans-serif`;const ws=Array.from(word,ch=>c.measureText(ch).width),total=ws.reduce((a,b)=>a+b,0);let x=W/2-total/2;
    Array.from(word).forEach((ch,i)=>{const up=bounce(seg(phase,.3+i*.08,.9)),down=bounce(seg(phase,2.3+i*.08,.9)),u=up-down,rot=Math.PI*(ease(seg(phase,.3+i*.08,.5))-ease(seg(phase,2.3+i*.08,.5)));c.save();c.translate(x+ws[i]/2,H-px*.72+(px*.72-(H-px*.72))*u);c.rotate(rot);c.textAlign='center';c.textBaseline='middle';c.fillStyle=i===1?'#e95676':C.ink;c.fillText(ch,0,0);c.restore();x+=ws[i]});
  } else if(id==='magnet-pull'){
    fill(c,C.paper);const word='끌려온다',px=H*.36,phase=t%4,pull=phase<1.6?Math.pow(seg(phase,.3,1.3),3):phase<2.9?1:1-ease(seg(phase,2.9,1)),spread=1+1.05*(1-pull),hit=phase>1.6&&phase<1.9?Math.sin((phase-1.6)*60)*px*.03*(1-(phase-1.6)/.3):0;
    c.fillStyle='#2ba8e0';c.fillRect(W/2-2,H*.14,4,H*.1);c.fillRect(W/2-2,H*.76,4,H*.1);c.font=`800 ${px}px system-ui,sans-serif`;const ws=Array.from(word,ch=>c.measureText(ch).width),total=ws.reduce((a,b)=>a+b,0);let x=-total/2;
    Array.from(word).forEach((ch,i)=>{const xx=x+ws[i]/2,lean=(xx<0?1:-1)*.25*(1-pull)*(pull>0?1:0);c.save();c.translate(W/2+xx*spread+hit,H/2);c.rotate(lean);c.textAlign='center';c.textBaseline='middle';c.fillStyle=pull>.99?'#2ba8e0':C.ink;c.fillText(ch,0,0);c.restore();x+=ws[i]});
  } else if(id==='toast-slide'){
    const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#573641');bg.addColorStop(1,'#21212b');fill(c,bg);c.fillStyle='rgba(255,255,255,.045)';c.beginPath();c.arc(W*.2,H*.1,H*.48,0,TAU);c.arc(W*.82,H*.9,H*.38,0,TAU);c.fill();
    const phase=t%4,e=back(seg(phase,.4,.5)),exit=ease(seg(phase,3.2,.4)),y=mix(-H*.3,H*.14,e)-exit*H*.5,bw=W*.78,bh=H*.3,x=(W-bw)/2;if(e>0){rounded(c,x,y,bw,bh,17,'#f8f8fa');rounded(c,x+15,y+bh/2-16,32,32,8,'#e95676');c.fillStyle=C.ink;c.textAlign='left';c.textBaseline='middle';c.font='800 22px system-ui,sans-serif';c.fillText('주문이 접수됐어요',x+64,y+bh*.37);c.fillStyle='#6b7079';c.font='500 17px system-ui,sans-serif';c.fillText('15분 뒤 도착 예정',x+64,y+bh*.69)}
  } else if(id==='crumble-down'){
    fill(c,C.paper);const word='무너진다',phase=t%4,px=H*.42;c.font=`800 ${px}px system-ui,sans-serif`;const ws=Array.from(word,ch=>c.measureText(ch).width),total=ws.reduce((a,b)=>a+b,0);let x=W/2-total/2;
    Array.from(word).forEach((ch,i)=>{let xx=x+ws[i]/2,y=H/2,rot=0;if(phase<3){const dt=phase-.5-i*.28;if(dt>0){y+=H*2.6*dt*dt;xx+=dt*px*(frac(Math.sin(i*127.1)*43758.5453)-.5);rot=dt*(frac(Math.sin((i+3)*127.1)*43758.5453)-.3)*3}}else{const q=seg(phase,3+i*.07,.55);if(q<=0){x+=ws[i];return}y=H/2-(1-back(q))*H}c.save();c.translate(xx,y);c.rotate(rot);c.textAlign='center';c.textBaseline='middle';c.fillStyle=i%2?'#2ba8e0':C.ink;c.fillText(ch,0,0);c.restore();x+=ws[i]});
  } else if(id==='comic-dots'){
    fill(c,C.paper);const spacing=H/8,ox=spacing*.22*Math.sin(TAU*t/8),oy=spacing*.18*Math.cos(TAU*t/8);for(let y=spacing/2;y<H+spacing;y+=spacing)for(let x=spacing/2;x<W+spacing;x+=spacing){const q=clamp(1-x/W*.9+.15*Math.sin(TAU*t/8+y/H*3));c.fillStyle='#eb5271';c.beginPath();c.arc(x+ox,y+oy,spacing*.45*q,0,TAU);c.fill();c.fillStyle=C.ink;c.beginPath();c.arc(x,y,spacing*.3*q,0,TAU);c.fill()}
  } else if(id==='jitter-settle'){
    fill(c,'#ec9b0e');const word='덜덜덜',phase=t%4,px=H*.5,amp=phase>3.4?(phase-3.4):phase<2.4?Math.exp(-phase*2.2):0,frame=Math.floor(t*30),rand=n=>frac(Math.sin(n*127.1+311.7)*43758.5453);c.font=`800 ${px}px system-ui,sans-serif`;const widths=Array.from(word,ch=>c.measureText(ch).width),total=widths.reduce((a,b)=>a+b,0);let x=W/2-total/2;
    Array.from(word).forEach((ch,i)=>{const dx=(rand(frame*3+i)-.5)*px*.5*amp,dy=(rand(frame*5+i+1)-.5)*px*.5*amp,rot=(rand(frame*7+i)-.5)*.7*amp;c.save();c.translate(x+widths[i]/2+dx,H/2+dy);c.rotate(rot);c.fillStyle=C.ink;c.textAlign='center';c.textBaseline='middle';c.fillText(ch,0,0);c.restore();x+=widths[i]});
  } else if(id==='donut-split'){
    fill(c,C.paper);const values=[.42,.27,.18,.13],colors=['#6b5ae0','#aaa0ed','#443b87','#8fa3b8'],cx=W/2,cy=H/2,r=H*.33,e=ease(seg(t,.4,1.6)),split=out(seg(t,2.3,.6));let acc=0;c.lineWidth=H*.12;
    values.forEach((value,i)=>{const from=-Math.PI/2+TAU*acc,to=-Math.PI/2+TAU*Math.min(acc+value,e),mid=-Math.PI/2+TAU*(acc+value/2);if(to>from){const dx=Math.cos(mid)*H*.05*split,dy=Math.sin(mid)*H*.05*split;c.strokeStyle=colors[i];c.beginPath();c.arc(cx+dx,cy+dy,r,from+.03*split,to-.03*split);c.stroke()}acc+=value});if(split>.05){c.globalAlpha=split;label(c,'4',cx,cy-H*.02,51,C.ink);label(c,'항목',cx,cy+H*.15,18,C.ink);c.globalAlpha=1}
  } else if(id==='pie-sweep'){
    fill(c,C.ink);const values=[.42,.27,.18,.13],colors=['#6b5ae0','#aaa0ed','#443b87','#8fa3b8'],cx=W/2,cy=H/2,r=H*.36,e=ease(seg(t,.4,2.2));let acc=0;
    values.forEach((value,i)=>{const from=-Math.PI/2+TAU*acc,to=-Math.PI/2+TAU*Math.min(acc+value,e);if(to>from){c.fillStyle=colors[i];c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,r,from,to);c.closePath();c.fill()}acc+=value});const q=seg(t,2.8,.4);if(q>0){c.globalAlpha=q;c.textAlign='left';c.textBaseline='middle';c.font='800 42px system-ui,sans-serif';c.fillStyle='#9c8cff';c.fillText('42%',cx+r+H*.12,cy);c.globalAlpha=1}
  } else if(id==='spin-settle'){
    fill(c,C.ink);const p=seg(t,.4,1.8),rot=(1-out(p))*TAU*2+(p>.6?Math.sin(p*14)*.25*(1-p)**2:0),scale=.6+.4*out(p);if(p>0){c.save();c.translate(W/2,H/2);c.rotate(rot);c.scale(scale,scale);c.globalAlpha=clamp(p*4);mark(c,0,0,H*.53,'#3489e8');c.restore()}
  } else if(id==='wiggle-hint'){
    fill(c,C.ink);const phase=t%4,q=seg(phase,2.4,1),rot=q>0&&q<1?Math.sin(q*Math.PI*6)*.22*(1-q):0;c.save();c.translate(W/2,H/2);c.rotate(rot);mark(c,0,0,H*.48,'#1aac91');c.restore();
  } else if(id==='breathe-pulse'){
    fill(c,C.ink);const q=.5+.5*Math.sin(TAU*t/2-Math.PI/2),iconSize=H*.46,haloSize=iconSize*(1.3+.4*q);c.globalAlpha=.18*q;rounded(c,(W-haloSize)/2,(H-haloSize)/2,haloSize,haloSize,haloSize*.25,'#1aac91');c.globalAlpha=1;c.save();c.translate(W/2,H/2);c.scale(1+.06*q,1+.06*q);mark(c,0,0,iconSize,'#1aac91');c.restore();
  } else if(id==='text-vortex'){
    fill(c,C.ink);const phase=t%7,lines=['오늘의 이야기가','작은 소용돌이 속으로 빨려 들어갑니다'],glyphs=[],cx=W/2,cy=H*.55;
    c.font='700 36px system-ui,sans-serif';for(let row=0;row<lines.length;row++){const chars=[...lines[row]],widths=chars.map(ch=>c.measureText(ch).width);let x=(W-widths.reduce((sum,w)=>sum+w,0))/2;for(let j=0;j<chars.length;j++){glyphs.push({ch:chars[j],x:x+widths[j]/2,y:H*(row? .34:.16)});x+=widths[j]}}
    glyphs.forEach(({ch,x:x0,y:y0},i)=>{const launch=.3+(glyphs.length-1-i)*.11;if(phase<launch){label(c,ch,x0,y0,36,i%5===0?'#1aac91':C.paper);return}const p=clamp((phase-launch)/2.5);if(p>=1||ch===' ')return;const angle=TAU*(.16*p+1.14*p*p),radius=Math.pow(1-p,1.2),dx=(x0-cx)*.62,dy=y0-cy,x=cx+radius*(dx*Math.cos(angle)-dy*Math.sin(angle))/.62,y=cy+radius*(dx*Math.sin(angle)+dy*Math.cos(angle)),stretch=1+.9*Math.sin(Math.PI*p);c.save();c.translate(x,y);c.rotate(TAU*(.22*p+1.8*p*p));c.scale(1,stretch);c.globalAlpha=1-seg(p,.82,.18);label(c,ch,0,0,mix(36,12,p),i%5===0?'#1aac91':C.paper);c.restore()});
  } else if(id==='punch-in'){
    fill(c,C.ink);const scale=t%2<1?1:2.1;c.save();c.translate(W/2,H/2);c.scale(scale,scale);rounded(c,-30,-30,60,60,10,'#7a5af0');c.restore();
  } else if(id==='snap-zoom'){
    fill(c,C.ink);const phase=(t%2.4)/2.4,scale=phase<.2?1:phase<.4?1.25:phase<.6?1.6:2.1;c.save();c.translate(W/2,H/2);c.scale(scale,scale);rounded(c,-30,-30,60,60,10,'#e07a3f');c.restore();
  } else if(id==='push'){
    const s=transitionState(t),q=ease(s.p),x=-W*q;c.save();c.beginPath();c.rect(0,0,W,H);c.clip();c.save();c.translate(x,0);sourceScreen(c,s.from,'#2ba8e0');c.restore();if(q>0){c.save();c.translate(x+W,0);sourceScreen(c,s.to,'#2ba8e0');rounded(c,W*.71,H*.39,W*.11,H*.22,12,'#f6cc57');c.restore()}c.restore();
  } else if(id==='slide-reveal'){
    const s=transitionState(t),q=ease(s.p);sourceScreen(c,s.to,'#2ba8e0');rounded(c,W*.71,H*.39,W*.11,H*.22,12,'#f6cc57');c.fillStyle=`rgba(0,0,0,${.35*(1-q)})`;c.fillRect(0,0,W,H);c.save();c.translate(-W*q,0);sourceScreen(c,s.from,'#2ba8e0');c.restore();if(q>0&&q<1){c.fillStyle='rgba(0,0,0,.2)';c.fillRect(W*(1-q)-9,0,9,H)}
  } else if(id==='curtain-slide'){
    const s=transitionState(t),q=Math.max(0,back(ease(s.p)*1.05));sourceScreen(c,s.from,'#e8506e');if(q>0){c.save();c.beginPath();c.rect(0,0,W/2*q,H);c.rect(W-W/2*q,0,W/2*q,H);c.clip();sourceScreen(c,s.to,'#e8506e');c.restore();if(q<1){c.fillStyle='rgba(0,0,0,.3)';c.fillRect(W/2*q-4,0,4,H);c.fillRect(W-W/2*q,0,4,H)}}
  } else if(id==='vertical-split'){
    const s=transitionState(t),q=Math.max(0,back(ease(s.p)));sourceScreen(c,s.from,'#6b5ae0');if(q>0){c.save();c.beginPath();c.rect(0,0,W/2+1,H*q);c.rect(W/2-1,H-H*q,W/2+1,H*q);c.clip();sourceScreen(c,s.to,'#6b5ae0');c.restore()}
  } else if(id==='island-alert'){
    const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#573641');bg.addColorStop(1,'#22212c');fill(c,bg);c.fillStyle='rgba(255,255,255,.04)';c.beginPath();c.arc(W*.2,H*.14,H*.47,0,TAU);c.arc(W*.83,H*.9,H*.4,0,TAU);c.fill();
    const phase=t%4,open=back(seg(phase,.5,.55)),shut=ease(seg(phase,3.1,.4)),e=clamp(open*(1-shut)),bw=mix(H*.36,W*.8,e),bh=mix(H*.11,H*.3,e),x=(W-bw)/2,y=H*.06;rounded(c,x,y,bw,bh,Math.min(bh/2,H*.1),'#07080b');const fade=clamp((e-.75)/.25);
    if(fade>0){c.globalAlpha=fade;rounded(c,x+H*.05,y+bh/2-H*.07,H*.14,H*.14,H*.04,'#e8506e');c.textAlign='left';c.textBaseline='middle';c.fillStyle=C.paper;c.font='700 21px system-ui,sans-serif';c.fillText('택배가 도착했어요',x+H*.24,y+bh*.38);c.fillStyle='#a0a6b0';c.font='500 17px system-ui,sans-serif';c.fillText('문 앞 · 방금',x+H*.24,y+bh*.68);c.fillStyle='#30d158';c.beginPath();c.arc(x+bw-H*.09,y+bh/2,H*.03,0,TAU);c.fill();c.globalAlpha=1}
  } else if(id==='perspective-grid'){
    fill(c,C.ink);const cx=W/2,horizon=H/2,phase=frac(t/2);c.lineWidth=2.2;for(const side of [1,-1]){c.strokeStyle=side>0?'#19ad91':C.paper;c.globalAlpha=side>0?1:.55;for(let i=-14;i<=14;i++){c.beginPath();c.moveTo(cx,horizon);c.lineTo(cx+i*W/6,horizon+side*H/2);c.stroke()}for(let j=0;j<9;j++){const z=9-j-phase,y=horizon+side*(H/2)/(z*.5+.4)*.4;c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}}c.globalAlpha=1;
  } else if(id==='notification-stack'){
    const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#573641');bg.addColorStop(1,'#22212c');fill(c,bg);c.fillStyle='rgba(255,255,255,.04)';c.beginPath();c.arc(W*.2,H*.14,H*.47,0,TAU);c.arc(W*.83,H*.9,H*.4,0,TAU);c.fill();
    const msgs=['새 팔로워 3명','댓글 2개','좋아요 120개'],phase=t%8,bw=W*.74,bh=H*.2,x=(W-bw)/2;let n=0;msgs.forEach((_,i)=>{if(phase>.4+i*.9)n=i+1});
    for(let i=0;i<n;i++){const slot=n-1-i,e=back(seg(phase,.4+i*.9,.45)),y=H*.14+slot*H*.055,scale=1-slot*.06;c.save();c.globalAlpha=1-slot*.25;c.translate(W/2,y+bh/2-(1-e)*H*.2);c.scale(scale,scale);c.translate(-W/2,-(y+bh/2));rounded(c,x,y,bw,bh,15,'#f8f8fa');if(i===n-1){c.fillStyle='#e8506e';c.beginPath();c.arc(x+H*.1,y+bh/2,H*.045,0,TAU);c.fill();c.font='700 19px system-ui,sans-serif';c.fillStyle=C.ink;c.textAlign='left';c.textBaseline='middle';c.fillText(msgs[i],x+H*.2,y+bh/2)}c.restore()}
  } else if(id==='arc'){
    fill(c,C.ink);const pts=[[.06,.73],[.28,.31],[.5,.15],[.72,.31],[.94,.73]],p=frac(t/2.6)*4,i=Math.min(3,Math.floor(p)),q=p-i;
    c.fillStyle='#2f3b52';for(const [x,y] of pts){c.beginPath();c.arc(W*x,H*y,5,0,TAU);c.fill()}
    const x=mix(pts[i][0],pts[i+1][0],q)*W,y=mix(pts[i][1],pts[i+1][1],q)*H;c.fillStyle='#e07a3f';c.beginPath();c.arc(x,y,18,0,TAU);c.fill();
  } else if(id==='sliding-bands'){
    fill(c,C.ink);const bh=H/3,P=W*.8;for(let i=0;i<3;i++){const step=Math.floor(t/2),q=ease(clamp(frac(t/2)/.7)),raw=(step+q)*P/2*(i%2?-1:1),o=((raw%P)+P)%P;c.fillStyle=i===1?C.paper:'#f05032';for(let x=-P*2;x<W+P;x+=P)c.fillRect(x+o,i*bh+bh*.14,P*.42,bh*.72)}
  } else if(id==='roulette'){
    fill(c,C.ink);const n=8,phase=t%4.9,u=out(seg(phase,.3,3)),win=3,ang=-(4*TAU+(win+.5)/n*TAU)*u,cx=W*.32,cy=H*.53,R=H*.38;
    for(let i=0;i<n;i++){const a0=ang+i*TAU/n-Math.PI/2,a1=a0+TAU/n;c.fillStyle=i===win&&u>=1?C.pink:(i%2?'#232a3a':'#2c3446');c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,R,a0,a1);c.closePath();c.fill();const a=(a0+a1)/2;label(c,String(i+1),cx+Math.cos(a)*R*.72,cy+Math.sin(a)*R*.72,17,C.paper)}
    c.fillStyle='#38be86';c.beginPath();c.moveTo(cx-9,cy-R-10);c.lineTo(cx+9,cy-R-10);c.lineTo(cx,cy-R+6);c.closePath();c.fill();c.fillStyle=C.ink;c.beginPath();c.arc(cx,cy,7,0,TAU);c.fill();label(c,'RESULT',W*.74,H*.3,17,'#8b93a1');if(u>=1){c.save();c.translate(W*.74,H*.58);const b=back(seg(phase,3.3,.35));c.scale(Math.max(.01,b),Math.max(.01,b));label(c,String(win+1),0,0,96,C.paper);c.restore()}else label(c,'?',W*.74,H*.58,96,'#6e737e');
  } else if(id==='crosshatch'){
    fill(c,C.ink);const spacing=H/6,offset=frac(t/8)*spacing*2;c.lineWidth=Math.max(1,H/110);for(const [color,dir,shift] of [['#e8930c',1,offset],[C.paper,-1,-offset*.5]]){c.strokeStyle=color;c.globalAlpha=.85;for(let x=-H*2;x<W+H*2;x+=spacing){c.beginPath();c.moveTo(x+shift,0);c.lineTo(x+shift+dir*H,H);c.stroke()}}c.globalAlpha=1;
  } else if(id==='waffle-fill'){
    fill(c,C.paper);const phase=t%8,opacity=1-clamp((phase-7.2)/.8),n=10,s=H*.07,gap=H*.012,gw=n*s+(n-1)*gap,x0=W/2-gw/2-H*.3,y0=H/2-gw/2,on=37,count=Math.min(on,Math.max(0,Math.floor((phase-.4)/.055)+1));c.globalAlpha=opacity;for(let i=0;i<100;i++){const col=i%10,row=9-Math.floor(i/10),x=x0+col*(s+gap),y=y0+row*(s+gap);rounded(c,x,y,s,s,s*.25,i<count?'#6b5ae0':'#dedbd5')}label(c,count+'%',x0+gw+H*.27,H/2,H*.2,'#6b5ae0');c.globalAlpha=1;
  } else if(id==='stretch-text'){
    fill(c,'#e8506e');const chars='늘어나',size=H*.38,gap=size*1.04,x0=W/2-gap;for(let i=0;i<3;i++){const stretch=1+.9*Math.max(0,Math.sin(TAU*t/2-i*.7));c.save();c.translate(x0+i*gap,H*.78);c.scale(1,stretch);label(c,chars[i],0,-size*.5,size,i===2?C.paper:C.ink);c.restore()}
  } else if(id==='speed-lines'){
    fill(c,C.ink);const hash=i=>frac(Math.sin(i*127.1+311.7)*43758.5453);for(let i=0;i<26;i++){const length=W*(.15+.4*hash(i+9)),lap=W+length,speed=(1+Math.floor(hash(i+3)*3))*lap/8,x=frac((hash(i)*lap+t*speed)/lap)*lap-length,y=hash(i+17)*H,thickness=H*(.008+.03*hash(i+5));c.fillStyle=i%4?C.paper:'#e8930c';c.globalAlpha=.5+.5*hash(i+2);c.fillRect(x,y,length,thickness)}c.globalAlpha=1;
  } else if(id==='dot-matrix'){
    fill(c,C.ink);const spacing=H/10,cols=Math.ceil(W/spacing);for(let i=0;i<cols;i++){const level=.45+.3*Math.sin(i*.5+TAU*3*t/8)+.2*Math.sin(i*1.3-TAU*5*t/8),top=Math.round((1-level)*10);for(let j=0;j<10;j++){c.fillStyle=j>=top?(j===top?C.paper:'#e8506e'):'#893649';c.beginPath();c.arc(i*spacing+spacing/2,j*spacing+spacing/2,spacing*.36,0,TAU);c.fill()}}
  } else if(id==='dolly-zoom'){
    fill(c,C.ink);const phase=t%8,q=ease(phase<4?phase/4:(8-phase)/4),scale=mix(1.6,.7,q),step=58*scale;c.strokeStyle='#273143';c.lineWidth=3;for(let x=W/2;x<W;x+=step){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke()}for(let x=W/2-step;x>0;x-=step){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke()}for(let y=H/2;y<H;y+=step){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}for(let y=H/2-step;y>0;y-=step){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}rounded(c,W/2-30,H/2-58,60,116,12,'#e7d6bc');
  } else if(id==='perspective-tilt'){
    fill(c,C.ink);const phase=t%8,q=ease(phase<4?phase/4:(8-phase)/4),cx=W/2,cy=H/2,w=180,h=128,topW=w*(1-.17*q),bottomW=w*(1+.07*q),halfH=h/2*(1-.38*q);c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(cx,cy+h*.68,w*.62,15,0,0,TAU);c.fill();const grad=c.createLinearGradient(0,cy-halfH,0,cy+halfH);grad.addColorStop(0,'#e7d6bc');grad.addColorStop(1,'#b9a888');c.fillStyle=grad;c.beginPath();c.moveTo(cx-topW/2,cy-halfH);c.lineTo(cx+topW/2,cy-halfH);c.lineTo(cx+bottomW/2,cy+halfH);c.lineTo(cx-bottomW/2,cy+halfH);c.closePath();c.fill();
  } else if(id==='clock-wipe'){
    const s=transitionState(t),q=ease(s.p),cx=W/2,cy=H/2,R=Math.hypot(W,H);sourceScreen(c,s.from,'#21b795');if(q>0){c.save();c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+q*TAU);c.closePath();c.clip();sourceScreen(c,s.to,'#21b795');c.restore()}
  } else if(id==='blinds'){
    const s=transitionState(t),q=ease(s.p),N=8,bh=H/N;landscapeScene(c,s.from==='B');for(let i=0;i<N;i++){const v=clamp(q*1.6-i*.6/N);if(v<=0)continue;c.save();c.beginPath();c.rect(0,i*bh+bh/2-bh*v/2-.5,W,bh*v+1);c.clip();landscapeScene(c,s.to==='B');c.restore();if(v<1){c.fillStyle=`rgba(0,0,0,${.25*(1-v)})`;c.fillRect(0,i*bh+bh/2-bh*v/2,W,bh*v)}}
  } else if(id==='scan-print'){
    const s=transitionState(t),q=ease(s.p),y=q*H;landscapeScene(c,s.from==='B');if(q>0){c.save();c.beginPath();c.rect(0,0,W,y);c.clip();landscapeScene(c,s.to==='B');for(let i=0;i<6;i++){c.fillStyle=`rgba(244,241,234,${.1*(6-i)/6})`;c.fillRect(0,y-i*H*.03-H*.01,W,H*.006)}c.restore();if(q<1){c.fillStyle='#f05032';c.fillRect(0,y-H*.008,W,H*.016);c.fillStyle='rgba(255,255,255,.5)';c.fillRect(0,y-H*.003,W,H*.006)}}
  } else if(id==='camera-2-5d'){
    fill(c,C.ink);const angle=Math.sin(TAU*t/5)*.38,cx=W/2,cy=H/2;for(const [depth,w,h,color] of [[-65,290,188,'#1e344b'],[0,190,134,'#39607a'],[65,112,108,'#e07a3f']]){const shift=depth*Math.sin(angle)*1.6,half=w*Math.cos(angle)/2,skew=h*Math.sin(angle)*.11;c.fillStyle=color;c.beginPath();c.moveTo(cx+shift-half,cy-h/2-skew);c.lineTo(cx+shift+half,cy-h/2+skew);c.lineTo(cx+shift+half,cy+h/2+skew);c.lineTo(cx+shift-half,cy+h/2-skew);c.closePath();c.fill()}
  } else if(id==='roll'){
    const angle=Math.sin(TAU*t/8)*7*Math.PI/180;c.save();c.translate(W/2,H/2);c.rotate(angle);c.translate(-W/2,-H/2);c.fillStyle='#141821';c.fillRect(-100,-100,W+200,H+200);c.fillStyle='#20633f';c.fillRect(-100,-100,W+200,H*.64+100);c.fillStyle='#9fc7b0';c.fillRect(-100,H*.64,W+200,H*.025);rounded(c,W*.45,H*.38,W*.1,H*.18,8,'#f3efe8');c.restore();
  } else if(id==='split-join'){
    fill(c,C.ink);const phase=t%4,arrival=back(seg(phase,.4,.9)),off=(1-arrival)*W*.45,size=H*.51,cx=W/2,cy=H/2;for(const side of [-1,1]){c.save();c.translate(side*off,0);c.beginPath();c.rect(side<0?cx-size/2:cx,cy-size/2,size/2,size);c.clip();mark(c,cx,cy,size,'#f05032');c.restore()}const flash=clamp(1-Math.abs(phase-1.35)/.15);if(flash>0){c.globalAlpha=flash;c.fillStyle=C.paper;c.fillRect(cx-H*.01,cy-size,H*.02,size*2);c.globalAlpha=1}
  } else if(id==='pan'){
    fill(c,C.ink);const phase=t%7.2,q=ease(phase<3.6?phase/3.6:(7.2-phase)/3.6),shift=-W*.33*q,spacing=46;c.strokeStyle='#263146';c.lineWidth=2;for(let x=-W;x<W*2;x+=spacing){const px=x+shift;c.beginPath();c.moveTo(px,0);c.lineTo(px,H);c.stroke()}for(let y=0;y<H;y+=spacing){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}c.fillStyle='#e07a3f';c.beginPath();c.arc(W*.27+shift,H*.4,12,0,TAU);c.fill();rounded(c,W*.4-28,H/2-33,56,66,10,'#e7d6bc');
  } else if(id==='tilt'){
    fill(c,C.ink);const phase=t%7.2,q=ease(phase<3.6?phase/3.6:(7.2-phase)/3.6),shift=H*.3*(q-.5),spacing=46;c.strokeStyle='#263146';c.lineWidth=2;for(let x=0;x<W;x+=spacing){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke()}for(let y=-spacing*4;y<H+spacing*4;y+=spacing){const py=y+shift;c.beginPath();c.moveTo(0,py);c.lineTo(W,py);c.stroke()}c.fillStyle='#4fb8e8';c.beginPath();c.arc(W*.56,H*.5+shift,14,0,TAU);c.fill();
  } else if(id==='dolly'){
    const phase=t%8,q=ease(phase<4?phase/4:(8-phase)/4),cx=W/2,cy=H/2,bg=c.createRadialGradient(cx,cy,20,cx,cy,W*.6);bg.addColorStop(0,'#2a3550');bg.addColorStop(1,C.ink);fill(c,bg);c.strokeStyle='rgba(84,107,143,.25)';c.lineWidth=2;for(let i=1;i<=7;i++){const r=i*H*.19*(1+q*.32);c.beginPath();c.ellipse(cx,cy,r*1.9,r*.65,0,0,TAU);c.stroke()}const size=H*(.2+.24*q);rounded(c,cx-size/2,cy-size/2,size,size,size*.2,'#e7d6bc');
  } else if(id==='pedestal'){
    fill(c,C.ink);const phase=t%8,q=ease(phase<4?phase/4:(8-phase)/4);for(const [spacing,r,color,shift,offset] of [[90,10,'#39506a',H*.16*q,0],[70,15,'#4fb8e8',H*.38*q,35]]){c.fillStyle=color;for(let x=offset;x<W+spacing;x+=spacing)for(let y=-spacing*2;y<H+spacing*2;y+=spacing){c.beginPath();c.arc(x,y+shift,r,0,TAU);c.fill()}}
  } else if(id==='zoom'){
    fill(c,C.ink);const phase=t%8,q=ease(phase<4?phase/4:(8-phase)/4),scale=mix(1,1.7,q);c.save();c.translate(W/2,H/2);c.scale(scale,scale);c.translate(-W/2,-H/2);c.fillStyle='#39506a';for(let x=W/2-600;x<W/2+600;x+=50)for(let y=H/2-400;y<H/2+400;y+=50){c.beginPath();c.arc(x,y,7,0,TAU);c.fill()}rounded(c,W/2-23,H/2-23,46,46,10,'#e07a3f');c.restore();
  } else if(id==='panel-zoom-out'){
    const s=transitionState(t),q=clamp(s.p),layers=['#216687',C.paper,null];sourceScreen(c,s.from,'#2ba8e0');for(let i=0;i<3;i++){const p=ease(clamp(q*1.55-i*.25));if(p<=0)continue;const w=W*p,h=H*p;c.save();c.beginPath();c.rect((W-w)/2,(H-h)/2,w,h);c.clip();if(i<2)fill(c,layers[i]);else sourceScreen(c,s.to,'#2ba8e0');c.restore()}
  } else if(id==='equalizer-stripes'){
    fill(c,C.ink);const n=12,bh=H/n;for(let i=0;i<n;i++){const q=.2+.8*Math.abs(Math.sin(TAU*t/4+i*.7)*Math.cos(TAU*t/8-i*.3));c.fillStyle=i%2?'#e8930c':C.paper;c.fillRect(0,i*bh+bh*(1-q)/2,W,bh*q*.9)}
  } else if(id==='letter-slam'){
    fill(c,'#e8506e');const chars=[...'오늘도간다'],size=Math.min(H*.42,W*.82/chars.length),gap=size*1.02,x0=W/2-gap*(chars.length-1)/2,phase=t%4;for(let i=0;i<chars.length;i++){const q=(phase-.2-i*.28)/.14;if(q<0||phase>3.7)continue;const scale=1+1.3*(1-out(clamp(q)));c.save();c.translate(x0+i*gap,H/2);c.scale(scale,scale);label(c,chars[i],H*.02,H*.03,size,C.ink);label(c,chars[i],0,0,size,C.paper);c.restore()}
  } else if(id==='gravity-throw'){
    fill(c,C.ink);const ground=H*.9,x0=W*.12,x1=W*.74,top=H*.14,elapsed=t%8-.6,p=clamp(elapsed/1.5),curve=v=>ground-H*.09-4*(ground-H*.09-top)*v*(1-v);c.fillStyle='#202734';c.fillRect(0,ground,W,H-ground);c.setLineDash([H*.012,H*.028]);c.strokeStyle='rgba(244,241,234,.32)';c.lineWidth=H*.009;c.beginPath();for(let i=0;i<=40;i++){const v=i/40*Math.max(p,.001);i?c.lineTo(mix(x0,x1,v),curve(v)):c.moveTo(mix(x0,x1,v),curve(v))}c.stroke();c.setLineDash([]);let x=mix(x0,x1,p),y=curve(p),rot=p*TAU*1.25,squash=1;if(elapsed>1.5){const d=elapsed-1.5,b=Math.min(d,.9);x+=b*W*.08*(1-b/1.8);y-=Math.abs(Math.sin(Math.min(d,1.2)*Math.PI*2.5))*H*.12*Math.exp(-d*3);rot+=b*1.1;squash=1-.3*Math.exp(-d*9)*Math.max(0,Math.cos(d*25))}c.save();c.translate(x,y+H*.09*(1-squash));c.scale(1/squash,squash);c.rotate(rot);rounded(c,-H*.09,-H*.09,H*.18,H*.18,H*.035,'#2b7fe0');c.fillStyle=C.paper;c.beginPath();c.arc(H*.03,-H*.03,H*.025,0,TAU);c.fill();c.restore();
  } else if(id==='block-wipe'){
    const s=transitionState(t),q=clamp(s.p*1.15),cols=10,rows=4,cw=W/cols,ch=H/rows;sourceScreen(c,s.from,'#21b795');c.save();c.beginPath();for(let i=0;i<cols*rows;i++){const h=frac(Math.sin((i+3)*127.1+311.7)*43758.5453);if(q>h*.92)c.rect(i%cols*cw-.5,Math.floor(i/cols)*ch-.5,cw+1,ch+1)}c.clip();sourceScreen(c,s.to,'#21b795');c.restore();
  } else if(id==='ripple-wipe'){
    const s=transitionState(t),p=clamp(s.p),R=Math.hypot(W,H)*.525,cx=W/2,cy=H/2;sourceScreen(c,s.from,'#f05032');for(let j=0;j<3;j++){const r=R*(out(p)*1.25-j*.18);if(r<=0)continue;c.globalAlpha=(1-j*.28)*(1-seg(p,.7,.3));c.strokeStyle='#f05032';c.lineWidth=H*(.06-j*.015);c.beginPath();c.arc(cx,cy,r,0,TAU);c.stroke()}c.globalAlpha=1;const radius=R*ease(seg(p,.3,.7));if(radius>0){c.save();c.beginPath();c.arc(cx,cy,radius,0,TAU);c.clip();sourceScreen(c,s.to,'#f05032');c.restore()}
  } else if(id==='halftone-gradient'){
    fill(c,C.ink);const s=H/9,span=W+H*1.6,pos=-H*.8+span*frac(t/4);c.fillStyle='#e8506e';for(let y=s/2;y<H;y+=s)for(let x=s/2;x<W+s;x+=s){const u=x+(y-H/2)*.6,q=clamp(1-Math.abs(u-pos)/(H*1.1)),r=s*(.08+.4*q);c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}
  } else if(id==='moire-grid'){
    const pw=400,ph=127,pitch=6,theta=.055+.018*Math.sin(t*.65),phase=t*.7,surface=draw.moireSurface||(draw.moireSurface=document.createElement('canvas'));if(surface.width!==pw||surface.height!==ph){surface.width=pw;surface.height=ph}const sx=surface.getContext('2d'),img=sx.createImageData(pw,ph),data=img.data,cs=Math.cos(theta),sn=Math.sin(theta);for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){const u=TAU*y/pitch,v=TAU*(y*cs+x*sn)/pitch+phase,a=Math.cos(u),b=Math.cos(v),beat=.5+.5*Math.cos(u-v),fine=.5+.25*(a+b),light=clamp(.08+.62*beat+.22*fine),i=(y*pw+x)*4;data[i]=Math.round(10+185*light);data[i+1]=Math.round(25+220*light);data[i+2]=Math.round(30+205*light);data[i+3]=255}sx.putImageData(img,0,0);c.imageSmoothingEnabled=true;c.drawImage(surface,0,0,W,H);
  } else if(id==='triple-split'){
    const s=transitionState(t),p=clamp(s.p),sk=.35,U=W+sk*H,bw=U/3;sourceScreen(c,s.from,'#6b5ae0');c.save();c.beginPath();for(let i=0;i<3;i++){const q=ease(clamp(p*1.7-i*.35)),y=q*H,u=i*bw;if(q<=0)continue;c.moveTo(u,0);c.lineTo(u+bw+1,0);c.lineTo(u+bw+1-sk*y,y);c.lineTo(u-sk*y,y);c.closePath()}c.clip();sourceScreen(c,s.to,'#6b5ae0');c.restore();
  } else if(id==='freeze-frame'){
    fill(c,C.ink);const p=frac(t/3),x=W*(p<.26?mix(.06,.52,p/.26):p<.52?.52:p<.6?mix(.52,.9,(p-.52)/.08):.9),frozen=p>=.3&&p<=.5;c.fillStyle='#38be86';c.beginPath();c.arc(x,H/2,H*.08,0,TAU);c.fill();if(frozen){c.strokeStyle='#e7d6bc';c.lineWidth=H*.012;c.beginPath();c.roundRect(H*.025,H*.025,W-H*.05,H-H*.05,H*.03);c.stroke();c.fillStyle='#e7d6bc';c.font='800 20px system-ui,sans-serif';c.textBaseline='top';c.textAlign='left';c.fillText('FREEZE',H*.08,H*.07)}
  } else if(id==='repeater'){
    fill(c,C.ink);const p=t%8,n=Math.floor(mix(1,12.99,ease(seg(p,.5,2.6)))),cx=W/2,cy=H/2,rot=TAU*p/8*.35,colors=['#17a88a',C.paper,'#72cbb5','#166658'];for(let i=0;i<n;i++){const born=clamp((p-.5-i*2.6/12)/.25),a=rot+i/12*TAU;c.save();c.translate(cx,cy);c.rotate(a);c.globalAlpha=born;rounded(c,H*.12,-H*.04,H*.24*Math.max(.01,back(born)),H*.08,H*.04,colors[i%4]);c.restore()}label(c,'×'+n,W-H*.2,H*.18,H*.13,'#17a88a');
  } else if(id==='save-bookmark'){
    const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#633a39');bg.addColorStop(1,C.ink);fill(c,bg);c.fillStyle='rgba(255,255,255,.045)';c.beginPath();c.arc(W*.22,H*.25,H*.5,0,TAU);c.arc(W*.79,H*1.05,H*.36,0,TAU);c.fill();const phase=t%4,cx=W/2,top=mix(-H*.5,H*.18,back(seg(phase,.4,.6))),bw=H*.26,bh=H*.38,f=ease(seg(phase,1.2,.5));c.beginPath();c.moveTo(cx-bw/2,top);c.lineTo(cx+bw/2,top);c.lineTo(cx+bw/2,top+bh);c.lineTo(cx,top+bh*.76);c.lineTo(cx-bw/2,top+bh);c.closePath();c.lineWidth=H*.025;c.strokeStyle=C.paper;c.stroke();c.save();c.clip();c.fillStyle='#f05032';c.fillRect(cx-bw/2,top,bw,bh*f);c.restore();const msg=seg(phase,1.8,.3)*(1-seg(phase,2.75,.35));if(msg>0){c.globalAlpha=msg;rounded(c,cx-H*.43,H*.76,H*.86,H*.16,H*.08,'rgba(0,0,0,.65)');label(c,'저장했어요',cx,H*.84,H*.105,C.paper);c.globalAlpha=1}
  } else if(id==='share-fling'){
    const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#633a39');bg.addColorStop(1,C.ink);fill(c,bg);c.fillStyle='rgba(255,255,255,.045)';c.beginPath();c.arc(W*.22,H*.25,H*.5,0,TAU);c.arc(W*.79,H*1.05,H*.36,0,TAU);c.fill();
    const phase=t%4,u=seg(phase,1.15,1.2),q=out(u),arrival=back(seg(phase,.4,.42)),cx=W*.3+q*W*.55,cy=H*.68-q*H*.4-Math.sin(Math.PI*q)*H*.1,scale=Math.max(.01,arrival*(1-.45*q)),bank=.08*Math.sin(Math.PI*q);
    c.save();c.translate(cx,cy);c.scale(scale,scale);c.globalAlpha=1-seg(q,.92,.08);
    const N=[H*.27,-H*.29],C0=[-H*.18,H*.12],L=[-H*.4,H*(.04+bank)],R=[-H*.06,H*(.38-bank)],K=[-H*.13,H*(.21-bank*.5)];
    const face=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};
    face([L,N,C0],'#fffdf8');face([C0,N,R],'#dfe8e8');face([C0,R,K],'#a6b5b7');
    c.strokeStyle='#809395';c.lineWidth=1.8;c.lineJoin='round';c.beginPath();c.moveTo(...L);c.lineTo(...N);c.lineTo(...R);c.lineTo(...K);c.lineTo(...C0);c.stroke();c.strokeStyle='#b7c6c7';c.lineWidth=1.2;c.beginPath();c.moveTo(...C0);c.lineTo(...N);c.stroke();c.restore();
    const msg=seg(phase,2.2,.4);if(msg>0){c.globalAlpha=msg;rounded(c,W/2-H*.5,H*.76,H,H*.16,H*.08,'rgba(0,0,0,.65)');label(c,'링크를 보냈어요',W/2,H*.84,H*.105,C.paper);c.globalAlpha=1}
  } else if(id==='spring-follow'){
    fill(c,C.paper);const targets=[[.2,.5],[.72,.3],[.4,.72],[.78,.66]],times=[0,.6,2.6,4.8],phase=t%8;let j=0;for(let i=1;i<times.length;i++)if(phase>=times[i])j=i;const prev=targets[Math.max(0,j-1)],goal=targets[j],dt=phase-times[j],s=1-Math.exp(-dt*4.2)*Math.cos(dt*10),x=mix(prev[0],goal[0],s)*W,y=mix(prev[1],goal[1],s)*H;targets.forEach(([tx,ty],i)=>{c.strokeStyle=i===j?C.ink:'rgba(20,22,27,.18)';c.lineWidth=H*.012;c.strokeRect(tx*W-H*.07,ty*H-H*.07,H*.14,H*.14)});if(j){c.strokeStyle='rgba(20,22,27,.25)';c.lineWidth=H*.008;c.setLineDash([H*.02,H*.02]);c.beginPath();c.moveTo(x,y);c.lineTo(goal[0]*W,goal[1]*H);c.stroke();c.setLineDash([])}c.fillStyle='#2b7fe0';c.beginPath();c.arc(x,y,H*.06,0,TAU);c.fill();
  } else if(id==='rack-focus'){
    fill(c,C.ink);const phase=t%8,p=ease(phase<4?phase/4:(8-phase)/4),focus=seg(p,.4,.2),r=H*.22;for(const [x,color,blur,alpha] of [[W*.28,'#e7d6bc',focus*9,1-focus*.45],[W*.72,'#e07a3f',(1-focus)*9,.55+focus*.45]]){c.save();c.filter=`blur(${blur}px)`;c.globalAlpha=alpha;rounded(c,x-r/2,H/2-r/2,r,r,r*.17,color);c.restore()}
  } else if(id==='cross-dissolve'){
    const phase=t%3,p=ease(seg(phase,.9,.75));fill(c,'#e7d6bc');label(c,'A',W/2,H/2,92,C.ink);c.save();c.globalAlpha=p;fill(c,'#4fb8e8');label(c,'B',W/2,H/2,92,C.ink);c.restore();
  } else if(id==='pixel-dissolve'){
    const phase=t%3.2,q=seg(phase,1.25,.7),cols=12,rows=6,cw=W/cols,ch=H/rows;fill(c,'#4fb8e8');for(let i=0;i<cols*rows;i++){const hash=frac(Math.sin((i+1)*127.1+311.7)*43758.5453),threshold=hash*.9;if(q<threshold){c.fillStyle='#e7d6bc';c.fillRect(i%cols*cw,Math.floor(i/cols)*ch,cw+.5,ch+.5)}}
  } else if(id==='diamond-wipe'){
    const s=transitionState(t),p=clamp(s.p),g=H/3.2,cx=W/2,cy=H/2,D=Math.hypot(cx,cy);sourceScreen(c,s.from,'#21b795');c.save();c.beginPath();for(let x=-g;x<=W+g;x+=g)for(let y=-g;y<=H+g;y+=g){const d=Math.hypot(x-cx,y-cy)/D,size=out(p*1.9-d*.9)*g*1.02;if(size<=0)continue;c.moveTo(x,y-size);c.lineTo(x+size,y);c.lineTo(x,y+size);c.lineTo(x-size,y);c.closePath()}c.clip();sourceScreen(c,s.to,'#21b795');c.restore();
  } else if(id==='whip-pan'){
    const phase=t%2.6,p=ease(seg(phase,.99,.29)),blur=7*Math.sin(Math.PI*seg(phase,.99,.29));fill(c,C.ink);c.save();c.beginPath();c.rect(0,0,W,H);c.clip();c.filter=`blur(${blur}px)`;c.save();c.translate(-W*p,0);fill(c,'#e7d6bc');label(c,'A',W/2,H/2,90,C.ink);c.restore();c.save();c.translate(W*(1-p),0);fill(c,'#4fb8e8');label(c,'B',W/2,H/2,90,C.ink);c.restore();c.restore();
  } else if(id==='corner-wipe'){
    const s=transitionState(t),p=clamp(s.p),corners=[[0,0,1,1],[W,0,-1,1],[W,H,-1,-1],[0,H,1,-1]];sourceScreen(c,s.from,'#21b795');
    corners.forEach(([x,y,dx,dy],i)=>{const q=ease(clamp(p*1.3-i*.1));if(!q)return;c.save();c.beginPath();c.moveTo(x,y);c.lineTo(x+dx*W*1.02*q,y);c.lineTo(x,y+dy*H*1.02*q);c.closePath();c.clip();sourceScreen(c,s.to,'#21b795');c.restore()});
  } else if(id==='impact-flash'){
    const s=transitionState(t),p=clamp(s.p),v=seg(p,.45,.45),radius=Math.hypot(W,H)*.7*out(v),fade=1-seg(p,.45,.5),flash=1-clamp(Math.abs(p-.5)/.14);sourceScreen(c,p<.5?s.from:s.to,'#f05032');
    if(radius>0&&p<.95){c.save();c.globalAlpha=fade;c.strokeStyle='#fff';c.lineWidth=H*.08*fade+1;c.beginPath();c.arc(W/2,H/2,radius,0,TAU);c.stroke();c.restore()}if(flash>0){c.fillStyle=`rgba(255,255,255,${flash})`;c.fillRect(0,0,W,H)}
  } else if(id==='circle-split'){
    const s=transitionState(t),p=clamp(s.p),r=(Math.hypot(W,H)/2+2)*ease(clamp(p*1.1)),rot=ease(p)*Math.PI,g=r*.22*(1-ease(p));sourceScreen(c,s.from,'#f05032');if(r>0){
      c.save();c.beginPath();c.save();c.translate(W/2,H/2);c.rotate(rot);c.moveTo(r,-g);c.arc(0,-g,r,0,Math.PI,true);c.closePath();c.moveTo(-r,g);c.arc(0,g,r,Math.PI,0,true);c.closePath();c.restore();c.clip();sourceScreen(c,s.to,'#f05032');c.restore()}
  } else if(id==='drip-wipe'){
    const s=transitionState(t),q=ease(s.p),n=5,cw=W/n;sourceScreen(c,s.from,'#f05032');c.save();c.beginPath();c.rect(0,0,W,H*.2*q);for(let i=0;i<n;i++){const random=frac(Math.sin((i+7)*127.1+311.7)*43758.5453),length=clamp(q*1.45-random*.4)*H*1.25,width=cw*(.62+.38*q)+1,x=i*cw+(cw-width)/2;if(length>0)c.roundRect(x,-width,width,length+width,[0,0,width/2,width/2])}c.clip();sourceScreen(c,s.to,'#f05032');c.restore();
  } else if(id==='quad-open'){
    const s=transitionState(t),q=ease(s.p),dx=W/2*q,dy=H/2*q;sourceScreen(c,s.to,'#6b5ae0');[[0,0,-1,-1],[1,0,1,-1],[0,1,-1,1],[1,1,1,1]].forEach(([col,row,sx,sy])=>{const ox=sx*dx,oy=sy*dy;c.save();c.beginPath();c.rect(col*W/2+ox,row*H/2+oy,W/2,H/2);c.clip();c.translate(ox,oy);sourceScreen(c,s.from,'#6b5ae0');c.restore()});
  } else if(id==='four-panel'){
    const s=transitionState(t),order=[[0,0],[1,0],[1,1],[0,1]],cw=W/2,ch=H/2;sourceScreen(c,s.from,'#6b5ae0');c.save();c.beginPath();order.forEach(([col,row],i)=>{const q=ease(s.p*2-i*.33),w=cw*q;if(q>0)c.rect(col*cw+(cw-w)/2-.5,row*ch-.5,w+1,ch+1)});c.clip();sourceScreen(c,s.to,'#6b5ae0');c.restore();
  } else if(id==='frame-stack'){
    const s=transitionState(t),q=i=>ease(s.p*1.5-i*.14);sourceScreen(c,s.from,'#2ba8e0');c.save();c.beginPath();c.rect(0,0,W,H/2*q(0)+.5);c.rect(W-W/2*q(1)-.5,0,W/2*q(1)+.5,H);c.rect(0,H-H/2*q(2)-.5,W,H/2*q(2)+.5);c.rect(0,0,W/2*q(3)+.5,H);c.clip();sourceScreen(c,s.to,'#2ba8e0');c.restore();
  } else if(id==='impact-shake'){
    const p=frac(t/4),hit=.28,shake=p>hit&&p<hit+.22?(1-(p-hit)/.22)*H*.05:0,dx=Math.sin(p*240)*shake,dy=Math.cos(p*194)*shake*.7,scale=p<hit?2.6-1.6*Math.pow(p/hit,2):1;fill(c,C.ink);c.save();c.translate(dx,dy);c.fillStyle='#443b87';[[.06,.5],[.2,.62],[.72,.55],[.86,.42]].forEach(([x,y])=>c.fillRect(x*W,y*H,W*.1,H));c.fillRect(0,H*.9,W,2);c.translate(W/2,H*.58);c.scale(scale,scale);c.rotate(-.05);rounded(c,-H*.55,-H*.2,H*1.1,H*.4,H*.06,'#6b5ae0');label(c,'세일',0,0,H*.3,C.paper);c.restore();
  } else if(id==='rgb-split'){
    const phase=t%3.2,split=phase<.6?0:phase<1.2?ease((phase-.6)/.6):phase<2?1:phase<2.6?1-ease((phase-2)/.6):0,offset=H*.045*split;fill(c,'#0c0f15');c.save();c.globalCompositeOperation='screen';label(c,'MOTION',W/2-offset,H/2,H*.24,'#ff3b3b');label(c,'MOTION',W/2+offset,H/2,H*.24,'#3b7bff');c.restore();label(c,'MOTION',W/2,H/2,H*.24,'#e7d6bc');
  } else if(id==='glitch'){
    const phase=t%3.2,burst=phase>1.4&&phase<1.9,frame=Math.floor(phase*18),width=H*.23;fill(c,'#0c0f15');label(c,'GLITCH',W/2,H/2,width,'#e7d6bc');if(burst){const strips=[[.37,.48,-1,'#ff4d6d'],[.51,.61,1,'#4fb8e8'],[.63,.68,-1,'#ff4d6d']];strips.forEach(([a,b,dir,color])=>{c.save();c.beginPath();c.rect(0,H*a,W,H*(b-a));c.clip();label(c,'GLITCH',W/2+dir*(frame%2?H*.045:-H*.035),H/2,width,color);c.restore()})}
  } else if(id==='film-grain'){
    const frame=Math.floor(t*24),bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#c9a27a');bg.addColorStop(1,'#5b4636');fill(c,bg);c.fillStyle='#3a2c22';c.beginPath();c.arc(W*.3,H*.62,H*.34,0,TAU);c.fill();c.fillStyle='#f1dcc0';c.beginPath();c.arc(W*.72,H*.36,H*.16,0,TAU);c.fill();c.fillStyle='#2a2018';c.fillRect(0,H*.82,W,H*.18);
    const grain=draw.grainCanvas||(draw.grainCanvas=document.createElement('canvas'));if(grain.width!==200||grain.height!==64){grain.width=200;grain.height=64}if(draw.grainFrame!==frame){draw.grainFrame=frame;const x=grain.getContext('2d'),img=x.createImageData(200,64),data=img.data;let seed=frame*7919+13;for(let i=0;i<data.length;i+=4){seed=seed*16807%2147483647;const v=seed/2147483647*255;data[i]=data[i+1]=data[i+2]=v;data[i+3]=46}x.putImageData(img,0,0)}c.save();c.globalCompositeOperation='overlay';c.drawImage(grain,0,0,W,H);c.restore();if(frame%72<5){c.fillStyle='rgba(255,255,255,.55)';c.fillRect(W*frac(frame*.37),0,1,H)}const vignette=c.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.62);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.55)');c.fillStyle=vignette;c.fillRect(0,0,W,H);
  } else if(id==='light-leak'){
    const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#1b2430');bg.addColorStop(1,'#121722');fill(c,bg);label(c,'SCENE',W/2,H/2,H*.18,'#55617a');const phase=t%3,q=ease(seg(phase,1.65,.75)),x=mix(W*1.25,W*.22,q);c.save();c.translate(x,H/2);c.scale(1.7,1);const glow=c.createRadialGradient(0,0,H*.03,0,0,W*.52);glow.addColorStop(0,'rgba(255,170,90,.9)');glow.addColorStop(.45,'rgba(255,120,60,.35)');glow.addColorStop(.72,'rgba(255,120,60,0)');c.fillStyle=glow;c.fillRect(-W*.55,-H,W*1.1,H*2);c.restore();
  } else if(id==='bloom-glow'){
    fill(c,'#0c0f17');const pulse=.5+.5*Math.sin(TAU*t/2.4),size=H*.235;c.save();c.textAlign='center';c.textBaseline='middle';c.font=`800 ${size}px system-ui,sans-serif`;c.fillStyle='#9ff3d6';c.shadowColor='#38be86';for(const [alpha,blur] of [[.35,60],[.65,34],[1,8]]){c.globalAlpha=alpha*(.45+.55*pulse);c.shadowBlur=blur*(.5+.5*pulse);c.fillText('NEON',W/2,H/2)}c.restore();
  } else if(id==='datamosh'){
    const phase=t%3.2,p=ease(seg(phase,.96,1.6)),cw=W/10,ch=H/5;fill(c,'#4fb8e8');for(let i=0;i<50;i++){const col=i%10,row=Math.floor(i/10),h=frac(Math.sin((i+3)*127.1+311.7)*43758.5453),q=ease(seg(p,.1+h*.2,.6)),shift=H*.15*q*(1-q*.45),color=q<.25?'#e07a3f':q<.78?'#b98bbf':'#4fb8e8';c.fillStyle=color;c.globalAlpha=.78;c.fillRect(col*cw+shift,row*ch,cw+.8,ch+.8)}c.globalAlpha=1;
  } else if(id==='vector-crt'){
    fill(c,'#030805');const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],angle=t*TAU/8;
    const project=(v,a)=>{const x=v[0]*Math.cos(a)-v[2]*Math.sin(a),z=v[0]*Math.sin(a)+v[2]*Math.cos(a),y=v[1]*Math.cos(.5)-z*Math.sin(.5),z2=v[1]*Math.sin(.5)+z*Math.cos(.5),k=3/(4+z2);return[W*.36+x*H*.27*k,H/2+y*H*.27*k]};
    c.save();c.shadowColor='#3cff8a';for(const [alpha,offset,blur] of [[.1,-.12,5],[.12,-.06,5],[1,0,14]]){c.globalAlpha=alpha;c.strokeStyle=alpha===1?'#8affb8':'#2fd47a';c.lineWidth=alpha===1?2.4:2;c.shadowBlur=blur;c.beginPath();for(const [a,b] of edges){const p=project(vertices[a],angle+offset),q=project(vertices[b],angle+offset);c.moveTo(...p);c.lineTo(...q)}c.stroke()}c.globalAlpha=1;c.shadowBlur=8;c.fillStyle='#8affb8';c.font=`700 ${H*.13}px ui-monospace,monospace`;c.textAlign='left';c.textBaseline='middle';c.fillText('VECTOR',W*.6,H*.42);c.globalAlpha=.6;c.fillText('SCAN '+String(Math.floor(t*12)%100).padStart(2,'0'),W*.6,H*.6);c.restore();c.fillStyle='rgba(0,0,0,.35)';for(let y=0;y<H;y+=4)c.fillRect(0,y,W,1);const vignette=c.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.6);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.7)');c.fillStyle=vignette;c.fillRect(0,0,W,H);
  } else if(id==='match-cut'){
    const phase=t%3.2,after=phase>=1.6,u=after?phase-1.6:phase,ballX=after?W*.5+u*W*.16:W*.34+u*W*.1,ballY=after?H*.38+u*H*.10:H*.63-u*H*.156,r=H*.19,hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453);
    if(!after){const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#758da3');sky.addColorStop(1,'#d5aa8b');fill(c,sky);c.fillStyle='#576c77';for(let i=0;i<8;i++){const x=i*W*.14,h=H*(.20+hash(i)*.22);c.fillRect(x,H*.62-h,W*.085,h)}c.fillStyle='#a86b4e';c.beginPath();c.moveTo(0,H*.74);c.lineTo(W,H*.68);c.lineTo(W,H);c.lineTo(0,H);c.fill();c.strokeStyle='rgba(255,236,211,.65)';c.lineWidth=2;c.beginPath();c.moveTo(W*.1,H);c.lineTo(W*.34,H*.73);c.moveTo(W*.9,H);c.lineTo(W*.7,H*.71);c.stroke();c.strokeStyle='#303840';c.lineWidth=6;c.beginPath();c.moveTo(W*.76,H*.23);c.lineTo(W*.76,H*.76);c.stroke();c.strokeStyle='#eee3d1';c.lineWidth=4;c.strokeRect(W*.70,H*.18,W*.12,H*.19);c.beginPath();c.ellipse(W*.76,H*.41,W*.05,H*.025,0,0,TAU);c.stroke()}else{const sky=c.createRadialGradient(W*.47,H*.45,5,W*.47,H*.45,W*.68);sky.addColorStop(0,'#334267');sky.addColorStop(1,'#080d1c');fill(c,sky);for(let i=0;i<85;i++){const x=hash(i*7)*W,y=hash(i*11+4)*H;c.globalAlpha=.25+hash(i*19)*.65;c.fillStyle=i%7?'#dce6f7':'#f2bd8d';c.fillRect(x,y,i%12?1.2:2.2,i%12?1.2:2.2)}c.globalAlpha=1;c.strokeStyle='rgba(179,192,228,.25)';c.lineWidth=2;c.beginPath();c.ellipse(W*.52,H*.49,W*.35,H*.20,-.22,0,TAU);c.stroke()}
    c.save();c.translate(ballX,ballY);c.rotate(phase*.9);const orb=c.createRadialGradient(-r*.3,-r*.35,r*.1,0,0,r*1.15);if(after){orb.addColorStop(0,'#ffd39a');orb.addColorStop(.6,'#d7804f');orb.addColorStop(1,'#693951')}else{orb.addColorStop(0,'#ffa960');orb.addColorStop(.7,'#dc712e');orb.addColorStop(1,'#8f361f')}c.fillStyle=orb;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.save();c.beginPath();c.arc(0,0,r,0,TAU);c.clip();if(after){for(let i=0;i<14;i++){c.fillStyle=`rgba(110,57,61,${.1+hash(i)*.25})`;c.beginPath();c.ellipse((hash(i+7)-.5)*r*2,(hash(i+13)-.5)*r*2,r*(.1+hash(i+21)*.2),r*.045,(hash(i+2)-.5),0,TAU);c.fill()}}else{c.strokeStyle='#48251e';c.lineWidth=3;c.beginPath();c.moveTo(-r,0);c.quadraticCurveTo(0,r*.25,r,0);c.moveTo(0,-r);c.quadraticCurveTo(-r*.3,0,0,r);c.moveTo(0,-r);c.quadraticCurveTo(r*.3,0,0,r);c.stroke()}c.restore();c.restore();
  } else if(id==='pixelate'){
    const phase=t%8,p=seg(phase,2,2),night=p>=.5,rough=p<.5?p*2:(1-p)*2,block=Math.max(1,Math.round(mix(1,H*.22,ease(rough))));if(block<=1){landscapeScene(c,night);return}const source=draw.pixelSource||(draw.pixelSource=document.createElement('canvas')),small=draw.pixelSmall||(draw.pixelSmall=document.createElement('canvas'));source.width=W;source.height=H;landscapeScene(source.getContext('2d'),night);small.width=Math.max(1,Math.ceil(W/block));small.height=Math.max(1,Math.ceil(H/block));const sx=small.getContext('2d');sx.imageSmoothingEnabled=true;sx.drawImage(source,0,0,small.width,small.height);c.imageSmoothingEnabled=false;c.drawImage(small,0,0,W,H);c.imageSmoothingEnabled=true;
  } else if(id==='halftone-wipe'){
    const p=ease(seg(t%8,2.2,1.4)),g=H*.1,cols=Math.ceil(W/g)+1,rows=Math.ceil(H/g)+1;landscapeScene(c,false);if(p>0){c.save();c.beginPath();for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const d=(col*g/W+row*g/H)/2,v=clamp(p*2.2-d*1.2),r=g*.75*v;if(r>.3){c.moveTo(col*g+r,row*g);c.arc(col*g,row*g,r,0,TAU)}}c.clip();landscapeScene(c,true);c.restore()}
  } else if(id==='neon-contour'){
    fill(c,C.ink);const cell=H/22,nx=Math.ceil(W/cell)+1,ny=Math.ceil(H/cell)+1,field=new Float32Array(nx*ny),phase=TAU*t/8;for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const px=x*cell/H,py=y*cell/H;field[y*nx+x]=Math.sin(px*2.1+phase)+Math.sin(py*2.7-phase)+.8*Math.sin((px+py)*1.6+phase*.5)+.5*Math.cos(px*3.3-py*1.1-phase)}for(let level=0;level<7;level++){const iso=-1.8+level*.6;c.beginPath();for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){const a=field[y*nx+x]-iso,b=field[y*nx+x+1]-iso,d=field[(y+1)*nx+x]-iso,e=field[(y+1)*nx+x+1]-iso,pts=[],x0=x*cell,y0=y*cell;if((a>0)!==(b>0))pts.push([x0+cell*a/(a-b),y0]);if((b>0)!==(e>0))pts.push([x0+cell,y0+cell*b/(b-e)]);if((e>0)!==(d>0))pts.push([x0+cell*(1-e/(e-d)),y0+cell]);if((d>0)!==(a>0))pts.push([x0,y0+cell*(1-d/(d-a))]);for(let i=0;i+1<pts.length;i+=2){c.moveTo(...pts[i]);c.lineTo(...pts[i+1])}}c.lineCap='round';c.strokeStyle=level%2?'#93f5df':'#22e3ae';c.globalAlpha=.20;c.lineWidth=H*.03;c.stroke();c.globalAlpha=1;c.lineWidth=Math.max(1.5,H*.008);c.stroke()}
  } else if(id==='dot-ocean'){
    fill(c,C.ink);const horizon=H*.30,f=H*.5,cam=1.1,phase=TAU*t/8;for(let zi=25;zi>=0;zi--){const z=1+zi*.45,X=W/2/(f/z)+1;for(let x=-X;x<=X;x+=.28){const wave=.22*Math.sin(x*1.1+z*.7-phase*2)+.14*Math.sin(x*.45-z*1.3+phase),sx=W/2+x*f/z,sy=horizon+(cam-wave)*f/z*.55;if(sx<-4||sx>W+4)continue;c.globalAlpha=clamp(1.25-zi/22);c.fillStyle=wave>.18?C.paper:'#2ba8e0';c.beginPath();c.arc(sx,sy,Math.max(.7,H*.028/z),0,TAU);c.fill()}}c.globalAlpha=1;
  } else if(id==='wireframe-terrain'){
    const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,C.ink);bg.addColorStop(.36,'#143b51');bg.addColorStop(.37,C.ink);bg.addColorStop(1,C.ink);fill(c,bg);const hz=H*.36,f=H*.9,span=8,scroll=frac(t/8)*span,step=.5,offset=scroll%step,cols=22,rows=18,points=[],height=(x,z)=>Math.pow(Math.abs(x),1.4)*.32*(.7+.3*Math.sin(z*TAU/span*2+x))+.12*Math.sin(z*TAU/span*3+x*1.7);for(let row=0;row<rows;row++){const z=.6+row*step-offset,worldZ=z+scroll,arr=[];for(let col=0;col<=cols;col++){const x=(col/cols-.5)*9,y=height(x,worldZ);arr.push([W/2+x*f/z*.35,hz+(1-y)*f/z*.22,z])}points.push(arr)}c.strokeStyle='#2ba8e0';c.lineWidth=Math.max(1.3,H*.007);for(let row=0;row<rows;row++){c.globalAlpha=clamp(1.4-row/rows*1.6)*clamp((points[row][0][2]-.25)*3);c.beginPath();points[row].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()}for(let col=0;col<=cols;col++)for(let row=0;row<rows-1;row++){c.globalAlpha=clamp(1.4-row/rows*1.6)*clamp((points[row][col][2]-.25)*3);c.beginPath();c.moveTo(points[row][col][0],points[row][col][1]);c.lineTo(points[row+1][col][0],points[row+1][col][1]);c.stroke()}c.globalAlpha=1;c.fillStyle=C.paper;c.fillRect(0,hz-1,W,1.5);
  } else if(id==='reaction-diffusion'){
    const sw=260,sh=82,off=draw.reactionSource||(draw.reactionSource=document.createElement('canvas'));if(off.width!==sw||off.height!==sh){off.width=sw;off.height=sh}const ox=off.getContext('2d'),img=ox.createImageData(sw,sh),data=img.data,phase=TAU*t/8,k=TAU*4.2/sh,wave=sh*.05,terms=[];for(let i=0;i<9;i++){const h=frac(Math.sin(i*127.1+311.7)*43758.5453),ang=i*Math.PI/9+h*.25,kk=k*(.9+.2*frac(Math.sin((i+5)*127.1+311.7)*43758.5453));terms.push([Math.cos(ang)*kk,Math.sin(ang)*kk,phase*(i%3?1:-1)+(h*TAU)])}for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const xx=x+wave*Math.sin(y*k*.45+phase),yy=y+wave*Math.cos(x*k*.45-phase),v=terms.reduce((sum,[a,b,p])=>sum+Math.cos(xx*a+yy*b+p),0),q=clamp((v/3-.32*Math.sin(phase))/.12+.5),n=(y*sw+x)*4;data[n]=20+(26-20)*q;data[n+1]=22+(184-22)*q;data[n+2]=27+(150-27)*q;data[n+3]=255}ox.putImageData(img,0,0);c.imageSmoothingEnabled=true;c.drawImage(off,0,0,W,H);
  } else if(id==='hologram'){
    fill(c,C.ink);const phase=t%8,bx=W/2,by=H*.86,cone=out(seg(phase,.5,.9)),pulse=.5+.5*Math.sin(TAU*phase/2),visible=seg(phase,1.2,1.4),flicker=visible<1?(frac(Math.sin(Math.floor(phase*20)*127.1+311.7)*43758.5453)>.35?1:.25):1;for(let i=0;i<3;i++){c.strokeStyle='#37d6e4';c.globalAlpha=(.8-i*.22)*seg(phase,.3,.4);c.lineWidth=1.6;c.beginPath();c.ellipse(bx,by,W*(.1+i*.05)*(1+pulse*.04),H*(.035+i*.018),0,0,TAU);c.stroke()}c.globalAlpha=.32*cone;const glow=c.createLinearGradient(0,by,0,H*.12);glow.addColorStop(0,'#37d6e4');glow.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=glow;c.beginPath();c.moveTo(bx-W*.1,by);c.lineTo(bx+W*.1,by);c.lineTo(bx+W*.3,H*.12);c.lineTo(bx-W*.3,H*.12);c.fill();if(visible>0){const y=H*.45+Math.sin(phase*TAU/4)*H*.015;c.globalAlpha=flicker*clamp(visible*2);c.save();c.textAlign='center';c.textBaseline='middle';c.font=`800 ${H*.36}px system-ui,sans-serif`;c.fillStyle='#55e8f2';c.shadowColor='#37d6e4';c.shadowBlur=H*.04;c.fillText('투영',bx,y);c.restore();c.fillStyle='rgba(20,22,27,.28)';for(let sy=H*.25;sy<H*.65;sy+=3)c.fillRect(W*.15,sy+(phase*12)%3,W*.7,1)}c.globalAlpha=1;
  } else if(id==='shockwave'){
    fill(c,C.ink);const phase=t%8,hit=phase-.6,shake=hit>0&&hit<.4?(1-hit/.4)*H*.03:0,pop=back(seg(phase,.6,.35)),appear=seg(phase,.45,.2),size=H*.42;c.save();c.translate(Math.sin(hit*90)*shake,Math.cos(hit*70)*shake);for(const [delay,i] of [[0,0],[.12,1],[.24,2]]){const r=out(seg(phase,.6+delay,.9));if(r<=0||r>=1)continue;c.strokeStyle=i?C.paper:'#7657f0';c.globalAlpha=(1-r)*(i?.5:1);c.lineWidth=H*.03*(1-r)+1;c.beginPath();c.ellipse(W/2,H/2,W*.7*r,H*.5*r,0,0,TAU);c.stroke()}c.globalAlpha=1;if(appear>0){const sc=phase<.6?2.4-appear*1.2:1.2-.2*pop;c.save();c.translate(W/2,H/2);c.scale(sc,sc);label(c,'출발',0,0,size,C.paper);c.restore();rounded(c,W/2-size*.7*pop,H/2+size*.66,size*1.4*pop,H*.025,0,'#7657f0')}c.restore();
  } else if(id==='slash-cut'){
    fill(c,C.ink);const phase=t%8,blade=seg(phase,.5,.25),separate=ease(seg(phase,.85,.7)),angle=-.35,slope=Math.tan(angle),dx=Math.cos(angle),dy=Math.sin(angle),yAt=x=>H/2+(x-W/2)*slope,offset=(1-separate)*H*.22,size=H*.46;if(blade<1)label(c,'단칼',W/2,H/2,size,C.paper);else for(const side of [1,-1]){c.save();c.beginPath();c.moveTo(-W,yAt(-W));c.lineTo(W*2,yAt(W*2));c.lineTo(W*2,side>0?-H*3:H*4);c.lineTo(-W,side>0?-H*3:H*4);c.closePath();c.clip();c.translate(side*dx*offset,side*dy*offset);label(c,'단칼',W/2,H/2,size,C.paper);c.restore()}if(phase>.5&&phase<1.1){const progress=seg(phase,.5,.25),alpha=1-seg(phase,.75,.35),xa=-W*.05,xb=xa+W*1.1*progress;c.strokeStyle=C.paper;c.globalAlpha=alpha;c.lineWidth=2.5;c.beginPath();c.moveTo(xa,yAt(xa));c.lineTo(xb,yAt(xb));c.stroke();c.globalAlpha=1}const underline=seg(phase,1.6,.5);if(underline>0)rounded(c,W/2-size*.3,H/2+size*.68,size*.6*underline,H*.022,0,'#7657f0');
  } else if(id==='flash-reveal'){
    fill(c,C.ink);const phase=t%8,flash=seg(phase,.7,.25),decay=seg(phase,.95,1.2),white=flash<1?flash:1-ease(decay),glow=1-ease(seg(phase,1.1,1.6)),size=H*.44;if(flash>=1){c.save();c.shadowColor=C.paper;c.shadowBlur=H*.25*glow;label(c,'첫날',W/2,H/2,size,glow>.02?C.white:C.paper);c.restore();if(glow>.02){c.globalAlpha=1-glow;label(c,'첫날',W/2,H/2,size,C.orange);c.globalAlpha=1}}if(white>0){c.fillStyle=`rgba(255,255,255,${white})`;c.fillRect(0,0,W,H)}
  } else if(id==='particle-form'){
    fill(c,C.ink);const phase=t%8,size=H*.5,step=6,hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453),solid=ease(seg(phase,3,.8));if(!draw.particleGlyph){const off=document.createElement('canvas');off.width=W;off.height=H;const oc=off.getContext('2d');oc.fillStyle=C.paper;oc.font=`800 ${size}px system-ui,sans-serif`;oc.textAlign='center';oc.textBaseline='middle';oc.fillText('모임',W/2,H/2);const pixels=oc.getImageData(0,0,W,H).data,pts=[];for(let y=0;y<H;y+=step)for(let x=0;x<W;x+=step)if(pixels[(y*W+x)*4+3]>120)pts.push([x,y]);draw.particleGlyph=pts}draw.particleGlyph.forEach(([px,py],i)=>{const delay=hash(i)*.9,e=ease(seg(phase,.4+delay,1.8)),a=hash(i+5)*TAU,rad=H*(.5+hash(i+2)*.6)*(1-e),x=px+Math.cos(a+(1-e)*3)*rad*1.4,y=py+Math.sin(a+(1-e)*3)*rad*.8;c.globalAlpha=(.4+.6*e)*(1-solid*.9);c.fillStyle=i%5?C.paper:'#e8506e';c.beginPath();c.arc(x,y,step*.4,0,TAU);c.fill()});c.globalAlpha=solid;if(solid>0)label(c,'모임',W/2,H/2,size,C.paper);c.globalAlpha=1;
  } else if(id==='film-leader'){
    const phase=t%8,cx=W/2,cy=H/2,R=H*.4,counting=phase>=.4&&phase<3.4;if(counting){fill(c,'#8c8a84');const n=3-Math.floor((phase-.4)),u=frac(phase-.4);c.fillStyle='#a9a69e';c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,W,-Math.PI/2,-Math.PI/2+TAU*u);c.closePath();c.fill();c.strokeStyle=C.paper;c.lineWidth=2;for(const r of [R,R*.82]){c.beginPath();c.arc(cx,cy,r,0,TAU);c.stroke()}c.beginPath();c.moveTo(0,cy);c.lineTo(W,cy);c.moveTo(cx,0);c.lineTo(cx,H);c.stroke();label(c,String(n),cx,cy+H*.02,H*.5,C.ink)}else{fill(c,C.ink);const a=ease(seg(phase,3.5,.8));c.globalAlpha=a;label(c,'상영',cx,cy,H*.36,C.paper);c.fillStyle='#e8506e';for(let i=0;i<9;i++){c.fillRect(W*.08+i*W*.1,H*.08,W*.05,H*.06);c.fillRect(W*.08+i*W*.1,H*.86,W*.05,H*.06)}c.globalAlpha=1;if(phase>=3.4&&phase<3.55){c.fillStyle=`rgba(255,255,255,${1-(phase-3.4)/.15})`;c.fillRect(0,0,W,H)}}
  } else if(id==='spotlight-reveal'){
    fill(c,C.ink);const phase=t%8,p=ease(seg(phase,.5,2.4)),sx=W*(.12+.76*p),sy=H*(.5+Math.sin(p*Math.PI)*.12),r=H*.42,full=ease(seg(phase,3,.8)),size=H*.4;label(c,'주인공',W/2,H/2,size,'rgba(244,241,234,.07)');const off=draw.spotSource||(draw.spotSource=document.createElement('canvas'));if(off.width!==W||off.height!==H){off.width=W;off.height=H}const oc=off.getContext('2d');oc.clearRect(0,0,W,H);label(oc,'주인공',W/2,H/2,size,C.paper);oc.globalCompositeOperation='destination-in';const mask=oc.createRadialGradient(sx,sy,0,sx,sy,r*(1+full*6));mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(.7,'rgba(0,0,0,.85)');mask.addColorStop(1,'rgba(0,0,0,0)');oc.fillStyle=mask;oc.fillRect(0,0,W,H);oc.globalCompositeOperation='source-over';c.drawImage(off,0,0);if(full<1){const light=c.createRadialGradient(sx,sy,0,sx,sy,r);light.addColorStop(0,`rgba(255,240,200,${.16*(1-full)})`);light.addColorStop(1,'rgba(255,240,200,0)');c.fillStyle=light;c.fillRect(0,0,W,H)}if(full>0)rounded(c,W/2-size*.5,H/2+size*.62,size*full,3,0,'#e8506e');
  } else if(id==='tracking-expand'){
    fill(c,C.ink);const phase=t%8,p=out(seg(phase,.5,3)),size=H*.3,gap=size*(-.12+p*.9);c.font=`700 ${size}px system-ui,sans-serif`;const aw=c.measureText('여').width,bw=c.measureText('백').width,total=aw+bw+gap,x0=W/2-total/2,alpha=seg(phase,.5,1.2);c.globalAlpha=alpha;c.textAlign='left';c.textBaseline='middle';c.fillStyle=C.paper;c.fillText('여',x0,H*.46);c.fillText('백',x0+aw+gap,H*.46);c.globalAlpha=1;const line=W*.5*ease(seg(phase,1.6,1.4));rounded(c,W/2-line/2,H*.72,line,2,0,'#e8aa30');c.globalAlpha=seg(phase,2.4,.8)*.6;c.font=`700 ${H*.045}px ui-monospace,monospace`;c.textAlign='center';c.fillStyle=C.paper;c.fillText('S P A C E',W/2,H*.82);c.globalAlpha=1;
  } else if(id==='tape-label'){
    fill(c,'#893649');const phase=t%8,e=back(seg(phase,.4,.55)),cw=W*.48,ch=H*.5;if(e>0){c.save();c.translate(W/2,H/2-(1-e)*H);c.rotate(-.04);c.shadowColor='rgba(0,0,0,.3)';c.shadowBlur=H*.05;c.shadowOffsetY=H*.02;c.fillStyle='#fffdf6';c.fillRect(-cw/2,-ch/2,cw,ch);c.shadowColor='transparent';c.strokeStyle='rgba(20,22,27,.08)';c.lineWidth=1;for(let y=-ch/2+ch*.2;y<ch/2;y+=ch*.16){c.beginPath();c.moveTo(-cw/2+6,y);c.lineTo(cw/2-6,y);c.stroke()}c.globalAlpha=ease(seg(phase,1.3,.6));label(c,'메모',0,ch*.04,ch*.5,C.ink);c.globalAlpha=1;for(const [i,side,angle] of [[0,-1,-.44],[1,1,.4]]){const q=back(seg(phase,.95+i*.2,.3));if(q<=0)continue;c.save();c.translate(side*cw*.46,-ch/2);c.rotate(angle);c.scale(q,q);c.fillStyle='rgba(242,197,61,.78)';c.fillRect(-cw*.14,-ch*.07,cw*.28,ch*.14);c.restore()}c.restore()}
  } else if(id==='strobe'){
    const p=frac(t/2.4),flash=[.64,.72,.8,.88].some(at=>p>=at&&p<at+.04);fill(c,flash?'#fff':'#141821');label(c,'DROP',W/2,H/2,H*.18,flash?'#727782':'#8b93a1');
  } else if(id==='particles'){
    const p=frac(t/2),colors=['#17a88a',C.paper,'#166658'];fill(c,C.ink);for(let i=0;i<40;i++){const hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453),angle=-Math.PI/2+(hash(i)-.5)*1.8,speed=H*(1+1.4*hash(i+4)),age=p*1.1,x=W/2+Math.cos(angle)*speed*age*.9,y=H*.9+Math.sin(angle)*speed*age+H*1.6*age*age,size=H*(.02+.02*hash(i+8));c.save();c.globalAlpha=clamp(1.2-p*1.2);c.translate(x,y);c.rotate(age*6+i);c.fillStyle=colors[i%3];if(i%3===0)c.fillRect(-size,-size,size*2,size*2);else if(i%3===1){c.beginPath();c.arc(0,0,size,0,TAU);c.fill()}else{c.beginPath();c.moveTo(0,-size*1.2);c.lineTo(size,size);c.lineTo(-size,size);c.closePath();c.fill()}c.restore()}rounded(c,W/2-H*.12,H*.86,H*.24,H*.1,H*.03,C.paper);
  } else if(id==='tv-off'){
    const s=transitionState(t),off=s.p<.5,q=off?s.p*2:(1-s.p)*2,scene=off?s.from:s.to,sy=1-Math.pow(clamp(q/.6),3),sx=1-Math.pow(clamp((q-.6)/.35),3),line=seg(q,.35,.25);fill(c,'#000');if(sy>.01){c.save();c.translate(W/2,H/2);c.scale(1,sy);c.translate(-W/2,-H/2);sourceScreen(c,scene,'#e8b520');c.restore()}if(line>0&&sx>.005){c.save();c.shadowColor='#fff';c.shadowBlur=H*.12;c.fillStyle=`rgba(255,255,255,${line})`;c.fillRect(W/2-W/2*sx,H/2-Math.max(2,H*.02)/2,W*sx,Math.max(2,H*.02));c.restore()}if(q>.9&&q<1){c.fillStyle=`rgba(255,255,255,${1-(q-.9)/.1})`;c.beginPath();c.arc(W/2,H/2,H*.025,0,TAU);c.fill()}
  } else if(id==='squeeze-line'){
    const s=transitionState(t),first=s.p<.5,q=first?s.p*2:(1-s.p)*2,scene=first?s.from:s.to,sx=1-Math.pow(clamp(q),3),line=Math.max(3,W*.012);fill(c,C.ink);if(sx>.01){c.save();c.translate(W/2,H/2);c.scale(sx,1-.1*q);c.translate(-W/2,-H/2);sourceScreen(c,scene,'#e8b520');c.restore()}if(q>.55){c.fillStyle=`rgba(232,181,32,${seg(q,.55,.25)})`;c.fillRect(W/2-line/2,H*.05,line,H*.9)}
  } else if(id==='film-burn'){
    const s=transitionState(t),p=s.p,e=Math.sin(Math.PI*clamp(p)),radius=Math.max(W,H);sourceScreen(c,p<.5?s.from:s.to,'#f05032');c.save();c.globalCompositeOperation='lighter';[[.18,.3,'255,120,40'],[.7,.65,'255,190,90'],[.45,.1,'255,80,30']].forEach(([px,py,color],i)=>{const x=W*(px+.08*Math.sin(p*6+i)),y=H*py,r=radius*(.25+1.1*e)*(1+.2*i),g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${.95*e})`);g.addColorStop(.5,`rgba(${color},${.45*e})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(0,0,W,H)});c.restore();const white=seg(e,.82,.18);if(white>0){c.fillStyle=`rgba(255,248,236,${white})`;c.fillRect(0,0,W,H)}
  } else if(id==='vhs-rewind'){
    const s=transitionState(t),p=s.p,e=Math.sin(Math.PI*clamp(p)),scene=p<.5?s.from:s.to,source=draw.vhsSource||(draw.vhsSource=document.createElement('canvas'));if(source.width!==W||source.height!==H){source.width=W;source.height=H}sourceScreen(source.getContext('2d'),scene,'#f05032');fill(c,'#000');const rows=26,rh=H/rows,frame=Math.floor(p*40),hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453);for(let i=0;i<rows;i++){const offset=(hash(i*7+frame*13)-.5)*W*.22*e+Math.sin(i*.7+p*30)*W*.02*e;c.drawImage(source,0,i*rh,W,rh+1,offset,i*rh,W,rh+.5)}const band=((1-p)*1.4-.2)*H;c.fillStyle=`rgba(255,255,255,${.5*e})`;for(let j=0;j<40;j++)c.fillRect(hash(j+frame)*W,band+hash(j*3+frame)*H*.1,W*.08*hash(j*5),1.5);c.fillStyle=`rgba(0,0,0,${.18*e})`;for(let y=0;y<H;y+=3)c.fillRect(0,y,W,1);if(e>.15){c.globalAlpha=e;label(c,'◀◀',W*.08,H*.12,H*.13,'#fff');c.globalAlpha=1}
  } else if(id==='roll-up'){
    const s=transitionState(t),p=ease(s.p),y=H-(H+H*.12)*p,r=H*.07;sourceScreen(c,s.to,'#e8b520');if(y>0){c.save();c.beginPath();c.rect(0,0,W,y);c.clip();sourceScreen(c,s.from,'#e8b520');c.restore()}if(y>-2*r){const g=c.createLinearGradient(0,y-r,0,y+r);g.addColorStop(0,'#9a958c');g.addColorStop(.45,C.paper);g.addColorStop(1,'#6e6a63');c.fillStyle=g;c.fillRect(0,y-r,W,r*2);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(0,y+r,W,r*.5)}
  } else if(id==='paper-tear'){
    const s=transitionState(t),q=ease(s.p),source=draw.tearSource||(draw.tearSource=document.createElement('canvas')),sc=source.getContext('2d'),hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453);if(source.width!==W||source.height!==H){source.width=W;source.height=H}landscapeScene(sc,s.from==='B');sc.fillStyle='rgba(244,237,217,.07)';sc.fillRect(0,0,W,H);for(let i=0;i<900;i++){sc.fillStyle=`rgba(71,58,40,${hash(i*9)*.05})`;sc.fillRect(hash(i*13)*W,hash(i*17+2)*H,1,1)}if(q<.002){c.drawImage(source,0,0);return}landscapeScene(c,s.to==='B');const edge=[];for(let y=0;y<=H+4;y+=4){const i=y/4,drift=(hash(i*13)-.5)*H*.04+Math.sin(y*.053)*H*.025;edge.push([W/2+drift,y])}const path=points=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()};for(const side of [-1,1]){const dx=side*q*W*.55,dy=q*q*H*.12,angle=side*q*.11,shape=side<0?[[-W,-H],...edge,[-W,H*2]]:[[W*2,-H],...edge,[W*2,H*2]];c.save();c.translate(W/2+dx,H/2+dy);c.rotate(angle);c.translate(-W/2,-H/2);c.save();c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=H*.11;c.shadowOffsetX=side*H*.065;c.shadowOffsetY=H*.035;path(shape);c.fillStyle='#eee7d6';c.fill();c.restore();c.save();path(shape);c.clip();c.drawImage(source,0,0);c.restore();c.lineJoin='round';c.lineCap='round';c.strokeStyle='#fffaf0';c.lineWidth=H*.035;c.beginPath();edge.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.strokeStyle='#b4a894';c.lineWidth=1.4;c.stroke();for(let i=4;i<edge.length-4;i+=3){const [x,y]=edge[i],len=H*(.015+hash(i*17)*.05);c.strokeStyle=`rgba(255,250,238,${.45+hash(i)*.5})`;c.lineWidth=.7;c.beginPath();c.moveTo(x,y);c.lineTo(x+side*len,y+(hash(i+4)-.5)*8);c.stroke()}c.restore()}
  } else if(id==='page-curl'){
    const s=transitionState(t),q=ease(s.p),n=[Math.SQRT1_2,Math.SQRT1_2],far=(W+H)*Math.SQRT1_2,threshold=far-(far+2)*q,rect=[[0,0],[W,0],[W,H],[0,H]];const clipHalf=(points,keep)=>{const out=[],side=p=>(p[0]*n[0]+p[1]*n[1]-threshold)*keep;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],da=side(a),db=side(b);if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const v=da/(da-db);out.push([a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v])}}return out};const polygon=points=>{points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()};sourceScreen(c,s.to,'#21b795');const keep=clipHalf(rect,-1);if(keep.length>2){c.save();c.beginPath();polygon(keep);c.clip();sourceScreen(c,s.from,'#21b795');c.restore()}const gone=clipHalf(rect,1);if(gone.length>2){const flap=gone.map(([x,y])=>{const d=x*n[0]+y*n[1]-threshold;return[x-2*d*n[0],y-2*d*n[1]]});c.save();c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=H*.08;c.shadowOffsetX=-H*.02;c.beginPath();polygon(flap);const gx=threshold*n[0],g=c.createLinearGradient(gx,gx,gx-H*.5*n[0],gx-H*.5*n[1]);g.addColorStop(0,'#cfcac0');g.addColorStop(.35,C.paper);g.addColorStop(1,'#e2ded5');c.fillStyle=g;c.fill();c.restore()}
  } else if(id==='glass-shatter'){
    const s=transitionState(t),p=s.p,source=draw.glassSource||(draw.glassSource=document.createElement('canvas'));if(source.width!==W||source.height!==H){source.width=W;source.height=H}sourceScreen(source.getContext('2d'),s.from,'#e8b520');sourceScreen(c,s.to,'#e8b520');const hash=i=>frac(Math.sin(i*127.1+311.7)*43758.5453),cols=5,rows=3,gx=W/cols,gy=H/rows,points=[];for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){const edge=col===0||row===0||col===cols||row===rows;points.push([col*gx+(edge?0:(hash(col*9+row)-.5)*gx*.7),row*gy+(edge?0:(hash(col*3+row*11)-.5)*gy*.7)])}const crack=seg(p,0,.18),fall=seg(p,.18,.82);let idx=0;for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const a=points[row*(cols+1)+col],b=points[row*(cols+1)+col+1],d=points[(row+1)*(cols+1)+col],cc=points[(row+1)*(cols+1)+col+1];for(const tri of [[a,b,cc],[a,cc,d]]){const random=hash(idx++*17.3),delay=random*.35,f=seg(fall,delay,1-delay),cx=(tri[0][0]+tri[1][0]+tri[2][0])/3,cy=(tri[0][1]+tri[1][1]+tri[2][1])/3,dy=f*f*H*1.6,dx=(cx-W/2)*.5*f,rotation=(random-.5)*2.4*f;if(dy>H*1.5)continue;c.save();c.translate(cx+dx,cy+dy);c.rotate(rotation);c.translate(-cx,-cy);c.beginPath();tri.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.save();c.clip();c.drawImage(source,0,0);c.restore();if(crack>0){c.strokeStyle=`rgba(255,255,255,${.75*crack})`;c.lineWidth=1.2;c.stroke()}c.restore()}}
  } else if(id==='magnifier-lens'){
    const phrase='작은 글씨를 크게 본다',size=H*.17,x=W/2+W*.3*Math.sin(TAU*t/8),y=H/2,r=H*.3;fill(c,C.paper);label(c,phrase,W/2,y,size,'rgba(20,22,27,.55)');c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();fill(c,'#fff');c.translate(x,y);c.scale(2.2,2.2);c.translate(-x,-y);label(c,phrase,W/2,y,size,'#e8506e');c.restore();c.strokeStyle=C.ink;c.lineWidth=H*.035;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.lineCap='round';c.lineWidth=H*.06;c.beginPath();c.moveTo(x+r*.74,y+r*.74);c.lineTo(x+r*1.3,y+r*1.3);c.stroke();c.lineCap='butt';
  } else if(id==='water-reflection'){
    const phrase='물 위의 말',size=H*.3,waterline=H*.55,top=waterline-size*.52;fill(c,C.ink);label(c,phrase,W/2,top,size,C.paper);c.fillStyle='rgba(137,54,73,.5)';c.fillRect(0,waterline,W,H-waterline);for(let y=waterline;y<H;y+=2){const u=(y-waterline)/(H-waterline),offset=Math.sin(y*.32-TAU*t*6/8)*(1+u*5);c.save();c.beginPath();c.rect(0,y,W,2.2);c.clip();c.globalAlpha=.55*(1-u);c.translate(offset,2*waterline);c.scale(1,-1);label(c,phrase,W/2,top,size,'#e8506e');c.restore()}c.fillStyle=C.paper;c.fillRect(W*.1,waterline,W*.8,1);
  } else if(id==='long-shadow'){
    const phrase='빛과 그림자',size=H*.42,angle=TAU*t/8,dx=Math.cos(angle),dy=Math.sin(angle);fill(c,C.ink);for(let d=60;d>0;d--)label(c,phrase,W/2+dx*d*H*.012,H/2+dy*d*H*.012,size,'#f05032');label(c,phrase,W/2,H/2,size,C.paper);
  } else if(id==='letter-rain'){
    const pool=[...'비가내리는밤바람소리창가에떨어지는물방울하나둘'],size=Math.max(14,H*.11),pitch=size*1.15,cols=Math.floor(W/pitch),lead=(W-cols*pitch)/2,hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453);fill(c,C.ink);c.font=`700 ${size}px system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';for(let col=0;col<cols;col++){const speed=1+(hash(col)>.5?1:0),length=10,span=length*pitch,offset=frac(hash(col+3)+t*speed/8)*span;for(let row=-1;row<Math.ceil(H/pitch)+1;row++){const y=row*pitch+offset%pitch,index=Math.floor(row-Math.floor(offset/pitch)+hash(col+5)*40),char=pool[((index%pool.length)+pool.length)%pool.length],hot=(index+col)%9===0;c.globalAlpha=hot?1:.25+.4*hash(col*7+((index%13)+13)%13);c.fillStyle=hot?'#e8506e':C.paper;c.fillText(char,lead+(col+.5)*pitch,y)}}c.globalAlpha=1;
  } else if(id==='disintegrate'){
    const phrase='흩어짐',size=H*.48,step=Math.max(3,Math.round(size/24)),phase=t%4,hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453);if(!draw.disintegrateMap){const surface=document.createElement('canvas'),sx=surface.getContext('2d');sx.font=`800 ${size}px system-ui,sans-serif`;surface.width=Math.ceil(sx.measureText(phrase).width+size*.4);surface.height=Math.ceil(size*1.5);sx.font=`800 ${size}px system-ui,sans-serif`;sx.fillStyle='#fff';sx.textAlign='center';sx.textBaseline='middle';sx.fillText(phrase,surface.width/2,surface.height/2);const data=sx.getImageData(0,0,surface.width,surface.height).data,points=[];for(let y=0;y<surface.height;y+=step)for(let x=0;x<surface.width;x+=step)if(data[(y*surface.width+x)*4+3]>120)points.push([x-surface.width/2,y-surface.height/2]);const xs=points.map(p=>p[0]);draw.disintegrateMap={points,minX:Math.min(...xs),length:Math.max(...xs)-Math.min(...xs)}}const map=draw.disintegrateMap,front=map.minX-size*.2+(map.length+size*.6)*ease(seg(phase,.5,1.6)),restore=seg(phase,3.2,.7);fill(c,C.ink);map.points.forEach(([px,py],i)=>{let x=W/2+px,y=H/2+py,alpha=1,color=C.paper,scale=1;if(phase>3.2)alpha=out(restore);else if(px<=front){const drift=clamp((front-px)/(map.length*.55)),random=hash(i);alpha=1-drift;color=random>.55?'#2ba8e0':C.paper;scale=1-drift*.5;x+=drift*H*(.5+random);y-=drift*H*(.25+.5*hash(i+9));y+=Math.sin(drift*6+random*9)*H*.03}if(alpha<=0)return;c.globalAlpha=alpha;c.fillStyle=color;c.fillRect(x,y,step*scale,step*scale)});c.globalAlpha=1;
  } else if(id==='weight-grow'){
    const chars=[...'굵어진다'],size=H*.44,phase=t%4;fill(c,C.paper);c.font=`900 ${size}px system-ui,sans-serif`;const widths=chars.map(ch=>c.measureText(ch).width),total=widths.reduce((a,b)=>a+b,0);let x=W/2-total/2;for(let i=0;i<chars.length;i++){const q=phase<3?ease(seg(phase,.3+i*.25,1)):1-ease(seg(phase,3,.8)),weight=100+Math.round(q*8)*100;c.fillStyle=q>.99?'#6b5ae0':C.ink;c.font=`${weight} ${size}px system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(chars[i],x+widths[i]/2,H/2);x+=widths[i]}
  } else if(id==='layer-peel'){
    fill(c,C.paper);const cw=H*.9,ch=H*.62,colors=[C.ink,'#893649','#e8506e','#f39aac'];for(let i=3;i>=0;i--){const q=i===3?0:ease(seg(t,1+i*1.3,1));if(q>=1)continue;const ox=(i-1.5)*H*.02,oy=(i-1.5)*H*.02;c.save();c.translate(W/2+ox+q*W*.7,H/2+oy-q*H*.25);c.rotate(q*.5);rounded(c,-cw/2+H*.02,-ch/2+H*.03+q*H*.04,cw,ch,H*.05,'rgba(20,22,27,.18)');rounded(c,-cw/2,-ch/2,cw,ch,H*.05,colors[i]);label(c,`${i+1} / 4`,0,0,H*.12,i===3?C.ink:C.paper);c.restore()}
  } else if(id==='detail-inset'){
    const hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453),sx=W*.27,sy=H*.43,small=H*.2,ix=W*.6,iy=H*.12,large=H*.76,e=ease(seg(t,.8,1)),q=ease(seg(t,1.6,1));const source=draw.detailSource||(draw.detailSource=document.createElement('canvas'));if(source.width!==W||source.height!==H){source.width=W;source.height=H}const sc=source.getContext('2d');fill(sc,C.paper);for(let i=0;i<40;i++){sc.fillStyle=i%5?'rgba(20,22,27,.18)':'#e8506e';sc.beginPath();sc.arc(W*.05+hash(i)*W*.5,H*.1+hash(i+9)*H*.8,H*(.01+hash(i+4)*.03),0,TAU);sc.fill()}sc.fillStyle=C.ink;sc.font='700 13px system-ui,sans-serif';sc.textAlign='center';sc.textBaseline='middle';sc.fillText('핵심',sx+small/2,H*.53);sc.fillStyle='#e8506e';sc.beginPath();sc.arc(W*.28,H*.53,H*.012,0,TAU);sc.fill();c.drawImage(source,0,0);c.fillStyle=`rgba(20,22,27,${.25*q})`;c.fillRect(0,0,W*.58,H);c.strokeStyle='#e8506e';c.lineWidth=H*.012;c.strokeRect(sx,sy,small*e,small*e);if(q>0){const size=mix(small,large,q),x=mix(sx,ix,q),y=mix(sy,iy,q);c.strokeStyle='rgba(20,22,27,.4)';c.lineWidth=1.5;c.beginPath();c.moveTo(sx+small,sy);c.lineTo(x,y);c.moveTo(sx+small,sy+small);c.lineTo(x,y+size);c.stroke();c.save();c.beginPath();c.rect(x,y,size,size);c.clip();c.drawImage(source,sx,sy,small,small,x,y,size,size);c.restore();c.strokeStyle='#e8506e';c.lineWidth=H*.014;c.strokeRect(x,y,size,size)}
  } else if(id==='flow-field'){
    fill(c,C.paper);const N=320,step=H*.024,segments=40,hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453),angle=(x,y)=>Math.sin(x/H*1.7)*1.6+Math.cos(y/H*2.3+x/H*.6)*1.4;c.lineCap='round';c.lineJoin='round';for(let i=0;i<N;i++){const age=frac(t/4+hash(i+7)),head=Math.floor(age*segments),x0=hash(i)*(W+H)-H*.5,y0=hash(i+99)*H,points=[];let x=x0,y=y0;for(let s=0;s<=head;s++){points.push([x,y]);const a=angle(x,y);x+=Math.cos(a)*step;y+=Math.sin(a)*step}const first=Math.max(0,head-12);if(head-first<1)continue;c.globalAlpha=Math.sin(Math.PI*age)*.8;c.strokeStyle=i%6?C.ink:'#17a88a';c.lineWidth=i%6?H*.007:H*.013;c.beginPath();c.moveTo(...points[first]);for(let j=first+1;j<=head;j++)c.lineTo(...points[j]);c.stroke()}c.globalAlpha=1;
  } else if(id==='exploded-view'){
    fill(c,C.ink);const layers=[['윗빵',.5,'#E0A04A'],['채소',.16,'#5DBB63'],['치즈',.12,'#F2C53D'],['패티',.34,'#7A4A2E'],['아랫빵',.32,'#D8913F']],phase=t%8,e=ease(seg(phase,.9,1.6))-ease(seg(phase,6,1)),s=H*.30,gap=e*H*.09,cx=W*.34,rx=s*1.25,ry=s*.25,total=layers.reduce((sum,l)=>sum+l[1]*s,0),bottom=H/2+(total+gap*4)/2,yPos=[];let z=0;for(let i=layers.length-1;i>=0;i--){yPos[i]=bottom-z;z+=layers[i][1]*s+gap}for(let i=layers.length-1;i>=0;i--){const [name,thickness,color]=layers[i],y=yPos[i],th=thickness*s;c.fillStyle=color;c.beginPath();c.ellipse(cx,y-th,rx,ry,0,0,TAU);c.fill();c.fillStyle='rgba(0,0,0,.23)';c.beginPath();c.ellipse(cx,y,rx,ry,0,0,Math.PI);c.lineTo(cx-rx,y-th);c.lineTo(cx+rx,y-th);c.closePath();c.fill();c.fillStyle=color;c.beginPath();c.ellipse(cx,y-th,rx,ry,0,0,TAU);c.fill();const a=clamp((e-.5)*2);if(a){const ly=y-th/2,x0=cx+rx*.7,x1=W*.58;c.globalAlpha=a;c.strokeStyle=C.paper;c.lineWidth=1.5;c.beginPath();c.moveTo(x0,ly);c.lineTo(x1,ly);c.stroke();c.fillStyle=C.paper;c.beginPath();c.arc(x0,ly,3,0,TAU);c.fill();c.font='700 17px system-ui,sans-serif';c.textBaseline='middle';c.textAlign='left';c.fillText(name,x1+12,ly);c.globalAlpha=1}}
  } else if(id==='cutaway'){
    fill(c,C.paper);const phase=t%8,e=ease(seg(phase,1,1.4))-ease(seg(phase,6,.9)),cx=W/2,cy=H*.78,s=H*.25,P=(x,y,z)=>[cx+(x-y)*s*.866,cy+(x+y)*s*.5-z*s],poly=(pts,color)=>{c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()},shade=(hex,f)=>'#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-f)).toString(16).padStart(2,'0')).join(''),box=(z,h,color)=>{poly([P(-1,0,z),P(1,0,z),P(1,0,z+h),P(-1,0,z+h)],shade(color,.28));poly([P(1,-1,z),P(1,0,z),P(1,0,z+h),P(1,-1,z+h)],shade(color,.12));poly([P(-1,-1,z+h),P(1,-1,z+h),P(1,0,z+h),P(-1,0,z+h)],color)};box(0,.01,'#B9BDC6');for(const [z,h,color] of [[0,.25,'#893649'],[.25,.3,'#E8506E'],[.55,.25,'#F39AAC'],[.8,.2,C.ink]])box(z*1.6,h*1.6-.02,color);const Hbox=1.6,keep=Hbox*(1-e*.72),shell='#B9BDC6';poly([P(-1,0,0),P(1,0,0),P(1,0,keep),P(-1,0,keep)],shade(shell,.28));poly([P(1,-1,0),P(1,0,0),P(1,0,keep),P(1,-1,keep)],shade(shell,.12));if(e<.02)poly([P(-1,-1,Hbox),P(1,-1,Hbox),P(1,0,Hbox),P(-1,0,Hbox)],shell);if(e>0&&e<1){c.strokeStyle=C.ink;c.lineWidth=H*.012;c.beginPath();c.moveTo(...P(-1,0,keep));c.lineTo(...P(1,0,keep));c.lineTo(...P(1,-1,keep));c.stroke()}
  } else if(id==='shutter-wipe'){
    const phase=t%4,accent='#1fb598',maxR=Math.hypot(W,H)*.73;
    let scene='A',r=maxR,angle=0;
    if(phase<.4){}else if(phase<.72){r=maxR*(1-ease(seg(phase,.4,.32)));angle=seg(phase,.4,.32)*Math.PI/3}
    else if(phase<.86){r=0;angle=Math.PI/3}
    else if(phase<1.25){scene='B';r=maxR*ease(seg(phase,.86,.39));angle=Math.PI/3+seg(phase,.86,.39)*Math.PI/3}
    else if(phase<2.4){scene='B';angle=2*Math.PI/3}
    else if(phase<2.72){scene='B';r=maxR*(1-ease(seg(phase,2.4,.32)));angle=2*Math.PI/3+seg(phase,2.4,.32)*Math.PI/3}
    else if(phase<2.86){scene='B';r=0;angle=Math.PI}
    else if(phase<3.25){r=maxR*ease(seg(phase,2.86,.39));angle=Math.PI+seg(phase,2.86,.39)*Math.PI/3}
    else angle=4*Math.PI/3;
    fill(c,'#10151a');
    if(r>1){const points=[];for(let i=0;i<6;i++){const a=angle+i*TAU/6;points.push([W/2+r*Math.cos(a),H/2+r*Math.sin(a)])}
      c.save();c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();sourceScreen(c,scene,accent);c.restore();
      c.strokeStyle='#3b6966';c.lineWidth=3;c.globalAlpha=.65;
      points.forEach(([x,y],i)=>{const a=angle+(i+.5)*TAU/6;c.beginPath();c.moveTo(x,y);c.lineTo(x+W*Math.cos(a),y+W*Math.sin(a));c.stroke()});c.globalAlpha=1;
    }
  } else if(id==='cube-rotate'){
    const s=transitionState(t),accent='#1fb598',q=ease(s.p),hinge=W*(1-q);
    fill(c,C.ink);
    if(hinge>1){c.fillStyle=C.ink;c.beginPath();c.moveTo(0,H*.06*q);c.lineTo(hinge,H*.02);c.lineTo(hinge,H*.98);c.lineTo(0,H*(1-.06*q));c.closePath();c.fill();c.save();c.beginPath();c.rect(0,0,hinge,H);c.clip();label(c,'A',hinge*.48,H/2,76*Math.max(.45,1-q*.5),C.paper);c.restore()}
    if(hinge<W-1){c.fillStyle=accent;c.beginPath();c.moveTo(hinge,H*.02);c.lineTo(W,H*.06*(1-q));c.lineTo(W,H*(1-.06*(1-q)));c.lineTo(hinge,H*.98);c.closePath();c.fill();c.save();c.beginPath();c.rect(hinge,0,W-hinge,H);c.clip();label(c,'B',hinge+(W-hinge)*.52,H/2,76*Math.max(.45,.5+q*.5),C.ink);c.restore()}
    c.strokeStyle='#0c0e13';c.lineWidth=3;c.beginPath();c.moveTo(hinge,H*.02);c.lineTo(hinge,H*.98);c.stroke();
  } else if(id==='flip-cards'){
    fill(c,'#6856df');const front=['이','벤','트'],backLetters=['새','소','식'],cw=118,ch=H*.67,gap=15,x0=W/2-(cw*3+gap*2)/2;
    for(let i=0;i<3;i++){
      const u=clamp((t-.45-i*.22)/.75),second=u>.5,sy=Math.max(.02,second?(u-.5)*2:1-u*2),x=x0+i*(cw+gap),y=H/2;
      c.save();c.translate(x+cw/2,y);c.scale(1,sy);rounded(c,-cw/2,-ch/2,cw,ch,13,C.ink);label(c,second?backLetters[i]:front[i],0,0,83,C.paper);c.restore();
    }
  } else if(id==='puzzle-in'){
    fill(c,C.ink);const scene=document.createElement('canvas');scene.width=W;scene.height=H;const sc=scene.getContext('2d');fill(sc,C.paper);
    sc.fillStyle='#f34c36';sc.beginPath();sc.arc(W*.72,H*.32,H*.14,0,TAU);sc.fill();
    sc.fillStyle='#bb8177';sc.beginPath();sc.moveTo(0,H*.72);sc.quadraticCurveTo(W*.28,H*.4,W*.58,H*.82);sc.lineTo(W,H);sc.lineTo(0,H);sc.fill();
    sc.fillStyle='#98372c';sc.beginPath();sc.moveTo(W*.3,H);sc.quadraticCurveTo(W*.67,H*.53,W,H*.74);sc.lineTo(W,H);sc.fill();
    const cols=3,rows=2,cw=W/cols,ch=H/rows,offsets=[[-W*.65,-H*.25],[0,-H*.9],[W*.65,-H*.3],[-W*.7,H*.5],[0,H*.85],[W*.65,H*.5]];
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const i=row*cols+col,p=out(seg(t,.25+i*.16,1.1)),cx=col*cw+cw/2+offsets[i][0]*(1-p),cy=row*ch+ch/2+offsets[i][1]*(1-p);
      c.save();c.translate(cx,cy);c.rotate((i%2?-.24:.24)*(1-p));c.globalAlpha=.42+.58*p;
      c.drawImage(scene,col*cw,row*ch,cw,ch,-cw/2,-ch/2,cw+.5,ch+.5);c.restore();
    }
  } else if(id==='motion-trail'){
    fill(c,C.ink);[.14,.28,.5,1].forEach((alpha,i)=>{const u=Math.max(0,t-i*.07),p=ease(seg(u,0,1.08)),px=mix(90,W-90,p);c.globalAlpha=alpha;rounded(c,px-21,H/2-21,42,42,10,'#38be86')});c.globalAlpha=1;
  } else if(id==='track'){
    fill(c,C.ink);const p=t/4;for(let layer=0;layer<2;layer++){const spacing=layer?105:135,shift=(layer?-320:-145)*p,r=layer?19:13;c.fillStyle=layer?C.orange:'#39506a';for(let y=layer?73:40;y<H+80;y+=spacing)for(let x=-200;x<W+250;x+=spacing){c.beginPath();c.arc(x+shift+(layer?16:34),y,r,0,TAU);c.fill()}}
  } else if(id==='slide-over'){
    const s=transitionState(t),color='#2ba8e0';sourceScreen(c,s.from,color);const q=out(s.p);c.fillStyle='rgba(0,0,0,'+(.35*q)+')';c.fillRect(0,0,W,H);c.save();c.translate(0,-H*(1-q));sourceScreen(c,s.to,color);c.restore();
  } else if(id==='wave-lines'){
    fill(c,'#14161b');c.lineWidth=Math.max(1.2,H/70);const phase=TAU*t/8;for(let i=0;i<12;i++){c.strokeStyle=i%3?'#f4f1ea':'#e8930c';c.globalAlpha=i%3?.75:1;c.beginPath();for(let x=0;x<=W;x+=4){const y=H*(.08+i*.075)+H*.16*Math.sin(x/W*4+phase+i*.25)*Math.sin(x/W*2-phase+1);x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}c.globalAlpha=1;
  } else if(id==='stamp-in'){
    fill(c,C.paper);if(t<.4)return;const p=ease(seg(t,.4,.35)),hit=seg(t,.75,.3),sc=mix(2.2,1,p),shake=hit>0&&hit<1?Math.sin(hit*30)*H*.02*(1-hit):0;c.save();c.translate(W/2+shake,H/2);c.rotate(-.12*(1-p));c.scale(sc,sc);mark(c,0,0,H*.56,'#f05032');c.restore();if(hit>0&&hit<1){const size=H*(.56+.4*hit);c.globalAlpha=1-hit;c.strokeStyle='#f05032';c.lineWidth=3;c.beginPath();c.roundRect(W/2-size/2,H/2-size/2,size,size,size*.25);c.stroke();c.globalAlpha=1}
  } else if(supplementIds.includes(id))drawSupplement(id,c,t);
  else throw new Error('No verified renderer for '+id);
}
export const implementedIds=['bauhaus-tiles','before-after-card','checker-scroll','iris-wipe','countdown','wipe','odometer-roll','dip-to-black','horizontal-split','light-sweep','line-tunnel','liquid-wipe','multi-stripe-wipe','bars-wipe','sliding-panels','float-bob','goal-fill','pendulum','marquee-stack','bar-swap','liquid-fill','brush-wipe','diagonal-panels','grid-flip','stacked-build','motion-path','orbit-shapes','barber-stripes','kaleidoscope','shutter-wipe','cube-rotate','flip-cards','puzzle-in','motion-trail','track','slide-over','wave-lines','stamp-in','dot-wave','blob-morph','halftone-pulse','nested-squares','drop-zoom','stack-cards','concentric-arcs','icon-bounce','squash-pop','star-fill','toggle-on','spinner-arc','percent-ring','typing-bubble','chat-bubble-pop','reaction-float','confetti-fall','elastic-slide','line-boil','stop-motion','marching-ants','turntable','ink-splash','ransom-collage','paper-cut','icon-tiles','hud-assemble','waterfall-steps','sparkline-scroll','line-chart-draw','dot-globe','treemap-split','ink-bleed','blur-focus','text-mosaic','mosaic-flash','text-flag','underwater-warp','text-fan','accordion-fold','time-lapse','speed-ramp','squeeze-swap','word-morph','text-corridor','split-invert','diagonal-split','text-sandwich','text-cylinder','ring-text','network-pulse','branch-flow','subscribe-button','follow-pill','swipe-up-hint','arrow-point','location-pin','scramble-decode','reply-thread','comment-rise','hex-grid','eclipse-circle','karaoke-ball','highlighter','outline-fill','punch-zoom','text-zoom-through','headline-swap','iso-build','isometric-grid','story-progress','bar-grow','isotype-row','gradient-flow','fluid-gradient','split-halves','lens-flare','boot-sequence','color-blocks','cloud-sky','dice-roll','grid-zoom','badge-count','bar-race','domino-letters','wave-letters','ripple-ring','live-badge','new-tag-flash','square-snap','ping-pong','trim-path','ripple-interference','dot-spiral','gravity-flip','magnet-pull','toast-slide','crumble-down','comic-dots','jitter-settle','donut-split','pie-sweep','spin-settle','wiggle-hint','breathe-pulse','text-vortex','punch-in','snap-zoom','push','curtain-slide','island-alert','perspective-grid','notification-stack','arc','sliding-bands','roulette','crosshatch','waffle-fill','stretch-text','speed-lines','dot-matrix','dolly-zoom','perspective-tilt','clock-wipe','blinds','scan-print','camera-2-5d','roll','split-join','pan','tilt','dolly','pedestal'];
export const durations={'bauhaus-tiles':4,'before-after-card':4,'checker-scroll':4,'iris-wipe':3,'countdown':4.4,'wipe':3,'odometer-roll':4,'dip-to-black':4,'horizontal-split':4,'light-sweep':2.6,'line-tunnel':4,'liquid-wipe':4,'multi-stripe-wipe':4,'bars-wipe':4,'sliding-panels':4,'float-bob':2.6,'goal-fill':3.5,'pendulum':3,'marquee-stack':4,'bar-swap':4,'liquid-fill':4,'brush-wipe':4,'diagonal-panels':4,'grid-flip':4,'stacked-build':4,'motion-path':4,'orbit-shapes':4,'barber-stripes':4,'kaleidoscope':4,'shutter-wipe':4,'cube-rotate':4,'flip-cards':4,'puzzle-in':4,'motion-trail':2.4,'track':4,'slide-over':4,'wave-lines':4,'stamp-in':4,'soft-wave':4,'polka-drift':4,'dot-wave':4,'blob-morph':4,'floating-shapes':4,'liquid-gauge':4,'halftone-pulse':4,'nested-squares':4,'polygon-tunnel':4,'drop-zoom':4,'stack-cards':4,'concentric-arcs':4,'icon-bounce':3.6,'squash-pop':3,'star-fill':4,'toggle-on':3,'spinner-arc':4,'percent-ring':4,'typing-bubble':4,'chat-bubble-pop':4,'reaction-float':4,'confetti-fall':4,'elastic-slide':4,'line-boil':4,'stop-motion':4,'marching-ants':4,'turntable':4,'ink-splash':4,'ransom-collage':4,'paper-cut':4,'icon-tiles':4,'hud-assemble':4,'waterfall-steps':4,'sparkline-scroll':4,'line-chart-draw':4,'dot-globe':4,'treemap-split':4,'ink-bleed':4,'blur-focus':4,'text-mosaic':4,'mosaic-flash':4,'text-flag':4,'underwater-warp':4,'text-fan':4,'accordion-fold':4,'time-lapse':4,'speed-ramp':4,'squeeze-swap':4,'word-morph':4,'text-corridor':4,'split-invert':4,'diagonal-split':4,'text-sandwich':4,'text-cylinder':4,'ring-text':4,'network-pulse':4,'branch-flow':4};
Object.assign(durations,{'subscribe-button':4,'follow-pill':4,'swipe-up-hint':4,'arrow-point':4,'location-pin':4});
Object.assign(durations,{'scramble-decode':4,'reply-thread':4,'comment-rise':4});
Object.assign(durations,{'hex-grid':5,'eclipse-circle':4,'karaoke-ball':4,'highlighter':4});
Object.assign(durations,{'outline-fill':4,'punch-zoom':4,'text-zoom-through':4,'headline-swap':4,'iso-build':4,'isometric-grid':4});
Object.assign(durations,{'story-progress':8,'bar-grow':4,'isotype-row':4});
Object.assign(durations,{'gradient-flow':4,'fluid-gradient':4,'split-halves':4});
Object.assign(durations,{'lens-flare':4});
Object.assign(durations,{'boot-sequence':4.6,'color-blocks':4.5,'cloud-sky':4,'dice-roll':4});
Object.assign(durations,{'grid-zoom':4,'badge-count':4,'bar-race':4});
Object.assign(durations,{'domino-letters':4,'wave-letters':4,'ripple-ring':4.5,'live-badge':8,'new-tag-flash':4,'square-snap':4,'ping-pong':4});
Object.assign(durations,{'trim-path':4,'ripple-interference':4,'dot-rings':4,'dot-spiral':4,'gravity-flip':4,'magnet-pull':4,'toast-slide':4,'crumble-down':4});
Object.assign(durations,{'comic-dots':4,'jitter-settle':4,'donut-split':4,'pie-sweep':4,'spin-settle':4,'wiggle-hint':4,'breathe-pulse':4,'text-vortex':7});
Object.assign(durations,{'punch-in':2,'snap-zoom':2.4,'push':4,'slide-reveal':4,'curtain-slide':4,'vertical-split':4,'island-alert':4});
Object.assign(durations,{'perspective-grid':4,'notification-stack':8,'arc':2.6,'sliding-bands':4,'roulette':4.9,'crosshatch':8,'waffle-fill':8,'stretch-text':4,'speed-lines':8,'dot-matrix':8,'dolly-zoom':8,'perspective-tilt':8,'clock-wipe':4,'blinds':4,'scan-print':4,'camera-2-5d':5,'roll':8,'split-join':4,'pan':7.2,'tilt':7.2,'dolly':8,'pedestal':8});
implementedIds.push('zoom','panel-zoom-out','equalizer-stripes','letter-slam','gravity-throw','block-wipe','ripple-wipe','halftone-gradient','moire-grid','triple-split','freeze-frame','repeater','save-bookmark','share-fling','spring-follow','rack-focus','cross-dissolve','pixel-dissolve','diamond-wipe','whip-pan','corner-wipe','impact-flash','circle-split','drip-wipe','quad-open','four-panel','frame-stack','impact-shake','rgb-split','glitch','film-grain','light-leak','bloom-glow','datamosh','vector-crt','match-cut','strobe','particles','tv-off','squeeze-line','film-burn','vhs-rewind','roll-up','paper-tear','page-curl','glass-shatter','magnifier-lens','water-reflection','long-shadow','letter-rain','disintegrate','weight-grow','layer-peel','detail-inset','flow-field','exploded-view','cutaway','pixelate','halftone-wipe','neon-contour','dot-ocean','wireframe-terrain','reaction-diffusion','hologram','shockwave','slash-cut','flash-reveal','particle-form','film-leader','spotlight-reveal','tracking-expand','tape-label');
implementedIds.push(...supplementIds);
export const contextVariantIds=['bell-shake','floating-shapes','liquid-gauge','polka-drift','polygon-tunnel','slide-reveal','soft-wave','vertical-split','dot-rings','free-ship'];
implementedIds.push(...contextVariantIds);
Object.assign(durations,{'zoom':8,'panel-zoom-out':4,'equalizer-stripes':8,'letter-slam':4,'gravity-throw':8,'block-wipe':4,'ripple-wipe':4,'halftone-gradient':4,'moire-grid':8,'triple-split':4,'freeze-frame':3,'repeater':8,'save-bookmark':4,'share-fling':4,'spring-follow':8,'rack-focus':8,'cross-dissolve':3,'pixel-dissolve':3.2,'diamond-wipe':4,'whip-pan':2.6,'corner-wipe':4,'impact-flash':4,'circle-split':4,'drip-wipe':4,'quad-open':4,'four-panel':4,'frame-stack':4,'impact-shake':4,'rgb-split':3.2,'glitch':3.2,'film-grain':4,'light-leak':3,'bloom-glow':2.4,'datamosh':3.2,'vector-crt':8,'match-cut':3.2,'strobe':2.4,'particles':2,'tv-off':4,'squeeze-line':4,'film-burn':4,'vhs-rewind':4,'roll-up':4,'paper-tear':4,'page-curl':4,'glass-shatter':4,'magnifier-lens':8,'water-reflection':8,'long-shadow':8,'letter-rain':8,'disintegrate':4,'weight-grow':4,'layer-peel':8,'detail-inset':8,'flow-field':8,'exploded-view':8,'cutaway':8,'pixelate':8,'halftone-wipe':8,'neon-contour':8,'dot-ocean':8,'wireframe-terrain':8,'reaction-diffusion':8,'hologram':8,'shockwave':8,'slash-cut':8,'flash-reveal':8,'particle-form':8,'film-leader':8,'spotlight-reveal':8,'tracking-expand':8,'tape-label':8});
Object.assign(durations,Object.fromEntries(supplementIds.map(id=>[id,4])));
Object.assign(durations,Object.fromEntries(contextVariantIds.map(id=>[id,durations[id]||4])));
export function renderVerified(canvas,id,timeSeconds){
  if(!implementedIds.includes(id))throw new Error('Unimplemented verified core: '+id);
  const ratio=Math.min(window.devicePixelRatio||1,2),width=Math.round(W*ratio),height=Math.round(H*ratio);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
  const c=canvas.getContext('2d');c.setTransform(ratio,0,0,ratio,0,0);draw(id,c,Math.max(0,timeSeconds));
}
