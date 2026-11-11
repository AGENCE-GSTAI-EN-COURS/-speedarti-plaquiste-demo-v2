import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultState,newWork,optionQuantity,calculateEstimate} from './engine-v2.mjs';

function fixture(){
 const state=createDefaultState(),work=newWork('wall','Mur salon');
 work.surface.length=5;work.surface.height=2.5;
 state.works.push(work);
 const option={name:'Ratissage complet en 2 passes',unit:'m²',serviceKey:'guillaume-p1-02',
   autoQuantity:true,targetWorkId:work.id,targetSurfaceId:work.surface.id,
   quantity:12.5,materialUnitHT:2.8,hoursPerUnit:0.42};
 state.extras.push(option);return {state,work,option};
}
test('quantité automatique du mur à 12,5 m² par défaut',()=>{
 const {state,option}=fixture();
 assert.equal(optionQuantity(state,option).quantity,12.5);
 assert.equal(calculateEstimate(state).lines.find(x=>x.name.includes('Ratissage')&&x.kind==='material').amount,35);
});
test('quantité personnalisée à 7 m² : fournitures et heures proportionnelles',()=>{
 const {state,option}=fixture();
 option.autoQuantity=false;option.quantity=7;
 const r=calculateEstimate(state);
 assert.equal(optionQuantity(state,option).quantity,7);
 assert.equal(r.complete,true);
 assert.equal(r.lines.find(x=>x.name.includes('Ratissage')&&x.kind==='material').amount,19.6);
 assert.equal(r.lines.find(x=>x.name.includes('Ratissage')&&x.kind==='labor').quantity,2.94);
});
test('modifier les cotes ne modifie pas une quantité personnalisée',()=>{
 const {state,work,option}=fixture();
 option.autoQuantity=false;option.quantity=7;
 work.surface.length=6;
 assert.equal(optionQuantity(state,option).quantity,7);
 assert.equal(calculateEstimate(state).lines.find(x=>x.name.includes('Ratissage')&&x.kind==='material').quantity,7);
});
test('réactiver autoQuantity reprend la nouvelle superficie réelle du mur',()=>{
 const {state,work,option}=fixture();
 option.autoQuantity=false;option.quantity=7;
 work.surface.length=6;option.autoQuantity=true;
 assert.equal(optionQuantity(state,option).quantity,15);
 assert.equal(calculateEstimate(state).lines.find(x=>x.name.includes('Ratissage')&&x.kind==='material').quantity,15);
});
test('même prestation personnalisée sur deux murs distincts sans doublon',()=>{
 const {state,option}=fixture();
 const b=newWork('wall','Mur voisin');state.works.push(b);
 option.autoQuantity=false;option.quantity=7;
 state.extras.push({...option,targetWorkId:b.id,targetSurfaceId:b.surface.id,quantity:4});
 assert.equal(calculateEstimate(state).complete,true);
});
test('deux quantités personnalisées du même traitement sur le même mur restent un doublon',()=>{
 const {state,option}=fixture();
 option.autoQuantity=false;option.quantity=7;
 state.extras.push({...option,quantity:5});
 const r=calculateEstimate(state);
 assert.equal(r.complete,false);
 assert.ok(r.warnings.some(x=>x.includes('Prestations équivalentes')));
});
test('désactiver un mur bloque le poste personnalisé qui lui est rattaché',()=>{
 const {state,work,option}=fixture();
 option.autoQuantity=false;option.quantity=7;work.surface.active=false;
 assert.equal(optionQuantity(state,option).quantity,null);
 assert.equal(calculateEstimate(state).complete,false);
});
test('quantité au ml, à l’unité ou forfait préserve la saisie libre',()=>{
 const {state}=fixture();
 for(const unit of ['ml','unité','forfait']){
  const extra={unit,quantity:3,materialUnitHT:1,hoursPerUnit:0.2};
  assert.equal(optionQuantity(state,extra).quantity,3);
 }
});
