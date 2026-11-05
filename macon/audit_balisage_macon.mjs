import fs from 'node:fs';
import {
  defaultState,newElement,renderStep,assertBalisage,collectTraces,TRACE_TARGETS,
  SIMPLE_TYPES,WORKS,CHIMNEY_CONDUITS,CHIMNEY_STACKS,CHIMNEY_CAPS,FIBRES
} from './core.js';

const fixtures=[];
function add(name,s){fixtures.push([name,structuredClone(s)])}
function base(step=0,mode='simple'){const s=defaultState();s.step=step;s.mode=mode;s.globals.hourly=45;s.globals.vat=20;s.globals.workers=2;return s;}

// Steps 0/1 both modes
for(const m of ['simple','multiple']){add(`step0-${m}`,base(0,m));add(`step1-${m}`,base(1,m));}
// Simple configs/options all branches
for(const t of SIMPLE_TYPES.map(x=>x.id)){
  let s=base(2);s.simpleType=t;
  if(t==='murs'){
    Object.assign(s.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,mortarKgM2:3,wallHPerM2:.5});
    const assoc=['','seuil_ba','appui_fenetre_ba','linteau_ba_courant','linteau_ba_renforce','talonnette_manuelle'];
    for(const a of assoc){let x=structuredClone(s);x.simple.openings=[{width:1.2,height:1,associated:a,lintelLength:1.5,manualPrice:100,manualHours:1}];add(`simple-murs-config-${a||'none'}`,x)}
    for(const mat of ['parpaing','brique','beton_cellulaire','pierre','beton_banche']){let x=structuredClone(s);x.step=3;Object.assign(x.simple,{material:mat,method:'colle',chainH:true,chainV:true,chainHml:10,chainVml:8});add(`simple-murs-options-${mat}`,x)}
  } else if(['dalle','terrasse'].includes(t)){
    for(const ref of ['dallage_non_arme','dallage_arme','dalle_pleine_ba','dalle_pleine_fortement_armee','dalle_portee','plancher_poutrelles_hourdis','plancher_predalles']){let x=structuredClone(s);Object.assign(x.simple,{surface:20,thickness:12,slabRef:ref});add(`simple-${t}-config-${ref}`,x);x=structuredClone(x);x.step=3;Object.assign(x.simple,{treillis:true,fibres:true,fibreType:'courante',fibreDose:3.5,terraceWaterproof:true,terraceWaterproofPrice:20,terraceInsulation:true,terraceInsulationPrice:25});add(`simple-${t}-options-${ref}`,x)}
  } else if(t==='fondations'){
    for(const ref of ['semelle_filante','semelle_isolee','semelle_sous_mur']){let x=structuredClone(s);Object.assign(x.simple,{foundationRef:ref,length:10,widthCm:40,heightCm:30});add(`simple-foundation-${ref}`,x)}
    let x=structuredClone(s);x.step=3;for(const k of ['resineAntiTermite','implantation','ouvertureFondations','canalisationFourreau','plateformeVs','enduitHydrofugeFondation','deltaMs','etudeSol'])x.globals.foundationOptions[k]={enabled:true,qty:1,unit:'forfait',price:10};add('simple-foundation-options-all',x)
  } else if(t==='cheminee'){
    for(const c of Object.keys(CHIMNEY_CONDUITS)){let x=structuredClone(s);Object.assign(x.simple,{height:5,count:1,conduit:c,stack:'standard_finition',stackCount:1,cap:'standard',capCount:1});add(`simple-chimney-${c}`,x)}
  }
}

