/* Raw DOM paint evidence; role and actual Z relationships still need visual review. */
const visible = box => box.width >= 8 && box.height >= 8 && box.right > 0 && box.bottom > 0 && box.left < innerWidth && box.top < innerHeight;
const painted = style => !['rgba(0, 0, 0, 0)','transparent'].includes(style.backgroundColor);

export function analyzeBackgroundLayers(root = document, {limit = 120} = {}) {
  const elements = [root.documentElement || document.documentElement, root.body || document.body, ...root.querySelectorAll('body *')];
  const entries = [];
  for (const [order, element] of [...new Set(elements)].entries()) {
    if (!element?.getBoundingClientRect) continue;
    const box = element.getBoundingClientRect();
    if (!visible(box)) continue;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const image = style.backgroundImage !== 'none' ? style.backgroundImage : null;
    const shadow = style.boxShadow !== 'none' ? style.boxShadow : null;
    const filter = style.filter !== 'none' ? style.filter : null;
    const backdropValue = style.backdropFilter || style.webkitBackdropFilter || 'none';
    const backdropFilter = backdropValue !== 'none' ? backdropValue : null;
    const border = [style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth].some(value=>parseFloat(value)>0);
    if (!painted(style) && !image && !shadow && !filter && !backdropFilter && !border) continue;
    const contextReasons = [];
    if (style.position !== 'static' && style.zIndex !== 'auto') contextReasons.push('positioned-z-index');
    if (Number(style.opacity) < 1) contextReasons.push('opacity');
    if (style.transform !== 'none') contextReasons.push('transform');
    if (filter) contextReasons.push('filter');
    if (backdropFilter) contextReasons.push('backdrop-filter');
    if (style.isolation === 'isolate') contextReasons.push('isolation');
    if (style.mixBlendMode !== 'normal') contextReasons.push('mix-blend-mode');
    if (['fixed','sticky'].includes(style.position)) contextReasons.push(style.position);
    entries.push({element,order,box,style,image,shadow,filter,backdropFilter,border,contextReasons});
  }
  const ids = new Map(entries.map((entry,index)=>[entry.element,`paint-${index+1}`]));
  const nearest = element => {
    for (let current=element?.parentElement;current;current=current.parentElement) {
      if (ids.has(current)) return ids.get(current);
    }
    return null;
  };
  const layers = entries.slice(0,limit).map(entry => {
    const {element,box,style} = entry;
    const cx = Math.min(innerWidth-1,Math.max(0,box.left+box.width/2));
    const cy = Math.min(innerHeight-1,Math.max(0,box.top+box.height/2));
    const hit = document.elementFromPoint(cx,cy);
    const hitLayer = hit && (ids.get(hit) || nearest(hit));
    return {
      id:ids.get(element), parentId:nearest(element), sourceOrder:entry.order,
      tag:element.tagName.toLowerCase(), className:typeof element.className==='string'?element.className.slice(0,100):'',
      bounds:[box.x,box.y,box.width,box.height].map(value=>Math.round(value)),
      backgroundColor:painted(style)?style.backgroundColor:null, backgroundImage:entry.image,
      opacity:style.opacity, boxShadow:entry.shadow, filter:entry.filter, backdropFilter:entry.backdropFilter,
      border:entry.border?{color:style.borderTopColor,width:style.borderTopWidth,style:style.borderTopStyle}:null,
      position:style.position, zIndex:style.zIndex, stackingContextReasons:entry.contextReasons,
      topPaintedLayerAtCenter:hitLayer||null, evidence:'computed-style-current-state',
    };
  });
  return {
    viewport:[innerWidth,innerHeight], examined:elements.length, matchingLayers:entries.length, layers,
    limits:'Parent is nearest painted DOM ancestor; it is not proof of compositing order. z-index is local to a stacking context. A center hit is one point only. Pseudo-elements, canvas/WebGL, video and image effects require visual inspection.',
  };
}
