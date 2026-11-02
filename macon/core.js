import {
  STRUCTURE_WARNING, FIBRE_WARNING, PREFAB_TEAM_ADVICE, PREFAB_H_PER_ML,
  TRUCK_8X4_DEFAULT, FIBRES, CHIMNEY_CONDUITS, CHIMNEY_STACKS, CHIMNEY_CAPS,
  CONCRETE_CLASSES, MASONRY_DEFAULTS, MORTAR_SITE_PARPAING_20, TREILLIS_GUILLAUME, MICROPILE_PRICE_BY_DEPTH, LONGRINE_PRICE_ML,
  PREFAB_DEFAULT_PRICE_M2, PUMP_DEFAULT_PRICE, TOUPIE_PRICE_M3, TOUPIE_MIN_BILLABLE_M3, TOUPIE_CAPACITY_M3,
  WORKS, WORK_BY_ID
} from './references.js';
import {
  CATALOGUE_MACON, catalogueCandidatesForLine, resolveCatalogueProduct, catalogueLabel, genericRebarPricePerKg
} from './catalogue-macon.js';

export const STEPS = ['Mode', 'Ouvrage(s)', 'Configuration', 'Options', 'Prix / catalogue', 'Vérification', 'Résultat'];

export const DEMO_SPEEDARTI_CONTEXT = Object.freeze({
  hourly: 50,
  workers: 1,
  vat: 20,
  source: 'demo-only'
});

export const SIMPLE_TYPES = [
  {id:'murs', icon:'🧱', label:'Murs / Cloisons', desc:'Blocs, briques, béton banché'},
  {id:'dalle', icon:'⬜', label:'Dallage / Dalle', desc:'Dallage ou ouvrage béton'},
  {id:'fondations', icon:'🏗️', label:'Fondations', desc:'Semelles et terrassement'},
  {id:'terrasse', icon:'▤', label:'Terrasse', desc:'Dalle extérieure'},
  {id:'cheminee', icon:'🔥', label:'Cheminée', desc:'Conduit, souche, chapeau'}
];

export const MULTI_CARDS = [
  {id:'fondations', type:'fondations', icon:'🏗️', label:'Fondations', name:'Fondation'},
  {id:'murs_porteurs', type:'murs_porteurs', icon:'🧱', label:'Murs porteurs', name:'Mur porteur'},
  {id:'murs_elevations', type:'murs_elevations', icon:'🏠', label:"Murs d'élévations", name:'Murs extérieurs'},
  {id:'dalle', type:'dalle', icon:'🟫', label:'Dalle seule', name:'Dalle'},
  {id:'cheminee', type:'cheminee', icon:'🔥', label:'Cheminée', name:'Cheminée'},
  {id:'ouvrage_ba', type:'ouvrage_ba', icon:'▧', label:'Ouvrage BA / Annexe 1', name:'Ouvrage BA'}
];

// Chaque trace doit avoir une destination réelle. Les tests vérifient que tous les contrôles visibles sont balisés.
export const TRACE_TARGETS = {
  mode:'state+route', simpleType:'state+route', wizardPrev:'route-step-back', wizardNext:'validation+route-step-forward', returnTrades:'route-metiers',
  concreteClass:'material-variant', wallKind:'normative-context', taxWorkType:'tax-context', taxAge:'tax-context', taxEco:'tax-context', jumpStep:'route-step-direct',
  wallLength:'quantity', wallWidth:'quantity', wallHeight:'quantity', wallThickness:'material-variant',
  wallOpening:'quantity+associated-work', wallMaterial:'material-variant+price-key', wallMethod:'material-label', wallChainH:'material+labor', wallChainV:'material+labor',
  slabSurface:'quantity', slabLength:'quantity', slabWidth:'quantity', slabThickness:'quantity', slabRef:'material+labor', slabTreillis:'material', treillisType:'material+price+labor', slabFibres:'material', fibreType:'material', fibreDose:'quantity+alert',
  foundationRef:'material+labor', footingLength:'quantity', footingWidth:'quantity', footingHeight:'quantity', excavationDepth:'report+earthworks-context',
  chimneyHeight:'quantity+labor', chimneyCount:'quantity+labor', chimneyConduit:'material+labor', chimneyStack:'material+labor', chimneyStackCount:'quantity+labor', chimneyCap:'material+labor', chimneyCapCount:'quantity+labor', chimneyFoyer:'report', chimneyManualPrice:'price-mode', chimneySupplyOverride:'price', chimneyHoursOverride:'labor', chimneyTotalOverride:'price',
  foundationType:'route', microCount:'quantity', microDepth:'commercial-price-rule', microPrice:'price', longrineType:'route', longrineLength:'quantity', longrineWidth:'quantity', longrineHeight:'quantity', longrinePrice:'price',
  plotCount:'quantity', plotVolumeMode:'quantity-meaning', plotVolume:'quantity', basementPerimeter:'quantity', basementBlockHeight:'quantity', basementRows:'quantity', basementFootingWidth:'quantity', basementFootingHeight:'quantity', basementStiffeners:'quantity',
  refendLength:'quantity', refendHeight:'quantity', refendStiffeners:'quantity', refendFootingWidth:'quantity', refendFootingHeight:'quantity', associatedSlabSurface:'quantity', associatedSlabThickness:'quantity', associatedSlabRef:'material+labor', associatedSlabInsulation:'material', associatedSlabInsulationPrice:'price',
  bearingLength:'quantity', bearingHeight:'quantity', bearingThickness:'quantity', bearingMethod:'route', prefabType:'labor', prefabPriceM2:'price', bearingChainH:'material+labor', bearingChainV:'material+labor', braceQty:'quantity', bracePrice:'price', braceHours:'labor',
  elevationType:'report', elevationLength:'quantity', elevationHeight:'quantity', elevationThickness:'material-variant', elevationMaterial:'material-variant+price-key', elevationMethod:'material-label', elevationChainH:'material+labor', elevationChainV:'material+labor',
  openingType:'associated-work', openingWidth:'quantity', openingHeight:'quantity', openingLintelLength:'quantity', openingLintelRef:'material+labor', openingManualPrice:'price', openingManualHours:'labor', openingCoffrePrice:'price',
  beamLength:'quantity', beamWidth:'quantity', beamHeight:'quantity', beamRef:'material+labor', pignonWidth:'quantity', pignonSlope:'quantity',
  elevationWaterproof:'material+price', elevationDecoration:'material+price', elevationAntiTermite:'material+price',
  genericWorkRef:'material+labor', genericWorkQty:'quantity', refBeton:'quantity', refAcier:'quantity', refCoffrage:'quantity', refHours:'labor',
  truck:'material+price', truckPrice:'price', truckDays:'quantity', saveTruckPrice:'preference', pump:'material+price', pumpPrice:'price', toupie:'material+price', toupiePrice:'price', toupieMode:'price-mode', toupies:'quantity', concreteControlMode:'report+planning-control',
  earthworks:'material+price', earthworksQty:'quantity', earthworksUnit:'unit', earthworksPrice:'price', backfill:'material+price', backfillQty:'quantity', backfillUnit:'unit', backfillPrice:'price', scaffold:'material+price', scaffoldQty:'quantity', scaffoldUnit:'unit', scaffoldPrice:'price', difficultAccess:'labor', difficultAccessHours:'labor',
  finishCoat:'material+price', finishCoatQty:'quantity', finishCoatUnit:'unit', finishCoatPrice:'price', waterproofCoat:'material+price', waterproofCoatQty:'quantity', waterproofCoatUnit:'unit', waterproofCoatPrice:'price',
  terraceWaterproof:'material+price', terraceWaterproofPrice:'price', terraceInsulation:'material+price', terraceInsulationPrice:'price',
  foundationOption:'material+price', foundationOptionPrice:'price', foundationOptionQty:'quantity',
  catalogSelection:'catalogue-selection+price+conditionnement',
  priceInput:'price-personnel', addOpening:'state+route', removeOpening:'state+route', addBeam:'state+route', removeBeam:'state+route', addPignon:'state+route', removePignon:'state+route', addElement:'state+route', removeElement:'state+route'
};

export function defaultState(){
  return {
    step:0,
    mode:'simple',
    simpleType:'murs',
    simple:{ openings:[], refOverrides:{}, chimneyOverrides:{}, count:1, wallKind:'mur', concreteClass:'' },
    globals:{
      hourly:DEMO_SPEEDARTI_CONTEXT.hourly, vat:DEMO_SPEEDARTI_CONTEXT.vat, workers:DEMO_SPEEDARTI_CONTEXT.workers, concreteClass:'',
      truck:false, truckPrice:TRUCK_8X4_DEFAULT, truckDays:1, saveTruckPrice:false,
      pump:false, pumpPrice:PUMP_DEFAULT_PRICE, toupie:false, toupiePrice:TOUPIE_PRICE_M3, toupieMode:'auto_volume', toupieVolume:'', toupies:1,
      concreteControlMode:'aucun',
      earthworks:false, earthworksQty:'', earthworksUnit:'m³', earthworksPrice:'',
      backfill:false, backfillQty:'', backfillUnit:'m³', backfillPrice:'',
      scaffold:false, scaffoldQty:'', scaffoldUnit:'jour', scaffoldPrice:'',
      difficultAccess:false, difficultAccessHours:'',
      finishCoat:false, finishCoatQty:'', finishCoatUnit:'m²', finishCoatPrice:'',
      waterproofCoat:false, waterproofCoatQty:'', waterproofCoatUnit:'m²', waterproofCoatPrice:'',
      foundationOptions:{}
    },
    elements:[],
    taxContext:{workType:'',housingOver2Years:'',ecoRenovation:'non'},
    manualPrices:{},
    catalogSelections:{},
    result:null
  };
}

export const num = v => {
  const n = Number(String(v ?? '').replace(',','.'));
  return Number.isFinite(n) ? n : 0;
};

export function detectVatContext(context={}){
  const type=context.workType||'';
  if(!type)return {complete:false,rate:20,justification:'Choisir le type de travaux avant le résultat.',alert:'Type de travaux à préciser.'};
  if(type==='neuf')return {complete:true,rate:20,justification:'Construction neuve : TVA à 20 %.',alert:''};
  if(type==='renovation'||type==='entretien'){
    const over2=context.housingOver2Years||'';
    if(!over2)return {complete:false,rate:20,justification:'Préciser si le logement est achevé depuis plus de 2 ans.',alert:'Âge du logement à préciser.'};
    if(over2==='non')return {complete:true,rate:20,justification:'Logement de moins de 2 ans : TVA à 20 %.',alert:''};
    if(context.ecoRenovation==='oui')return {complete:true,rate:5.5,justification:'Rénovation énergétique sur logement de plus de 2 ans : TVA réduite 5,5 % à confirmer selon l’éligibilité réelle des travaux.',alert:'Vérifier l’éligibilité exacte au taux réduit de 5,5 %.'};
    return {complete:true,rate:10,justification:'Rénovation / entretien d’un logement de plus de 2 ans : TVA intermédiaire 10 %.',alert:''};
  }
  return {complete:false,rate:20,justification:'Contexte TVA incomplet.',alert:'Contexte TVA incomplet.'};
}

export function effectiveVatRate(state){
  const detected=detectVatContext(state?.taxContext||{});
  if(detected.complete)return detected.rate;
  const raw=state?.globals?.vat;
  return (raw!==''&&raw!==null&&raw!==undefined&&Number.isFinite(Number(raw)))?num(raw):DEMO_SPEEDARTI_CONTEXT.vat;
}

export function projectSummary(state){
  if(state.mode==='multiple'){
    const names=(state.elements||[]).map(e=>e.name||e.type).filter(Boolean);
    return names.length?`${names.length} élément${names.length>1?'s':''} · ${names.join(' · ')}`:'Chantier multi-éléments';
  }
  const label=SIMPLE_TYPES.find(x=>x.id===state.simpleType)?.label||'Ouvrage';
  const d=state.simple||{};
  if(state.simpleType==='dalle'||state.simpleType==='terrasse')return `${label} · ${fmt(num(d.surface),2)} m² · ép. ${fmt(num(d.thickness),0)} cm`;
  if(state.simpleType==='murs')return `${label} · ${fmt(num(d.length),2)} m × ${fmt(num(d.height),2)} m`;
  if(state.simpleType==='fondations')return `${label} · ${fmt(num(d.length),2)} ml`;
  if(state.simpleType==='cheminee')return `${label} · ${fmt(num(d.height),2)} m · ${num(d.count)||1} conduit`;
  return label;
}

export function concreteClassFor(container,globals){
  return container?.concreteClass || globals?.concreteClass || '';
}
export function micropileSuggestedPrice(depth){
  const d=num(depth);
  if(!(d>=3))return 0;
  return MICROPILE_PRICE_BY_DEPTH.find(r=>d<=r.max)?.price||0;
}
export function estimatedVerticalChainage(perimeter,height){
  const p=num(perimeter),h=num(height);
  if(!(p>0&&h>0))return 0;
  return Math.ceil(p/3.5)*h;
}
export function toupieCommercialCost(volumeM3,priceM3=TOUPIE_PRICE_M3){
  const v=num(volumeM3);
  if(!(v>0))return 0;
  return Math.max(v,TOUPIE_MIN_BILLABLE_M3)*num(priceM3);
}
export function toupieEstimatedCount(volumeM3){
  const v=num(volumeM3);
  return v>0?Math.ceil(v/TOUPIE_CAPACITY_M3):0;
}

export function masonryDefaultsFor(material='parpaing'){
  return MASONRY_DEFAULTS[material]||null;
}
export function masonryRatio(container,key){
  const explicit=num(container?.[key]);
  if(explicit>0)return explicit;
  return num(masonryDefaultsFor(container?.material||'parpaing')?.[key]);
}
export const roundMoney = n => Math.round((Number(n||0)+Number.EPSILON)*100)/100;

function mortarSiteDefaults(container){
  const material=container?.material||'parpaing',method=container?.method||'tradi',thickness=num(container?.thickness||20);
  return method==='tradi'&&material==='parpaing'&&Math.abs(thickness-20)<0.01?MORTAR_SITE_PARPAING_20:null;
}
function mortarSiteRatios(container){
  const d=mortarSiteDefaults(container);
  return {
    cementKgPerM2:num(container?.cementKgM2)>0?num(container.cementKgM2):num(d?.cementKgPerM2),
    sandM3PerM2:num(container?.sandM3M2)>0?num(container.sandM3M2):num(d?.sandM3PerM2),
    automatic:!!d&&!(num(container?.cementKgM2)>0)&&!(num(container?.sandM3M2)>0)
  };
}
function addSiteMortarLines(lines,container,net,prefix,reco){
  if(!(net>0)||container?.method!=='tradi')return;
  const r=mortarSiteRatios(container);
  if(r.cementKgPerM2>0){
    lines.push(line(`${prefix}-cement`,'Ciment — mortier fabriqué sur chantier','Ciments / chaux',net*r.cementKgPerM2,'kg',0,'required',{catalogRole:'mortar_cement'}));
  }
  if(r.sandM3PerM2>0){
    lines.push(line(`${prefix}-sand`,'Sable 0/4 — mortier fabriqué sur chantier','Granulats',net*r.sandM3PerM2,'m³',0,'required',{catalogRole:'mortar_sand'}));
  }
  if(r.automatic)reco.push(`Mortier chantier parpaing 20 cm : ${fmt(r.cementKgPerM2,2)} kg ciment/m² + ${fmt(r.sandM3PerM2,4)} m³ sable 0/4/m² proposés automatiquement, modifiables. Dosage ciment ≈ ${MORTAR_SITE_PARPAING_20.cementDosageKgPerM3Sand} kg/m³ de sable, dans la plage DTU 20.1 ${MORTAR_SITE_PARPAING_20.dtuCementRangeKgPerM3Sand[0]}–${MORTAR_SITE_PARPAING_20.dtuCementRangeKgPerM3Sand[1]} kg/m³.`);
}
export const fmt = (n,d=2) => Number(n||0).toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});
export const money = n => `${fmt(n,2)} €`;
export const esc = s => String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function getPath(obj,path){
  return String(path).split('.').reduce((a,k)=>a==null?undefined:a[k],obj);
}
export function setPath(obj,path,value){
  const parts=String(path).split('.'); let cur=obj;
  for(let i=0;i<parts.length-1;i++){
    const k=parts[i], next=parts[i+1];
    if(cur[k]==null) cur[k]=/^\d+$/.test(next)?[]:{};
    cur=cur[k];
  }
  cur[parts.at(-1)] = value;
  return obj;
}

function traceAttr(trace){
  if(!TRACE_TARGETS[trace]) throw new Error(`TRACE INCONNUE: ${trace}`);
  return `data-trace="${trace}"`;
}

export function optionHtml(options,value){
  return options.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(value??'')?'selected':''}>${esc(o.label)}</option>`).join('');
}

export function field(label,key,value='',opts={}){
  const {type='number',step='any',min='0',placeholder='',scope='simple',required=false,help='',options=null,trace} = opts;
  if(!trace) throw new Error(`Champ sans balisage: ${label}`);
  const attr = scope==='global'?'data-global':scope==='simple'?'data-simple':'data-field';
  let control;
  if(options){
    control=`<select ${attr}="${esc(key)}" ${traceAttr(trace)}>${optionHtml(options,value)}</select>`;
  } else {
    control=`<input ${attr}="${esc(key)}" ${traceAttr(trace)} type="${type}" step="${step}" min="${min}" inputmode="${type==='number'?'decimal':'text'}" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(value)}">`;
  }
  return `<div class="field"><label class="${required?'required':''}">${label}</label>${control}${help?`<small>${help}</small>`:''}</div>`;
}

