// Local browser previews for the 414 motion vocabulary entries.
import {sceneFamily03, animateFamily03} from './motion-414-family03.mjs';
import {specificDiagramScene, animateSpecificDiagram} from './motion-414-diagrams.mjs';
// These are executable sketches of each named mechanism, not traced One UI 9 timing.
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const screenFamilies = new Set(['family-07','family-11']);
const textFamilies = new Set(['family-04','family-09','family-10','family-17']);
const backdropFamilies = new Set(['family-08','family-16']);
const labelFor = entry => ({
  'family-01':'공간 장면', 'family-02':'카메라 장면', 'family-03':'화면 공개',
  'family-04':'문구', 'family-05':'인터랙션', 'family-06':'화면 질감',
  'family-07':'전체 화면 전환', 'family-08':'배경', 'family-09':'문구',
  'family-10':'글자', 'family-11':'전체 화면 전환', 'family-12':'데이터',
  'family-13':'아이콘', 'family-14':'소셜 컴포넌트', 'family-15':'그래픽',
  'family-16':'생성형 배경', 'family-17':'도입 타이틀', 'family-18':'숫자',
  'family-19':'다이어그램'
})[entry.familyId];
export {labelFor};

function glyph(id) {
  if (/heart|like|reaction|follow/.test(id)) return '♥';
  if (/bell|notification|alert/.test(id)) return '♢';
  if (/save|bookmark/.test(id)) return '▣';
  if (/check|success|accept/.test(id)) return '✓';
  if (/star|shine|glow/.test(id)) return '✦';
  if (/location|pin/.test(id)) return '⌖';
  if (/share|arrow/.test(id)) return '↗';
  if (/toggle|switch/.test(id)) return '●';
  if (/refresh|spin|loop|cycle/.test(id)) return '↻';
  return '✧';
}
function scene(entry, index) {
  const family = entry.familyId, name = escapeHtml(entry.name);
  if (entry.id === 'odometer' || entry.id === 'odometer-roll') {
    const rolling=entry.id==='odometer-roll', digits=rolling?'48210':'12480';
    return '<div class="m414-odometer '+(rolling?'rolling':'')+'">'+(rolling?'':'<small>누적</small>')+'<div class="m414-reels" aria-label="'+(rolling?'48,210':'12,480')+'">'+[...digits].map((digit,i)=>'<span class="m414-reel" data-place="'+i+'" data-digit="'+digit+'"><span class="m414-reel-strip">'+Array.from({length:20},(_,n)=>'<b>'+n%10+'</b>').join('')+'</span></span>'+(i===1?'<span class="m414-reel-comma">,</span>':'')).join('')+'</div>'+(rolling?'<i class="m414-odometer-rule"></i>':'<small>명</small>')+'</div>';
  }
  if (entry.id === 'punch-in' || entry.id === 'snap-zoom')
    return '<div class="m414-zoom-stage"><div class="m414-zoom-target '+entry.id+'"></div></div>';
  if (entry.id === 'zoom')
    return '<div class="m414-zoom-stage"><div class="m414-zoom-scene"><div class="m414-zoom-scene-target"></div></div></div>';
  if (entry.id === 'float-bob')
    return '<div class="m414-float-stage"><div class="m414-float-shadow"></div><div class="m414-float-anchor"><div class="m414-float-icon"><i></i></div></div></div>';
  if (family === 'family-01' || family === 'family-02')
    return '<div class="m414-land"><div class="m414-sun"></div><div class="m414-hill back"></div><div class="m414-hill front"></div><div class="m414-land-card">GALLERY <strong>다음 장면</strong><small>공간과 초점을 탐색합니다</small></div></div>';
  if (family === 'family-03') return sceneFamily03(entry.id);
  if (screenFamilies.has(family))
    return '<div class="m414-screen old"><div class="m414-topline">10:13 <span>● 77%</span></div><div class="m414-screen-content"><small>SETTINGS</small><h3>현재 화면</h3><p>화면 전환 전 위치</p><i></i><i></i></div></div><div class="m414-screen next"><div class="m414-topline">10:13 <span>● 77%</span></div><div class="m414-screen-content"><small>NEXT VIEW</small><h3>다음 화면</h3><p>새로운 콘텐츠와 상태</p><i></i><i></i></div></div><div class="m414-flash"></div>';
  if (textFamilies.has(family)) {
    const word = family === 'family-17' ? '새로운 시작' : '움직이는 문장';
    return '<div class="m414-type"><div class="m414-type-kicker">TYPE / MOTION</div><h3 class="m414-word">' + [...word].map((ch,i) => '<span class="m414-letter" data-i="' + i + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>').join('') + '</h3><p>문구의 읽기 순서와 효과를 확인하세요.</p></div>';
  }
  if (backdropFamilies.has(family))
    return '<div class="m414-pattern p' + (index % 8) + '"><div class="m414-pattern-grid">' + Array.from({length:36},(_,i) => '<span class="m414-tile" style="--i:' + i + '"></span>').join('') + '</div><div class="m414-pattern-label">BACKGROUND <strong>' + name + '</strong></div></div>';
  if (family === 'family-12')
    return '<div class="m414-chart"><small>WEEKLY DATA</small><strong>활동 추이</strong><div class="m414-chart-bars">' + [42,75,57,91,67].map((h,i) => '<span class="m414-bar" style="--h:' + h + '%;--i:' + i + '"></span>').join('') + '</div><div class="m414-chart-value">76%</div></div>';
  if (family === 'family-13' && entry.id === 'shine-sweep')
    return '<div class="m414-focus-stage"><div class="m414-shine-icon"><i class="m414-shine-band"></i><div class="m414-shine-mark"></div></div></div>';
  if (family === 'family-13')
    return '<div class="m414-icon-card"><div class="m414-icon">' + glyph(entry.id) + '</div><strong>' + name + '</strong><small>상태를 확인했습니다</small><div class="m414-sparks">✦　·　✦　·　✦</div></div>';
  if (family === 'family-14')
    return '<div class="m414-social"><div class="m414-avatar">S</div><div><strong>새로운 소식</strong><small>방금 전 · 커뮤니티</small></div><button type="button" class="m414-social-action" tabindex="-1">' + glyph(entry.id) + '　' + name + '</button><div class="m414-social-count">1,240</div></div>';
  if (family === 'family-15')
    return '<div class="m414-parts"><div class="m414-part a">A</div><div class="m414-part b">B</div><div class="m414-part c">C</div><svg viewBox="0 0 300 190" aria-hidden="true"><path class="m414-line" d="M40 95 C105 20 190 165 260 95"/></svg><strong>' + name + '</strong></div>';
  if (entry.id === 'countdown')
    return '<div class="m414-countdown"><div class="m414-countdown-face"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="m414-countdown-track" cx="60" cy="60" r="52"/><circle class="m414-countdown-ring" cx="60" cy="60" r="52"/></svg><span class="m414-countdown-digit">3</span><span class="m414-countdown-digit">2</span><span class="m414-countdown-digit">1</span><strong class="m414-countdown-go">시작!</strong></div></div>';
  if (family === 'family-18')
    return '<div class="m414-number"><small>LIVE DATA</small><strong class="m414-digits">1,240</strong><span class="m414-delta">+18%</span><p>이번 달 누적 결과</p></div>';
  if (family === 'family-19')
    return specificDiagramScene(entry.id) || '<div class="m414-diagram"><svg viewBox="0 0 320 190" role="img" aria-label="시작, 선택, 완료로 이어지는 도식"><path class="m414-link" d="M83 95 H126 M194 95 H236"/><path class="m414-link extra" d="M160 119 V153 H236"/><rect x="14" y="70" width="70" height="50" rx="17"/><rect x="125" y="70" width="70" height="50" rx="17"/><rect x="235" y="70" width="70" height="50" rx="17"/><text x="49" y="101">시작</text><text x="160" y="101">선택</text><text x="270" y="101">완료</text></svg><strong>' + name + '</strong></div>';
  if (family === 'family-06')
    return '<div class="m414-film"><div class="m414-film-image">◈</div><div class="m414-film-overlay"></div><strong>' + name + '</strong></div>';
  return '<div class="m414-control"><small>INTERACTION</small><button type="button" class="m414-button" tabindex="-1">동작 실행　↗</button><div class="m414-control-note">' + name + '</div><div class="m414-ghost">●</div></div>';
}

function clipStart(id, index) {
  if (/circle|iris|ripple/.test(id)) return 'circle(0% at 50% 50%)';
  if (/diamond/.test(id)) return 'polygon(50% 50%,50% 50%,50% 50%,50% 50%)';
  if (/star|pinwheel/.test(id)) return 'polygon(50% 50%,50% 50%,50% 50%,50% 50%,50% 50%,50% 50%)';
  if (/diagonal|slash|zigzag/.test(id)) return 'polygon(0 0,0 0,0 0,0 0)';
  if (/corner/.test(id)) return 'inset(0 100% 100% 0)';
  if (/vertical|curtain|shutter/.test(id)) return 'inset(0 50% 0 50%)';
  if (/horizontal|band|bar|strip|squeeze/.test(id)) return 'inset(50% 0 50% 0)';
  if (/clock/.test(id)) return 'polygon(50% 50%,50% 0,50% 0)';
  return index % 2 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
}
const fullClip = 'inset(0 0 0 0)';

export function mountMotion(entry, host, options={}) {
  const family=entry.familyId, id=entry.id, index=options.index || 0;
  const speed=Number(options.speed) || 0.7, reduced=Boolean(options.reduced);
  let base=family==='family-12'||family==='family-16'||family==='family-19' ? 760 :
    family==='family-01'||family==='family-02'||family==='family-11' ? 520 : 420;
  const timed=(options.cue?.sourceDurationSeconds||[]).filter(value=>value>=.25&&value<=6);
  if(timed.length)base=Math.max(base,Math.round(Math.max(...timed)*1000));
  if(id==='countdown')base=1400;
  const ms=(id==='zoom'||id==='float-bob')?Math.round(4000/speed):Math.round(base*2.2/speed), animations=[];
  host.innerHTML=scene(entry,index);
  host.dataset.motionId=id;
  host.dataset.family=family;
  host.dataset.target=labelFor(entry);
  const q=selector=>host.querySelector(selector);
  const qa=selector=>[...host.querySelectorAll(selector)];
  const animate=(node,frames,delay=0,easing='cubic-bezier(.45,0,.35,1)',length=ms)=>{
    if(!node) throw Error(id+': animation target missing');
    const animation=node.animate(frames,{duration:length,delay:Math.round(delay),easing,fill:'forwards'});
    animations.push(animation);
    if(reduced) animation.finish();
    return animation;
  };
  const wave=(nodes,frames,step=110)=>{
    nodes.forEach((node,i)=>animate(node,typeof frames==='function'?frames(i):frames,step*i*2.2/speed));
  };
  const delta=22+(index%5)*7, spin=20+(index%4)*13;
  if(id==='odometer'||id==='odometer-roll'){
    const strips=qa('.m414-reel-strip');
    strips.forEach((strip,i)=>{
      const digit=Number(strip.closest('.m414-reel').dataset.digit);
      const travel=(10+digit)*strip.firstElementChild.getBoundingClientRect().height;
      const delay=id==='odometer-roll'?(strips.length-1-i)*ms*.055:i*ms*.025;
      animate(strip,[{transform:'translateY(0px)'},{transform:'translateY(-'+travel+'px)'}],delay,'cubic-bezier(.18,.72,.25,1)',ms*.7);
    });
    if(id==='odometer-roll')animate(q('.m414-odometer-rule'),[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],ms*.72,'ease-out',ms*.18);
  } else if(id==='punch-in'||id==='snap-zoom'){
    const target=q('.m414-zoom-target');
    const keyframes=id==='punch-in'
      ?[{transform:'scale(1)',offset:0},{transform:'scale(1)',offset:.5},{transform:'scale(2.1)',offset:.5001},{transform:'scale(2.1)',offset:1}]
      :[{transform:'scale(1)',offset:0},{transform:'scale(1)',offset:.2},{transform:'scale(1.25)',offset:.2001},{transform:'scale(1.25)',offset:.4},{transform:'scale(1.6)',offset:.4001},{transform:'scale(1.6)',offset:.6},{transform:'scale(2.1)',offset:.6001},{transform:'scale(2.1)',offset:1}];
    animate(target,keyframes,0,'linear');
  } else if(id==='zoom'){
    animate(q('.m414-zoom-scene'),[{transform:'scale(1)'},{transform:'scale(1.7)'}],0,'ease-in-out');
  } else if(id==='float-bob'){
    const amplitude=host.getBoundingClientRect().height*.06;
    const keys=Array.from({length:33},(_,i)=>{
      const t=i/8, bob=Math.sin(Math.PI*t), tilt=Math.sin(Math.PI*t/2)*.06;
      return {transform:`translateY(${(bob*amplitude).toFixed(2)}px) rotate(${tilt.toFixed(5)}rad)`,offset:i/32};
    });
    animate(q('.m414-float-icon'),keys,0,'linear');
    animate(q('.m414-float-shadow'),keys.map((_,i)=>{
      const t=i/8, bob=Math.sin(Math.PI*t);
      return {transform:`translateX(-50%) scaleX(${(1-.1875*bob).toFixed(4)})`,offset:i/32};
    }),0,'linear');
  } else if(family==='family-01'){
    const variants={
      pan:[{transform:'translateX(-18px) scale(1.08)'},{transform:'translateX(18px) scale(1.08)'}],
      tilt:[{transform:'translateY(20px) scale(1.1)'},{transform:'translateY(-20px) scale(1.1)'}],
      roll:[{transform:'rotate(-8deg) scale(1.13)'},{transform:'rotate(8deg) scale(1.13)'}],
      track:[{transform:'translateX(-34px)'},{transform:'translateX(34px)'}],
      pedestal:[{transform:'translateY(30px)'},{transform:'translateY(-30px)'}],
      dolly:[{transform:'scale(.82)'},{transform:'scale(1.24)'}],
      zoom:[{transform:'scale(1)'},{transform:'scale(1.5)'}],
      orbit:[{transform:'perspective(500px) rotateY(-25deg) scale(1.13)'},{transform:'perspective(500px) rotateY(25deg) scale(1.13)'}]
    };
    animate(q('.m414-land'),variants[id]);
    animate(q('.m414-hill.front'),[{transform:'translateX(-18px)'},{transform:'translateX(20px)'}],0,'linear');
  } else if(family==='family-02'){
    const frames=/whip/.test(id)?[{transform:'translateX(-85px)',filter:'blur(9px)'},{transform:'translateX(0)',filter:'blur(0)'}]:
      /snap|punch/.test(id)?[{transform:'scale(.72)'},{transform:'scale(1.18)',offset:.7},{transform:'scale(1)'}]:
      /dolly/.test(id)?[{transform:'scale(.8)'},{transform:'scale(1.2)'}]:
      /rack-focus/.test(id)?[{filter:'blur(12px)'},{filter:'blur(0)'}]:
      /tilt/.test(id)?[{transform:'perspective(500px) rotateX(-18deg)'},{transform:'perspective(500px) rotateX(12deg)'}]:
      /shake/.test(id)?[{transform:'translateX(0)'},{transform:'translateX(-12px)',offset:.2},{transform:'translateX(10px)',offset:.45},{transform:'translateX(-5px)',offset:.7},{transform:'translateX(0)'}]:
      /parallax/.test(id)?[{transform:'translateX(-25px) scale(1.1)'},{transform:'translateX(25px) scale(1.1)'}]:
      [{transform:'scale(.86) translateY(15px)',filter:'blur(4px)'},{transform:'scale(1.12) translateY(-8px)',filter:'blur(0)'}];
    animate(q('.m414-land'),frames);
    animate(q('.m414-land-card'),[{transform:'translateX(-16px)'},{transform:'translateX(18px)'}],50);
  } else if(family==='family-03'){
    animateFamily03(id,host,animate,ms);
  } else if(screenFamilies.has(family)){
    const next=q('.m414-screen.next'), old=q('.m414-screen.old');
    const panels=(count,columns,mode)=>{
      const wrap=document.createElement('div');wrap.className='m414-panels';
      Object.assign(wrap.style,{position:'absolute',inset:'0',zIndex:'4',display:'grid',
        gridTemplateColumns:'repeat('+columns+',1fr)',gridTemplateRows:'repeat('+Math.ceil(count/columns)+',1fr)',
        overflow:'hidden',pointerEvents:'none'});
      host.append(wrap);
      const nodes=Array.from({length:count},(_,i)=>{
        const tile=document.createElement('span');
        Object.assign(tile.style,{display:'block',background:['#0381fe','#79b8fb','#4222c3','#e8f3ff'][i%4],
          transformOrigin:'center',backfaceVisibility:'hidden'});
        wrap.append(tile);
        const row=Math.floor(i/columns), alternate=(row+i)%2?-1:1;
        const from=mode==='flip'?'perspective(250px) rotateY(90deg)':
          mode==='grow'?'scaleY(0)':mode==='zoom'?'scale(.05)':
          mode==='vertical'?'translateY('+(alternate*105)+'%)':
          'translateX('+(alternate*105)+'%)';
        animate(tile,[{transform:from,opacity:0,offset:0},{transform:'none',opacity:1,offset:.7},
          {transform:'none',opacity:0,offset:1}],i*28*2.2/speed,'cubic-bezier(.3,0,.3,1)',ms*.78);
        return tile;
      });
      animate(next,[{opacity:0,offset:0},{opacity:0,offset:.56},{opacity:1,offset:.86},{opacity:1,offset:1}],0,'linear',ms+count*28*2.2/speed);
      return nodes;
    };
    if(id==='tv-off'){
      next.style.opacity='0';
      animate(old,[{transform:'scale(1,1)',filter:'brightness(1)',offset:0},{transform:'scale(1,.025)',filter:'brightness(3)',offset:.34},{transform:'scale(.02,.025)',opacity:0,filter:'brightness(5)',offset:.52},{transform:'scale(.02,.025)',opacity:0,offset:1}],0,'cubic-bezier(.35,0,.65,1)');
      if(options.mode!=='exit')animate(next,[{transform:'scale(.02,.025)',opacity:0,filter:'brightness(4)',offset:0},{transform:'scale(.02,.025)',opacity:0,offset:.52},{transform:'scale(.02,.025)',opacity:1,offset:.55},{transform:'scale(1,.025)',opacity:1,offset:.72},{transform:'scale(1,1)',opacity:1,filter:'brightness(1)',offset:1}],0,'cubic-bezier(.35,0,.65,1)');
      animate(q('.m414-flash'),[{opacity:0},{opacity:.9,offset:.5},{opacity:0}],0,'linear');
    } else if(id==='squeeze-line'){
      next.style.opacity='0';
      animate(old,[{transform:'scale(1,1)',offset:0},{transform:'scale(.025,1)',offset:.48},{transform:'scale(.025,1)',opacity:0,offset:.55},{transform:'scale(.025,1)',opacity:0,offset:1}],0,'cubic-bezier(.35,0,.65,1)');
      animate(next,[{transform:'scale(.025,1)',opacity:0,offset:0},{transform:'scale(.025,1)',opacity:0,offset:.48},{transform:'scale(.025,1)',opacity:1,offset:.55},{transform:'scale(1,1)',opacity:1,offset:1}],0,'cubic-bezier(.35,0,.65,1)');
      q('.m414-flash').style.background='#0381fe';
      animate(q('.m414-flash'),[{opacity:0},{opacity:.9,offset:.5},{opacity:0}],0,'linear');
    } else if(['multi-stripe-wipe','brush-wipe','band-split','horizontal-split','wave-split','zigzag-split'].includes(id)){
      panels(id==='horizontal-split'?2:id==='multi-stripe-wipe'?6:5,1,'horizontal');
    } else if(['slice-wipe','sliding-panels','diagonal-panels','bar-panels','strip-shuffle','vertical-split','domino-flip'].includes(id)){
      const count=id==='bar-panels'?11:id==='strip-shuffle'?8:id==='domino-flip'?6:id==='vertical-split'?2:4;
      panels(count,count,id==='domino-flip'?'flip':id==='bar-panels'?'grow':'vertical');
    } else if(['block-wipe','checker-panels','grid-flip','mosaic-flash','four-panel','triple-split'].includes(id)){
      const count=id==='grid-flip'?9:id==='four-panel'?4:id==='triple-split'?3:id==='mosaic-flash'?12:40;
      const columns=id==='grid-flip'?3:id==='four-panel'?2:id==='triple-split'?3:id==='mosaic-flash'?4:10;
      panels(count,columns,/flip|checker/.test(id)?'flip':'zoom');
    } else if(id==='color-wipe'){
      const bars=panels(3,1,'horizontal');
      bars.forEach((bar,i)=>{bar.style.background=['#0381fe','#4222c3','#ffffff'][i]});
    } else if(id==='panel-zoom-out'){
      panels(3,3,'zoom');
    } else if(id==='frame-stack'){
      panels(4,2,'grow');
    } else if(id==='text-wipe'){
      const label=document.createElement('div');label.textContent='NEXT';
      Object.assign(label.style,{position:'absolute',zIndex:'4',inset:'0',display:'grid',placeItems:'center',
        fontSize:'clamp(65px,15vw,180px)',fontWeight:'900',letterSpacing:'-.08em',color:'#0381fe',pointerEvents:'none'});
      host.append(label);
      animate(label,[{transform:'scale(.1)',opacity:0},{transform:'scale(1)',opacity:1,offset:.45},{transform:'scale(12)',opacity:0}],0,'cubic-bezier(.4,0,.2,1)');
      animate(next,[{opacity:0,offset:0},{opacity:0,offset:.55},{opacity:1,offset:1}],0,'linear');
    } else if(id==='impact-flash'){
      animate(q('.m414-flash'),[{opacity:0},{opacity:1,offset:.3},{opacity:0}],0,'steps(3,end)');
      animate(next,[{opacity:0,offset:0},{opacity:0,offset:.3},{opacity:1,offset:.35},{opacity:1,offset:1}],0,'linear');
    } else if(/push|slide|panel|stack|card|cube|flip|roll|page|domino/.test(id)){
      const axis=/vertical|roll/.test(id)?'Y':'X', from=/return|reverse/.test(id)?-105:105;
      animate(next,[{transform:'translate'+axis+'('+from+'%) rotateY('+(/cube|flip/.test(id)?-40:0)+'deg)'},{transform:'translate'+axis+'(0) rotateY(0deg)'}]);
      animate(old,[{transform:'translateX(0)',opacity:1},{transform:'translateX(-22%)',opacity:.5}]);
    } else if(/dip-to-black|dip-to-white|flash|burn|glitch|rgb|vhs|datamosh/.test(id)){
      animate(old,[{opacity:1,filter:'brightness(1)'},{opacity:0,filter:'brightness('+(/white|flash/.test(id)?3:.05)+')'}]);
      animate(next,[{opacity:0},{opacity:1}],ms*.35);
      animate(q('.m414-flash'),[{opacity:0},{opacity:.65,offset:.5},{opacity:0}],0,'linear');
    } else {
      const start=clipStart(id,index);
      next.style.clipPath=start;
      animate(next,[{clipPath:start,opacity:.65},{clipPath:fullClip,opacity:1}],0,'cubic-bezier(.45,0,.2,1)');
      if(/split|stripe|mosaic|checker|grid|slice|bar/.test(id))
        animate(old,[{transform:'scale(1)',opacity:1},{transform:'scale(.91) rotate('+((index%2)?-3:3)+'deg)',opacity:.3}]);
    }
  } else if(textFamilies.has(family)){
    const letters=qa('.m414-letter'), word=q('.m414-word');
    if(/type|decode|scramble|slot|flap|odometer/.test(id))
      wave(letters,i=>[{opacity:0,transform:'rotateX(85deg) translateY(22px)'},{opacity:1,transform:'rotateX(0) translateY(0)'}],78);
    else if(/rain|gravity|crumble|drop/.test(id))
      wave(letters,i=>[{opacity:0,transform:'translateY(-90px) rotate('+(i%2?25:-25)+'deg)'},{opacity:1,transform:'translateY(0) rotate(0)'}],72);
    else if(/wave|flag|swing|domino|fan|karaoke/.test(id))
      wave(letters,i=>[{transform:'translateY(0) rotate(0)'},{transform:'translateY(-'+(10+i%4*4)+'px) rotate('+(i%2?12:-12)+'deg)',offset:.55},{transform:'translateY(0) rotate(0)'}],85);
    else if(/orbit|vortex|cylinder|tunnel|cube|corridor|kaleido/.test(id))
      wave(letters,i=>[{opacity:0,transform:'perspective(300px) rotateY('+(i%2?90:-90)+'deg) scale(.4)'},{opacity:1,transform:'perspective(300px) rotateY(0) scale(1)'}],65);
    else if(/burst|slam|stamp|punch|zoom|shock|flash/.test(id))
      wave(letters,i=>[{opacity:0,transform:'scale('+(i%2?.2:2.5)+') translateY(20px)'},{opacity:1,transform:'scale(1) translateY(0)'}],45);
    else if(/split|assemble|magnet|shuffle|scatter|mosaic|particle/.test(id))
      wave(letters,i=>[{opacity:0,transform:'translate('+(i%2?-100:100)+'px,'+(i%3?-35:35)+'px) rotate('+(i%2?-40:40)+'deg)'},{opacity:1,transform:'translate(0,0) rotate(0)'}],62);
    else if(/outline|fill|gradient|ink|liquid|highlight|scan|hologram|matrix|pixel|signal/.test(id)){
      animate(word,[{opacity:.2,filter:'blur(8px)',backgroundPosition:'0% 50%'},{opacity:1,filter:'blur(0)',backgroundPosition:'100% 50%'}]);
      wave(letters,[{opacity:0},{opacity:1}],38);
    } else {
      const tx=(index%2?-1:1)*delta, angle=(index%3-1)*spin;
      wave(letters,i=>[{opacity:0,transform:'translate('+tx+'px,18px) rotate('+angle+'deg)'},{opacity:1,transform:'translate(0,0) rotate(0)'}],55+(index%3)*20);
    }
  } else if(backdropFamilies.has(family)){
    const tiles=qa('.m414-tile'), pattern=q('.m414-pattern');
    if(/wave|ocean|flow|fluid|cloud|liquid|reaction/.test(id))
      wave(tiles,i=>[{transform:'translateY(0) scale(.75)',opacity:.5},{transform:'translateY('+((i%6-3)*7)+'px) scale(1.2)',opacity:1},{transform:'translateY(0) scale(.9)',opacity:.7}],18);
    else if(/rings|radial|spiral|tunnel|concentric|orbit|eclipse|pinwheel/.test(id))
      animate(pattern,[{transform:'scale(.75) rotate(-24deg)'},{transform:'scale(1.2) rotate(38deg)'}]);
    else if(/scroll|stripe|line|grid|moire|terrain|matrix/.test(id))
      animate(pattern,[{transform:'translate(-24px,-12px) skewX(-8deg)'},{transform:'translate(24px,12px) skewX(8deg)'}],0,'linear');
    else
      wave(tiles,i=>[{opacity:.15,transform:'scale(.3) rotate(-'+spin+'deg)'},{opacity:1,transform:'scale(1) rotate(0)'}],(index%4+1)*8);
    animate(q('.m414-pattern-label'),[{opacity:.4,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],100);
  } else if(family==='family-05'){
    const b=q('.m414-button'), ghost=q('.m414-ghost');
    const easing=/linear/.test(id)?'linear':/ease-out/.test(id)?'ease-out':
      /ease-in/.test(id)?'ease-in':/bounce|overshoot|spring/.test(id)?'cubic-bezier(.25,1.6,.45,1)':'cubic-bezier(.45,0,.35,1)';
    const frames=/squash/.test(id)?[{transform:'scale(1)'},{transform:'scale(1.2,.72)',offset:.5},{transform:'scale(1)'}]:
      /arc|pendulum/.test(id)?[{transform:'translate(-45px,28px) rotate(-18deg)'},{transform:'translate(0,-18px) rotate(0)',offset:.5},{transform:'translate(45px,28px) rotate(18deg)'}]:
      /hold|freeze/.test(id)?[{transform:'translateX(0)'},{transform:'translateX(0)',offset:.65},{transform:'translateX(45px)'}]:
      /pop|bounce|overshoot|spring/.test(id)?[{transform:'scale(.65)'},{transform:'scale(1.24)',offset:.68},{transform:'scale(1)'}]:
      [{transform:'translateX(-'+delta+'px) rotate(-5deg)'},{transform:'translateX('+delta+'px) rotate(5deg)'}];
    animate(b,frames,0,easing);
    animate(ghost,[{transform:'translateX(-40px)',opacity:.3},{transform:'translateX(40px)',opacity:.8}],ms*.12);
  } else if(family==='family-06'){
    const film=q('.m414-film-image'), overlay=q('.m414-film-overlay');
    const frames=/slow/.test(id)?[{transform:'scale(.92)'},{transform:'scale(1.1)'}]:
      /reverse/.test(id)?[{transform:'scale(1.2) rotate(25deg)'},{transform:'scale(.9) rotate(-25deg)'}]:
      /split|pip/.test(id)?[{transform:'scale(1)'},{transform:'scale(.6) translateX(45%)'}]:
      /grain|crt|strobe|glitch|datamosh/.test(id)?[{filter:'contrast(1) blur(0)'},{filter:'contrast(2) blur(5px)',offset:.45},{filter:'contrast(1.2) blur(0)'}]:
      [{filter:'brightness(.5) saturate(.6)',transform:'scale(.9)'},{filter:'brightness(1.4) saturate(1.5)',transform:'scale(1.16)'}];
    animate(film,frames);
    animate(overlay,[{opacity:0},{opacity:.6,offset:.45},{opacity:0}],0,/strobe/.test(id)?'steps(3,end)':'linear');
  } else if(family==='family-12'){
    const bars=qa('.m414-bar');
    if(/swap|race|sort/.test(id)) wave(bars,i=>[{transform:'translateY(0)'},{transform:'translateY('+((i%2?-1:1)*40)+'px)'}],42);
    else if(/pie|donut|ring|gauge|waffle/.test(id)) wave(bars,i=>[{transform:'scaleY(.12) rotate(-25deg)',opacity:.25},{transform:'scaleY(1) rotate(0)',opacity:1}],72);
    else wave(bars,i=>[{transform:'scaleY(0)',opacity:.2},{transform:'scaleY(1)',opacity:1}],48);
    animate(q('.m414-chart-value'),[{opacity:0,transform:'translateY(16px) scale(.8)'},{opacity:1,transform:'translateY(0) scale(1)'}],ms*.3);
  } else if(family==='family-13'){
    if(id==='shine-sweep'){
      animate(q('.m414-shine-band'),[{transform:'translateX(-220%) skewX(-18deg)',offset:0},{transform:'translateX(-220%) skewX(-18deg)',offset:.3},{transform:'translateX(0) skewX(-18deg)',offset:.5},{transform:'translateX(220%) skewX(-18deg)',offset:.75},{transform:'translateX(220%) skewX(-18deg)',offset:1}],0,'linear');
    }else{
    const icon=q('.m414-icon');
    const frames=/spin|refresh|rotate|orbit/.test(id)?[{transform:'rotate(-180deg) scale(.7)'},{transform:'rotate(0) scale(1)'}]:
      /shake|wiggle|bell/.test(id)?[{transform:'rotate(-18deg)'},{transform:'rotate(18deg)',offset:.5},{transform:'rotate(0)'}]:
      /trace|draw|stroke|fill|check/.test(id)?[{opacity:.1,transform:'scale(.5)'},{opacity:1,transform:'scale(1)'}]:
      [{opacity:0,transform:'scale(.35) translateY(24px)'},{opacity:1,transform:'scale(1) translateY(0)'}];
    animate(icon,frames);
    animate(q('.m414-sparks'),[{opacity:0,transform:'scale(.2)'},{opacity:1,transform:'scale(1.2)'},{opacity:0,transform:'scale(1.5)'}],ms*.12);
    }
  } else if(family==='family-14'){
    const social=q('.m414-social-action'), count=q('.m414-social-count');
    animate(social,/swipe|fling|rise|float/.test(id)?
      [{opacity:.2,transform:'translateY(35px) rotate(-8deg)'},{opacity:1,transform:'translateY(0) rotate(0)'}]:
      [{transform:'scale(.8)',background:'#e8ecf0'},{transform:'scale(1.1)',background:'#e1f0ff',offset:.68},{transform:'scale(1)',background:'#d5ebff'}]);
    animate(count,[{opacity:.2,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],ms*.18);
  } else if(family==='family-15'){
    const parts=qa('.m414-part');
    wave(parts,i=>[{opacity:.2,transform:'translate('+(i-1)*75+'px,'+(i%2?55:-55)+'px) rotate('+(i-1)*spin+'deg)'},{opacity:1,transform:'translate(0,0) rotate(0)'}],100);
    const line=q('.m414-line');
    animate(line,[{strokeDashoffset:350},{strokeDashoffset:0}],0,'linear');
  } else if(id==='countdown'){
    const step=ms/4.4, circumference=2*Math.PI*52;
    qa('.m414-countdown-digit').forEach((digit,i)=>{
      const delay=i*step;
      animate(digit,[{opacity:1,transform:'scale(.4)',offset:0},{opacity:1,transform:'scale(1.08)',offset:.2},{opacity:1,transform:'scale(1)',offset:.28},{opacity:1,transform:'scale(1)',offset:.99},{opacity:0,transform:'scale(.95)',offset:1}],delay,'linear',step);
      animate(q('.m414-countdown-ring'),[{opacity:1,strokeDashoffset:0,offset:0},{opacity:1,strokeDashoffset:circumference,offset:.99},{opacity:0,strokeDashoffset:circumference,offset:1}],delay,'linear',step);
    });
    animate(q('.m414-countdown-face svg'),[{opacity:1,offset:0},{opacity:1,offset:3/4.4},{opacity:0,offset:3/4.4+.01},{opacity:0,offset:1}],0,'linear',ms);
    animate(q('.m414-countdown-go'),[{opacity:0,transform:'scale(.4)',offset:0},{opacity:1,transform:'scale(1.08)',offset:.22},{opacity:1,transform:'scale(1)',offset:.32},{opacity:1,transform:'scale(1)',offset:1}],3*step,'ease-out',1.4*step);
  } else if(family==='family-18'){
    const digits=q('.m414-digits'), badge=q('.m414-delta');
    animate(digits,/roulette|dice|slot|seven|odometer|countdown/.test(id)?
      [{opacity:.2,transform:'translateY(-55px) rotateX(-70deg)'},{opacity:1,transform:'translateY(0) rotateX(0)'}]:
      [{opacity:.3,transform:'scale(.65)'},{opacity:1,transform:'scale(1.08)',offset:.72},{opacity:1,transform:'scale(1)'}]);
    animate(badge,[{opacity:0,transform:'translateY(26px)'},{opacity:1,transform:'translateY(0)'}],ms*.25);
  } else if(family==='family-19'){
    if(!animateSpecificDiagram(id,host,animate,ms)){
      wave(qa('.m414-link'),[{strokeDashoffset:260,opacity:.2},{strokeDashoffset:0,opacity:1}],105);
      wave(qa('.m414-diagram rect'),i=>[{opacity:.3,transform:'scale(.7)',transformOrigin:'center'},{opacity:1,transform:'scale(1)',transformOrigin:'center'}],115);
    }
  }
  if(animations.length===0) throw Error(id+': no animation produced');
  return {animations,durationMs:ms,target:labelFor(entry),finish:()=>animations.forEach(animation=>animation.finish()),cancel:()=>animations.forEach(animation=>animation.cancel())};
}
