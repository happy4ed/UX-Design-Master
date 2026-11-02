// Starting points for review, never an automatic product-wide choice.
export const motionStrengths=Object.freeze({
  static:{duration:0,pressScale:1,enterDistance:0,enterScale:1,galleryCycle:0,effectDistance:0,effectScale:1,effectAngle:0,effectBlur:0},
  micro:{duration:140,pressScale:.985,enterDistance:5,enterScale:.98,galleryCycle:3100,effectDistance:9,effectScale:.96,effectAngle:5,effectBlur:1},
  quiet:{duration:280,pressScale:.965,enterDistance:14,enterScale:.94,galleryCycle:3400,effectDistance:22,effectScale:.88,effectAngle:12,effectBlur:3},
  balanced:{duration:480,pressScale:.94,enterDistance:28,enterScale:.86,galleryCycle:3600,effectDistance:42,effectScale:.74,effectAngle:22,effectBlur:6},
  expressive:{duration:800,pressScale:.88,enterDistance:54,enterScale:.73,galleryCycle:4000,effectDistance:68,effectScale:.62,effectAngle:34,effectBlur:9},
  dramatic:{duration:1250,pressScale:.8,enterDistance:90,enterScale:.55,galleryCycle:4600,effectDistance:96,effectScale:.45,effectAngle:48,effectBlur:13}
});
export const motionFeels=Object.freeze({
  neutral:{label:'중립',easing:'cubic-bezier(.25,.75,.25,1)',description:'빠르게 반응하고 부드럽게 멈춤'},
  precise:{label:'정밀',easing:'cubic-bezier(.4,0,.2,1)',description:'목표를 넘지 않고 안정적으로 도착'},
  brisk:{label:'경쾌',easing:'cubic-bezier(.18,.85,.22,1)',description:'초반 빠른 반응과 짧은 끝맺음'},
  tension:{label:'텐션',easing:'cubic-bezier(.26,1.5,.38,1)',description:'목표를 조금 지나 되돌아옴'},
  relax:{label:'릴랙스',easing:'cubic-bezier(.12,1,.25,1)',description:'빠르게 출발하고 길게 감속'},
  spring:{label:'스프링',easing:'cubic-bezier(.34,1.56,.64,1)',description:'탄성 있게 목표를 지나 복귀'},
  elastic:{label:'엘라스틱',easing:'cubic-bezier(.68,-.55,.27,1.55)',description:'출발과 착지에 반동'},
  linear:{label:'일정',easing:'linear',description:'속도를 일정하게 유지'},
  stepped:{label:'계단',easing:'steps(6,end)',description:'연속 이동을 여섯 단계로 나눔'}
});
export function resolveMotion(strength='quiet',feel='neutral',{reduced=false}={}){
  if(!(strength in motionStrengths)||!(feel in motionFeels))throw new Error('알 수 없는 모션 강도 또는 이징입니다.');
  const selected=motionStrengths[strength],actual=reduced?motionStrengths.static:selected;
  return {...actual,strength,feel,easing:motionFeels[feel].easing,reduced};
}
export function applyMotionPreset(root,preset){
  root.dataset.motionStrength=preset.reduced?'static':preset.strength;
  root.dataset.motionFeel=preset.feel;
  root.style.setProperty('--motion-state',`${preset.duration}ms`);
  root.style.setProperty('--motion-press',`${Math.round(preset.duration*.55)}ms`);
  root.style.setProperty('--motion-distance',`${preset.enterDistance}px`);
  root.style.setProperty('--motion-enter-scale',String(preset.enterScale));
  root.style.setProperty('--motion-press-scale',String(preset.pressScale));
  root.style.setProperty('--motion-ease',preset.easing);
  root.style.setProperty('--gallery-cycle',`${preset.galleryCycle}ms`);
  root.style.setProperty('--effect-distance',`${preset.effectDistance}px`);
  root.style.setProperty('--effect-scale',String(preset.effectScale));
  root.style.setProperty('--effect-angle',`${preset.effectAngle}deg`);
  root.style.setProperty('--effect-blur',`${preset.effectBlur}px`);
  return preset;
}
