import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chart-selector-'));
const selector=new URL('../scripts/choose_chart.mjs',import.meta.url).pathname;
function select(input){
  const file=path.join(temp,'data.json');
  fs.writeFileSync(file,JSON.stringify(input));
  const run=spawnSync(process.execPath,[selector,'--input',file],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.ok(run.stdout?.trim(),`empty output: ${run.error?.message??''} ${run.stderr}`);
  return JSON.parse(run.stdout);
}
const parts=(n)=>Array.from({length:n},(_,i)=>({category:`C${i+1}`,value:n-i}));
const basic={roles:{category:'category',value:'value'},partWhole:true};
const cases=[
  ['pie',{...basic,task:'share',rows:parts(3)},'pie'],
  ['donut',{...basic,task:'share',showTotal:true,rows:parts(3)},'donut'],
  ['waffle',{...basic,task:'share',unitGrid:true,rows:parts(3)},'waffle'],
  ['treemap',{...basic,task:'composition',rows:parts(7)},'treemap'],
  ['funnel',{task:'attrition',sameCohort:true,roles:{stage:'stage',value:'count'},rows:[{stage:'visit',count:100},{stage:'cart',count:45},{stage:'buy',count:18}]},'funnel'],
  ['sunburst',{task:'hierarchy',roles:{category:'id',parent:'parent',value:'value'},rows:[{id:'all',parent:null,value:10},{id:'A',parent:'all',value:6},{id:'B',parent:'all',value:4}]},'sunburst'],
  ['waterfall',{task:'cumulative',roles:{delta:'change'},startValue:100,endValue:110,rows:[{change:20},{change:-10}]},'waterfall'],
  ['pareto',{task:'concentration',roles:{category:'category',value:'value'},rows:parts(6)},'pareto'],
  ['marimekko',{task:'two-way-mix',roles:{category:'channel',group:'device',value:'sales'},rows:[{channel:'A',device:'phone',sales:20},{channel:'A',device:'desktop',sales:10},{channel:'B',device:'phone',sales:5},{channel:'B',device:'desktop',sales:15}]},'marimekko'],
  ['line',{task:'trend',roles:{time:'month',value:'sales'},rows:[{month:'2026-01',sales:5},{month:'2026-02',sales:8}]},'line'],
  ['scatter',{task:'relationship',roles:{x:'spend',y:'sales'},rows:[{spend:10,sales:12},{spend:20,sales:17}]},'scatter']
];
try{
  for(const [label,input,expected] of cases){
    const result=select(input);
    assert.equal(result.recommendation?.id,expected,`${label}: ${JSON.stringify(result)}`);
  }
  const badFunnel=select({task:'attrition',sameCohort:true,roles:{stage:'s',value:'v'},rows:[{s:'A',v:10},{s:'B',v:20}]});
  assert.notEqual(badFunnel.recommendation?.id,'funnel');
  assert.ok(badFunnel.warnings.some(w=>w.includes('증가')));
  const badWaterfall=select({task:'cumulative',roles:{delta:'v'},startValue:10,endValue:50,rows:[{v:5}]});
  assert.notEqual(badWaterfall.recommendation?.id,'waterfall');
  assert.ok(badWaterfall.warnings.some(w=>w.includes('불일치')));
  const uncertain=select({...basic,rows:parts(3)});
  assert.equal(uncertain.decisionStatus,'needs-human-decision');
  console.log(`${cases.length} chart types and 3 boundary cases: PASS`);
}finally{fs.rmSync(temp,{recursive:true,force:true})}
