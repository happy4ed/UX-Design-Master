export function renderInfographic(c){
  const g=c.template.grammar;
  if(g==='factstrip'){
    for(let i=0;i<3;i++){const x=28+i*166;if(i)c.line(x-13,45,x-13,212,'line');c.text(x,71,c.label(i),{size:12,color:'muted',weight:700});c.text(x,150,String(c.value(i)),{size:42,color:i===1?'teal':'ink',weight:700});c.line(x,171,x+135,171,i===1?'teal':'line',2);c.text(x,196,['관찰값','핵심 수치','관련 지표'][i],{size:11,color:'muted'})}return;
  }
  if(g==='ranked'){
    const vals=c.values.slice(0,3).map(Number);for(let i=0;i<3;i++){const y=33+i*69;c.text(30,y+29,`0${i+1}`,{size:16,color:'teal',weight:700});c.text(83,y+22,c.label(i),{size:13,weight:700});c.rect(83,y+35,340,13,'faint','none',2);c.rect(83,y+35,Math.max(10,Math.min(340,vals[i]/100*340)),13,i===0?'teal':'blue','none',2);c.text(446,y+44,String(vals[i]),{size:13,weight:700})}return;
  }
  if(g==='comparepanel'){
    [[28,0,'tealLight','teal'],[268,1,'blueLight','blue']].forEach(([x,i,fill,stroke])=>{c.rect(x,35,224,190,fill,stroke,4);c.text(x+20,67,c.label(i),{size:17,weight:700});c.line(x+20,81,x+203,81,stroke);c.text(x+20,113,c.label(2),{size:12,weight:700});c.text(x+20,140,i?'낮음':'높음',{size:12,color:i?'blue':'teal'});c.text(x+20,171,c.label(3),{size:12,weight:700});c.text(x+20,198,i?'높음':'보통',{size:12,color:i?'blue':'teal'})});return;
  }
  if(g==='roadmap'){
    c.path('M44 176 C150 176 143 74 260 82 S372 177 480 91','none','teal',3);const pts=[[63,169],[184,101],[327,114],[454,105]];pts.forEach(([x,y],i)=>{c.circle(x,y,13,i===3?'teal':'white','teal');c.text(x,y+4,String(i+1),{anchor:'middle',size:10,color:i===3?'white':'teal',weight:700});c.textBox(Math.max(7,Math.min(415,x-49)),i%2?y-55:y+19,98,24,c.label(i),{size:12,minSize:10,maxLines:1,padding:0,weight:700})});return;
  }
  if(g==='stepstory'){
    for(let i=0;i<4;i++){const x=23+i*127;c.text(x,85,String(i+1).padStart(2,'0'),{size:39,color:i===2?'teal':'line',weight:700});c.line(x,105,x+102,105,i===2?'teal':'line',2);c.textBox(x,112,102,28,c.label(i),{size:14,minSize:10,maxLines:1,padding:0,align:'start',weight:700});c.text(x,160,['발견','선택','확인','활용'][i],{size:11,color:'muted'})}return;
  }
  if(g==='scorecard'){
    for(let i=0;i<3;i++){const x=29+i*166,v=c.value(i,0);c.text(x,56,c.label(i),{size:12,weight:700});c.text(x,113,`${v}%`,{size:31,color:i===2?'teal':'ink',weight:700});c.rect(x,134,133,12,'faint','none',2);c.rect(x,134,Math.max(1,Math.min(133,v/100*133)),12,i===2?'teal':'blue','none',2);c.line(x+106,127,x+106,153,'orange',2);c.text(x,178,'목표 80%',{size:11,color:'muted'})}return;
  }
}