export function check(label,key,checked=false,scope='simple',trace){
  if(!trace) throw new Error(`Case sans balisage: ${label}`);
  const attr=scope==='global'?'data-global':scope==='simple'?'data-simple':'data-field';
  return `<label class="check"><input ${attr}="${esc(key)}" ${traceAttr(trace)} type="checkbox" ${checked?'checked':''}><span>${label}</span></label>`;
}

export function button(label,attrs='',trace){
  if(!trace) throw new Error(`Bouton sans balisage: ${label}`);
  return `<button type="button" ${attrs} ${traceAttr(trace)}>${label}</button>`;
}

export const DISABLED_WORK_IDS=new Set(['escalier_ba','paillasse_escalier','palier_ba']);
function workOptions(ids=WORKS.map(x=>x.id)){
  return ids.filter(id=>!DISABLED_WORK_IDS.has(id)).map(id=>WORK_BY_ID[id]).filter(Boolean).map(r=>({value:r.id,label:`${r.label} — ${r.moHParUnite} h/${r.unite}`}));
}

export function concreteClassOptions(){
  return CONCRETE_CLASSES.map(v=>({value:v,label:v}));
}
export function treillisOptions(){
  return Object.entries(TREILLIS_GUILLAUME).map(([value,r])=>({value,label:`${r.label} — ${r.maille} — ${r.usage}`}));
}

export function resolvedRef(container,refId){
  const base=WORK_BY_ID[refId]; if(!base)return null;
  const ov=container?.refOverrides?.[refId]||{};
  return {
    ...base,
    betonParUnite: ov.betonParUnite!==undefined?num(ov.betonParUnite):base.betonParUnite,
    acierParUnite: ov.acierParUnite!==undefined?num(ov.acierParUnite):base.acierParUnite,
    coffrageParUnite: ov.coffrageParUnite!==undefined?num(ov.coffrageParUnite):base.coffrageParUnite,
    moHParUnite: ov.moHParUnite!==undefined?num(ov.moHParUnite):base.moHParUnite
  };
}

export function renderRefOverrides(scope,container,refId,prefix='ref'){
  const ref=resolvedRef(container,refId); if(!ref)return '';
  const path=`refOverrides.${refId}`;
  const scoped=(label,key,value,trace)=>field(label,`${path}.${key}`,value,{scope,step:'0.001',trace,help:'Valeur Guillaume proposée, modifiable.'});
  return `<details class="accordion"><summary>⚙️ Ratios indicatifs modifiables — ${esc(ref.label)}</summary><div class="accordion-body">
    <div class="alert warn">${esc(STRUCTURE_WARNING)}</div>
    <div class="grid cols-4">
      ${scoped(`Béton / ${ref.unite}`, 'betonParUnite', ref.betonParUnite, 'refBeton')}
      ${scoped(`Acier / ${ref.unite}`, 'acierParUnite', ref.acierParUnite, 'refAcier')}
      ${scoped(`Coffrage / ${ref.unite}`, 'coffrageParUnite', ref.coffrageParUnite, 'refCoffrage')}
      ${scoped(`MO h-homme / ${ref.unite}`, 'moHParUnite', ref.moHParUnite, 'refHours')}
    </div>
  </div></details>`;
}

export function newElement(cardId){
  const c=MULTI_CARDS.find(x=>x.id===cardId); if(!c)return null;
  const d={refOverrides:{}, openings:[], beams:[], pignons:[]};
  if(c.type==='fondations') Object.assign(d,{foundationType:'vide_sanitaire',foundationConcreteClass:'',slabConcreteClass:'',longrineConcreteClass:'',blockHeight:.20,treillisType:'ST25C',longrinePrice:LONGRINE_PRICE_ML});
  if(c.type==='murs_porteurs') Object.assign(d,{method:'coule_sur_place',thickness:20,prefabType:'standard',prefabPriceM2:PREFAB_DEFAULT_PRICE_M2,concreteClass:''});
  if(c.type==='murs_elevations') Object.assign(d,{wallType:'murs_exterieurs',material:'parpaing',method:'colle',thickness:20,concreteClass:'',prefabType:'standard',prefabPriceM2:PREFAB_DEFAULT_PRICE_M2});
  if(c.type==='dalle') Object.assign(d,{thickness:12,fibreType:'courante',treillisType:'ST25C',concreteClass:''});
  if(c.type==='cheminee') Object.assign(d,{conduit:'20x20',count:1,stack:'',stackCount:0,cap:'',capCount:0,foyer:'ouvert',chimneyOverrides:{}});
  if(c.type==='ouvrage_ba') Object.assign(d,{workRef:'beton_proprete',quantity:1,concreteClass:''});
  return {id:uid(),type:c.type,name:c.name,data:d};
}

export function iconFor(t){return ({fondations:'🏗️',murs_porteurs:'🧱',murs_elevations:'🏠',dalle:'🟫',cheminee:'🔥',ouvrage_ba:'▧'})[t]||'•';}

export function renderMode(state){
  return `<div class="section-title"><h2>Mode de chiffrage</h2><p>Choisissez simplement si le chantier contient un seul ouvrage ou plusieurs éléments.</p></div>
  <div class="grid cols-2">
    ${button(`<span class="icon">▣</span><span><strong>Mode simple</strong><small>Un seul ouvrage.</small></span>`,`class="choice-card mode-card ${state.mode==='simple'?'selected':''}" data-mode="simple"`,'mode')}
    ${button(`<span class="icon">▦</span><span><strong>Mode multi-éléments</strong><small>Plusieurs éléments cumulés.</small></span>`,`class="choice-card mode-card ${state.mode==='multiple'?'selected':''}" data-mode="multiple"`,'mode')}
  </div>
  <div class="info-box">Dans SpeedArti, le taux horaire et l’effectif par défaut seront repris automatiquement depuis les paramètres de l’artisan. La démo utilise un contexte interne simulé, sans demander ces réglages pendant le chiffrage.</div>`;
}

export function renderWorks(state){
  if(state.mode==='simple'){
    return `<div class="section-title"><h2>Type d'ouvrage</h2><p>Choisissez l’ouvrage à chiffrer.</p></div>
      <div class="trade-grid">${SIMPLE_TYPES.map(t=>button(`<span class="icon">${t.icon}</span><strong>${t.label}</strong><small>${t.desc}</small>`,`class="choice-card ${state.simpleType===t.id?'selected':''}" data-simple-type="${t.id}"`,'simpleType')).join('')}</div>`;
  }
  return `<div class="section-title"><h2>Sélectionnez les éléments du chantier</h2><p>Vous pouvez ajouter plusieurs fois le même type.</p></div>
    <div class="trade-grid">${MULTI_CARDS.map(c=>button(`<span class="icon">${c.icon}</span><strong>${c.label}</strong><small>Cliquer pour ajouter</small>`,`class="choice-card" data-add-element="${c.id}"`,'addElement')).join('')}</div>
    ${state.elements.length?`<div class="added-list">${state.elements.map(e=>`<span class="pill">${iconFor(e.type)} ${esc(e.name)} ${button('×',`class="pill-remove" data-remove-element="${e.id}" title="Supprimer"`,'removeElement')}</span>`).join('')}</div>`:`<div class="info-box">Aucun élément ajouté pour le moment.</div>`}`;
}

function openingRowsSimple(d){
  const openings=d.openings||[];
  const refs=[...new Set(openings.map(o=>o.associated).filter(id=>WORK_BY_ID[id]))];
  return `<div class="element-card"><header><strong>Ouvertures réelles</strong>${button('+ Ajouter',`class="btn ghost small" data-add-simple-opening="1"`,'addOpening')}</header><div class="body">
    ${openings.length?openings.map((o,i)=>`<div class="grid cols-4 line-editor">
      ${field('Largeur (m)',`openings.${i}.width`,o.width??'',{step:'0.01',trace:'wallOpening'})}
      ${!['seuil_ba','coffre_tunnel_brique','coffre_tunnel_resine'].includes(o.associated)?field('Hauteur (m)',`openings.${i}.height`,o.height??'',{step:'0.01',trace:'wallOpening'}):''}
      ${field('Ouvrage associé',`openings.${i}.associated`,o.associated??'',{trace:'wallOpening',options:[{value:'',label:'Aucun'},{value:'appui_fenetre_ba',label:'Appui fenêtre BA'},{value:'seuil_ba',label:'Seuil BA'},{value:'linteau_ba_courant',label:'Linteau BA courant'},{value:'linteau_ba_renforce',label:'Linteau BA renforcé'},{value:'coffre_tunnel_brique',label:'Coffre tunnel brique'},{value:'coffre_tunnel_resine',label:'Coffre tunnel résine'}]})}
      ${['coffre_tunnel_brique','coffre_tunnel_resine'].includes(o.associated)?field('Prix HT / ml coffre',`openings.${i}.coffrePriceMl`,o.coffrePriceMl??'',{step:'0.01',trace:'openingCoffrePrice',help:'Prix provisoire à saisir en attendant l’audit catalogue.'}):''}
      ${button('Supprimer',`class="btn danger small" data-remove-simple-opening="${i}"`,'removeOpening')}
    </div>`).join(''):'<p class="muted">Aucune ouverture.</p>'}
    ${refs.map(id=>renderRefOverrides('simple',d,id)).join('')}
  </div></div>`;
}

export function renderSimpleConfig(state){
  const d=state.simple;
  if(state.simpleType==='murs') return `<div class="section-title"><h2>Dimensions de l'ouvrage</h2><p>Murs / Cloisons — les consommations et temps unitaires sont gérés automatiquement par SpeedArti.</p></div>
    <div class="grid cols-5">
      ${field('Nature de l’ouvrage','wallKind',d.wallKind??'mur',{trace:'wallKind',options:[{value:'mur',label:'Mur'},{value:'cloison_non_porteuse',label:'Cloison non porteuse'}]})}
      ${field('Longueur totale murs (m)','length',d.length??'',{required:true,step:'0.1',trace:'wallLength'})}
      ${field('Largeur bâtiment (m) — si 4 côtés','width',d.width??'',{step:'0.1',trace:'wallWidth',help:'Si renseignée, surface = 2 × (L + l) × H.'})}
      ${field('Hauteur (m)','height',d.height??'',{required:true,step:'0.1',trace:'wallHeight'})}
      ${field('Épaisseur (cm)','thickness',d.thickness??'',{required:true,step:'1',trace:'wallThickness'})}
    </div>
    <div class="info-box">Les consommations matières et temps unitaires sont calculés automatiquement par les référentiels internes SpeedArti.</div>${openingRowsSimple(d)}`;

  if(['dalle','terrasse'].includes(state.simpleType)){
    const refId=d.slabRef||'';
    return `<div class="section-title"><h2>Dimensions de l'ouvrage</h2><p>${state.simpleType==='terrasse'?'Terrasse':'Dallage / Dalle'} — référentiel Guillaume modifiable.</p></div>
      <div class="grid cols-4">
        ${field('Surface (m²)','surface',d.surface??'',{required:true,step:'0.1',trace:'slabSurface'})}
        ${field('Épaisseur réelle (cm)','thickness',d.thickness??'',{required:true,step:'1',trace:'slabThickness'})}
        ${field('Type de dalle de référence','slabRef',refId,{required:true,trace:'slabRef',options:[{value:'',label:'Choisir…'},...workOptions(['dallage_non_arme','dallage_arme','dalle_pleine_ba','dalle_pleine_fortement_armee','dalle_portee','plancher_poutrelles_hourdis','plancher_predalles'])]})}
        ${field('Classe béton','concreteClass',d.concreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]})}
      </div>${refId?renderRefOverrides('simple',d,refId):''}`;
  }

  if(state.simpleType==='fondations'){
    const refId=d.foundationRef||'semelle_filante';
    return `<div class="section-title"><h2>Semelle de fondation</h2><p>Longueur en m ; largeur et épaisseur béton en cm ; profondeur de fouille séparée.</p></div>
      <div class="grid cols-5">
        ${field('Type de semelle','foundationRef',refId,{trace:'foundationRef',options:workOptions(['semelle_filante','semelle_isolee','semelle_sous_mur'])})}
        ${field('Longueur (m)','length',d.length??'',{required:true,step:'0.1',trace:'footingLength'})}
        ${field('Largeur (cm)','widthCm',d.widthCm??'',{required:true,step:'1',trace:'footingWidth'})}
        ${field('Épaisseur / hauteur béton (cm)','heightCm',d.heightCm??'',{required:true,step:'1',trace:'footingHeight'})}
        ${field('Classe béton','concreteClass',d.concreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]})}
      </div><div class="grid cols-2" style="margin-top:14px">
        ${field('Profondeur de fouille (m)','excavationDepth',d.excavationDepth??'',{step:'0.05',trace:'excavationDepth'})}
      </div>${renderRefOverrides('simple',d,refId)}`;
  }

  if(state.simpleType==='cheminee') return renderChimneyConfig('simple',d);
  return '';
}

export function renderConfig(state){
  if(state.mode==='simple') return renderSimpleConfig(state);
  if(!state.elements.length) return `<div class="section-title"><h2>Configuration des éléments</h2></div><div class="alert danger">🚨 Aucun élément sélectionné.</div>`;
  return `<div class="section-title"><h2>Configuration des éléments</h2><p>Le module reprend les blocs originaux et leurs sous-ouvrages.</p></div>${state.elements.map(renderElementConfig).join('')}`;
}

function ef(e,label,key,value='',opts={}){
  return field(label,key,value,{...opts,scope:'element'}).replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
}
function ec(e,label,key,checked=false,trace){
  return check(label,key,checked,'element',trace).replace('data-field=',`data-el-id="${e.id}" data-field=`);
}
function eb(e,label,attrs,trace){ return button(label,`${attrs} data-el-id="${e.id}"`,trace); }

function renderElementConfig(e){
  let body='';
  if(e.type==='fondations') body=renderFoundationElement(e);
  if(e.type==='murs_porteurs') body=renderBearingWallElement(e);
  if(e.type==='murs_elevations') body=renderElevationElement(e);
  if(e.type==='dalle') body=renderSlabElement(e);
  if(e.type==='cheminee') body=renderChimneyConfig('element',e.data,e);
  if(e.type==='ouvrage_ba') body=renderGenericWorkElement(e);
  return `<div class="element-card"><header><div><strong>${iconFor(e.type)} ${esc(e.name)}</strong> <span class="badge">${esc(e.type.replaceAll('_',' '))}</span></div>${eb(e,'Supprimer',`class="btn danger small" data-remove-element="${e.id}"`,'removeElement')}</header><div class="body" data-element-root="${e.id}">${body}</div></div>`;
}

function renderAssociatedSlabControls(e,d,{surfaceKey,surfaceLabel,insulationKey=null,insulationLabel='Isolation'}){
  const refId=d.slabRef||'';
  const slabRefs=d.foundationType==='terre_plein'
    ? ['dallage_non_arme','dallage_arme']
    : ['dallage_non_arme','dallage_arme','dalle_pleine_ba','dalle_portee','plancher_poutrelles_hourdis','plancher_predalles'];
  const insulation=insulationKey
    ? ef(e,insulationLabel,insulationKey,d[insulationKey]??'sans_isolant',{trace:'associatedSlabInsulation',options:[{value:'sans_isolant',label:'Sans isolant'},{value:'avec_isolant',label:'Avec isolant'}]})
    : '';
  let h=`<div class="grid ${insulationKey?'cols-5':'cols-4'}" style="margin-top:14px">
    ${ef(e,surfaceLabel,surfaceKey,d[surfaceKey]??'',{step:'0.1',trace:'associatedSlabSurface'})}
    ${ef(e,'Épaisseur réelle dalle associée (cm)','thickness',d.thickness??'',{required:true,step:'1',trace:'associatedSlabThickness',help:'Obligatoire dès qu’une dalle associée est chiffrée.'})}
    ${ef(e,'Type dalle associée','slabRef',refId,{trace:'associatedSlabRef',options:[{value:'',label:'Aucune / choisir…'},...workOptions(slabRefs)]})}
    ${ef(e,'Classe béton dalle associée','slabConcreteClass',d.slabConcreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]})}
    ${insulation}
  </div>`;
  if(refId){
    h+=`<div class="grid cols-4" style="margin-top:14px">
      <div class="panel soft">${ec(e,'Treillis soudé','treillis',!!d.treillis,'slabTreillis')}<br>${ec(e,'Fibres','fibres',!!d.fibres,'slabFibres')}</div>
      ${d.treillis?ef(e,'Type de treillis','treillisType',d.treillisType??'ST25C',{trace:'treillisType',options:treillisOptions()}):''}
      ${d.fibres?ef(e,'Type de fibres','fibreType',d.fibreType??'courante',{trace:'fibreType',options:Object.entries(FIBRES).map(([id,r])=>({value:id,label:`${r.label} — ${r.min} à ${r.max} kg/m³`}))}):''}
      ${d.fibres?ef(e,'Dosage fibres (kg/m³)','fibreDose',num(d.fibreDose)>0?d.fibreDose:(FIBRES[d.fibreType||'courante']?.min??''),{required:true,step:'0.1',trace:'fibreDose',help:'Prérempli automatiquement avec le minimum de la plage métier. Modifiable.'}):''}
    </div>`;
  }
  return h;
}

