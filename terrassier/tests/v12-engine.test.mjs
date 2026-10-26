import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESTATIONS,CHAMPS,TARIFS,MENU} from '../assets/v12-data.mjs';
import {calculerV12} from '../assets/v12-engine.mjs';
const build=(type,options={},vals={})=>{
 const spec=PRESTATIONS[type];
 const valeurs=Object.fromEntries(spec.champs.map(k=>[k,spec.defauts[k]??CHAMPS[k].val]));
 return {type,valeurs:{...valeurs,...vals},options:{...spec.defauts,...options}};
};
test('V1.2 : exactement cinq catégories et 25 prestations distinctes',()=>{
 assert.equal(MENU.length,5);assert.equal(Object.keys(PRESTATIONS).length,25);
 assert.equal(MENU.reduce((sum,x)=>sum+x.sousTypes.length,0),25);
});
for(const [type,p] of Object.entries(PRESTATIONS)){
 test('V1.2 '+type+' : recette différenciée, unités et postes cohérents',()=>{
  const result=calculerV12(build(type));
  assert.equal(result.type,type);
  assert.equal(result.famille,p.famille);
  assert.ok(result.lignes.length>=3,type+' trop peu de postes');
  assert.ok(result.metriques.volume_m3>=0);
  assert.ok(result.totaux.total_ht>0);
  assert.ok(result.totaux.total_ttc>=result.totaux.total_ht);
  assert.equal(result.fiable_pour_devis,false);
  assert.equal(result.lignes.length,new Set(result.lignes.map(l=>l.id)).size,'Référence de ligne doublonnée');
  for(const l of result.lignes){
   assert.ok(TARIFS[l.id],l.id+' absent du catalogue');
   assert.equal(l.unite,TARIFS[l.id].unite,'mauvaise unité '+l.id);
   assert.equal(l.montant,Math.round(l.quantite*l.pu*100)/100,'montant incohérent '+l.id);
  }
 });
}
test('Démolition : béton, enrobé, réseaux et dessouchage divergent',()=>{
 const ids=['demolition_beton','demolition_enrobe','depose_reseaux','dessouchage'];
 const all=ids.map(type=>calculerV12(build(type)));
 assert.ok(all[0].lignes.some(l=>l.id==='ENG_BRH'));
 assert.ok(all[1].lignes.some(l=>l.id==='ENG_FRAIS'));
 assert.ok(all[2].lignes.some(l=>l.id==='MO_MAN'));
 assert.ok(all[3].lignes.some(l=>l.id==='ENG_DESS'));
 const signatures=all.map(r=>r.lignes.map(l=>l.id).sort().join('|'));
 assert.equal(new Set(signatures).size,4,'les quatre recettes de démolition doivent différer');
});
test('Allées : beton, enrobe, pavés et gravier ont fournitures distinctes',()=>{
 const ids=['allee_beton','allee_enrobe','allee_paves','allee_gravier'];
 const all=ids.map(type=>calculerV12(build(type)));
 assert.ok(all[0].lignes.some(l=>l.id==='B25'));
 assert.ok(all[1].lignes.some(l=>l.id==='EN_BBSG'));
 assert.ok(all[2].lignes.some(l=>l.id==='PAVES'));
 assert.ok(all[3].lignes.some(l=>l.id==='GRAN_GRAV'));
 assert.ok(!all[0].lignes.some(l=>l.id==='GRAN_GRAV'));
});
test('Réponses réseaux : EU, EP, eau potable, fourreau et drain distincts',()=>{
 const ids=['assainissement_eu','assainissement_ep','eau_potable','reseau_sec','drainage'];
 const all=ids.map(type=>calculerV12(build(type)));
 assert.ok(all[0].lignes.some(l=>l.id==='PVC_160'));
 assert.ok(all[1].lignes.some(l=>l.id==='PVC_200'));
 assert.ok(all[2].lignes.some(l=>l.id==='AEP_32'));
 assert.ok(all[3].lignes.some(l=>l.id==='TPC_63'));
 assert.ok(all[4].lignes.some(l=>l.id==='DRAIN'));
});
test('Tarif personnalisé change le montant sans modifier les références',()=>{
 const d=build('tranchee'),a=calculerV12(d),
   b=calculerV12(d,{ENG_3:900});
 assert.notEqual(a.totaux.total_ht,b.totaux.total_ht);
 assert.equal(TARIFS.ENG_3.prix,350);
});
test('Quantité et prix chantier modifiables et revalorisés',()=>{
 const d=build('demolition_beton');
 const x=calculerV12(d),id=x.lignes[0].id;
 const y=calculerV12(d,{}, {[id]:{quantite:50,pu:27}});
 assert.equal(y.lignes.find(l=>l.id===id)?.montant,1350);
 assert.notEqual(y.totaux.total_ht,x.totaux.total_ht);
});
test('Dimensions invalides bloquent les tarifs',()=>{
 assert.throws(()=>calculerV12(build('demolition_beton',{}, {S:0})),/supérieur/);
 assert.throws(()=>calculerV12(build('demolition_beton',{}, {E:-1})),/Renseignez/);
 assert.throws(()=>calculerV12(build('dessouchage',{}, {arbres:0})),/supérieur/);
});
test('TVA 0, 5,5, 10, 20 seulement',()=>{
 for(const tva of [0,5.5,10,20]){
  const r=calculerV12(build('fouille',{tva}));
  assert.equal(r.tva,tva);
  assert.equal(r.totaux.tva,Math.round(r.totaux.total_ht*tva)/100);
 }
 assert.throws(()=>calculerV12(build('fouille',{tva:42})),/TVA non autorisée/);
});
test('Evacuation désactivée retire traitement et transport associés',()=>{
 const a=calculerV12(build('demolition_beton',{evac:true}));
 const b=calculerV12(build('demolition_beton',{evac:false}));
 assert.ok(a.lignes.some(l=>l.id==='EVAC_GRAV'));
 assert.ok(!b.lignes.some(l=>l.id==='EVAC_GRAV'));
 assert.ok(!b.lignes.some(l=>l.id==='TRANSPORT_DECH'));
});
test('Unité et no duplicate postes transport même avec plusieurs matières',()=>{
 for(const id of ['allee_beton','enrobe_rechargement','pose_enrobe_multicouches','fosse_septique']){
  const result=calculerV12(build(id));
  assert.equal(result.lignes.filter(x=>x.id==='TRANSPORT_ENG').length,1);
 }
});
test('Postes connus partiellement chiffrés sont explicitement signalés',()=>{
 for(const id of ['fondations_profondes','eau_potable','reseau_sec','fosse_septique']){
  const r=calculerV12(build(id));
  assert.ok(r.provisoire.length>=1,id+' doit signaler les coûts manquants');
 }
});
