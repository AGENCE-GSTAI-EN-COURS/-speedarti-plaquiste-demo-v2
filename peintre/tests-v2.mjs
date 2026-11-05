import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultState,newWork,newOpening,calculateEstimate} from './engine-v2.mjs';

function roomState(){const s=createDefaultState();s.works.push(newWork('room','Salon'));return s;}
function prices(s){
 s.labor.hourlyRate=50;
 for(const w of s.works){
   const surfaces=w.type==='room'?[...Object.values(w.walls),w.ceiling]:[w.surface];
   for(const sf of surfaces){
     Object.assign(sf.paint,{yield:10,potLitres:10,potPrice:50,hoursM2:0.1});
     Object.assign(sf.wallpaper,{rollWidth:0.5,rollLength:10,repeatCm:0,rollPrice:25,hoursM2:0.15});
   }
 }
 return s;
}
const find=(r,kind)=>r.lines.filter(x=>x.kind===kind);

test('aucun ouvrage : aucun faux total complet',()=>{
 const r=calculateEstimate(createDefaultState());assert.equal(r.complete,false);assert.equal(r.totalHT,null);
});
test('pièce 5x4x2.5 : murs A/C 12,5 et B/D 10, plafond 20',()=>{
 const s=roomState(),r=calculateEstimate(s);assert.deepEqual(r.geometry.map(g=>g.net),[12.5,10,12.5,10,20]);
});
test('mur D désélectionné exclu de tous les calculs',()=>{
 const s=prices(roomState());s.works[0].walls.D.active=false;
 const r=calculateEstimate(s);assert.equal(r.geometry.some(g=>g.surface==='Mur D'),false);
 assert.equal(r.geometry.reduce((a,g)=>a+g.net,0),55);assert.equal(r.complete,true);
});
test('plafond désélectionné non compris',()=>{
 const s=prices(roomState());s.works[0].ceiling.active=false;
 const r=calculateEstimate(s);assert.equal(r.geometry.some(g=>g.kind==='ceiling'),false);
});
test('mur A panoramique, B classique, C mat, D glycéro couleur',()=>{
 const s=prices(roomState()),w=s.works[0];
 w.ceiling.active=false;
 w.walls.A.mode='wallpaper';w.walls.A.wallpaper.kind='panoramique';
 w.walls.A.wallpaper.panels=3;w.walls.A.wallpaper.panelPrice=90;
 w.walls.B.mode='wallpaper';
 w.walls.C.paint.finish='mat';
 w.walls.D.paint.type='glycero';w.walls.D.paint.color='color';w.walls.D.paint.colorRef='RAL7016';
 const r=calculateEstimate(s);
 assert.equal(r.geometry.length,4);assert.equal(r.geometry[0].mode,'wallpaper');
 assert.equal(r.lines.some(l=>l.name.includes('panoramique')&&l.quantity===3),true);
 assert.equal(r.lines.some(l=>l.name.includes('glycero mat couleur RAL7016')),true);
 assert.equal(r.complete,true);
});
test('mur simple indépendant longueur × hauteur',()=>{
 const s=createDefaultState();s.works.push(newWork('wall','Pignon'));s.works[0].surface.length=7;s.works[0].surface.height=3;prices(s);
 const r=calculateEstimate(s);assert.equal(r.geometry[0].net,21);assert.equal(r.complete,true);
});
test('surface simple indépendante longueur × largeur',()=>{
 const s=createDefaultState();s.works.push(newWork('surface','Plafond isolé'));prices(s);
 const r=calculateEstimate(s);assert.equal(r.geometry[0].net,12);assert.equal(r.geometry[0].kind,'surface');
});
test('ouverture déduite sur le bon mur, pas sur les autres',()=>{
 const s=prices(roomState()),w=s.works[0];const op=newOpening();w.walls.A.openings.push(op);
 const r=calculateEstimate(s);assert.equal(r.geometry[0].net,10.61);
 assert.equal(r.geometry[1].net,10);
});
test('menuiserie en supplément sans déduction du support',()=>{
 const s=prices(roomState()),w=s.works[0];const op=newOpening();op.mode='supplement';
 Object.assign(op.paint,{yield:8,potLitres:1,potPrice:12,hoursM2:.4});
 w.walls.B.openings.push(op);
 const r=calculateEstimate(s);assert.equal(r.geometry.find(g=>g.surface==='Mur B').net,10);
 assert.equal(r.geometry.some(g=>g.kind==='menuiserie'),true);assert.equal(r.complete,true);
});
test('déduction + menuiserie en supplément, 2 faces sans double comptage',()=>{
 const s=prices(roomState()),w=s.works[0];const op=newOpening();op.mode='both';op.faces=2;
 Object.assign(op.paint,{yield:8,potLitres:1,potPrice:12,hoursM2:.4});
 w.walls.A.openings.push(op);
 const r=calculateEstimate(s);assert.equal(r.geometry.find(g=>g.surface==='Mur A').net,10.61);
 assert.equal(r.geometry.find(g=>g.kind==='menuiserie').net,3.78);
});
test('plinthes auto : somme uniquement murs actifs moins portes déduites',()=>{
 const s=prices(roomState()),w=s.works[0];
 w.plinth.enabled=true;w.plinth.hoursMl=.05;w.plinth.pricePerMl=4;
 w.walls.D.active=false;
 const op=newOpening();w.walls.A.openings.push(op);
 const r=calculateEstimate(s);
 assert.equal(r.geometry.find(g=>g.kind==='plinth').net,13.1);
 assert.equal(r.complete,true);
});
test('ajout plinthes manuel séparé',()=>{
 const s=prices(roomState());s.manualPlinth={length:7,hoursMl:0.1,pricePerMl:5};
 const r=calculateEstimate(s);assert.equal(r.lines.some(l=>l.name.includes('Plinthes ajoutées')&&l.quantity===7),true);
});
test('préparation sur un seul mur uniquement',()=>{
 const s=prices(roomState()),w=s.works[0];w.walls.B.preparation={level:'skim',hoursM2:.3,consumablePriceM2:4};
 const r=calculateEstimate(s);assert.equal(r.lines.filter(l=>l.name.includes('Ratissage complet')).length,2);
 assert.equal(r.lines.find(l=>l.name.includes('consommables Ratissage complet')).amount,40);
 assert.equal(r.complete,true);
});
test('préparation légère applique le coût de repli 1 €/m² et le temps modifié',()=>{
 const s=prices(roomState());s.works[0].walls.A.preparation.level='light';
 s.works[0].walls.A.preparation.hoursM2=.2;
 const r=calculateEstimate(s);assert.equal(r.complete,true);
 assert.equal(r.lines.find(l=>l.name.includes('consommables Ponçage léger')).unitPrice,1);
});
test('produits identiques regroupés en pots entiers',()=>{
 const s=prices(roomState()),w=s.works[0];w.walls.B.active=false;w.walls.D.active=false;w.ceiling.active=false;
 const r=calculateEstimate(s);const pots=r.lines.filter(l=>l.unit==='pot');
 assert.equal(pots.length,1);assert.equal(pots[0].quantity,1);
 assert.equal(pots[0].litresBesoin,5.5);
});
test('teinte différente ne mélange pas les pots',()=>{
 const s=prices(roomState()),w=s.works[0];w.walls.A.paint.color='color';w.walls.A.paint.colorRef='RAL7016';
 const r=calculateEstimate(s);assert.equal(find(r,'material').filter(l=>l.unit==='pot').length,2);
});
test('papier peint classique approvisionné à partir des lés et raccords',()=>{
 const s=prices(roomState()),w=s.works[0];w.walls.A.mode='wallpaper';
 const r=calculateEstimate(s),roll=r.lines.find(l=>l.unit==='rouleau');
 assert.equal(roll.quantity,3);
});
test('panoramique refuse d’inventer les panneaux',()=>{
 const s=prices(roomState()),w=s.works[0];w.walls.A.mode='wallpaper';w.walls.A.wallpaper.kind='panoramique';
 const r=calculateEstimate(s);assert.equal(r.complete,false);assert.equal(r.totalHT,null);
});
test('nombre de faces menuiserie et données invalides protégés',()=>{
 const s=prices(roomState());const op=newOpening();op.mode='both';op.faces=3;s.works[0].walls.A.openings.push(op);
 assert.throws(()=>calculateEstimate(s),/1 ou 2/);
 op.faces=2;op.width=30;assert.throws(()=>calculateEstimate(s),/ouvertures supérieures/);
});
test('heures-homme et durée chantier séparées',()=>{
 const s=prices(roomState());s.labor.workers=2;
 const r=calculateEstimate(s);assert.equal(r.hoursMan,6.5);assert.equal(r.durationHours,3.25);
});
test('aucun taux horaire : aucun total inventé',()=>{
 const s=prices(roomState());s.labor.hourlyRate='';
 const r=calculateEstimate(s);assert.equal(r.complete,false);assert.equal(r.totalHT,null);
});
test('TVA manuelle explicitement justifiée',()=>{
 const s=prices(roomState());s.taxContext='manual';s.vatRate=10;
 const r=calculateEstimate(s);assert.equal(r.taxHT,r.totalHT*.1);
 s.vatRate=8;assert.throws(()=>calculateEstimate(s),/TVA/);
});
test('aucune contamination entre les pièces',()=>{
 const s=prices(roomState());s.works.push(newWork('room','Chambre'));prices(s);
 s.works[1].walls.A.active=false;
 const r=calculateEstimate(s);
 assert.equal(r.geometry.some(g=>g.work==='Chambre'&&g.surface==='Mur A'),false);
 assert.equal(r.geometry.some(g=>g.work==='Salon'&&g.surface==='Mur A'),true);
});
test('une ouverture sur une surface simple peut être déduite',()=>{
 const s=createDefaultState();const w=newWork('surface','Plafond');s.works.push(w);prices(s);
 const op=newOpening();op.width=1;op.height=1;w.surface.openings.push(op);
 const r=calculateEstimate(s);assert.equal(r.geometry[0].net,11);
});