// Price/catalogue fixture with real required lines.
let ps=base(4,'simple');ps.simpleType='murs';Object.assign(ps.simple,{length:10,height:2.5,thickness:20,blocksPerM2:10,mortarKgM2:3,wallHPerM2:.5,material:'parpaing',method:'tradi',chainH:true,chainHml:12,chainV:true,chainVml:8});add('price-catalogue-wall',ps);
let vs=base(5,'simple');vs.simpleType='dalle';Object.assign(vs.simple,{surface:30,thickness:12,slabRef:'dallage_arme',concreteClass:'C25/30'});vs.globals.toupie=true;vs.taxContext={workType:'renovation',housingOver2Years:'oui',ecoRenovation:'non'};add('verification-tva-renovation',vs);
// Multi element branches
function multiOne(type,data={}){let s=base(2,'multiple');let e=newElement(type);Object.assign(e.data,data);s.elements=[e];return s}
for(const ft of ['micro_pieux','plot_isole','vide_sanitaire','terre_plein']){
  let d={foundationType:ft,microCount:4,microDepth:6,microPrice:900,microSlabSurface:30,slabRef:'dallage_arme',slabConcreteClass:'C25/30',thickness:12,treillis:true,fibres:true,fibreType:'courante',fibreDose:3.5,longrineConcreteClass:'C25/30',longrineAvecBecquet:true,longrineAvecBecquetLength:20,longrineAvecBecquetWidthCm:20,longrineAvecBecquetHeightCm:40,longrineAvecBecquetPrice:135,longrineSansBecquet:true,longrineSansBecquetLength:8,longrineSansBecquetWidthCm:20,longrineSansBecquetHeightCm:40,longrineSansBecquetPrice:135,plotCount:5,plotVolumeMode:'unitaire',plotVolume:.1,perimeter:40,blockHeight:.2,rows:3,blocksPerM2:10,wallHPerM2:.5,footingWidthCm:40,footingHeightCm:30,stiffeners:4,refendLength:8,refendHeight:.6,refendBlocksPerM2:10,refendHoursPerM2:.5,refendStiffeners:2,slabSurface:80,slabInsulation:'avec_isolant'};add(`multi-foundation-${ft}`,multiOne('fondations',d))
}
for(const method of ['coule_sur_place','prefabrique'])for(const pt of ['standard','hauteur_importante','lourd_complexe'])add(`multi-bearing-${method}-${pt}`,multiOne('murs_porteurs',{length:10,height:3,thickness:20,method,prefabType:pt,realSupplyPrice:180,chainHml:10,chainVml:8,braceQty:2,bracePrice:80,braceHours:.5}));
for(const mat of ['parpaing','brique','siporex','beton_banche']){
  let s=multiOne('murs_elevations',{length:20,height:2.5,thickness:20,material:mat,method:'tradi',blocksPerM2:10,mortarKgM2:3,wallHPerM2:.5,chainHml:20,chainVml:12,waterproof:'delta_ms',decoration:'genoise_simple',decorationPriceMl:55,antiTermite:true});let e=s.elements[0];e.data.openings=[
    {type:'seuil_ba',width:1},{type:'appui_fenetre_ba',width:1},{type:'linteau_ba',lintelLength:1.5,lintelRef:'linteau_ba_courant'},{type:'linteau_ba',lintelLength:1.8,lintelRef:'linteau_ba_renforce'},{type:'coffre_tunnel_brique',width:1.5,coffrePriceMl:40},{type:'coffre_tunnel_resine',width:1.5,coffrePriceMl:45},{type:'talonnette_manuelle',quantity:2,manualPrice:150}
  ];e.data.beams=['poutre_ba_courante','poutre_ba_fortement_chargee','poutre_rive','poutre_redressement'].map(ref=>({length:3,widthCm:20,heightCm:30,ref}));e.data.pignons=[{width:10,slope:35},{width:8,slope:30}];add(`multi-elevation-${mat}`,s)
}
for(const ref of ['dallage_non_arme','dallage_arme','dalle_pleine_ba','dalle_pleine_fortement_armee','dalle_portee','plancher_poutrelles_hourdis','plancher_predalles'])for(const fib of Object.keys(FIBRES))add(`multi-slab-${ref}-${fib}`,multiOne('dalle',{length:10,width:8,thickness:12,slabRef:ref,treillis:true,fibres:true,fibreType:fib,fibreDose:FIBRES[fib].min}));
for(const c of Object.keys(CHIMNEY_CONDUITS))for(const st of ['',...Object.keys(CHIMNEY_STACKS)])for(const cp of ['',...Object.keys(CHIMNEY_CAPS)])add(`multi-chim-${c}-${st||'none'}-${cp||'none'}`,multiOne('cheminee',{height:5,count:1,conduit:c,stack:st,stackCount:st?1:0,cap:cp,capCount:cp?1:0}));
for(const w of WORKS.filter(w=>!['escalier_ba','paillasse_escalier','palier_ba'].includes(w.id)))add(`multi-ba-${w.id}`,multiOne('ouvrage_ba',{workRef:w.id,quantity:1}));

