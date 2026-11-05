import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultState,newWork,newOpening,calculateEstimate,roomArea,roomSegments,preparationRates} from './engine-v2.mjs';
import {OPTION_CATEGORIES} from './options-catalog-v2.mjs';

const fixture = (shape='rectangle') => {
 const state=createDefaultState(),work=newWork('room','Salon');
 work.shape=shape;state.works.push(work);
 return {state,work};
};
test('formes Rectangle L T U ont 4, 6, 8 et 8 murs indépendants',()=>{
 for(const [shape,n] of [['rectangle',4],['L',6],['T',8],['U',8]]) {
  const {state,work}=fixture(shape),r=calculateEstimate(state);
  assert.equal(roomSegments(work).length,n);
  assert.equal(r.geometry.filter(g=>g.kind==='wall').length,n);
 }
});
test('surface et plafond L/T/U calculés au polygone comme Plaquiste',()=>{
 for(const [shape,area] of [['rectangle',20],['L',18],['T',11],['U',18]]) {
  const {state,work}=fixture(shape);
  assert.equal(roomArea(work),area);
  assert.equal(calculateEstimate(state).geometry.find(g=>g.kind==='ceiling').net,area);
 }
});
test('murs supplémentaires E à H configurables individuellement',()=>{
 const {state,work}=fixture('U');work.walls.H.active=false;
 work.walls.F.paint.type='glycero';
 const r=calculateEstimate(state);
 assert.equal(r.geometry.some(g=>g.surface==='Mur H'),false);
 assert.equal(r.geometry.some(g=>g.surface==='Mur F'),true);
 assert.ok(r.lines.some(l=>l.name.includes('glycero')));
});
test('plafond décoché n’est ni en géométrie ni dans les produits',()=>{
 const {state,work}=fixture('T');work.ceiling.active=false;
 const r=calculateEstimate(state);assert.equal(r.geometry.some(g=>g.kind==='ceiling'),false);
});
test('déduction de menuiserie sur segment de forme L',()=>{
 const {state,work}=fixture('L');
 work.walls.E.openings.push(newOpening());
 const r=calculateEstimate(state);
 assert.ok(r.geometry.find(g=>g.surface==='Mur E').deduction>0);
 assert.equal(r.geometry.find(g=>g.surface==='Mur D').deduction,0);
});
test('les trois préparations ont des consommables 1 / 3 / 5 et des temps différents',()=>{
 const costs=[],times=[];
 for(const level of ['light','repair','skim']) {
  const {state,work}=fixture();work.walls.A.preparation.level=level;
  const r=calculateEstimate(state);
  costs.push(r.lines.find(l=>l.kind==='material'&&l.name.includes('consommables')).unitPrice);
  times.push(r.lines.find(l=>l.kind==='labor'&&l.name.includes(' — '+({light:'Ponçage léger',repair:'Ponçage + rattrapage',skim:'Ratissage complet'}[level]))).quantity);
  assert.equal(r.complete,true);
 }
 assert.deepEqual(costs,[1,3,5]);
 assert.ok(times[0]<times[1]&&times[1]<times[2]);
});
test('temps et fournitures de préparation modifiables indépendamment',()=>{
 const {state,work}=fixture();
 work.walls.A.preparation={level:'repair',hoursM2:0.6,consumablePriceM2:8};
 const r=calculateEstimate(state);
 assert.equal(r.lines.find(l=>l.name.includes('consommables Ponçage + rattrapage')).unitPrice,8);
 assert.equal(r.lines.find(l=>l.name.includes(' — Ponçage + rattrapage')).quantity,7.5);
});
test('sur menuiserie, ratissage complet devient réparation profonde',()=>{
 const {state,work}=fixture();
 const o=newOpening();o.mode='supplement';o.preparation.level='skim';
 work.walls.A.openings.push(o);
 const r=calculateEstimate(state);
 assert.ok(r.lines.some(l=>l.name.includes('Réparation profonde (sans refabrication)')));
 assert.equal(r.complete,true);
});
test('les plinthes automatiques ignorent les murs papier peint',()=>{
 const {state,work}=fixture();work.plinth.enabled=true;
 work.walls.A.mode='wallpaper';work.walls.B.active=false;work.walls.C.active=false;work.walls.D.active=false;
 const r=calculateEstimate(state);
 assert.equal(r.geometry.some(g=>g.kind==='plinth'),false);
});
test('le bois des plinthes est exclu par défaut et facultatif',()=>{
 const {state,work}=fixture();
 work.plinth.enabled=true;work.plinth.pricePerMl=2;
 let r=calculateEstimate(state);
 assert.equal(r.lines.some(l=>l.name.includes('fourniture plinthes bois')),false);
 work.plinth.includeWood=true;work.plinth.woodPriceMl=9;
 r=calculateEstimate(state);
 assert.equal(r.lines.some(l=>l.name.includes('fourniture plinthes bois')),true);
});
test('TVA 20 % par défaut et sur locaux professionnels',()=>{
 const {state}=fixture();state.vatRate=10;
 assert.equal(calculateEstimate(state).vatRate,20);
 state.taxContext='professional_local';
 assert.equal(calculateEstimate(state).vatRate,20);
});
test('TVA rénovation 10 % uniquement après confirmation',()=>{
 const {state}=fixture();state.taxContext='eligible_renovation';
 assert.equal(calculateEstimate(state).vatRate,20);
 state.taxEligibilityConfirmed=true;
 assert.equal(calculateEstimate(state).vatRate,10);
});
test('les 64 options réparties en six familles sont accessibles',()=>{
 assert.equal(OPTION_CATEGORIES.length,6);
 assert.equal(OPTION_CATEGORIES.flatMap(g=>g.items).length,64);
});
test('option sélectionnée : matériau et MO séparés sans double compte',()=>{
 const {state}=fixture();
 state.extras=[{name:'Protection mobilier',quantity:2,unit:'forfait',materialUnitHT:6,hoursPerUnit:0.5}];
 const r=calculateEstimate(state);
 assert.equal(r.lines.find(l=>l.name==='Protection mobilier — fournitures').amount,12);
 assert.equal(r.lines.find(l=>l.name==='Protection mobilier — main-d’œuvre').amount,42);
 assert.equal(r.complete,true);
});
test('option sans coût ou temps ne crée pas de faux montant',()=>{
 const {state}=fixture();
 state.extras=[{name:'Stuc',quantity:1,unit:'m²',materialUnitHT:'',hoursPerUnit:''}];
 const r=calculateEstimate(state);
 assert.equal(r.complete,false);assert.equal(r.totalHT,null);
});
test('plafond L/T/U papier peint : calepinage particulier non certifié',()=>{
 const {state,work}=fixture('L');work.ceiling.mode='wallpaper';
 const r=calculateEstimate(state);
 assert.equal(r.complete,false);
 assert.ok(r.warnings.some(w=>w.includes('calepinage complexe non validé')));
});
test('nombre d’ouvriers modifie la durée mais pas le coût',()=>{
 const {state}=fixture();
 const a=calculateEstimate(state);
 state.labor.workers=2;const b=calculateEstimate(state);
 assert.equal(b.hoursMan,a.hoursMan);assert.equal(b.laborHT,a.laborHT);
 assert.equal(b.durationHours,a.durationHours/2);
});
