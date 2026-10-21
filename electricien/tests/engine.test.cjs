'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const env={window:{},console};
for(const file of ['catalogue-appareillage.js','catalogue-selector.js','engine-current.js']){
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),env,{filename:file,timeout:5000});
}
const E=env.window.ElectricienEngine, C=env.window.ElectricienCatalogueSelector;
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
function base(){
  return {
    installation:{type:'neuf',phase:'monophase',typeBien:'maison',surface:80,levels:1,height:2.5},
    rooms:{sejour:1,sejourSurface:30,cuisine:1,cuisineSurface:10,chambre:3,wc:1,sdb:1,hall:1,degagement:1},
    pointOverrides:{},
    appareillage:{global:{brand:'moyen',gamme:''},socketDistribution:{double:0,triple:0},families:{}},
    circuits:{socketMode:'2.5_20',four:false,laveLinge:false,laveVaisselle:false,
      secheLinge:false,chauffeEau:false,congelateur:false,priseGTL:false,
      volets:0,heatingPower:0,vmcType:'none',vmcExtraMouths:0,vmcRoof:false,bellType:'none',
      exteriorLights:0,exteriorSockets:0,exteriorDetectors:0,exteriorCommand:'aucune',
      pac:false,clim:false,gainable:false,tone:false,irve:false,pv:false},
    tableau:{rows:'',brand:'indifferent',panelReference:'REF-DEMO',panelPrice:450,
      replaceExisting:false,partialExisting:false,newMaterialPartial:false,ground:false,
      parafoudre:false,differentielTete:false,consuel:false,diagnostic:false},
    renovation:{prises:{keep:0,replace:0,move:0,create:0,remove:0},
      interrupteurs:{keep:0,replace:0,move:0,create:0,remove:0},
      luminaires:{keep:0,replace:0,move:0,create:0,remove:0},
      rj45:{keep:0,replace:0,move:0,create:0,remove:0},
      tv:{keep:0,replace:0,move:0,create:0,remove:0},
      routes:{prises:0,interrupteurs:0,luminaires:0,rj45:0,tv:0}},
    options:{complexity:'moyenne',support:'placo_neuf',accesDifficile:false},
    pricing:{hourlyRate:55},
    domotique:{}
  };
}
function renovate(){
  const s=base();s.installation.type='renovation';
  const p=E.effectivePoints(s),expected={prises:p.generalSockets+p.kitchenSockets,
    interrupteurs:p.switches,luminaires:p.lightPoints,rj45:p.rj45,tv:p.tv};
  for(const [key,total] of Object.entries(expected)) s.renovation[key].keep=total;
  return s;
}
test('catalogue 258 références',()=>assert.equal(C.items.length,258));
test('catalogue marques distinctes',()=>['Schneider Electric','Hager','Legrand'].forEach(brand=>assert(C.items.some(i=>i.brand===brand))));
test('répartition prises 18+4 doubles+2 triples=32',()=>{
  const s=base();s.appareillage.socketDistribution={double:4,triple:2};
  assert.equal(C.socketDistribution(s,32).simple,18);
  assert.equal(C.socketDistribution(s,32).valid,true);
});
test('répartition prises excessive rejetée',()=>{
  const s=base();s.appareillage.socketDistribution={double:17,triple:0};
  assert.equal(C.socketDistribution(s,32).valid,false);
});
test('familles de prises simples/doubles/triples distinctes',()=>{
  for(const k of ['priseSimple','priseDouble','priseTriple']) assert(C.choices(k).length>0,k);
});
test('appareillage indépendant par famille',()=>{
  const s=base();s.appareillage.families={
    priseSimple:{brand:'Legrand',gamme:'Dooxie',choiceId:''},
    interrupteur:{brand:'Schneider Electric',gamme:'Odace',choiceId:''},
    rj45:{brand:'Hager',gamme:'Gallery',choiceId:''}
  };
  assert.equal(C.resolve(s,'priseSimple').brand,'Legrand');
  assert.equal(C.resolve(s,'interrupteur').brand,'Schneider Electric');
  assert.equal(C.resolve(s,'rj45').brand,'Hager');
});
test('absence de composition exacte Céliane ne donne pas un prix partiel définitif',()=>{
  const s=base();s.appareillage.families={priseSimple:{brand:'Legrand',gamme:'Céliane 2024',choiceId:''}};
  assert.equal(C.resolve(s,'priseSimple').price,null);
  const r=E.calculate(s);
  assert(r.unknownMaterials.some(m=>m.name.includes('Prise')));
  assert.equal(r.pricingComplete,false);
});
test('metrés 60,80,120,221m² selon annexes',()=>{
  assert.equal(E.lengthProfileForSurface(60).prise,2.75);
  assert.equal(E.lengthProfileForSurface(80).prise,2.97);
  assert.equal(E.lengthProfileForSurface(120).prise,3.52);
  assert.equal(E.lengthProfileForSurface(221).prise,4.95);
});
test('mode neuf: métrés matériel et MO calculés',()=>{
  const r=E.calculate(base());
  assert(r.points.generalSockets>0);
  assert(r.circuits.length>0);
  assert(r.materials.some(m=>m.name.includes('H07VU')));
  assert(r.labor.hours>0);
  assert(r.knownTotal>r.materialTotal);
});
test('coffret multi-rangées sans prix précis est bloqué',()=>{
  const s=base();s.tableau.panelPrice='';s.tableau.panelReference='';
  s.tableau.rows=3;const r=E.calculate(s);
  assert(r.blockers.some(x=>x.includes('Coffret tableau')));
  assert(r.unknownMaterials.some(x=>x.category==='Tableau électrique'));
});
test('coffret exact renseigné valorisé une fois',()=>{
  const s=base();s.tableau.rows=3;s.tableau.panelPrice=575;s.tableau.panelReference='REF-575';
  const r=E.calculate(s);
  assert.equal(r.materials.filter(x=>x.articleId==='manual:coffret').length,1);
  assert.equal(r.materials.find(x=>x.articleId==='manual:coffret').price,575);
});
test('rénovation conservée : aucune prise ni commande neuve facturée',()=>{
  const r=E.calculate(renovate());
  assert(!r.materials.some(m=>m.category==='Appareillage'&&/Prise 16A|Interrupteurs/.test(m.name)));
  assert(!r.materials.some(m=>m.name.includes('Conducteurs H07VU')));
});
test('rénovation remplace deux prises : quantité achetée = 2',()=>{
  const s=renovate();s.renovation.prises.keep-=2;s.renovation.prises.replace=2;
  const r=E.calculate(s);
  assert.equal(r.materials.find(m=>m.name.includes('Prise 16A')).qty,2);
});
test('rénovation déplace une prise : pas de prise neuve, métrage ×3',()=>{
  const s=renovate();s.renovation.prises.keep--;s.renovation.prises.move=1;s.renovation.routes.prises=4;
  const r=E.calculate(s);
  assert.equal(r.materials.find(m=>m.name.includes('Conducteurs H07VU')).qty,12);
  assert(!r.materials.some(m=>m.name.includes('Prise 16A')));
});
test('rénovation : actions manquantes bloquées',()=>{
  const s=renovate();s.renovation.prises.keep=0;
  assert(E.calculate(s).blockers.some(x=>x.includes('prises : total')));
});
test('rénovation : métrage absent sur création bloqué',()=>{
  const s=renovate();s.renovation.prises.keep--;s.renovation.prises.create=1;
  assert(E.calculate(s).blockers.some(x=>x.includes('longueur réelle')));
});
test('rénovation sans remplacement tableau : disjoncteurs existants non facturés',()=>{
  const r=E.calculate(renovate());
  assert(!r.materials.some(m=>m.category==='Protection'&&m.name.startsWith('Disjoncteur')));
});
test('matériel fabricant sans modèle, prix ou longueur reste provisoire',()=>{
  const s=base();s.circuits.pac=true;
  s.circuits.pacManual={section:6,breaker:32,diff:'F',supply:'mono',materialLabel:'',materialPrice:'',route:''};
  const r=E.calculate(s);
  assert(r.blockers.some(x=>x.includes('prix matériel manquant')));
  assert(r.blockers.some(x=>x.includes('référence fabricant manquante')));
  assert(r.blockers.some(x=>x.includes('longueur réelle')));
});
test('sans taux horaire, aucun remplacement par 55',()=>{
  const s=base();s.pricing.hourlyRate=0;
  const r=E.calculate(s);
  assert.equal(r.labor.rate,0);
  assert(r.blockers.some(x=>x.includes('Taux horaire')));
});
test('extérieur non renseigné ne donne pas un devis complet',()=>{
  const s=base();s.circuits.exteriorLights=2;
  const r=E.calculate(s);
  assert(r.blockers.length>0);
  assert(r.unknownMaterials.some(m=>m.category==='Éclairage extérieur'));
});
test('extérieur avec luminaire client: pose facturée sans achat luminaire',()=>{
  const s=base(),c=s.circuits;
  c.exteriorLights=2;c.exteriorLightClientSupplied=true;c.exteriorLightRoute=11;
  c.exteriorLightSection=1.5;c.exteriorLightBreaker=16;c.exteriorLightCircuitCount=1;
  const r=E.calculate(s);
  assert(r.circuits.some(ci=>ci.name.includes('Éclairage extérieur')));
  assert(!r.materials.some(m=>m.name.includes('Luminaires extérieurs')));
  assert(r.labor.detail.some(i=>i.label.includes('Pose points lumineux extérieurs')&&i.hours===1));
});
test('audit métier non imprimé dans HTML applicatif',()=>{
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert(!/ELEC_[A-Z_]+/.test(app));
  assert(!/Balises de contrôle/.test(app));
  assert(!/catalogue-protections\.js/.test(fs.readFileSync(path.join(root,'index.html'),'utf8')));
});
test('triphasé fabricant avec références câbles et protections chiffrées',()=>{
  const s=base();s.installation.phase='triphase';s.circuits.irve=true;
  s.circuits.irveManual={section:6,breaker:32,diff:'A',supply:'3P',route:18,
    materialLabel:'BORNE-TRI',materialPrice:900,cableLabel:'R2V-5G6',cablePrice:5.5,
    protectionLabel:'DISJ-3P-32A',protectionPrice:85};
  const r=E.calculate(s);
  assert(r.materials.some(m=>m.articleId==='manual:cable-3p:IRVE'&&m.total===99));
  assert(r.materials.some(m=>m.articleId==='manual:breaker-3p:IRVE'&&m.total===85));
  assert(!r.blockers.some(m=>m.includes('IRVE triphasé')));
});
test('PAC différentielle Type F avec référence prix exacts',()=>{
  const s=base();s.circuits.pac=true;
  s.circuits.pacManual={section:2.5,breaker:20,diff:'F',supply:'mono',route:8,
    materialLabel:'PAC-MODELE',materialPrice:2000};
  s.tableau.diffFReference='DIF-F-30MA';s.tableau.diffFPrice=105;
  const r=E.calculate(s);
  const m=r.materials.find(m=>m.articleId==='manual:diff-f');
  assert(m&&m.price===105&&m.qty>=1);
  assert(!r.blockers.some(x=>x.includes('Différentiel Type F requis')));
});
test('mention selon fabricant insuffisante : différentiel requis',()=>{
  const s=base();s.circuits.pac=true;
  s.circuits.pacManual={section:2.5,breaker:20,diff:'F selon configuration',
    supply:'mono',route:8,materialLabel:'PAC-MODELE',materialPrice:2000};
  const r=E.calculate(s);
  assert(r.blockers.some(x=>x.includes('type différentiel exact')));
});
test('rénovation partielle: matériel manuel, sans coffret complet',()=>{
  const s=renovate();s.tableau.partialExisting=true;s.tableau.partialHours=4;
  s.tableau.newMaterialPartial=true;s.tableau.partialMaterialPrice=155;
  s.tableau.partialMaterialNote='DISJ-RÉNOVATION';
  const r=E.calculate(s);
  assert(r.materials.some(m=>m.articleId==='manual:tableau-partiel'&&m.price===155));
  assert(!r.materials.some(m=>m.articleId==='manual:coffret'));
});
test('au-delà de 40 circuits : palier de temps bloqué',()=>{
  const s=base();s.pointOverrides.generalSockets=600;
  const r=E.calculate(s);
  assert(r.blockers.some(x=>x.includes("s'arrête à 40 circuits")));
});

