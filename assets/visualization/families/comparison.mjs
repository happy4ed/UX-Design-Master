export function renderComparison(c){
  const g=c.template.grammar;
  if(g==='quadrant'){
    c.line(260,34,260,225,'muted');c.line(38,130,483,130,'muted');c.text(260,28,'효과 ↑',{anchor:'middle',size:10,color:'muted'});c.text(485,148,'노력 →',{anchor:'end',size:10,color:'muted'});
    [[132,74],[379,74],[132,183],[379,183]].forEach(([x,y],i)=>{c.circle(x,y,22,i===0?'tealLight':'white',i===0?'teal':'line');c.text(x,y+5,c.label(i),{anchor:'middle',size:11,max:8})});return;
  }
  if(g==='venn'){
    c.circle(201,130,88,'#dcece7','teal','fill-opacity=".8"');c.circle(319,130,88,'#e1ebf2','blue','fill-opacity=".8"');
    c.text(161,136,c.label(0),{anchor:'middle',size:12,max:8});c.text(260,136,c.label(1),{anchor:'middle',size:12,weight:700,max:8});c.text(359,136,c.label(2),{anchor:'middle',size:12,max:8});return;
  }
  if(g==='pyramid'){
    const xs=[[214,306],[155,365],[80,440]],ys=[[37,92],[105,161],[174,230]];for(let i=0;i<3;i++){const [left,right]=xs[i],[top,bottom]=ys[i];c.poly(`${left},${top} ${right},${top} ${right+25},${bottom} ${left-25},${bottom}`,i===0?'tealLight':i===1?'blueLight':'faint',i===0?'teal':'line');c.text(260,(top+bottom)/2+5,c.label(i),{anchor:'middle',size:13,weight:700,max:11})}return;
  }
  if(g==='matrix'||g==='access'){
    const labels=c.labels,access=g==='access',head=access?labels.slice(3):labels.slice(3),rows=labels.slice(0,3);const vals=c.values;
    c.rect(30,40,460,179,'white','line',2);for(let i=0;i<4;i++){const x=132+i*119;c.line(x,40,x,219,'line')};for(let i=0;i<4;i++)c.line(30,78+i*47,490,78+i*47,'line');
    head.forEach((v,i)=>c.textBox(134+i*119,45,102,27,v,{size:11,minSize:9,maxLines:1,padding:0,weight:700}));rows.forEach((row,r)=>{c.textBox(39,83+r*47,84,34,row,{size:12,minSize:10,maxLines:2,padding:0,align:'start',weight:700});for(let col=0;col<3;col++){const val=Number(vals[r*3+col]??0),mark=access?(val?'●':'—'):String(val);c.text(185+col*119,108+r*47,mark,{anchor:'middle',size:access?17:13,color:access?(val?'teal':'muted'):'ink',weight:700})}});return;
  }
  if(g==='swot'){
    const positions=[[32,35],[267,35],[32,140],[267,140]];positions.forEach(([x,y],i)=>{c.rect(x,y,220,90,i===0?'tealLight':i===3?'orangeLight':'white',i===0?'teal':i===3?'orange':'line',4);c.text(x+14,y+26,['S','W','O','T'][i],{size:16,color:i===3?'orange':'teal',weight:700});c.text(x+54,y+26,c.label(i),{size:13,weight:700});c.line(x+14,y+38,x+204,y+38,'line');c.text(x+14,y+62,['내부 강점','내부 개선','외부 기회','외부 위험'][i],{size:11,color:'muted'})});return;
  }
  if(g==='fishbone'){
    c.arrow(50,131,404,131,'teal',2);c.box(405,104,96,53,c.label(0),{fill:'tealLight',stroke:'teal',size:12});
    [[115,64],[225,64],[115,199],[225,199]].forEach(([x,y],i)=>{c.line(x,y,x+60,131,'blue',1.7);c.text(x-5,y+(i<2?-8:17),c.label(i+1),{size:11,max:8})});return;
  }
  if(g==='wardley'){
    c.line(55,29,55,220,'muted');c.line(55,220,483,220,'muted');c.text(59,22,'높은 가치',{size:10,color:'muted'});c.text(479,243,'성숙도 →',{size:10,color:'muted',anchor:'end'});
    const pts=[[135,58],[218,111],[320,156],[425,198]];[[0,1],[1,2],[2,3]].forEach(([a,b])=>c.line(pts[a][0],pts[a][1],pts[b][0],pts[b][1],'muted',1.5));pts.forEach(([x,y],i)=>{c.circle(x,y,7,i===0?'teal':'blueLight',i===0?'teal':'blue');c.text(x+12,y+4,c.label(i),{size:11,max:10})});return;
  }
}
