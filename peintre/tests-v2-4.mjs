import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultState,newWork,calculateEstimate} from './engine-v2.mjs';
import {GUILLAUME_BAREME} from './guillaume-bareme-v2-4.mjs';
import {OPTION_CATEGORIES} from './options-catalog-v2.mjs';
import {BAREME_OPTION_GROUPS,referenceForOption,serviceKey,alreadySelected,createExtra,matchesCatalogCount} from './guillaume-mapping-v2-4.mjs';

const room=()=>{const s=createDefaultState();s.works.push(newWork('room','Salon'));return s;};
const byId=id=>GUILLAUME_BAREME.find(r=>r.id===id);
test('92 lignes PDF tracées, 67 + 25 et unités sans conversion',()=>{
 assert.equal(GUILLAUME_BAREME.length,92);
 assert.equal(GUILLAUME_BAREME.filter(r=>r.source==='peinture.pdf').length,67);
 assert.equal(GUILLAUME_BAREME.filter(r=>r.source==='peinture 2.pdf').length,25);
 assert.deepEqual(BAREME_OPTION_GROUPS.map(g=>g.items.length),[67,9,7,9]);
 assert.ok(GUILLAUME_BAREME.every(r=>r.id&&r.label&&r.sourcePage>0&&Number.isInteger(r.sourceRow)));
});
test('références PDF sensibles : unités, fournitures et temps strictement préservés',()=>{
 assert.deepEqual([byId('guillaume-p1-15').unit,byId('guillaume-p1-15').materialUnitHT,byId('guillaume-p1-15').hoursPerUnit],['m²',18,1.35]);
 assert.deepEqual([byId('guillaume-p1-02').unit,byId('guillaume-p1-02').materialUnitHT,byId('guillaume-p1-02').hoursPerUnit],['m²',2.8,0.42]);
 assert.deepEqual([byId('guillaume-p2-02').unit,byId('guillaume-p2-02').materialUnitHT,byId('guillaume-p2-02').hoursPerUnit],['ml',0.65,0.05]);
 assert.deepEqual([byId('guillaume-p2-14').unit,byId('guillaume-p2-14').materialUnitHT,byId('guillaume-p2-14').hoursPerUnit],['unité',14,1.8]);
});
test('64 options historiques préservées ; 62 correspondances explicites',()=>{
 assert.equal(OPTION_CATEGORIES.flatMap(x=>x.items).length,64);
 assert.equal(matchesCatalogCount(),62);
});
test('option Tadelakt préremplie en m², prix HT et h/m²',()=>{
 const option=OPTION_CATEGORIES[1].items[2],extra=createExtra(option);
 assert.equal(extra.name,'Tadelakt');assert.equal(extra.unit,'m²');
 assert.equal(extra.materialUnitHT,18);assert.equal(extra.hoursPerUnit,1.35);
 assert.equal(extra.referenceSource,'peinture.pdf');
 const s=room();s.extras.push(extra);
 const r=calculateEstimate(s);
 assert.equal(r.complete,true);
 assert.equal(r.lines.find(x=>x.name==='Tadelakt — fournitures').amount,18);
 assert.equal(r.lines.find(x=>x.name==='Tadelakt — main-d’œuvre').quantity,1.35);
});
test('une prestation sans correspondance fiable reste manuelle',()=>{
 const e=createExtra(OPTION_CATEGORIES[1].items[9]); // Enduit stuqué
 assert.equal(e.referenceId,null);
 assert.equal(e.materialUnitHT,'');assert.equal(e.hoursPerUnit,'');
});
test('menuiserie et plinthes : ml et m² demeurent distincts',()=>{
 const p1=createExtra(byId('guillaume-p1-30')),p2=createExtra(byId('guillaume-p2-02'));
 assert.equal(p1.unit,'m²');assert.equal(p2.unit,'ml');
 assert.equal(p1.materialUnitHT,5);assert.equal(p2.materialUnitHT,0.65);
 assert.equal(serviceKey(p1),serviceKey(p2));
});
test('UI peut interdire une variante équivalente',()=>{
 const generic=OPTION_CATEGORIES[2].items[4],p1=byId('guillaume-p1-30'),p2=byId('guillaume-p2-02');
 assert.equal(alreadySelected(p2,[createExtra(generic)]),true);
 assert.equal(alreadySelected(p1,[createExtra(p2)]),true);
});
test('moteur refuse de compter deux variantes du même poste',()=>{
 const s=room();s.extras.push(createExtra(byId('guillaume-p1-30')),createExtra(byId('guillaume-p2-02')));
 const r=calculateEstimate(s);assert.equal(r.complete,false);assert.equal(r.totalHT,null);
 assert.ok(r.warnings.some(x=>x.includes('Prestations équivalentes')));
});
test('plinthes automatiques et option de plinthes ne se cumulent pas',()=>{
 const s=room();s.works[0].plinth.enabled=true;
 s.extras.push(createExtra(byId('guillaume-p2-02')));
 const r=calculateEstimate(s);assert.equal(r.complete,false);
 assert.ok(r.warnings.some(x=>x.includes('Plinthes : choisir')));
});
test('ligne à 0 € matières ne doit pas effacer les heures documentées',()=>{
 const s=room();s.extras.push(createExtra(byId('guillaume-p2-11')));
 const r=calculateEstimate(s);assert.equal(r.complete,true);
 assert.equal(r.lines.find(x=>x.name.includes('prise / interrupteur')&&x.kind==='material').amount,0);
 assert.equal(r.lines.find(x=>x.name.includes('prise / interrupteur')&&x.kind==='labor').quantity,0.12);
});
test('majoration urgence à 0 € dans le PDF n’est pas un prix commercial',()=>{
 const s=room();s.extras.push(createExtra(byId('guillaume-p2-22')));
 const r=calculateEstimate(s);assert.equal(r.complete,false);
 assert.ok(r.warnings.some(x=>x.includes('majoration commerciale')));
});
test('tarif de majoration confirmé explicitement débloque le chiffrage',()=>{
 const s=room(),extra=createExtra(byId('guillaume-p2-22'));extra.materialUnitHT=65;s.extras.push(extra);
 const r=calculateEstimate(s);assert.equal(r.complete,true);
 assert.equal(r.lines.find(x=>x.name==='Intervention en urgence — fournitures').amount,65);
});
test('consommables courants : exemples marché HT déjà présents et exclus par défaut',()=>{
 const s=room();assert.deepEqual(s.supplies.map(x=>x.unitPrice),[2.47,3.55,2.92]);
 assert.ok(s.supplies.every(x=>!x.enabled));
 const r=calculateEstimate(s);assert.equal(r.lines.some(x=>x.tag==='Consommables courants'),false);
});
test('consommable sélectionné utilise le prix repère ajustable',()=>{
 const s=room();s.supplies[0].enabled=true;s.supplies[0].quantity=2;
 const r=calculateEstimate(s);assert.equal(r.complete,true);
 assert.equal(r.lines.find(x=>x.tag==='Consommables courants').amount,4.94);
});
test('limites et provenance PDF maintenues sur chaque ligne',()=>{
 const s=room();s.extras.push(createExtra(byId('guillaume-p1-38')));
 const r=calculateEstimate(s);
 const l=r.lines.find(x=>x.name.includes('Pose de panneaux décoratifs')&&x.kind==='material');
 assert.ok(l.source.includes('peinture.pdf / ligne 38'));
 assert.ok(l.notes.includes('panneaux exclus'));
});
