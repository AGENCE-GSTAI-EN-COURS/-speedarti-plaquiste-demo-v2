import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CATALOGUE_MACON, catalogueCandidatesForLine, resolveCatalogueProduct, genericRebarPricePerKg
} from './catalogue-macon.js';
import {
  STEPS, defaultState, newElement, renderMode, renderWorks, renderConfig, renderOptions, renderPrices, renderVerification, renderResult, renderStep,
  calculate, validateStep, assertBalisage,
  WORKS, WORK_BY_ID, FIBRES, PREFAB_H_PER_ML, TRUCK_8X4_DEFAULT, TRACE_TARGETS,
  TREILLIS_GUILLAUME, PUMP_DEFAULT_PRICE, TOUPIE_PRICE_M3, TOUPIE_MIN_BILLABLE_M3, TOUPIE_CAPACITY_M3,
  PREFAB_DEFAULT_PRICE_M2, LONGRINE_PRICE_ML, micropileSuggestedPrice, estimatedVerticalChainage, toupieEstimatedCount, DEMO_SPEEDARTI_CONTEXT, detectVatContext, effectiveVatRate, projectSummary, resultCostBreakdown, MASONRY_DEFAULTS, MORTAR_SITE_PARPAING_20, masonryRatio, roundMoney
} from './core.js';
import { SpeedArtiAngelMaconKnowledge, searchAngelMacon, answerAngelMacon, buildAngelMaconContext } from './angel-knowledge.js';
import { SPEEDARTI_MACON_INTEGRATION_VERSION, SPEEDARTI_MACON_CONNECTORS, buildSpeedArtiMaconPayload, getIntegrationReadiness } from './speedarti-integration.js';

const pass=[];
function test(name,fn){try{fn();pass.push(name)}catch(e){console.error(`FAIL — ${name}`);throw e}}
function base(){const s=defaultState();s.globals.hourly=50;s.globals.vat=20;s.globals.workers=2;s.globals.concreteClass='C25/30';return s;}
function fillRequiredPrices(s){const r=calculate(s);for(const l of r.missingPrices)s.manualPrices[l.id]=10;return calculate(s)}
function qty(r,id){const l=r.lines.find(x=>x.id===id);return l?.qty??null}
const STAIR_WORK_IDS=new Set(['escalier_ba','paillasse_escalier','palier_ba']);
const ACTIVE_WORKS=WORKS.filter(w=>!STAIR_WORK_IDS.has(w.id));

test('référentiel Guillaume: 40 ouvrages',()=>assert.equal(WORKS.length,40));
test('camion-benne 8x4 = 800 € HT/j',()=>assert.equal(TRUCK_8X4_DEFAULT,800));
test('préfabriqué 1,55 / 1,90 / 2,75 h-homme/ml',()=>assert.deepEqual(PREFAB_H_PER_ML,{standard:1.55,hauteur_importante:1.9,lourd_complexe:2.75}));
test('fibres: plages validées',()=>{
  assert.deepEqual([FIBRES.courante.min,FIBRES.courante.max],[3,4]);
  assert.deepEqual([FIBRES.renforcee.min,FIBRES.renforcee.max],[5,6]);
  assert.deepEqual([FIBRES.fortement_sollicitee.min,FIBRES.fortement_sollicitee.max],[7,9]);
  assert.deepEqual([FIBRES.metallique_structurelle.min,FIBRES.metallique_structurelle.max],[20,40]);
});

test('select dalle persiste après rerender',()=>{
  const s=base();s.simpleType='dalle';s.simple.slabRef='dalle_pleine_ba';s.simple.surface=10;s.simple.thickness=20;
  const html=renderConfig(s);assert.match(html,/<option value="dalle_pleine_ba" selected>/);
});
test('select matériau mur persiste après rerender',()=>{
  const s=base();s.simpleType='murs';s.simple.material='brique';
  const html=renderOptions(s);assert.match(html,/<option value="brique" selected>/);
});
test('select préfabriqué persiste après rerender',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_porteurs');e.data.method='prefabrique';e.data.prefabType='lourd_complexe';e.data.length=10;e.data.height=3;e.data.thickness=20;s.elements=[e];
  const html=renderConfig(s);assert.match(html,/<option value="lourd_complexe" selected>/);
});
test('select plot volume total persiste après rerender',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');e.data.foundationType='plot_isole';e.data.plotVolumeMode='total';s.elements=[e];
  assert.match(renderConfig(s),/<option value="total" selected>/);
});

test('Annexe 1 expose tous les ouvrages actifs mais aucun escalier',()=>{
  const s=base();s.mode='multiple';const e=newElement('ouvrage_ba');s.elements=[e];const html=renderConfig(s);
  for(const w of ACTIVE_WORKS)assert.ok(html.includes(`value="${w.id}"`),`ouvrage inaccessible: ${w.id}`);
  for(const id of STAIR_WORK_IDS)assert.ok(!html.includes(`value="${id}"`),`escalier encore accessible: ${id}`);
});

test('balisage: aucun contrôle orphelin sur parcours représentatifs',()=>{
  const states=[];
  let s=base();states.push([renderMode,s]);states.push([renderWorks,s]);
  s=base();s.simpleType='murs';s.simple={...s.simple,length:10,height:2.5,thickness:20,blocksPerM2:10,wallHPerM2:0.8,openings:[{width:1,height:2,associated:'linteau_ba_courant'}],material:'brique',method:'tradi',chainH:true,chainHml:10};states.push([renderConfig,s]);states.push([renderOptions,s]);
  s=base();s.simpleType='dalle';s.simple={...s.simple,surface:10,thickness:12,slabRef:'dallage_arme',treillis:true,fibres:true,fibreType:'renforcee',fibreDose:5.5};states.push([renderConfig,s]);states.push([renderOptions,s]);
  s=base();s.mode='multiple';
  const f=newElement('fondations');f.data.foundationType='vide_sanitaire';f.data.perimeter=20;f.data.blockHeight=.2;f.data.rows=3;f.data.blocksPerM2=10;f.data.wallHPerM2=.8;f.data.footingWidthCm=50;f.data.footingHeightCm=30;f.data.refendLength=5;f.data.refendHeight=.6;f.data.refendBlocksPerM2=10;f.data.refendHoursPerM2=.8;
  const w=newElement('murs_elevations');Object.assign(w.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',blocksPerM2:10,mortarKgM2:20,wallHPerM2:.8,openings:[{type:'linteau_ba_courant',width:1,height:2,lintelLength:1.2}],beams:[{length:3,widthCm:20,heightCm:30,ref:'poutre_ba_courante'}],pignons:[{width:5,slope:30}],waterproof:'delta_ms',decoration:'genoise_simple',antiTermite:true});
  const p=newElement('murs_porteurs');Object.assign(p.data,{length:10,height:3,thickness:20,method:'prefabrique',prefabType:'standard',prefabPriceM2:350,braceQty:1,bracePrice:50,braceHours:.5});
  const d=newElement('dalle');Object.assign(d.data,{length:5,width:2,thickness:12,slabRef:'dallage_arme',treillis:true,fibres:true,fibreType:'courante',fibreDose:3.5});
  const c=newElement('cheminee');Object.assign(c.data,{height:5,count:1,conduit:'20x30',stack:'simple',stackCount:1,cap:'standard',capCount:1});
  const b=newElement('ouvrage_ba');Object.assign(b.data,{workRef:'radier_general',quantity:2});
  s.elements=[f,w,p,d,c,b];states.push([renderConfig,s]);states.push([renderOptions,s]);
  for(const [renderer,st] of states)assert.equal(assertBalisage(renderer(st)),true);
});

test('semelle m × cm × cm = 1,8 m³',()=>{
  const s=base();s.simpleType='fondations';Object.assign(s.simple,{foundationRef:'semelle_filante',length:10,widthCm:60,heightCm:30});
  const r=calculate(s);assert.ok(Math.abs(qty(r,'simple-foundation-beton')-1.8)<1e-9);
});

test('dalle simple et multi: parité physique',()=>{
  const a=base();a.simpleType='dalle';Object.assign(a.simple,{surface:10,thickness:12,slabRef:'dallage_arme',treillis:true});const ra=calculate(a);
  const b=base();b.mode='multiple';const e=newElement('dalle');Object.assign(e.data,{length:5,width:2,thickness:12,slabRef:'dallage_arme',treillis:true});b.elements=[e];const rb=calculate(b);
  const ac=ra.lines.find(x=>x.name.includes('Béton')&&x.category==='Béton').qty;
  const bc=rb.lines.find(x=>x.name.includes('Béton')&&x.category==='Béton').qty;
  const as=ra.lines.find(x=>x.category==='Ferraillage').qty;
  const bs=rb.lines.find(x=>x.category==='Ferraillage').qty;
  assert.equal(ac,bc);assert.equal(as,bs);assert.equal(ra.hours,rb.hours);
});

test('prix catalogue automatique: aucun prix personnel requis pour continuer',()=>{
  const s=base();s.simpleType='murs';Object.assign(s.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,wallHPerM2:.8,material:'parpaing'});
  const r=calculate(s);const blocks=r.lines.find(x=>x.id.startsWith('simple-wall-block'));
  assert.ok(blocks.price>0);assert.equal(blocks.source,'Catalogue Maçon SpeedArti — sélection automatique');
  assert.equal(r.missingPrices.length,0);assert.equal(r.canFinalize,true);assert.equal(validateStep(s,4),'');
  const html=renderPrices(s);assert.match(html,/Sélection automatique SpeedArti/);assert.match(html,/Prix HT personnel \//);
});

test('génoise sélectionnée exige désormais un prix HT/ml explicite',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30',decoration:'genoise_simple'});s.elements=[e];
  const r=calculate(s);assert.ok(r.alerts.some(a=>/Génoise simple.*prix HT\/ml obligatoire/i.test(a)));assert.equal(r.canFinalize,false);
});

