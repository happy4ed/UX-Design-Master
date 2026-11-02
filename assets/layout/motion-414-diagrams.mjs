// Six independently composed explanatory diagrams. The remaining diagrams retain
// the older preview until their original behavior has been inspected and rebuilt.
const svg = body => '<div class="m414-diagram m414-diagram-specific"><svg viewBox="0 0 360 210" role="img" aria-label="도식 모션 시연">' + body + '</svg></div>';
const line = (d, extra='') => '<path class="m414-link" d="' + d + '" ' + extra + '/>';
const node = (x,y,label,extra='') => '<g class="m414-node" ' + extra + '><rect x="' + x + '" y="' + y + '" width="64" height="36" rx="13"/><text x="' + (x+32) + '" y="' + (y+24) + '">' + label + '</text></g>';
const dot = (x,y,extra='') => '<circle class="m414-travel" cx="' + x + '" cy="' + y + '" r="6" fill="#ff725c" ' + extra + '/>';
const scenes = {
  'roadmap-path': () => svg(line('M25 145 C70 47 100 175 152 103 S240 36 325 80','data-path="road"') + [ [30,138,'계획'],[112,125,'설계'],[213,63,'제작'],[315,78,'완료'] ].map(([x,y,t],i)=>'<g class="m414-stop"><circle cx="'+x+'" cy="'+y+'" r="8" fill="#0072de"/><text x="'+x+'" y="'+(i%2?y+29:y-18)+'">'+t+'</text></g>').join('') + '<circle class="m414-end-ring" cx="315" cy="78" r="10" fill="none" stroke="#0072de" stroke-width="3"/>'),
  'arrow-chain': () => svg([node(9,83,'탐색'),node(102,83,'선택'),node(195,83,'실행'),node(288,83,'완료','data-final="true"')].join('') + [73,166,259].map(x=>line('M'+x+' 101 H'+(x+27),'marker-end="url(#arrow-head)"')).join('') + '<defs><marker id="arrow-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#0072de"/></marker></defs>' + '<path class="m414-travel-path" d="M40 150 H320" fill="none" stroke="#0072de" stroke-width="2"/>' + dot(40,150)),
  'branch-flow': () => svg('<g class="m414-question"><path d="M85 105 L125 68 L165 105 L125 142 Z" fill="#fff" stroke="#75a5df" stroke-width="3"/><text x="125" y="112">질문</text></g>' + line('M165 105 C200 105 200 45 230 45') + line('M165 105 C200 105 200 165 230 165') + node(230,27,'예') + node(230,147,'아니오') + dot(165,105)),
  'cycle-loop': () => svg('<defs><marker id="cycle-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#0072de"/></marker></defs>' + ['M215 40 Q249 50 263 88','M263 124 Q249 158 215 172','M145 172 Q111 158 97 124','M97 88 Q111 50 145 40'].map(d=>'<path class="m414-cycle-arc" d="'+d+'" fill="none" stroke="#0072de" stroke-width="3" marker-end="url(#cycle-arrow)"/>').join('') + [node(148,4,'준비'),node(248,88,'실행'),node(148,172,'확인'),node(48,88,'개선')].join('') + '<text class="m414-cycle-center" x="180" y="112">한 바퀴</text>'),
  'timeline-axis': () => svg(line('M24 105 H172') + '<path class="m414-future" d="M172 105 H333" fill="none" stroke="#0072de" stroke-width="3" stroke-dasharray="6 8"/>' + '<circle class="m414-now" cx="172" cy="105" r="9" fill="#ff725c"/>' + '<circle class="m414-now-ring" cx="172" cy="105" r="9" fill="none" stroke="#ff725c" stroke-width="3"/>' + '<text x="48" y="78">지난 때</text><text x="172" y="78">지금</text><text x="289" y="78">앞으로</text><path d="M325 97 L337 105 L325 113" fill="none" stroke="#0072de" stroke-width="3"/>'),
  'chevron-steps': () => svg([0,1,2,3].map(i=>{const x=10+i*72;return '<g class="m414-chevron"><path d="M'+x+' 55 H'+(x+72)+' L'+(x+90)+' 93 L'+(x+72)+' 131 H'+x+(i?' L'+(x+18)+' 93':'')+' Z" fill="'+['#d7ebff','#a8d3ff','#6aaeff','#1879e4'][i]+'"/><text x="'+(x+48)+'" y="100">'+['조사','설계','개발','공개'][i]+'</text></g>'}).join('') + '<rect class="m414-progress-base" x="20" y="158" width="315" height="8" rx="4"/><rect class="m414-progress" x="20" y="158" width="315" height="8" rx="4"/>')
};
export function specificDiagramScene(id){return scenes[id]?.() ?? null}
export function animateSpecificDiagram(id,host,animate,ms){
  if(!scenes[id]) return false;
  const q=s=>host.querySelector(s), qa=s=>[...host.querySelectorAll(s)];
  const draw=(path,delay=0,length=ms)=>{const total=path.getTotalLength();path.style.strokeDasharray=String(total);animate(path,[{strokeDashoffset:total},{strokeDashoffset:0}],delay,'cubic-bezier(.45,0,.55,1)',length)};
  if(id==='roadmap-path'){
    draw(q('[data-path="road"]'));
    qa('.m414-stop').forEach((n,i)=>animate(n,[{opacity:0,transform:'scale(.5)',transformOrigin:'center'},{opacity:1,transform:'scale(1)',transformOrigin:'center'}],ms*(.17+i*.18)));
    animate(q('.m414-end-ring'),[{opacity:0,transform:'scale(.3)',transformOrigin:'center'},{opacity:1,transform:'scale(2)',transformOrigin:'center'}],ms*.75);
  }else if(id==='arrow-chain'){
    qa('.m414-node').forEach((n,i)=>animate(n,[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],ms*i*.16));
    qa('.m414-link').forEach((n,i)=>draw(n,ms*(.12+i*.16),ms*.25));
    animate(q('.m414-travel'),[{transform:'translateX(0)'},{transform:'translateX(280px)'}],ms*.65,'linear',ms*.35);
  }else if(id==='branch-flow'){
    animate(q('.m414-question'),[{opacity:0,transform:'scale(.5)',transformOrigin:'center'},{opacity:1,transform:'scale(1)',transformOrigin:'center'}]);
    qa('.m414-link').forEach((n,i)=>draw(n,ms*.25,ms*.45));
    qa('.m414-node').forEach((n,i)=>animate(n,[{opacity:0},{opacity:1}],ms*(.5+i*.06)));
    animate(q('.m414-travel'),[{transform:'translate(0,0)'},{transform:'translate(75px,-60px)'}],ms*.7,'linear',ms*.3);
  }else if(id==='cycle-loop'){
    qa('.m414-cycle-arc').forEach((path,i)=>draw(path,ms*i*.17,ms*.28));
    qa('.m414-node').forEach((n,i)=>animate(n,[{opacity:.45,transform:'scale(.82)',transformOrigin:'center'},{opacity:1,transform:'scale(1.08)',transformOrigin:'center',offset:.75},{opacity:1,transform:'scale(1)',transformOrigin:'center'}],ms*i*.15));
    animate(q('.m414-cycle-center'),[{opacity:0},{opacity:1}],ms*.72);
  }else if(id==='timeline-axis'){
    draw(q('.m414-link'));
    animate(q('.m414-future'),[{opacity:0,strokeDashoffset:80},{opacity:1,strokeDashoffset:0}],ms*.48,'linear',ms*.5);
    animate(q('.m414-now-ring'),[{opacity:1,transform:'scale(.5)',transformOrigin:'center'},{opacity:0,transform:'scale(3)',transformOrigin:'center'}],ms*.45);
  }else if(id==='chevron-steps'){
    qa('.m414-chevron').forEach((n,i)=>animate(n,[{opacity:0,transform:'translateX(-40px)'},{opacity:1,transform:'translateX(0)'}],ms*i*.16));
    animate(q('.m414-progress'),[{width:'0'},{width:'315px'}],ms*.55,'linear',ms*.45);
  }
  return true;
}
