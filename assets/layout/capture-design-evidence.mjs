/** Collect rendered style evidence without assigning semantic roles or Z order. */
export function captureDesignEvidence(root = document.body, limit = 3000, state = {}) {
  const fields = ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'borderRadius', 'gap', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderColor', 'borderWidth', 'boxShadow', 'backdropFilter', 'filter', 'opacity', 'mixBlendMode'];
  const counts = Object.fromEntries(fields.map(field => [field, new Map()]));
  const weighted = Object.fromEntries(fields.map(field => [field, new Map()]));
  const allNodes = [root, ...root.querySelectorAll('*')];
  const nodes = allNodes.slice(0, limit);
  const layerCandidates = [];
  const materialCandidates = [];
  const shapeCandidates = [];
  const landmarks = [];
  let sampledNodes = 0;
  const translucent = value => !value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || value === 'none';
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) <= 0.05) continue;
    const rect = node.getBoundingClientRect();
    const width = Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left));
    const height = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
    if (!width || !height) continue;
    sampledNodes++;
    const areaRatio = width * height / Math.max(1, innerWidth * innerHeight);
    if (node.dataset?.measureLandmark) landmarks.push({id:node.dataset.measureLandmark,
      x:+rect.left.toFixed(2),y:+rect.top.toFixed(2),width:+rect.width.toFixed(2),height:+rect.height.toFixed(2)});
    const textChars = [...node.childNodes].filter(child => child.nodeType === 3).reduce((n, child) => n + child.textContent.trim().length, 0);
    const interactive = node.matches('a,button,input,select,textarea,[role="button"],[role="tab"],[role="switch"]');
    const pseudo = Object.fromEntries(['::before', '::after'].map(part => {
      const value = getComputedStyle(node, part);
      return [part, value && value.content && value.content !== 'none' && value.content !== 'normal' ? {
        content: value.content, backgroundColor: value.backgroundColor, backgroundImage: value.backgroundImage,
        filter: value.filter, backdropFilter: value.backdropFilter, opacity: value.opacity,
        boxShadow: value.boxShadow, transform: value.transform
      } : null];
    }).filter(([, value]) => value));
    const alpha = /^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/.exec(style.backgroundColor || '');
    const partialBackground = alpha && Number(alpha[1]) > 0 && Number(alpha[1]) < 1;
    const hasEffect = (style.backdropFilter && style.backdropFilter !== 'none') ||
      (style.filter && style.filter !== 'none') || (style.mixBlendMode && style.mixBlendMode !== 'normal') ||
      Object.values(pseudo).some(value => value && ((value.filter && value.filter !== 'none') ||
        (value.backdropFilter && value.backdropFilter !== 'none')));
    if (partialBackground || hasEffect) materialCandidates.push({index:i, tag:node.tagName.toLowerCase(),
      box:{x:+rect.left.toFixed(2),y:+rect.top.toFixed(2),width:+(rect.right-rect.left).toFixed(2),height:+(rect.bottom-rect.top).toFixed(2)},
      backgroundColor:style.backgroundColor, backgroundImage:style.backgroundImage, opacity:style.opacity,
      backdropFilter:style.backdropFilter, filter:style.filter, mixBlendMode:style.mixBlendMode,
      boxShadow:style.boxShadow, zIndex:style.zIndex, parentIndex:nodes.indexOf(node.parentElement), pseudo});
    if (interactive && style.borderRadius && style.borderRadius !== '0px') shapeCandidates.push({index:i,
      tag:node.tagName.toLowerCase(), role:node.getAttribute?.('role') || null,
      declaredShape:node.getAttribute?.('data-shape') || null,
      width:+(rect.right-rect.left).toFixed(2),height:+(rect.bottom-rect.top).toFixed(2),
      aspectRatio:+((rect.right-rect.left) / Math.max(1, rect.bottom-rect.top)).toFixed(4),borderRadius:style.borderRadius,
      transform:style.transform || 'none'});
    for (const field of fields) {
      const value = style[field];
      if (!value || value === 'normal' || value === 'none' || value === '0px' || value === 'rgba(0, 0, 0, 0)') continue;
      const bucket = counts[field];
      bucket.set(value, (bucket.get(value) || 0) + 1);
      const weight = ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'].includes(field)
        ? Math.max(textChars, interactive ? 1 : 0)
        : ['backgroundColor', 'borderRadius'].includes(field) ? areaRatio : 1;
      if (weight) weighted[field].set(value, (weighted[field].get(value) || 0) + weight);
    }
    if (!translucent(style.backgroundColor) || (style.backgroundImage && style.backgroundImage !== 'none') ||
        (style.boxShadow && style.boxShadow !== 'none') || (style.backdropFilter && style.backdropFilter !== 'none') || hasEffect) {
      layerCandidates.push({index: i, parentIndex: nodes.indexOf(node.parentElement), tag: node.tagName.toLowerCase(),
        box: {x: Math.max(0, rect.left), y: Math.max(0, rect.top), width, height}, areaRatio: +areaRatio.toFixed(4),
        backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow, backdropFilter: style.backdropFilter, filter:style.filter,
        borderColor:style.borderColor, borderWidth:style.borderWidth, opacity:style.opacity,
        position: style.position, zIndex: style.zIndex});
    }
  }
  const top = buckets => Object.fromEntries(fields.map(field => [field, [...buckets[field]].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([value, count]) => ({value, count: +count.toFixed(3)}))]));
  return {schemaVersion: '1.2', viewport: {width: innerWidth, height: innerHeight}, state,
    scannedNodes: nodes.length, truncatedNodes: Math.max(0, allNodes.length - nodes.length), sampledNodes,
    focus: typeof document === 'undefined' ? null : (document.activeElement?.id || document.activeElement?.dataset?.measureId || null),
    scroll: {x: typeof window === 'undefined' ? null : window.scrollX, y: typeof window === 'undefined' ? null : window.scrollY},
    observed: top(counts), weighted: top(weighted),
    layerCandidateCount: layerCandidates.length,
    layerCandidates: layerCandidates.sort((a, b) => b.areaRatio - a.areaRatio).slice(0, 150),
    materialCandidateCount:materialCandidates.length,
    materialCandidates:materialCandidates.slice(0, 150),
    shapeCandidateCount:shapeCandidates.length,
    shapeCandidates:shapeCandidates.slice(0, 150),
    landmarks,
    note: '가시 화면의 계산 스타일과 DOM 소속 단서다. alpha·blur·filter·의사요소는 소재 후보이며 실제 투과·굴절이나 의미 역할의 증거가 아니다. 출현 빈도·가중치·parentIndex도 실제 겹침이나 승인 토큰을 확정하지 않는다.'};
}
