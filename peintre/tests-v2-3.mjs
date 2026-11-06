import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultState,newWork,newOpening,calculateEstimate,preparationRates} from './engine-v2.mjs';
const fixture=()=>{const state=createDefaultState(),room=newWork('room','Salon');state.works.push(room);return {state,room};};
test('plinthes automatiques : peinture calculée même sans consommables ajoutés',()=>{
 const {state,room}=fixture();room.plinth.enabled=true;
 const r=calculateEstimate(state);
 assert.equal(r.complete,true);assert.ok(r.hoursMan>19.5);
 assert.ok(r.lines.some(l=>l.unit==='pot'&&l.litresBesoin>14.3));
 assert.equal(r.lines.some(l=>l.name.includes('fourniture plinthes bois')),false);
});
test('plinthes : hauteur peinte paramétrable et mutualisation de peinture',()=>{
 const {state,room}=fixture();room.plinth.enabled=true;
 const a=calculateEstimate(state).lines.find(l=>l.unit==='pot');
 room.plinth.paintedHeightM=0.2;
 const b=calculateEstimate(state).lines.find(l=>l.unit==='pot');
 assert.ok(b.litresBesoin>a.litresBesoin);assert.equal(calculateEstimate(state).lines.filter(l=>l.unit==='pot').length,1);
});
test('plinthes : bois facturé seulement sur sélection',()=>{
 const {state,room}=fixture();room.plinth.enabled=true;
 assert.equal(calculateEstimate(state).complete,true);
 room.plinth.includeWood=true;
 assert.equal(calculateEstimate(state).complete,false);
 room.plinth.woodPriceMl=7;
 assert.equal(calculateEstimate(state).complete,true);
});
test('plinthes : consommables supplémentaires facultatifs non bloquants',()=>{
 const {state,room}=fixture();room.plinth.enabled=true;
 assert.equal(calculateEstimate(state).lines.some(l=>l.name.includes('consommables supplémentaires')),false);
 room.plinth.pricePerMl=1.75;
 assert.equal(calculateEstimate(state).complete,true);
 assert.equal(calculateEstimate(state).lines.find(l=>l.name.includes('consommables supplémentaires')).amount,31.5);
});
test('plinthes manuelles peintes : pas de montant fictif',()=>{
 const {state}=fixture();state.manualPlinth.length=6;
 const r=calculateEstimate(state);
 assert.equal(r.complete,true);
 assert.ok(r.lines.find(l=>l.unit==='pot').litresBesoin>14.3);
});
test('option sans temps : heures connues et postes manquants séparés',()=>{
 const {state}=fixture();
 state.extras.push({name:'Tadelakt',unit:'m²',quantity:4,materialUnitHT:'',hoursPerUnit:''});
 const r=calculateEstimate(state);
 assert.equal(r.hoursMan,null);assert.equal(r.knownHoursMan,19.5);
 assert.equal(r.durationHours,null);assert.equal(r.knownDurationHours,19.5);
 assert.equal(r.unestimatedTasks.length,1);assert.equal(r.complete,false);
});
test('effectif modifie les heures connues en durée partielle, pas les heures-homme',()=>{
 const {state}=fixture();state.extras.push({name:'Stuc',unit:'forfait',quantity:1,materialUnitHT:'',hoursPerUnit:''});
 const a=calculateEstimate(state);state.labor.workers=2;const b=calculateEstimate(state);
 assert.equal(a.knownHoursMan,b.knownHoursMan);
 assert.equal(a.knownDurationHours/2,b.knownDurationHours);
 assert.equal(b.hoursMan,null);
});
test('consommables courants exclus par défaut',()=>{
 const {state}=fixture();const r=calculateEstimate(state);
 assert.equal(state.supplies.length,3);
 assert.equal(r.lines.filter(l=>l.tag==='Consommables courants').length,0);
 assert.equal(r.complete,true);
});
test('consommables sélectionnés non tarifés bloquent uniquement le total',()=>{
 const {state}=fixture();state.supplies[0].enabled=true;state.supplies[0].quantity=2;
 state.supplies[0].unitPrice=''; // tarif volontairement vidé par l'artisan
 const r=calculateEstimate(state);
 assert.equal(r.complete,false);assert.equal(r.totalHT,null);assert.equal(r.hoursMan,19.5);
 assert.ok(r.warnings.some(w=>w.includes('Ruban de masquage')));
});
test('consommables chiffrés remontent dans les matériaux',()=>{
 const {state}=fixture();state.supplies[0].enabled=true;
 state.supplies[0].quantity=2;state.supplies[0].unitPrice=5;
 const r=calculateEstimate(state);assert.equal(r.complete,true);
 assert.equal(r.lines.find(l=>l.name.startsWith('Ruban de masquage')).amount,10);
});
test('peinture colorée au prix blanc historique : quantité oui, total non',()=>{
 const {state,room}=fixture();const paint=room.walls.A.paint;paint.color='color';paint.colorRef='RAL 7001';
 const r=calculateEstimate(state);assert.equal(r.complete,false);
 assert.ok(r.lines.some(l=>l.name.includes('RAL 7001')&&l.quantity>0&&l.unitPrice===null));
});
test('peinture colorée avec prix personnalisé récupère un total',()=>{
 const {state,room}=fixture();const p=room.walls.A.paint;
 p.color='color';p.colorRef='RAL 7001';p.potPrice=143;p.priceSource='artisan';
 const r=calculateEstimate(state);assert.equal(r.complete,true);
 assert.equal(r.lines.find(l=>l.name.includes('RAL 7001')).unitPrice,143);
});
test('boiserie : préparation profonde et temps propres au bois',()=>{
 const {state,room}=fixture();const o=newOpening();o.mode='supplement';o.preparation.level='skim';
 room.walls.A.openings.push(o);
 assert.equal(preparationRates(o.preparation).hoursM2,0.65);
 const r=calculateEstimate(state);
 assert.ok(r.lines.some(l=>l.name.includes('Réparation profonde (sans refabrication)')));
});
test('boiserie : préparation légère et rattrapage distinguent les temps du mur',()=>{
 const wall=newWork('room','Test').walls.A.preparation;
 const wood=newOpening().preparation;
 for(const level of ['light','repair','skim']){
  wall.level=level;wood.level=level;
  assert.ok(preparationRates(wood).hoursM2>preparationRates(wall).hoursM2);
 }
});
