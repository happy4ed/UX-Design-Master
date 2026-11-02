/** Collect computed style evidence from a rendered page without assigning design roles. */
export function captureDesignEvidence(root = document.body, limit = 1200) {
  const fields = ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'borderRadius', 'gap', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
  const counts = Object.fromEntries(fields.map(field => [field, new Map()]));
  const nodes = [root, ...root.querySelectorAll('*')].slice(0, limit);
  for (const node of nodes) {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || !node.getClientRects().length) continue;
    for (const field of fields) {
      const value = style[field];
      if (!value || value === 'normal' || value === 'none' || value === '0px' || value === 'rgba(0, 0, 0, 0)') continue;
      const bucket = counts[field];
      bucket.set(value, (bucket.get(value) || 0) + 1);
    }
  }
  const observed = Object.fromEntries(fields.map(field => [field, [...counts[field]].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([value, count]) => ({value, count}))]));
  return {schemaVersion: '1.0', viewport: {width: innerWidth, height: innerHeight}, sampledNodes: nodes.length, observed, note: '빈도는 디자인 역할이나 승인된 토큰을 의미하지 않음'};
}
