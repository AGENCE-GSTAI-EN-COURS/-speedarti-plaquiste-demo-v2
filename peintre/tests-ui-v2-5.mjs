import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CLASSIFIED_OPTION_CATEGORIES,filterCategory,coverage,categoryForBareme,normalizeSearch} from './classified-options-v2-5.mjs';
import {GUILLAUME_BAREME} from './guillaume-bareme-v2-4.mjs';

test('six familles Guillaume uniquement, toutes les options et 92 PDF réparties',()=>{
 const c=coverage();
 assert.deepEqual([c.categories,c.originalItems,c.pdfCovered,c.pdfTotal],[6,64,92,92]);
 assert.deepEqual(c.uncovered,[]);
 assert.deepEqual(CLASSIFIED_OPTION_CATEGORIES.map(x=>x.name),[
   'Traitements spécifiques','Finitions décoratives','Boiseries intérieures',
   'Revêtements et décoration complémentaires','Prestations techniques et spécialisées',
   'Services complémentaires facturables'
 ]);
 assert.ok(CLASSIFIED_OPTION_CATEGORIES.every(g=>g.items.length>0));
 assert.ok(GUILLAUME_BAREME.every(x=>categoryForBareme(x)>=0 && categoryForBareme(x)<=5));
});
test('filtres par catégorie : accents, variantes et aucun résultat',()=>{
 const deco=CLASSIFIED_OPTION_CATEGORIES[1];
 assert.ok(filterCategory(deco,'stuc').length>0);
 assert.equal(filterCategory(deco,'tadelakt').length,1);
 assert.ok(filterCategory(deco,'METALLISE').some(x=>x.label.toLowerCase().includes('métallisé')));
 assert.equal(filterCategory(deco,'introuvable-zz99').length,0);
 assert.equal(filterCategory(CLASSIFIED_OPTION_CATEGORIES[2],'rénovation portes').length,1);
 assert.equal(normalizeSearch('  ÉPÔXY   /  SOL  '),'epoxy sol');
});
test('variantes d’unités physiques regroupées dans la même famille',()=>{
 const wood=CLASSIFIED_OPTION_CATEGORIES[2];
 const door=wood.items.find(x=>x.id==='op2-0');
 assert.deepEqual(new Set(door.variants.map(v=>v.unit)),new Set(['m²','unité']));
 const plinth=wood.items.find(x=>x.id==='op2-4');
 assert.deepEqual(new Set(plinth.variants.map(v=>v.unit)),new Set(['m²','ml']));
 const refs=CLASSIFIED_OPTION_CATEGORIES.flatMap(g=>g.items.flatMap(i=>i.variants.map(v=>v.id)));
 assert.equal(new Set(refs).size,92);
});
test('panier sticky desktop et mobile accessible',async()=>{
 const css=await readFile(new URL('./styles-v2-2.css',import.meta.url),'utf8');
 assert.ok(css.includes('.options-cart{'));
 assert.ok(css.includes('position:sticky;top:105px'));
 assert.ok(css.includes('position:fixed;top:auto;bottom:0;'));
 assert.ok(css.includes('.options-cart:not(.expanded) .cart-content{display:none}'));
});
test('parcours étape 3 : recherches, panier, fiscalité et doublons',async()=>{
 const nodes=Object.fromEntries(['steps','content','previous','next','stepcount'].map(id=>[id,{innerHTML:'',textContent:'',disabled:false,addEventListener(name,fn){this[name]=fn;}}]));
 const events={},oldDoc=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={getElementById:id=>nodes[id],addEventListener:(name,fn)=>events[name]=fn};
 globalThis.window={scrollTo(){}};
 try{
  await import('./app-v2-2.mjs?uiV25NodeTest');
  const click=(action,args={})=>events.click({target:{closest:()=>({dataset:{action,...args}})}});
  const change=(path,value,type='select')=>{
   const target={dataset:{path},value,checked:type==='checkbox'?!!value:false,type,tagName:type==='select'?'SELECT':'INPUT'};
   if(type==='number'||type==='text')events.input({target});
   events.change({target});
  };
  click('add-work',{type:'room'});
  click('go',{index:'2'});
  let html=nodes.content.innerHTML;
  assert.ok(html.includes('Paramètres du chantier — avant les options'));
  assert.ok(html.includes('Type de chantier')&&html.includes('Nombre d’ouvriers')&&html.includes('Taux horaire entreprise'));
  assert.ok(html.includes('id="peintre-options-cart"'));
  assert.ok(CLASSIFIED_OPTION_CATEGORIES.every(g=>html.includes(g.name)));
  assert.equal(html.includes('Barème Guillaume — 92 références'),false);
  click('toggle-category',{category:'decorations'});
  html=nodes.content.innerHTML;
  assert.ok(html.includes('data-category-search="decorations"'));
  // La recherche est interactive et persistante quand on ajoute une prestation.
  const rows=[{dataset:{optionId:'op1-2'},hidden:false},{dataset:{optionId:'op1-0'},hidden:false}];
  const empty={hidden:false},count={textContent:''};
  const list={querySelectorAll:()=>rows,querySelector:()=>empty};
  const panel={querySelector:selector=>selector==='[data-search-list]'?list:count};
  events.input({target:{dataset:{categorySearch:'decorations'},value:'tadelakt',closest:()=>panel}});
  assert.equal(rows[0].hidden,false);assert.equal(rows[1].hidden,true);
  assert.ok(count.textContent.includes('1 /'));
  click('add-extra',{option:'op1-2'});
  html=nodes.content.innerHTML;
  assert.ok(html.includes('value="tadelakt"'));
  assert.ok(html.includes('Tadelakt')&&html.includes('data-path="extras.0.quantity"'));
  assert.ok(html.includes('data-path="extras.0.materialUnitHT"'));
  assert.ok(html.includes('Sous-total connu HT') || html.includes('Sous-total options HT'));
  click('add-extra',{option:'guillaume-p1-15'});
  assert.equal((nodes.content.innerHTML.match(/data-path="extras\.\d+\.quantity"/g)||[]).length,1);
  click('add-extra',{option:'guillaume-p2-02'});
  click('add-extra',{option:'guillaume-p1-30'});
  assert.equal((nodes.content.innerHTML.match(/data-path="extras\.\d+\.quantity"/g)||[]).length,2);
  change('extras.0.quantity','2','number');
  assert.ok(nodes.content.innerHTML.includes('value="2"'));
  click('remove-extra',{index:'1'});
  assert.equal((nodes.content.innerHTML.match(/data-path="extras\.\d+\.quantity"/g)||[]).length,1);
  change('taxContext','eligible_renovation');
  assert.ok(nodes.content.innerHTML.includes('taxEligibilityConfirmed'));
  change('taxEligibilityConfirmed',true,'checkbox');
  click('go',{index:'3'});
  assert.ok(nodes.content.innerHTML.includes('Contexte fiscal du chantier'));
  assert.ok(nodes.content.innerHTML.includes('TVA 10'));
 } finally{
  globalThis.document=oldDoc;globalThis.window=oldWindow;
 }
});