test('options visibles ont une case prix immédiate',()=>{
  const s=base();s.globals.earthworks=true;s.globals.backfill=true;s.globals.scaffold=true;s.globals.finishCoat=true;s.globals.waterproofCoat=true;s.globals.pump=true;s.globals.toupie=true;
  const h=renderOptions(s);
  for(const key of ['earthworksPrice','backfillPrice','scaffoldPrice','finishCoatPrice','waterproofCoatPrice','pumpPrice','toupiePrice'])assert.ok(h.includes(`data-global="${key}"`),`champ prix absent ${key}`);
});

test('camion-benne modifiable et mémorisable dans UI',()=>{
  const s=base();s.globals.truck=true;const h=renderOptions(s);assert.ok(h.includes('data-global="truckPrice"'));assert.ok(h.includes('data-global="saveTruckPrice"'));
});

test('v2.5 préfabriqué: 350 €/m² modifiable, pose planning non refacturée',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_porteurs');Object.assign(e.data,{length:10,height:3,thickness:20,method:'prefabrique',prefabType:'standard'});s.elements=[e];
  let r=calculate(s),l=r.lines.find(x=>x.id===`${e.id}-prefab`);assert.equal(l.qty,30);assert.equal(l.unit,'m²');assert.equal(l.price,350);assert.equal(r.hours,15.5);assert.equal(r.laborCost,0);
  e.data.prefabPriceM2=420;r=calculate(s);l=r.lines.find(x=>x.id===`${e.id}-prefab`);assert.equal(l.price,420);
});

test('cheminée: conduit/souche/chapeau ont quantités indépendantes',()=>{
  const s=base();s.simpleType='cheminee';Object.assign(s.simple,{height:5,count:2,conduit:'20x20',stack:'simple',stackCount:2,cap:'standard',capCount:2,foyer:'insert'});
  const r=calculate(s);assert.equal(qty(r,'simple-chimney-conduit'),10);assert.equal(qty(r,'simple-chimney-stack'),2);assert.equal(qty(r,'simple-chimney-cap'),2);
  assert.equal(r.hours,10*.75+2*3.5+2*1);
});

test('cheminée: temps validé modifiable',()=>{
  const s=base();s.simpleType='cheminee';Object.assign(s.simple,{height:5,count:1,conduit:'20x20',stack:'',stackCount:0,cap:'',capCount:0,chimneyOverrides:{conduit:{'20x20':{hours:.8}}}});
  assert.equal(calculate(s).hours,4);
});

test('ouvrage BA: ratios Guillaume modifiables',()=>{
  const s=base();s.mode='multiple';const e=newElement('ouvrage_ba');Object.assign(e.data,{workRef:'radier_general',quantity:2,refOverrides:{radier_general:{acierParUnite:70}}});s.elements=[e];
  const r=calculate(s);const steel=r.lines.find(x=>x.id===`${e.id}-generic-acier`);assert.equal(steel.qty,140);
});

test('ouverture déduite + linteau traité séparément',()=>{
  const s=base();s.simpleType='murs';Object.assign(s.simple,{length:10,height:3,thickness:20,blocksPerM2:10,wallHPerM2:1,material:'parpaing',openings:[{width:1,height:2,associated:'linteau_ba_courant'}]});
  const r=calculate(s);const blocks=r.lines.find(x=>x.id.startsWith('simple-wall-block'));assert.equal(blocks.qty,280);assert.ok(r.lines.some(x=>x.id.includes('linteau_ba_courant-beton')));
});

test('escalier retiré du parcours simple et multi',()=>{
  const simple=renderWorks(base());assert.ok(!/Escalier/.test(simple));
  const s=base();s.mode='multiple';const multi=renderWorks(s);assert.ok(!/Escalier/.test(multi));assert.equal(newElement('escalier'),null);
});


test('les ouvrages Annexe 1 actifs sont calculables, pas seulement affichés',()=>{
  for(const w of ACTIVE_WORKS){
    const s=base();s.mode='multiple';const e=newElement('ouvrage_ba');Object.assign(e.data,{workRef:w.id,quantity:1});s.elements=[e];
    const r=calculate(s);assert.equal(r.hours,w.moHParUnite,`MO ${w.id}`);
    if(w.betonParUnite>0)assert.equal(r.lines.find(x=>x.id===`${e.id}-generic-beton`).qty,w.betonParUnite,`béton ${w.id}`);
    if(w.acierParUnite>0)assert.equal(r.lines.find(x=>x.id===`${e.id}-generic-acier`).qty,w.acierParUnite,`acier ${w.id}`);
    if(w.coffrageParUnite>0)assert.equal(r.lines.find(x=>x.id===`${e.id}-generic-coffrage`).qty,w.coffrageParUnite,`coffrage ${w.id}`);
  }
});

test('balisage couvre aussi l’étape Prix / catalogue',()=>{
  const s=base();s.simpleType='murs';Object.assign(s.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,wallHPerM2:.8,material:'parpaing'});
  assert.equal(assertBalisage(renderPrices(s)),true);
});

test('cheminée prix manuel: heures conservées au planning, pas de double facturation',()=>{
  const s=base();s.simpleType='cheminee';Object.assign(s.simple,{height:5,count:1,conduit:'20x20',stack:'simple',stackCount:1,cap:'standard',capCount:1,manualPrice:1500});
  const r=calculate(s);assert.ok(r.hours>0);assert.equal(r.laborCost,0);assert.equal(r.materials,1500);
});

test('contrôle productivité béton reste informatif et ne double pas les heures',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:10,thickness:12,slabRef:'dallage_arme'});s.globals.concreteControlMode='betonniere';
  const r=calculate(s);assert.equal(r.hours,7.5);assert.ok(r.reco.some(x=>x.includes('Contrôle productivité bétonnière')));
});

test('option fondation sélectionnée produit une ligne au prix explicite',()=>{
  const s=base();s.simpleType='fondations';Object.assign(s.simple,{foundationRef:'semelle_filante',length:10,widthCm:60,heightCm:30});s.globals.foundationOptions.etudeSol={enabled:true,qty:1,unit:'forfait',price:500};
  const r=calculate(s);const l=r.lines.find(x=>x.id==='foundation-option-etudeSol');assert.equal(l.price,500);assert.equal(l.qty,1);
});

test('pignon ajoute sa surface sans coefficient silencieux',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',blocksPerM2:10,wallHPerM2:1,pignons:[{width:5,slope:40}]});s.elements=[e];
  const r=calculate(s);const blocks=r.lines.find(x=>x.id.startsWith(`${e.id}-blocks`));
  // pignon 5 m, pente 40 % => surface 2,5 m²
  assert.equal(blocks.qty,275);assert.equal(r.labor.find(x=>x.name===e.name).hours,27.5);
});

test('poutre BA détaillée utilise longueur × section et référentiel',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');Object.assign(e.data,{length:1,height:1,thickness:20,material:'parpaing',method:'tradi',blocksPerM2:1,wallHPerM2:1,beams:[{length:3,widthCm:20,heightCm:30,ref:'poutre_ba_courante'}]});s.elements=[e];
  const r=calculate(s);const concrete=r.lines.find(x=>x.id===`${e.id}-beam-0-beton`);assert.ok(Math.abs(concrete.qty-.18)<1e-9);
});

test('aucun ancien taux horaire / coefficient silencieux réintroduit',()=>{
  const src=fs.readFileSync(new URL('./core.js',import.meta.url),'utf8');
  for(const bad of ['tauxHoraire ?? 48','52 €/h','coefComplexite','×1.20','prixParUnit: Record'])assert.ok(!src.includes(bad),`ancienne valeur/règle détectée: ${bad}`);
});


test('catalogue Maçon neutre: 227 articles et aucune enseigne source exposée',()=>{
  assert.equal(CATALOGUE_MACON.length,227);
  const txt=JSON.stringify(CATALOGUE_MACON).toLowerCase();
  assert.ok(!/point\s*\.?\s*p/i.test(txt));
});

test('catalogue: parpaing 20 cm propose des articles de 20 cm',()=>{
  const line={id:'simple-wall-block-parpaing-20',name:'parpaing 20 cm',category:'Maçonnerie',qty:280,unit:'unité'};
  const c=catalogueCandidatesForLine(line,8);
  assert.ok(c.length>0);
  assert.ok(c.some(x=>/500x200x200/i.test(x.produit)));
});

test('catalogue: tarif au cent converti en prix unitaire sans multiplication erronée',()=>{
  const line={id:'x',name:'parpaing 20 cm',category:'Maçonnerie',qty:280,unit:'unité'};
  const r=resolveCatalogueProduct(line,'6271640');
  assert.equal(r.compatible,true);
  assert.ok(Math.abs(r.lineUnitPrice-0.9642)<1e-9);
  assert.ok(Math.abs(r.total-269.976)<1e-6);
});

