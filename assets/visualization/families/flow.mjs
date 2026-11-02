export function renderFlow(c){
  const g=c.template.grammar;
  if(g==='flow'){
    c.box(22,86,100,60,c.label(0),{fill:'tealLight',stroke:'teal'});
    c.poly('204,70 266,116 204,162 142,116','white','teal');c.shapeText(142,70,124,92,c.label(1),{shape:'diamond',size:13,minSize:10,maxLines:3,padding:5,weight:700,role:'diamond-label'});
    c.box(290,86,94,60,c.label(2));c.box(410,86,94,60,c.label(3));
    c.arrow(122,116,142,116);c.arrow(266,116,290,116);c.arrow(384,116,410,116);
    if(c.options.edgeLabels?.[0])c.edgeLabel(266,116,290,116,c.options.edgeLabels[0],{gap:6,size:10,color:'teal'});
    if(c.options.returnLabel){c.path('M204 162 V196 H72 V146','none','orange',1.7,`marker-end="url(#${c.id}-arrow-orange)"`);c.textBox(73,201,132,23,c.options.returnLabel,{size:11,minSize:10,maxLines:1,padding:0,color:'orange',weight:400,role:'edge-label'})}
    return;
  }
  if(g==='sequence'){
    const xs=[82,260,438];xs.forEach((x,i)=>{c.box(x-51,19,102,48,c.label(i),{fill:i===1?'tealLight':'white',stroke:i===1?'teal':'line'});c.line(x,68,x,225,'line',1,'4 4')});
    [[82,260,95,3],[260,438,139,4],[438,82,186,5]].forEach(([x1,x2,y,li],i)=>{c.arrow(x1,y,x2,y,i===2?'blue':'teal');c.edgeLabel(x1,y,x2,y,c.label(li),{gap:6,size:11})});return;
  }
  if(g==='state'){
    const xs=[85,260,435];xs.forEach((x,i)=>c.box(x-56,91,112,66,c.label(i),{fill:i===2?'tealLight':'white',stroke:i===2?'teal':'line',r:30}));
    c.arrow(141,124,204,124);c.arrow(316,124,379,124);if(c.options.edgeLabels?.[0])c.edgeLabel(141,124,204,124,c.options.edgeLabels[0],{gap:6,size:10});if(c.options.edgeLabels?.[1])c.edgeLabel(316,124,379,124,c.options.edgeLabels[1],{gap:6,size:10});
    if(c.options.returnLabel){c.path('M260 157 V202 H85 V157','none','orange',1.7,`marker-end="url(#${c.id}-arrow-orange)"`);c.textBox(102,206,140,24,c.options.returnLabel,{size:11,minSize:9,maxLines:1,padding:0,color:'orange',weight:400,role:'edge-label'})}return;
  }
  if(g==='timeline'){
    c.arrow(37,133,491,133,'muted',2,'','axis');const xs=[72,194,316,438];xs.forEach((x,i)=>{c.circle(x,133,7,i===3?'teal':'white',i===3?'teal':'blue');c.line(x,133,x,i%2?174:89,'line');c.textBox(x-48,i%2?178:51,96,29,c.label(i),{size:12,minSize:10,maxLines:1,padding:0});c.textBox(x-48,i%2?208:84,96,17,String(c.value(i,i+1)),{size:11,minSize:10,maxLines:1,padding:0,color:'muted'})});return;
  }
  if(g==='swimlane'){
    [23,95,167].forEach((y,i)=>{c.rect(15,y,490,67,i===1?'tealLight':'white','line',2);c.text(28,y+22,c.label(i),{size:11,color:'muted',weight:700})});
    c.box(117,35,100,40,c.label(3),{size:12});c.box(252,107,100,40,c.label(4),{size:12,fill:'white',stroke:'teal'});c.box(388,179,100,40,c.label(5),{size:12});
    c.connectBoxes({x:167,y:55,w:100,h:40},{x:302,y:127,w:100,h:40});c.connectBoxes({x:302,y:127,w:100,h:40},{x:438,y:199,w:100,h:40});return;
  }
  if(g==='cycle'){
    const pts=[[260,52],[405,130],[260,208],[115,130]],radius=42;
    pts.forEach(([x,y],i)=>{const [nx,ny]=pts[(i+1)%4],dx=nx-x,dy=ny-y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;c.arrow(x+ux*radius,y+uy*radius,nx-ux*radius,ny-uy*radius,'teal',2);c.circle(x,y,radius,i===3?'tealLight':'white',i===3?'teal':'line');c.shapeText(x-radius,y-radius,radius*2,radius*2,c.label(i),{shape:'circle',size:12,minSize:10,maxLines:3,padding:5,weight:500,role:'circle-label'})});if(c.options.centerLabel)c.text(260,134,c.options.centerLabel,{anchor:'middle',size:14,color:'teal',weight:500});return;
  }
  if(g==='process'){
    const xs=[20,146,272,398];xs.forEach((x,i)=>{c.rect(x,78,106,110,i===3?'tealLight':'white',i===3?'teal':'line',4);c.text(x+12,103,`0${i+1}`,{size:11,color:'teal',weight:700});c.textBox(x+8,110,90,68,c.label(i),{size:14,minSize:10,maxLines:3,padding:0,weight:700});if(i<3)c.arrow(x+106,133,x+126,133)});return;
  }
  if(g==='gantt'){
    c.line(95,48,495,48);for(let i=0;i<8;i++){const x=101+i*50;c.line(x,43,x,210,'faint');c.text(x+18,36,String(i+1),{anchor:'middle',size:10,color:'muted'})}
    c.values.slice(0,6);for(let i=0;i<3;i++){const y=77+i*52,from=c.value(i*2,1),to=c.value(i*2+1,from+2);c.text(18,y+16,c.label(i),{size:12});c.rect(101+(from-1)*50,y,Math.max(20,(to-from+1)*50),22,i===2?'teal':'blueLight',i===2?'teal':'blue',3)}return;
  }
}
