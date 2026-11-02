export function renderStructure(c){
  const g=c.template.grammar;
  if(g==='architecture'){
    c.rect(133,25,370,211,'paper','line',3,'stroke-dasharray="6 4"');c.text(150,46,'서비스 영역',{size:11,color:'muted',weight:700});
    c.box(20,101,92,55,c.label(0));c.box(155,101,90,55,c.label(1),{fill:'tealLight',stroke:'teal'});c.box(287,101,90,55,c.label(2));c.box(411,101,70,55,c.label(3));
    c.arrow(112,128,155,128);c.arrow(245,128,287,128);c.arrow(377,128,411,128);return;
  }
  if(g==='delta'){
    c.text(82,32,c.label(0),{size:13,weight:700,anchor:'middle'});c.text(431,32,c.label(1),{size:13,weight:700,anchor:'middle'});
    c.rect(20,45,182,165,'paper','line');c.rect(318,45,182,165,'paper','line');
    c.box(30,83,65,45,c.label(2));c.box(127,83,65,45,c.label(4));c.arrow(95,106,127,106,'muted');
    c.box(337,83,60,45,c.label(2));c.box(417,56,60,45,c.label(3),{fill:'tealLight',stroke:'teal'});c.box(417,138,60,45,c.label(4));c.connectBoxes({x:367,y:105.5,w:60,h:45},{x:447,y:78.5,w:60,h:45});c.arrow(447,101,447,138);c.arrow(202,128,318,128,'orange');c.text(260,117,'추가',{size:11,color:'orange',anchor:'middle'});return;
  }
  if(g==='landscape'){
    for(let i=0;i<3;i++){const y=32+i*70;c.rect(18,y,484,57,i===1?'tealLight':'white','line',3);c.text(34,y+23,c.label(i),{size:12,weight:700});c.box(200,y+11,110,35,c.label(i+3),{size:11});c.box(340,y+11,136,35,i===1?'공유 연동':'개별 운영',{size:11,fill:i===1?'white':'faint'})}return;
  }
  if(g==='tree'||g==='org'){
    c.box(205,25,110,53,c.label(0),{fill:'tealLight',stroke:'teal'});c.line(260,79,260,121);c.line(85,121,435,121);
    [85,260,435].forEach((x,i)=>{c.line(x,121,x,159);c.box(x-65,160,130,55,c.label(i+1),{fill:g==='org'&&i===1?'blueLight':'white',max:13});if(g==='org')c.text(x,233,['책임','협업','운영'][i],{anchor:'middle',size:10,color:'muted'})});return;
  }
  if(g==='nested'){
    c.rect(18,23,484,214,'paper','line',3);c.text(32,45,c.label(0),{size:13,weight:700});
    c.rect(72,63,395,151,'blueLight','blue',3);c.text(88,85,c.label(1),{size:12,weight:700});
    c.rect(140,104,276,83,'white','line',3);c.text(155,126,c.label(2),{size:12});c.box(260,134,117,39,c.label(3),{fill:'tealLight',stroke:'teal',size:11});return;
  }
  if(g==='layers'){
    for(let i=0;i<4;i++){const y=30+i*53;c.rect(43,y,434,43,i===0?'tealLight':i===3?'blueLight':'white',i===0?'teal':'line',3);c.text(71,y+27,`0${i+1}`,{size:11,color:'teal',weight:700});c.text(260,y+27,c.label(i),{size:14,anchor:'middle',weight:700})}return;
  }
  if(g==='dependency'){
    const pts=[[65,126],[200,61],[200,187],[355,61],[448,157]];[[0,1],[0,2],[1,3],[2,3],[3,4],[2,4]].forEach(([a,b])=>c.connectBoxes({x:pts[a][0],y:pts[a][1],w:70,h:44},{x:pts[b][0],y:pts[b][1],w:70,h:44},'muted',1.6));
    pts.forEach(([x,y],i)=>c.box(x-35,y-22,70,44,c.label(i),{fill:i===0?'tealLight':'white',stroke:i===0?'teal':'line',size:11,max:7}));return;
  }
  if(g==='er'){
    const rows=[[20,48,c.label(0),['id · PK','name']], [193,48,c.label(1),['id · PK','customer_id · FK']], [366,48,c.label(2),['id · PK','order_id · FK']]];
    rows.forEach(([x,y,title,fields],i)=>{c.rect(x,y,134,130,i===1?'tealLight':'white',i===1?'teal':'line',3);c.rect(x,y,134,35,i===1?'teal':'blue',i===1?'teal':'blue',3);c.textBox(x+9,y+5,116,25,title,{size:13,minSize:10,maxLines:1,padding:0,align:'start',color:'white',weight:700});fields.forEach((f,j)=>c.textBox(x+12,y+48+j*28,113,22,f,{size:11,minSize:10,maxLines:1,padding:0,align:'start',weight:500}))});
    c.arrow(154,111,193,111);c.arrow(327,111,366,111);c.text(171,98,'1:N',{anchor:'middle',size:10,color:'muted'});c.text(347,98,'1:N',{anchor:'middle',size:10,color:'muted'});return;
  }
  if(g==='uml'){
    c.box(170,27,180,71,c.label(0),{fill:'tealLight',stroke:'teal',subtitle:'+ id · + name'});c.box(34,157,171,70,c.label(1),{subtitle:'+ manage()'});c.box(317,157,171,70,c.label(2),{subtitle:'+ scope'});
    c.path('M119 157 V125 H260 V98','none','blue',1.7);c.poly('252,98 268,98 260,85','white','blue');c.connectBoxes({x:402.5,y:192,w:171,h:70},{x:260,y:62.5,w:180,h:71},'muted');return;
  }
  if(g==='deployment'){
    c.rect(25,51,471,167,'paper','line',3);c.text(42,72,'운영 환경',{size:11,color:'muted'});c.box(43,106,98,55,c.label(0));c.box(183,106,98,55,c.label(1));c.rect(319,82,161,112,'blueLight','blue',3);c.text(333,101,'서비스 영역',{size:10,color:'blue'});c.box(332,113,62,55,c.label(2),{size:10});c.box(407,113,60,55,c.label(3),{size:10});c.arrow(141,133,183,133);c.arrow(281,133,332,133);return;
  }
  if(g==='db'){
    [[54,c.label(0),[c.label(2),'name','created_at']],[309,c.label(1),['id',c.label(3),'total']]].forEach(([x,title,fields],i)=>{c.rect(x,42,158,163,i?'tealLight':'white',i?'teal':'line',3);c.rect(x,42,158,37,i?'teal':'blue',i?'teal':'blue',3);c.textBox(x+11,47,136,27,title,{size:13,minSize:10,maxLines:1,padding:0,align:'start',color:'white',weight:700});fields.forEach((f,j)=>{c.line(x+1,80+j*40,x+157,80+j*40,'faint');c.textBox(x+12,88+j*39,135,26,f,{size:11,minSize:10,maxLines:1,padding:0,align:'start',weight:500})})});c.arrow(212,138,309,138);c.text(258,125,'1:N · FK',{size:10,anchor:'middle',color:'muted'});return;
  }
  if(g==='dataflow'){
    const xs=[18,120,222,324,426];xs.forEach((x,i)=>{c.box(x,94,78,70,c.label(i),{fill:i===3?'tealLight':'white',stroke:i===3?'teal':'line',size:12,max:7});if(i<4)c.arrow(x+78,128,x+102,128)});c.text(260,65,'원천 → 처리 → 활용',{anchor:'middle',size:12,color:'muted'});return;
  }
}
