import {camera,drawCuboid} from '../project3d.mjs';

export function renderSpatial(c){
  const g=c.template.grammar;
  if(g==='exploded'){
    const view={centerX:260,centerY:194,scaleX:.88,scaleY:.22,scaleZ:1.1};
    const cam=camera(view);
    const pieces=[
      {z0:128,z1:140,top:'tealLight',left:'#84b8af',right:'#b6d3cc',drop:70},
      {z0:64,z1:76,top:'blueLight',left:'#93b4c8',right:'#b9ceda',drop:35},
      {z0:0,z1:12,top:'faint',left:'#b7c5c6',right:'#d9e1df',drop:0}
    ];
    [[-96,-57],[96,-57],[-96,57],[96,57]].forEach(([x,y])=>{const a=cam.project([x,y,12]),b=cam.project([x,y,140]);c.line(a[0],a[1],b[0],b[1],'line',1,'3 5')});
    pieces.forEach((part,i)=>{
      drawCuboid(c,{x0:-96,y0:-57,x1:96,y1:57,z0:part.z0,z1:part.z1,camera:view},{...part,part:`piece-${i}`,stroke:'line'});
      const label=cam.project([0,0,part.z1]);c.push(`<g class="viz-part" style="--drop:${part.drop}px">`);c.textBox(label[0]-55,label[1]-10,110,22,c.label(i),{size:13,minSize:10,maxLines:1,padding:0,role:'spatial-label'});c.push('</g>');
    });
    c.text(22,243,'분해 순서 ① → ② → ③',{size:10,color:'muted'});
    return;
  }
  if(g==='axonometric'){
    const view={centerX:260,centerY:164,scaleX:.87,scaleY:.39,scaleZ:1.12};
    const cam=camera(view);
    drawCuboid(c,{x0:-115,y0:-85,x1:115,y1:85,z0:-10,z1:0,camera:view},{top:'#ecf1ef',left:'#c9d5d2',right:'#dce4e1',stroke:'line'});
    const rooms=[
      {bounds:{x0:-101,y0:-72,x1:-18,y1:65,z0:0,z1:38},top:'blueLight',left:'#93b4c8',right:'#b9ceda',label:0},
      {bounds:{x0:-10,y0:-72,x1:99,y1:-7,z0:0,z1:48},top:'tealLight',left:'#89b9ae',right:'#bad8cf',label:1},
      {bounds:{x0:-10,y0:3,x1:99,y1:65,z0:0,z1:34},top:'orangeLight',left:'#d6ae91',right:'#ebcbb3',label:2}
    ];
    rooms.forEach(({bounds,top,left,right,label})=>{
      drawCuboid(c,{...bounds,camera:view},{top,left,right,stroke:'line',part:`room-${label}`,drop:36});
      const p=cam.project([(bounds.x0+bounds.x1)/2,(bounds.y0+bounds.y1)/2,bounds.z1]);
      c.push('<g class="viz-part" style="--drop:36px">');c.textBox(p[0]-40,p[1]-8,80,20,c.label(label),{size:11,minSize:10,maxLines:1,padding:0,role:'spatial-label'});c.push('</g>');
    });
    c.text(21,243,'정사영 · 높이와 깊이를 가진 3D 공간',{size:10,color:'muted'});
  }
}