test('catalogue: mortier 112 kg arrondi au conditionnement de 25 kg',()=>{
  const line={id:'x',name:'Mortier traditionnel',category:'Liants',qty:112,unit:'kg'};
  const r=resolveCatalogueProduct(line,'4117438');
  assert.equal(r.compatible,true);
  assert.equal(r.orderQty,5);
  assert.equal(r.packContent,25);
  assert.ok(Math.abs(r.total-41.6)<1e-9);
});

test('catalogue: Delta protection au m² converti directement',()=>{
  const line={id:'x',name:'Delta MS',category:'Étanchéité',qty:30,unit:'m²'};
  const r=resolveCatalogueProduct(line,'1191154');
  assert.equal(r.compatible,true);
  assert.equal(r.lineUnitPrice,6.25);
  assert.equal(r.total,187.5);
});

test('catalogue: sélection article alimente le prix du chiffrage',()=>{
  const s=base();s.simpleType='murs';
  Object.assign(s.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,wallHPerM2:.8,material:'parpaing'});
  let r=calculate(s);
  const blocks=r.lines.find(x=>x.id.startsWith('simple-wall-block'));
  s.catalogSelections[blocks.id]='6271640';
  r=calculate(s);
  const priced=r.lines.find(x=>x.id===blocks.id);
  assert.equal(priced.source,'Catalogue Maçon SpeedArti');
  assert.ok(priced.price>0);
});

test('catalogue: prix personnel reste prioritaire sur article sélectionné',()=>{
  const s=base();s.simpleType='murs';
  Object.assign(s.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,wallHPerM2:.8,material:'parpaing'});
  let r=calculate(s);
  const blocks=r.lines.find(x=>x.id.startsWith('simple-wall-block'));
  s.catalogSelections[blocks.id]='6271640';
  s.manualPrices[blocks.id]=1.25;
  r=calculate(s);
  const priced=r.lines.find(x=>x.id===blocks.id);
  assert.equal(priced.source,'prix personnel / cent');
  assert.equal(priced.manualOrderUnitPrice,1.25);
  assert.equal(Number((priced.qty*priced.price).toFixed(2)),3.13);
});

test('catalogue: conversion incompatible ne crée jamais un prix silencieux',()=>{
  const line={id:'x',name:'Béton C25/30',category:'Béton',qty:1.2,unit:'m³'};
  const r=resolveCatalogueProduct(line,'3608102');
  assert.equal(r.compatible,false);
});

test('interface Prix/catalogue contient le sélecteur article et reste balisée',()=>{
  const s=base();s.simpleType='murs';
  Object.assign(s.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,wallHPerM2:.8,material:'parpaing'});
  const html=renderPrices(s);
  assert.match(html,/Catalogue Maçon SpeedArti/);
  assert.match(html,/catalogSelections\./);
  assert.equal(assertBalisage(html),true);
});

test('aucune mention enseigne source dans les fichiers Git Maçon',()=>{
  const files=['core.js','app.js','catalogue-macon.js','README.md','tests.mjs','index.html'];
  for(const f of files){
    const src=fs.readFileSync(new URL(`./${f}`,import.meta.url),'utf8');
    assert.ok(!/point\s*\.?\s*p/i.test(src),`mention interdite dans ${f}`);
  }
});


test('FIX capture: une ligne Béton de chaînage ne propose jamais une armature',()=>{
  const line={id:'chain-h-beton',name:'Béton C25/30 — Chaînage horizontal',category:'Béton',qty:.30,unit:'m³',catalogRole:'concrete'};
  const c=catalogueCandidatesForLine(line,8);
  assert.ok(c.every(p=>p.famille!=='Aciers / armatures'));
  assert.equal(resolveCatalogueProduct(line,'3483173').compatible,false);
});

test('FIX capture: coffrage en m² propose uniquement panneaux/contreplaqué compatibles',()=>{
  const line={id:'chain-h-coffrage',name:'Coffrage — Chaînage horizontal',category:'Coffrage',qty:4.8,unit:'m²',catalogRole:'coffrage_surface'};
  const c=catalogueCandidatesForLine(line,8);
  assert.ok(c.length>0);
  for(const p of c){
    const txt=`${p.typeArticle} ${p.produit}`;
    assert.ok(!/clavette|fourche|accessoire/i.test(txt),`accessoire proposé: ${txt}`);
    assert.equal(resolveCatalogueProduct(line,p.referenceCatalogue).compatible,true);
  }
  assert.equal(resolveCatalogueProduct(line,'7460524').compatible,false);
});

test('FIX capture: acier chaînage horizontal conserve le besoin ml et exclut linteaux/semelles',()=>{
  const s=base();s.simpleType='murs';
  Object.assign(s.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,wallHPerM2:.8,material:'parpaing',chainH:true,chainHml:12});
  const r=calculate(s);
  const steel=r.lines.find(x=>x.id==='simple-chain-h-acier');
  assert.ok(steel);
  assert.equal(steel.qty,36);
  assert.equal(steel.catalogNeedQty,12);
  assert.equal(steel.catalogNeedUnit,'ml');
  const c=catalogueCandidatesForLine(steel,8);
  assert.ok(c.length>0);
  for(const p of c){
    const txt=`${p.typeArticle} ${p.produit}`;
    assert.ok(/cha[iî]nage/i.test(txt),`pas un chaînage: ${txt}`);
    assert.ok(!/linteau|semelle|poteau|treillis/i.test(txt),`mauvais sous-type: ${txt}`);
  }
});

test('FIX capture: 12 ml de chaînage L6m donnent 2 pièces sans inventer un poids par barre',()=>{
  const line={id:'chain-h-acier',name:'Acier indicatif — Chaînage horizontal',category:'Ferraillage',qty:36,unit:'kg',catalogNeedQty:12,catalogNeedUnit:'ml'};
  const r=resolveCatalogueProduct(line,'1762230');
  assert.equal(r.compatible,true);
  assert.equal(r.orderQty,2);
  assert.equal(r.packContent,6);
  assert.ok(Math.abs(r.total-234.44)<1e-9);
  assert.ok(Math.abs(r.lineUnitPrice-(234.44/36))<1e-12);
});

test('FIX capture: aucune armature sismique/zone n’est proposée automatiquement sans zone chantier',()=>{
  const line={id:'chain-h-acier',name:'Acier indicatif — Chaînage horizontal',category:'Ferraillage',qty:36,unit:'kg',catalogNeedQty:12,catalogNeedUnit:'ml'};
  const c=catalogueCandidatesForLine(line,20);
  const refs=new Set(c.map(p=>String(p.referenceCatalogue)));
  for(const ref of ['3483173','4474341','1109185'])assert.equal(refs.has(ref),false,`référence zone proposée: ${ref}`);
});

test('FIX capture: ancienne sélection catalogue incompatible n’est plus affichée comme sélection active',()=>{
  const s=base();s.simpleType='murs';
  Object.assign(s.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,wallHPerM2:.8,material:'parpaing',chainH:true,chainHml:12});
  let r=calculate(s);
  const concrete=r.lines.find(x=>x.id==='simple-chain-h-beton');
  assert.ok(concrete);
  s.catalogSelections[concrete.id]='3483173';
  const html=renderPrices(s);
  // La référence peut exister ailleurs dans le catalogue source JS, mais ne doit pas être une option de cette ligne.
  const row=html.split('<tr').find(x=>x.includes('Béton C25/30 — Chaînage horizontal'))||'';
  assert.ok(!row.includes('value="3483173" selected'));
  assert.ok(row.includes('Aucun article catalogue compatible'));
});



test('FIX audit humain: dalle associée micro-pieux affiche épaisseur, treillis et fibres',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');
  Object.assign(e.data,{foundationType:'micro_pieux',microSlabSurface:30,slabRef:'dallage_arme',thickness:12,fibres:true,fibreType:'courante',fibreDose:3.5});s.elements=[e];
  const html=renderConfig(s);
  assert.match(html,/Épaisseur réelle dalle associée/);
  assert.match(html,/data-field="thickness"[^>]*data-trace="associatedSlabThickness"/);
  assert.match(html,/data-field="treillis"[^>]*data-trace="slabTreillis"/);
  assert.match(html,/data-field="fibres"[^>]*data-trace="slabFibres"/);
  assert.match(html,/data-field="fibreDose"[^>]*data-trace="fibreDose"/);
  assert.equal(assertBalisage(html),true);
});

test('FIX audit humain: dalle associée VS et terre-plein affiche une épaisseur saisissable',()=>{
  for(const foundationType of ['vide_sanitaire','terre_plein']){
    const s=base();s.mode='multiple';const e=newElement('fondations');
    Object.assign(e.data,{foundationType,slabSurface:80,slabRef:'dallage_arme',thickness:15,perimeter:40,footingWidthCm:40,footingHeightCm:30});s.elements=[e];
    const html=renderConfig(s);
    assert.match(html,/Épaisseur réelle dalle associée/);
    assert.match(html,/data-trace="associatedSlabThickness"/);
    assert.equal(assertBalisage(html),true);
  }
});

