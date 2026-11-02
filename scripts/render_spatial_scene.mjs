#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {renderScene3D} from '../assets/visualization/scene3d.mjs';

const args=process.argv.slice(2);const value=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1]};
async function main(){
  const input=value('--input'),out=value('--out');
  if(!input||!out)throw new Error('사용법: node render_spatial_scene.mjs --input scene.json --out scene.svg');
  const scene=JSON.parse(await readFile(resolve(input),'utf8'));
  const result=renderScene3D(scene);
  await mkdir(dirname(resolve(out)),{recursive:true});await writeFile(resolve(out),result.svg,'utf8');
  console.log(JSON.stringify({out:resolve(out),parts:scene.parts.length,camera:result.camera,warnings:result.warnings}));
  if(result.warnings.length)process.exitCode=2;
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
