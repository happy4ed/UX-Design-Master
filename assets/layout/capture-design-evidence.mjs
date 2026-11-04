/** Collect rendered style evidence without assigning semantic roles or Z order. */
export function captureDesignEvidence(root = document.body, limit = 3000, state = {}) {
  const fields = ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'borderRadius', 'gap', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
  const counts = Object.fromEntries(fields.map(field => [field, new Map()]));
  const weighted = Object.fromEntries(fields.map(field => [field, new Map()]));
  const allNodes = [root, ...root.querySelectorAll('*')];
  const nodes = allNodes.slice(0, limit);
  const layerCandidates = [];
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
        (style.boxShadow && style.boxShadow !== 'none') || (style.backdropFilter && style.backdropFilter !== 'none')) {
      layerCandidates.push({index: i, parentIndex: nodes.indexOf(node.parentElement), tag: node.tagName.toLowerCase(),
        box: {x: Math.max(0, rect.left), y: Math.max(0, rect.top), width, height}, areaRatio: +areaRatio.toFixed(4),
        backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow, backdropFilter: style.backdropFilter, position: style.position, zIndex: style.zIndex});
    }
  }
  const top = buckets => Object.fromEntries(fields.map(field => [field, [...buckets[field]].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([value, count]) => ({value, count: +count.toFixed(3)}))]));
  return {schemaVersion: '1.1', viewport: {width: innerWidth, height: innerHeight}, state,
    scannedNodes: nodes.length, truncatedNodes: Math.max(0, allNodes.length - nodes.length), sampledNodes,
    focus: typeof document === 'undefined' ? null : (document.activeElement?.id || document.activeElement?.dataset?.measureId || null),
    scroll: {x: typeof window === 'undefined' ? null : window.scrollX, y: typeof window === 'undefined' ? null : window.scrollY},
    observed: top(counts), weighted: top(weighted),
    layerCandidateCount: layerCandidates.length,
    layerCandidates: layerCandidates.sort((a, b) => b.areaRatio - a.areaRatio).slice(0, 150),
    landmarks,
    note: '가시 화면의 계산 스타일과 DOM 소속 단서다. 출현 빈도·가중치·parentIndex는 의미 역할, 실제 겹침, 승인 토큰의 증거가 아니다.'};
}
