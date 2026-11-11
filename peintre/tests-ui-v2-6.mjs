import test from 'node:test';
import assert from 'node:assert/strict';

async function withUI(suffix,run){
 const nodes=Object.fromEntries(['steps','content','previous','next','stepcount'].map(id=>
  [id,{innerHTML:'',textContent:'',disabled:false,addEventListener(name,fn){this[name]=fn;}}]));
 const events={},oldDoc=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={getElementById:id=>nodes[id],addEventListener:(name,fn)=>events[name]=fn};
 globalThis.window={scrollTo(){}};
 try{
  await import('./app-v2-2.mjs?ui-v26-'+suffix);
  const click=(action,args={})=>events.click({target:{closest:()=>({dataset:{action,...args}})}});
  const change=(path,value,type='select')=>{
   const t={dataset:{path},value,checked:type==='checkbox'?!!value:false,type,tagName:type==='select'?'SELECT':'INPUT'};
   if(type==='number'||type==='text')events.input({target:t});
   events.change({target:t});
  };
  const selector=(attr,value)=>events.change({target:{dataset:{[attr]:value===undefined?'':value},value}});
  await run({nodes,events,click,change,selector});
 }finally{globalThis.document=oldDoc;globalThis.window=oldWindow;}
}
test('Mur simple : surface calculée puis liée au ratissage et mise à jour',async()=>{
 await withUI('wall',async({nodes,click,change,events})=>{
  click('add-work',{type:'wall'});
  assert.ok(nodes.content.innerHTML.includes('Surfaces calculées'));
  change('works.0.surface.length','5','number');
  change('works.0.surface.height','2.5','number');
  assert.ok(nodes.content.innerHTML.includes('12,5 m²'));
  click('pick-work',{wi:'0'});
  assert.ok(nodes.content.innerHTML.includes('Surface nette'));
  click('add-opening',{root:'works.0.surface'});
  change('works.0.surface.openings.0.width','1','number');
  change('works.0.surface.openings.0.height','2','number');
  assert.ok(nodes.content.innerHTML.includes('10,5 m²'));
  click('go',{index:'2'});
  assert.ok(nodes.content.innerHTML.includes('Support ciblé pour les prestations au m²'));
  click('add-extra',{option:'guillaume-p1-02'});
  let html=nodes.content.innerHTML;
  assert.ok(html.includes('Surface du support préremplie automatiquement'));
  assert.ok(html.includes('10,5 m²'));
  assert.equal(html.includes('data-path="extras.0.quantity"'),true); // V2.7 : quantité éditable même quand liée
  click('go',{index:'0'});
  change('works.0.surface.length','6','number');
  click('go',{index:'2'});
  html=nodes.content.innerHTML;
  assert.ok(html.includes('13 m²'));
  const key=html.match(/<option value="([^"]+::[^"]+)" selected/);
  assert.ok(key,'Le support courant est sélectionné dans le panier');
  events.change({target:{dataset:{extraScope:'0'},value:'manual'}});
  html=nodes.content.innerHTML;
  assert.ok(html.includes('data-path="extras.0.quantity"'));
  change('extras.0.quantity','2','number');
  click('go',{index:'0'});change('works.0.surface.length','7','number');click('go',{index:'2'});
  assert.ok(nodes.content.innerHTML.includes('data-path="extras.0.quantity"'));
  events.change({target:{dataset:{extraScope:'0'},value:key[1]}});
  assert.ok(nodes.content.innerHTML.includes('Surface du support préremplie automatiquement'));
  assert.ok(nodes.content.innerHTML.includes('15,5 m²'));
 });
});
test('Pièce en L : support B choisi, même option autorisée sur C mais pas deux fois sur B',async()=>{
 await withUI('room',async({nodes,click,change,events})=>{
  click('add-work',{type:'room'});
  change('works.0.shape','L');
  assert.ok(nodes.content.innerHTML.includes('Surfaces calculées'));
  assert.ok(nodes.content.innerHTML.includes('Mur F'));
  click('pick-work',{wi:'0'});
  click('pick-support',{wi:'0',key:'B'});
  click('go',{index:'2'});
  click('add-extra',{option:'guillaume-p1-02'});
  let html=nodes.content.innerHTML;
  assert.ok(html.includes('Surface du support préremplie automatiquement'));
  click('add-extra',{option:'guillaume-p1-02'});
  assert.equal((nodes.content.innerHTML.match(/data-extra-scope="\d+"/g)||[]).length,1);
  click('go',{index:'1'});
  click('pick-support',{wi:'0',key:'C'});
  click('go',{index:'2'});
  click('add-extra',{option:'guillaume-p1-02'});
  assert.equal((nodes.content.innerHTML.match(/data-extra-scope="\d+"/g)||[]).length,2);
  // Rediriger un panier existant sur un support déjà utilisé déclenche une erreur explicite.
  const targets=[...nodes.content.innerHTML.matchAll(/<option value="([^"]+::[^"]+)" selected/g)].map(x=>x[1]);
  const cKey=targets[0];assert.ok(cKey);
  events.change({target:{dataset:{extraScope:'0'},value:cKey}});
  assert.ok(nodes.content.innerHTML.includes('Cette prestation existe déjà sur ce support'));
 });
});