test('un même pot reste mutualisé même avec couches différentes',()=>{
 const s=prices(roomState()),w=s.works[0];w.walls.B.active=false;w.walls.D.active=false;w.ceiling.active=false;
 w.walls.C.paint.layers=3;
 const r=calculateEstimate(s),pots=r.lines.filter(l=>l.unit==='pot');
 assert.equal(pots.length,1);
 assert.equal(pots[0].litresBesoin,6.88);
 assert.equal(pots[0].quantity,1);
});
test('peinture couleur sans référence : total bloqué',()=>{
 const s=prices(roomState());s.works[0].walls.C.paint.color='color';s.works[0].walls.C.paint.colorRef='';
 const r=calculateEstimate(s);
 assert.equal(r.complete,false);assert.equal(r.totalHT,null);
});

test('surface simple : m² saisis directement ont priorité sur les dimensions',()=>{
 const s=createDefaultState(),w=newWork('surface','Plafond');w.surface.areaOverride=22.4;s.works.push(w);prices(s);
 const r=calculateEstimate(s);assert.equal(r.geometry[0].net,22.4);
});
test('papier peint en m² seul : impossible de prétendre calculer les lés',()=>{
 const s=createDefaultState(),w=newWork('surface','Panneau');w.surface.areaOverride=22.4;w.surface.mode='wallpaper';s.works.push(w);prices(s);
 assert.throws(()=>calculateEstimate(s),/dimensions longueur\/largeur/);
});

