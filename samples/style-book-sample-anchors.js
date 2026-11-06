/* Stable deep links from the A–L component and motion tables. */
function revealSampleAnchor(){
  const target=location.hash.slice(1);
  if(!target.startsWith('component-')&&!target.startsWith('motion-'))return;
  document.getElementById(target)?.scrollIntoView({block:'center',behavior:'instant'});
}
document.querySelectorAll('[data-component]').forEach(node=>node.id='component-'+node.dataset.component);
const motions=document.querySelector('#motions');
if(motions){
  function anchorMotions(){
    motions.querySelectorAll('.motion-card').forEach((node,index)=>node.id='motion-'+index);
    revealSampleAnchor();
  }
  new MutationObserver(anchorMotions).observe(motions,{childList:true});
  anchorMotions();
}
window.addEventListener('hashchange',revealSampleAnchor);
setTimeout(revealSampleAnchor,50);