test('FIX audit humain: dalle associée micro-pieux calcule le volume réel avec épaisseur saisie',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');
  Object.assign(e.data,{foundationType:'micro_pieux',microCount:4,microDepth:4,microPrice:500,microSlabSurface:30,slabRef:'dallage_arme',thickness:12});s.elements=[e];
  const r=calculate(s);
  const concrete=r.lines.find(l=>l.id.includes('dalle VS-concrete'));
  assert.ok(concrete,'ligne béton dalle associée absente');
  assert.ok(Math.abs(concrete.qty-3.6)<1e-9);
  assert.ok(!r.alerts.some(a=>/dalle VS : surface et épaisseur obligatoires/.test(a)));
});

test('FIX audit humain: dalle associée gère treillis et fibres comme la dalle principale',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');
  Object.assign(e.data,{foundationType:'vide_sanitaire',perimeter:40,blockHeight:.2,rows:2,blocksPerM2:10,wallHPerM2:.5,footingWidthCm:40,footingHeightCm:30,slabSurface:80,slabRef:'dallage_arme',thickness:15,treillis:true,fibres:true,fibreType:'courante',fibreDose:3.5});s.elements=[e];
  const r=calculate(s);
  const steel=r.lines.find(l=>l.id.includes('dalle associée-steel'));
  const fibre=r.lines.find(l=>l.id.includes('dalle associée-fibres'));
  assert.ok(steel,'treillis dalle associée absent');
  assert.equal(steel.catalogNeedQty,80);
  assert.equal(steel.catalogNeedUnit,'m²');
  assert.ok(fibre,'fibres dalle associée absentes');
  assert.ok(Math.abs(fibre.qty-(80*.15*3.5))<1e-9);
});

test('FIX audit humain: isolation plancher VS a un prix explicite et une seule ligne',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');
  Object.assign(e.data,{foundationType:'vide_sanitaire',perimeter:40,blockHeight:.2,rows:2,footingWidthCm:40,footingHeightCm:30,foundationConcreteClass:'C25/30',slabSurface:80,slabRef:'dallage_arme',slabConcreteClass:'C25/30',thickness:15,slabInsulation:'avec_isolant',slabInsulationPriceM2:25});s.elements=[e];
  const r=calculate(s),rows=r.lines.filter(l=>l.id===`${e.id}-vs-insulation`);
  assert.equal(rows.length,1);assert.equal(rows[0].price,25);assert.equal(rows[0].qty,80);
});

test('FIX balisage absolu: navigation Précédent/Suivant et retours métiers sont balisés',()=>{
  const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
  assert.match(html,/id="prevBtn"[^>]*data-trace="wizardPrev"/);
  assert.match(html,/id="nextBtn"[^>]*data-trace="wizardNext"/);
  assert.equal((html.match(/data-trace="returnTrades"/g)||[]).length,2);
  assert.equal(assertBalisage(html),true);
});

test('FIX balisage absolu: anciennes traces mortes supprimées',()=>{
  assert.equal(Object.hasOwn(TRACE_TARGETS,'elements'),false);
  assert.equal(Object.hasOwn(TRACE_TARGETS,'priceSource'),false);
  assert.equal(TRACE_TARGETS.associatedSlabThickness,'quantity');
});



test('FIX audit humain: fibres béton proposent des conditionnements catalogue compatibles',()=>{
  const line={id:'slab-fibres',name:'Fibres — Dalle courante / limitation fissuration',category:'Ferraillage',qty:12.6,unit:'kg'};
  const c=catalogueCandidatesForLine(line,8);
  assert.ok(c.length>0,'aucune fibre catalogue proposée');
  assert.ok(c.every(p=>p.famille==='Fibres béton'));
  assert.ok(c.every(p=>!/lamelle|carbone/i.test(`${p.typeArticle} ${p.produit}`)));
  const r=resolveCatalogueProduct(line,c[0].referenceCatalogue);
  assert.equal(r.compatible,true);
  assert.ok(r.orderQty>0);
});


test('FIX v2.4: cheminée simple conserve count=1 sans interaction utilisateur',()=>{
  const s=defaultState();
  s.mode='simple';
  s.simpleType='cheminee';
  s.simple.height=5;
  assert.equal(s.simple.count,1,'Le nombre de conduits affiché par défaut doit exister dans le state.');
  const r=calculate(s);
  assert.equal(qty(r,'simple-chimney-conduit'),5,'5 ml × 1 conduit doivent être calculés sans toucher au champ count.');
  assert.ok(!r.alerts.some(a=>a.includes('Nombre de conduits obligatoire')),'Aucune alerte count ne doit apparaître lorsque la valeur affichée par défaut est 1.');
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(app,/function resetSimple\(\)\{\s*state\.simple=\{openings:\[\],refOverrides:\{\},chimneyOverrides:\{\},count:1,wallKind:'mur',concreteClass:''\};/,'Changer de type simple doit restaurer count=1 dans le vrai state UI.');
});


test('v2.5: la classe béton globale n’est plus affichée au début',()=>{
  const s=base();const html=renderMode(s);assert.ok(!html.includes('data-global="concreteClass"'));assert.ok(!html.includes('Classe béton'));
});

test('v2.5: un nouveau chiffrage demande la classe béton au niveau ouvrage',()=>{
  const s=defaultState();s.globals.hourly=50;s.globals.vat=20;s.simpleType='fondations';Object.assign(s.simple,{foundationRef:'semelle_filante',length:10,widthCm:50,heightCm:30});
  const html=renderConfig(s);assert.match(html,/data-simple="concreteClass"/);
  const r=calculate(s);assert.ok(r.alerts.some(a=>a.includes('Classe béton obligatoire')));
});

test('v2.5: deux ouvrages peuvent utiliser deux classes béton différentes',()=>{
  const s=base();s.globals.concreteClass='';s.mode='multiple';
  const a=newElement('dalle');Object.assign(a.data,{length:5,width:2,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30'});
  const b=newElement('ouvrage_ba');Object.assign(b.data,{workRef:'radier_general',quantity:1,concreteClass:'C30/37'});
  s.elements=[a,b];const r=calculate(s);
  assert.ok(r.lines.some(l=>l.name.includes('Béton C25/30')&&l.id.includes('Dalle-concrete')));
  assert.ok(r.lines.some(l=>l.name.includes('Béton C30/37')&&l.id===`${b.id}-generic-beton`));
  assert.ok(!r.alerts.some(a=>a.includes('Classe béton obligatoire')));
});

test('v2.5: soubassement propose seulement blocs 20/25 cm et hauteur totale calculée',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');Object.assign(e.data,{foundationType:'vide_sanitaire',blockHeight:.25,rows:4});s.elements=[e];
  const html=renderConfig(s);assert.match(html,/value="0\.20"/);assert.match(html,/value="0\.25" selected/);assert.match(html,/1,00 m/);
});

test('v2.5: terre-plein exclut poutrelles-hourdis et prédalles',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');e.data.foundationType='terre_plein';s.elements=[e];
  const html=renderConfig(s);assert.ok(!html.includes('value="plancher_poutrelles_hourdis"'));assert.ok(!html.includes('value="plancher_predalles"'));
  assert.ok(html.includes('value="dallage_arme"'));
});

test('v2.5: treillis Guillaume ST25C chiffré au m² avec temps de pose',()=>{
  assert.equal(TREILLIS_GUILLAUME.ST25C.priceM2,4.2);
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:10,thickness:12,slabRef:'dallage_arme',treillis:true,treillisType:'ST25C'});
  const r=calculate(s),l=r.lines.find(x=>x.id==='Dalle-steel');assert.equal(l.qty,10);assert.equal(l.unit,'m²');assert.equal(l.price,4.2);
  assert.ok(r.labor.some(x=>x.name.includes('Pose treillis ST25C')&&Math.abs(x.hours-1.2)<1e-9));
});

test('v2.5: micropieux prix proposé par profondeur et aucune MO doublée',()=>{
  assert.equal(micropileSuggestedPrice(4),600);assert.equal(micropileSuggestedPrice(7),900);assert.equal(micropileSuggestedPrice(22),5000);
  const s=base();s.mode='multiple';const e=newElement('fondations');Object.assign(e.data,{foundationType:'micro_pieux',microCount:4,microDepth:7});s.elements=[e];
  const r=calculate(s),l=r.lines.find(x=>x.id===`${e.id}-micro`);assert.equal(l.price,900);assert.equal(l.qty,4);assert.equal(r.hours,0);assert.equal(r.laborCost,0);
});

test('v2.5: longrine 135 €/ml séparée des micropieux sans double coût matériaux/MO',()=>{
  assert.equal(LONGRINE_PRICE_ML,135);
  const s=base();s.mode='multiple';const e=newElement('fondations');Object.assign(e.data,{foundationType:'micro_pieux',microCount:2,microDepth:4,beamLength:10,beamWidthCm:20,beamHeightCm:30,longrineConcreteClass:'C25/30'});s.elements=[e];
  const r=calculate(s),pack=r.lines.find(x=>x.id===`${e.id}-longrine-package`);assert.equal(pack.qty,10);assert.equal(pack.price,135);
  assert.ok(r.lines.some(x=>x.id.includes('longrine-included-beton')&&x.priceMode==='included'));
  assert.ok(r.labor.some(x=>x.name.includes('longrine planning')&&x.includedInManual));
});

test('v2.5: béton banché propose coulé sur place / préfabriqué, pas collé/traditionnel',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');Object.assign(e.data,{material:'beton_banche',method:'coule_sur_place'});s.elements=[e];
  const html=renderConfig(s);assert.match(html,/value="coule_sur_place" selected/);assert.match(html,/value="prefabrique"/);assert.ok(!html.includes('>Collé<'));assert.ok(!html.includes('>Traditionnel<'));
});

