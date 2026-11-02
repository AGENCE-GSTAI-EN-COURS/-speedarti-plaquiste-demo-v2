import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState, calculateEstimate } from './engine.mjs';

function priced() {
  const s=createDefaultState();
  Object.assign(s.coating,{yieldM2PerL:10,potSizeL:10,potPriceHT:50,hoursPerM2:0.1});
  s.labor.hourlyRate=50;
  return s;
}
test('métrés pièce : murs, plafond, peinture séparée',()=>{
  const r=calculateEstimate(priced());
  assert.equal(r.geometry.paintWallsM2,45);
  assert.equal(r.geometry.ceilingM2,20);
  assert.equal(r.paintAreaM2,65);
  assert.equal(r.geometry.wallpaperM2,0);
  assert.equal(r.geometry.rooms.length,1);
});
test('2 pots à acheter, pas de facturation du volume théorique',()=>{
  const r=calculateEstimate(priced()), p=r.lines.find(l=>l.id==='paint');
  assert.equal(p.theoreticalLitres,13);
  assert.equal(p.requiredLitres,14.3);
  assert.equal(p.quantity,2);
  assert.equal(p.totalHT,100);
});
test('heures-homme non divisées par le nombre d’ouvriers',()=>{
  const s=priced();s.labor.workers=2;
  const r=calculateEstimate(s);
  assert.equal(r.hoursMan,6.5);
  assert.equal(r.durationHours,3.25);
  assert.equal(r.laborHT,325);
  assert.equal(r.totalHT,425);
  assert.equal(r.vatHT,85);
  assert.equal(r.ttc,510);
});
test('ouverture déduite du mur et de la plinthe, pas du plafond',()=>{
  const s=priced();
  s.rooms[0].openings=[{type:'door',count:1,width:.9,height:2.1}];
  s.plinth.enabled=true;s.plinth.hoursPerMl=.05;
  const r=calculateEstimate(s);
  assert.equal(r.geometry.paintWallsM2,43.11);
  assert.equal(r.geometry.ceilingM2,20);
  assert.equal(r.geometry.plinthMl,17.1);
});
test('papier peint et peinture murale mutuellement exclusifs',()=>{
  const s=priced();
  s.rooms[0].wallFinish='wallpaper';
  Object.assign(s.wallpaper,{rollWidthM:.53,rollLengthM:10,rollPriceHT:25,hoursPerM2:.25});
  const r=calculateEstimate(s);
  assert.equal(r.geometry.wallpaperM2,45);
  assert.equal(r.geometry.paintWallsM2,0);
  assert.equal(r.paintAreaM2,20);
  assert.equal(r.lines.find(l=>l.id==='wallpaper').quantity,11);
});
test('pièces indépendantes et agrégation multi-pièces',()=>{
  const s=priced();
  s.rooms.push({id:'piece-2',name:'Chambre',length:3,width:3,height:2.5,wallFinish:'paint',ceiling:false,openings:[]});
  const r=calculateEstimate(s);
  assert.equal(r.geometry.paintWallsM2,75);
  assert.equal(r.geometry.ceilingM2,20);
});
test('boiseries chiffrées séparément, sans double comptage',()=>{
  const s=priced();
  Object.assign(s.woodwork,{areaM2:4,layers:2,yieldM2PerL:8,potSizeL:1,potPriceHT:15,hoursPerM2:.2});
  const r=calculateEstimate(s);
  assert.equal(r.paintAreaM2,65);
  assert.equal(r.woodworkM2,4);
  assert.equal(r.lines.find(l=>l.id==='wood-paint').quantity,2);
  assert.equal(r.hoursMan,7.3);
});
test('un prix manquant empêche un total faussement complet',()=>{
  const s=priced();s.coating.potPriceHT='';
  const r=calculateEstimate(s);
  assert.equal(r.lines.find(l=>l.id==='paint').totalHT,null);
  assert.equal(r.totalHT,null);
  assert.equal(r.complete,false);
  assert.ok(r.confirmedHT>0);
});
test('les forfaits incluent la pose : main d’œuvre non facturée deux fois',()=>{
  const s=priced();
  s.extras.push({name:'Escalier',quantity:1,unitPriceHT:700,hoursPerUnit:8});
  const r=calculateEstimate(s);
  assert.equal(r.totalHT,1125);
  assert.equal(r.laborHT,325);
  assert.equal(r.hoursMan,14.5);
});
test('préparation sans faux coût de fourniture',()=>{
  const s=priced();
  s.preparation.level='3';s.preparation.hoursPerM2=.2;
  const r=calculateEstimate(s);
  assert.equal(r.laborHT,975);
  assert.ok(r.warnings.some(w=>w.includes('consommables')));
});
test('sans rendement ou conditionnement aucun volume facturé inventé',()=>{
  const r=calculateEstimate(createDefaultState());
  assert.equal(r.totalHT,null);
  assert.equal(r.lines.find(l=>l.id==='paint').quantity,null);
  assert.ok(r.warnings.some(w=>w.includes('rendement')));
});
test('valeurs négatives, ouvertures impossibles et pièces absentes rejetées',()=>{
  const s=priced();s.rooms[0].length=-1;
  assert.throws(()=>calculateEstimate(s),/strictement positive/);
  s.rooms[0].length=5;s.rooms[0].openings=[{type:'window',width:20,height:10,count:1}];
  assert.throws(()=>calculateEstimate(s),/ouvertures supérieures/);
  s.rooms=[];
  assert.throws(()=>calculateEstimate(s),/au moins une pièce/);
});
test('TVA est un choix explicite et ne doit pas être déduite du seul âge',()=>{
  const s=priced();s.vatRate=10;
  assert.equal(calculateEstimate(s).vatHT,42.5);
  s.vatRate=7;
  assert.throws(()=>calculateEstimate(s),/TVA/);
});
