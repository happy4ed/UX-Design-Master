import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {motionRecipes,motionGroups} from '../assets/layout/oneui9-motion-recipes.mjs';

const taxonomy=JSON.parse(readFileSync(new URL('../knowledge/motion-taxonomy.json',import.meta.url),'utf8'));
const policy=JSON.parse(readFileSync(new URL('../knowledge/motion-family-policy.json',import.meta.url),'utf8'));
const cues=JSON.parse(readFileSync(new URL('../knowledge/motion-construction-cues.json',import.meta.url),'utf8'));
const ontology=JSON.parse(readFileSync(new URL('../knowledge/motion-ontology.json',import.meta.url),'utf8'));
const equivalence=JSON.parse(readFileSync(new URL('../knowledge/motion-equivalence.json',import.meta.url),'utf8'));
const sourceBehavior=JSON.parse(readFileSync(new URL('../knowledge/motion-source-behavior.json',import.meta.url),'utf8'));
const terms=taxonomy.categories.flatMap(group=>group.entries.map(entry=>entry.name));
const known=new Set(terms);
assert.equal(taxonomy.categories.length,19);
assert.equal(ontology.groups.length,14);
assert.equal(ontology.total,414);
assert.equal(sourceBehavior.total,414);
assert.deepEqual(sourceBehavior.entries.map(x=>x.id).sort(),taxonomy.categories.flatMap(x=>x.entries.map(e=>e.id)).sort());
assert.ok(sourceBehavior.entries.every(x=>x.behavior&&x.productionPrompt&&x.demoPresent));
assert.deepEqual(ontology.groups.flatMap(x=>x.sourceFamilies).sort(),taxonomy.categories.map(x=>x.id).sort());
const ontologyCount=id=>ontology.groups.find(x=>x.id===id).sourceFamilies.reduce((sum,family)=>sum+taxonomy.categories.find(x=>x.id===family).count,0);
assert.equal(ontologyCount('typography'),98);
assert.equal(ontologyCount('transition-reveal'),75);
const ids=new Set(taxonomy.categories.flatMap(c=>c.entries.map(e=>e.id)));
for(const relation of equivalence.relations){
  assert.ok(ids.has(relation.a)&&ids.has(relation.b),`unknown motion relation: ${relation.a}, ${relation.b}`);
  assert.ok(['same-core-context-variant','different-motion','review-candidate','principle-applied-to-context','composite-uses-core'].includes(relation.kind));
  if(relation.status==='PASS'&&relation.kind==='same-core-context-variant') assert.ok(ids.has(relation.canonicalMotionId));
}
assert.equal(terms.length,414);
assert.equal(taxonomy.total,414);
assert.equal(cues.total,414);
assert.equal(new Set(cues.entries.map(x=>x.id)).size,414);
assert.equal(motionRecipes.length,43);
assert.equal(motionGroups.length,9);
assert.equal(new Set(motionRecipes.map(x=>x.id)).size,43);
for(const recipe of motionRecipes){
  assert.ok(known.has(recipe.term),`${recipe.id}: unknown source term ${recipe.term}`);
  assert.ok(recipe.event&&recipe.purpose&&recipe.reduced&&recipe.duration>0,`${recipe.id}: incomplete decision contract`);
  assert.equal(recipe.status,'implemented-preview');
}
for(const group of taxonomy.categories){
  assert.equal(group.count,group.entries.length,group.name);
  assert.ok(policy.families[group.id],`missing family policy: ${group.id}`);
  for(const entry of group.entries){
    assert.equal(entry.familyId,group.id);
    assert.ok(entry.intentTags.length&&entry.motionAxes.length&&entry.webContexts.length,`${entry.id}: incomplete web knowledge`);
    assert.ok(entry.webRoutes.length&&entry.staticFallback&&entry.reducedMotion,`${entry.id}: missing delivery/fallback`);
    assert.ok(entry.relatedTerms.every(name=>typeof name==='string'&&name.trim()),`${entry.id}: invalid related term`);
    assert.equal(entry.implementation,entry.recipeIds.length?'implemented-preview':'knowledge-only');
    assert.equal(entry.browserPreview,'principle-sketch',`${entry.id}: missing browser preview status`);
    assert.ok(cues.entries.some(x=>x.id===entry.id),`${entry.id}: missing construction cues`);
    const cue=cues.entries.find(x=>x.id===entry.id);
    assert.ok(Array.isArray(cue.phaseOrder)&&Array.isArray(cue.visualObjects),`${entry.id}: missing prompt mechanics`);
  }
}
const linked=taxonomy.categories.flatMap(group=>group.entries.flatMap(entry=>entry.recipeIds));
assert.equal(linked.length,43);
assert.equal(new Set(linked).size,43);
console.log('motion vocabulary: PASS (414 structured records and construction cues / 43 app recipes)');