test('v2.5: chaînage vertical Guillaume est une estimation de ratios modifiable',()=>{
  assert.equal(estimatedVerticalChainage(10,2.5),7.5);
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');Object.assign(e.data,{length:10,height:2.5,material:'parpaing'});s.elements=[e];
  const html=renderConfig(s);assert.match(html,/Estimation réalisée à partir de ratios Guillaume/);assert.match(html,/value="7\.5"/);
});

test('v2.5: camion pompe 950 € par défaut',()=>{
  assert.equal(PUMP_DEFAULT_PRICE,950);const s=base();s.globals.pump=true;const r=calculate(s);const l=r.lines.find(x=>x.id==='pump');assert.equal(l.price,950);
});

test('v2.5: toupie 190 €/m³, minimum 6 m³ et capacité 7 m³',()=>{
  assert.equal(TOUPIE_PRICE_M3,190);assert.equal(TOUPIE_MIN_BILLABLE_M3,6);assert.equal(TOUPIE_CAPACITY_M3,7);assert.equal(toupieEstimatedCount(7),1);assert.equal(toupieEstimatedCount(8),2);
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:20,thickness:10,slabRef:'dallage_non_arme'});s.globals.toupie=true;s.globals.toupieMode='auto_volume';
  const r=calculate(s),l=r.lines.find(x=>x.id==='toupie');assert.equal(l.qty,6);assert.equal(l.price,190);assert.equal(l.qty*l.price,1140);
});

test('v2.5: toupie au-dessus du minimum facture le volume réel',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:70,thickness:10,slabRef:'dallage_non_arme'});s.globals.toupie=true;s.globals.toupieMode='auto_volume';
  const r=calculate(s),l=r.lines.find(x=>x.id==='toupie');assert.equal(l.qty,7);assert.equal(l.qty*l.price,1330);assert.ok(r.reco.some(x=>x.includes('1 camion')));
});

test('v2.5: dosage fibre reste explicite dans le moteur et l’UI',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:10,thickness:12,slabRef:'dallage_arme',fibres:true,fibreType:'courante',fibreDose:3.5});
  assert.match(renderOptions(s),/data-simple="fibreDose"/);const r=calculate(s);assert.ok(Math.abs(qty(r,'Dalle-fibres')-4.2)<1e-9);
});

test('v2.5: Murs / Cloisons qualifie mur ou cloison non porteuse',()=>{
  const s=base();s.simpleType='murs';const html=renderConfig(s);assert.match(html,/data-simple="wallKind"/);assert.match(html,/Cloison non porteuse/);
});


test('Angèle Maçon: base chargée avec ouvrages actifs hors escalier',()=>{
  assert.equal(SpeedArtiAngelMaconKnowledge.metier,'macon');
  assert.equal(SpeedArtiAngelMaconKnowledge.version,'MAC-ANGEL-KB-v1.6');
  const entries=SpeedArtiAngelMaconKnowledge.entries.filter(e=>e.topic==='ouvrage');assert.equal(entries.length,ACTIVE_WORKS.length);
  for(const id of STAIR_WORK_IDS)assert.ok(!entries.some(e=>e.sourceId===id));
});

test('Angèle Maçon: recherche ouvrage utilise le référentiel réel',()=>{
  const hits=searchAngelMacon('semelle filante beton acier coffrage main oeuvre',5);
  assert.ok(hits.some(e=>e.sourceId==='semelle_filante'));
});

test('Angèle Maçon: toupie répond avec prix minimum et capacité',()=>{
  const a=answerAngelMacon('prix toupie minimum capacité');
  assert.match(a,/190/);
  assert.match(a,/6 m³/);
  assert.match(a,/7 m³/);
});

test('Angèle Maçon: micro-pieux ne deviennent jamais un dimensionnement',()=>{
  const a=answerAngelMacon('micro pieu profondeur dimensionnement');
  assert.match(a,/jamais/i);
  assert.match(a,/dimensionn/i);
});

test('Angèle Maçon: sécurité structurelle disponible à l’interrogation',()=>{
  const a=answerAngelMacon('dimensionnement structurel charges');
  assert.match(a,/ne constituent en aucun cas un calcul réel de structure/i);
});


test('v2.6 audit toupie',()=>{const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:50,thickness:15,slabRef:'dallage_arme',concreteClass:'C25/30'});s.globals.toupie=true;const r=calculate(s),c=r.lines.find(x=>x.category==='Béton'&&x.unit==='m³');assert.equal(c.priceMode,'included');assert.equal(c.source,'inclus dans la fourniture toupie');});
test('v2.6 audit beton ref',()=>{const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:20,thickness:10,slabRef:'dallage_non_arme',concreteClass:'C25/30'});assert.equal(calculate(s).lines.find(x=>x.category==='Béton').price,190);});
test('v2.6 audit acier ref',()=>{assert.ok(genericRebarPricePerKg()>0);});
test('v2.6 audit ouvrages actifs prix',()=>{for(const w of ACTIVE_WORKS){const s=base();s.mode='multiple';const e=newElement('ouvrage_ba');Object.assign(e.data,{workRef:w.id,quantity:1,concreteClass:'C25/30'});s.elements=[e];assert.equal(calculate(s).missingPrices.length,0,w.id)}});
test('v2.6 audit catalogue inconnu',()=>{assert.equal(catalogueCandidatesForLine({id:'decor',name:'génoise simple',category:'Décoration extérieure',qty:10,unit:'ml'},8).length,0);});
test('v2.6 audit Angel hors sujet',()=>{assert.equal(searchAngelMacon('prix d une grue mobile 60 tonnes',3).length,0);assert.equal(searchAngelMacon('quel dosage de mortier réfractaire pour un barbecue',3).length,0);});
test('v2.6 audit Angel structure',()=>{assert.match(answerAngelMacon('quel ferraillage pour une poutre de 6 mètres'),/ne doit jamais proposer seule/i);});
test('v2.6 audit UI',()=>{const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8'),html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');assert.match(app,/scrollTo/);assert.ok(!/v2\.5/i.test(html));});

test('v2.6 fibre vide ne bloque plus la fin du chiffrage',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:10,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30',fibres:true,fibreType:'courante',fibreDose:''});
  const r=calculate(s),fibre=r.lines.find(x=>x.id==='Dalle-fibres');
  assert.ok(fibre);assert.ok(Math.abs(fibre.qty-(10*.12*3))<1e-9);
  assert.ok(!r.alerts.some(a=>/dosage fibres obligatoire/i.test(a)));
  assert.equal(validateStep(s,4),'');
  assert.ok(r.reco.some(x=>/3 kg\/m³/.test(x)&&/prérempli automatiquement/i.test(x)));
});

test('v2.6 fibre renforcée vide utilise 5 kg/m³',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:10,thickness:10,slabRef:'dallage_arme',concreteClass:'C25/30',fibres:true,fibreType:'renforcee',fibreDose:''});
  const r=calculate(s),fibre=r.lines.find(x=>x.id==='Dalle-fibres');
  assert.ok(Math.abs(fibre.qty-5)<1e-9);
});

test('v2.6 UI fibre préremplit automatiquement le minimum',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:10,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30',fibres:true,fibreType:'courante',fibreDose:''});
  assert.match(renderOptions(s),/data-simple="fibreDose"[^>]*value="3"/);
});


