/** Inspect rendered Korean line boundaries; findings require visual review. */
const badStart = /^[,，、.。!?！？;:：%)\]）〉》」』]/u;
const badEnd = /[(（\[〈《「『]$/u;
const hangul = /[가-힣]/gu;

function visible(element) {
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
}

function inspectTextNode(node) {
  const parent = node.parentElement;
  if (!parent || !visible(parent)) return [];
  const text = node.textContent || '';
  if (!hangul.test(text)) return [];
  hangul.lastIndex = 0;
  const range = document.createRange();
  const lines = new Map();
  const cellsInOrder = [];
  for (let offset = 0; offset < Math.min(text.length, 500); offset++) {
    if (text[offset] === '\n' || text[offset] === '\r') {cellsInOrder.push({break: true});continue;}
    range.setStart(node, offset);
    range.setEnd(node, offset + 1);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) continue;
    const key = Math.round(rect.top * 2) / 2;
    if (!lines.has(key)) lines.set(key, []);
    const cell = {char: text[offset], x: rect.x, right: rect.right, top: key};
    lines.get(key).push(cell);
    cellsInOrder.push(cell);
  }
  const rows = [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([top, cells]) => ({top, text: cells.map(cell => cell.char).join('').trim(), left: Math.min(...cells.map(cell => cell.x)), right: Math.max(...cells.map(cell => cell.right))})).filter(row => row.text);
  const issues = [];
  const wordChar = /[\p{L}\p{N}]/u;
  for (let i = 1; i < cellsInOrder.length; i++) {
    const before = cellsInOrder[i - 1], after = cellsInOrder[i];
    if (!before.break && !after.break && before.top !== after.top && wordChar.test(before.char) && wordChar.test(after.char) && /[가-힣]/u.test(before.char + after.char)) {
      issues.push({type: 'split-korean-word', before: before.char, after: after.char, line: rows.findIndex(row => row.top === after.top) + 1});
    }
  }
  for (const [index, row] of rows.entries()) {
    if (badStart.test(row.text) && (index > 0 || !node.previousSibling)) issues.push({type: 'punctuation-at-line-start', line: index + 1, text: row.text});
    if (badEnd.test(row.text)) issues.push({type: 'opening-punctuation-at-line-end', line: index + 1, text: row.text});
  }
  if (rows.length > 1 && (rows.at(-1).text.match(hangul) || []).length <= 2 && (rows.at(-1).text.match(hangul) || []).length > 0) {
    issues.push({type: 'short-last-line', line: rows.length, text: rows.at(-1).text});
  }
  const style = getComputedStyle(parent);
  if (parent.clientWidth && parent.scrollWidth > parent.clientWidth + 2 && ['hidden', 'clip'].includes(style.overflowX)) {
    issues.push({type: 'clipped-horizontal-text', scrollWidth: parent.scrollWidth, width: parent.clientWidth});
  }
  return issues.map(issue => ({...issue, element: parent.tagName.toLowerCase(), selector: parent.id ? `#${parent.id}` : parent.className && typeof parent.className === 'string' ? `.${parent.className.trim().split(/\s+/).join('.')}` : parent.tagName.toLowerCase(), lines: rows.map(row => row.text)}));
}

export function auditKoreanWrap(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode(node) {
    if (!node.textContent?.trim() || !node.parentElement || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }});
  const findings = [];
  while (walker.nextNode()) findings.push(...inspectTextNode(walker.currentNode));
  if (document.documentElement.scrollWidth > innerWidth + 1) findings.push({type: 'page-overflow', pixels: document.documentElement.scrollWidth - innerWidth});
  for (const control of root.querySelectorAll('button,a[href],[role="button"],input[type="button"],input[type="submit"],summary')) {
    if (!visible(control)) continue;
    const label = (control.innerText || control.value || control.getAttribute('aria-label') || '').trim().slice(0, 50);
    if (!label) continue;
    const style = getComputedStyle(control);
    if (style.textOverflow !== 'ellipsis' && (control.scrollWidth > control.clientWidth + 1 || control.scrollHeight > control.clientHeight + 1)) {
      findings.push({type: 'control-clipped', label, element: control.tagName.toLowerCase()});
    }
    control.scrollIntoView({block: 'center', inline: 'center'});
    const rect = [...control.getClientRects()].find(rect => rect.width && rect.height && rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight);
    if (rect) {
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (!hit || !(hit === control || control.contains(hit))) findings.push({type: 'control-blocked', label, element: control.tagName.toLowerCase()});
    }
  }
  return {checkedAt: new Date().toISOString(), viewport: {width: innerWidth, height: innerHeight}, findings};
}
