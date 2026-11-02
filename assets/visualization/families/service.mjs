import {renderComparison} from './comparison.mjs';

export function renderService(c){
  const g=c.template.grammar;
  if(g==='access')return renderComparison(c);
  if(g==='kanban'){
    for(let i=0;i<3;i++){const x=18+i*168;c.rect(x,29,150,197,i===1?'tealLight':'paper','line',3);c.textBox(x+11,35,98,25,c.label(i),{size:13,minSize:10,maxLines:1,padding:0,align:'start',weight:700});c.text(x+133,53,i===1?'WIP 1':'WIP 2',{size:9,color:'muted',anchor:'end'});for(let j=0;j<(i===1?1:2);j++){const y=71+j*65;c.rect(x+12,y,126,48,'white',i===1?'teal':'line',3);c.textBox(x+22,y+5,106,27,c.label((i+j)%2+3),{size:11,minSize:9,maxLines:2,padding:0,align:'start',weight:500});c.line(x+23,y+38,x+87,y+38,'faint')}}return;
  }
  if(g==='journey'){
    const xs=[69,196,323,450],vals=c.values.slice(0,4).map(Number);c.line(39,193,481,193,'line');const pts=[];xs.forEach((x,i)=>{c.text(x,55,c.label(i),{anchor:'middle',size:12,weight:700,max:8});c.circle(x,92,14,i===3?'tealLight':'white',i===3?'teal':'line');c.text(x,97,String(i+1),{anchor:'middle',size:10,color:'teal'});pts.push([x,177-(vals[i]||1)*20])});c.path(`M ${pts.map(p=>p.join(' ')).join(' L ')}`,'none','blue',2);pts.forEach(([x,y],i)=>c.circle(x,y,5,i===2?'orange':'teal',i===2?'orange':'teal'));c.text(22,205,'감정',{size:10,color:'muted'});return;
  }
  if(g==='blueprint'){
    const xs=[113,255,397];['고객 행동','보이는 접점','숨은 처리'].forEach((v,i)=>{const y=44+i*63;c.text(19,y+15,v,{size:11,color:'muted',weight:700});c.line(103,y+42,505,y+42,i===1?'orange':'line',i===1?1.8:1,i===1?'5 4':'')});
    for(let i=0;i<3;i++){c.text(xs[i],32,c.label(i+3),{anchor:'middle',size:12,weight:700});for(let r=0;r<3;r++){const y=52+r*63;c.rect(xs[i]-42,y,84,32,r===0?'tealLight':r===2?'blueLight':'white','line',3);c.text(xs[i],y+21,c.label(r),{anchor:'middle',size:10,max:8})}if(i<2)c.connectBoxes({x:xs[i],y:68,w:84,h:32},{x:xs[i+1],y:68,w:84,h:32},'teal')}return;
  }
  if(g==='story'){
    const xs=[35,190,345];xs.forEach((x,i)=>{c.rect(x,30,140,41,'tealLight','teal',3);c.textBox(x+7,35,126,31,c.label(i),{size:12,minSize:10,maxLines:1,padding:0,weight:700});c.rect(x,87,140,56,'white','line',2);c.text(x+70,119,`핵심 ${i+1}`,{anchor:'middle',size:11});c.rect(x,153,140,56,'faint','line',2);c.text(x+70,185,`확장 ${i+1}`,{anchor:'middle',size:11})});c.textBox(4,101,25,34,c.label(3),{size:10,minSize:9,maxLines:1,padding:0,color:'muted'});c.textBox(4,167,25,34,c.label(4),{size:10,minSize:9,maxLines:1,padding:0,color:'muted'});return;
  }
  if(g==='medallion'){
    const xs=[33,202,371];xs.forEach((x,i)=>{c.circle(x+57,128,56,['orangeLight','blueLight','tealLight'][i],['orange','blue','teal'][i]);c.textBox(x+10,91,94,49,c.label(i),{size:13,minSize:10,maxLines:3,padding:0,weight:700,role:'circle-label'});c.textBox(x+18,142,78,18,['수집','품질','활용'][i],{size:10,minSize:10,maxLines:1,padding:0,color:'muted'});if(i<2)c.arrow(x+113,128,x+170,128,'teal')});return;
  }
}