test('sprint UX: paramètres entreprise cachés et contexte démo stable',()=>{
  const s=defaultState(),html=renderMode(s);
  assert.equal(DEMO_SPEEDARTI_CONTEXT.hourly,50);
  assert.equal(DEMO_SPEEDARTI_CONTEXT.workers,1);
  assert.equal(s.globals.hourly,50);
  assert.equal(s.globals.workers,1);
  assert.ok(!/Taux horaire Maçon HT/.test(html));
  assert.ok(!/TVA chantier/.test(html));
  assert.ok(!/Nombre d['’]ouvriers/.test(html));
  assert.equal(validateStep(s,0),'');
});

test('sprint UX: anciens états sans paramètres visibles utilisent les valeurs démo',()=>{
  const s=defaultState();s.globals.hourly='';s.globals.vat='';s.globals.workers='';
  s.simpleType='dalle';Object.assign(s.simple,{surface:10,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30'});
  const r=calculate(s);
  assert.equal(r.hourly,50);assert.equal(r.workers,1);assert.equal(r.vat,20);
  assert.ok(!r.alerts.some(x=>/taux horaire|taux de TVA|nombre d.ouvriers/i.test(x)));
});


test('sprint TVA: détection neuf / rénovation / énergétique',()=>{
  assert.equal(detectVatContext({workType:'neuf'}).rate,20);
  assert.equal(detectVatContext({workType:'renovation',housingOver2Years:'non'}).rate,20);
  assert.equal(detectVatContext({workType:'renovation',housingOver2Years:'oui',ecoRenovation:'non'}).rate,10);
  assert.equal(detectVatContext({workType:'renovation',housingOver2Years:'oui',ecoRenovation:'oui'}).rate,5.5);
});

test('sprint TVA: vérification bloque seulement tant que le contexte TVA manque',()=>{
  const s=base();s.step=5;s.simpleType='dalle';Object.assign(s.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30'});
  assert.match(validateStep(s,5),/Type de travaux/i);
  s.taxContext={workType:'renovation',housingOver2Years:'',ecoRenovation:'non'};assert.match(validateStep(s,5),/Âge du logement/i);
  s.taxContext.housingOver2Years='oui';assert.equal(validateStep(s,5),'');
  assert.equal(effectiveVatRate(s),10);
});

test('sprint TVA: écran vérification résume, permet retour et affiche la toupie minimum',()=>{
  const s=base();s.step=5;s.simpleType='dalle';Object.assign(s.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30'});s.globals.toupie=true;s.taxContext={workType:'neuf',housingOver2Years:'',ecoRenovation:'non'};
  const html=renderVerification(s);
  assert.match(html,/Vérification du chiffrage/);assert.match(html,/Dallage \/ Dalle/);
  assert.match(html,/3,60 m³ nécessaires/);assert.match(html,/minimum facturé 6,00 m³/);
  assert.match(html,/data-jump-step="3"/);assert.match(html,/TVA proposée : 20,0 %/);
  assert.equal(assertBalisage(html),true);
});

test('sprint TVA: taux qualifié alimente réellement le résultat',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:10,thickness:10,slabRef:'dallage_non_arme',concreteClass:'C25/30'});
  s.taxContext={workType:'renovation',housingOver2Years:'oui',ecoRenovation:'non'};
  const r=calculate(s);assert.equal(r.vat,10);assert.ok(Math.abs(r.tax-r.totalHT*.10)<1e-9);
  s.taxContext.ecoRenovation='oui';assert.equal(calculate(s).vat,5.5);
});

test('sprint TVA: le wizard contient Vérification avant Résultat',()=>{
  assert.equal(STEPS?.[5]??'Vérification','Vérification');
  const s=base();s.step=5;s.taxContext={workType:'neuf',housingOver2Years:'',ecoRenovation:'non'};
  assert.match(renderStep(s),/Vérification du chiffrage/);
});


test('sprint UX prix: fibres génériques ne prennent plus un prix catalogue non validé automatiquement',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30',fibres:true,fibreType:'courante',fibreDose:3});
  const r=calculate(s),f=r.lines.find(x=>x.id==='Dalle-fibres');
  assert.ok(Math.abs(f.qty-10.8)<1e-9);assert.equal(f.price,0);assert.equal(f.source,'prix à confirmer');assert.ok(r.missingPrices.some(x=>x.id==='Dalle-fibres'));assert.equal(r.canFinalize,true);
});
test('sprint UX prix: une référence fibre choisie manuellement peut encore valoriser le poste',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30',fibres:true,fibreType:'courante',fibreDose:3});s.catalogSelections['Dalle-fibres']='4482123';
  const f=calculate(s).lines.find(x=>x.id==='Dalle-fibres');assert.ok(f.price>0);assert.equal(f.catalogueSelection,'4482123');assert.equal(f.automaticCatalogue,false);
});
test('sprint UX prix: écran catalogue masque les détails techniques par défaut',()=>{
  const s=base();s.simpleType='murs';Object.assign(s.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,wallHPerM2:.8,material:'parpaing'});
  const html=renderPrices(s);assert.match(html,/Voir \/ modifier le produit/);assert.match(html,/Modifier le prix/);assert.match(html,/<details class="catalog-details">/);
});
test('sprint UX toupie: résultat explique besoin réel et minimum fournisseur',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30'});s.globals.toupie=true;
  assert.match(calculate(s).lines.find(x=>x.id==='toupie').name,/3,60 m³ nécessaires, minimum facturé 6,00 m³/);
});
test('sprint UX résultat: ventilation matériaux transport options reste égale au total fournitures',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30'});s.globals.toupie=true;s.globals.scaffold=true;s.globals.scaffoldQty=1;s.globals.scaffoldPrice=100;
  const r=calculate(s),b=resultCostBreakdown(r);assert.ok(Math.abs((b.materials+b.transport+b.options)-r.materials)<1e-9);assert.ok(b.transport>0);assert.ok(b.options>0);
  const html=renderResult(s);assert.match(html,/Transport \/ livraison HT/);assert.match(html,/Options \/ prestations HT/);
});
test('sprint UX saisie: champs numériques sont optimisés mobile et scroll cible le wizard',()=>{
  const s=base();s.simpleType='dalle';const html=renderConfig(s),app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(html,/inputmode="decimal"/);assert.match(app,/\.select\(\)/);assert.match(app,/scrollIntoView/);assert.match(app,/requestAnimationFrame/);
});


test('sprint raccordements: tous les points SpeedArti sont préparés',()=>{
  assert.equal(SPEEDARTI_MACON_INTEGRATION_VERSION,'MACON-INTEGRATION-v1');
  for(const id of ['parametres','catalogue','stocks','client','chantier','satellite','calepinage','historique','devis','tva','angel']){
    assert.equal(SPEEDARTI_MACON_CONNECTORS[id]?.status,'prepared',id);
  }
  assert.equal(getIntegrationReadiness().length,11);
});

test('sprint raccordements: payload conserve unités, prix, sources, MO et TVA',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:20,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30'});s.taxContext={workType:'renovation',housingOver2Years:'oui',ecoRenovation:'non'};
  const r=calculate(s),p=buildSpeedArtiMaconPayload(s,r);
  assert.equal(p.metier,'maçon');assert.equal(p.tva.taux,10);assert.equal(p.totaux.total_ht,r.totalHT);
  assert.equal(p.main_oeuvre.heures_homme,r.hours);assert.ok(p.lignes.length>0);
  assert.ok(p.lignes.every(x=>typeof x.quantite==='number'&&typeof x.unite==='string'&&'source_prix' in x));
});

test('sprint raccordements: contrat reste sans connexion production',()=>{
  const src=fs.readFileSync(new URL('./speedarti-integration.js',import.meta.url),'utf8');
  assert.ok(!/supabase\s*\./i.test(src));assert.ok(!/createClient\s*\(/i.test(src));assert.ok(!/https?:\/\//i.test(src));
  assert.match(src,/prepared-not-connected/);
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');assert.match(app,/speedarti-integration\.js/);
});


test('sprint Angèle: contexte courant expose étape, prix, TVA et sources',()=>{
  const s=base();s.step=5;s.simpleType='dalle';Object.assign(s.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30',fibres:true,fibreType:'courante',fibreDose:3});s.globals.toupie=true;s.taxContext={workType:'renovation',housingOver2Years:'oui',ecoRenovation:'non'};
  const r=calculate(s),ctx=buildAngelMaconContext(s,r);
  assert.equal(ctx.stepLabel,'Vérification');assert.equal(ctx.vat,10);assert.ok(ctx.lines.some(x=>x.id==='toupie'));assert.ok(ctx.missingPrices.some(x=>x.id==='Dalle-fibres'));
  assert.ok(ctx.lines.every(x=>'source' in x&&'unit' in x));
});

test('sprint Angèle: explique la toupie avec les valeurs du chiffrage courant',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30'});s.globals.toupie=true;
  const r=calculate(s),a=answerAngelMacon('Pourquoi la toupie facture 6 m3 ?',buildAngelMaconContext(s,r));
  assert.match(a,/3,60 m³/);assert.match(a,/6,00 m³/);assert.match(a,/ne sont pas refacturées/i);
});

test('sprint Angèle: explique une fibre à confirmer sans inventer un prix',()=>{
  const s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30',fibres:true,fibreType:'courante',fibreDose:3});
  const r=calculate(s),a=answerAngelMacon('Quel est le prix des fibres ?',buildAngelMaconContext(s,r));
  assert.match(a,/10,80 kg/);assert.match(a,/à confirmer/i);
});

test('sprint Angèle: contexte n’affaiblit jamais la protection structurelle',()=>{
  const s=base();const r=calculate(s),ctx=buildAngelMaconContext(s,r);
  const a=answerAngelMacon('quel ferraillage pour une poutre de 6 mètres',ctx);
  assert.match(a,/ne constituent en aucun cas un calcul réel de structure/i);assert.match(a,/ne doit jamais proposer seule/i);
});

test('sprint Angèle: la démo publie le contexte courant à chaque rendu',()=>{
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(app,/SpeedArtiAngelMaconContext/);assert.match(app,/buildContext\(state,calculate\(state\)\)/);
});


test('sprint S6: bindEvents utilise la collection pour les champs numériques',()=>{
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(app,/\$\$\('input\[type="number"\]'\)\.forEach/);
  assert.ok(!app.split('\n').some(l=>/^\s*\$\('input\[type="number"\]'\)\.forEach/.test(l)));
});


test('sprint S6: toutes les collections utilisent $',()=>{
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  const bad=app.split('\n').filter(l=>/^\s*\$\([^)]*\)\.forEach/.test(l));
  assert.deepEqual(bad,[]);
  assert.match(app,/\$\$\('\[data-mode\]'\)\.forEach/);
});


test('S6.1 mur élévation expose la classe béton pour chaînages et BA',()=>{
  const s=base();s.globals.concreteClass='';s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi'});s.elements=[e];
  const html=renderConfig(s);
  assert.match(html,/Classe béton — chaînages \/ ouvrages BA/);
  assert.match(html,/data-field="concreteClass"/);
  assert.match(validateStep(s,2),/Classe béton obligatoire/i);
  e.data.concreteClass='C25/30';
  assert.equal(validateStep(s,2),'');
});

test('S6.1 parpaing utilise les ratios préremplis sans blocage',()=>{
  assert.deepEqual(MASONRY_DEFAULTS.parpaing,{blocksPerM2:10,wallHPerM2:0.8});
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30'});s.elements=[e];
  assert.equal(masonryRatio(e.data,'blocksPerM2'),10);
  assert.equal(masonryRatio(e.data,'wallHPerM2'),0.8);
  const r=calculate(s);
  assert.ok(!r.alerts.some(a=>/consommation blocs|temps de pose/i.test(a)));
  const blockLine=r.lines.find(x=>x.id.startsWith(e.id+'-blocks'));
  assert.equal(blockLine.qty,250);
  const html=renderConfig(s);
  assert.ok(!/Consommation blocs \(u\/m²\)|Temps pose \(h-homme\/m²\)|Réglages métier avancés — maçonnerie/.test(html));
});

test('S6.1 autres matériaux ne reçoivent pas le ratio parpaing',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'brique',method:'tradi',concreteClass:'C25/30'});s.elements=[e];
  assert.equal(masonryRatio(e.data,'blocksPerM2'),0);
  assert.match(validateStep(s,2),/référentiel interne SpeedArti indisponible/i);
});

