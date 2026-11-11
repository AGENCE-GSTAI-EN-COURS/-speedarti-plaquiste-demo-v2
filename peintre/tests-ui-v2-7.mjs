import test from 'node:test';
import assert from 'node:assert/strict';
test('le panier Peintre autorise la quantité manuelle et le retour à la surface auto',async()=>{
 const nodes=Object.fromEntries(['steps','content','previous','next','stepcount']
   .map(id=>[id,{innerHTML:'',textContent:'',disabled:false,addEventListener(name,fn){this[name]=fn;}}]));
 const events={};const oldDoc=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={getElementById:id=>nodes[id],addEventListener:(event,fn)=>events[event]=fn};
 globalThis.window={scrollTo(){}};
 try{
  await import('./app-v2-2.mjs?uiV27Qty');
  const click=(action,args={})=>events.click({target:{closest:()=>({dataset:{action,...args}})}});
  const change=(path,value,type='number')=>{
   const target={dataset:{path},value,type,checked:false,tagName:'INPUT'};
   if(type==='number')events.input({target});
   events.change({target});
  };
  click('add-work',{type:'wall'});
  click('go',{index:'2'});
  click('add-extra',{option:'guillaume-p1-02'});
  let html=nodes.content.innerHTML;
  assert.ok(html.includes('data-path="extras.0.quantity"'),'La quantité est éditable dès la sélection');
  assert.ok(html.includes('Surface du support préremplie automatiquement'));
  assert.ok(html.includes('value="10"'),'Mur initial 4 × 2,5 = 10 m²');
  change('extras.0.quantity','7');
  html=nodes.content.innerHTML;
  assert.ok(html.includes('Quantité personnalisée pour ce support'));
  assert.ok(html.includes('value="7"'));
  assert.ok(html.includes('data-action="reset-extra-quantity"'));
  click('go',{index:'0'});
  change('works.0.surface.length','6');
  click('go',{index:'2'});
  html=nodes.content.innerHTML;
  assert.ok(html.includes('value="7"'),'Les 7 m² personnalisés sont conservés malgré la modification des cotes');
  click('reset-extra-quantity',{index:'0'});
  html=nodes.content.innerHTML;
  assert.ok(html.includes('Surface du support préremplie automatiquement'));
  assert.ok(html.includes('value="15"'),'Retour automatique à la surface actuelle de 15 m²');
  click('go',{index:'3'});
  assert.ok(nodes.content.innerHTML.includes('Résultats'));
 }finally{globalThis.document=oldDoc;globalThis.window=oldWindow;}
});
