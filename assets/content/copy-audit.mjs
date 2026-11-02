// Internal editorial smoke test. Findings require a human decision.
const korean=[
  ['vague-action',/(경험을 제공|가치를 전달|여정을 지원|가능성을 열어|새로운 차원의|혁신적인 솔루션)/g,'누가 무엇을 할 수 있는지 구체적으로 적기'],
  ['stock-transition',/(이를 통해|나아가|더 나아가|결론적으로|정리하자면)/g,'문장의 실제 결과를 바로 적기'],
  ['stock-emphasis',/(주목할 만한|매우 중요한|핵심적인 역할|의미 있는 인사이트)/g,'평가 대신 관찰 사실을 적기'],
  ['translationese',/(에 있어서|에 기반하여|와 관련하여|하게 되어집니다|되어진다)/g,'문맥에 맞는 한국어 동사로 고치기'],
  ['empty-ui',/(여기를 클릭|자세히 알아보기|지금 바로 시작하세요)/g,'버튼을 누른 뒤 생기는 일을 적기']
];
const english=[
  ['vague-action',/\b(seamless experience|unlock the power|revolutionary solution|elevate your journey)\b/gi,'Name the action and result'],
  ['stock-transition',/\b(it is worth noting|in conclusion|moreover|furthermore)\b/gi,'Keep only transitions that carry meaning'],
  ['stock-emphasis',/\b(delves? into|robust ecosystem|game.changer|leverage)\b/gi,'Use a concrete verb or fact']
];

export function auditCopy(text,{locale='ko'}={}){
  const source=String(text??'');const rules=locale==='en'?english:korean;const findings=[];
  for(const [id,pattern,advice] of rules){pattern.lastIndex=0;for(const match of source.matchAll(pattern))findings.push({id,match:match[0],at:match.index,advice})}
  return findings.sort((a,b)=>a.at-b.at);
}

export function auditVisibleCopy(root=document){
  const text=root.body?.innerText??root.textContent??'';
  const findings=auditCopy(text);
  const controls=[...root.querySelectorAll('button,a,[role="button"]')].filter(el=>el.getClientRects().length);
  for(const el of controls){const label=(el.getAttribute('aria-label')||el.innerText||'').trim();if(!label)findings.push({id:'unnamed-control',match:'',at:-1,advice:'조작 요소에 읽을 수 있는 이름을 넣기'});else if(label.length>28)findings.push({id:'long-control',match:label,at:-1,advice:'행동 이름을 줄이거나 버튼의 공간을 늘리기'})}
  return findings;
}