test('S6.1 cheminée sélectionnée avec quantité 0 est signalée',()=>{
  const s=base();s.simpleType='cheminee';
  Object.assign(s.simple,{height:5,count:1,conduit:'20x20',stack:'simple',stackCount:0,cap:'standard',capCount:0});
  const r=calculate(s);
  assert.ok(r.alerts.some(a=>/Souche sélectionnée/i.test(a)));
  assert.ok(r.alerts.some(a=>/Chapeau sélectionné/i.test(a)));
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(app,/path==='stack'/);assert.match(app,/obj\.stackCount=1/);assert.match(app,/obj\.capCount=1/);
});

test('S6.1 cheminée quantités à 1 restent chiffrées',()=>{
  const s=base();s.simpleType='cheminee';
  Object.assign(s.simple,{height:5,count:1,conduit:'20x20',stack:'simple',stackCount:1,cap:'standard',capCount:1});
  const r=calculate(s);
  assert.equal(qty(r,'simple-chimney-stack'),1);
  assert.equal(qty(r,'simple-chimney-cap'),1);
  assert.ok(r.canFinalize);
});

test('S6.1 arrondis : TTC égale HT arrondi + TVA arrondie',()=>{
  const s=base();s.simpleType='fondations';
  Object.assign(s.simple,{foundationRef:'semelle_filante',length:20,widthCm:50,heightCm:30,concreteClass:'C25/30'});
  s.taxContext={workType:'neuf',housingOver2Years:'',ecoRenovation:'non'};
  const r=calculate(s);
  assert.equal(r.totalHT,roundMoney(r.materials+r.laborCost));
  assert.equal(r.tax,roundMoney(r.totalHT*.20));
  assert.equal(r.ttc,roundMoney(r.totalHT+r.tax));
});

test('S6.1 simple mur affiche la classe béton quand un ouvrage BA la nécessite',()=>{
  const s=base();s.simpleType='murs';
  Object.assign(s.simple,{length:10,height:2.5,thickness:20,material:'parpaing',openings:[{width:1,height:1,associated:'linteau_ba_courant'}]});
  assert.match(renderOptions(s),/Classe béton — ouvrages BA \/ chaînages/);
});

test('S6.1 Angèle connaît les nouvelles règles',()=>{
  assert.equal(SpeedArtiAngelMaconKnowledge.version,'MAC-ANGEL-KB-v1.6');
  for(const q of ['ratio parpaing','classe béton chaînage mur','quantité souche chapeau','arrondi TTC TVA'])assert.ok(searchAngelMacon(q,5).length>0,q);
});


test('S6.3 linteau vendu à la pièce : 1 pièce et non kg × prix pièce',()=>{
  const line={id:'x-linteau-acier',name:'Acier indicatif — Linteau BA courant',category:'Ferraillage',qty:4.8,unit:'kg',catalogNeedQty:1.2,catalogNeedUnit:'ml',catalogRole:'linteau'};
  const r=resolveCatalogueProduct(line,'1880758');
  assert.ok(r.compatible);assert.equal(r.orderQty,1);assert.equal(r.orderUnit,'pièce');assert.equal(r.total,54);assert.equal(r.product.prixArtisanHt,54);
});

test('S6.3 linteau supérieur à 6 m commande plusieurs pièces',()=>{
  const line={id:'x-linteau-acier',name:'Acier indicatif — Linteau BA courant',category:'Ferraillage',qty:28.8,unit:'kg',catalogNeedQty:7.2,catalogNeedUnit:'ml',catalogRole:'linteau'};
  const r=resolveCatalogueProduct(line,'1880758');
  assert.ok(r.compatible);assert.equal(r.orderQty,2);assert.equal(r.total,108);
});

test('S6.3 mortier traditionnel parpaing 20 = ciment + sable, aucun mortier prêt',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30'});s.elements=[e];
  const r=calculate(s);
  const cement=r.lines.find(x=>x.id===e.id+'-mortar-cement');
  const sand=r.lines.find(x=>x.id===e.id+'-mortar-sand');
  assert.ok(cement);assert.ok(sand);
  assert.equal(cement.qty,25*MORTAR_SITE_PARPAING_20.cementKgPerM2);
  assert.equal(sand.qty,25*MORTAR_SITE_PARPAING_20.sandM3PerM2);
  assert.ok(!r.lines.some(x=>/Mortier traditionnel/i.test(x.name)));
});

test('S6.3 ciment catalogue est conditionné en sacs et sable en big-bag/volume',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30'});s.elements=[e];
  const r=calculate(s),cement=r.lines.find(x=>x.id===e.id+'-mortar-cement'),sand=r.lines.find(x=>x.id===e.id+'-mortar-sand');
  assert.ok(cement.catalogueResolution?.compatible);assert.ok(cement.catalogueResolution.orderQty>=1);
  assert.ok(sand.catalogueResolution?.compatible);assert.ok(sand.catalogueResolution.orderQty>=1);
});

test('S6.3 résultat affiche prix par unité de vente réelle du catalogue',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30',openings:[{type:'linteau_ba_courant',width:1.2,height:1,lintelLength:1.2}]});s.elements=[e];
  const html=renderResult(s);
  assert.match(html,/Commande : 1 pièce\(s\)/);assert.match(html,/54,00/);
});

test('S6.3 Angèle connaît mortier chantier et conditionnement fournisseur',()=>{
  assert.equal(SpeedArtiAngelMaconKnowledge.version,'MAC-ANGEL-KB-v1.6');
  assert.ok(searchAngelMacon('ciment sable mortier chantier parpaing',5).length>0);
  assert.ok(searchAngelMacon('armature linteau vendue à la pièce',5).length>0);
});


test('S6.4 navigation : réouverture toujours étape 1 et étape non persistée',()=>{
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(app,/state\.step=0/);
  assert.match(app,/delete snapshot\.step/);
  assert.match(app,/data-step-nav/);
  assert.match(app,/\$\$\('\[data-step-nav\]'\)/);
});

test('S6.4 UX : ratios internes murs invisibles pour artisan',()=>{
  const s=base();s.simpleType='murs';Object.assign(s.simple,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi'});
  const simple=renderConfig(s);
  for(const txt of ['Consommation blocs (u/m²)','Temps de pose (h-homme/m²)','Ciment mortier chantier (kg/m²)','Sable 0/4 mortier chantier (m³/m²)','Réglages métier avancés'])assert.ok(!simple.includes(txt),txt);
  s.mode='multiple';const e=newElement('murs_elevations');Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30'});s.elements=[e];
  const multi=renderConfig(s);
  for(const txt of ['Consommation blocs (u/m²)','Temps pose (h-homme/m²)','Ciment mortier chantier (kg/m²)','Sable 0/4 mortier chantier (m³/m²)','Réglages métier avancés — maçonnerie'])assert.ok(!multi.includes(txt),txt);
});

test('S6.4 moteur : ratios internes parpaing restent actifs sans champs artisan',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30'});s.elements=[e];
  const r=calculate(s);
  assert.equal(r.lines.find(x=>x.id.startsWith(e.id+'-blocks')).qty,250);
  assert.equal(r.labor.find(x=>x.name===e.name).hours,20);
  assert.ok(r.lines.some(x=>x.id===e.id+'-mortar-cement'));
  assert.ok(r.lines.some(x=>x.id===e.id+'-mortar-sand'));
  assert.ok(!r.alerts.some(a=>/référentiel interne SpeedArti indisponible/i.test(a)));
});

test('S6.4 fondations : soubassement et refend n’exposent plus leurs ratios et utilisent SpeedArti',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');
  Object.assign(e.data,{foundationType:'vide_sanitaire',perimeter:20,blockHeight:.2,rows:2,footingWidthCm:40,footingHeightCm:30,foundationConcreteClass:'C25/30',refendLength:5,refendHeight:1,refendStiffeners:0});s.elements=[e];
  const html=renderConfig(s);
  for(const txt of ['Consommation blocs (u/m²)','Temps mur (h-homme/m²)','Blocs refend (u/m²)','Temps refend (h-homme/m²)','Réglages métier avancés — soubassement','Réglages métier avancés — refend'])assert.ok(!html.includes(txt),txt);
  const r=calculate(s);
  assert.equal(r.lines.find(x=>x.id===e.id+'-basement-blocks').qty,80);
  assert.equal(r.lines.find(x=>x.id===e.id+'-refend-blocks').qty,50);
  assert.ok(!r.alerts.some(a=>/consommation blocs\/m² soubassement|temps mur soubassement|consommation blocs\/m² refend|temps refend/i.test(a)));
});

