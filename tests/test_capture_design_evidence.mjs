import assert from 'node:assert/strict';
import {captureDesignEvidence} from '../assets/layout/capture-design-evidence.mjs';

globalThis.innerWidth = 400;
globalThis.innerHeight = 800;
const make = (tagName, box, color, text = '', parentElement = null) => ({
  tagName, parentElement, childNodes: text ? [{nodeType: 3, textContent: text}] : [],
  matches: () => tagName === 'BUTTON',
  getBoundingClientRect: () => ({left: box[0], top: box[1], right: box[2], bottom: box[3]}),
  style: {display: 'block', visibility: 'visible', opacity: '1', backgroundColor: color,
    backgroundImage: 'none', boxShadow: 'none', backdropFilter: 'none', position: 'static', zIndex: 'auto',
    color: 'rgb(0, 0, 0)', fontFamily: 'Arial', fontSize: '16px', fontWeight: '400',
    lineHeight: '24px', letterSpacing: 'normal', borderRadius: '0px', gap: '0px',
    paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px'}
});
const root = make('BODY', [0, 0, 400, 800], 'rgb(250, 250, 250)');
const card = make('SECTION', [0, 0, 300, 300], 'rgb(255, 255, 255)', '', root);
const small = make('BUTTON', [0, 0, 40, 20], 'rgb(0, 0, 255)', '확인', card);
const offscreen = make('DIV', [0, 900, 400, 1100], 'rgb(255, 0, 0)', '', root);
root.querySelectorAll = () => [card, small, offscreen];
globalThis.getComputedStyle = node => node.style;
const result = captureDesignEvidence(root, 10, {screen: 'sample', overlay: 'closed'});
assert.equal(result.sampledNodes, 3);
assert.equal(result.layerCandidateCount, 3);
assert.equal(result.weighted.backgroundColor[0].value, 'rgb(250, 250, 250)');
assert.equal(result.weighted.color[0].count, 2);
assert.equal(result.state.screen, 'sample');
assert.equal(result.focus, null);
assert.equal(result.scroll.y, null);
assert.equal(captureDesignEvidence(root, 2).truncatedNodes, 2);
console.log('visible weighting, layer candidates, state, and truncation: PASS');
