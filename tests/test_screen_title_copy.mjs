import assert from 'node:assert/strict';
import {auditVisibleCopy} from '../assets/content/copy-audit.mjs';

const title={innerText:'당신의 소중한 의료비 기록',getClientRects:()=>[{}]};
const root={body:{innerText:'테스트 화면'},querySelectorAll:selector=>selector==='[data-screen-title]'?[title]:[]};
assert(auditVisibleCopy(root).some(row=>row.id==='long-screen-title'));
title.innerText='의료비 내역';
assert(!auditVisibleCopy(root).some(row=>row.id==='long-screen-title'));
console.log('screen title copy audit: PASS');