test('S6.4 Angèle connaît la règle ratios internes et navigation',()=>{
  assert.equal(SpeedArtiAngelMaconKnowledge.version,'MAC-ANGEL-KB-v1.6');
  assert.ok(searchAngelMacon('consommation par m2 donnée interne SpeedArti artisan',5).length>0);
  assert.ok(searchAngelMacon('réouverture étape 1 navigation retour',5).length>0);
});


test('S6.5 refend : semelle sous refend calculée et explicitement tracée',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');
  Object.assign(e.data,{foundationType:'vide_sanitaire',perimeter:20,blockHeight:.2,rows:2,footingWidthCm:50,footingHeightCm:30,foundationConcreteClass:'C25/30',refendLength:5,refendHeight:1,refendFootingWidthCm:40,refendFootingHeightCm:25});s.elements=[e];
  const r=calculate(s),beton=r.lines.find(l=>l.id===e.id+'-refend-foot-beton');
  assert.ok(beton);assert.ok(Math.abs(beton.qty-.5)<1e-9);assert.ok(r.reco.some(x=>/semelle sous refend/i.test(x)));
});

test('S6.5 seuil BA : hauteur de baie non demandée',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30',openings:[{type:'seuil_ba',width:1.2,height:2}]});s.elements=[e];
  const html=renderConfig(s);assert.ok(!html.includes('Hauteur ouverture (m)'));const r=calculate(s);
  assert.equal(r.lines.find(l=>l.id.includes('seuil_ba-beton')).qty,.036);
  assert.equal(r.lines.find(l=>l.id.startsWith(e.id+'-blocks')).qty,250);
});

test('S6.5 coffres tunnels brique/résine : visibles et chiffrés au ml',()=>{
  for(const type of ['coffre_tunnel_brique','coffre_tunnel_resine']){
    const s=base();s.mode='multiple';const e=newElement('murs_elevations');
    Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30',openings:[{type,width:1.5,coffrePriceMl:40}]});s.elements=[e];
    const html=renderConfig(s);assert.match(html,/Coffre tunnel brique/);assert.match(html,/Coffre tunnel résine/);assert.match(html,/Prix HT \/ ml coffre/);
    const r=calculate(s),line=r.lines.find(l=>l.id.includes(type));assert.ok(line);assert.equal(line.qty,1.5);assert.equal(line.price,40);
  }
});

test('S6.5 isolation plancher : prix obligatoire et repris au total',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');
  Object.assign(e.data,{foundationType:'vide_sanitaire',perimeter:20,blockHeight:.2,rows:2,footingWidthCm:50,footingHeightCm:30,foundationConcreteClass:'C25/30',slabSurface:20,slabRef:'dallage_arme',slabConcreteClass:'C25/30',thickness:12,slabInsulation:'avec_isolant'});s.elements=[e];
  assert.match(renderConfig(s),/Prix isolation HT \/ m²/);assert.ok(calculate(s).alerts.some(a=>/prix isolation plancher VS obligatoire/i.test(a)));
  e.data.slabInsulationPriceM2=30;const r=calculate(s),line=r.lines.find(l=>l.id===e.id+'-vs-insulation');assert.equal(line.price,30);assert.equal(line.qty,20);
});

test('S6.5 génoise : prix HT/ml visible et calculé',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30',decoration:'genoise_double',decorationPriceMl:55});s.elements=[e];
  assert.match(renderConfig(s),/Prix génoise HT \/ ml/);const r=calculate(s),line=r.lines.find(l=>l.id===e.id+'-decor-genoise_double');assert.equal(line.qty,10);assert.equal(line.price,55);
});

test('S6.5 mobile : saisies numériques ne forcent plus le rerender global',()=>{
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(app,/data-global.*bindDataField\(el,state\.globals,el\.dataset\.global,false\)/);
  assert.match(app,/dynamicNumberPaths/);
  assert.ok(!app.includes("bindDataField(el,state.globals,el.dataset.global,true)"));
});

test('S6.5 escalier : anciens états nettoyés et accès indirect verrouillé',()=>{
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(app,/filter\(e=>e\.type!=='escalier'\)/);
  const s=base();s.mode='multiple';const e=newElement('ouvrage_ba');Object.assign(e.data,{workRef:'escalier_ba',quantity:1,concreteClass:'C25/30'});s.elements=[e];
  const r=calculate(s);assert.ok(r.alerts.some(a=>/Escalier retiré du module Maçon/i.test(a)));
});

test('S6.5 Angèle connaît le retour Guillaume pré-prod',()=>{
  assert.equal(SpeedArtiAngelMaconKnowledge.version,'MAC-ANGEL-KB-v1.6');
  assert.ok(searchAngelMacon('semelle sous refend coffre tunnel isolation génoise mobile',5).some(x=>x.id==='MAC-S65-RETOUR-GUILLAUME'));
});


test('S6.6 ouvertures : appui sans hauteur, linteau simplifié, talonnette forfaitaire',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30',
    openings:[
      {type:'appui_fenetre_ba',width:1.2},
      {type:'linteau_ba',lintelLength:1.5,lintelRef:'linteau_ba_renforce'},
      {type:'talonnette_manuelle',quantity:2,manualPrice:150}
    ]});s.elements=[e];
  const html=renderConfig(s);
  assert.ok(!/Appui fenêtre BA[\s\S]{0,800}Hauteur ouverture/.test(html));
  assert.match(html,/Longueur linteau \(ml\)/);assert.match(html,/Référence linteau/);
  assert.match(html,/Nombre de talonnettes/);assert.match(html,/150/);
  const r=calculate(s),tal=r.lines.find(l=>l.id.includes('talonnette'));
  assert.equal(tal.qty,2);assert.equal(tal.price,150);
});

test('S6.6 micro-pieux : longrines avec et sans becquet simultanées',()=>{
  const s=base();s.mode='multiple';const e=newElement('fondations');
  Object.assign(e.data,{foundationType:'micro_pieux',microCount:4,microDepth:6,microPrice:900,longrineConcreteClass:'C25/30',
    longrineAvecBecquet:true,longrineAvecBecquetLength:20,longrineAvecBecquetWidthCm:20,longrineAvecBecquetHeightCm:40,longrineAvecBecquetPrice:135,
    longrineSansBecquet:true,longrineSansBecquetLength:8,longrineSansBecquetWidthCm:20,longrineSansBecquetHeightCm:40,longrineSansBecquetPrice:135});
  s.elements=[e];
  const html=renderConfig(s);assert.match(html,/Longrines périphériques avec becquet/);assert.match(html,/Longrines de refend sans becquet/);
  const r=calculate(s);
  assert.equal(r.lines.find(l=>l.id===e.id+'-longrine-avec-becquet-package').qty,20);
  assert.equal(r.lines.find(l=>l.id===e.id+'-longrine-sans-becquet-package').qty,8);
});

test('S6.6 prix catalogue : fibres à confirmer, anti-termite tarifé',()=>{
  let s=base();s.simpleType='dalle';Object.assign(s.simple,{surface:20,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30',fibres:true,fibreType:'courante',fibreDose:3});
  let r=calculate(s),f=r.lines.find(l=>l.id==='Dalle-fibres');assert.equal(f.price,0);assert.equal(f.priceMode,'required');
  s=base();s.mode='multiple';const e=newElement('murs_elevations');Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30',antiTermite:true});s.elements=[e];
  r=calculate(s);const a=r.lines.find(l=>l.id===e.id+'-anti-termite');assert.ok(a.price>0);assert.equal(a.unit,'m²');
});

test('S6.6 options : les accordéons ouverts sont restaurés après rerender',()=>{
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(app,/\$\$\('details\.accordion\[open\]'/);assert.match(app,/\$\$\('details\.accordion','#stepHost'\)\.forEach/);assert.match(app,/d\.open=true/);
});

test('S6.6 validation : données bloquantes contrôlées avant étape suivante',()=>{
  const s=base();s.mode='multiple';const e=newElement('murs_elevations');
  Object.assign(e.data,{length:10,height:2.5,thickness:20,material:'parpaing',method:'tradi',concreteClass:'C25/30',openings:[{type:'linteau_ba',lintelLength:'',lintelRef:'linteau_ba_courant'}]});s.elements=[e];
  assert.match(validateStep(s,2),/longueur du linteau obligatoire/i);
});

test('S6.6 Angèle connaît le retour Guillaume du 5 novembre',()=>{
  assert.equal(SpeedArtiAngelMaconKnowledge.version,'MAC-ANGEL-KB-v1.6');
  assert.ok(searchAngelMacon('longrine becquet talonnette fibres anti termite validation',5).some(x=>x.id==='MAC-S66-RETOUR-GUILLAUME'));
});

console.log(`OK — V2.6 Maçon: ${pass.length} contrôles fonctionnels passés`);
for(const x of pass)console.log(`✓ ${x}`);