function renderFoundationElement(e){
  const d=e.data;
  let sub=`<div class="grid cols-2">${ef(e,'Type de fondation','foundationType',d.foundationType??'vide_sanitaire',{trace:'foundationType',options:[
    {value:'micro_pieux',label:'Micro-pieux'},{value:'plot_isole',label:'Plot isolé'},{value:'vide_sanitaire',label:'Vide sanitaire'},{value:'terre_plein',label:'Terre plein'}
  ]})}</div>`;

  if(d.foundationType==='micro_pieux'){
    const suggested=micropileSuggestedPrice(d.microDepth);
    sub+=`<div class="grid cols-3" style="margin-top:14px">
      ${ef(e,'Nombre de micro-pieux','microCount',d.microCount??'',{required:true,step:'1',trace:'microCount'})}
      ${ef(e,'Profondeur par micro-pieu (m)','microDepth',d.microDepth??'',{required:true,step:'0.1',trace:'microDepth',help:'Utilisée uniquement pour proposer le prix métier Guillaume, jamais pour dimensionner le micropieu.'})}
      ${ef(e,'Prix HT / micro-pieu — fourniture + MO incluse','microPrice',d.microPrice??suggested,{required:true,step:'1',trace:'microPrice',help:suggested?`Proposition Guillaume selon profondeur : ${money(suggested)} / micro-pieu. Modifiable.`:'Saisir une profondeur ≥ 3 m pour obtenir la proposition Guillaume.'})}
    </div>
    ${renderAssociatedSlabControls(e,d,{surfaceKey:'microSlabSurface',surfaceLabel:'Surface dalle sur VS (m²)',insulationKey:'microSlabInsulation',insulationLabel:'Isolation dalle'})}
    <div class="grid cols-4" style="margin-top:14px">
      ${ef(e,'Type de longrine','longrineType',d.longrineType??'sans_becquet',{trace:'longrineType',options:[{value:'sans_becquet',label:'Sans becquet'},{value:'avec_becquet',label:'Avec becquet'}]})}
      ${ef(e,d.longrineType==='avec_becquet'?'Périmètre longrine (m)':'Longueur longrine (m)','beamLength',d.beamLength??'',{step:'0.1',trace:'longrineLength'})}
      ${ef(e,'Largeur section (cm)','beamWidthCm',d.beamWidthCm??'',{step:'1',trace:'longrineWidth'})}
      ${ef(e,'Hauteur section (cm)','beamHeightCm',d.beamHeightCm??'',{step:'1',trace:'longrineHeight'})}
      ${ef(e,'Classe béton longrine','longrineConcreteClass',d.longrineConcreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]})}
    </div><div class="grid cols-2" style="margin-top:10px">
      ${ef(e,'Prix longrine HT / ml','longrinePrice',d.longrinePrice??LONGRINE_PRICE_ML,{step:'1',trace:'longrinePrice',help:'Référence métier Guillaume, modifiable. Poste séparé des micro-pieux.'})}
    </div>`;
    if(d.slabRef) sub+=renderRefOverrides('element',d,d.slabRef).replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
    sub+=renderRefOverrides('element',d,'longrine_fondation').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
  }

  if(d.foundationType==='plot_isole'){
    sub+=`<div class="grid cols-4" style="margin-top:14px">
      ${ef(e,'Quantité de plots','plotCount',d.plotCount??'',{required:true,step:'1',trace:'plotCount'})}
      ${ef(e,'Interprétation du volume','plotVolumeMode',d.plotVolumeMode??'',{required:true,trace:'plotVolumeMode',options:[{value:'',label:'Choisir…'},{value:'unitaire',label:'Volume par plot'},{value:'total',label:'Volume total'}]})}
      ${ef(e,d.plotVolumeMode==='unitaire'?'Volume par plot (m³)':'Volume total (m³)','plotVolume',d.plotVolume??'',{required:true,step:'0.01',trace:'plotVolume'})}
      ${ef(e,'Classe béton plot','foundationConcreteClass',d.foundationConcreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]})}
    </div>${renderRefOverrides('element',d,'semelle_isolee').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`)}`;
  }

  if(['vide_sanitaire','terre_plein'].includes(d.foundationType)){
    sub+=`<div class="separator"></div><h3>Murs de soubassement</h3>
    <div class="grid cols-5">
      ${ef(e,'Périmètre (m)','perimeter',d.perimeter??'',{required:true,step:'0.1',trace:'basementPerimeter'})}
      ${ef(e,'Hauteur du bloc','blockHeight',d.blockHeight??.20,{trace:'basementBlockHeight',options:[{value:'0.20',label:'20 cm'},{value:'0.25',label:'25 cm'}]})}
      ${ef(e,'Nombre de rangs','rows',d.rows??'',{step:'1',trace:'basementRows'})}
      <div class="field"><label>Hauteur totale calculée</label><div class="info-box">${fmt(num(d.blockHeight||.20)*num(d.rows),2)} m</div></div>
      ${ef(e,'Raidisseurs (nb)','stiffeners',d.stiffeners??'',{step:'1',trace:'basementStiffeners'})}
    </div>
    <div class="grid cols-3" style="margin-top:14px">
      ${ef(e,'Largeur semelle (cm)','footingWidthCm',d.footingWidthCm??'',{required:true,step:'1',trace:'basementFootingWidth'})}
      ${ef(e,'Hauteur semelle (cm)','footingHeightCm',d.footingHeightCm??'',{required:true,step:'1',trace:'basementFootingHeight'})}
      ${ef(e,'Classe béton semelle','foundationConcreteClass',d.foundationConcreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]})}
    </div>
    <div class="info-box">Consommations et temps de soubassement calculés automatiquement par SpeedArti.</div>
    <div class="separator"></div><h3>Mur de refend</h3>
    <div class="grid cols-3">
      ${ef(e,'Longueur refend (m)','refendLength',d.refendLength??'',{step:'0.1',trace:'refendLength'})}
      ${ef(e,'Hauteur refend (m)','refendHeight',d.refendHeight??'',{step:'0.1',trace:'refendHeight'})}
      ${ef(e,'Raidisseurs refend (nb)','refendStiffeners',d.refendStiffeners??'',{step:'1',trace:'refendStiffeners'})}
    </div>
    <div class="grid cols-2" style="margin-top:10px">
      ${ef(e,'Largeur semelle sous refend (cm)','refendFootingWidthCm',d.refendFootingWidthCm??d.footingWidthCm??'',{step:'1',trace:'refendFootingWidth',help:'Reprend par défaut la semelle de soubassement, modifiable.'})}
      ${ef(e,'Hauteur semelle sous refend (cm)','refendFootingHeightCm',d.refendFootingHeightCm??d.footingHeightCm??'',{step:'1',trace:'refendFootingHeight',help:'Reprend par défaut la semelle de soubassement, modifiable.'})}
    </div>
    <div class="info-box">Le mur de refend en soubassement comprend sa semelle filante. Consommations et temps du mur calculés automatiquement par SpeedArti.</div>
    ${renderAssociatedSlabControls(e,d,{surfaceKey:'slabSurface',surfaceLabel:'Surface dalle associée (m²)',insulationKey:d.foundationType==='vide_sanitaire'?'slabInsulation':null,insulationLabel:'Type de plancher VS'})}`;
    sub+=renderRefOverrides('element',d,'semelle_filante').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
    sub+=renderRefOverrides('element',d,'potelet_raidisseur_vertical').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
    if(d.slabRef) sub+=renderRefOverrides('element',d,d.slabRef).replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
  }
  return sub;
}

function renderBearingWallElement(e){
  const d=e.data;
  let h=`<div class="grid ${d.method==='prefabrique'?'cols-4':'cols-5'}">
    ${ef(e,'Longueur / périmètre (m)','length',d.length??'',{required:true,step:'0.1',trace:'bearingLength'})}
    ${ef(e,'Hauteur (m)','height',d.height??'',{required:true,step:'0.1',trace:'bearingHeight'})}
    ${ef(e,'Épaisseur (cm)','thickness',d.thickness??20,{required:true,step:'1',trace:'bearingThickness'})}
    ${ef(e,'Méthode','method',d.method??'coule_sur_place',{trace:'bearingMethod',options:[{value:'coule_sur_place',label:'Coulé sur place'},{value:'prefabrique',label:'Préfabriqué'}]})}
    ${d.method!=='prefabrique'?ef(e,'Classe béton','concreteClass',d.concreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]}):''}
  </div>`;
  if(d.method==='prefabrique'){
    h+=`<div class="grid cols-2" style="margin-top:14px">
      ${ef(e,'Type préfabriqué','prefabType',d.prefabType??'standard',{trace:'prefabType',options:[{value:'standard',label:'Standard — 1,55 h-homme/ml'},{value:'hauteur_importante',label:'Hauteur importante — 1,90 h-homme/ml'},{value:'lourd_complexe',label:'Lourd / complexe — 2,75 h-homme/ml'}]})}
      ${ef(e,'Prix total HT / m² — posé, livré, gruté','prefabPriceM2',d.prefabPriceM2??PREFAB_DEFAULT_PRICE_M2,{step:'1',trace:'prefabPriceM2',help:'Référence Guillaume 350 €/m² HT, modifiable. Hors terrassement, drainage, remblai et fondations éventuelles.'})}
    </div><div class="info-box">${esc(PREFAB_TEAM_ADVICE)} Les heures restent au planning mais ne sont pas refacturées si elles sont incluses dans le prix au m².</div>`;
  } else {
    h+=renderRefOverrides('element',d,'mur_banche_courant').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
  }
  h+=`<div class="separator"></div><div class="grid cols-3">
    ${ef(e,'Chaînage horizontal total (ml)','chainHml',d.chainHml??'',{step:'0.1',trace:'bearingChainH'})}
    ${ef(e,'Chaînage vertical total (ml)','chainVml',d.chainVml??'',{step:'0.1',trace:'bearingChainV'})}
    ${ef(e,'Jambes de force (u)','braceQty',d.braceQty??'',{step:'1',trace:'braceQty'})}
  </div>`;
  if(num(d.braceQty)>0) h+=`<div class="grid cols-2" style="margin-top:14px">
    ${ef(e,'Prix HT / jambe de force','bracePrice',d.bracePrice??'',{required:true,step:'1',trace:'bracePrice'})}
    ${ef(e,'Temps MO / jambe (h-homme)','braceHours',d.braceHours??'',{required:true,step:'0.1',trace:'braceHours'})}
  </div>`;
  h+=renderRefOverrides('element',d,'chainage_horizontal').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
  h+=renderRefOverrides('element',d,'chainage_vertical').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
  return h;
}

function renderElevationElement(e){
  const d=e.data;
  let h=`<div class="grid cols-4">
    ${ef(e,'Type de mur','wallType',d.wallType??'murs_exterieurs',{trace:'elevationType',options:[{value:'murs_exterieurs',label:'Murs extérieurs'},{value:'murs_refends',label:'Murs de refends'}]})}
    ${ef(e,'Périmètre / longueur (m)','length',d.length??'',{required:true,step:'0.1',trace:'elevationLength'})}
    ${ef(e,'Hauteur (m)','height',d.height??'',{required:true,step:'0.1',trace:'elevationHeight'})}
    ${ef(e,'Épaisseur (cm)','thickness',d.thickness??20,{required:true,step:'1',trace:'elevationThickness'})}
  </div>
  <div class="grid ${d.material==='beton_banche'?'cols-5':'cols-3'}" style="margin-top:14px">
    ${ef(e,'Matériau','material',d.material??'parpaing',{trace:'elevationMaterial',options:[{value:'parpaing',label:'Parpaing'},{value:'brique',label:'Brique'},{value:'siporex',label:'Siporex'},{value:'beton_banche',label:'Béton banché'}]})}
    ${ef(e,d.material==='beton_banche'?'Méthode':'Méthode de pose','method',d.material==='beton_banche'?(d.method==='prefabrique'?'prefabrique':'coule_sur_place'):(['colle','tradi'].includes(d.method)?d.method:'colle'),{trace:'elevationMethod',options:d.material==='beton_banche'?[{value:'coule_sur_place',label:'Coulé sur place'},{value:'prefabrique',label:'Préfabriqué'}]:[{value:'colle',label:'Collé'},{value:'tradi',label:'Traditionnel'}]})}
    ${ef(e,d.material==='beton_banche'?'Classe béton':'Classe béton — chaînages / ouvrages BA','concreteClass',d.concreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]})}
    ${d.material==='beton_banche'&&d.method==='prefabrique'?ef(e,'Type préfabriqué','prefabType',d.prefabType??'standard',{trace:'prefabType',options:[{value:'standard',label:'Standard — 1,55 h-homme/ml'},{value:'hauteur_importante',label:'Hauteur importante — 1,90 h-homme/ml'},{value:'lourd_complexe',label:'Lourd / complexe — 2,75 h-homme/ml'}]}):''}
    ${d.material==='beton_banche'&&d.method==='prefabrique'?ef(e,'Prix total HT / m² — posé, livré, gruté','prefabPriceM2',d.prefabPriceM2??PREFAB_DEFAULT_PRICE_M2,{step:'1',trace:'prefabPriceM2'}):''}
  </div>`;
  if(d.material!=='beton_banche') h+=`<div class="info-box">SpeedArti applique automatiquement les consommations matières et temps unitaires du matériau sélectionné.</div>`;
  else if(d.method==='prefabrique') h+=`<div class="info-box">Préfabriqué : prix Guillaume par m², modifiable. Pose incluse dans le prix commercial ; planning séparé.</div>`;
  else h+=renderRefOverrides('element',d,'mur_banche_courant').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);

  const chainBase=num(d.length);
  const chainVEstimate=estimatedVerticalChainage(chainBase,d.height);
  h+=`<div class="separator"></div><div class="grid cols-2">
    ${ef(e,'Chaînage horizontal total (ml)','chainHml',d.chainHml??chainBase,{step:'0.1',trace:'elevationChainH',help:'Prérempli avec le périmètre / linéaire connu. Modifiable.'})}
    ${ef(e,'Chaînage vertical total (ml)','chainVml',d.chainVml??chainVEstimate,{step:'0.1',trace:'elevationChainV',help:'Estimation réalisée à partir de ratios Guillaume : périmètre ÷ 3,50, arrondi supérieur, × hauteur. Modifiable ; ce n’est pas une règle DTU.'})}
  </div>`;

  const openings=d.openings||[];
  h+=`<div class="element-card"><header><strong>Ouvertures</strong>${eb(e,'+ Ajouter',`class="btn ghost small" data-add-opening="${e.id}"`,'addOpening')}</header><div class="body">
    ${openings.length?openings.map((o,i)=>`<div class="line-editor"><div class="grid cols-4">
      ${ef(e,'Type',`openings.${i}.type`,o.type??'seuil_ba',{trace:'openingType',options:[{value:'seuil_ba',label:'Seuil BA'},{value:'appui_fenetre_ba',label:'Appui fenêtre BA'},{value:'linteau_ba_courant',label:'Linteau BA courant'},{value:'linteau_ba_renforce',label:'Linteau BA renforcé'},{value:'coffre_tunnel_brique',label:'Coffre tunnel brique'},{value:'coffre_tunnel_resine',label:'Coffre tunnel résine'},{value:'talonnette_manuelle',label:'Talonnette — saisie manuelle'}]})}
      ${ef(e,'Largeur ouverture (m)',`openings.${i}.width`,o.width??'',{step:'0.01',trace:'openingWidth'})}
      ${!['seuil_ba','coffre_tunnel_brique','coffre_tunnel_resine'].includes(o.type)?ef(e,'Hauteur ouverture (m)',`openings.${i}.height`,o.height??'',{step:'0.01',trace:'openingHeight'}):''}
      ${['coffre_tunnel_brique','coffre_tunnel_resine'].includes(o.type)?ef(e,'Prix HT / ml coffre',`openings.${i}.coffrePriceMl`,o.coffrePriceMl??'',{step:'0.01',trace:'openingCoffrePrice',help:'Prix provisoire à saisir en attendant l’audit catalogue.'}):''}
      ${eb(e,'Supprimer',`class="btn danger small" data-remove-opening="${e.id}:${i}"`,'removeOpening')}
    </div>
    ${String(o.type||'').startsWith('linteau')?`<div class="grid cols-2" style="margin-top:10px">${ef(e,'Longueur linteau (ml)',`openings.${i}.lintelLength`,o.lintelLength??o.width??'',{step:'0.01',trace:'openingLintelLength'})}${ef(e,'Référence linteau',`openings.${i}.type`,o.type??'linteau_ba_courant',{trace:'openingLintelRef',options:workOptions(['linteau_ba_courant','linteau_ba_renforce'])})}</div>`:''}
    ${o.type==='talonnette_manuelle'?`<div class="grid cols-2" style="margin-top:10px">${ef(e,'Prix HT talonnette',`openings.${i}.manualPrice`,o.manualPrice??'',{step:'1',trace:'openingManualPrice'})}${ef(e,'Temps MO (h-homme)',`openings.${i}.manualHours`,o.manualHours??'',{step:'0.1',trace:'openingManualHours'})}</div>`:''}
    </div>`).join(''):'<p class="muted">Aucune ouverture.</p>'}
  </div></div>`;
  const openingRefs=[...new Set(openings.map(o=>o.type).filter(id=>WORK_BY_ID[id]))];
  h+=openingRefs.map(id=>renderRefOverrides('element',d,id).replaceAll('data-field=',`data-el-id="${e.id}" data-field=`)).join('');

  const beams=d.beams||[];
  h+=`<div class="element-card"><header><strong>Poutres BA</strong>${eb(e,'+ Ajouter',`class="btn ghost small" data-add-beam="${e.id}"`,'addBeam')}</header><div class="body">
    ${beams.length?beams.map((b,i)=>`<div class="grid cols-5 line-editor">
      ${ef(e,'Longueur (m)',`beams.${i}.length`,b.length??'',{step:'0.01',trace:'beamLength'})}
      ${ef(e,'Largeur (cm)',`beams.${i}.widthCm`,b.widthCm??'',{step:'1',trace:'beamWidth'})}
      ${ef(e,'Hauteur (cm)',`beams.${i}.heightCm`,b.heightCm??'',{step:'1',trace:'beamHeight'})}
      ${ef(e,'Type',`beams.${i}.ref`,b.ref??'poutre_ba_courante',{trace:'beamRef',options:workOptions(['poutre_ba_courante','poutre_ba_fortement_chargee','poutre_rive','poutre_redressement'])})}
      ${eb(e,'Supprimer',`class="btn danger small" data-remove-beam="${e.id}:${i}"`,'removeBeam')}
    </div>`).join(''):'<p class="muted">Aucune poutre.</p>'}
  </div></div>`;
  const beamRefs=[...new Set(beams.map(b=>b.ref||'poutre_ba_courante').filter(id=>WORK_BY_ID[id]))];
  h+=beamRefs.map(id=>renderRefOverrides('element',d,id).replaceAll('data-field=',`data-el-id="${e.id}" data-field=`)).join('');

  const pignons=d.pignons||[];
  h+=`<div class="element-card"><header><strong>Pignons</strong>${eb(e,'+ Ajouter',`class="btn ghost small" data-add-pignon="${e.id}"`,'addPignon')}</header><div class="body">
    ${pignons.length?pignons.map((p,i)=>`<div class="grid cols-3 line-editor">
      ${ef(e,'Largeur (m)',`pignons.${i}.width`,p.width??'',{step:'0.01',trace:'pignonWidth'})}
      ${ef(e,'Pente (%)',`pignons.${i}.slope`,p.slope??'',{step:'0.1',trace:'pignonSlope'})}
      ${eb(e,'Supprimer',`class="btn danger small" data-remove-pignon="${e.id}:${i}"`,'removePignon')}
    </div>`).join(''):'<p class="muted">Aucun pignon.</p>'}
  </div></div>`;

  h+=`<div class="separator"></div><div class="grid cols-3">
    ${ef(e,'Étanchéité','waterproof',d.waterproof??'',{trace:'elevationWaterproof',options:[{value:'',label:'Aucune'},{value:'delta_ms',label:'Delta MS'},{value:'enduit_hydrofuge',label:'Enduit hydrofuge'}]})}
    ${ef(e,'Décoration extérieure','decoration',d.decoration??'',{trace:'elevationDecoration',options:[{value:'',label:'Aucune'},{value:'genoise_simple',label:'Génoise simple'},{value:'genoise_double',label:'Génoise double'},{value:'corniche_pierre',label:'Corniche pierre'}]})}
    ${ec(e,'Traitement anti-termite','antiTermite',!!d.antiTermite,'elevationAntiTermite')}
  </div>`;
  h+=renderRefOverrides('element',d,'chainage_horizontal').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
  h+=renderRefOverrides('element',d,'chainage_vertical').replaceAll('data-field=',`data-el-id="${e.id}" data-field=`);
  return h;
}

function renderSlabElement(e){
  const d=e.data,refId=d.slabRef||'';
  return `<div class="grid cols-5">
    ${ef(e,'Longueur (m)','length',d.length??'',{required:true,step:'0.1',trace:'slabLength'})}
    ${ef(e,'Largeur (m)','width',d.width??'',{required:true,step:'0.1',trace:'slabWidth'})}
    ${ef(e,'Épaisseur réelle (cm)','thickness',d.thickness??12,{required:true,step:'1',trace:'slabThickness'})}
    ${ef(e,'Type de dalle','slabRef',refId,{required:true,trace:'slabRef',options:[{value:'',label:'Choisir…'},...workOptions(['dallage_non_arme','dallage_arme','dalle_pleine_ba','dalle_pleine_fortement_armee','dalle_portee','plancher_poutrelles_hourdis','plancher_predalles'])]})}
    ${ef(e,'Classe béton','concreteClass',d.concreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]})}
  </div><div class="grid cols-4" style="margin-top:14px">
    <div class="panel soft">${ec(e,'Treillis soudé','treillis',!!d.treillis,'slabTreillis')}<br>${ec(e,'Fibres','fibres',!!d.fibres,'slabFibres')}</div>
    ${d.treillis?ef(e,'Type de treillis','treillisType',d.treillisType??'ST25C',{trace:'treillisType',options:treillisOptions()}):''}
    ${d.fibres?ef(e,'Type de fibres','fibreType',d.fibreType??'courante',{trace:'fibreType',options:Object.entries(FIBRES).map(([id,r])=>({value:id,label:`${r.label} — ${r.min} à ${r.max} kg/m³`}))}):''}
    ${d.fibres?ef(e,'Dosage fibres (kg/m³)','fibreDose',num(d.fibreDose)>0?d.fibreDose:(FIBRES[d.fibreType||'courante']?.min??''),{required:true,step:'0.1',trace:'fibreDose',help:'Prérempli automatiquement avec le minimum de la plage métier. Modifiable.'}):''}
  </div>${refId?renderRefOverrides('element',d,refId).replaceAll('data-field=',`data-el-id="${e.id}" data-field=`):''}`;
}

function renderGenericWorkElement(e){
  const d=e.data,refId=d.workRef||'beton_proprete',ref=WORK_BY_ID[refId];
  return `<div class="grid cols-3">
    ${ef(e,'Ouvrage BA','workRef',refId,{trace:'genericWorkRef',options:workOptions()})}
    ${ef(e,`Quantité (${ref?.unite||'unité'})`,'quantity',d.quantity??'',{required:true,step:'0.001',trace:'genericWorkQty'})}
    ${ef(e,'Classe béton','concreteClass',d.concreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]})}
  </div>${renderRefOverrides('element',d,refId).replaceAll('data-field=',`data-el-id="${e.id}" data-field=`)}`;
}

function chimneyOverrideValue(d,kind,id,key,base){
  const v=d.chimneyOverrides?.[kind]?.[id]?.[key];
  return v!==undefined?v:base;
}

function chimneyOverrideFields(scope,d,kind,id,ref,e=null){
  if(!id||!ref)return '';
  const p=`chimneyOverrides.${kind}.${id}`;
  const F=(label,key,val,trace)=> scope==='element'
    ? ef(e,label,`${p}.${key}`,val,{step:'0.01',trace})
    : field(label,`${p}.${key}`,val,{step:'0.01',trace});
  return `<details class="accordion"><summary>⚙️ Valeurs modifiables — ${esc(ref.label)}</summary><div class="accordion-body"><div class="grid cols-3">
    ${F('Fourniture HT', 'supply', chimneyOverrideValue(d,kind,id,'supply',ref.supply), 'chimneySupplyOverride')}
    ${F('Temps MO', 'hours', chimneyOverrideValue(d,kind,id,'hours',ref.h), 'chimneyHoursOverride')}
    ${F('Total HT', 'total', chimneyOverrideValue(d,kind,id,'total',ref.total), 'chimneyTotalOverride')}
  </div></div></details>`;
}

function renderChimneyConfig(scope,d,e=null){
  const F=(label,key,val,opts)=> scope==='element'?ef(e,label,key,val,opts):field(label,key,val,opts);
  const cId=d.conduit||'20x20', c=CHIMNEY_CONDUITS[cId];
  const sId=d.stack||'', s=CHIMNEY_STACKS[sId];
  const capId=d.cap||'', cap=CHIMNEY_CAPS[capId];
  let h=`<div class="section-title"><h2>Cheminée</h2><p>Calcul automatique modifiable, remplaçable par un prix manuel.</p></div>
  <div class="grid cols-4">
    ${F('Hauteur conduit (ml)','height',d.height??'',{required:true,step:'0.1',trace:'chimneyHeight'})}
    ${F('Nombre de conduits','count',d.count??1,{required:true,step:'1',min:'1',trace:'chimneyCount'})}
    ${F('Type de conduit','conduit',cId,{trace:'chimneyConduit',options:Object.entries(CHIMNEY_CONDUITS).map(([id,r])=>({value:id,label:r.label}))})}
    ${F('Type de foyer','foyer',d.foyer??'ouvert',{trace:'chimneyFoyer',options:[{value:'ouvert',label:'Foyer ouvert'},{value:'insert',label:'Insert'},{value:'poele',label:'Poêle'},{value:'chaudiere',label:'Chaudière'}]})}
  </div>
  <div class="grid cols-4" style="margin-top:14px">
    ${F('Souche','stack',sId,{trace:'chimneyStack',options:[{value:'',label:'Aucune'},...Object.entries(CHIMNEY_STACKS).map(([id,r])=>({value:id,label:r.label}))]})}
    ${F('Nombre de souches','stackCount',d.stackCount??0,{step:'1',min:'0',trace:'chimneyStackCount'})}
    ${F('Chapeau','cap',capId,{trace:'chimneyCap',options:[{value:'',label:'Aucun'},...Object.entries(CHIMNEY_CAPS).map(([id,r])=>({value:id,label:r.label}))]})}
    ${F('Nombre de chapeaux','capCount',d.capCount??0,{step:'1',min:'0',trace:'chimneyCapCount'})}
  </div>
  <div class="grid cols-2" style="margin-top:14px">
    ${F('Prix manuel total HT (€) — facultatif','manualPrice',d.manualPrice??'',{step:'1',trace:'chimneyManualPrice',help:'Remplace le prix automatique ; les heures restent utilisées pour le planning.'})}
  </div>
  ${chimneyOverrideFields(scope,d,'conduit',cId,c,e)}
  ${s?chimneyOverrideFields(scope,d,'stack',sId,s,e):''}
  ${cap?chimneyOverrideFields(scope,d,'cap',capId,cap,e):''}`;
  return h;
}

const FOUNDATION_GLOBAL_OPTIONS = [
  ['resineAntiTermite','Résine anti-termite'],['implantation','Implantation'],['ouvertureFondations','Ouverture des fondations'],
  ['canalisationFourreau','Canalisation + fourreau'],['plateformeVs','Plateforme VS'],['enduitHydrofugeFondation','Enduit hydrofuge'],
  ['deltaMs','Delta MS'],['etudeSol','Étude de sol']
];

function renderPricedGlobalOption(g,key,label){
  const o=g.foundationOptions?.[key]||{};
  const path=`foundationOptions.${key}`;
  return `<div class="option-priced">${check(label,`${path}.enabled`,!!o.enabled,'global','foundationOption')}
    ${o.enabled?`<div class="grid cols-3" style="margin-top:8px">
      ${field('Quantité',`${path}.qty`,o.qty??1,{scope:'global',step:'0.01',trace:'foundationOptionQty'})}
      ${field('Unité',`${path}.unit`,o.unit??'forfait',{scope:'global',trace:'foundationOption',options:[{value:'forfait',label:'forfait'},{value:'m²',label:'m²'},{value:'ml',label:'ml'},{value:'m³',label:'m³'},{value:'jour',label:'jour'}]})}
      ${field('Prix U. HT',`${path}.price`,o.price??'',{scope:'global',step:'0.01',required:true,trace:'foundationOptionPrice'})}
    </div>`:''}
  </div>`;
}

export function renderOptions(state){
  const g=state.globals,d=state.simple;
  let specific='';
  if(state.mode==='simple'&&state.simpleType==='murs'){
    const simplePerimeter=num(d.width)>0?2*(num(d.length)+num(d.width)):num(d.length);
    const simpleVEstimate=estimatedVerticalChainage(simplePerimeter,d.height);
    const isBanche=d.material==='beton_banche';
    const simpleNeedsConcreteClass=isBanche||!!d.chainH||!!d.chainV||(d.openings||[]).some(o=>['appui_fenetre_ba','seuil_ba','linteau_ba_courant','linteau_ba_renforce'].includes(o.associated));
    specific=`<details class="accordion" open><summary>🏗️ Matériaux de construction</summary><div class="accordion-body">
      <div class="grid ${isBanche?'cols-5':simpleNeedsConcreteClass?'cols-3':'cols-2'}">
        ${field('Type de bloc / matériau','material',d.material??'parpaing',{trace:'wallMaterial',options:[{value:'parpaing',label:'Parpaing creux'},{value:'brique',label:'Brique de terre cuite'},{value:'beton_cellulaire',label:'Béton cellulaire (Siporex)'},{value:'pierre',label:'Pierre naturelle'},{value:'beton_banche',label:'Béton banché'}]})}
        ${field(isBanche?'Méthode':'Méthode de pose','method',isBanche?(d.method==='prefabrique'?'prefabrique':'coule_sur_place'):(['tradi','colle'].includes(d.method)?d.method:'tradi'),{trace:'wallMethod',options:isBanche?[{value:'coule_sur_place',label:'Coulé sur place'},{value:'prefabrique',label:'Préfabriqué'}]:[{value:'tradi',label:'Traditionnelle (mortier)'},{value:'colle',label:'Collée (joint mince)'}]})}
        ${simpleNeedsConcreteClass?field(isBanche?'Classe béton':'Classe béton — ouvrages BA / chaînages','concreteClass',d.concreteClass??'',{required:true,trace:'concreteClass',options:[{value:'',label:'Choisir…'},...concreteClassOptions()]}):''}
        ${isBanche&&d.method==='prefabrique'?field('Type préfabriqué','prefabType',d.prefabType??'standard',{trace:'prefabType',options:[{value:'standard',label:'Standard — 1,55 h-homme/ml'},{value:'hauteur_importante',label:'Hauteur importante — 1,90 h-homme/ml'},{value:'lourd_complexe',label:'Lourd / complexe — 2,75 h-homme/ml'}]}):''}
        ${isBanche&&d.method==='prefabrique'?field('Prix total HT / m² — posé, livré, gruté','prefabPriceM2',d.prefabPriceM2??PREFAB_DEFAULT_PRICE_M2,{step:'1',trace:'prefabPriceM2'}):''}
      </div><div class="separator"></div>
      ${check('Chaînage horizontal','chainH',!!d.chainH,'simple','wallChainH')}<br>${check('Chaînage vertical','chainV',!!d.chainV,'simple','wallChainV')}
      ${d.chainH||d.chainV?`<div class="grid cols-2" style="margin-top:10px">${d.chainH?field('Linéaire horizontal total (ml)','chainHml',d.chainHml??simplePerimeter,{step:'0.1',trace:'wallChainH',help:'Prérempli avec le périmètre connu. Modifiable.'}):''}${d.chainV?field('Linéaire vertical total (ml)','chainVml',d.chainVml??simpleVEstimate,{step:'0.1',trace:'wallChainV',help:'Estimation réalisée à partir de ratios Guillaume : périmètre ÷ 3,50, arrondi supérieur, × hauteur. Modifiable ; ce n’est pas une règle DTU.'}):''}</div>`:''}
      ${d.chainH?renderRefOverrides('simple',d,'chainage_horizontal'):''}${d.chainV?renderRefOverrides('simple',d,'chainage_vertical'):''}
      ${isBanche&&d.method!=='prefabrique'?renderRefOverrides('simple',d,'mur_banche_courant'):''}
    </div></details>`;
  }
  if(state.mode==='simple'&&['dalle','terrasse'].includes(state.simpleType)){
    specific=`<details class="accordion" open><summary>⬜ Options dalle</summary><div class="accordion-body">
      ${check('Treillis soudé','treillis',!!d.treillis,'simple','slabTreillis')}<br>${check('Fibres','fibres',!!d.fibres,'simple','slabFibres')}
      ${d.treillis?`<div class="grid cols-2" style="margin-top:10px">${field('Type de treillis','treillisType',d.treillisType??'ST25C',{trace:'treillisType',options:treillisOptions()})}<div class="info-box">ST25C est une proposition métier Guillaume sur les cas prévus, modifiable ; ce n’est pas un dimensionnement structurel automatique.</div></div>`:''}
      ${d.fibres?`<div class="grid cols-2" style="margin-top:10px">${field('Type de fibres','fibreType',d.fibreType??'courante',{trace:'fibreType',options:Object.entries(FIBRES).map(([id,r])=>({value:id,label:`${r.label} — ${r.min} à ${r.max} kg/m³`}))})}${field('Dosage fibres (kg/m³)','fibreDose',num(d.fibreDose)>0?d.fibreDose:(FIBRES[d.fibreType||'courante']?.min??''),{required:true,step:'0.1',trace:'fibreDose',help:'Prérempli automatiquement avec le minimum de la plage métier. Modifiable.'})}</div><div class="alert warn">${esc(FIBRE_WARNING)}</div>`:''}
      ${state.simpleType==='terrasse'?`<div class="separator"></div>${check('Étanchéité terrasse','terraceWaterproof',!!d.terraceWaterproof,'simple','terraceWaterproof')}${d.terraceWaterproof?field('Prix HT / m² étanchéité','terraceWaterproofPrice',d.terraceWaterproofPrice??'',{step:'0.01',required:true,trace:'terraceWaterproofPrice'}):''}<br>${check('Isolation thermique sous dalle','terraceInsulation',!!d.terraceInsulation,'simple','terraceInsulation')}${d.terraceInsulation?field('Prix HT / m² isolation','terraceInsulationPrice',d.terraceInsulationPrice??'',{step:'0.01',required:true,trace:'terraceInsulationPrice'}):''}`:''}
    </div></details>`;
  }

  const hasFoundation = state.mode==='simple'?state.simpleType==='fondations':state.elements.some(e=>e.type==='fondations');
  const foundationOptions = hasFoundation?`<details class="accordion"><summary>⛏️ Options fondations</summary><div class="accordion-body">${FOUNDATION_GLOBAL_OPTIONS.map(([k,l])=>renderPricedGlobalOption(g,k,l)).join('')}</div></details>`:'';

  return `<div class="section-title"><h2>Options chantier</h2><p>Chaque option visible possède un effet calculé, un prix explicite, des heures ou un contrôle de rapport.</p></div>
  ${specific}${foundationOptions}
  <details class="accordion" open><summary>🚚 Transport béton / location</summary><div class="accordion-body">
    <div class="grid cols-2"><div>${check('Camion-benne 8×4','truck',!!g.truck,'global','truck')}${g.truck?`<div class="grid cols-2" style="margin-top:10px">${field('Prix HT / jour','truckPrice',g.truckPrice??TRUCK_8X4_DEFAULT,{scope:'global',step:'1',trace:'truckPrice'})}${field('Nombre de jours','truckDays',g.truckDays??1,{scope:'global',step:'1',min:'1',trace:'truckDays'})}</div>${check('Enregistrer ce prix pour les prochains chiffrages','saveTruckPrice',!!g.saveTruckPrice,'global','saveTruckPrice')}`:''}</div>
    <div>${check('Camion pompe','pump',!!g.pump,'global','pump')}${g.pump?field('Prix HT camion pompe','pumpPrice',g.pumpPrice??PUMP_DEFAULT_PRICE,{scope:'global',step:'1',required:true,trace:'pumpPrice',help:'Référence Guillaume 950 € HT, modifiable.'}):''}<br>${check('Toupie béton','toupie',!!g.toupie,'global','toupie')}${g.toupie?`<div class="grid cols-2" style="margin-top:10px">${field('Mode toupie','toupieMode',g.toupieMode??'auto_volume',{scope:'global',trace:'toupieMode',options:[{value:'auto_volume',label:'Automatique selon volume béton'},{value:'manuel',label:'Nombre de toupies manuel'}]})}${field('Prix HT / m³','toupiePrice',g.toupiePrice??TOUPIE_PRICE_M3,{scope:'global',step:'1',required:true,trace:'toupiePrice',help:'Référence Guillaume 190 €/m³, minimum facturé 6 m³.'})}${g.toupieMode==='manuel'?field('Nombre de toupies','toupies',g.toupies??1,{scope:'global',step:'1',min:'1',trace:'toupies',help:`Capacité métier retenue : ${TOUPIE_CAPACITY_M3} m³ max par toupie.`}):''}</div><div class="info-box">Toupie : ${money(TOUPIE_PRICE_M3)}/m³, minimum ${TOUPIE_MIN_BILLABLE_M3} m³ = ${money(TOUPIE_PRICE_M3*TOUPIE_MIN_BILLABLE_M3)}. Capacité retenue avec Guillaume : ${TOUPIE_CAPACITY_M3} m³ maximum par toupie.</div>`:''}</div></div>
    <div class="separator"></div>${field('Contrôle productivité béton','concreteControlMode',g.concreteControlMode??'aucun',{scope:'global',trace:'concreteControlMode',options:[{value:'aucun',label:'Aucun contrôle complémentaire'},{value:'betonniere',label:'Bétonnière — 4 h-homme/m³'},{value:'toupie',label:'Toupie — 1 h-homme/m³'}],help:'Affiché comme contrôle de planning séparé ; non additionné automatiquement aux temps ouvrage pour éviter un double comptage.'})}
  </div></details>
  <details class="accordion"><summary>⛏️ Préparation et accès</summary><div class="accordion-body">
    ${check('Terrassement','earthworks',!!g.earthworks,'global','earthworks')}${g.earthworks?`<div class="grid cols-3">${field('Quantité','earthworksQty',g.earthworksQty??'',{scope:'global',step:'0.01',required:true,trace:'earthworksQty'})}${field('Unité','earthworksUnit',g.earthworksUnit??'m³',{scope:'global',trace:'earthworksUnit',options:[{value:'m³',label:'m³'},{value:'m²',label:'m²'},{value:'ml',label:'ml'},{value:'forfait',label:'forfait'}]})}${field('Prix U. HT','earthworksPrice',g.earthworksPrice??'',{scope:'global',step:'0.01',required:true,trace:'earthworksPrice'})}</div>`:''}<br>
    ${check('Remblaiement','backfill',!!g.backfill,'global','backfill')}${g.backfill?`<div class="grid cols-3">${field('Quantité','backfillQty',g.backfillQty??'',{scope:'global',step:'0.01',required:true,trace:'backfillQty'})}${field('Unité','backfillUnit',g.backfillUnit??'m³',{scope:'global',trace:'backfillUnit',options:[{value:'m³',label:'m³'},{value:'m²',label:'m²'},{value:'ml',label:'ml'},{value:'forfait',label:'forfait'}]})}${field('Prix U. HT','backfillPrice',g.backfillPrice??'',{scope:'global',step:'0.01',required:true,trace:'backfillPrice'})}</div>`:''}<br>
    ${check('Échafaudage','scaffold',!!g.scaffold,'global','scaffold')}${g.scaffold?`<div class="grid cols-3">${field('Quantité','scaffoldQty',g.scaffoldQty??'',{scope:'global',step:'0.01',required:true,trace:'scaffoldQty'})}${field('Unité','scaffoldUnit',g.scaffoldUnit??'jour',{scope:'global',trace:'scaffoldUnit',options:[{value:'jour',label:'jour'},{value:'m²',label:'m²'},{value:'forfait',label:'forfait'}]})}${field('Prix U. HT','scaffoldPrice',g.scaffoldPrice??'',{scope:'global',step:'0.01',required:true,trace:'scaffoldPrice'})}</div>`:''}<br>
    ${check('Accès difficile — plus-value en heures explicites','difficultAccess',!!g.difficultAccess,'global','difficultAccess')}${g.difficultAccess?field('Heures-homme supplémentaires','difficultAccessHours',g.difficultAccessHours??'',{scope:'global',step:'0.1',required:true,trace:'difficultAccessHours'}):''}
  </div></details>
  <details class="accordion"><summary>🎨 Finitions</summary><div class="accordion-body">
    ${check('Enduit de finition','finishCoat',!!g.finishCoat,'global','finishCoat')}${g.finishCoat?`<div class="grid cols-3">${field('Quantité','finishCoatQty',g.finishCoatQty??'',{scope:'global',step:'0.01',required:true,trace:'finishCoatQty'})}${field('Unité','finishCoatUnit',g.finishCoatUnit??'m²',{scope:'global',trace:'finishCoatUnit',options:[{value:'m²',label:'m²'},{value:'forfait',label:'forfait'}]})}${field('Prix U. HT','finishCoatPrice',g.finishCoatPrice??'',{scope:'global',step:'0.01',required:true,trace:'finishCoatPrice'})}</div>`:''}<br>
    ${check('Enduit hydrofuge','waterproofCoat',!!g.waterproofCoat,'global','waterproofCoat')}${g.waterproofCoat?`<div class="grid cols-3">${field('Quantité','waterproofCoatQty',g.waterproofCoatQty??'',{scope:'global',step:'0.01',required:true,trace:'waterproofCoatQty'})}${field('Unité','waterproofCoatUnit',g.waterproofCoatUnit??'m²',{scope:'global',trace:'waterproofCoatUnit',options:[{value:'m²',label:'m²'},{value:'forfait',label:'forfait'}]})}${field('Prix U. HT','waterproofCoatPrice',g.waterproofCoatPrice??'',{scope:'global',step:'0.01',required:true,trace:'waterproofCoatPrice'})}</div>`:''}
  </div></details>`;
}

function line(id,name,category,qty,unit,price=0,priceMode='required',meta={}){
  return {id,name,category,qty:Math.max(0,num(qty)),unit,price:Math.max(0,num(price)),priceMode,...meta};
}
function labor(name,hours,meta={}){ return {name,hours:Math.max(0,num(hours)),...meta}; }

function addRefLines(lines,ref,quantity,prefix,concreteClass='C25/30'){
  const q=num(quantity); if(!(q>0&&ref))return 0;
  if(ref.betonParUnite>0){
    lines.push(line(
      `${prefix}-beton`,
      `Béton ${concreteClass} — ${ref.label}`,
      'Béton',q*ref.betonParUnite,'m³',0,'required',
      {catalogRole:'concrete'}
    ));
  }
  if(ref.acierParUnite>0){
    const meta={};
    // Le prix du poste reste calculé sur les kg Guillaume, mais le catalogue peut
    // utiliser le linéaire/surface physique de l'ouvrage pour commander des barres/panneaux.
    if(['ml','m²'].includes(ref.unite)){
      meta.catalogNeedQty=q;
      meta.catalogNeedUnit=ref.unite;
    }
    lines.push(line(
      `${prefix}-acier`,
      `Acier indicatif — ${ref.label}`,
      'Ferraillage',q*ref.acierParUnite,'kg',0,'required',meta
    ));
  }
  if(ref.coffrageParUnite>0){
    lines.push(line(
      `${prefix}-coffrage`,
      `Coffrage — ${ref.label}`,
      'Coffrage',q*ref.coffrageParUnite,'m²',0,'required',
      {catalogRole:'coffrage_surface'}
    ));
  }
  return q*ref.moHParUnite;
}

function addRefLinesIncluded(lines,ref,quantity,prefix,concreteClass='C25/30'){
  const q=num(quantity); if(!(q>0&&ref))return 0;
  if(ref.betonParUnite>0) lines.push(line(`${prefix}-beton`,`Béton ${concreteClass} — ${ref.label}`,'Béton',q*ref.betonParUnite,'m³',0,'included',{includedInPackage:true}));
  if(ref.acierParUnite>0) lines.push(line(`${prefix}-acier`,`Acier indicatif — ${ref.label}`,'Ferraillage',q*ref.acierParUnite,'kg',0,'included',{includedInPackage:true}));
  if(ref.coffrageParUnite>0) lines.push(line(`${prefix}-coffrage`,`Coffrage — ${ref.label}`,'Coffrage',q*ref.coffrageParUnite,'m²',0,'included',{includedInPackage:true}));
  return q*ref.moHParUnite;
}

function addDirectPricedLine(lines,id,name,category,qty,unit,price){
  if(num(qty)>0) lines.push(line(id,name,category,qty,unit,price,'explicit'));
}

function isFibrePriceLine(line){
  return /\bfibres?\b/i.test(String(line?.name||''))&&line?.unit==='kg';
}

// Le catalogue est une source de prix automatique : l'artisan n'a pas à sélectionner
// un article pour obtenir un chiffrage. Une sélection utilisateur compatible reste prioritaire.
// Les fibres génériques restent à confirmer tant que la référence produit/dosage n'est pas validée.
function resolveAutomaticCataloguePrice(line,preferredRef=''){
  if(preferredRef){
    const preferred=resolveCatalogueProduct(line,preferredRef);
    if(preferred?.compatible)return {referenceCatalogue:preferredRef,resolved:preferred,automatic:false};
  }
  if(isFibrePriceLine(line))return {referenceCatalogue:'',resolved:null,automatic:false};
  const candidates=catalogueCandidatesForLine(line,20);
  for(const product of candidates){
    const resolved=resolveCatalogueProduct(line,product.referenceCatalogue);
    if(resolved?.compatible)return {referenceCatalogue:product.referenceCatalogue,resolved,automatic:true};
  }
  return {referenceCatalogue:'',resolved:null,automatic:false};
}
function referenceFallbackPrice(line){
  if(line?.category==='Béton'&&line?.unit==='m³')return {price:TOUPIE_PRICE_M3,source:`Référence SpeedArti béton prêt à l’emploi — ${money(TOUPIE_PRICE_M3)}/m³`,kind:'beton_reference'};
  if(line?.category==='Ferraillage'&&line?.unit==='kg'&&!isFibrePriceLine(line)){const price=genericRebarPricePerKg();if(price>0)return {price,source:'Catalogue Maçon SpeedArti — fer à béton converti au kg depuis dimensions catalogue',kind:'acier_reference'};}
  return null;
}


function chimneyResolved(d,kind,id,base){
  const ov=d.chimneyOverrides?.[kind]?.[id]||{};
  return {supply:ov.supply!==undefined?num(ov.supply):base.supply,h:ov.hours!==undefined?num(ov.hours):base.h,total:ov.total!==undefined?num(ov.total):base.total,label:base.label};
}

function calcChimney(d,prefix='chimney'){
  const lines=[], lab=[], alerts=[], reco=[];
  const height=num(d.height),count=Math.max(0,num(d.count));
  if(!(height>0)) alerts.push('🚨 Hauteur de conduit obligatoire.');
  if(!(count>0)) alerts.push('🚨 Nombre de conduits obligatoire.');
  let validatedLaborValue=0;
  if(height>0&&count>0){
    const base=CHIMNEY_CONDUITS[d.conduit||'20x20']; const r=chimneyResolved(d,'conduit',d.conduit||'20x20',base);
    lines.push(line(`${prefix}-conduit`,r.label,'Cheminée',height*count,'ml',r.supply,'validated'));
    lab.push(labor(`${r.label} — planning`,height*count*r.h,{annexPrice:(r.total-r.supply)*height*count}));
    validatedLaborValue+=(r.total-r.supply)*height*count;
  }
  const stackCount=num(d.stackCount);
  if(d.stack&&!(stackCount>0))alerts.push('🚨 Souche sélectionnée : quantité obligatoire. La sélection propose 1 par défaut.');
  if(d.stack&&stackCount>0){
    const base=CHIMNEY_STACKS[d.stack],r=chimneyResolved(d,'stack',d.stack,base);
    lines.push(line(`${prefix}-stack`,r.label,'Cheminée',stackCount,'unité',r.supply,'validated'));
    lab.push(labor(`${r.label} — planning`,stackCount*r.h,{annexPrice:(r.total-r.supply)*stackCount}));
    validatedLaborValue+=(r.total-r.supply)*stackCount;
  }
  const capCount=num(d.capCount);
  if(d.cap&&!(capCount>0))alerts.push('🚨 Chapeau sélectionné : quantité obligatoire. La sélection propose 1 par défaut.');
  if(d.cap&&capCount>0){
    const base=CHIMNEY_CAPS[d.cap],r=chimneyResolved(d,'cap',d.cap,base);
    lines.push(line(`${prefix}-cap`,r.label,'Cheminée',capCount,'unité',r.supply,'validated'));
    lab.push(labor(`${r.label} — planning`,capCount*r.h,{annexPrice:(r.total-r.supply)*capCount}));
    validatedLaborValue+=(r.total-r.supply)*capCount;
  }
  reco.push(`Type de foyer : ${d.foyer||'non renseigné'} (information chantier).`);
  reco.push('Cheminée : temps et montants de référence modifiables ; prix manuel possible.');
  if(num(d.manualPrice)>0){
    return {lines:[line(`${prefix}-manual`,'Cheminée — prix manuel total','Cheminée',1,'forfait',num(d.manualPrice),'explicit')],labor:lab.map(x=>({...x,includedInManual:true,annexPrice:undefined})),alerts,reco,laborPriceOverride:0,manualTotal:true};
  }
  return {lines,labor:lab,alerts,reco,laborPriceOverride:validatedLaborValue,manualTotal:false};
}

function addOpeningAssociated(lines,lab,o,prefix,container,concreteClass,alerts){
  const w=num(o.width),h=num(o.height),assoc=o.type||o.associated||'';
  const area=['seuil_ba','coffre_tunnel_brique','coffre_tunnel_resine'].includes(assoc)?0:w*h;
  if(assoc==='talonnette_manuelle'){
    if(num(o.manualPrice)>0) lines.push(line(`${prefix}-talonnette`,'Talonnette — prix manuel','Maçonnerie',1,'unité',num(o.manualPrice),'explicit'));
    else alerts.push('🚨 Talonnette : prix manuel obligatoire.');
    if(num(o.manualHours)>0) lab.push(labor('Talonnette',num(o.manualHours)));
    return area;
  }
  if(['coffre_tunnel_brique','coffre_tunnel_resine'].includes(assoc)){
    if(!(w>0))alerts.push('🚨 Coffre tunnel : largeur de baie obligatoire.');
    const pr=num(o.coffrePriceMl);
    if(!(pr>0))alerts.push(`🚨 ${assoc==='coffre_tunnel_brique'?'Coffre tunnel brique':'Coffre tunnel résine'} : prix HT/ml obligatoire.`);
    else addDirectPricedLine(lines,`${prefix}-${assoc}`,assoc==='coffre_tunnel_brique'?'Coffre tunnel brique':'Coffre tunnel résine','Coffres tunnels',w,'ml',pr);
    return area;
  }
  const refId=assoc;
  if(['appui_fenetre_ba','seuil_ba'].includes(refId)){
    const ref=resolvedRef(container,refId), q=w;
    lab.push(labor(ref.label,addRefLines(lines,ref,q,`${prefix}-${refId}`,concreteClass)));
  }
  if(['linteau_ba_courant','linteau_ba_renforce'].includes(refId)){
    const q=num(o.lintelLength)||w;
    const ref=resolvedRef(container,refId);
    lab.push(labor(ref.label,addRefLines(lines,ref,q,`${prefix}-${refId}`,concreteClass)));
  }
  return area;
}

function calcWallSimple(state,lines,lab,alerts,reco){
  const d=state.simple,g=state.globals,cc=concreteClassFor(d,g);
  const L=num(d.length),W=num(d.width),H=num(d.height),T=num(d.thickness);
  const perimeter=W>0?2*(L+W):L;
  const gross=perimeter*H;
  const openingsArea=(d.openings||[]).reduce((s,o)=>s+num(o.width)*num(o.height),0);
  const net=Math.max(0,gross-openingsArea);
  if(!(L>0&&H>0&&T>0))alerts.push('🚨 Dimensions du mur incomplètes.');
  if(openingsArea>gross)alerts.push('🚨 Surface des ouvertures supérieure à la surface du mur.');
  if(d.material==='beton_banche'){
    if(d.method==='prefabrique'){
      const price=num(d.prefabPriceM2)||PREFAB_DEFAULT_PRICE_M2;
      lines.push(line('simple-wall-prefab','Mur préfabriqué béton — posé, livré, gruté','Structure préfabriquée',net,'m²',price,'explicit'));
      const hh=PREFAB_H_PER_ML[d.prefabType||'standard'];
      if(hh>0)lab.push(labor('Mur préfabriqué — planning pose',perimeter*hh,{includedInManual:true}));
      reco.push('Mur préfabriqué : prix commercial au m² incluant pose, livraison et grutage ; heures conservées uniquement pour le planning.');
    }else{
      const ref=resolvedRef(d,'mur_banche_courant');
      lab.push(labor('Mur banché',addRefLines(lines,ref,net,'simple-wall-banche',cc)));
    }
  }else{
    if(!(masonryRatio(d,'blocksPerM2')>0))alerts.push('🚨 Référentiel interne SpeedArti indisponible pour la consommation de ce matériau.');
    if(!(masonryRatio(d,'wallHPerM2')>0))alerts.push('🚨 Référentiel interne SpeedArti indisponible pour le temps de pose de ce matériau.');
    if(net>0&&masonryRatio(d,'blocksPerM2')>0)lines.push(line(`simple-wall-block-${d.material||'parpaing'}-${T}`,`${d.material||'parpaing'} ${T} cm`,'Maçonnerie',net*masonryRatio(d,'blocksPerM2'),'unité'));
    if(d.method==='tradi')addSiteMortarLines(lines,d,net,'simple-wall-mortar',reco);
    else if(net>0&&num(d.mortarKgM2)>0)lines.push(line('simple-wall-colle','Colle / mortier-colle','Liants',net*num(d.mortarKgM2),'kg'));
    if(masonryRatio(d,'wallHPerM2')>0)lab.push(labor('Maçonnerie murs',net*masonryRatio(d,'wallHPerM2')));
  }
  for(let i=0;i<(d.openings||[]).length;i++) addOpeningAssociated(lines,lab,d.openings[i],`simple-open-${i}`,d,cc,alerts);
  if(d.chainH){
    const q=num(d.chainHml)>0?num(d.chainHml):perimeter;
    if(!(q>0))alerts.push('🚨 Linéaire chaînage horizontal obligatoire.');
    else{const ref=resolvedRef(d,'chainage_horizontal');lab.push(labor('Chaînage horizontal',addRefLines(lines,ref,q,'simple-chain-h',cc)));}
  }
  if(d.chainV){
    const q=num(d.chainVml)>0?num(d.chainVml):estimatedVerticalChainage(perimeter,H);
    if(!(q>0))alerts.push('🚨 Linéaire chaînage vertical obligatoire.');
    else{const ref=resolvedRef(d,'chainage_vertical');lab.push(labor('Chaînage vertical',addRefLines(lines,ref,q,'simple-chain-v',cc)));reco.push('Chaînage vertical : valeur automatique éventuelle = estimation réalisée à partir de ratios Guillaume, modifiable, distincte d’un contrôle DTU.');}
  }
  reco.push(`Nature : ${d.wallKind==='cloison_non_porteuse'?'cloison non porteuse':'mur'} ; surface brute ${fmt(gross,2)} m² ; ouvertures ${fmt(openingsArea,2)} m² ; nette ${fmt(net,2)} m².`);
}

function calcSlab(state,d,prefix,surface,lines,lab,alerts,reco,concreteClassOverride=''){
  const g=state.globals,cc=concreteClassOverride||concreteClassFor(d,g),ep=num(d.thickness),ref=resolvedRef(d,d.slabRef);
  if(!(surface>0&&ep>0))alerts.push(`🚨 ${prefix} : surface et épaisseur obligatoires.`);
  if(!ref)alerts.push(`🚨 ${prefix} : type de dalle de référence obligatoire.`);
  if(surface>0&&ep>0) lines.push(line(`${prefix}-concrete`,`Béton ${cc} — dalle réelle`,'Béton',surface*(ep/100),'m³'));
  if(d.treillis){
    const t=TREILLIS_GUILLAUME[d.treillisType||'ST25C'];
    if(!t) alerts.push(`🚨 ${prefix} : type de treillis obligatoire.`);
    else if(surface>0){
      lines.push(line(`${prefix}-steel`,`Treillis ${t.label} — ${t.maille}`,'Ferraillage',surface,'m²',t.priceM2,'validated',{catalogNeedQty:surface,catalogNeedUnit:'m²',catalogRole:'treillis',treillisType:d.treillisType||'ST25C'}));
      lab.push(labor(`Pose treillis ${t.label}`,surface*t.hPerM2));
      reco.push(`${prefix} : treillis ${t.label} = référentiel métier Guillaume, modifiable ; ce choix ne constitue pas un dimensionnement structurel.`);
    }
  }
  if(d.fibres){
    const f=FIBRES[d.fibreType||'courante'],enteredDose=num(d.fibreDose),dose=enteredDose>0?enteredDose:f.min;
    if(surface>0&&ep>0){
      lines.push(line(`${prefix}-fibres`,`Fibres — ${f.label}`,'Ferraillage',surface*(ep/100)*dose,'kg'));
      if(enteredDose<=0)reco.push(`${prefix} : dosage fibres prérempli automatiquement à ${f.min} kg/m³, minimum de la plage métier « ${f.label} ». Modifiable.`);
      if(dose<f.min||dose>f.max)alerts.push(`⚠️ ${prefix} : dosage fibres hors plage indicative ${f.min}–${f.max} kg/m³.`);
    }
    alerts.push(FIBRE_WARNING);
  }
  if(ref){
    if(ref.coffrageParUnite>0)lines.push(line(`${prefix}-coffrage`,`Coffrage — ${ref.label}`,'Coffrage',surface*ref.coffrageParUnite,'m²'));
    lab.push(labor(ref.label,surface*ref.moHParUnite));
  }
  alerts.push(STRUCTURE_WARNING);
  reco.push(`${prefix} : volume béton réel = ${fmt(surface*(ep/100),3)} m³ ; classe ${cc} ; contrôle annexe béton = ${ref?fmt(surface*ref.betonParUnite,3):'—'} m³.`);
}

function calcFoundationSimple(state,lines,lab,alerts,reco){
  const d=state.simple,g=state.globals,cc=concreteClassFor(d,g),refId=d.foundationRef||'semelle_filante',ref=resolvedRef(d,refId);
  const L=num(d.length),W=num(d.widthCm),H=num(d.heightCm),vol=L*(W/100)*(H/100);
  if(!(vol>0))alerts.push('🚨 Longueur, largeur et épaisseur de semelle obligatoires.');
  if(vol>0&&ref)lab.push(labor(ref.label,addRefLines(lines,ref,vol,'simple-foundation',cc)));
  reco.push(`Profondeur de fouille séparée : ${fmt(num(d.excavationDepth),2)} m ; classe béton ${cc}.`);
  alerts.push(STRUCTURE_WARNING);
}

function calcFoundationElement(state,e,lines,lab,alerts,reco){
  const d=e.data,g=state.globals,p=e.id;
  if(d.foundationType==='micro_pieux'){
    const n=num(d.microCount),depth=num(d.microDepth),suggested=micropileSuggestedPrice(depth),pr=num(d.microPrice)||suggested;
    if(!(n>0))alerts.push(`🚨 ${e.name} : nombre de micro-pieux obligatoire.`);
    if(!(depth>=3))alerts.push(`🚨 ${e.name} : profondeur des micro-pieux obligatoire (minimum 3 m pour le référentiel Guillaume).`);
    if(n>0){
      if(!(pr>0))alerts.push(`🚨 ${e.name} : prix micro-pieu obligatoire.`);
      else lines.push(line(`${p}-micro`,'Micro-pieux — fourniture + main-d’œuvre incluse','Fondations',n,'unité',pr,'explicit'));
    }
    if(suggested>0)reco.push(`${e.name} : prix micro-pieu proposé selon profondeur ${fmt(depth,1)} m = ${money(suggested)} / unité, modifiable. La profondeur sert au chiffrage uniquement.`);
    if(num(d.microSlabSurface)>0){
      if(!d.slabRef) alerts.push(`🚨 ${e.name} : type de dalle associée obligatoire.`);
      else calcSlab(state,d,`${e.name} dalle VS`,num(d.microSlabSurface),lines,lab,alerts,reco,d.slabConcreteClass||g.concreteClass);
      if(d.microSlabInsulation==='avec_isolant') lines.push(line(`${p}-slab-insulation`,'Isolation dalle sur VS','Isolation',num(d.microSlabSurface),'m²'));
    }
    const L=num(d.beamLength),W=num(d.beamWidthCm),H=num(d.beamHeightCm);
    if(L||W||H){
      if(!(L>0&&W>0&&H>0))alerts.push(`🚨 ${e.name} : dimensions de longrine incomplètes.`);
      else {
        const v=L*(W/100)*(H/100),ref=resolvedRef(d,'longrine_fondation'),price=num(d.longrinePrice)||LONGRINE_PRICE_ML,cc=d.longrineConcreteClass||g.concreteClass||'';
        lines.push(line(`${p}-longrine-package`,'Longrine — prix métier Guillaume','Fondations',L,'ml',price,'explicit'));
        const planning=addRefLinesIncluded(lines,ref,v,`${p}-longrine-included`,cc);
        if(planning>0)lab.push(labor(`${e.name} — longrine planning`,planning,{includedInManual:true}));
        reco.push(`${e.name} : longrine ${fmt(L,2)} ml, volume géométrique ${fmt(v,3)} m³ ; prix ${money(price)}/ml séparé des micro-pieux.`);
      }
    }
    reco.push(`${e.name} : dimensionnement des micro-pieux hors moteur SpeedArti ; étude géotechnique/structure requise.`);
  }

  if(d.foundationType==='plot_isole'){
    const n=num(d.plotCount),v=num(d.plotVolume);
    if(!(n>0))alerts.push(`🚨 ${e.name} : quantité de plots obligatoire.`);
    if(!(v>0))alerts.push(`🚨 ${e.name} : volume de plot obligatoire.`);
    if(!d.plotVolumeMode)alerts.push(`🚨 ${e.name} : préciser si le volume est unitaire ou total.`);
    const total=d.plotVolumeMode==='unitaire'?n*v:d.plotVolumeMode==='total'?v:0;
    if(total>0){const ref=resolvedRef(d,'semelle_isolee'),cc=d.foundationConcreteClass||g.concreteClass||'';lab.push(labor(e.name,addRefLines(lines,ref,total,`${p}-plots`,cc)));}
    if(d.plotVolumeMode==='total')reco.push(`${e.name} : la quantité de plots reste une donnée de rapport ; le volume béton total est saisi séparément.`);
  }

  if(['vide_sanitaire','terre_plein'].includes(d.foundationType)){
    const per=num(d.perimeter),bh=num(d.blockHeight||.20),rows=num(d.rows),surface=per*bh*rows;
    const fw=num(d.footingWidthCm),fh=num(d.footingHeightCm),vol=per*(fw/100)*(fh/100);
    if(!(per>0&&fw>0&&fh>0))alerts.push(`🚨 ${e.name} : semelle soubassement incomplète.`);
    if(vol>0){const ref=resolvedRef(d,'semelle_filante'),cc=d.foundationConcreteClass||g.concreteClass||'';lab.push(labor(`${e.name} — semelle`,addRefLines(lines,ref,vol,`${p}-foot`,cc)));}
    if(surface>0){
      const basementBlocks=num(d.blocksPerM2)>0?num(d.blocksPerM2):MASONRY_DEFAULTS.parpaing.blocksPerM2;
      const basementHours=num(d.wallHPerM2)>0?num(d.wallHPerM2):MASONRY_DEFAULTS.parpaing.wallHPerM2;
      lines.push(line(`${p}-basement-blocks`,'Blocs de soubassement','Maçonnerie',surface*basementBlocks,'unité'));
      lab.push(labor(`${e.name} — murs soubassement`,surface*basementHours));
    }
    const mlStiff=num(d.stiffeners)*bh*rows;
    if(mlStiff>0){const ref=resolvedRef(d,'potelet_raidisseur_vertical');lab.push(labor(`${e.name} — raidisseurs`,addRefLines(lines,ref,mlStiff,`${p}-stiff`,d.foundationConcreteClass||g.concreteClass||'')));}

    const rs=num(d.refendLength)*num(d.refendHeight);
    if(num(d.refendLength)>0||num(d.refendHeight)>0){
      if(!(rs>0))alerts.push(`🚨 ${e.name} : longueur et hauteur du refend doivent être renseignées ensemble.`);
      if(rs>0){
        const refendBlocks=num(d.refendBlocksPerM2)>0?num(d.refendBlocksPerM2):MASONRY_DEFAULTS.parpaing.blocksPerM2;
        const refendHours=num(d.refendHoursPerM2)>0?num(d.refendHoursPerM2):MASONRY_DEFAULTS.parpaing.wallHPerM2;
        lines.push(line(`${p}-refend-blocks`,'Blocs mur de refend','Maçonnerie',rs*refendBlocks,'unité'));
        lab.push(labor(`${e.name} — mur refend`,rs*refendHours));
        const refendWidth=num(d.refendFootingWidthCm)||fw,refendFootingHeight=num(d.refendFootingHeightCm)||fh;
        if(!(refendWidth>0&&refendFootingHeight>0))alerts.push(`🚨 ${e.name} : dimensions de semelle sous refend obligatoires.`);
        else {
          const refendVol=num(d.refendLength)*(refendWidth/100)*(refendFootingHeight/100);
          const ref=resolvedRef(d,'semelle_filante'),cc=d.foundationConcreteClass||g.concreteClass||'';
          lab.push(labor(`${e.name} — semelle sous refend`,addRefLines(lines,ref,refendVol,`${p}-refend-foot`,cc)));
          reco.push(`${e.name} : semelle sous refend = ${fmt(num(d.refendLength),2)} ml × ${fmt(refendWidth,0)} × ${fmt(refendFootingHeight,0)} cm = ${fmt(refendVol,3)} m³.`);
        }
        const rml=num(d.refendStiffeners)*num(d.refendHeight);
        if(rml>0){const ref=resolvedRef(d,'potelet_raidisseur_vertical');lab.push(labor(`${e.name} — raidisseurs refend`,addRefLines(lines,ref,rml,`${p}-refend-stiff`,d.foundationConcreteClass||g.concreteClass||'')));}
      }
    }
    if(num(d.slabSurface)>0){
      if(!d.slabRef)alerts.push(`🚨 ${e.name} : type de dalle associée obligatoire.`);
      else calcSlab(state,d,`${e.name} dalle associée`,num(d.slabSurface),lines,lab,alerts,reco,d.slabConcreteClass||g.concreteClass);
      if(d.foundationType==='vide_sanitaire'&&d.slabInsulation==='avec_isolant') lines.push(line(`${p}-vs-insulation`,'Isolation plancher VS','Isolation',num(d.slabSurface),'m²'));
    }
    reco.push(`${e.name} : hauteur soubassement calculée = ${fmt(bh*rows,2)} m (${fmt(bh*100,0)} cm × ${rows||0} rangs).`);
  }
}

function calcBearingWall(state,e,lines,lab,alerts,reco){
  const d=e.data,g=state.globals,p=e.id,L=num(d.length),H=num(d.height),T=num(d.thickness)/100,cc=concreteClassFor(d,g);
  if(!(L>0&&H>0&&T>0)){alerts.push(`🚨 ${e.name} : dimensions incomplètes.`);return;}
  if(d.method==='prefabrique'){
    const hh=PREFAB_H_PER_ML[d.prefabType||'standard'];
    const price=num(d.prefabPriceM2)||PREFAB_DEFAULT_PRICE_M2,surface=L*H;
    lines.push(line(`${p}-prefab`,`Mur préfabriqué béton — posé, livré, gruté`,'Structure préfabriquée',surface,'m²',price,'explicit'));
    if(hh>0)lab.push(labor(`${e.name} — pose planning`,L*hh,{includedInManual:true}));
    reco.push(`${e.name} : ${fmt(surface,2)} m² × ${money(price)}/m². Pose, livraison et grutage inclus ; hors terrassement, drainage, remblai et fondations éventuelles.`);
  } else {
    const surface=L*H,ref=resolvedRef(d,'mur_banche_courant');
    lines.push(line(`${p}-concrete`,`Béton ${cc} — mur porteur`,'Béton',surface*T,'m³'));
    if(ref.acierParUnite>0)lines.push(line(`${p}-steel`,'Acier indicatif — mur porteur','Ferraillage',surface*ref.acierParUnite,'kg'));
    if(ref.coffrageParUnite>0)lines.push(line(`${p}-form`,'Coffrage — mur porteur','Coffrage',surface*ref.coffrageParUnite,'m²'));
    lab.push(labor(e.name,surface*ref.moHParUnite));
    reco.push(`${e.name} : volume béton réel ${fmt(surface*T,3)} m³ ; classe ${cc} ; contrôle annexe ${fmt(surface*ref.betonParUnite,3)} m³.`);
  }
  if(num(d.chainHml)>0){const ref=resolvedRef(d,'chainage_horizontal');lab.push(labor(`${e.name} — chaînage horizontal`,addRefLines(lines,ref,num(d.chainHml),`${p}-chain-h`,cc)));}
  if(num(d.chainVml)>0){const ref=resolvedRef(d,'chainage_vertical');lab.push(labor(`${e.name} — chaînage vertical`,addRefLines(lines,ref,num(d.chainVml),`${p}-chain-v`,cc)));}
  const bq=num(d.braceQty);
  if(bq>0){
    if(!(num(d.bracePrice)>0))alerts.push(`🚨 ${e.name} : prix jambe de force obligatoire.`);else lines.push(line(`${p}-brace`,'Jambe de force','Renforts',bq,'unité',num(d.bracePrice),'explicit'));
    if(!(num(d.braceHours)>0))alerts.push(`🚨 ${e.name} : temps jambe de force obligatoire.`);else lab.push(labor(`${e.name} — jambes de force`,bq*num(d.braceHours)));
  }
}

function calcElevationWall(state,e,lines,lab,alerts,reco){
  const d=e.data,g=state.globals,p=e.id,L=num(d.length),H=num(d.height),gross=L*H,cc=concreteClassFor(d,g);
  if(!(gross>0)){alerts.push(`🚨 ${e.name} : dimensions incomplètes.`);return;}
  const openings=d.openings||[];
  const openingArea=openings.reduce((s,o)=>s+num(o.width)*num(o.height),0);
  if(openingArea>gross){alerts.push(`🚨 ${e.name} : ouvertures supérieures à la surface du mur.`);return;}
  const pignonArea=(d.pignons||[]).reduce((s,pn)=>s+(num(pn.width)*num(pn.width)*(num(pn.slope)/100)/4),0);
  const net=Math.max(0,gross-openingArea)+pignonArea;
  if(d.material==='beton_banche'){
    if(d.method==='prefabrique'){
      const price=num(d.prefabPriceM2)||PREFAB_DEFAULT_PRICE_M2;
      lines.push(line(`${p}-prefab`,`Mur extérieur préfabriqué béton — posé, livré, gruté`,'Structure préfabriquée',net,'m²',price,'explicit'));
      const hh=PREFAB_H_PER_ML[d.prefabType||'standard'];
      if(hh>0)lab.push(labor(`${e.name} — pose planning`,L*hh,{includedInManual:true}));
      reco.push(`${e.name} : préfabriqué ${fmt(net,2)} m² × ${money(price)}/m² ; pose incluse dans le prix commercial.`);
    }else{
      const ref=resolvedRef(d,'mur_banche_courant'),ep=num(d.thickness)/100;
      lines.push(line(`${p}-banche-concrete`,`Béton ${cc} — mur banché`,'Béton',net*ep,'m³'));
      if(ref.acierParUnite>0)lines.push(line(`${p}-banche-steel`,'Acier indicatif mur banché','Ferraillage',net*ref.acierParUnite,'kg'));
      if(ref.coffrageParUnite>0)lines.push(line(`${p}-banche-form`,'Coffrage mur banché','Coffrage',net*ref.coffrageParUnite,'m²'));
      lab.push(labor(e.name,net*ref.moHParUnite));
      reco.push(`${e.name} : volume béton réel ${fmt(net*ep,3)} m³ ; classe ${cc} ; contrôle annexe ${fmt(net*ref.betonParUnite,3)} m³.`);
    }
  }else{
    if(!(masonryRatio(d,'blocksPerM2')>0))alerts.push(`🚨 ${e.name} : référentiel interne SpeedArti indisponible pour la consommation de ce matériau.`);else lines.push(line(`${p}-blocks-${d.material}-${d.thickness}`,`${d.material} ${d.thickness||20} cm`,'Maçonnerie',net*masonryRatio(d,'blocksPerM2'),'unité'));
    if(d.method==='tradi')addSiteMortarLines(lines,d,net,`${p}-mortar`,reco);
    else if(num(d.mortarKgM2)>0)lines.push(line(`${p}-colle`,'Colle / mortier-colle','Liants',net*num(d.mortarKgM2),'kg'));
    if(!(masonryRatio(d,'wallHPerM2')>0))alerts.push(`🚨 ${e.name} : référentiel interne SpeedArti indisponible pour le temps de pose de ce matériau.`);else lab.push(labor(e.name,net*masonryRatio(d,'wallHPerM2')));
  }
  openings.forEach((o,i)=>addOpeningAssociated(lines,lab,o,`${p}-open-${i}`,d,cc,alerts));
  (d.beams||[]).forEach((b,i)=>{
    const Lb=num(b.length),W=num(b.widthCm),Hb=num(b.heightCm),ref=resolvedRef(d,b.ref||'poutre_ba_courante');
    if(Lb||W||Hb){if(!(Lb>0&&W>0&&Hb>0))alerts.push(`🚨 ${e.name} : poutre ${i+1} incomplète.`);else{const v=Lb*(W/100)*(Hb/100);lab.push(labor(`${e.name} — ${ref.label}`,addRefLines(lines,ref,v,`${p}-beam-${i}`,cc)));}}
  });
  const hq=num(d.chainHml)>0?num(d.chainHml):L;
  const vq=num(d.chainVml)>0?num(d.chainVml):estimatedVerticalChainage(L,H);
  if(hq>0){const ref=resolvedRef(d,'chainage_horizontal');lab.push(labor(`${e.name} — chaînage H`,addRefLines(lines,ref,hq,`${p}-ch`,cc)));}
  if(vq>0){const ref=resolvedRef(d,'chainage_vertical');lab.push(labor(`${e.name} — chaînage V`,addRefLines(lines,ref,vq,`${p}-cv`,cc)));reco.push(`${e.name} : chaînage vertical automatique éventuel = estimation réalisée à partir de ratios Guillaume, modifiable, distincte d’un contrôle DTU.`);}
  if(d.waterproof) lines.push(line(`${p}-waterproof-${d.waterproof}`,d.waterproof==='delta_ms'?'Delta MS':'Enduit hydrofuge','Étanchéité',net,'m²'));
  if(d.decoration) lines.push(line(`${p}-decor-${d.decoration}`,d.decoration.replaceAll('_',' '),'Décoration extérieure',L,'ml'));
  if(d.antiTermite) lines.push(line(`${p}-anti-termite`,'Traitement anti-termite','Traitements',1,'forfait'));
  reco.push(`${e.name} (${d.wallType||'mur'}) : brute ${fmt(gross,2)} m² ; ouvertures ${fmt(openingArea,2)} m² ; pignons ${fmt(pignonArea,2)} m² ; nette calculée ${fmt(net,2)} m².`);
}

function calcGenericWork(state,e,lines,lab,alerts){
  const d=e.data,ref=resolvedRef(d,d.workRef),q=num(d.quantity),cc=concreteClassFor(d,state.globals);
  if(!ref)alerts.push(`🚨 ${e.name} : ouvrage de référence obligatoire.`);
  if(!(q>0))alerts.push(`🚨 ${e.name} : quantité obligatoire.`);
  if(ref&&q>0)lab.push(labor(`${e.name} — ${ref.label}`,addRefLines(lines,ref,q,`${e.id}-generic`,cc)));
  alerts.push(STRUCTURE_WARNING);
}

function addCommonOptions(state,lines,lab,alerts,reco){
  const g=state.globals;
  if(g.truck) addDirectPricedLine(lines,'truck8x4','Camion-benne 8×4','Transport / location',Math.max(1,num(g.truckDays)||1),'jour',num(g.truckPrice)||TRUCK_8X4_DEFAULT);
  if(g.pump){
    const price=num(g.pumpPrice)||PUMP_DEFAULT_PRICE;
    addDirectPricedLine(lines,'pump','Camion pompe béton','Transport béton',1,'forfait',price);
  }

  const opts=[
    ['earthworks','Terrassement','Terrassement'],['backfill','Remblaiement','Terrassement'],['scaffold','Échafaudage','Location'],['finishCoat','Enduit de finition','Finitions'],['waterproofCoat','Enduit hydrofuge','Finitions']
  ];
  for(const [k,label,cat] of opts){
    if(g[k]){
      const q=num(g[`${k}Qty`]),pr=num(g[`${k}Price`]),unit=g[`${k}Unit`]||'forfait';
      if(!(q>0&&pr>0))alerts.push(`🚨 ${label} : quantité et prix obligatoires.`); else addDirectPricedLine(lines,`global-${k}`,label,cat,q,unit,pr);
    }
  }
  if(g.difficultAccess){if(!(num(g.difficultAccessHours)>0))alerts.push('🚨 Accès difficile : heures supplémentaires obligatoires.');else lab.push(labor('Accès difficile — plus-value explicite',num(g.difficultAccessHours)));}

  for(const [key,label] of FOUNDATION_GLOBAL_OPTIONS){
    const o=g.foundationOptions?.[key]; if(!o?.enabled)continue;
    const q=num(o.qty),pr=num(o.price),unit=o.unit||'forfait';
    if(!(q>0&&pr>0))alerts.push(`🚨 ${label} : quantité et prix obligatoires.`); else addDirectPricedLine(lines,`foundation-option-${key}`,label,'Options fondations',q,unit,pr);
  }

  const totalConcrete=lines.filter(x=>x.category==='Béton'&&x.unit==='m³'&&x.priceMode!=='included').reduce((s,x)=>s+x.qty,0);
  if(g.toupie){
    const priceM3=num(g.toupiePrice)||TOUPIE_PRICE_M3;
    if(g.toupieMode==='manuel'){
      const n=Math.max(1,num(g.toupies)||1);
      reco.push(`Toupies : ${n} camion(s) saisi(s) manuellement ; capacité de référence ${TOUPIE_CAPACITY_M3} m³ max par toupie.`);
    }else{
      reco.push(`Toupies estimées selon volume : ${toupieEstimatedCount(totalConcrete)} camion(s) pour ${fmt(totalConcrete,3)} m³, capacité ${TOUPIE_CAPACITY_M3} m³ max.`);
    }
    if(totalConcrete>0){
      const billed=Math.max(totalConcrete,TOUPIE_MIN_BILLABLE_M3);
      for(const concreteLine of lines)if(concreteLine.category==='Béton'&&concreteLine.unit==='m³'&&concreteLine.priceMode!=='included'){concreteLine.price=0;concreteLine.priceMode='included';concreteLine.includedByToupie=true;}
      const toupieLabel=billed>totalConcrete
        ? `Béton livré par toupie — ${fmt(totalConcrete,2)} m³ nécessaires, minimum facturé ${fmt(billed,2)} m³`
        : 'Béton livré par toupie — volume facturé';
      addDirectPricedLine(lines,'toupie',toupieLabel,'Transport béton',billed,'m³',priceM3);
      reco.push(`Facturation toupie Guillaume : ${money(priceM3)}/m³, minimum ${TOUPIE_MIN_BILLABLE_M3} m³ (${money(priceM3*TOUPIE_MIN_BILLABLE_M3)}). Les lignes béton physiques restent visibles mais sont incluses afin d’éviter toute double facturation.`);
    }else alerts.push('🚨 Toupie : aucun volume béton calculé à facturer.');
  }
  if(g.concreteControlMode==='betonniere')reco.push(`Contrôle productivité bétonnière : ${fmt(totalConcrete*4,2)} h-homme pour ${fmt(totalConcrete,3)} m³. Non additionné automatiquement aux temps ouvrage.`);
  if(g.concreteControlMode==='toupie')reco.push(`Contrôle productivité toupie : ${fmt(totalConcrete*1,2)} h-homme pour ${fmt(totalConcrete,3)} m³. Non additionné automatiquement aux temps ouvrage.`);
}

export function calculate(state){
  const lines=[],lab=[],alerts=[],reco=[];
  const g=state.globals;
  const hourly=num(g.hourly)>0?num(g.hourly):DEMO_SPEEDARTI_CONTEXT.hourly;
  const workers=Math.max(1,num(g.workers)||DEMO_SPEEDARTI_CONTEXT.workers);
  const vat=effectiveVatRate(state);
  const vatDecision=detectVatContext(state.taxContext||{});

  let laborPriceOverride=0;
  let manualTotalLaborIncluded=false;
  if(state.mode==='simple'){
    if(state.simpleType==='murs')calcWallSimple(state,lines,lab,alerts,reco);
    if(['dalle','terrasse'].includes(state.simpleType)){
      calcSlab(state,state.simple,state.simpleType==='terrasse'?'Terrasse':'Dalle',num(state.simple.surface),lines,lab,alerts,reco);
      if(state.simpleType==='terrasse'){
        if(state.simple.terraceWaterproof){const pr=num(state.simple.terraceWaterproofPrice);if(!(pr>0))alerts.push('🚨 Prix étanchéité terrasse obligatoire.');else addDirectPricedLine(lines,'terrace-waterproof','Étanchéité terrasse','Étanchéité',num(state.simple.surface),'m²',pr);}
        if(state.simple.terraceInsulation){const pr=num(state.simple.terraceInsulationPrice);if(!(pr>0))alerts.push('🚨 Prix isolation terrasse obligatoire.');else addDirectPricedLine(lines,'terrace-insulation','Isolation thermique sous dalle','Isolation',num(state.simple.surface),'m²',pr);}
      }
    }
    if(state.simpleType==='fondations')calcFoundationSimple(state,lines,lab,alerts,reco);
    if(state.simpleType==='cheminee'){
      const r=calcChimney(state.simple,'simple-chimney');lines.push(...r.lines);lab.push(...r.labor);alerts.push(...r.alerts);reco.push(...r.reco);laborPriceOverride+=r.laborPriceOverride;
    }
  } else {
    if(!state.elements.length)alerts.push('🚨 Aucun élément Maçon sélectionné.');
    for(const e of state.elements){
      if(e.type==='fondations')calcFoundationElement(state,e,lines,lab,alerts,reco);
      if(e.type==='murs_porteurs')calcBearingWall(state,e,lines,lab,alerts,reco);
      if(e.type==='murs_elevations')calcElevationWall(state,e,lines,lab,alerts,reco);
      if(e.type==='dalle')calcSlab(state,e.data,e.name,num(e.data.length)*num(e.data.width),lines,lab,alerts,reco);
      if(e.type==='cheminee'){const r=calcChimney(e.data,e.id);lines.push(...r.lines);lab.push(...r.labor);alerts.push(...r.alerts);reco.push(...r.reco);laborPriceOverride+=r.laborPriceOverride;}
      if(e.type==='ouvrage_ba')calcGenericWork(state,e,lines,lab,alerts);
    }
  }
  if(lines.some(l=>l.category==='Béton'&&/^Béton\s+—/.test(l.name))){
    alerts.push('🚨 Classe béton obligatoire pour chaque ouvrage béton concerné.');
  }
  addCommonOptions(state,lines,lab,alerts,reco);

  const pricedLines=lines.map(l=>{
    if(l.priceMode==='required'){
      const manual=num(state.manualPrices?.[l.id]);
      const storedRef=state.catalogSelections?.[l.id]||'';
      const auto=resolveAutomaticCataloguePrice(l,storedRef);
      if(manual>0){
        if(auto.resolved?.compatible && auto.resolved.orderQty>0 && auto.resolved.orderUnit && auto.resolved.orderUnit!==l.unit){
          const total=roundMoney(auto.resolved.orderQty*manual);
          return {...l,price:total/Math.max(l.qty,1e-9),source:`prix personnel / ${auto.resolved.orderUnit}`,catalogueSelection:storedRef||auto.referenceCatalogue||null,catalogueResolution:auto.resolved,automaticCatalogue:false,manualOrderUnitPrice:manual,manualOrderTotal:total};
        }
        return {...l,price:manual,source:'prix personnel',catalogueSelection:storedRef||auto.referenceCatalogue||null,catalogueResolution:auto.resolved,automaticCatalogue:false};
      }
      if(auto.resolved?.compatible){
        return {...l,price:auto.resolved.lineUnitPrice,source:auto.automatic?'Catalogue Maçon SpeedArti — sélection automatique':'Catalogue Maçon SpeedArti',catalogueSelection:auto.referenceCatalogue,catalogueResolution:auto.resolved,automaticCatalogue:auto.automatic};
      }
      if(num(l.price)>0){
        return {...l,source:'prix de référence SpeedArti',catalogueSelection:storedRef||null,catalogueResolution:null,automaticCatalogue:false};
      }
      const fallback=referenceFallbackPrice(l);
      if(fallback)return {...l,price:fallback.price,source:fallback.source,referenceFallback:fallback.kind,catalogueSelection:storedRef||null,catalogueResolution:null,automaticCatalogue:false};
      return {...l,price:0,source:'prix à confirmer',catalogueSelection:storedRef||null,catalogueResolution:null,automaticCatalogue:false,unpriced:true};
    }
    return {...l,source:l.priceMode==='validated'?'référence validée':l.includedByToupie?'inclus dans la fourniture toupie':l.priceMode==='included'?'inclus dans le forfait':'saisie explicite'};
  });
  const missingPrices=pricedLines.filter(l=>l.qty>0&&l.priceMode==='required'&&!(l.price>0));
  missingPrices.forEach(l=>{
    alerts.push(`⚠️ PRIX À CONFIRMER — ${l.name}. Le résultat reste accessible et l'artisan peut modifier ce prix à la fin.`);
  });

  const materials=roundMoney(pricedLines.reduce((s,l)=>s+l.qty*l.price,0));
  const hours=lab.reduce((s,x)=>s+x.hours,0);
  let laborCost=lab.reduce((s,x)=>{
    if(x.annexPrice!==undefined)return s+x.annexPrice;
    if(x.includedInManual)return s;
    return s+x.hours*hourly;
  },0);
  if(laborPriceOverride>0){
    // Les lignes cheminée portent déjà annexPrice : pas de double ajout ici. Conservé pour traçabilité.
  }
  laborCost=roundMoney(laborCost);
  if(manualTotalLaborIncluded) reco.push('Escalier : le prix manuel inclut la main-d’œuvre ; les heures restent au planning sans être refacturées une seconde fois.');
  const totalHT=roundMoney(materials+laborCost),tax=roundMoney(totalHT*(vat/100)),ttc=roundMoney(totalHT+tax);
  const blocking=alerts.filter(a=>a.startsWith('🚨'));
  return {lines:pricedLines,labor:lab,alerts:[...new Set(alerts)],reco:[...new Set(reco)],missingPrices,hours,duration:hours/workers,workers,hourly,vat,vatDecision,materials,laborCost,totalHT,tax,ttc,canFinalize:blocking.length===0};
}

