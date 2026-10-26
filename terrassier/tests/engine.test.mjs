import test from 'node:test';
import assert from 'node:assert/strict';
import { calculerChantier, defaultChantier, appliquerAjustements } from '../assets/engine.mjs';
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
test('enrobé multicouche : deux couches distinctes, accrochage, tonnage cumulé',()=>{
 const c=chantier('enrobe','pose_enrobe_multicouches');
 c.dimensions={surface_m2:100,profondeur_fouille:.3};
 c.options.couches_enrobe=[{classe:'BBSG',epaisseur_cm:6},{classe:'BBM',epaisseur_cm:4}];
 const r=calculerChantier(c);
 const lines=r.materiaux.filter(x=>x.article_id.startsWith('ENROBE_C'));
 assert.equal(lines.length,2);
 assert.ok(r.materiaux.some(x=>x.article_id==='ACCROCHAGE_C2'));
 assert.equal(r.volumes.surface_m2,100);
 assert.equal(r.volumes.tonnage_enrobe,23);
});
test('enrobé multicouche : modification épaisseur et classe change prix',()=>{
 const c=chantier('enrobe','pose_enrobe_multicouches');
 c.dimensions={surface_m2:100,profondeur_fouille:.3};
 c.options.couches_enrobe=[{classe:'BBSG',epaisseur_cm:6},{classe:'BBM',epaisseur_cm:4}];
 const a=calculerChantier(c);
 c.options.couches_enrobe=[{classe:'BBDr',epaisseur_cm:5},{classe:'BBME',epaisseur_cm:7}];
 const b=calculerChantier(c);
 assert.notEqual(a.totaux.total_ht,b.totaux.total_ht);
 assert.ok(b.volumes.tonnage_enrobe>a.volumes.tonnage_enrobe);
});
test('fosse septique incluse automatiquement si sélection du sous-type',()=>{
 const c=chantier('reseaux','fosse_septique');c.options.fosse_septique=false;
 const r=calculerChantier(c);
 assert.ok(r.materiaux.some(x=>x.article_id==='FOSSE'));
 assert.ok(r.alertes.some(x=>x.includes('Assainissement non collectif')));
 c.options.type_fosse='micro_station_6eh';
 assert.ok(calculerChantier(c).materiaux.find(x=>x.article_id==='FOSSE').prix_unitaire_ht>1000);
});
test('surface directe pour enrobé et chemins',()=>{
 for(const cat of ['enrobe','chemin_acces']){
  const c=chantier(cat);c.dimensions={surface_m2:150,profondeur_fouille:.3};
  const r=calculerChantier(c);
  assert.equal(r.volumes.surface_m2,150);
  assert.equal(r.volumes.volume_m3,45);
 }
});
test('blindage, bordures, pompage chiffrés explicitement comme provisions',()=>{
 const c=chantier('terrassement_fondation','tranchee');
 c.options.blindage_fouille=true;c.options.presence_eau=true;
 const r=calculerChantier(c);
 assert.ok(r.materiaux.find(x=>x.article_id==='BLINDAGE')?.total_ht>0);
 assert.ok(r.materiaux.find(x=>x.article_id==='POMPAGE')?.total_ht>0);
 assert.ok(r.alertes.some(x=>x.includes('simulation')));
 const p=chantier('chemin_acces');p.options.bordures=true;p.dimensions={surface_m2:90,profondeur_fouille:.3};
 assert.ok(calculerChantier(p).materiaux.find(x=>x.article_id==='BORDURES')?.total_ht>0);
});
test('corrections manuelles de quantité, prix, heures et recalcul TTC',()=>{
 const a=calculerChantier(defaultChantier());
 const id=a.materiaux[0].article_id,poste=a.main_oeuvre.decomposition[0].poste;
 const b=appliquerAjustements(a,{materiaux:{[id]:{quantite:10,prix:300}},heures:{[poste]:10}});
 assert.equal(b.materiaux[0].total_ht,3000);
 assert.equal(b.main_oeuvre.decomposition[0].temps_heures,10);
 assert.notEqual(b.totaux.total_ht,a.totaux.total_ht);
 assert.equal(b.totaux.total_ttc,Math.round((b.totaux.total_ht+b.totaux.tva)*100)/100);
 assert.notEqual(a.materiaux[0].total_ht,3000);
});
test('corrections manuelles : zéro admis et quantité négative refusée',()=>{
 const a=calculerChantier(defaultChantier()),id=a.materiaux[0].article_id;
 assert.equal(appliquerAjustements(a,{materiaux:{[id]:{quantite:0}}}).materiaux[0].total_ht,0);
 assert.throws(()=>appliquerAjustements(a,{materiaux:{[id]:{quantite:-1}}}),/Valeur invalide/);
});
test('multicouche : épaisseur incorrecte et classe inconnue bloquées',()=>{
 const c=chantier('enrobe','pose_enrobe_multicouches');
 c.options.couches_enrobe=[{classe:'BBSG',epaisseur_cm:0},{classe:'BBM',epaisseur_cm:4}];
 assert.throws(()=>calculerChantier(c),/Valeur invalide/);
 c.options.couches_enrobe[0]={classe:'NOTFOUND',epaisseur_cm:5};
 assert.throws(()=>calculerChantier(c),/inconnue/);
 c.options.couches_enrobe=Array.from({length:6},()=>({classe:'BBSG',epaisseur_cm:4}));
 assert.throws(()=>calculerChantier(c),/5 couches/);
});
test('démolition : décocher évacuation retire le poste',()=>{
 const c=chantier('demolition');c.options.evacuation_terres=false;
 assert.ok(!calculerChantier(c).materiaux.some(x=>x.article_id==='EVAC_DEMO'));
});
test('tva hors plage bloquée',()=>{
 const c=defaultChantier();c.options.taux_tva=120;
 assert.throws(()=>calculerChantier(c),/TVA hors plage/);
});