test('simple, va-et-vient et éclairage 3 points personnalisables indépendamment',()=>{
  const s=base();
  s.pointOverrides={simple:3,vv:2,three:1};
  const p=E.effectivePoints(s);
  assert.equal(p.simple,3);
  assert.equal(p.vv,2);
  assert.equal(p.three,1);
  assert.equal(p.lightPoints,6+E.computeAutoPoints(s).extraLight);
  assert.equal(p.switches,10);
  const r=E.calculate(s);
  assert.equal(r.points.switches,10);
  assert(r.materials.some(m=>m.name.includes('Interrupteurs / commandes')&&m.qty===10));
});
test('changer va-et-vient modifie câblage, main d’oeuvre et prix',()=>{
  const s1=base();s1.pointOverrides={simple:3,vv:0,three:1};
  const s2=base();s2.pointOverrides={simple:3,vv:2,three:1};
  const r1=E.calculate(s1),r2=E.calculate(s2);
  assert.equal(r2.points.lightPoints-r1.points.lightPoints,2);
  assert.equal(r2.points.switches-r1.points.switches,4);
  assert(r2.labor.hours>r1.labor.hours);
  const cableQty=r=>r.materials.filter(m=>m.name.includes('Conducteurs H07VU')).reduce((sum,m)=>sum+m.qty,0);
  assert(cableQty(r2)>cableQty(r1));
  assert(r2.knownTotal>r1.knownTotal);
});
test('zéro est un réglage manuel valide et vide restitue AUTO',()=>{
  const s=base(),auto=E.computeAutoPoints(s);
  s.pointOverrides={simple:0,vv:0,three:0};
  assert.equal(E.effectivePoints(s).switches,0);
  s.pointOverrides={simple:"",vv:null,three:null};
  assert.equal(E.effectivePoints(s).switches,auto.switches);
  assert.equal(E.effectivePoints(s).lightPoints,auto.lightPoints);
});
test('répartition détaillée prend le pas sur anciennes corrections globales',()=>{
  const s=base();
  s.pointOverrides={lightPoints:100,switches:200,simple:1,vv:1,three:1};
  const p=E.effectivePoints(s);
  assert.equal(p.switches,6);
  assert.equal(p.lightPoints,3+E.computeAutoPoints(s).extraLight);
});
test('VMC simple flux 3 bouches incluses sans supplément',()=>{
  const s=base();s.circuits.vmcType='auto';s.circuits.vmcExtraMouths=0;
  const vmc=E.vmcMouthsFor(s),r=E.calculate(s);
  assert.equal(vmc.included,3);
  assert.equal(vmc.extraAuto,0);
  assert.equal(vmc.total,3);
  assert(r.fixed.rows.some(x=>x.label.includes('3 bouches comprises')&&x.price===600));
  assert(!r.fixed.rows.some(x=>x.label.includes('supplémentaire')));
});
test('VMC plus de WC/SDB : surplus automatique 115€ par bouche',()=>{
  const s=base();s.circuits.vmcType='hygro';s.rooms.wc=2;s.rooms.sdb=2;
  const vmc=E.vmcMouthsFor(s),r=E.calculate(s);
  assert.equal(vmc.extraAuto,2);
  assert.equal(vmc.total,5);
  assert.equal(vmc.extraPrice,230);
  assert(r.fixed.rows.some(x=>x.label.includes('composition')&&x.price===230));
  assert.equal(r.fixed.rows.filter(x=>x.label.includes('VMC')||x.label.includes('composition')).reduce((x,y)=>x+y.price,0),1030);
});
test('VMC salle d eau remplace salle de bains sans bouche en plus',()=>{
  const s=base();s.circuits.vmcType='auto';s.rooms.sdb=0;s.rooms.sde=1;
  assert.equal(E.vmcMouthsFor(s).extraAuto,0);
  assert.equal(E.vmcMouthsFor(s).total,3);
});
test('VMC extras manuels s ajoutent au surplus automatique sans double comptage',()=>{
  const s=base();s.circuits.vmcType='auto';s.rooms.sde=1;s.circuits.vmcExtraMouths=1;
  const v=E.vmcMouthsFor(s),r=E.calculate(s);
  assert.equal(v.extraAuto,1);
  assert.equal(v.extraManual,1);
  assert.equal(v.total,5);
  assert.equal(v.extraPrice,230);
  assert.equal(r.fixed.rows.filter(x=>x.label.includes('bouche(s)')).reduce((sum,x)=>sum+x.price,0),230);
});
test('VMC désactivée : aucune bouche facturée même si des extras sont enregistrés',()=>{
  const s=base();s.circuits.vmcType='none';s.circuits.vmcExtraMouths=3;
  assert.equal(E.vmcMouthsFor(s).total,0);
  assert.equal(E.calculate(s).fixed.rows.filter(x=>x.label.includes('VMC')||x.label.includes('bouche(s)')).length,0);
});
console.log('OK '+passed+' contrôles moteur');