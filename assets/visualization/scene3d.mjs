import {Canvas} from './svg-core.mjs';
import {camera,drawCuboid,fitCamera} from './project3d.mjs';

const color=value=>typeof value==='string'&&(/^#[0-9a-fA-F]{3,8}$/.test(value)||['tealLight','blueLight','orangeLight','faint','paper','white','teal','blue','orange','line'].includes(value));

export function renderScene3D(scene){
  if(!scene||!Array.isArray(scene.parts)||scene.parts.length<1||scene.parts.length>40)throw new Error('parts에는 1~40개 3D 상자가 필요합니다.');
  const title=String(scene.title??'3D 장면'),description=String(scene.description??'3D 좌표를 정사영한 공간 그림');
  const parts=scene.parts.map((part,i)=>{
    if(!part||!part.bounds)throw new Error(`parts[${i}].bounds가 필요합니다.`);
    const b=part.bounds;
    for(const key of ['x0','y0','z0','x1','y1','z1'])if(!Number.isFinite(b[key]))throw new Error(`parts[${i}].bounds.${key}는 숫자여야 합니다.`);
    if(!(b.x1>b.x0&&b.y1>b.y0&&b.z1>b.z0))throw new Error(`parts[${i}]의 너비·깊이·높이는 양수여야 합니다.`);
    for(const key of ['top','left','right','stroke'])if(part[key]!==undefined&&!color(part[key]))throw new Error(`parts[${i}].${key} 색상 형식이 잘못됐습니다.`);
    if(part.drop!==undefined&&(!Number.isFinite(part.drop)||part.drop<0))throw new Error(`parts[${i}].drop은 0 이상 숫자여야 합니다.`);
    return part;
  });
  const view=scene.camera??fitCamera(parts);
  const cam=camera(view);
  const template={id:'custom-3d',name:title,meaning:description,labels:parts.map(p=>String(p.label??'')),values:[]};
  const c=new Canvas(template,{motion:scene.motion??'assemble',lang:scene.lang??'ko'});
  const ordered=scene.order==='input'?parts:[...parts].sort((a,b)=>{
    const ca=a.bounds,cb=b.bounds;
    return (ca.x0+ca.x1+ca.y0+ca.y1)-(cb.x0+cb.x1+cb.y0+cb.y1);
  });
  const labels=[];
  for(const [i,part] of ordered.entries()){
    drawCuboid(c,{...part.bounds,camera:view},{top:part.top??'tealLight',left:part.left??'blueLight',right:part.right??'faint',stroke:part.stroke??'line',part:`scene-${i}`,drop:part.drop??28});
    if(part.label){const b=part.bounds,p=cam.project([(b.x0+b.x1)/2,(b.y0+b.y1)/2,b.z1]);labels.push({p,label:part.label,drop:part.drop??28})}
  }
  for(const {p,label,drop} of labels){c.push(`<g class="viz-part" style="--drop:${drop}px">`);c.text(p[0],p[1]+4,label,{anchor:'middle',size:12,weight:700,max:14,extra:'paint-order="stroke" stroke="#fffefa" stroke-width="3"'});c.push('</g>')}
  return {svg:c.finish(),warnings:c.warnings,camera:view};
}
