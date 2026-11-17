import test from 'node:test';
import assert from 'node:assert/strict';
import {MENU,PRESTATIONS,CHAMPS,TARIFS} from '../assets/v12-data.mjs';
import {nouveauChantier,selectionnerFamille,selectionnerPrestation,verifierChantier,restaurerChantier,calculerChantierCompose,ADDONS} from '../assets/v13-model.mjs';

function exemples(){
 const c=nouveauChantier();
 selectionnerFamille(c,'terrassement_fondation',true);
 selectionnerFamille(c,'enrobe',true);
 selectionnerPrestation(c,'tranchee',true);
 selectionnerPrestation(c,'fondations_superficielles',true);
 selectionnerPrestation(c,'pose_enrobe_neuf',true);
 return c;
}
test('Catalogue : 5 familles et 25 prestations sans doublon',()=>{
 assert.equal(MENU.length,5);
 assert.equal(Object.keys(PRESTATIONS).length,25);
 assert.equal(new Set(Object.keys(PRESTATIONS)).size,25);
 assert.equal(MENU.reduce((n,x)=>n+x.sousTypes.length,0),25);
});
test('Sélection simultanée : 2 familles et 3 prestations',()=>{
 const c=exemples();
 assert.equal(c.familles.length,2);
 assert.equal(c.prestations.length,3);
 assert.equal(calculerChantierCompose(c).prestations.length,3);
});
test('Chaque prestation garde ses propres dimensions',()=>{
 const c=exemples();
 c.prestations[0].valeurs.L=75;
 c.prestations[1].valeurs.L=15;
 const r=calculerChantierCompose(c);
 assert.ok(r.prestations[0].totaux.total_ht>0);
 assert.equal(c.prestations[0].valeurs.L,75);
 assert.equal(c.prestations[1].valeurs.L,15);
});
test('Total global = somme des prestations avec TVA',()=>{
 const r=calculerChantierCompose(exemples());
 const ht=r.prestations.reduce((s,p)=>s+p.totaux.total_ht,0);
 const tva=r.prestations.reduce((s,p)=>s+p.totaux.tva,0);
 assert.equal(r.totaux.total_ht,Math.round(ht*100)/100);
 assert.equal(r.totaux.tva,Math.round(tva*100)/100);
 assert.equal(r.totaux.total_ttc,Math.round((ht+tva)*100)/100);
});
test('Décocher une famille retire uniquement ses prestations',()=>{
 const c=exemples();
 selectionnerFamille(c,'enrobe',false);
 assert.equal(c.prestations.length,2);
 assert.ok(c.prestations.every(x=>x.type!=='pose_enrobe_neuf'));
 assert.deepEqual(c.familles,['terrassement_fondation']);
});
test('Une famille peut avoir plusieurs prestations',()=>{
 const c=exemples();
 assert.equal(c.prestations.filter(x=>PRESTATIONS[x.type].famille==='terrassement_fondation').length,2);
 selectionnerPrestation(c,'fouille',true);
 assert.equal(c.prestations.length,4);
});
test('Une même prestation ne se duplique pas si recliquée',()=>{
 const c=exemples();selectionnerPrestation(c,'tranchee',true);
 assert.equal(c.prestations.length,3);
});
test('Nombre aides : conducteur seul versus conducteur + 1 ou 2 aides',()=>{
 const c=exemples(),item=c.prestations[0];
 item.equipe.aides=0;const a=calculerChantierCompose(c).prestations[0];
 item.equipe.aides=1;const b=calculerChantierCompose(c).prestations[0];
 item.equipe.aides=2;const d=calculerChantierCompose(c).prestations[0];
 assert.notEqual(a.totaux.total_ht,b.totaux.total_ht);
 assert.ok(d.totaux.total_ht>=b.totaux.total_ht);
});
test('Engin 4 t sans tarif explicite : estimation incomplète mais pas prix inventé',()=>{
 const c=exemples();c.prestations[0].options.engin='ENG_4';
 const r=calculerChantierCompose(c);
 const tr=r.prestations[0];
 assert.ok(r.incomplet);
 assert.ok(tr.lignes.some(x=>x.id==='ENG_4'&&x.pu===0));
 assert.ok(tr.manquants.some(x=>x.includes('4 t')));
 c.prestations[0].tarifEngin4t=480;
 const priced=calculerChantierCompose(c).prestations[0];
 assert.equal(priced.lignes.find(x=>x.id==='ENG_4').pu,480);
 assert.ok(!priced.manquants.some(x=>x.includes('4 t')));
});
test('Options par prestation et prévention du doublon déjà prévu',()=>{
 const c=exemples();
 c.prestations[0].addons.SIGNAL=1;
 c.prestations[0].addons.GEOT_200=12;
 const r=calculerChantierCompose(c).prestations[0];
 assert.equal(r.lignes.filter(x=>x.id==='SIGNAL').length,1);
 assert.equal(r.lignes.filter(x=>x.id==='GEOT_200').length,1);
});
test('Deux prestations avec même option gardent des lignes séparées',()=>{
 const c=exemples();
 c.prestations[0].addons.SIGNAL=1;
 c.prestations[2].addons.SIGNAL=2;
 const r=calculerChantierCompose(c);
 assert.equal(r.prestations[0].lignes.find(x=>x.id==='SIGNAL').quantite,1);
 assert.equal(r.prestations[2].lignes.find(x=>x.id==='SIGNAL').quantite,2);
});
test('Prix personnalisé issu de V1.2 se propage sans modifier la BPU',()=>{
 const c=exemples();const a=calculerChantierCompose(c);
 const b=calculerChantierCompose(c,{ENG_3:999});
 assert.notEqual(a.totaux.total_ht,b.totaux.total_ht);
 assert.equal(TARIFS.ENG_3.prix,350);
});
test('Restaurer une sauvegarde ne laisse pas passer les types inconnus',()=>{
 const c=exemples();c.prestations.push({id:'bad',type:'type_inexistant'});
 const restored=restaurerChantier(c);
 assert.equal(restored.prestations.length,3);
 verifierChantier(restored);
});
test('Entrées invalides bloquées',()=>{
 const c=exemples();
 c.prestations[0].valeurs.L=0;
 const r=calculerChantierCompose(c);
 assert.equal(r.errors.length,1);
 assert.equal(r.prestations.length,2);
 assert.equal(r.incomplet,true);
});
for(const id of Object.keys(ADDONS)){
 test('Option de catalogue référencée et tarifée : '+id,()=>{
  assert.ok(TARIFS[id]);
  assert.ok(TARIFS[id].unite);
  assert.ok(ADDONS[id].familles.every(k=>MENU.some(x=>x.id===k)));
 });
}