export function renderPrices(state){
  const r=calculate(state);
  const rows=r.lines.filter(l=>l.qty>0).map(l=>{
    if(l.priceMode==='required'){
      const candidates=catalogueCandidatesForLine(l,8),storedRef=state.catalogSelections?.[l.id]||'',auto=resolveAutomaticCataloguePrice(l,storedRef),selectedRef=auto.referenceCatalogue||'',resolved=auto.resolved,fibre=isFibrePriceLine(l);
      const options=[{value:'',label:fibre?'Choisir une référence fibre…':candidates.length?'Sélection automatique SpeedArti…':'Aucun article catalogue compatible'},...candidates.map(product=>({value:product.referenceCatalogue,label:catalogueLabel(product)}))];
      const currentManual=state.manualPrices?.[l.id]??'';
      const productTitle=resolved?.compatible?`${esc(resolved.product.marque)} — ${esc(resolved.product.produit)}`:(l.price>0?esc(l.source||'Prix de référence SpeedArti'):'Prix à confirmer');
      const productMeta=resolved?.compatible?`Réf. ${esc(resolved.product.referenceCatalogue)} · ${esc(resolved.orderLabel)}`:(fibre?'Référence fibre non choisie automatiquement : le dosage produit doit correspondre au dosage métier.':'Aucune référence catalogue fiable retenue automatiquement.');
      const selector=`<details class="catalog-details"><summary>Voir / modifier le produit</summary><div class="catalog-detail-body">${field('Article catalogue',`catalogSelections.${l.id}`,selectedRef,{scope:'root',trace:'catalogSelection',options}).replace('data-field=',`data-root-field=`)}<div class="tiny muted" style="margin-top:7px">${productMeta}</div></div></details>`;
      const saleUnit=resolved?.compatible?resolved.orderUnit:l.unit;
      const retained=resolved?.compatible?(`${money(l.manualOrderUnitPrice||resolved.product.prixArtisanHt)} / ${esc(saleUnit)} · commande ${money(l.qty*l.price)} HT`):(l.price>0?money(l.price):'À confirmer');
      const priceEditor=`<details class="catalog-details"><summary>Modifier le prix</summary><div class="catalog-detail-body">${field(`Prix HT personnel / ${saleUnit||l.unit}`,`manualPrices.${l.id}`,currentManual,{scope:'root',step:'0.01',trace:'priceInput',help:resolved?.compatible?'Le prix personnel suit l’unité de vente réelle du produit catalogue.':'Permet de valoriser manuellement le poste.'}).replace('data-field=',`data-root-field=`)}</div></details>`;
      return `<tr class="${l.price>0?'':'missing-price'}"><td><strong>${esc(l.name)}</strong><br><span class="muted">${esc(l.category)}</span></td><td>${fmt(l.qty,2)} ${esc(l.unit)}</td><td><strong>${productTitle}</strong><div class="tiny muted">${productMeta}</div>${selector}</td><td><strong>${retained}</strong><div class="tiny muted">${l.price>0?esc(l.source||''):'Le chiffrage continue sans bloquer.'}</div>${priceEditor}</td></tr>`;
    }
    return `<tr><td><strong>${esc(l.name)}</strong><br><span class="muted">${esc(l.category)}</span></td><td>${fmt(l.qty,2)} ${esc(l.unit)}</td><td><strong>${esc(l.source||'Prix défini')}</strong></td><td><strong>${money(l.price)}</strong></td></tr>`;
  }).join('');
  return `<div class="section-title"><h2>Prix / catalogue</h2><p>SpeedArti préremplit les prix fiables. Les détails techniques restent disponibles seulement si vous souhaitez les vérifier ou les modifier.</p></div><div class="info-box"><strong>${CATALOGUE_MACON.length} articles métier intégrés.</strong> Un prix personnel reste toujours prioritaire. Un poste non fiable reste « à confirmer » sans bloquer le chiffrage.</div><div class="table-wrap"><table><thead><tr><th>Poste</th><th>Besoin</th><th>Produit retenu</th><th>Prix U. HT</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Aucune ligne calculée.</td></tr>'}</tbody></table></div>${r.missingPrices.length?`<div class="alert warn">⚠️ ${r.missingPrices.length} poste${r.missingPrices.length>1?'s':''} à confirmer. Vous pouvez poursuivre et revenir modifier ces prix avant le devis.</div>`:'<div class="alert ok">✓ Tous les prix fiables ont été préremplis automatiquement.</div>'}`;
}

