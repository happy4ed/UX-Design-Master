/* A real scroll-bound scene for the Scroll 3D guess style. */
const scrollDemo=document.createElement('section');
scrollDemo.id='scroll3d-demo';
scrollDemo.hidden=true;
scrollDemo.innerHTML='<h2>스크롤 3D · 스크롤 위치에 묶인 장면</h2><p>아래 장면 안에서 스크롤하거나 키보드로 이동하세요. 되돌리면 물체도 되감깁니다. 본문과 조작은 평면 층에 남습니다. <b>guess</b> 시연입니다.</p><div class="space-scroll" tabindex="0" aria-label="스크롤에 반응하는 입체 장면"><div class="space-track"><div class="space-stage"><div class="space-object"><span class="space-front">공간</span><span class="space-left"></span><span class="space-right"></span></div><div class="space-panel space-a">01 · 시작</div><div class="space-panel space-b">02 · 펼침</div><div class="space-panel space-c">03 · 정착</div><div class="space-readout">진행 0%</div></div></div></div>';
document.querySelector('#motion-demo').after(scrollDemo);
const spaceScroll=scrollDemo.querySelector('.space-scroll');
function updateSpace(){
  const value=spaceScroll.scrollTop/Math.max(1,spaceScroll.scrollHeight-spaceScroll.clientHeight);
  const progress=Math.min(1,Math.max(0,value));
  scrollDemo.style.setProperty('--space-progress',progress);
  scrollDemo.style.setProperty('--space-y',(-25+progress*200)+'deg');
  scrollDemo.style.setProperty('--space-x',(12+progress*35)+'deg');
  scrollDemo.style.setProperty('--space-z',(progress*90)+'px');
  scrollDemo.style.setProperty('--space-left',(-progress*80)+'px');
  scrollDemo.style.setProperty('--space-right',(progress*70)+'px');
  scrollDemo.style.setProperty('--space-opacity',1-progress*.15);
  scrollDemo.querySelector('.space-readout').textContent='진행 '+Math.round(progress*100)+'%';
}
spaceScroll.addEventListener('scroll',updateSpace,{passive:true});
function showSpace(){scrollDemo.hidden=document.querySelector('#style').value!=='scroll-3d';if(!scrollDemo.hidden)updateSpace()}
const styleSelect=document.querySelector('#style');
styleSelect.addEventListener('change',showSpace);
new MutationObserver(showSpace).observe(styleSelect,{childList:true});
showSpace();
