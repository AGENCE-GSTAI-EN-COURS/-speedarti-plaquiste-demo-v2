import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultState,newWork,newOpening,measureSurface,measureAllSurfaces,optionQuantity,calculateEstimate,roomSegments} from './engine-v2.mjs';

const wall = () => {
 const state=createDefaultState(),work=newWork('wall','Mur séjour');
 work.surface.length=5;work.surface.height=2.5;
 state.works.push(work);return {state,work,surface:work.surface};
};
const addRatissage = (state,work,surface) => {
 const option={name:'Ratissage complet 2 passes',unit:'m²',catalogId:'guillaume-p1-02',
  serviceKey:'guillaume-p1-02',quantity:1,autoQuantity:true,targetWorkId:work.id,targetSurfaceId:surface.id,
  materialUnitHT:2.8,hoursPerUnit:0.42};
 state.extras.push(option);return option;
};
test('Mur simple 5 m × 2,5 m = 12,50 m² nets',()=>{
 const {work,surface}=wall();
 assert.equal(measureSurface(work,surface).gross,12.5);
 assert.equal(measureSurface(work,surface).net,12.5);
});
test('Mur simple : la saisie directe de nouvelles cotes recalcule les m²',()=>{
 const {work,surface}=wall();
 surface.length=6;assert.equal(measureSurface(work,surface).net,15);
});
test('Une menuiserie déduite enlève la surface de l’option liée',()=>{
 const {state,work,surface}=wall();const o=newOpening();
 o.width=1;o.height=2;o.mode='deduct';surface.openings.push(o);
 assert.equal(measureSurface(work,surface).net,10.5);
 const extra=addRatissage(state,work,surface),r=calculateEstimate(state);
 assert.equal(optionQuantity(state,extra).quantity,10.5);
 assert.equal(r.lines.find(l=>l.name.startsWith('Ratissage complet')&&l.kind==='material').quantity,10.5);
 assert.equal(r.lines.find(l=>l.name.startsWith('Ratissage complet')&&l.kind==='material').amount,29.4);
});
test('Modifier longueur après ajout de l’option actualise quantités et heures',()=>{
 const {state,work,surface}=wall();
 addRatissage(state,work,surface);
 assert.equal(calculateEstimate(state).lines.find(l=>l.name.startsWith('Ratissage complet')&&l.kind==='material').quantity,12.5);
 surface.length=6;
 const r=calculateEstimate(state);
 assert.equal(r.lines.find(l=>l.name.startsWith('Ratissage complet')&&l.kind==='material').quantity,15);
 assert.equal(r.lines.find(l=>l.name.startsWith('Ratissage complet')&&l.kind==='labor').quantity,6.3);
});
test('Surface simple avec m² directs : quantité liée automatique',()=>{
 const state=createDefaultState(),work=newWork('surface','Plafond annexe');
 work.surface.areaOverride=22.4;state.works.push(work);
 const opt=addRatissage(state,work,work.surface);
 assert.equal(optionQuantity(state,opt).quantity,22.4);
 assert.equal(calculateEstimate(state).lines.find(l=>l.name.startsWith('Ratissage complet')&&l.kind==='material').quantity,22.4);
});
test('Chaque segment de pièce L/T/U et son plafond possèdent leur propre surface',()=>{
 for(const [shape,n] of [['L',6],['T',8],['U',8]]){
  const state=createDefaultState(),work=newWork('room','Pièce complexe');work.shape=shape;state.works.push(work);
  const measures=measureAllSurfaces(state);
  assert.equal(measures.length,n+1);
  assert.ok(measures.every(m=>m.net>0));
  assert.equal(measures.find(m=>m.kind==='ceiling').net,shape==='T'?11:18);
  assert.equal(roomSegments(work).length,n);
 }
});
test('Pièce : deux murs distincts peuvent recevoir le même traitement',()=>{
 const state=createDefaultState(),work=newWork('room','Pièce A');state.works.push(work);
 const a=addRatissage(state,work,work.walls.A);
 const b=addRatissage(state,work,work.walls.B);
 const r=calculateEstimate(state);
 assert.equal(r.complete,true);assert.equal(r.lines.filter(x=>x.name==='Ratissage complet 2 passes — fournitures').length,2);
 assert.equal(optionQuantity(state,a).quantity,12.5);
 assert.equal(optionQuantity(state,b).quantity,10);
});
test('Le même traitement deux fois sur le même mur reste interdit',()=>{
 const {state,work,surface}=wall();
 addRatissage(state,work,surface);addRatissage(state,work,surface);
 const r=calculateEstimate(state);
 assert.equal(r.complete,false);assert.equal(r.totalHT,null);
 assert.ok(r.warnings.some(w=>w.includes('Prestations équivalentes')));
});
test('Un m² saisi librement reste indépendant des dimensions du mur',()=>{
 const {state,work,surface}=wall();
 const option={name:'Enduit localisé',unit:'m²',quantity:3,materialUnitHT:2,hoursPerUnit:0.25};
 state.extras.push(option);
 surface.length=9;
 const r=calculateEstimate(state);
 assert.equal(optionQuantity(state,option).quantity,3);
 assert.equal(r.lines.find(x=>x.name==='Enduit localisé — fournitures').quantity,3);
});
test('Une option sans support sélectionné est incomplète, pas facturée à 1 m²',()=>{
 const {state}=wall();
 state.extras=[{name:'Ratissage',unit:'m²',quantity:'',materialUnitHT:3,hoursPerUnit:0.4}];
 const r=calculateEstimate(state);
 assert.equal(r.complete,false);assert.equal(r.totalHT,null);
 assert.ok(r.warnings.some(w=>w.includes('Renseigner un métrage')));
});
test('Un mur désactivé ne conserve pas une option automatique avec faux montant',()=>{
 const {state,work,surface}=wall();
 addRatissage(state,work,surface);surface.active=false;
 const result=optionQuantity(state,state.extras[0]);
 assert.equal(result.quantity,null);assert.ok(result.reason.includes('désactivé'));
 assert.equal(calculateEstimate(state).complete,false);
});
test('Une modification de forme qui supprime le segment lié invalide la quantité',()=>{
 const state=createDefaultState(),work=newWork('room','Chambre');work.shape='U';state.works.push(work);
 addRatissage(state,work,work.walls.H);work.shape='rectangle';
 assert.equal(optionQuantity(state,state.extras[0]).quantity,null);
 assert.equal(calculateEstimate(state).complete,false);
});
