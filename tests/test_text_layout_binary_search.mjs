import assert from 'node:assert/strict';
import {layoutText,layoutShapeText} from '../assets/visualization/text-layout.mjs';

const cases=[
  ['짧은 문구',55,25,1],
  ['가족 의료비 서류를 확인하고 수정합니다',125,55,3],
  ['A long English label with several separate words',125,65,4],
  ['문단 하나\n\n문단 둘의 긴 설명이 이어집니다',120,85,5],
  ['VeryLongUnbrokenEnglishWord',90,70,3],
];
const range=(max,min)=>{const values=[];for(let x=max;x>=min;x-=.5)values.push(x);if(values.at(-1)>min)values.push(min);return values};
for(const [text,w,h,maxLines] of cases){
  const base={x:0,y:0,w,h,maxLines,size:22,minSize:11};
  const expected=range(22,11).map(fontSize=>layoutText(text,{...base,size:fontSize,minSize:fontSize})).find(x=>x.fits);
  const actual=layoutText(text,base);
  assert.equal(actual.fits,Boolean(expected),`rectangle: ${text}`);
  if(expected)assert.equal(actual.fontSize,expected.fontSize,`rectangle size: ${text}`);
}
for(const shape of ['circle','diamond','rect'])for(const [text,w,h,maxLines] of cases){
  const base={shape,x:0,y:0,w:w+50,h:h+45,maxLines,size:22,minSize:11};
  const expected=range(22,11).map(fontSize=>layoutShapeText(text,{...base,size:fontSize,minSize:fontSize})).find(x=>x.fits);
  const actual=layoutShapeText(text,base);
  assert.equal(actual.fits,Boolean(expected),`${shape}: ${text}`);
  if(expected)assert.equal(actual.fontSize,expected.fontSize,`${shape} size: ${text}`);
}
let measurements=0;
const measureText=(text,size)=>{measurements++;return text.length*size*.62};
layoutShapeText('A text label that needs to fit inside a small circle',{shape:'circle',x:0,y:0,w:160,h:90,size:40,minSize:10,maxLines:4,measureText});
const searched=measurements;
measurements=0;
for(const fontSize of range(40,10)){
  if(layoutShapeText('A text label that needs to fit inside a small circle',{shape:'circle',x:0,y:0,w:160,h:90,size:fontSize,minSize:fontSize,maxLines:4,measureText}).fits)break;
}
assert.ok(searched<measurements,`midpoint search should measure less than linear scan: ${searched} vs ${measurements}`);
console.log('text layout midpoint search: PASS');