export function renderVerification(state){
  const r=calculate(state),ctx=state.taxContext||{},vat=detectVatContext(ctx);
  const actualConcrete=r.lines.filter(l=>l.category==='Béton'&&l.unit==='m³').reduce((s,l)=>s+num(l.qty),0);
  const toupie=r.lines.find(l=>l.id==='toupie');
  const toupieNote=toupie
    ? (num(toupie.qty)>actualConcrete+1e-9
      ? `<div class="alert warn"><strong>Toupie :</strong> ${fmt(actualConcrete,2)} m³ nécessaires · minimum facturé ${fmt(toupie.qty,2)} m³. ${button('Modifier les options','class="btn ghost small" data-jump-step="3"','jumpStep')}</div>`
      : `<div class="info-box"><strong>Toupie :</strong> ${fmt(actualConcrete,2)} m³ nécessaires et facturés. ${button('Modifier','class="btn ghost small" data-jump-step="3"','jumpStep')}</div>`)
    :'';
  const priceNote=r.missingPrices.length
    ? `<div class="alert warn"><strong>${r.missingPrices.length} prix à confirmer.</strong> Le chiffrage reste accessible. ${button('Vérifier les prix','class="btn ghost small" data-jump-step="4"','jumpStep')}</div>`
    :'<div class="alert ok"><strong>Prix :</strong> aucun poste bloquant à renseigner.</div>';
  const ageField=(ctx.workType==='renovation'||ctx.workType==='entretien')
    ? field('Logement achevé depuis plus de 2 ans ?','taxContext.housingOver2Years',ctx.housingOver2Years||'',{scope:'root',required:true,trace:'taxAge',options:[{value:'',label:'Choisir…'},{value:'oui',label:'Oui'},{value:'non',label:'Non'}]}).replace('data-field=', 'data-root-field=')
    :'';
  const ecoField=(ctx.workType==='renovation'||ctx.workType==='entretien')&&ctx.housingOver2Years==='oui'
    ? field('Travaux de rénovation énergétique éligibles ?','taxContext.ecoRenovation',ctx.ecoRenovation||'non',{scope:'root',trace:'taxEco',options:[{value:'non',label:'Non / standard'},{value:'oui',label:'Oui — taux réduit à vérifier'}]}).replace('data-field=', 'data-root-field=')
    :'';
  return `<div class="section-title"><h2>Vérification du chiffrage</h2><p>Contrôlez les points importants avant d’afficher le résultat. Vous pouvez revenir corriger une étape sans perdre vos saisies.</p></div>
    <div class="panel primary-soft"><div class="row spread"><div><span class="tiny muted">Résumé chantier</span><h3 style="margin:4px 0 0">${esc(projectSummary(state))}</h3></div>${button('Modifier l’ouvrage','class="btn ghost small" data-jump-step="2"','jumpStep')}</div></div>
    ${priceNote}
    ${toupieNote}
    <div class="panel" style="margin-top:14px"><h3>TVA du chantier</h3>
      <div class="grid cols-2">
        ${field('Type de travaux','taxContext.workType',ctx.workType||'',{scope:'root',required:true,trace:'taxWorkType',options:[{value:'',label:'Choisir…'},{value:'neuf',label:'Construction neuve'},{value:'renovation',label:'Rénovation'},{value:'entretien',label:'Entretien / réparation'}]}).replace('data-field=', 'data-root-field=')}
        ${ageField}
        ${ecoField}
      </div>
      <div class="${vat.complete?'alert ok':'alert warn'}"><strong>${vat.complete?`TVA proposée : ${fmt(vat.rate,1)} %`:'TVA à qualifier'}</strong><br>${esc(vat.justification)}${vat.alert?`<br><span class="tiny">${esc(vat.alert)}</span>`:''}</div>
      <div class="tiny muted" style="margin-top:8px">À l’intégration dans SpeedArti, cette qualification utilisera le service TVA existant et les paramètres réels de l’entreprise.</div>
    </div>`;
}

