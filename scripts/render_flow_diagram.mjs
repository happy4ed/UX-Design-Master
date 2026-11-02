#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {renderDeclarativeFlow} from '../assets/visualization/flow-layout.mjs';
const args=process.argv.slice(2),at=args.indexOf('--input'),outAt=args.indexOf('--out');
if(at<0||outAt<0)throw new Error('사용법: node scripts/render_flow_diagram.mjs --input flow.json --out flow.svg');
const spec=JSON.parse(await readFile(resolve(args[at+1]),'utf8'));
const result=renderDeclarativeFlow(spec),target=resolve(args[outAt+1]);
await mkdir(dirname(target),{recursive:true});await writeFile(target,result.svg,'utf8');
console.log(JSON.stringify({out:target,metadata:result.metadata,warnings:result.warnings}));
