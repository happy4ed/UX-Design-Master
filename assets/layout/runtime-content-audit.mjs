// Run after each reachable UI state; annotations identify the information and action contracts.
export function auditRuntimeContent(root = document) {
  const findings = [];
  const visible = element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const ref = element => element.getAttribute('data-information-id') || element.getAttribute('data-feature-id') || element.id || element.tagName.toLowerCase();
  const box = element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  };
  const clipped = element => {
    const style = getComputedStyle(element);
    const horizontal = element.scrollWidth > element.clientWidth + 1 && /hidden|clip/.test(style.overflowX);
    const vertical = element.scrollHeight > element.clientHeight + 1 && /hidden|clip/.test(style.overflowY);
    return { horizontal, vertical, ellipsis: style.textOverflow === 'ellipsis' && horizontal };
  };
  for (const element of root.querySelectorAll('[data-content-critical], [data-content-supporting]')) {
    if (!visible(element)) continue;
    const overflow = clipped(element);
    if (!overflow.horizontal && !overflow.vertical) continue;
    const critical = element.hasAttribute('data-content-critical');
    const fullPath = element.getAttribute('data-full-content-target');
    if (critical || !fullPath) {
      findings.push({ code: critical ? 'CRITICAL_CONTENT_CLIPPED' : 'SUPPORTING_CONTENT_NO_FULL_PATH', at: ref(element), box: box(element), ...overflow });
    }
  }
  const actionSelector = 'button, a[href], input[type="button"], input[type="submit"], [role="button"], [role="menuitem"]';
  for (const group of root.querySelectorAll('[data-action-group]')) {
    if (!visible(group)) continue;
    const actions = [...group.querySelectorAll(actionSelector)].filter(visible);
    const rows = [];
    for (const element of actions) {
      const rect = element.getBoundingClientRect();
      const row = rows.find(item => Math.abs(item.y - rect.y) < 2);
      if (row) row.actions.push(element);
      else rows.push({ y: rect.y, actions: [element] });
      const overflow = clipped(element);
      if (overflow.horizontal || overflow.vertical) findings.push({ code: 'ACTION_LABEL_CLIPPED', at: ref(element), box: box(element), ...overflow });
    }
    for (const row of rows) {
      const ordered = row.actions.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);
      let minGap = null;
      for (let i = 1; i < ordered.length; i++) {
        const prev = ordered[i - 1].getBoundingClientRect();
        const curr = ordered[i].getBoundingClientRect();
        const gap = curr.left - prev.right;
        minGap = minGap === null ? gap : Math.min(minGap, gap);
        if (gap < 0) findings.push({ code: 'ACTION_HIT_OVERLAP', at: ref(group), pair: [ref(ordered[i - 1]), ref(ordered[i])], gapPx: gap });
      }
      findings.push({ code: 'ACTION_ROW_REVIEW', at: ref(group), actionIds: ordered.map(ref), count: ordered.length,
        minGapPx: minGap, groupBox: box(group), actionBoxes: ordered.map(box) });
    }
  }
  return findings;
}
