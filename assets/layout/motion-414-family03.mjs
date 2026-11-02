// Explicit stage mechanisms for the twelve reveal/transition vocabulary entries.
// Each scene and animation is independently specified from the observed motion.
const screen = (kind) => '<div class="m414-screen old"><div class="m414-topline">10:13 <span>● 77%</span></div><div class="m414-screen-content"><small>SETTINGS</small><h3>현재 화면</h3><p>화면 전환 전 위치</p><i></i><i></i></div></div><div class="m414-screen next"><div class="m414-topline">10:13 <span>● 77%</span></div><div class="m414-screen-content"><small>NEXT VIEW</small><h3>다음 화면</h3><p>새로운 콘텐츠와 상태</p><i></i><i></i></div></div>';
const sceneById = {
  'cross-dissolve': () => screen(),
  'pixel-dissolve': () => screen() + '<div class="m414-pixel-grid"></div>',
  'iris-wipe': () => screen(),
  wipe: () => screen(),
  'mask-reveal': () => '<div class="m414-focus-stage"><div class="m414-mask-logo"><span>◈</span><b>FORM</b></div></div>',
  'morph-cut': () => '<div class="m414-focus-stage"><div class="m414-face face-a"><span class="eye left"></span><span class="eye right"></span><span class="mouth"></span></div><div class="m414-face face-b"><span class="eye left"></span><span class="eye right"></span><span class="mouth"></span></div><div class="m414-face-caption">TAKE 01 → TAKE 02</div></div>',
  glitch: () => screen() + '<div class="m414-glitch-slice one"></div><div class="m414-glitch-slice two"></div><div class="m414-glitch-slice three"></div>',
  'rgb-split': () => '<div class="m414-focus-stage"><div class="m414-rgb red">SIGNAL</div><div class="m414-rgb cyan">SIGNAL</div><div class="m414-rgb main">SIGNAL</div></div>',
  'light-sweep': () => '<div class="m414-focus-stage"><div class="m414-logo-surface"><span>LOGO</span><i class="m414-light-band"></i></div></div>',
  'screen-dive': () => '<div class="m414-dive-world"><div class="m414-laptop"><div class="m414-laptop-screen"><div class="m414-inner-scene"><span>EXPLORE</span><i></i></div></div><div class="m414-laptop-base"></div></div></div>',
  'line-draw': () => '<div class="m414-focus-stage m414-line-stage"><svg viewBox="0 0 500 260" aria-hidden="true"><path class="m414-chart-axis" d="M35 25 V205 H470"/><path class="m414-draw-path" d="M35 205 C105 192 130 135 205 160 S325 40 465 75"/><path class="m414-draw-arrow" d="M-15 -8 L0 0 L-15 8"/></svg></div>',
  'shape-morph': () => '<div class="m414-focus-stage"><div class="m414-morph-shape"></div></div>'
};
export function sceneFamily03(id) {
  if (!sceneById[id]) throw Error('Unknown reveal mechanism: ' + id);
  return sceneById[id]();
}
export function animateFamily03(id, host, animate, ms) {
  const q = selector => host.querySelector(selector);
  const next = q('.m414-screen.next');
  if (id === 'cross-dissolve') {
    animate(next, [{opacity:0},{opacity:1}],0,'linear');
    animate(q('.m414-screen.old'),[{opacity:1},{opacity:0}],0,'linear');
  } else if (id === 'pixel-dissolve') {
    next.style.opacity='0';
    const grid=q('.m414-pixel-grid');
    for(let i=0;i<80;i++){
      const tile=document.createElement('span');
      tile.style.setProperty('--tile',String(i));grid.append(tile);
      animate(tile,[{opacity:0,transform:'scale(.2)'},{opacity:1,transform:'scale(1)',offset:.55},{opacity:0,transform:'scale(1)',offset:1}],(i%10*17+Math.floor(i/10)*12)*ms/700,'steps(2,end)',ms*.75);
    }
    animate(next,[{opacity:0,offset:0},{opacity:0,offset:.6},{opacity:1,offset:.8},{opacity:1,offset:1}],0,'linear');
  } else if (id === 'iris-wipe') {
    next.style.clipPath='circle(0% at 50% 50%)';
    animate(next,[{clipPath:'circle(0% at 50% 50%)'},{clipPath:'circle(75% at 50% 50%)'}]);
  } else if (id === 'wipe') {
    next.style.clipPath='inset(0 100% 0 0)';
    animate(next,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],0,'linear');
  } else if (id === 'mask-reveal') {
    const logo=q('.m414-mask-logo');
    animate(logo,[{clipPath:'polygon(0 0,0 0,0 100%,0 100%)'},{clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)'}],0,'cubic-bezier(.55,0,.25,1)');
    animate(logo.querySelector('span'),[{opacity:.2,filter:'blur(9px)'},{opacity:1,filter:'blur(0)'}]);
  } else if (id === 'morph-cut') {
    animate(q('.face-a'),[{opacity:1,filter:'blur(0)',transform:'translateX(-6px) scale(.98)'},{opacity:.45,filter:'blur(3px)',transform:'translateX(2px) scale(1.01)',offset:.5},{opacity:0,filter:'blur(0)',transform:'translateX(5px) scale(1.03)'}]);
    animate(q('.face-b'),[{opacity:0,filter:'blur(0)',transform:'translateX(-5px) scale(.97)'},{opacity:.55,filter:'blur(3px)',transform:'translateX(2px) scale(1)',offset:.5},{opacity:1,filter:'blur(0)',transform:'translateX(6px) scale(1.02)'}]);
  } else if (id === 'glitch') {
    next.style.opacity='0';
    for(const [i,node] of [...host.querySelectorAll('.m414-glitch-slice')].entries())
      animate(node,[{opacity:0,transform:'translateX(0)'},{opacity:1,transform:'translateX('+((i%2?-1:1)*35)+'px)',offset:.28},{opacity:1,transform:'translateX('+((i%2?1:-1)*25)+'px)',offset:.49},{opacity:0,transform:'translateX(0)',offset:.7},{opacity:0,transform:'translateX(0)',offset:1}],0,'steps(5,end)');
    animate(next,[{opacity:0,offset:0},{opacity:0,offset:.58},{opacity:1,offset:.62},{opacity:1,offset:1}],0,'steps(2,end)');
  } else if (id === 'rgb-split') {
    animate(q('.m414-rgb.red'),[{transform:'translate(-32px,-3px)',opacity:.85},{transform:'translate(0,0)',opacity:0}],0,'cubic-bezier(.4,0,.2,1)');
    animate(q('.m414-rgb.cyan'),[{transform:'translate(31px,4px)',opacity:.85},{transform:'translate(0,0)',opacity:0}],0,'cubic-bezier(.4,0,.2,1)');
    animate(q('.m414-rgb.main'),[{filter:'blur(3px)'},{filter:'blur(0)'}]);
  } else if (id === 'light-sweep') {
    animate(q('.m414-light-band'),[{transform:'translateX(-350%) skewX(-18deg)',offset:0},{transform:'translateX(0%) skewX(-18deg)',offset:.72},{transform:'translateX(350%) skewX(-18deg)',offset:1}],0,'linear');
  } else if (id === 'screen-dive') {
    animate(q('.m414-laptop'),[{transform:'scale(.8)',offset:0},{transform:'scale(1)',offset:.2},{transform:'scale(6.5)',offset:1}],0,'cubic-bezier(.55,0,.25,1)');
    animate(q('.m414-inner-scene'),[{transform:'scale(.82)',filter:'blur(0)'},{transform:'scale(1.4)',filter:'blur(0)'}]);
  } else if (id === 'line-draw') {
    const path=q('.m414-draw-path');
    const length=path.getTotalLength();
    path.style.strokeDasharray=String(length);
    animate(path,[{strokeDashoffset:length},{strokeDashoffset:0}],0,'cubic-bezier(.45,0,.55,1)');
    animate(q('.m414-draw-arrow'),[{offsetDistance:'0%',opacity:0,offset:0},{offsetDistance:'1%',opacity:1,offset:.02},{offsetDistance:'100%',opacity:1,offset:1}],0,'cubic-bezier(.45,0,.55,1)');
  } else if (id === 'shape-morph') {
    animate(q('.m414-morph-shape'),[{width:'128px',height:'128px',borderRadius:'8px',transform:'rotate(-10deg)',backgroundColor:'#19a990'},{width:'166px',height:'166px',borderRadius:'50%',transform:'rotate(0deg)',backgroundColor:'#19a990'}],0,'cubic-bezier(.45,0,.25,1)');
  } else throw Error('Unimplemented reveal mechanism: ' + id);
}
