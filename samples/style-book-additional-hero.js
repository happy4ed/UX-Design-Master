/* Original, source-informed studies. No third-party image is embedded. */
const STYLE_STUDIES={
  'bento-grid':`<div class="study-title">서로 다른 정보 크기</div><div class="study-bento">
    <button type="button" class="study-tile study-tile-large" aria-label="오늘의 핵심 정보">오늘의 핵심<strong>03</strong><small>먼저 읽기</small></button>
    <button type="button" class="study-tile study-tile-small" aria-label="연결 상태">연결<strong>●</strong></button>
    <button type="button" class="study-tile study-tile-small" aria-label="새 알림">새 알림<strong>2</strong></button>
    <button type="button" class="study-tile study-tile-wide" aria-label="진행 중인 항목">진행 중 <strong>오늘 오후 3:30</strong></button>
  </div>`,
  'dark-tech':`<div class="study-tech"><div class="study-tech-top"><span>시스템 상태</span><b>● 정상</b></div><div class="study-tech-plot"><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:80%"></i><i style="--h:61%"></i><i style="--h:92%"></i><i style="--h:73%"></i></div><div class="study-tech-bottom"><span>활성 작업</span><strong>07 / 12</strong></div></div>`,
  'kinetic-typography':`<div class="study-kinetic"><span class="study-overline">읽는 순서를 만드는 동작</span><div class="study-letters" aria-label="글자가 움직인다"><span>글</span><span>자</span><span>가</span><br><span>움</span><span>직</span><span>인</span><span>다</span><span>.</span></div><button type="button" class="study-replay">다시 보기 ↗</button></div>`,
  'scroll-3d':`<div class="study-spatial"><div class="study-spatial-object"><span>01</span></div><div><small>스크롤 위치 ↔ 공간 변화</small><strong>물체와 정보가<br>순서대로 펼쳐집니다.</strong><a href="style-guess-books.html?style=scroll-3d#scroll3d-demo" target="_top">스크롤 시연 보기 ↗</a></div></div>`,
  'grainy-gradient':`<div class="study-grain" style="--grain-opacity:.24"><div class="study-grain-noise"></div><div class="study-grain-copy"><small>색장 + 입자 + 선명한 글자</small><strong>부드러운 색의 결</strong><label>입자 강도 <input type="range" min="0" max="60" value="24" aria-label="입자 강도"></label></div></div>`,
  'retro-pixel':`<div class="study-pixel"><div class="study-pixel-grid" aria-hidden="true">◼ ◼ ◼ ◼ ◼<br>◼ ◻ ◻ ◻ ◼<br>◼ ◻ ◼ ◻ ◼<br>◼ ◻ ◻ ◻ ◼<br>◼ ◼ ◼ ◼ ◼</div><div><small>LEVEL 01</small><strong>PIXEL<br>PLAY</strong><button type="button">▶ 시작</button></div></div>`,
  'swiss-grid':`<div class="study-swiss"><div class="study-swiss-header"><span>01</span><span>구성 원칙</span><span>2026</span></div><div class="study-swiss-body"><strong>정확한<br>기준선</strong><p>같은 시작선.<br>분명한 순서.</p></div><div class="study-swiss-footer">GRID / TYPE / ORDER <span>↗</span></div></div>`
};
const studyPhone=document.querySelector('#phone');
if(studyPhone){
  const study=document.createElement('section');
  study.className='style-study';
  study.setAttribute('aria-label','선택한 스타일의 대표 표현');
  studyPhone.querySelector('.bar').after(study);
  function renderStudy(){
    const id=Object.keys(STYLE_STUDIES).find(key=>studyPhone.classList.contains(key));
    study.hidden=!id;
    study.innerHTML=id?STYLE_STUDIES[id]:'';
    if(id==='kinetic-typography'){
      const replay=study.querySelector('.study-replay');
      replay.onclick=()=>{const letters=study.querySelector('.study-letters');letters.classList.remove('playing');void letters.offsetWidth;letters.classList.add('playing')};
      replay.click();
    }
    if(id==='grainy-gradient')study.querySelector('input').oninput=e=>study.querySelector('.study-grain').style.setProperty('--grain-opacity',e.target.value/100);
    if(id==='bento-grid')study.querySelectorAll('.study-tile').forEach(tile=>tile.onclick=()=>{study.querySelectorAll('.study-tile').forEach(x=>x.classList.remove('selected'));tile.classList.add('selected')});
    if(id==='retro-pixel')study.querySelector('button').onclick=e=>{e.currentTarget.textContent=e.currentTarget.textContent.includes('시작')?'Ⅱ 일시정지':'▶ 시작'};
  }
  new MutationObserver(renderStudy).observe(studyPhone,{attributes:true,attributeFilter:['class']});
  renderStudy();
}
