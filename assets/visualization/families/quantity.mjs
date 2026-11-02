import {clamp,point} from '../svg-core.mjs';

const chart=(c)=>{c.line(52,206,488,206,'muted');c.line(52,42,52,206,'muted');c.text(40,53,'값',{size:10,color:'muted',anchor:'end'})};
const polarPoints=(cx,cy,radii)=>{const rs=Array.isArray(radii)?radii:Array(5).fill(radii);return rs.map((r,i)=>point(cx,cy,r,-Math.PI/2+i*2*Math.PI/rs.length))};

export function renderQuantity(c){
  const g=c.template.grammar;
  if(g==='bar'){
    const rowH=44;c.height=Math.max(c.height,32+c.values.length*rowH+22);
    const max=Math.max(1,...c.values.map(Number));c.values.forEach((v,i)=>{const y=32+i*rowH,w=clamp(Number(v)/max,0,1)*314;c.textBox(18,y-2,85,31,c.label(i),{size:12,minSize:10,maxLines:2,padding:0,align:'start',weight:400,role:'bar-label'});c.rect(110,y,330,26,'faint','none',2);c.rect(110,y,w,26,i===c.values.length-1?'teal':'blue','none',2);c.text(450,y+19,String(v),{size:12,weight:500})});c.text(110,c.height-8,'공통 기준선 0',{size:10,color:'muted'});return;
  }
  if(g==='line'){
    chart(c);const vals=c.values.slice(0,5).map(Number),max=Math.max(1,...vals),xs=[85,180,275,370,465],pts=vals.map((v,i)=>[xs[i],202-(v/max)*137]);
    c.path(`M ${pts.map(p=>p.join(' ')).join(' L ')}`,'none','teal',2.5,'class="data-line"');pts.forEach(([x,y],i)=>{c.circle(x,y,5,'white','teal');c.text(x,218,c.label(i),{anchor:'middle',size:11,max:6});c.text(x,y-11,String(vals[i]),{anchor:'middle',size:10,color:'teal'})});return;
  }
  if(g==='scatter'||g==='bubble'){
    chart(c);const count=g==='bubble'?4:6;for(let i=0;i<count;i++){const x=65+clamp(c.value(i,20+i*9),0,80)*5,y=200-clamp(c.value(i+count,15+i*9),0,90)*1.55,r=g==='bubble'?6+clamp(c.value(i+count*2,12),0,35)*.55:5;c.circle(x,y,r,i===count-1?'teal':'blueLight',i===count-1?'teal':'blue');c.text(x,y-r-6,c.label(i),{anchor:'middle',size:10,max:5})}c.text(482,226,'X',{anchor:'end',size:10,color:'muted'});return;
  }
  if(g==='waterfall'){
    const vals=[c.value(0,100),c.value(1,30),c.value(2,-20),c.value(3,110)],start=vals[0],tops=[start,start+vals[1],start+vals[1]+vals[2],vals[3]],scale=1.1,base=216;
    for(let i=0;i<4;i++){const x=65+i*116;if(i===0||i===3)c.rect(x,base-tops[i]*scale,68,tops[i]*scale,i===3?'teal':'blueLight',i===3?'teal':'blue',2);else{const prev=tops[i-1],next=tops[i];c.rect(x,base-Math.max(prev,next)*scale,68,Math.abs(vals[i])*scale,vals[i]>=0?'tealLight':'orangeLight',vals[i]>=0?'teal':'orange',2)}c.text(x+34,221,c.label(i),{anchor:'middle',size:11,max:8});c.text(x+34,base-tops[i]*scale-9,`${vals[i]>0&&i>0&&i<3?'+':''}${vals[i]}`,{anchor:'middle',size:11,weight:700})}return;
  }
  if(g==='heatmap'){
    const vals=c.values.slice(0,12),xs=[83,185,287,389];c.text(32,53,'행 × 열',{size:11,color:'muted'});xs.forEach((x,i)=>c.text(x+42,56,c.label(i),{anchor:'middle',size:11}));for(let r=0;r<3;r++){c.text(36,93+r*57,`R${r+1}`,{size:11,color:'muted'});for(let col=0;col<4;col++){const v=clamp(vals[r*4+col]??0,0,4),x=xs[col],y=70+r*57;c.rect(x,y,84,43,['white','#e4f0eb','#badbd0','#73b5a8','#126b68'][v],'none',3);c.text(x+42,y+27,String(v),{anchor:'middle',size:12,color:v===4?'white':'ink',weight:700})}}return;
  }
  if(g==='radar'){
    const cx=260,cy=132;for(let ring=1;ring<=4;ring++){const ps=polarPoints(cx,cy,ring*29);c.poly(ps.map(p=>p.map(Math.round).join(',')).join(' '),'none','faint')}const pts=polarPoints(cx,cy,c.values.slice(0,5).map(v=>clamp(Number(v),0,5)*23));c.poly(pts.map(p=>p.map(Math.round).join(',')).join(' '),'#dcece7','teal','fill-opacity=".65"');polarPoints(cx,cy,122).forEach(([x,y],i)=>c.text(x,Math.min(y+4,217),c.label(i),{size:10,anchor:'middle',max:5}));return;
  }
  if(g==='polar'){
    const cx=260,cy=131;[35,75,115].forEach(r=>c.circle(cx,cy,r,'none','faint'));c.values.slice(0,4).forEach((v,i)=>{const ang=-Math.PI/2+i*Math.PI/2,outer=35+clamp(Number(v),0,5)*16,[x1,y1]=point(cx,cy,25,ang),[x2,y2]=point(cx,cy,outer,ang),[lx,ly]=point(cx,cy,119,ang);c.line(x1,y1,x2,y2,i===1?'teal':'blue',14);c.text(lx,Math.min(ly+4,217),c.label(i),{anchor:'middle',size:11,max:5})});c.circle(cx,cy,9,'teal','teal');return;
  }
  if(g==='slope'){
    c.line(85,40,85,205,'muted');c.line(435,40,435,205,'muted');c.text(85,31,'이전',{anchor:'middle',size:11,color:'muted'});c.text(435,31,'이후',{anchor:'middle',size:11,color:'muted'});
    for(let i=0;i<3;i++){const a=c.value(i,3),b=c.value(i+3,3),y1=202-a*36,y2=202-b*36;c.line(95,y1,425,y2,i===0?'teal':'blue',i===0?2.5:1.7);c.circle(85,y1,5,i===0?'teal':'blue','none');c.circle(435,y2,5,i===0?'teal':'blue','none');c.textBox(6,y1-11,66,22,c.label(i),{size:11,minSize:9,maxLines:1,padding:0,align:'end'});c.text(448,y2+4,String(b),{size:11,max:5})}return;
  }
  if(g==='treemap'){
    const vals=c.values.slice(0,4).map(Number),sum=Math.max(1,vals.reduce((a,b)=>a+b,0));const w1=440*vals[0]/sum,w2=440*vals[1]/sum;c.rect(40,42,w1,172,'tealLight','teal',2);c.text(55,70,`${c.label(0)} ${Math.round(vals[0]/sum*100)}%`,{size:13,weight:700});c.rect(40+w1,42,w2,172,'blueLight','blue',2);c.text(52+w1,70,`${c.label(1)} ${Math.round(vals[1]/sum*100)}%`,{size:12,max:13});const rem=440-w1-w2,tail=vals[2]+vals[3],h3=tail>0?172*vals[2]/tail:86;c.rect(40+w1+w2,42,rem,h3,'orangeLight','orange',2);c.rect(40+w1+w2,42+h3,rem,172-h3,'faint','line',2);c.text(50+w1+w2,65,`${c.label(2)} ${Math.round(vals[2]/sum*100)}%`,{size:11,max:11});c.text(50+w1+w2,62+h3,`${c.label(3)} ${Math.round(vals[3]/sum*100)}%`,{size:11,max:11});return;
  }
  if(g==='sankey'){
    const total=c.value(0),direct=c.value(1),search=c.value(2),done=c.value(3),lost=c.value(4),unit=Math.min(1.05,150/Math.max(1,total),70/Math.max(1,direct,search,done,lost));
    const top={1:76,2:160,3:76,4:160},amount={1:direct,2:search,3:done,4:lost};
    c.rect(40,76,25,total*unit,'teal','none',1);
    for(const [index,x,fill] of [[1,250,'blue'],[2,250,'orange'],[3,453,'teal'],[4,453,'faint']])c.rect(x,top[index],24,amount[index]*unit,fill,'none',1);
    c.path(`M65 ${76+direct*unit/2} C140 ${76+direct*unit/2} 170 ${top[1]+direct*unit/2} 250 ${top[1]+direct*unit/2}`,'none','#8abfb4',Math.max(1,direct*unit),'stroke-opacity=".75"');
    c.path(`M65 ${76+direct*unit+search*unit/2} C140 ${76+direct*unit+search*unit/2} 170 ${top[2]+search*unit/2} 250 ${top[2]+search*unit/2}`,'none','#e0b398',Math.max(1,search*unit),'stroke-opacity=".75"');
    if(!Array.isArray(c.options.flows))c.warnings.push('생키의 채널별 결과 분할 자료가 없어 중간→결과 연결을 그리지 않았습니다. flows를 제공하세요.');
    else{
      const offsets={1:0,2:0,3:0,4:0};
      for(const flow of c.options.flows){
        if(flow.value<=0)continue;
        const sy=top[flow.from]+(offsets[flow.from]+flow.value/2)*unit,ey=top[flow.to]+(offsets[flow.to]+flow.value/2)*unit;
        c.path(`M274 ${sy} C350 ${sy} 380 ${ey} 453 ${ey}`,'none',flow.from===1?'#8abfb4':'#e0b398',Math.max(1,flow.value*unit),'stroke-opacity=".72"');
        offsets[flow.from]+=flow.value;offsets[flow.to]+=flow.value;
      }
    }
    [[52,62,0],[262,62,1],[262,148,2],[466,62,3],[466,148,4]].forEach(([x,y,i])=>c.text(x,y,`${c.label(i)} ${c.value(i)}`,{anchor:'middle',size:10,max:10}));return;
  }
  if(g==='donut'){
    const vals=c.values.slice(0,3),sum=Math.max(1,vals.reduce((a,b)=>a+Number(b),0)),cx=197,cy=126,r=77,circ=2*Math.PI*r;let offset=0;['teal','blue','orange'].forEach((key,i)=>{const length=circ*Number(vals[i])/sum;c.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c.colors[key]}" stroke-width="30" stroke-dasharray="${length} ${circ-length}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`);offset+=length});c.text(cx,130,'100%',{anchor:'middle',size:20,weight:700});vals.forEach((v,i)=>{const y=83+i*51;c.rect(330,y,13,13,['teal','blue','orange'][i],'none',2);c.text(354,y+12,`${c.label(i)}  ${Math.round(Number(v)/sum*100)}%`,{size:12,weight:600})});return;
  }
  if(g==='stacked'){
    const vals=c.values.slice(0,9),totals=[0,1,2].map(i=>vals.slice(i*3,i*3+3).reduce((a,b)=>a+Number(b),0)),max=Math.max(1,...totals);for(let i=0;i<3;i++){const x=103+i*136,seg=vals.slice(i*3,i*3+3).map(Number),sum=totals[i];let y=202;seg.forEach((v,j)=>{const h=v/max*145;y-=h;c.rect(x,y,73,h,['teal','blue','orange'][j],'none',0)});c.text(x+36,225,c.label(i),{anchor:'middle',size:11});c.text(x+36,y-9,String(sum),{anchor:'middle',size:11,weight:700})}return;
  }
}