export function resultCostBreakdown(r){
  const optionIds=/^(global-(earthworks|backfill|scaffold|finish-coat|waterproof-coat)|terrace-waterproof|terrace-insulation|foundation-option-)/;
  let transport=0,options=0;
  for(const l of r.lines||[]){
    const amount=num(l.qty)*num(l.price);
    if(l.id==='truck'||l.id==='toupie'||l.id==='pump'||l.id==='global-pump'||String(l.category||'').toLowerCase().includes('transport'))transport+=amount;
    else if(optionIds.test(String(l.id||'')))options+=amount;
  }
  transport=roundMoney(transport);options=roundMoney(options);
  return {materials:roundMoney(Math.max(0,roundMoney(r.materials)-transport-options)),transport,options};
}

export function renderResult(state){
  const r=calculate(state),breakdown=resultCostBreakdown(r);
  if(!r.canFinalize){
    return `<div class="section-title"><h2>Résultat bloqué</h2><p>Le résultat final n’est bloqué que par une donnée métier réellement obligatoire, jamais par l’absence d’un article catalogue ou d’un prix personnel.</p></div>
      ${r.alerts.filter(a=>a.startsWith('🚨')).map(a=>`<div class="alert danger">${esc(a)}</div>`).join('')}`;
  }
  const rows=r.lines.filter(l=>l.qty>0).map(l=>{
    const cat=l.catalogueResolution?.compatible?l.catalogueResolution:null;
    const product=cat?.product;
    const extra=product?`<br><span class="tiny muted">${l.automaticCatalogue?'Sélection automatique · ':''}${esc(product.marque)} · ${esc(product.produit)} · réf. ${esc(product.referenceCatalogue)} · ${esc(cat.orderLabel)}</span>`:'';
    const unpriced=l.priceMode==='required'&&!(l.price>0);
    const currentManual=state.manualPrices?.[l.id]??'';
    const saleUnit=cat?.orderUnit||l.unit;
    const shownUnitPrice=cat?.compatible?(l.manualOrderUnitPrice||cat.product.prixArtisanHt):l.price;
    const priceCell=l.priceMode==='required'
      ? `${field(`Modifier prix HT / ${saleUnit}`,`manualPrices.${l.id}`,currentManual,{scope:'root',step:'0.01',trace:'priceInput',help:unpriced?'Facultatif : ce poste n’a pas de prix automatique.':cat?.compatible?'Le prix suit l’unité de vente du catalogue.':'Facultatif : remplace le prix automatique.'}).replace('data-field=',`data-root-field=`)}<div class="tiny muted">${unpriced?'À confirmer':cat?.compatible?`Commande : ${cat.orderLabel} × ${money(shownUnitPrice)} = ${money(l.qty*l.price)} HT`:`Actuel : ${money(l.price)} · ${esc(l.source)}`}</div>`
      : `<strong>${money(l.price)}</strong>`;
    return `<tr><td><strong>${esc(l.name)}</strong><br><span class="muted">${esc(l.category)}</span>${extra}</td><td>${fmt(l.qty,2)}</td><td>${esc(l.unit)}</td><td>${priceCell}</td><td><strong>${unpriced?'À confirmer':money(l.qty*l.price)}</strong></td></tr>`;
  }).join('');
  const provisional=r.missingPrices.length>0;
  return `<div class="section-title"><h2>Résultat du chiffrage</h2><p>${provisional?`Résultat disponible immédiatement avec les prix connus. ${r.missingPrices.length} poste${r.missingPrices.length>1?'s restent':' reste'} à confirmer, sans blocage.`:'Tous les prix ont été préremplis. L’artisan peut encore les modifier directement ci-dessous.'}</p></div>
    <div class="metric-grid"><div class="metric"><span>Heures-homme</span><strong>${fmt(r.hours,1)} h</strong></div><div class="metric"><span>Durée chantier (${r.workers} ouvrier${r.workers>1?'s':''})</span><strong>${fmt(r.duration,1)} h</strong></div><div class="metric"><span>Coût main-d’œuvre</span><strong>${money(r.laborCost)}</strong></div></div>
    ${provisional?`<div class="alert warn">⚠️ Le total ci-dessous est provisoire : les postes « à confirmer » ne sont pas valorisés tant qu’aucun prix fiable n’est disponible. Ils ne bloquent toutefois plus le chiffrage.</div>`:''}
    <div class="result-grid"><div><div class="table-wrap"><table><thead><tr><th>Poste</th><th>Qté</th><th>Unité</th><th>Prix U. HT / modifier</th><th>Total HT</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${r.labor.length?`<div class="panel soft" style="margin-top:14px"><h3>Décomposition main-d’œuvre / planning</h3>${r.labor.map(p=>`<div class="total-line"><span>${esc(p.name)}</span><strong>${fmt(p.hours,2)} h-homme${p.includedInManual?' · incluse dans prix manuel':''}${p.annexPrice!==undefined?' · prix annexe':''}</strong></div>`).join('')}</div>`:''}
    </div><div><div class="panel"><h3>Totaux${provisional?' provisoires':''}</h3><div class="totals"><div class="total-line"><span>Matériaux / fournitures HT</span><strong>${money(breakdown.materials)}</strong></div>${breakdown.transport>0?`<div class="total-line"><span>Transport / livraison HT</span><strong>${money(breakdown.transport)}</strong></div>`:''}${breakdown.options>0?`<div class="total-line"><span>Options / prestations HT</span><strong>${money(breakdown.options)}</strong></div>`:''}<div class="total-line"><span>Main-d’œuvre HT</span><strong>${money(r.laborCost)}</strong></div><div class="total-line"><span>Total HT${provisional?' provisoire':''}</span><strong>${money(r.totalHT)}</strong></div><div class="total-line"><span>TVA ${fmt(r.vat,1)} %</span><strong>${money(r.tax)}</strong></div><div class="total-line grand"><span>Total TTC${provisional?' provisoire':''}</span><strong>${money(r.ttc)}</strong></div></div></div></div></div>
    ${r.alerts.filter(a=>!a.startsWith('🚨')).length?`<div style="margin-top:16px"><h3>Alertes / avertissements</h3>${r.alerts.filter(a=>!a.startsWith('🚨')).map(a=>`<div class="alert warn">${esc(a)}</div>`).join('')}</div>`:''}
    ${r.reco.length?`<div style="margin-top:16px"><h3>Recommandations / traçabilité</h3>${r.reco.map(a=>`<div class="info-box">${esc(a)}</div>`).join('')}</div>`:''}`;
}
export function validateStep(state,step=state.step){
  if(step===1&&state.mode==='multiple'&&!state.elements.length)return 'Ajouter au moins un élément Maçon.';
  if(step===2){
    const r=calculate(state);
    const configErrors=r.alerts.filter(a=>a.startsWith('🚨')&&!a.includes('PRIX MANQUANT')&&!a.toLowerCase().includes('prix '));
    if(configErrors.length)return configErrors[0].replace(/^🚨\s*/,'');
  }
  if(step===3){
    const r=calculate(state);
    const optionErrors=r.alerts.filter(a=>a.startsWith('🚨')&&!a.includes('PRIX MANQUANT'));
    // Autoriser les prix de matériaux génériques à être saisis à l’étape suivante, mais pas les prix directs d’options visibles.
    const directOptionError=optionErrors.find(a=>/camion pompe|toupie obligatoire|terrassement|remblaiement|échafaudage|enduit|étanchéité terrasse|isolation terrasse|résine|implantation|ouverture des fondations|canalisation|plateforme|delta ms|étude de sol|jambe de force|micro-pieu/i.test(a));
    if(directOptionError)return directOptionError.replace(/^🚨\s*/,'');
  }
  if(step===4){
    const r=calculate(state);
    const blocking=r.alerts.find(a=>a.startsWith('🚨'));
    if(blocking)return blocking.replace(/^🚨\s*/,'');
  }
  if(step===5){
    const vat=detectVatContext(state.taxContext||{});
    if(!vat.complete)return vat.alert||'Préciser la TVA du chantier.';
  }
  return '';
}

