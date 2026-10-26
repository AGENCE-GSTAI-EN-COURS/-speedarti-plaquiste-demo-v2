import test from 'node:test';
import assert from 'node:assert/strict';
import { calculerChantier, defaultChantier } from '../assets/engine.mjs';
import { CATEGORIES } from '../assets/prix-reference.mjs';
const chantier=(cat,type)=>{
 const c=defaultChantier();c.options.categorie_terrassement=cat;
 c.options.sous_type_terrassement=type||Object.keys(CATEGORIES[cat].sousTypes)[0];
 return c;
};
for(const [cat,obj] of Object.entries(CATEGORIES)){
 for(const type of Object.keys(obj.sousTypes)){
  test('calcul '+cat+'/'+type,()=>{
   const r=calculerChantier(chantier(cat,type));
   assert.equal(r.categorie,cat);assert.equal(r.sous_type,type);
   assert.ok(r.materiaux.length>=2);assert.ok(r.totaux.total_ht>0);
   assert.ok(r.totaux.total_ttc>=r.totaux.total_ht);assert.ok(r.main_oeuvre.cout_total>0);
  });
 }
}
test('validation longueur nulle et negative',()=>{
 for(const n of [0,-1,NaN]){const c=defaultChantier();c.dimensions.longueur=n;assert.throws(()=>calculerChantier(c),/Valeur invalide/);}
});
test('regards 0 respectes',()=>{
 const c=chantier('reseaux','assainissement_eu');c.options.nombre_regards=0;
 assert.ok(!calculerChantier(c).materiaux.some(x=>x.article_id==='REGARDS'));
});
test('m3 et foisonnement',()=>{
 const c=defaultChantier();c.dimensions={longueur:20,largeur:2,profondeur_fouille:1};c.options.nature_sol='sable';
 const r=calculerChantier(c);assert.equal(r.volumes.surface_m2,40);assert.equal(r.volumes.volume_m3,40);assert.equal(r.volumes.volume_foisonne_m3,46);
});
test('fouille profonde : alerte',()=>{
 const c=defaultChantier();c.dimensions.profondeur_fouille=1.5;
 assert.ok(calculerChantier(c).alertes.some(x=>x.includes('Fouille profonde')));
});
test('compatibilite champs legacy',()=>{
 const c=defaultChantier();const a=calculerChantier(c);
 delete c.options.categorie_terrassement;delete c.options.sous_type_terrassement;
 c.options.categorie_travaux='terrassement_fondation';c.options.sous_type_travaux='tranchee';
 assert.equal(calculerChantier(c).totaux.total_ht,a.totaux.total_ht);
});
test('engin manuel et TVA',()=>{
 const c=defaultChantier();c.options.engin_selectionne='pelle_8';c.options.taux_tva=10;
 const r=calculerChantier(c);assert.ok(r.materiaux.some(x=>x.nom==='Location Pelle 8 T'));
 assert.equal(r.totaux.tva,Math.round(r.totaux.total_ht*.1*100)/100);
});
test('evacuation optionnelle',()=>{
 const c=defaultChantier();c.options.evacuation_terres=false;
 assert.ok(!calculerChantier(c).materiaux.some(x=>x.article_id==='EVAC'));
});
test('montants finis',()=>{
 for(const [cat,obj] of Object.entries(CATEGORIES)){
  const r=calculerChantier(chantier(cat,Object.keys(obj.sousTypes)[0]));
  r.materiaux.forEach(x=>assert.ok(Number.isFinite(x.total_ht)));
  Object.values(r.totaux).forEach(x=>assert.ok(Number.isFinite(x)));
 }
});