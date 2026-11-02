// Internal orthographic 3D geometry projected into editable SVG polygons.
// Coordinates are scene units, not pixels; no WebGL or external runtime is used.
const finite=(v,name)=>{if(!Number.isFinite(v))throw new Error(`${name} must be finite`);return v};

export function camera({centerX=260,centerY=168,scaleX=.88,scaleY=.38,scaleZ=1.15}={}){
  [centerX,centerY,scaleX,scaleY,scaleZ].forEach((v,i)=>finite(v,['centerX','centerY','scaleX','scaleY','scaleZ'][i]));
  if(scaleX<=0||scaleY<=0||scaleZ<=0)throw new Error('3D camera scales must be positive');
  return {project([x,y,z]){[x,y,z].forEach((v,i)=>finite(v,['x','y','z'][i]));return [centerX+(x-y)*scaleX,centerY+(x+y)*scaleY-z*scaleZ]}};
}

export function fitCamera(parts,{margin=24}={}){
  if(!Array.isArray(parts)||!parts.length)throw new Error('3D scene needs at least one part');
  const points=[];
  for(const part of parts){const b=part.bounds??part;for(const x of [b.x0,b.x1])for(const y of [b.y0,b.y1])for(const z of [b.z0,b.z1])points.push([finite(x,'x'),finite(y,'y'),finite(z,'z')])}
  const raw=points.map(([x,y,z])=>[x-y,(x+y)*.43-z*1.2]);
  const xs=raw.map(p=>p[0]),ys=raw.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min((520-2*margin)/Math.max(1,maxX-minX),(260-2*margin)/Math.max(1,maxY-minY));
  return {centerX:260-(minX+maxX)/2*scale,centerY:130-(minY+maxY)/2*scale,scaleX:scale,scaleY:.43*scale,scaleZ:1.2*scale};
}

export function cuboidFaces(bounds,cam){
  const {x0,y0,z0,x1,y1,z1}=bounds;
  if(!(x1>x0&&y1>y0&&z1>z0))throw new Error('3D cuboid bounds must have positive width, depth and height');
  const p=(x,y,z)=>cam.project([x,y,z]);
  return [
    {side:'left',points:[p(x0,y1,z0),p(x1,y1,z0),p(x1,y1,z1),p(x0,y1,z1)]},
    {side:'right',points:[p(x1,y0,z0),p(x1,y1,z0),p(x1,y1,z1),p(x1,y0,z1)]},
    {side:'top',points:[p(x0,y0,z1),p(x1,y0,z1),p(x1,y1,z1),p(x0,y1,z1)]}
  ];
}

export function drawCuboid(canvas,bounds,{top='tealLight',left='blueLight',right='faint',stroke='line',part='',drop=0}={}){
  const cam=camera(bounds.camera??{});
  if(part)canvas.push(`<g class="viz-part" style="--drop:${drop}px">`);
  for(const face of cuboidFaces(bounds,cam))canvas.poly(face.points.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' '),{top,left,right}[face.side],stroke);
  if(part)canvas.push('</g>');
  return cam;
}
