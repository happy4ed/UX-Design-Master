#!/usr/bin/env node
/** Validated content contract → internal SVG/HTML renderer → review report. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {renderResult,renderStandaloneHtml} from '../assets/visualization/renderer.mjs';

const args=process.argv.slice(2),get=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1]};
async function main(){
  const input=get('--input'),out=get('--out');
  if(!input||!out)throw new Error('사용법: node scripts/render_visual_spec.mjs --input spec.json --out result.svg|html [--report report.json]');
  const spec=JSON.parse(await readFile(resolve(input),'utf8'));
  if(spec.schemaVersion!=='1.0')throw new Error('schemaVersion 1.0이 필요합니다.');
  if(typeof spec.purpose!=='string'||!spec.purpose.trim())throw new Error('그림의 purpose가 필요합니다.');
  if(typeof spec.source!=='string'||!spec.source.trim())throw new Error('실제 데이터의 source가 필요합니다.');
  if(typeof spec.template!=='string'||!spec.template.trim())throw new Error('template이 필요합니다.');
  if(spec.claim!==undefined&&typeof spec.claim!=='string')throw new Error('claim은 문자열이어야 합니다.');
  const options={labels:spec.labels,values:spec.values,motion:spec.motion??'none',rtl:spec.rtl===true,lang:spec.lang??'ko'};
  const result=renderResult(spec.template,options);
  const format=out.toLowerCase().endsWith('.html')?'html':'svg';
  const content=format==='html'?renderStandaloneHtml(spec.template,options):result.svg;
  await writeFile(resolve(out),content,'utf8');
  const findings=[...result.warnings.map(message=>({type:'renderer-warning',message}))];
  for(const [index,label] of result.fields.labels.entries())if(label.length>32)findings.push({type:'long-label-review',index,length:label.length,label});
  if(!spec.claim?.trim())findings.push({type:'claim-unset',message:'검증 가능한 결론이 없으면 중립 제목을 사용한다.'});
  const report={status:findings.length?'REVIEW':'RENDERED',template:spec.template,purpose:spec.purpose,source:spec.source,claim:spec.claim??null,format,out:resolve(out),findings,checks:['실제 렌더의 잘림·교차·화살표 연결','좁은 화면·긴 번역·RTL','모션 처음·중간·끝·정지·감소 설정']};
  if(get('--report'))await writeFile(resolve(get('--report')),JSON.stringify(report,null,2)+'\n','utf8');
  console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
