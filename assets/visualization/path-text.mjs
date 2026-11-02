import {estimatedWidth} from './text-layout.mjs';

// The curve's measured SVG length is an explicit design input. Reserve both
// ends so glyphs never start or finish at a sharp joint or arrowhead.
export function planPathText(value,{pathLength,size=13,minSize=10,endPadding=12}={}){
  if(!Number.isFinite(Number(pathLength))||Number(pathLength)<=0)throw new Error('경로 글자에는 양수 경로 길이가 필요합니다.');
  const available=Math.max(0,Number(pathLength)-2*endPadding),text=String(value??'').replace(/\s+/gu,' ').trim();
  for(let fontSize=size;fontSize>=minSize;fontSize-=.5){
    if(estimatedWidth(text,fontSize)<=available)return {decision:fontSize===size?'fit':'shrink-font',text,fontSize,available};
  }
  return {decision:'external-reference',text,available,fontSize:size};
}
