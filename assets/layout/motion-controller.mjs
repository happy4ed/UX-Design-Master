// Reusable motion preview for DOM based app, web, and document prototypes.
// Uses the Web Animations API so play, pause, replay, and state are observable.
export class MotionController{
  constructor(root){this.root=root;this.animations=[];this.mode='none'}
  stop(){this.animations.forEach(animation=>animation.cancel());this.animations=[];this.mode='none'}
  play(mode,{paused=false,force=false}={}){
    this.stop();this.mode=mode;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(mode==='none')return {running:false,reason:'static',reduced};
    if(reduced&&!force)return {running:false,reason:'reduced-motion',reduced};
    const target=this.root.querySelector('[data-motion-target]'),tracer=this.root.querySelector('[data-motion-tracer]'),track=this.root.querySelector('[data-motion-track]');
    if(!target||!tracer||!track)return {running:false,reason:'missing-target',reduced};
    if(mode==='trace'){
      const distance=Math.max(0,track.clientWidth-tracer.offsetWidth);
      this.animations.push(tracer.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${distance}px)`,opacity:1}],{duration:1400,iterations:Infinity,easing:'linear'}));
      this.animations.push(target.animate([{opacity:.55},{opacity:1}],{duration:700,iterations:Infinity,direction:'alternate',easing:'ease-in-out'}));
    }else if(mode==='reveal'){
      this.animations.push(target.animate([{opacity:0,transform:'translateY(18px)',offset:0},{opacity:1,transform:'translateY(0)',offset:.3},{opacity:1,transform:'translateY(0)',offset:.74},{opacity:0,transform:'translateY(-8px)',offset:1}],{duration:2200,iterations:Infinity,easing:'ease-in-out'}));
    }else if(mode==='pulse'){
      this.animations.push(target.animate([{transform:'scale(1)',boxShadow:'0 0 0 0 rgba(18,107,104,.12)'},{transform:'scale(1.09)',boxShadow:'0 0 0 15px rgba(18,107,104,0)'}],{duration:900,iterations:Infinity,direction:'alternate',easing:'ease-in-out'}));
    }else return {running:false,reason:'unsupported-mode',reduced};
    if(paused)this.animations.forEach(animation=>animation.pause());
    return {running:!paused,paused,reduced,animations:this.animations.length};
  }
  setPaused(paused){this.animations.forEach(animation=>paused?animation.pause():animation.play());return {running:!paused&&this.animations.length>0,paused}}
}
