import test from 'node:test';
import assert from 'node:assert/strict';

test('parcours Peintre V2.4 — papier peint, barèmes PDF et TVA en résultats', async()=>{
 const ids=['steps','content','previous','next','stepcount'];
 const nodes=Object.fromEntries(ids.map(id=>[id,{innerHTML:'',textContent:'',disabled:false,listeners:{},addEventListener(n,fn){this.listeners[n]=fn;}}]));
 const events={};
 const oldDoc=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={getElementById:id=>nodes[id],addEventListener:(event,fn)=>events[event]=fn};
 globalThis.window={scrollTo(){}};
 try{
  await import('./app-v2-2.mjs?uiV24NodeTest');
  const click=(name,args={})=>events.click({target:{closest:()=>({dataset:{action:name,...args}})}});
  const change=(path,value,type='select')=>{
   const t={dataset:{path},type,value,checked:Boolean(value),tagName:type==='select'?'SELECT':'INPUT'};
   if(type==='number'||type==='text')events.input({target:t});
   events.change({target:t});
  };
  assert.ok(nodes.content.innerHTML.includes('Ajouter une pièce'));
  click('add-work',{type:'room'});click('pick-work',{wi:'0'});
  change('works.0.walls.A.mode','wallpaper');
  assert.ok(nodes.content.innerHTML.includes('Prix HT / rouleau (€)'));
  assert.ok(nodes.content.innerHTML.indexOf('Prix HT / rouleau (€)')<nodes.content.innerHTML.indexOf('Paramètres papier peint'));
  change('works.0.walls.A.wallpaper.kind','panoramique');
  assert.ok(nodes.content.innerHTML.includes('Prix HT / panneau (€)'));
  click('go',{index:'2'});
  assert.ok(nodes.content.innerHTML.includes('92 références'));
  assert.equal(nodes.content.innerHTML.includes('Contexte fiscal du chantier'),false);
  click('add-extra',{option:'op1-2'});
  assert.ok(nodes.content.innerHTML.includes('data-path="extras.0.materialUnitHT"'));
  assert.ok(nodes.content.innerHTML.includes('value="18"'));
  assert.ok(nodes.content.innerHTML.includes('value="1.35"'));
  click('add-extra',{option:'guillaume-p1-15'});
  assert.equal(nodes.content.innerHTML.includes('data-path="extras.1.quantity"'),false);
  click('go',{index:'3'});
  assert.ok(nodes.content.innerHTML.includes('Contexte fiscal du chantier'));
  assert.ok(nodes.content.innerHTML.includes('Nombre d’ouvriers'));
  change('taxContext','eligible_renovation');
  assert.ok(nodes.content.innerHTML.includes('taxEligibilityConfirmed'));
 } finally {
  globalThis.document=oldDoc;globalThis.window=oldWindow;
 }
});