let s65f=multiOne('fondations',{foundationType:'vide_sanitaire',perimeter:40,blockHeight:.2,rows:2,footingWidthCm:40,footingHeightCm:30,foundationConcreteClass:'C25/30',refendLength:5,refendHeight:1,refendFootingWidthCm:40,refendFootingHeightCm:30,slabSurface:80,slabRef:'dallage_arme',slabConcreteClass:'C25/30',thickness:15,slabInsulation:'avec_isolant',slabInsulationPriceM2:25});add('s65-foundation-refend-isolation',s65f);

// all-options state at step3
let os=base(3,'multiple');os.elements=[newElement('fondations')];Object.assign(os.elements[0].data,{foundationType:'vide_sanitaire',perimeter:40,blockHeight:.2,rows:2,blocksPerM2:10,wallHPerM2:.5,footingWidthCm:40,footingHeightCm:30});
Object.assign(os.globals,{truck:true,truckPrice:850,truckDays:2,saveTruckPrice:true,pump:true,pumpPrice:500,toupie:true,toupiePrice:190,toupieMode:'manuel',toupies:2,earthworks:true,earthworksQty:10,earthworksPrice:20,backfill:true,backfillQty:10,backfillPrice:20,scaffold:true,scaffoldQty:10,scaffoldPrice:20,difficultAccess:true,difficultAccessHours:5,finishCoat:true,finishCoatQty:10,finishCoatPrice:20,waterproofCoat:true,waterproofCoatQty:10,waterproofCoatPrice:20});for(const k of ['resineAntiTermite','implantation','ouvertureFondations','canalisationFourreau','plateformeVs','enduitHydrofugeFondation','deltaMs','etudeSol'])os.globals.foundationOptions[k]={enabled:true,qty:1,unit:'forfait',price:10};add('options-all',os);

let totalControls=0;const traceCounts={};const failures=[];const bindFailures=[];
for(const [name,state] of fixtures){
  const html=renderStep(state);
  try{assertBalisage(html)}catch(e){failures.push([name,e.message])}
  const tags=[...html.matchAll(/<(input|select|button)\b[^>]*>/gi)].map(m=>m[0]);totalControls+=tags.length;
  for(const tag of tags){
    const tm=tag.match(/data-trace="([^"]+)"/); if(tm)traceCounts[tm[1]]=(traceCounts[tm[1]]||0)+1;
    const bound=/data-(?:mode|simple-type|add-element|remove-element|simple|global|root-field|field|add-simple-opening|remove-simple-opening|add-opening|remove-opening|add-beam|remove-beam|add-pignon|remove-pignon|jump-step)=/.test(tag);
    if(!bound)bindFailures.push([name,tag]);
  }
}
// Navigation statique : liens et boutons du wizard doivent aussi être balisés.
const indexHtml=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
try{assertBalisage(indexHtml)}catch(e){failures.push(['index-static',e.message])}
const staticTags=[...indexHtml.matchAll(/<(input|select|button|a)\b[^>]*>/gi)].map(m=>m[0]);
totalControls+=staticTags.length;
for(const tag of staticTags){
  const tm=tag.match(/data-trace="([^"]+)"/);if(tm)traceCounts[tm[1]]=(traceCounts[tm[1]]||0)+1;
  const bound=/href=|id="(?:prevBtn|nextBtn)"/.test(tag);
  if(!bound)bindFailures.push(['index-static',tag]);
}
const unknown=Object.keys(traceCounts).filter(t=>!TRACE_TARGETS[t]);
const unused=Object.keys(TRACE_TARGETS).filter(t=>!traceCounts[t]);
console.log(JSON.stringify({fixtures:fixtures.length,totalControls,uniqueTraces:Object.keys(traceCounts).length,failures,bindFailures:bindFailures.slice(0,20),bindFailureCount:bindFailures.length,unknown,unused},null,2));