export function renderStep(state){
  if(state.step===0)return renderMode(state);
  if(state.step===1)return renderWorks(state);
  if(state.step===2)return renderConfig(state);
  if(state.step===3)return renderOptions(state);
  if(state.step===4)return renderPrices(state);
  if(state.step===5)return renderVerification(state);
  return renderResult(state);
}

export function collectTraces(html){
  return [...String(html).matchAll(/data-trace="([^"]+)"/g)].map(m=>m[1]);
}

export function assertBalisage(html){
  const controls=[...String(html).matchAll(/<(input|select|button|a)\b[^>]*>/gi)].map(m=>m[0]);
  const missing=controls.filter(tag=>!tag.includes('data-trace='));
  if(missing.length)throw new Error(`Contrôles sans balisage: ${missing.slice(0,5).join(' | ')}`);
  const unknown=collectTraces(html).filter(t=>!TRACE_TARGETS[t]);
  if(unknown.length)throw new Error(`Traces sans destination: ${[...new Set(unknown)].join(', ')}`);
  return true;
}

export { WORKS, WORK_BY_ID, FIBRES, CHIMNEY_CONDUITS, CHIMNEY_STACKS, CHIMNEY_CAPS, PREFAB_H_PER_ML, TRUCK_8X4_DEFAULT, STRUCTURE_WARNING, FIBRE_WARNING, PREFAB_TEAM_ADVICE, TREILLIS_GUILLAUME, PUMP_DEFAULT_PRICE, TOUPIE_PRICE_M3, TOUPIE_MIN_BILLABLE_M3, TOUPIE_CAPACITY_M3, PREFAB_DEFAULT_PRICE_M2, LONGRINE_PRICE_ML, MASONRY_DEFAULTS, MORTAR_SITE_PARPAING_20 };