test('régression : une nouvelle pièce produit immédiatement peinture, litres, pots, heures et prix indicatifs',()=>{
 const s=roomState(),r=calculateEstimate(s);
 const paint=r.lines.find(x=>x.name==='Peinture acrylique mat blanche');
 assert.equal(r.complete,true);assert.equal(paint.litresBesoin,14.3);
 assert.equal(paint.quantity,2);assert.equal(r.hoursMan,19.5);
 assert.equal(r.materialsHT,200);assert.equal(r.laborHT,819);
 assert.equal(r.totalHT,1019);assert.equal(r.ttc,1222.8);
});
test('régression : un mur simple est chiffré sans saisie de ratios supplémentaires',()=>{
 const s=createDefaultState();s.works.push(newWork('wall','Mur salon'));
 const r=calculateEstimate(s);
 assert.equal(r.geometry[0].net,10);
 assert.equal(r.lines.find(x=>x.kind==='material').quantity,1);
 assert.equal(r.hoursMan,3);assert.equal(r.totalHT,226);
});
test('régression : papier peint classique calcule rouleaux, prix et temps automatiquement',()=>{
 const s=roomState(),w=s.works[0];w.walls.A.mode='wallpaper';
 const r=calculateEstimate(s);
 const material=r.lines.find(x=>x.unit==='rouleau');
 assert.equal(material.quantity,3);
 assert.equal(material.amount,75);
 assert.equal(r.hoursMan,18.88);
 assert.equal(r.complete,true);
});
