#!/usr/bin/env node
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {templates,renderResult,renderStandaloneHtml} from '../assets/visualization/renderer.mjs';

const args=process.argv.slice(2);const get=key=>{const at=args.indexOf(key);return at<0?undefined:args[at+1]};
const has=key=>args.includes(key);
const usage='사용법: node render_visualization.mjs --list | --template <id> [--input data.json] --out <file> [--format svg|html] [--motion none|trace|reveal|pulse|grow|focus|assemble] [--rtl] | --all --out <directory> [--format svg|html]';

async function main(){
  if(has('--help')||args.length===0){console.log(usage);return}
  if(has('--list')){console.log(JSON.stringify(templates.map(({id,group,name,grammar,meaning})=>({id,group,name,grammar,meaning})),null,2));return}
  const format=get('--format')??'svg';if(!['svg','html'].includes(format))throw new Error('format은 svg 또는 html이어야 합니다.');
  const out=get('--out');if(!out)throw new Error('--out 경로가 필요합니다.');
  let input={};if(get('--input'))input=JSON.parse(await readFile(resolve(get('--input')),'utf8'));
  const motion=get('--motion')??input.motion??'none';
  if(has('--all')){
    await mkdir(resolve(out),{recursive:true});let warningCount=0;
    for(const template of templates){const options={motion};const result=renderResult(template.id,options);warningCount+=result.warnings.length;const data=format==='svg'?result.svg:renderStandaloneHtml(template.id,options);await writeFile(join(resolve(out),`${template.id}.${format}`),data,'utf8')}
    console.log(JSON.stringify({generated:templates.length,format,out:resolve(out),warningCount}));return;
  }
  const id=get('--template')??input.template;if(!id)throw new Error('--template 또는 입력 JSON의 template이 필요합니다.');
  const options={labels:input.labels,values:input.values,flows:input.flows,edgeLabels:input.edgeLabels,returnLabel:input.returnLabel,centerLabel:input.centerLabel,width:input.width,height:input.height,displayWidth:input.displayWidth,minDisplayWidth:input.minDisplayWidth,arrowSize:input.arrowSize,fontFamily:input.fontFamily,colors:input.colors,motion,rtl:has('--rtl')||input.rtl===true,lang:input.lang};const result=renderResult(id,options);const data=format==='svg'?result.svg:renderStandaloneHtml(id,options);
  await mkdir(dirname(resolve(out)),{recursive:true});await writeFile(resolve(out),data,'utf8');
  console.log(JSON.stringify({template:id,out:resolve(out),format,motion,metadata:result.metadata,warnings:result.warnings}));
  if(result.warnings.length)process.exitCode=2;
}

main().catch(error=>{console.error(error.message);console.error(usage);process.exitCode=1});
