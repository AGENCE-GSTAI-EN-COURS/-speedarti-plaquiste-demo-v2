'use strict';
const ROOT = typeof window !== 'undefined' ? window : globalThis;
const API = ROOT.SpeedArtiPlaquisteReal || {};
const RULES = API.rules || {};
const ABAQUE = API.abaque || [];
const TEST_MODE = !!ROOT.__PLAQUISTE_TEST_MODE__;
let INTEGRITY_TEST_RUNNING = false;

/* =========================
   BALISES / DIAGNOSTIC
   ========================= */
const TRACE = [];
const RUNTIME_ERRORS = [];
function trace(tag, data = {}) {
  const rec = { at: new Date().toISOString(), tag, data };
  TRACE.push(rec);
  if (TRACE.length > 1000) TRACE.shift();
  if (ROOT.console && console.debug) console.debug(`[PLQ:${tag}]`, data);
  return rec;
}
function critical(code, message, data = {}) {
  const err = { code, message, data };
  RUNTIME_ERRORS.push(err);
  trace(`ERROR:${code}`, err);
  if (ROOT.console && console.error) console.error(`[PLQ:${code}] ${message}`, data);
  if(typeof document!=='undefined'){const badge=document.querySelector('#diagBadge');if(badge){badge.textContent=`ERREUR ${code}`;badge.classList.add('diag-bad');}}
  return err;
}
function getRule(path) {
  const parts = path.split('.');
  let value = RULES;
  for (const key of parts) value = value?.[key];
  if (value === undefined || value === null) {
    critical('RULE-MISSING', `Règle métier absente : ${path}`, { path });
    throw new Error(`[PLQ:RULE-MISSING] ${path}`);
  }
  return value;
}
function sameValue(a,b){ return (Number.isNaN(a)&&Number.isNaN(b)) || JSON.stringify(a)===JSON.stringify(b); }
function verifyWrite(obj,path,expected,context){
  const actual=getPath(obj,path);
  if(!sameValue(actual,expected)) critical('WRITE-MISMATCH','Une saisie n’a pas été enregistrée au bon endroit.',{path,expected,actual,context});
  else trace('WRITE-OK',{path,value:actual,context});
}

/* Balises redondantes de non-contamination : en plus de vérifier la cible, on vérifie que les autres ouvrages n'ont pas bougé. */
function wallIdentityEntries(){
  const rows=[];
  state.pieces.forEach(p=>(p.walls||[]).forEach(w=>rows.push([`piece:${p.id}:${w.id}`,w])));
  state.simpleWalls.forEach(w=>rows.push([`simple:${w.id}`,w]));
  return rows;
}
function snapshotOtherWalls(target){return new Map(wallIdentityEntries().filter(([,w])=>w!==target).map(([k,w])=>[k,JSON.stringify(w)]));}
function verifyNoOtherWallChanged(before,target,context){
  const now=new Map(wallIdentityEntries().filter(([,w])=>w!==target).map(([k,w])=>[k,JSON.stringify(w)]));
  const changed=[]; for(const [k,v] of before)if(now.get(k)!==v)changed.push(k);
  if(changed.length)critical('WALL-CONTAMINATION','Une saisie destinée à un mur a modifié un autre mur.',{context,changed});
  else trace('WALL-ISOLATION-OK',{context,checked:before.size});
}
function snapshotOtherCeilings(targetPiece){return new Map(state.pieces.filter(p=>p!==targetPiece).map(p=>[p.id,JSON.stringify(p.ceiling)]));}
function verifyNoOtherCeilingChanged(before,targetPiece,context){
  const now=new Map(state.pieces.filter(p=>p!==targetPiece).map(p=>[p.id,JSON.stringify(p.ceiling)]));
  const changed=[]; for(const [k,v] of before)if(now.get(k)!==v)changed.push(k);
  if(changed.length)critical('CEILING-CONTAMINATION','Une saisie plafond a modifié le plafond d’une autre pièce.',{context,changed});
  else trace('CEILING-ISOLATION-OK',{context,checked:before.size});
}
function checkStateStructure(context='runtime'){
  const errors=[];
  const pieceIds=state.pieces.map(p=>p.id); if(new Set(pieceIds).size!==pieceIds.length)errors.push('piece-id-duplicate');
  for(const p of state.pieces){
    const ids=(p.walls||[]).map(w=>w.id),expected=pieceSegments(p).map(x=>x.id);
    if(ids.length!==expected.length||new Set(ids).size!==ids.length||expected.some((id,i)=>ids[i]!==id))errors.push(`walls:${p.id}`);
    const openingIds=(p.walls||[]).flatMap(w=>(w.openings||[]).map(o=>o.id));
    if(new Set(openingIds).size!==openingIds.length)errors.push(`opening-id-duplicate:${p.id}`);
  }
  const simpleIds=state.simpleWalls.map(w=>w.id); if(new Set(simpleIds).size!==simpleIds.length)errors.push('simple-wall-id-duplicate');
  if(errors.length){critical('STATE-STRUCTURE','Structure interne du chiffrage incohérente.',{context,errors});return false;}
  trace('STATE-STRUCTURE-OK',{context,pieces:state.pieces.length,simpleWalls:state.simpleWalls.length});return true;
}
function auditRenderedBindings(root){
  if(!root||!root.querySelectorAll)return {checked:0,failed:0};
  let checked=0,failed=0;
  const groups=[['[data-path]','global','path'],['[data-piece][data-pkey]','piece','pkey'],['[data-simple][data-skey]','simple','skey'],['[data-wall][data-wkey]','wall','wkey'],['[data-open][data-okey]','opening','okey'],['[data-ceiling][data-ckey]','ceiling','ckey'],['[data-extra][data-ekey]','extra','ekey']];
  for(const [selector,group,key] of groups)root.querySelectorAll(selector).forEach(el=>{checked++;if(!checkBinding(group,el.dataset[key],`dom:${selector}`))failed++;});
  root.querySelectorAll('[data-action]').forEach(el=>{checked++;if(!KNOWN_ACTIONS.has(el.dataset.action)){failed++;critical('ACTION-UNKNOWN-DOM','Bouton rendu sans action déclarée.',{action:el.dataset.action});}else trace('ACTION-BINDING-OK',{action:el.dataset.action});});
  root.querySelectorAll('[data-age]').forEach(()=>{checked++;if(!checkBinding('special','project.olderThan2Years','dom:age'))failed++;});
  root.querySelectorAll('[data-finish]').forEach(()=>{checked++;if(!checkBinding('special','options.finish','dom:finish'))failed++;});
  root.querySelectorAll('[data-plan-wall]').forEach(el=>{checked++;if(!checkBinding('special','wall.planSelection',`dom:plan:${el.dataset.planWall}`))failed++;});
  trace('DOM-BINDING-AUDIT',{checked,failed,step}); return {checked,failed};
}

/* Double balise de connexion : chaque champ visible doit être déclaré ici avec sa destination métier.
   Un nouveau data-* oublié dans ce manifeste déclenche BINDING-UNKNOWN. */
const CONNECTION_DESTINATIONS = Object.freeze({
  global:Object.freeze({
    'project.name':'identité chiffrage','options.hourlyRate':'coût main-d’œuvre','options.materialMargin':'prix de vente matériaux',
    'project.eligibilityConfirmed':'choix taux réduit rénovation',
    'options.impression':'ligne de vente impression','options.reprise':'forfait reprise existant','options.reprisePrice':'prix forfait reprise',
    'options.access':'forfait accès difficile','options.accessPrice':'prix forfait accès','options.complexity':'coefficient main-d’œuvre'
  }),
  piece:Object.freeze({'name':'libellés résultat','shape':'géométrie forme pièce','shapeA':'géométrie décroché/ouverture','shapeB':'géométrie décroché/profondeur','length':'géométrie murs/plafond','width':'géométrie murs/plafond','height':'géométrie murs/main-d’œuvre','ceiling.active':'activation plafond'}),
  simple:Object.freeze({'label':'libellés résultat','length':'géométrie mur','height':'géométrie mur'}),
  wall:Object.freeze({
    'active':'activation calcul mur','type':'nombre de faces','height':'géométrie mur simple',
    'framing.profile':'ossature + compatibilité isolant','framing.spacingCm':'quantité montants','framing.system':'système classique/Optima',
    'framing.doubledStuds':'quantité montants + main-d’œuvre','framing.optimaRows':'fixations Optima',
    'face1.plate':'plaques/prix face 1','face1.doubleSkin':'plaques/vis/temps face 1','face1.manualPlateCount':'quantité manuelle traçable plaque face 1 si mur > format max','face2.plate':'plaques/prix face 2','face2.doubleSkin':'plaques/vis/temps face 2','face2.manualPlateCount':'quantité manuelle traçable plaque face 2 si mur > format max',
    'isolation.active':'activation isolation','isolation.reference':'article isolant couche 1','isolation.thickness':'alerte profil','isolation.price':'coût isolation couche 1',
    'isolation.semiRigid':'matière + main-d’œuvre','isolation.doubleLayer':'matière couche 2 + pose','isolation.secondReference':'article isolant couche 2',
    'isolation.secondPrice':'coût isolation couche 2','isolation.crossed':'main-d’œuvre pose croisée','isolation.pareVapeur':'ligne vente pare-vapeur','isolation.freinVapeur':'ligne vente hygrovariable',
    'reinforcementQty':'ligne vente renfort OSB','reinforcementPrice':'prix renfort OSB','outsideAnglesQty':'ligne vente angle sortant','cuts':'plus-value découpes/spots'
  }),
  opening:Object.freeze({'type':'libellé/trace ouverture','width':'surface déduite + profils horizontaux','height':'surface déduite','qty':'surface déduite + ossature périphérique'}),
  ceiling:Object.freeze({
    'active':'activation plafond','type':'perte plaque + plus-value rampant','manualArea':'surface rampant','support':'système de fixation selon support','dropMm':'plénum/retombée plafond','face.plate':'type/plaque plafond','face.doubleSkin':'plaque/vis/temps plafond',
    'plateFormatHeight':'format commercial plafond','cuts':'plus-value découpes plafond',
    'isolation.active':'activation isolation plafond','isolation.reference':'article isolant plafond','isolation.thickness':'épaisseur isolation plafond','isolation.price':'coût isolation plafond',
    'isolation.semiRigid':'matière + main-d’œuvre plafond','isolation.doubleLayer':'matière couche 2 + pose plafond',
    'isolation.secondReference':'article couche 2 plafond','isolation.secondPrice':'coût couche 2 plafond','isolation.crossed':'main-d’œuvre pose croisée plafond'
  }),
  extra:Object.freeze({'name':'libellé ligne vente','qty':'quantité ligne vente','price':'prix unitaire ligne vente'}),
  special:Object.freeze({'project.olderThan2Years':'contexte TVA','options.finish':'forfait finition','wall.planSelection':'mur affiché et cible des saisies'})
});
const KNOWN_ACTIONS = new Set(['add-piece','remove-piece','add-simple','remove-simple','add-opening','remove-opening','add-extra','remove-extra']);
function checkBinding(group,path,context){
  const destination=CONNECTION_DESTINATIONS[group]?.[path];
  if(!destination){critical('BINDING-UNKNOWN','Champ UI sans connexion métier déclarée.',{group,path,context});return false;}
  trace('BINDING-OK',{group,path,destination,context});return true;
}

const R = {
  plateLossWall: getRule('plaques.perteMurPct'),
  plateLossCeiling: getRule('plaques.pertePlafondPct'),
  plateLossRampant: getRule('plaques.perteRampantPct'),
  frameLoss: getRule('ossature.pertePct'),
  openingStuds: getRule('ossature.ouvertureMontantsTouteHauteur'),
  openingHorizontalFactor: getRule('ossature.ouvertureProfilsHorizontauxParLargeur'),
  heightThresholds: getRule('ossature.seuilsHauteurM'),
  screwsWall: getRule('vis.premierePeauMurParM2'),
  screwsCeiling: getRule('vis.premierePeauPlafondParM2'),
  screwsSecond: getRule('vis.secondePeauParM2'),
  screwsLoss: getRule('vis.pertePct'),
  screwsBox: getRule('vis.boiteUnites'),
  finishBandWall: getRule('finitions.bandeMurMlM2'),
  finishBandCeiling: getRule('finitions.bandePlafondMlM2'),
  finishCompoundWall: getRule('finitions.enduitMurKgM2'),
  finishCompoundCeiling: getRule('finitions.enduitPlafondKgM2'),
  finishPrices: getRule('finitions.prixVenteHtM2'),
  impression: getRule('finitions.impressionHtM2'),
  isoLoss: getRule('isolation.pertePanneauxRouleauxPct'),
  isoBlownLoss: getRule('isolation.perteSoufflePct'),
  semiRigidMaterial: getRule('isolation.semiRigideCoefMatiere'),
  semiRigidLabor: getRule('isolation.semiRigideCoefMainOeuvre'),
  secondLayerSale: getRule('isolation.secondeCouchePoseHtM2'),
  crossedLabor: getRule('isolation.poseCroiseeCoefMainOeuvre'),
  pareVapeur: getRule('isolation.pareVapeurPrixVenteHtM2'),
  freinVapeur: getRule('isolation.freinVapeurPrixVenteHtM2'),
  cloisonLabor: getRule('mainOeuvre.cloisonHParM2'),
  doublageOptimaLabor: getRule('mainOeuvre.doublageOptimaHParM2'),
  doublageClassicNoIsoLabor: getRule('mainOeuvre.doublageClassiqueSansIsolantHParM2'),
  doublageClassicIsoLabor: getRule('mainOeuvre.doublageClassiqueAvecIsolantHParM2'),
  ceilingLabor: getRule('mainOeuvre.plafondDroitHParM2'),
  secondSkinLabor: getRule('mainOeuvre.secondePeauHParM2'),
  doubledStudsLabor: getRule('mainOeuvre.montantsDoublesCoef'),
  complexity: getRule('mainOeuvre.complexiteCoef'),
  highHeight: getRule('optionsDirectes.seuilGrandeHauteurM'),
  highHeightSale: getRule('optionsDirectes.grandeHauteurHtM2'),
  cutsSale: getRule('optionsDirectes.nombreusesDecoupesSpotsHtM2'),
  rampantSale: getRule('optionsDirectes.rampantHtM2'),
  rampantComplexSale: getRule('optionsDirectes.rampantComplexeHtM2'),
  reprise: getRule('optionsDirectes.repriseExistantHt'),
  access: getRule('optionsDirectes.accesDifficileHt'),
  angleOut: getRule('optionsDirectes.angleSortantHtMl'),
  reinforcement: getRule('optionsDirectes.renfortOsbHtUnite'),
  optima: {
    furring: getRule('optima.fourrureF530MlM2'),
    clip: getRule('optima.lisseClipMlM2'),
    support: getRule('optima.appuiUniteM2'),
  },
  ceiling: {
    furring: getRule('plafondDroit.fourrureMlM2'),
    hanger: getRule('plafondDroit.suspenteUniteM2'),
    angle: getRule('plafondDroit.corniereMlM2'),
    splice: getRule('plafondDroit.eclisseUniteM2'),
    connector: getRule('plafondDroit.cavalierConnecteurUniteM2'),
  }
};

/* Prix/conditionnements documentés dans l'annexe 5 fournie par Guillaume.
   Ils sont identifiés comme FALLBACK DEMO et devront être remplacés par le catalogue réel dans SpeedArti. */
const DEMO_CATALOG = Object.freeze({
  plates: Object.freeze([
    {height:2.50,width:1.20,price:8.90,label:'1200 × 2500'},
    {height:2.60,width:1.20,price:9.40,label:'1200 × 2600'},
    {height:2.80,width:1.20,price:10.20,label:'1200 × 2800'},
    {height:3.00,width:1.20,price:10.90,label:'1200 × 3000'},
  ]),
  profiles: Object.freeze({
    M48:{label:'M48 / R48',width:48,rail:{length:3,price:3.20},stud:{length:3,price:4.90}},
    M70:{label:'M70 / R70',width:70,rail:{length:3,price:3.90},stud:{length:3,price:6.20}},
    M90:{label:'M90 / R90',width:90,rail:{length:3,price:4.80},stud:{length:3,price:7.90}},
    M100:{label:'M100 / R100',width:100,rail:{length:3,price:5.30},stud:{length:3,price:8.70}},
  }),
  f530: Object.freeze([{length:3,price:4.60},{length:5.30,price:8.20}]),
  cr2: Object.freeze({length:3,price:2.30}),
  hanger: Object.freeze({90:0.45,120:0.55,180:0.70,240:0.85,300:1.05}),
  screwBox: Object.freeze({qty:500,price:5.80}),
});
const PLATES = Object.freeze({
  BA13:{label:'BA13 standard',surcharge:getRule('plaques.surchargeAchatHtM2.BA13')},
  hydro:{label:'BA13 hydrofuge',surcharge:getRule('plaques.surchargeAchatHtM2.hydro')},
  phonique:{label:'BA13 phonique',surcharge:getRule('plaques.surchargeAchatHtM2.phonique')},
  feu:{label:'BA13 feu',surcharge:getRule('plaques.surchargeAchatHtM2.feu')},
  habito:{label:'Habito',surcharge:getRule('plaques.surchargeAchatHtM2.habito')},
});
const PROFILES = DEMO_CATALOG.profiles;
const CEILING_ACCESSORY_CATALOG=Object.freeze({
  // Prix publics relevés le 05/10/2026 chez Point.P, gamme Placo Stil F530.
  // Eclisse : 31,76 € TTC / 50 => 0,53 € HT/unité. Cavalier : 52,56 € TTC / 100 => 0,44 € HT/unité.
  ceilingSplicePriceEach:0.53,
  ceilingConnectorPriceEach:0.44
});
const OPTIMA_ACCESSORY_CATALOG=Object.freeze({
  // Prix publics relevés le 08/10/2026. Lisse Clip : 1,83 € TTC/ml => 1,53 € HT/ml.
  // Appui Optima2 100 : 101,90 € TTC / 50 => 1,70 € HT/unité.
  // L'appui Optima2 comprend sa tige et sa clé : aucune "clé" séparée n'est facturée.
  optimaClipPricePerMl:1.53,
  optimaSupportPriceEach:1.70
});
const CEILING_FIXING_CATALOG=Object.freeze({
  // Prix publics Point.P relevés le 08/10/2026 et convertis HT sur TVA 20 %.
  woodLongEach:0.65,      // Suspente longue Stil F530, 39,25 € TTC / 50
  woodMaxiEach:0.88,      // Suspente Maxi Stil F530, 52,92 € TTC / 50
  woodSecableEach:1.85,   // Suspente sécable Stil F530, 110,81 € TTC / 50
  hourdisHEach:1.77,      // Suspente H Stil F530, 211,97 € TTC / 100
  concreteAnchorEach:0.23,// Cheville laiton M6, 27,41 € TTC / 100
  threadedRodPerM:0.93,   // Tige filetée M6, 1,12 € TTC / m
  cavalierEach:0.44       // Cavalier Stil F530, 52,56 € TTC / 100
});
const FINISH_CONSUMABLE_CATALOG=Object.freeze({
  // Prix publics relevés le 05/10/2026 chez Castorama, convertis en HT sur base TVA 20 %.
  // Bande papier 30 m : 2,99 € TTC => 2,49 € HT.
  // Bande papier 150 m : 5,99 € TTC => 4,99 € HT.
  // Enduit à joint poudre 5 kg : 9,99 € TTC => 8,33 € HT.
  // Enduit à joint poudre 15 kg : 16,90 € TTC => 14,08 € HT.
  // Enduit à joint 25 kg : 20,90 € TTC => 17,42 € HT.
  band30Price:2.49,
  band150Price:4.99,
  compound5Price:8.33,
  compound15Price:14.08,
  compound25Price:17.42
});
const STORE = 'speedarti-plaquiste-demo-v130-guarded';
const steps = [
  ['Chantier','Contexte & TVA'],['Ouvrages','Pièces & murs simples'],['Murs','Configuration indépendante'],
  ['Plafonds','Droit / rampant'],['Options','Finitions & forfaits'],['Résultats','Calcul détaillé']
];
let step=0;
let selected={};
let state=load() || createInitial();
if(!state.catalog)state.catalog=catalogDefault();else{const defaults=catalogDefault();for(const k of ['optimaClipPricePerMl','optimaSupportPriceEach','ceilingSplicePriceEach','ceilingConnectorPriceEach','band30Price','band150Price','compound5Price','compound15Price','compound25Price'])if(!(Number(state.catalog[k])>0))state.catalog[k]=defaults[k];for(const legacy of ['band50Price','optimaKeyPriceEach','optimaFixingPriceEach'])if(legacy in state.catalog)delete state.catalog[legacy];}
let navigationErrors=[];
let content=null;
let $=null;

function uid(){ return ROOT.crypto?.randomUUID ? ROOT.crypto.randomUUID() : Math.random().toString(36).slice(2)+Date.now(); }
function isoDefault(){ return {active:false,reference:'',price:null,thickness:null,semiRigid:false,doubleLayer:false,secondReference:'',secondPrice:null,crossed:false,pareVapeur:false,freinVapeur:false,validated:false}; }
function faceDefault(){ return {plate:'BA13',doubleSkin:false,manualPlateCount:null}; }
function framingDefault(){ return {profile:null,spacingCm:null,system:null,optimaRows:null,doubledStuds:null}; }
function ceilingDefault(){ return {active:false,type:null,manualArea:null,support:null,dropMm:null,face:faceDefault(),isolation:isoDefault(),hangerLength:null,plateFormatHeight:null,cuts:false}; }
function wallBase(id,label,length){ return {id,label,active:true,type:null,length:length==null?null:Number(length),framing:framingDefault(),isolation:isoDefault(),face1:faceDefault(),face2:faceDefault(),openings:[],reinforcementQty:0,reinforcementPrice:R.reinforcement,outsideAnglesQty:0,cuts:false}; }
function makePiece(n=1){ const L=null,W=null; return {id:uid(),name:`Pièce ${n}`,shape:'rectangle',shapeA:null,shapeB:null,length:L,width:W,height:null,walls:[wallBase('A','Mur A (face)',L),wallBase('B','Mur B (droite)',W),wallBase('C','Mur C (fond)',L),wallBase('D','Mur D (gauche)',W)],ceiling:ceilingDefault()}; }
function makeSimpleWall(n=1){ const w=wallBase(uid(),`Mur simple ${n}`,null); w.height=null; return w; }
function catalogDefault(){return {optimaClipPricePerMl:OPTIMA_ACCESSORY_CATALOG.optimaClipPricePerMl,optimaSupportPriceEach:OPTIMA_ACCESSORY_CATALOG.optimaSupportPriceEach,ceilingSplicePriceEach:CEILING_ACCESSORY_CATALOG.ceilingSplicePriceEach,ceilingConnectorPriceEach:CEILING_ACCESSORY_CATALOG.ceilingConnectorPriceEach,band30Price:FINISH_CONSUMABLE_CATALOG.band30Price,band150Price:FINISH_CONSUMABLE_CATALOG.band150Price,compound5Price:FINISH_CONSUMABLE_CATALOG.compound5Price,compound15Price:FINISH_CONSUMABLE_CATALOG.compound15Price,compound25Price:FINISH_CONSUMABLE_CATALOG.compound25Price};}
function createInitial(){ return {schemaVersion:'1.6.1',project:{name:'Chiffrage Plaquiste — démo',olderThan2Years:null,energyRenovation:false,eligibilityConfirmed:false},catalog:catalogDefault(),pieces:[makePiece(1)],simpleWalls:[],options:{hourlyRate:null,materialMargin:null,complexity:null,finish:null,impression:false,reprise:false,reprisePrice:R.reprise,access:false,accessPrice:R.access,extras:[]}}; }
function load(){ if(typeof localStorage==='undefined')return null; try{return JSON.parse(localStorage.getItem(STORE));}catch{return null;} }
function save(show=false){
  checkStateStructure('before-save');
  const payload=JSON.stringify(state);
  const persisted=typeof localStorage!=='undefined'&&!INTEGRITY_TEST_RUNNING;
  if(persisted)localStorage.setItem(STORE,payload);
  trace('SAVE-CHECKSUM',{show,persisted,bytes:payload.length,head:payload.slice(0,48)});
  if(show&&!INTEGRITY_TEST_RUNNING)toast('Brouillon enregistré');
}

function initUI(){
  if(TEST_MODE || typeof document==='undefined')return;
  $=(s)=>document.querySelector(s);
  content=$('#content');
  $('#prev').onclick=()=>go(step-1);
  $('#next').onclick=()=>step===5?renderResults():attemptGo(step+1);
  $('#saveBtn').onclick=()=>save(true);
  $('#calcBtn').onclick=()=>attemptGo(5);
  $('#steps').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(!b)return;const target=+b.dataset.step;target<=step?go(target):attemptGo(target);});
  content.addEventListener('click',onClick);
  content.addEventListener('change',onInput);
  content.addEventListener('input',onInput);
  const diag=runIntegrityTests();
  updateDiagBadge(diag);
  render();
}
function updateDiagBadge(diag){ const el=document.querySelector('#diagBadge'); if(!el)return; const runtime=RUNTIME_ERRORS.length,ok=diag.failed===0&&runtime===0; el.textContent=ok?`Connexions ${diag.passed}/${diag.total}`:`ERREURS ${diag.failed+runtime}`; el.classList.toggle('diag-bad',!ok); }
function go(n){navigationErrors=[];step=Math.max(0,Math.min(5,n));render();if(typeof window!=='undefined'&&window.scrollTo)window.scrollTo({top:0,behavior:'smooth'});}
function renderNavigationErrors(){
  if(!content||!navigationErrors.length)return;
  content.insertAdjacentHTML('afterbegin',`<div class="alert err step-block"><b>Étape bloquée :</b> complétez les données obligatoires avant de continuer.</div>${navigationErrors.map(x=>`<div class="alert err step-block"><b>${esc(x.code)}</b> — ${esc(x.message)}</div>`).join('')}`);
}
function render(){ if(!content)return; $('#steps').innerHTML=steps.map((s,i)=>`<button class="step ${i===step?'active':''}" data-step="${i}"><b>${i+1}. ${s[0]}</b><span>${s[1]}</span></button>`).join('');$('#prev').style.visibility=step?'visible':'hidden';$('#next').textContent=step===5?'Recalculer':'Suivant →';[renderProject,renderWorks,renderWalls,renderCeilings,renderOptions,renderResults][step]();renderNavigationErrors(); auditRenderedBindings(content); checkStateStructure(`render-step-${step}`); }
function head(k,t,p){return `<div class="head"><span class="eyebrow">${k}</span><h1>${t}</h1><p>${p}</p></div>`;}

function positive(v){return Number.isFinite(Number(v))&&Number(v)>0;}
function nonNegative(v){return Number.isFinite(Number(v))&&Number(v)>=0;}
function stepError(code,message){return {code,message};}
function validateIsolationForStep(iso,label,errors){
  if(!iso?.active)return;
  if(!iso.reference)errors.push(stepError('PLQ-REQ-ISO-REF',`${label} : choisissez l’isolant.`));
  if(!positive(iso.thickness))errors.push(stepError('PLQ-REQ-ISO-THICKNESS',`${label} : renseignez l’épaisseur de l’isolant.`));
  if(!positive(iso.price))errors.push(stepError('PLQ-REQ-ISO-PRICE',`${label} : renseignez le prix d’achat HT/m².`));
  if(iso.doubleLayer){
    if(!iso.secondReference)errors.push(stepError('PLQ-REQ-ISO2-REF',`${label} : choisissez l’isolant de la deuxième couche.`));
    if(!positive(iso.secondPrice))errors.push(stepError('PLQ-REQ-ISO2-PRICE',`${label} : renseignez le prix de la deuxième couche.`));
  }
}
function validateWallForStep(w,height,label,errors){
  ensureWall(w);if(!w.active)return;
  if(!positive(w.length)||!positive(height)){errors.push(stepError('PLQ-REQ-WALL-DIM',`${label} : longueur et hauteur sont obligatoires.`));return;}
  if(!['cloison','doublage'].includes(w.type))errors.push(stepError('PLQ-REQ-WALL-TYPE',`${label} : choisissez Cloison ou Doublage.`));
  const faces=w.type==='cloison'?[w.face1,w.face2]:[w.face1];
  faces.forEach((f,i)=>{
    if(!PLATES[f.plate])errors.push(stepError('PLQ-REQ-PLATE',`${label} — face ${i+1} : choisissez le type de plaque.`));
    if(typeof f.doubleSkin!=='boolean')errors.push(stepError('PLQ-REQ-SKIN',`${label} — face ${i+1} : choisissez simple ou double peau.`));
    const max=DEMO_CATALOG.plates.at(-1)?.height??null;
    if(max!=null&&Number(height)>max&&!(Number.isInteger(Number(f.manualPlateCount))&&Number(f.manualPlateCount)>0))errors.push(stepError('PLQ-REQ-PLATE-MANUAL',`${label} — face ${i+1} : saisissez le nombre de plaques à commander pour ce mur haut.`));
  });
  if(w.type==='doublage'&&!['classique','optima'].includes(w.framing.system))errors.push(stepError('PLQ-REQ-FRAME-SYSTEM',`${label} : choisissez le système Classique ou Optima.`));
  if(w.type==='cloison'||w.framing.system==='classique'){
    if(!PROFILES[w.framing.profile])errors.push(stepError('PLQ-REQ-PROFILE',`${label} : choisissez le profil d’ossature.`));
    if(![40,60].includes(Number(w.framing.spacingCm)))errors.push(stepError('PLQ-REQ-SPACING',`${label} : choisissez l’entraxe 40 ou 60 cm.`));
    if(typeof w.framing.doubledStuds!=='boolean')errors.push(stepError('PLQ-REQ-STUDS',`${label} : choisissez montants simples ou doublés.`));
  }
  if(w.type==='doublage'&&w.framing.system==='optima'){
    const rows=w.framing.optimaRows==null?suggestRows(height):Number(w.framing.optimaRows);if(!(Number.isInteger(rows)&&rows>=1))errors.push(stepError('PLQ-REQ-OPTIMA-ROWS',`${label} : nombre de rangées Optima invalide.`));
  }
  w.openings.forEach((o,i)=>{if(!o.type||!positive(o.width)||!positive(o.height)||!positive(o.qty))errors.push(stepError('PLQ-REQ-OPENING',`${label} : l’ouverture ${i+1} doit avoir type, largeur, hauteur et quantité.`));});
  validateIsolationForStep(w.isolation,label,errors);
  if(Number(w.reinforcementQty)>0&&!positive(w.reinforcementPrice))errors.push(stepError('PLQ-REQ-RENFORT-PRICE',`${label} : renseignez le prix HT du renfort OSB.`));
}
function validateCeilingForStep(p,errors){
  const c=p.ceiling;if(!c?.active)return;ensureCeiling(c);const label=`Plafond ${p.name}`;
  if(!['droit','rampant','rampant_complexe'].includes(c.type))errors.push(stepError('PLQ-REQ-CEILING-TYPE',`${label} : choisissez le type de plafond.`));
  if(['rampant','rampant_complexe'].includes(c.type)&&!positive(c.manualArea))errors.push(stepError('PLQ-REQ-CEILING-AREA',`${label} : renseignez la surface réelle du rampant.`));
  if(!PLATES[c.face.plate])errors.push(stepError('PLQ-REQ-CEILING-PLATE',`${label} : choisissez le parement.`));
  if(typeof c.face.doubleSkin!=='boolean')errors.push(stepError('PLQ-REQ-CEILING-SKIN',`${label} : choisissez simple ou double peau.`));
  if(!DEMO_CATALOG.plates.some(x=>x.height===Number(c.plateFormatHeight)))errors.push(stepError('PLQ-REQ-CEILING-FORMAT',`${label} : choisissez le format de plaque.`));
  if(!['bois','beton','hourdis','autoportant'].includes(c.support))errors.push(stepError('PLQ-REQ-CEILING-SUPPORT',`${label} : choisissez le support / système de fixation.`));if(c.support&&c.support!=='autoportant'&&!positive(c.dropMm))errors.push(stepError('PLQ-REQ-CEILING-DROP',`${label} : renseignez le plénum / la retombée en mm.`));if(c.support==='autoportant')errors.push(stepError('PLQ-REQ-CEILING-AUTOPORTANT',`${label} : le plafond autoportant nécessite un dimensionnement de portée spécifique ; utilisez un plafond suspendu ou réalisez l’étude dédiée.`));
  validateIsolationForStep(c.isolation,label,errors);
}
function validateStep(index){
  const errors=[];state.catalog=state.catalog||catalogDefault();
  if(index===0){
    if(!String(state.project.name??'').trim())errors.push(stepError('PLQ-REQ-NAME','Le nom du chiffrage est obligatoire.'));
    if(!positive(state.options.hourlyRate))errors.push(stepError('PLQ-REQ-HOURLY','Le taux horaire HT doit être renseigné et supérieur à 0.'));
    if(!nonNegative(state.options.materialMargin))errors.push(stepError('PLQ-REQ-MARGIN','La marge matériaux doit être renseignée (0 % est autorisé).'));
    if(typeof state.project.olderThan2Years!=='boolean')errors.push(stepError('PLQ-REQ-TVA-CONTEXT','Choisissez « logement + de 2 ans » ou « logement - de 2 ans / neuf ».'));
  }else if(index===1){
    if(!state.pieces.length&&!state.simpleWalls.length)errors.push(stepError('PLQ-REQ-WORK','Ajoutez au moins une pièce ou un mur simple.'));
    state.pieces.forEach((p,i)=>{normalizePieceShape(p);if(!String(p.name??'').trim())errors.push(stepError('PLQ-REQ-PIECE-NAME',`Pièce ${i+1} : le nom est obligatoire.`));if(!positive(p.length)||!positive(p.width)||!positive(p.height))errors.push(stepError('PLQ-REQ-PIECE-DIM',`${p.name||`Pièce ${i+1}`} : longueur, largeur et hauteur sont obligatoires.`));if(p.shape!=='rectangle'&&(!positive(p.shapeA)||!positive(p.shapeB)||Number(p.shapeA)>=Number(p.length)||Number(p.shapeB)>=Number(p.width)))errors.push(stepError('PLQ-REQ-PIECE-SHAPE',`${p.name||`Pièce ${i+1}`} : renseignez A et B, inférieurs aux dimensions totales.`));});
    state.simpleWalls.forEach((w,i)=>{if(!String(w.label??'').trim())errors.push(stepError('PLQ-REQ-SIMPLE-NAME',`Mur simple ${i+1} : le nom est obligatoire.`));if(!positive(w.length)||!positive(w.height))errors.push(stepError('PLQ-REQ-SIMPLE-DIM',`${w.label||`Mur simple ${i+1}`} : longueur et hauteur sont obligatoires.`));});
  }else if(index===2){
    const activeWall=state.pieces.some(p=>(p.walls||[]).some(w=>w.active))||state.simpleWalls.some(w=>w.active),activeCeiling=state.pieces.some(p=>p.ceiling?.active);
    if(!activeWall&&!activeCeiling)errors.push(stepError('PLQ-REQ-ACTIVE-WORK','Activez au moins un mur ou un plafond à chiffrer.'));
    state.pieces.forEach(p=>{syncPieceWalls(p);p.walls.forEach(w=>validateWallForStep(w,p.height,`${p.name} — ${w.label}`,errors));});
    state.simpleWalls.forEach(w=>validateWallForStep(w,w.height,w.label,errors));
  }else if(index===3){
    state.pieces.forEach(p=>validateCeilingForStep(p,errors));
  }else if(index===4){
    if(!['aucune','bandes','pret_a_peindre','soignee'].includes(state.options.finish))errors.push(stepError('PLQ-REQ-FINISH','Choisissez le niveau de finition, y compris « Sans finition ».'));
    if(!Object.prototype.hasOwnProperty.call(R.complexity,state.options.complexity))errors.push(stepError('PLQ-REQ-COMPLEXITY','Choisissez la complexité générale du chantier.'));
    if(state.options.reprise&&!positive(state.options.reprisePrice))errors.push(stepError('PLQ-REQ-REPRISE','Renseignez le prix de la reprise sur existant.'));
    if(state.options.access&&!positive(state.options.accessPrice))errors.push(stepError('PLQ-REQ-ACCESS','Renseignez le prix de l’accès difficile.'));
    state.options.extras.forEach((x,i)=>{if(!String(x.name??'').trim()||!positive(x.qty)||!positive(x.price))errors.push(stepError('PLQ-REQ-EXTRA',`Extra ${i+1} : libellé, quantité et prix HT sont obligatoires.`));});
  }
  trace('STEP-VALIDATE',{index,ok:errors.length===0,count:errors.length,codes:errors.map(x=>x.code)});return errors;
}
function attemptGo(target){
  target=Math.max(0,Math.min(5,Number(target)));if(target<=step){go(target);return true;}
  for(let i=0;i<target;i++){const errors=validateStep(i);if(errors.length){step=i;navigationErrors=errors;trace('STEP-BLOCK',{target,blockedAt:i,errors});render();if(typeof window!=='undefined'&&window.scrollTo)window.scrollTo({top:0,behavior:'smooth'});return false;}}
  navigationErrors=[];step=target;render();if(typeof window!=='undefined'&&window.scrollTo)window.scrollTo({top:0,behavior:'smooth'});return true;
}

function renderProject(){
  const old=state.project.olderThan2Years;
  content.innerHTML=head('Étape 1','Contexte du chantier','Les paramètres entreprise et le contexte fiscal doivent être explicites : aucune valeur cachée.')+`
  <div class="card"><div class="grid">
    <div class="field c6"><label>Nom du chiffrage</label><input class="input" data-path="project.name" value="${esc(state.project.name)}"></div>
    <div class="field c3"><label>Taux horaire HT</label><input class="input" type="number" step="1" min="0" placeholder="À renseigner" data-path="options.hourlyRate" value="${val(state.options.hourlyRate)}"></div>
    <div class="field c3"><label>Marge matériaux (%)</label><input class="input" type="number" step=".1" min="0" placeholder="À renseigner" data-path="options.materialMargin" value="${val(state.options.materialMargin)}"></div>
  </div>
  <div class="choice-grid"><button class="choice-card ${old===true?'selected':''}" data-age="old"><b>🏠 Logement + de 2 ans</b><span>Proposition TVA réduite selon prestation, à confirmer.</span></button><button class="choice-card ${old===false?'selected':''}" data-age="new"><b>🏗️ Logement - de 2 ans / neuf</b><span>Contexte neuf.</span></button></div>
  ${old===true?`<div class="subcard"><label class="check"><input type="checkbox" data-path="project.eligibilityConfirmed" ${state.project.eligibilityConfirmed?'checked':''}> Confirmer l’éligibilité de l’isolation énergétique à la TVA 5,5 %</label><div class="hint">Logement de plus de 2 ans : TVA 10 % par défaut. Si cette case est cochée, seules les lignes d’isolation énergétique éligibles passent à 5,5 % ; les autres lignes restent à 10 %.</div></div>`:''}
  <div class="alert warn"><b>Catalogue démo :</b> les dimensions/prix de plaques, rails, montants, F530, CR2, suspentes et vis proviennent de l’annexe 5. Dans SpeedArti, le catalogue réel sera prioritaire.</div></div>`;
}

function renderWorks(){
  let html=head('Étape 2','Pièces et murs simples','Choisissez une forme Rectangle, L, T ou U. Le plan se met à jour avec les dimensions et chaque segment généré devient un mur indépendant.');
  html+=`<div class="row between toolbar"><h2>Ouvrages</h2><div class="row"><button class="btn secondary" data-action="add-piece">+ Ajouter une pièce</button><button class="btn primary" data-action="add-simple">+ Ajouter un mur simple</button></div></div>`;
  html+=state.pieces.map(p=>{normalizePieceShape(p);syncPieceWalls(p);const shaped=p.shape!=='rectangle',shapeLabels={L:['Largeur du décroché A (m)','Profondeur du décroché B (m)'],T:['Largeur du pied A (m)','Profondeur barre haute B (m)'],U:['Largeur ouverture du U A (m)','Profondeur du U B (m)']},labels=shapeLabels[p.shape]||[];
    return `<div class="card"><div class="row between"><div><h2>${esc(p.name)}</h2><span class="muted">${p.walls.length} murs indépendants · surface ${fmt(pieceFloorArea(p))} m²</span></div><button class="btn danger small" data-action="remove-piece" data-id="${p.id}">Supprimer</button></div><div class="piece-entry-layout"><div><div class="grid"><div class="field c4"><label>Nom</label><input class="input" data-piece="${p.id}" data-pkey="name" value="${esc(p.name)}"></div><div class="field c4"><label>Forme</label><select class="select" data-piece="${p.id}" data-pkey="shape"><option value="rectangle" ${p.shape==='rectangle'?'selected':''}>Rectangle</option><option value="L" ${p.shape==='L'?'selected':''}>Pièce en L</option><option value="T" ${p.shape==='T'?'selected':''}>Pièce en T</option><option value="U" ${p.shape==='U'?'selected':''}>Pièce en U</option></select></div><div class="field c2"><label>Longueur totale (m)</label><input class="input" type="number" step=".1" min="0.01" data-piece="${p.id}" data-pkey="length" value="${val(p.length)}"></div><div class="field c2"><label>Largeur totale (m)</label><input class="input" type="number" step=".1" min="0.01" data-piece="${p.id}" data-pkey="width" value="${val(p.width)}"></div>${shaped?`<div class="field c3"><label>${labels[0]}</label><input class="input" type="number" step=".1" min="0.01" data-piece="${p.id}" data-pkey="shapeA" value="${val(p.shapeA)}"></div><div class="field c3"><label>${labels[1]}</label><input class="input" type="number" step=".1" min="0.01" data-piece="${p.id}" data-pkey="shapeB" value="${val(p.shapeB)}"></div>`:''}<div class="field c3"><label>Hauteur (m)</label><input class="input" type="number" step=".1" min="0.01" data-piece="${p.id}" data-pkey="height" value="${val(p.height)}"></div><div class="field c3"><label>Plafond</label><select class="select" data-piece="${p.id}" data-pkey="ceiling.active"><option value="false" ${!p.ceiling.active?'selected':''}>Non</option><option value="true" ${p.ceiling.active?'selected':''}>Oui</option></select></div></div>${shaped?'<div class="hint">A et B doivent rester inférieurs aux dimensions totales. Le plan et le calcul utilisent exactement la même géométrie.</div>':''}</div>${piecePreviewMarkup(p)}</div></div>`;}).join('');
  html+=state.simpleWalls.map(w=>`<div class="card simple-card"><div class="row between"><div><h2>${esc(w.label)}</h2><span class="muted">Mur indépendant</span></div><button class="btn danger small" data-action="remove-simple" data-id="${w.id}">Supprimer</button></div><div class="grid"><div class="field c5"><label>Nom</label><input class="input" data-simple="${w.id}" data-skey="label" value="${esc(w.label)}"></div><div class="field c3"><label>Longueur (m)</label><input class="input" type="number" step=".1" min="0.01" data-simple="${w.id}" data-skey="length" value="${val(w.length)}"></div><div class="field c3"><label>Hauteur (m)</label><input class="input" type="number" step=".1" min="0.01" data-simple="${w.id}" data-skey="height" value="${val(w.height)}"></div></div></div>`).join('');
  if(!state.simpleWalls.length)html+=`<div class="note-card">💡 « Ajouter un mur simple » remplace l’ancien mode Linéaire.</div>`;
  content.innerHTML=html;
}

function renderWalls(){
  let html=head('Étape 3','Configuration indépendante de chaque mur','Ossature, isolation, parements, ouvertures et options sont enregistrés sur le mur sélectionné uniquement.');
  state.pieces.forEach(p=>{
    syncPieceWalls(p);
    const sel=selected[p.id]||'A';selected[p.id]=sel;
    const wall=p.walls.find(w=>w.id===sel)||p.walls[0];
    html+=`<div class="card"><div class="row between"><div><h2>${esc(p.name)}</h2><span class="muted">Cliquez un mur sur le plan puis configurez-le indépendamment.</span></div><span class="status-chip">Mur sélectionné : ${esc(wall.id)}</span></div><div class="piece-layout"><div><div class="plan">${planSvg(p,sel)}</div><div class="legend"><span><i class="dot" style="background:#3b82f6"></i> Cloison</span><span><i class="dot" style="background:#f59e0b"></i> Doublage</span><span><i class="dot" style="background:#94a3b8"></i> Inactif</span></div></div><div>${wallEditor(wall,p.height,`piece:${p.id}:${wall.id}`)}</div></div></div>`;
  });
  if(state.simpleWalls.length){html+=`<h2 class="section-title">Murs simples</h2>`;state.simpleWalls.forEach(w=>{html+=`<div class="card"><div class="row between"><h2>${esc(w.label)}</h2><span class="status-chip">Mur simple</span></div>${wallEditor(w,w.height,`simple:${w.id}`,true)}</div>`;});}
  content.innerHTML=html;
}
function framingSuggestion(height){
  const h=Number(height);
  if(!Number.isFinite(h)||h<=0)return {profile:null,spacingCm:null,doubledStuds:null,text:'Renseignez la hauteur pour obtenir une suggestion'};
  if(h<=R.heightThresholds.m48Simple60)return {profile:'M48',spacingCm:60,doubledStuds:false,text:'M48 simple · entraxe 60 cm'};
  if(h<=R.heightThresholds.m48Simple40)return {profile:'M48',spacingCm:40,doubledStuds:false,text:'M48 simple · entraxe 40 cm'};
  if(h<=R.heightThresholds.m48Double60)return {profile:'M48',spacingCm:60,doubledStuds:true,text:'M48 doublé · entraxe 60 cm'};
  if(h<=R.heightThresholds.m48Double40)return {profile:'M48',spacingCm:40,doubledStuds:true,text:'M48 doublé · entraxe 40 cm'};
  if(h<=R.heightThresholds.maxAuto)return {profile:null,spacingCm:null,doubledStuds:null,text:'Choix technique M70/M90 ou double parement — validation requise'};
  return {profile:null,spacingCm:null,doubledStuds:null,text:'Étude spécifique obligatoire (> 4,15 m)'};
}


function wallTechnicalAlerts(w,height,label='Ce mur'){
  if(!w||w.type!=='cloison'||w.framing?.profile!=='M48')return [];
  const spacingCm=Number(w.framing.spacingCm);
  if(![40,60].includes(spacingCm)||typeof w.framing.doubledStuds!=='boolean'||!(Number(height)>0))return [];
  const doubleParement=!!w.face1?.doubleSkin&&!!w.face2?.doubleSkin;
  const limit=doubleParement
    ?(w.framing.doubledStuds?(spacingCm===60?3.75:4.15):(spacingCm===60?3.00:3.45))
    :(w.framing.doubledStuds?(spacingCm===60?3.05:3.45):(spacingCm===60?2.50:2.80));
  if(Number(height)<=limit+1e-9)return [];
  return [{
    code:'PLQ-DTU-M48-HEIGHT',
    limit,
    message:`⚠️ ${label} : configuration hors limite documentée Placo / DTU 25.41 — M48 ${w.framing.doubledStuds?'doublé':'simple'}, entraxe ${spacingCm} cm, ${doubleParement?'double':'simple'} parement : hauteur limite ${fmt(limit)} m pour ${fmt(height)} m réalisés. Adaptez entraxe, ossature ou parement.`
  }];
}
function wallScopeContext(scope,w){
  const [kind,id]=String(scope||'').split(':');
  if(kind==='piece'){
    const p=state.pieces.find(x=>x.id===id);
    return {height:Number(p?.height)||0,label:p?`${p.name} — ${w.label}`:(w.label||'Ce mur')};
  }
  return {height:Number(w?.height)||0,label:w?.label||'Mur simple'};
}
function wallTechnicalAlertHtml(w,height,scope,label='Ce mur'){
  const alerts=wallTechnicalAlerts(w,height,label);
  return `<div class="wall-tech-alert" data-wall-tech-alert="${esc(scope)}">${alerts.map(a=>`<div class="alert warn"><b>Alerte technique informative</b><br>${esc(a.message.replace(/^⚠️\s*/,''))}</div>`).join('')}</div>`;
}
function updateWallTechnicalAlert(scope,w){
  if(!content||!scope||!w)return;
  const box=content.querySelector(`[data-wall-tech-alert="${scope}"]`);
  if(!box)return;
  const ctx=wallScopeContext(scope,w);
  box.innerHTML=wallTechnicalAlerts(w,ctx.height,ctx.label).map(a=>`<div class="alert warn"><b>Alerte technique informative</b><br>${esc(a.message.replace(/^⚠️\s*/,''))}</div>`).join('');
}

function findIsolationSuggestion(w){
  const profileWidth=PROFILES[w.framing?.profile]?.width||0;
  if(!w.type||!profileWidth)return null;
  const patterns=w.type==='cloison'?[/cloison/i,/phonique/i]:w.type==='doublage'?[/doublage/i,/ITI/i]:[];
  let candidates=ABAQUE.filter(x=>x.kind!=='blown'&&patterns.some(rx=>rx.test(x.usage||'')));
  if(profileWidth>0)candidates=candidates.filter(x=>(+x.epaisseurMm||0)<=profileWidth);
  candidates.sort((a,b)=>(+b.epaisseurMm||0)-(+a.epaisseurMm||0));
  return candidates[0]||null;
}
function applyWallIsolationSuggestion(w,reason){
  if(!w?.isolation?.active||w.isolation.reference)return null;
  const ref=findIsolationSuggestion(w);
  if(!ref){trace('ISO-SUGGEST-NONE',{wallId:w.id,type:w.type,profile:w.framing?.profile,reason});return null;}
  w.isolation.reference=ref.id;w.isolation.price=ref.prixAchatHtM2;w.isolation.thickness=ref.epaisseurMm;
  if(!w.isolation.secondReference){w.isolation.secondReference=ref.id;w.isolation.secondPrice=ref.prixAchatHtM2;}
  trace('ISO-SUGGEST',{wallId:w.id,type:w.type,profile:w.framing?.profile,reference:ref.id,thickness:ref.epaisseurMm,reason});return ref;
}
function applyCeilingIsolationSuggestion(c,reason){
  if(!c?.isolation?.active||c.isolation.reference)return null;
  /* Aucun profil/critère d'épaisseur plafond validé n'est fourni dans cette démo : ne pas choisir une référence arbitrairement. */
  trace('ISO-SUGGEST-NONE',{scope:'ceiling',reason,why:'aucun critère de profil plafond validé — choix manuel requis'});
  return null;
}
function wallEditor(w,height,scope,isSimple=false){
  ensureWall(w);const iso=w.isolation,f1=w.face1,f2=w.face2,profile=PROFILES[w.framing.profile]||null,suggestion=framingSuggestion(height),net=wallNet(w,height),secondFace=w.type==='cloison';
  const isDoublage=w.type==='doublage',isOptima=isDoublage&&w.framing.system==='optima',rowsAuto=suggestRows(height);
  const systemField=isDoublage?`<div class="field c4"><label>Système doublage</label><select class="select" data-wall="${scope}" data-wkey="framing.system"><option value="" ${!w.framing.system?'selected':''}>À choisir</option><option value="classique" ${w.framing.system==='classique'?'selected':''}>Classique</option><option value="optima" ${w.framing.system==='optima'?'selected':''}>Optima</option></select></div>`:'';
  const classicFields=!isOptima?`<div class="field c4"><label>Profil</label><select class="select" data-wall="${scope}" data-wkey="framing.profile"><option value="" ${!w.framing.profile?'selected':''}>À choisir</option>${Object.entries(PROFILES).map(([k,p])=>`<option value="${k}" ${w.framing.profile===k?'selected':''}>${p.label}</option>`).join('')}</select></div><div class="field c4"><label>Entraxe montants</label><select class="select" data-wall="${scope}" data-wkey="framing.spacingCm"><option value="" ${w.framing.spacingCm==null?'selected':''}>À choisir</option><option value="60" ${+w.framing.spacingCm===60?'selected':''}>60 cm</option><option value="40" ${+w.framing.spacingCm===40?'selected':''}>40 cm</option></select></div><div class="field c4"><label>Montants</label><select class="select" data-wall="${scope}" data-wkey="framing.doubledStuds"><option value="" ${typeof w.framing.doubledStuds!=='boolean'?'selected':''}>À choisir</option><option value="false" ${w.framing.doubledStuds===false?'selected':''}>Simples</option><option value="true" ${w.framing.doubledStuds===true?'selected':''}>Doublés</option></select></div>`:'';
  const optimaFields=isOptima?`<div class="field c6"><label>Rangées appuis Optima</label><input class="input" type="number" min="1" placeholder="Auto : ${rowsAuto??'hauteur requise'}" data-wall="${scope}" data-wkey="framing.optimaRows" value="${val(w.framing.optimaRows)}"><span class="hint">Vide = calcul automatique selon la hauteur ; une valeur saisie remplace la suggestion.</span></div>`:'';
  const optimaCatalogue='';
  return `<div class="wall-editor"><div class="grid wall-main-grid ${isSimple?'simple-wall-main-grid':''}"><div class="field ${isSimple?'c3':'c4'}"><label>Actif</label><select class="select" data-wall="${scope}" data-wkey="active"><option value="false" ${w.active===false?'selected':''}>Non</option><option value="true" ${w.active===true?'selected':''}>Oui</option></select></div><div class="field ${isSimple?'c5':'c8'}"><label>Type de mur</label><select class="select" data-wall="${scope}" data-wkey="type"><option value="" ${!w.type?'selected':''}>À choisir</option><option value="cloison" ${w.type==='cloison'?'selected':''}>Cloison — 2 faces</option><option value="doublage" ${w.type==='doublage'?'selected':''}>Doublage — 1 face</option></select></div>${isSimple?`<div class="field c4"><label>Hauteur (m)</label><input class="input" type="number" step=".1" min="0.01" data-wall="${scope}" data-wkey="height" value="${val(height)}"></div>`:''}</div>
  <div class="subcard"><h3>1. Ossature de ce mur</h3><div class="grid">${systemField}${classicFields}${optimaFields}</div><div class="hint">Suggestion hauteur : ${esc(suggestion.text)}. Elle n’est jamais appliquée silencieusement : tout choix classique reste explicite ; Optima peut garder un nombre de rangées en mode automatique.</div>${wallTechnicalAlertHtml(w,height,scope,isSimple?(w.label||'Mur simple'):'Ce mur')}</div>${optimaCatalogue}
  <div class="subcard"><h3>2. Isolation de ce mur</h3>${isoEditor(iso,scope,net,isOptima?null:(profile?.width??null),w.type)}</div>
  <div class="faces-grid"><div class="subcard"><h3>3. Face 1</h3>${faceEditor(f1,scope,'face1',height)}</div>${secondFace?`<div class="subcard"><h3>4. Face 2</h3>${faceEditor(f2,scope,'face2',height)}</div>`:`<div class="subcard muted-box"><h3>Face 2</h3><p>Non applicable : doublage = une seule face.</p></div>`}</div>
  <div class="subcard"><div class="row between"><h3>Ouvertures / options de ce mur</h3><button class="btn secondary small" data-action="add-opening" data-scope="${scope}">+ Ajouter une ouverture</button></div>${w.openings.map(o=>openingRow(o,scope)).join('')||`<div class="note">Aucune ouverture.</div>`}<div class="grid top-gap"><div class="field c3"><label>Renforts OSB</label><input class="input" type="number" min="0" data-wall="${scope}" data-wkey="reinforcementQty" value="${w.reinforcementQty||0}"></div><div class="field c3"><label>Prix renfort HT</label><input class="input" type="number" step="1" min="0" data-wall="${scope}" data-wkey="reinforcementPrice" value="${w.reinforcementPrice??R.reinforcement}"></div><div class="field c3"><label>Nombre d’angles sortants</label><input class="input" type="number" min="0" data-wall="${scope}" data-wkey="outsideAnglesQty" value="${w.outsideAnglesQty||0}"></div><div class="field c3"><label>Surface nette 1 face</label><input class="input" disabled value="${fmt(net)} m²"></div></div><label class="check top-gap"><input type="checkbox" data-wall="${scope}" data-wkey="cuts" ${w.cuts?'checked':''}> Nombreuses découpes / spots sur ce mur (+${R.cutsSale} €/m²)</label></div></div>`;
}
function faceEditor(face,scope,key,height){
  const maxPlateHeight=DEMO_CATALOG.plates.at(-1)?.height??null;
  const needsManual=Number.isFinite(Number(height))&&maxPlateHeight!=null&&Number(height)>maxPlateHeight;
  const manual=needsManual?`<div class="field c5"><label>Nombre de plaques à commander — saisie artisan</label><input class="input" type="number" step="1" min="1" placeholder="Obligatoire" data-wall="${scope}" data-wkey="${key}.manualPlateCount" value="${val(face.manualPlateCount)}"><span class="hint">Mur plus haut que ${fmt(maxPlateHeight)} m : aucun calepinage automatique n’est inventé. L’artisan valide le nombre réel de plaques.</span></div>`:'';
  return `<div class="grid"><div class="field c7"><label>Type de plaque</label><select class="select" data-wall="${scope}" data-wkey="${key}.plate"><option value="" ${!face.plate?'selected':''}>À choisir</option>${Object.entries(PLATES).map(([k,p])=>`<option value="${k}" ${face.plate===k?'selected':''}>${p.label}</option>`).join('')}</select></div><div class="field c5"><label>Peaux</label><select class="select" data-wall="${scope}" data-wkey="${key}.doubleSkin"><option value="" ${typeof face.doubleSkin!=='boolean'?'selected':''}>À choisir</option><option value="false" ${face.doubleSkin===false?'selected':''}>Simple peau</option><option value="true" ${face.doubleSkin===true?'selected':''}>Double peau</option></select></div>${manual}</div><div class="hint">Cette face est indépendante de l’autre face et des autres murs.</div>`;
}
function isoEditor(iso,scope,surface,profileWidth,wallType,isCeiling=false){
  const ceilingId=isCeiling?String(scope||'').replace(/^ceiling:/,''):null;
  const bind=(key)=>isCeiling?`data-ceiling="${ceilingId}" data-ckey="${key}"`:`data-wall="${scope}" data-wkey="${key}"`;
  const locationLabel=isCeiling?'au plafond':'sur ce mur';
  if(!iso.active){
    const extra=isCeiling?'':'<div class="hint">Aucune isolation calculée pour ce mur.</div>';
    return `<label class="check big-check"><input type="checkbox" ${bind('isolation.active')}> Ajouter une isolation ${locationLabel}</label>${extra}`;
  }
  const ref=ABAQUE.find(x=>x.id===iso.reference)||null;const tooThick=Number.isFinite(profileWidth)&&profileWidth>0&&(+iso.thickness||ref?.epaisseurMm||0)>profileWidth;
  return `<label class="check big-check"><input type="checkbox" ${bind('isolation.active')} checked> ${isCeiling?'Isolation plafond active':'Isolation active'}</label><div class="iso-grid"><div class="field"><label>Isolant couche 1</label><select class="select" ${bind('isolation.reference')}><option value="" ${!iso.reference?'selected':''}>À choisir</option>${ABAQUE.map(x=>`<option value="${x.id}" ${x.id===iso.reference?'selected':''}>${esc(x.nom)} — ${x.epaisseurMm} mm — ${x.prixAchatHtM2.toFixed(2)} € achat/m²</option>`).join('')}</select></div><div class="field"><label>Épaisseur (mm)</label><input class="input" type="number" min="0" ${bind('isolation.thickness')} value="${val(iso.thickness)}"></div><div class="field"><label>Prix achat HT/m²</label><input class="input" type="number" step=".01" min="0" ${bind('isolation.price')} value="${val(iso.price)}"></div></div><div class="row wrap top-gap"><label class="check"><input type="checkbox" ${bind('isolation.semiRigid')} ${iso.semiRigid?'checked':''}> Semi-rigide ×${R.semiRigidMaterial.toFixed(2)}</label><label class="check"><input type="checkbox" ${bind('isolation.doubleLayer')} ${iso.doubleLayer?'checked':''}> Double couche</label><label class="check"><input type="checkbox" ${bind('isolation.crossed')} ${iso.crossed?'checked':''} ${!iso.doubleLayer?'disabled':''}> Pose croisée</label>${!isCeiling&&wallType==='doublage'?`<label class="check"><input type="checkbox" ${bind('isolation.pareVapeur')} ${iso.pareVapeur?'checked':''}> Pare-vapeur ${R.pareVapeur} €/m²</label><label class="check"><input type="checkbox" ${bind('isolation.freinVapeur')} ${iso.freinVapeur?'checked':''}> Hygrovariable ${R.freinVapeur} €/m²</label>`:!isCeiling?`<span class="hint">Membranes non proposées ici : la règle fournie les rattache au doublage isolé.</span>`:''}</div>${iso.doubleLayer?`<div class="grid top-gap"><div class="field c8"><label>Isolant couche 2</label><select class="select" ${bind('isolation.secondReference')}><option value="" ${!iso.secondReference?'selected':''}>À choisir</option>${ABAQUE.map(x=>`<option value="${x.id}" ${x.id===iso.secondReference?'selected':''}>${esc(x.nom)} — ${x.epaisseurMm} mm</option>`).join('')}</select></div><div class="field c4"><label>Prix couche 2 HT/m²</label><input class="input" type="number" step=".01" min="0" ${bind('isolation.secondPrice')} value="${val(iso.secondPrice)}"></div></div>`:''}${tooThick?`<div class="alert warn">⚠️ Isolant plus épais que le profil : alerte sans blocage.</div>`:''}<div class="hint">Surface isolée : ${fmt(surface)} m². Prix abaque modifiables par l’artisan.</div>`;
}

function openingRow(o,scope){return `<div class="open-row"><div class="field"><label>Type</label><select class="select" data-open="${o.id}" data-scope="${scope}" data-okey="type"><option value="" ${!o.type?'selected':''}>À choisir</option><option value="porte" ${o.type==='porte'?'selected':''}>Porte</option><option value="fenetre" ${o.type==='fenetre'?'selected':''}>Fenêtre</option><option value="baie" ${o.type==='baie'?'selected':''}>Baie</option></select></div><div class="field"><label>Largeur</label><input class="input" type="number" step=".01" min="0.01" data-open="${o.id}" data-scope="${scope}" data-okey="width" value="${val(o.width)}"></div><div class="field"><label>Hauteur</label><input class="input" type="number" step=".01" min="0.01" data-open="${o.id}" data-scope="${scope}" data-okey="height" value="${val(o.height)}"></div><div class="field"><label>Qté</label><input class="input" type="number" min="1" data-open="${o.id}" data-scope="${scope}" data-okey="qty" value="${o.qty}"></div><button class="btn danger small" data-action="remove-opening" data-scope="${scope}" data-openid="${o.id}">×</button></div>`;}

function renderCeilings(){
  let html=head('Étape 4','Plafonds indépendants par pièce','Choisissez le support réel : SpeedArti adapte le système de fixation au lieu d’imposer une suspente unique.');
  if(!state.pieces.some(p=>p.ceiling.active))html+=`<div class="note-card">Aucun plafond actif. Activez-le dans l’étape Ouvrages.</div>`;
  state.pieces.forEach(p=>{
    const c=p.ceiling;if(!c.active)return;ensureCeiling(c);const area=ceilingArea(p),iso=c.isolation;
    const supportHelp=c.support==='bois'?'Suspente bois F530 choisie automatiquement selon le plénum.':c.support==='beton'?'Cheville M6 + tige filetée M6 + cavalier F530.':c.support==='hourdis'?'Suspente H F530 ; tige filetée ajoutée si le plénum dépasse 40 mm.':c.support==='autoportant'?'Rails + montants : dimensionnement de portée spécifique requis.':'Choisissez le support réel du plafond.';
    html+=`<div class="card"><div class="row between"><div><h2>${esc(p.name)} — plafond</h2><span class="muted">Surface : ${fmt(area)} m²</span></div><label class="check"><input type="checkbox" data-ceiling="${p.id}" data-ckey="active" ${c.active?'checked':''}> Actif</label></div><div class="grid"><div class="field c3"><label>Type</label><select class="select" data-ceiling="${p.id}" data-ckey="type"><option value="" ${!c.type?'selected':''}>À choisir</option><option value="droit" ${c.type==='droit'?'selected':''}>Plafond droit</option><option value="rampant" ${c.type==='rampant'?'selected':''}>Rampant +${R.rampantSale} €/m²</option><option value="rampant_complexe" ${c.type==='rampant_complexe'?'selected':''}>Rampant complexe +${R.rampantComplexSale} €/m²</option></select></div>${['rampant','rampant_complexe'].includes(c.type)?`<div class="field c3"><label>Surface réelle rampant (m²)</label><input class="input" type="number" step=".1" min="0.01" placeholder="À renseigner" data-ceiling="${p.id}" data-ckey="manualArea" value="${val(c.manualArea)}"></div>`:`<div class="field c3"><label>Surface auto</label><input class="input" disabled value="${c.type==='droit'?fmt(pieceFloorArea(p))+' m²':'—'}"></div>`}<div class="field c3"><label>Support / fixation</label><select class="select" data-ceiling="${p.id}" data-ckey="support"><option value="" ${!c.support?'selected':''}>À choisir</option><option value="bois" ${c.support==='bois'?'selected':''}>Bois — solives / chevrons</option><option value="beton" ${c.support==='beton'?'selected':''}>Dalle béton</option><option value="hourdis" ${c.support==='hourdis'?'selected':''}>Hourdis / poutrelles</option><option value="autoportant" ${c.support==='autoportant'?'selected':''}>Autoportant — étude spécifique</option></select></div>${c.support&&c.support!=='autoportant'?`<div class="field c3"><label>Plénum / retombée (mm)</label><input class="input" type="number" step="10" min="20" placeholder="Ex. 150" data-ceiling="${p.id}" data-ckey="dropMm" value="${val(c.dropMm)}"></div>`:''}<div class="field c3"><label>Parement</label><select class="select" data-ceiling="${p.id}" data-ckey="face.plate"><option value="" ${!c.face.plate?'selected':''}>À choisir</option>${Object.entries(PLATES).map(([k,v])=>`<option value="${k}" ${c.face.plate===k?'selected':''}>${v.label}</option>`).join('')}</select></div><div class="field c3"><label>Peaux</label><select class="select" data-ceiling="${p.id}" data-ckey="face.doubleSkin"><option value="false" ${c.face.doubleSkin===false?'selected':''}>Simple peau</option><option value="true" ${c.face.doubleSkin===true?'selected':''}>Double peau</option></select></div><div class="field c3"><label>Format plaque</label><select class="select" data-ceiling="${p.id}" data-ckey="plateFormatHeight"><option value="">À choisir</option>${DEMO_CATALOG.plates.map(f=>`<option value="${f.height}" ${Number(c.plateFormatHeight)===f.height?'selected':''}>${f.label}</option>`).join('')}</select></div></div><div class="hint">${esc(supportHelp)}</div>
      <div class="subcard"><h3>Isolation plafond</h3>${isoEditor(iso,`ceiling:${p.id}`,area,null,'plafond',true)}</div>
      <label class="check top-gap"><input type="checkbox" data-ceiling="${p.id}" data-ckey="cuts" ${c.cuts?'checked':''}> Nombreuses découpes / spots (+${R.cutsSale} €/m²)</label></div>`;
  });
  content.innerHTML=html;
}

function renderOptions(){
  const o=state.options;
  content.innerHTML=head('Étape 5','Finitions et options chantier','Les options chantier sont distinctes des options propres à chaque mur/plafond.')+
  `<div class="card"><h2>Finition</h2><div class="choice-grid four">${[['aucune','Sans finition'],['bandes','Bandes — 5 €/m²'],['pret_a_peindre','Prêt à peindre — 9 €/m²'],['soignee','Soignée — 13 €/m²']].map(([k,l])=>`<button class="choice-card ${o.finish===k?'selected':''}" data-finish="${k}"><b>${l}</b></button>`).join('')}</div>${['pret_a_peindre','soignee'].includes(o.finish)?`<label class="check top-gap"><input type="checkbox" data-path="options.impression" ${o.impression?'checked':''}> Impression +${R.impression} €/m²</label>`:''}</div><div class="card"><h2>Options chantier</h2><div class="option-list"><div class="option-row"><label class="check"><input type="checkbox" data-path="options.reprise" ${o.reprise?'checked':''}> <b>Reprise sur existant</b></label><input class="input money" type="number" min="0" data-path="options.reprisePrice" value="${o.reprisePrice}"><span>€ HT / chantier</span></div><div class="option-row"><label class="check"><input type="checkbox" data-path="options.access" ${o.access?'checked':''}> <b>Accès difficile</b></label><input class="input money" type="number" min="0" data-path="options.accessPrice" value="${o.accessPrice}"><span>€ HT / chantier</span></div><div class="option-row"><span><b>Complexité générale</b></span><select class="select short" data-path="options.complexity"><option value="" ${!o.complexity?'selected':''}>À choisir</option><option value="simple" ${o.complexity==='simple'?'selected':''}>Simple</option><option value="moyenne" ${o.complexity==='moyenne'?'selected':''}>Moyenne</option><option value="complexe" ${o.complexity==='complexe'?'selected':''}>Complexe</option></select></div></div></div><div class="card"><div class="row between"><div><h2>Extras à prix direct</h2><span class="muted">Aucun temps ni matière automatique n’est inventé.</span></div><button class="btn secondary" data-action="add-extra">+ Ajouter un extra</button></div>${o.extras.map(x=>`<div class="extra-row"><input class="input" data-extra="${x.id}" data-ekey="name" value="${esc(x.name)}"><input class="input" type="number" step="1" min="0" data-extra="${x.id}" data-ekey="qty" value="${val(x.qty)}"><input class="input" type="number" step="1" min="0" data-extra="${x.id}" data-ekey="price" value="${val(x.price)}"><button class="btn danger small" data-action="remove-extra" data-id="${x.id}">×</button></div>`).join('')||`<div class="note">Aucun extra.</div>`}</div>`;
}

function renderResults(){const result=calculate();content.innerHTML=head('Étape 6','Résultat détaillé','Chaque résultat garde sa trace : mur, face, règle, quantité, prix et alerte.')+resultHtml(result);}
function resultHtml(r){
  const status=r.blocking.length?`<div class="alert err"><b>Chiffrage incomplet :</b> ${r.blocking.length} point(s) bloquant(s). Un résultat final ne doit pas être utilisé tant que ces points ne sont pas corrigés.</div>`:`<div class="alert ok"><b>Contrôles métier :</b> aucun blocage détecté dans la démo.</div>`;
  return `${status}${r.blocking.map(x=>`<div class="alert err"><b>${esc(x.code)}</b> — ${esc(x.message)}</div>`).join('')}
  <div class="metrics"><div class="metric"><span>Surface parements</span><strong>${fmt(r.surfaces.cladding)} m²</strong></div><div class="metric"><span>Heures</span><strong>${fmt(r.laborHours)} h</strong></div><div class="metric"><span>${r.blocking.length?'Total partiel HT':'Total HT'}</span><strong>${eur(r.totalHT)}</strong></div><div class="metric"><span>${r.blocking.length?'Total TTC non final':'Total TTC'}</span><strong>${eurMaybe(r.totalTTC,'Non calculé')}</strong></div></div>
  ${r.alerts.map(a=>`<div class="alert warn">${esc(a)}</div>`).join('')}
  <details class="details" open><summary>Surfaces par ouvrage</summary><div class="inside table-wrap"><table class="table"><thead><tr><th>Ouvrage</th><th>Type</th><th>Surface ouvrage</th><th>Parements</th><th>Isolation</th></tr></thead><tbody>${r.wallRows.map(w=>`<tr><td>${esc(w.label)}</td><td>${esc(w.type)}</td><td>${fmt(w.netOne)} m²</td><td>${fmt(w.cladding)} m²</td><td>${w.isolation?fmt(w.netOne)+' m²':'—'}</td></tr>`).join('')}</tbody></table></div></details>
  <details class="details" open><summary>Matériaux et commandes</summary><div class="inside table-wrap"><table class="table"><thead><tr><th>Désignation</th><th>Qté</th><th>Commande</th><th>PU HT</th><th>Total HT</th></tr></thead><tbody>${r.materials.map(m=>`<tr><td>${esc(m.name)}${m.billable===false?'<div class="internal-badge">Coût interne — non refacturé une 2e fois</div>':''}<div class="hint">${esc(m.note||'')}</div></td><td>${fmt(m.qty)} ${esc(m.unit)}</td><td>${esc(m.order||'—')}</td><td>${m.unitPrice!=null?eur(m.unitPrice):'—'}</td><td>${m.total!=null?eur(m.total):'—'}</td></tr>`).join('')}</tbody><tfoot><tr class="total-line"><td colspan="4"><b>TOTAL MATÉRIAUX HT</b></td><td><b>${eur(r.materialTotal)}</b></td></tr>${r.internalMaterialTotal>0?`<tr><td colspan="4"><span class="muted">Coûts internes finition — hors total facturé</span></td><td><span class="muted">${eur(r.internalMaterialTotal)}</span></td></tr>`:''}</tfoot></table></div></details>
  <details class="details" open><summary>Main-d’œuvre</summary><div class="inside">${r.labor.map(x=>`<div class="row between line"><span>${esc(x.name)}</span><b>${fmt(x.hours)} h</b></div>`).join('')}<div class="row between total-line"><b>Total MO</b><b>${eur(r.laborCost)}</b></div></div></details>
  <details class="details" open><summary>Vente / forfaits</summary><div class="inside">${r.sales.map(x=>`<div class="row between line"><span>${esc(x.name)}</span><b>${eur(x.total)}</b></div>`).join('')||'<div class="note">Aucun forfait supplémentaire.</div>'}<div class="row between total-line"><b>Total HT</b><b>${eur(r.totalHT)}</b></div><div class="row between line"><span>TVA</span><b>${eurMaybe(r.vat,'Non calculée')}</b></div><div class="row between total-line"><b>Total TTC</b><b>${eurMaybe(r.totalTTC,'Non calculé')}</b></div></div></details>
  <div class="card"><h2>Balises de connexion</h2><p class="muted">${TRACE.length} événements tracés dans cette session. Chaque sélection de mur et chaque écriture de champ est vérifiée après enregistrement.</p></div>`;
}

function calculate(){
  trace('CALC-START',{pieces:state.pieces.length,simpleWalls:state.simpleWalls.length});trace('CONSUME-GLOBAL',{project:state.project,options:{hourlyRate:state.options.hourlyRate,materialMargin:state.options.materialMargin,complexity:state.options.complexity,finish:state.options.finish,reprise:state.options.reprise,access:state.options.access,extras:state.options.extras.length},catalog:state.catalog});
  const materials=[],sales=[],labor=[],alerts=[],blocking=[],wallRows=[];let cladding=0,ceilingSurface=0,screwCount=0,bandMl=0,compoundKg=0;
  const rawMargin=Number(state.options.materialMargin),rawHourly=Number(state.options.hourlyRate);
  const margin=state.options.materialMargin==null||!Number.isFinite(rawMargin)||rawMargin<0?null:rawMargin/100;
  const hourly=state.options.hourlyRate==null||!Number.isFinite(rawHourly)||rawHourly<=0?null:rawHourly;
  const comp=R.complexity[state.options.complexity];
  const hasActiveWork=allWalls().some(({wall})=>wall.active)||state.pieces.some(p=>p.ceiling?.active);
  if(!hasActiveWork)blocking.push({code:'PLQ-V2-001',message:'Ajoutez au moins un mur ou un plafond actif à chiffrer.'});
  if(comp==null)blocking.push({code:'PLQ-CFG-COMPLEXITE',message:'Choisissez la complexité générale du chantier.'});
  if(margin==null)blocking.push({code:'PLQ-CFG-MARGE',message:'Renseignez la marge matériaux de l’entreprise (0 est autorisé).'});
  if(hourly==null)blocking.push({code:'PLQ-CFG-TAUX',message:'Renseignez un taux horaire HT supérieur à 0.'});
  if(state.project.olderThan2Years==null)blocking.push({code:'PLQ-TVA-CONTEXTE',message:'Choisissez si le logement a plus ou moins de 2 ans.'});
  if(!['aucune','bandes','pret_a_peindre','soignee'].includes(state.options.finish))blocking.push({code:'PLQ-FINISH-CHOICE',message:'Choisissez explicitement le niveau de finition, y compris « Sans finition ».'});
  allWalls().forEach(({wall,height,label})=>{
    ensureWall(wall);if(!wall.active){trace('CALC-WALL-SKIP',{label,reason:'inactive'});return;}
    if(height<=0||wall.length<=0){blocking.push({code:'PLQ-V2-002',message:`${label} : longueur et hauteur doivent être > 0.`});return;}
    if(height>R.heightThresholds.maxAuto)blocking.push({code:'PLQ-V2-011',message:`${label} : hauteur > ${String(R.heightThresholds.maxAuto).replace('.',',')} m, étude spécifique requise.`});
    if(!['cloison','doublage'].includes(wall.type)){blocking.push({code:'PLQ-WALL-TYPE',message:`${label} : choisissez Cloison ou Doublage.`});return;}trace('CONSUME-WALL-CONFIG',{label,wallId:wall.id,type:wall.type,framing:wall.framing,isolation:wall.isolation,face1:wall.face1,face2:wall.type==='cloison'?wall.face2:null,openings:wall.openings.length,reinforcementQty:wall.reinforcementQty,outsideAnglesQty:wall.outsideAnglesQty,cuts:wall.cuts});
    const gross=wall.length*height;for(const o of wall.openings){if(!['porte','fenetre','baie'].includes(o.type))blocking.push({code:'PLQ-OPENING-TYPE',message:`${label} : choisissez le type de chaque ouverture.`});if(!(Number(o.width)>0)||!(Number(o.height)>0)||!(Number(o.qty)>0))blocking.push({code:'PLQ-OPENING-INVALID',message:`${label} : chaque ouverture doit avoir largeur, hauteur et quantité > 0.`});trace('CALC-OPENING',{label,openingId:o.id,type:o.type,width:o.width,height:o.height,qty:o.qty});}const openingArea=openingSurface(wall);if(openingArea>gross)blocking.push({code:'PLQ-V2-003',message:`${label} : les ouvertures dépassent la surface brute.`});
    const net=wallNet(wall,height);if(net<=0)return;
    const faces=wall.type==='cloison'?[wall.face1,wall.face2]:[wall.face1];const wallCladding=net*faces.length;cladding+=wallCladding;wallRows.push({label,type:wall.type==='cloison'?'Cloison':'Doublage',netOne:net,cladding:wallCladding,isolation:wall.isolation.active});
    trace('CALC-WALL',{label,wallId:wall.id,type:wall.type,net,faces:faces.length});
    faces.forEach((face,i)=>{let invalid=false;if(!PLATES[face.plate]){blocking.push({code:'PLQ-CAT-PLAQUE-TYPE',message:`${label} — face ${i+1} : choisissez le type de plaque.`});invalid=true;}if(typeof face.doubleSkin!=='boolean'){blocking.push({code:'PLQ-SKIN-CHOICE',message:`${label} — face ${i+1} : choisissez simple ou double peau.`});invalid=true;}const maxPlateHeight=DEMO_CATALOG.plates.at(-1)?.height??null;if(maxPlateHeight!=null&&height<=maxPlateHeight&&face.manualPlateCount!=null){blocking.push({code:'PLQ-DATA-ORPHAN',message:`${label} — face ${i+1} : quantité manuelle de plaques présente alors que le mur ne dépasse pas le format maximum. Effacez cette valeur.`});invalid=true;}if(invalid)return;const skins=face.doubleSkin?2:1;addWallPlate(materials,blocking,`${label} — Face ${i+1}`,face,net,skins,height,margin);screwCount+=net*(R.screwsWall+(skins===2?R.screwsSecond:0));trace('CALC-FACE',{label,face:i+1,plate:face.plate,skins,manualPlateCount:face.manualPlateCount});});
    addFraming(materials,blocking,alerts,wall,height,label,net,margin);
    addIsolation(materials,sales,alerts,blocking,wall.isolation,net,label,margin,PROFILES[wall.framing.profile]?.width??null,wall.type==='doublage');
    if(wall.reinforcementQty>0){if(!(Number(wall.reinforcementPrice)>0))blocking.push({code:'PLQ-V2-008',message:`${label} : renfort OSB actif sans prix positif.`});else sales.push(saleLine(`Renfort(s) OSB — ${label}`,wall.reinforcementQty*wall.reinforcementPrice,'normal'));}
    if(wall.outsideAnglesQty>0)sales.push(saleLine(`Angles sortants — ${label}`,wall.outsideAnglesQty*height*R.angleOut,'normal'));
    if(height>R.highHeight)sales.push(saleLine(`Grande hauteur > 3,50 m — ${label}`,wallCladding*R.highHeightSale,'normal'));
    if(wall.cuts)sales.push(saleLine(`Nombreuses découpes / spots — ${label}`,wallCladding*R.cutsSale,'normal'));
    let h=0;if(wall.type==='cloison')h=net*R.cloisonLabor;else if(wall.framing.system==='optima')h=net*R.doublageOptimaLabor;else if(wall.framing.system==='classique')h=net*(wall.isolation.active?R.doublageClassicIsoLabor:R.doublageClassicNoIsoLabor);else blocking.push({code:'PLQ-FRAME-SYSTEM',message:`${label} : choisissez le système de doublage Classique ou Optima.`});
    faces.forEach(f=>{if(f.doubleSkin===true)h+=net*R.secondSkinLabor;});
    if(wall.framing.doubledStuds===true)h*=R.doubledStudsLabor;
    if(wall.isolation.active&&wall.isolation.semiRigid)h*=R.semiRigidLabor;
    if(comp==null){h=0;trace('LABOR-BLOCKED-COMPLEXITY',{label});}else h*=comp;labor.push({name:`Pose — ${label}`,hours:h});
    if(state.options.finish&&state.options.finish!=='aucune'){bandMl+=wallCladding*R.finishBandWall;compoundKg+=wallCladding*R.finishCompoundWall;}
  });
  state.pieces.forEach(p=>{
    const c=p.ceiling;if(!c.active)return;ensureCeiling(c);if(!['droit','rampant','rampant_complexe'].includes(c.type)){blocking.push({code:'PLQ-CEILING-TYPE',message:`Plafond ${p.name} : choisissez Droit, Rampant ou Rampant complexe.`});return;}trace('CONSUME-CEILING-CONFIG',{pieceId:p.id,name:p.name,type:c.type,manualArea:c.manualArea,face:c.face,plateFormatHeight:c.plateFormatHeight,hangerLength:c.hangerLength,isolation:c.isolation,cuts:c.cuts});const area=ceilingArea(p);if(!(area>0)){blocking.push({code:'PLQ-CEILING-AREA',message:`Plafond ${p.name} : surface invalide ou manquante.`});return;}ceilingSurface+=area;cladding+=area;wallRows.push({label:`Plafond — ${p.name}`,type:c.type==='droit'?'Plafond droit':c.type==='rampant'?'Rampant':'Rampant complexe',netOne:area,cladding:area,isolation:c.isolation.active});if(!PLATES[c.face.plate])blocking.push({code:'PLQ-CAT-PLAQUE-TYPE',message:`Plafond ${p.name} : choisissez le type de plaque.`});const skins=typeof c.face.doubleSkin==='boolean'?(c.face.doubleSkin?2:1):null;if(skins==null)blocking.push({code:'PLQ-SKIN-CHOICE',message:`Plafond ${p.name} : choisissez simple ou double peau.`});
    if(skins!=null){addCeilingPlate(materials,blocking,p,c,area,skins,margin);screwCount+=area*(R.screwsCeiling+(skins===2?R.screwsSecond:0));}addCeilingFrame(materials,blocking,alerts,p,c,area,margin);addIsolation(materials,sales,alerts,blocking,c.isolation,area,`Plafond — ${p.name}`,margin,null,false);
    let h=area*R.ceilingLabor+(skins===2?area*R.secondSkinLabor:0);if(c.isolation.active&&c.isolation.semiRigid)h*=R.semiRigidLabor;if(comp==null){h=0;trace('LABOR-BLOCKED-COMPLEXITY',{label:`Plafond — ${p.name}`});}else h*=comp;labor.push({name:`Pose plafond — ${p.name}`,hours:h});if(state.options.finish&&state.options.finish!=='aucune'){bandMl+=area*R.finishBandCeiling;compoundKg+=area*R.finishCompoundCeiling;}
    if(c.type==='rampant')sales.push(saleLine(`Plus-value rampant — ${p.name}`,area*R.rampantSale,'normal'));if(c.type==='rampant_complexe')sales.push(saleLine(`Plus-value rampant complexe — ${p.name}`,area*R.rampantComplexSale,'normal'));if(c.cuts)sales.push(saleLine(`Nombreuses découpes / spots — plafond ${p.name}`,area*R.cutsSale,'normal'));
  });
  if(screwCount>0){const units=Math.ceil(screwCount*(1+R.screwsLoss/100)),boxes=Math.ceil(units/R.screwsBox);materials.push({name:'Vis plaques',qty:units,unit:'u',order:`${boxes} boîte(s) de ${R.screwsBox}`,unitPrice:DEMO_CATALOG.screwBox.price/R.screwsBox,total:margin==null?null:boxes*DEMO_CATALOG.screwBox.price*(1+margin),note:'Annexe 5 : boîte 500 vis = 5,80 € HT. Pertes appliquées avant conversion.',vat:vatFor('normal',blocking)});}
  if(bandMl>0){const cat=state.catalog||catalogDefault(),pack=chooseCheapestPackages(bandMl,[{qty:30,price:positive(cat.band30Price)?cat.band30Price:FINISH_CONSUMABLE_CATALOG.band30Price,unit:'m'},{qty:150,price:positive(cat.band150Price)?cat.band150Price:FINISH_CONSUMABLE_CATALOG.band150Price,unit:'m'}]);materials.push({name:'Bandes à joint — coût interne finition',qty:bandMl,unit:'ml',order:`${pack.order} — ${fmt(pack.qty)} ml achetés`,unitPrice:pack.total/bandMl,total:pack.total,billable:false,note:'Catalogue SpeedArti : bandes papier 30 / 150 m, prix publics HT. Coût interne uniquement : le forfait finition 5 / 9 / 13 €/m² est déjà un prix de vente complet.',vat:null});}
  if(compoundKg>0){const cat=state.catalog||catalogDefault(),pack=chooseCheapestPackages(compoundKg,[{qty:5,price:positive(cat.compound5Price)?cat.compound5Price:FINISH_CONSUMABLE_CATALOG.compound5Price,unit:'kg'},{qty:15,price:positive(cat.compound15Price)?cat.compound15Price:FINISH_CONSUMABLE_CATALOG.compound15Price,unit:'kg'},{qty:25,price:positive(cat.compound25Price)?cat.compound25Price:FINISH_CONSUMABLE_CATALOG.compound25Price,unit:'kg'}]);materials.push({name:'Enduit à joint — coût interne finition',qty:compoundKg,unit:'kg',order:`${pack.order} — ${fmt(pack.qty)} kg achetés`,unitPrice:pack.total/compoundKg,total:pack.total,billable:false,note:'Catalogue SpeedArti : enduit à joint 5 / 15 / 25 kg, prix publics HT. Coût interne uniquement : déjà compris dans le forfait finition, sans double facturation.',vat:null});}
  const finish=state.options.finish,finishPrice=R.finishPrices[finish]||0;if(finishPrice>0)sales.push(saleLine(`Finition ${finishLabel(finish)}`,cladding*finishPrice,'normal'));if(['pret_a_peindre','soignee'].includes(finish)&&state.options.impression)sales.push(saleLine('Impression',cladding*R.impression,'normal'));if(state.options.reprise){if(!(Number(state.options.reprisePrice)>0))blocking.push({code:'PLQ-V2-008',message:'Reprise sur existant active sans prix positif.'});else sales.push(saleLine('Reprise sur existant — forfait chantier',Number(state.options.reprisePrice),'normal'));}if(state.options.access){if(!(Number(state.options.accessPrice)>0))blocking.push({code:'PLQ-V2-008',message:'Accès difficile actif sans prix positif.'});else sales.push(saleLine('Accès difficile — forfait chantier',Number(state.options.accessPrice),'normal'));}state.options.extras.forEach(x=>{const name=String(x.name??'').trim(),qty=Number(x.qty),price=Number(x.price),complete=!!name&&Number.isFinite(qty)&&qty>0&&Number.isFinite(price)&&price>0;if(!complete){blocking.push({code:'PLQ-EXTRA-INCOMPLETE',message:'Un extra ajouté est incomplet : renseignez libellé, quantité > 0 et prix HT > 0, ou supprimez la ligne.'});trace('EXTRA-BLOCKED',{id:x.id,name:x.name,qty:x.qty,price:x.price});return;}sales.push(saleLine(name,qty*price,'normal'));trace('EXTRA-CONSUMED',{id:x.id,name,qty,price,total:qty*price});});
  const laborHours=labor.reduce((s,x)=>s+x.hours,0),laborCost=hourly==null?0:laborHours*hourly,materialTotal=materials.reduce((s,x)=>s+(x.billable!==false&&Number.isFinite(x.total)?x.total:0),0),internalMaterialTotal=materials.reduce((s,x)=>s+(x.billable===false&&Number.isFinite(x.total)?x.total:0),0),saleTotal=sales.reduce((s,x)=>s+x.total,0),totalHT=materialTotal+saleTotal+laborCost;
  const laborVat=vatFor('normal',blocking),vatIncomplete=laborVat==null||materials.some(x=>x.billable!==false&&Number.isFinite(x.total)&&x.vat==null)||sales.some(x=>Number.isFinite(x.total)&&x.vat==null);
  const vat=vatIncomplete?null:materials.reduce((sum,x)=>sum+(x.billable!==false&&Number.isFinite(x.total)?x.total*x.vat/100:0),0)+sales.reduce((sum,x)=>sum+(Number.isFinite(x.total)?x.total*x.vat/100:0),0)+laborCost*laborVat/100;
  const totalTTC=vat==null?null:totalHT+vat;
  const result={surfaces:{cladding,ceiling:ceilingSurface},wallRows,materials,materialTotal,internalMaterialTotal,sales,labor,laborHours,laborCost,totalHT,vat,totalTTC,alerts:[...new Set(alerts)],blocking:dedupeBlocking(blocking)};trace('CALC-END',{totalHT,totalTTC,blocking:result.blocking.length,alerts:result.alerts.length});return result;
}
function saleLine(name,total,kind){return {name,total,vat:vatFor(kind,[])};}
function addWallPlate(arr,blocking,label,face,surface,skins,height,margin){
  const plate=PLATES[face.plate];if(!plate){blocking.push({code:'PLQ-CAT-PLAQUE-TYPE',message:`${label} : type de plaque invalide ou absent.`});return;}
  const maxFormat=DEMO_CATALOG.plates.at(-1)||null,loss=R.plateLossWall,required=surface*skins*(1+loss/100);
  if(!maxFormat){blocking.push({code:'PLQ-CAT-PLAQUE',message:`${label} : aucun format de plaque disponible.`});return;}
  const tall=Number(height)>maxFormat.height,format=tall?maxFormat:selectWallPlate(height);
  if(!format){blocking.push({code:'PLQ-CAT-PLAQUE',message:`${label} : aucun format de plaque disponible.`});return;}
  const area=format.width*format.height;let count;
  if(tall){
    const manual=Number(face.manualPlateCount),segments=Math.ceil(Number(height)/maxFormat.height);
    if(!(Number.isInteger(manual)&&manual>0)){blocking.push({code:'PLQ-PLATE-TALL-MANUAL',message:`${label} : mur de ${fmt(height)} m > plaque maxi ${fmt(maxFormat.height)} m. Saisissez le nombre réel de plaques à commander ; aucun calepinage n’est inventé.`});trace('PLATE-TALL-BLOCKED',{label,height,maxPlateHeight:maxFormat.height,segments,manual:face.manualPlateCount});return;}
    count=manual;
    if(count*area+1e-9<required){blocking.push({code:'PLQ-PLATE-MANUAL-LOW',message:`${label} : ${count} plaque(s) ne couvrent pas le besoin de ${fmt(required)} m² incluant ${loss} % de perte.`});trace('PLATE-MANUAL-LOW',{label,count,area,required});return;}
    trace('PLATE-MANUAL-OVERRIDE',{label,count,height,maxPlateHeight:maxFormat.height,segments,required});
  }else count=Math.ceil(required/area);
  const purchased=count*area,basePriceM2=format.price/area,unitPurchaseM2=basePriceM2+plate.surcharge,total=margin==null?null:purchased*unitPurchaseM2*(1+margin);
  arr.push({name:`${plate.label} — ${label}${skins===2?' — double peau':''}`,qty:purchased,unit:'m²',order:`${count} plaque(s) ${format.label}`,unitPrice:margin==null?null:unitPurchaseM2*(1+margin),total,note:tall?`Quantité saisie et validée par l’artisan pour mur > ${fmt(maxFormat.height)} m. Besoin calculé avec perte ${loss} % ; pas de calepinage 2D automatique.`:`Format annexe 5 immédiatement supérieur. Perte ${loss} %. Plus-value type appliquée aux m² réellement achetés.`,vat:vatFor('normal',blocking)});
  trace('MAT-PLATE',{label,type:face.plate,format:format.label,count,purchased,tall,source:tall?'manual_override':'catalogue_rule'});
}
function addCeilingPlate(arr,blocking,p,c,area,skins,margin){const plate=PLATES[c.face.plate];if(!plate){blocking.push({code:'PLQ-CAT-PLAQUE-TYPE',message:`Plafond ${p.name} : type de plaque invalide ou absent.`});return;}const format=DEMO_CATALOG.plates.find(f=>f.height===Number(c.plateFormatHeight));if(!format){blocking.push({code:'PLQ-PLAFOND-PLAQUE',message:`Plafond ${p.name} : choisissez le format commercial de plaque.`});return;}const loss=c.type==='droit'?R.plateLossCeiling:R.plateLossRampant,required=area*skins*(1+loss/100),plateArea=format.width*format.height,count=Math.ceil(required/plateArea),purchased=count*plateArea,basePriceM2=format.price/plateArea,unitPurchaseM2=basePriceM2+plate.surcharge,total=margin==null?null:purchased*unitPurchaseM2*(1+margin);arr.push({name:`${plate.label} — Plafond ${p.name}${skins===2?' — double peau':''}`,qty:purchased,unit:'m²',order:`${count} plaque(s) ${format.label}`,unitPrice:margin==null?null:unitPurchaseM2*(1+margin),total,note:`Perte plafond ${loss} %. Format commercial choisi explicitement par l’artisan.`,vat:vatFor('normal',blocking)});}
function selectWallPlate(height){return DEMO_CATALOG.plates.find(p=>p.height>=height)||DEMO_CATALOG.plates.at(-1)||null;}
function addFraming(arr,blocking,alerts,w,height,label,net,margin){
  if(w.type==='doublage'&&w.framing.system==='optima'){
    const autoRows=suggestRows(height),manual=w.framing.optimaRows!=null&&w.framing.optimaRows!=='';
    const rows=manual?Number(w.framing.optimaRows):autoRows;
    if(!(Number.isInteger(rows)&&rows>=1)){blocking.push({code:'PLQ-OPTIMA-ROWS',message:`${label} : nombre de rangées Optima invalide ; renseignez la hauteur ou une valeur manuelle.`});return;}
    trace('OPTIMA-ROWS',{label,mode:manual?'manuel':'auto',rows,height});
    const furringNeed=net*R.optima.furring*(1+R.frameLoss/100),furringPack=chooseCheapestLinear(furringNeed,DEMO_CATALOG.f530,margin);
    addNeed(arr,`Fourrure F530 Optima — ${label}`,net*R.optima.furring,R.frameLoss,'ml',furringPack,'Annexe 5 F530');
    const cat=state.catalog||catalogDefault(),clipPrice=positive(cat.optimaClipPricePerMl)?cat.optimaClipPricePerMl:OPTIMA_ACCESSORY_CATALOG.optimaClipPricePerMl,supportPrice=positive(cat.optimaSupportPriceEach)?cat.optimaSupportPriceEach:OPTIMA_ACCESSORY_CATALOG.optimaSupportPriceEach;
    addManualUnitNeed(arr,`Lisse Clip Optima — ${label}`,net*R.optima.clip,R.frameLoss,'ml',clipPrice,margin,'Catalogue SpeedArti · prix public HT/ml');
    addManualUnitNeed(arr,`Appuis Optima2 avec clé — ${label}`,net*R.optima.support,R.frameLoss,'u',supportPrice,margin,'Catalogue SpeedArti · appui Optima2 complet (tige + clé) · prix public HT/unité');
    if(!furringPack&&margin!=null)blocking.push({code:'PLQ-CATALOG-PRICE',message:`${label} : impossible de résoudre le conditionnement F530.`});
    return;
  }
  if(w.type==='doublage'&&w.framing.system!=='classique'){blocking.push({code:'PLQ-FRAME-SYSTEM',message:`${label} : choisissez le système de doublage Classique ou Optima.`});return;}
  const profile=PROFILES[w.framing.profile];if(!profile){blocking.push({code:'PLQ-PROFILE',message:`${label} : choisissez un profil d’ossature.`});return;}
  const spacingCm=Number(w.framing.spacingCm);if(![40,60].includes(spacingCm)){blocking.push({code:'PLQ-FRAME-SPACING',message:`${label} : choisissez un entraxe 40 ou 60 cm.`});return;}
  if(typeof w.framing.doubledStuds!=='boolean'){blocking.push({code:'PLQ-FRAME-STUDS',message:`${label} : choisissez montants simples ou doublés.`});return;}
  const spacing=spacingCm/100,openingHoriz=w.openings.reduce((sum,o)=>sum+R.openingHorizontalFactor*(+o.width||0)*(+o.qty||0),0),openingStuds=w.openings.reduce((sum,o)=>sum+R.openingStuds*(+o.qty||0),0),positions=Math.ceil(w.length/spacing)+1,studCount=positions*(w.framing.doubledStuds?2:1)+openingStuds,studsMl=studCount*height,rails=2*w.length+openingHoriz;
  addPackagedLinear(arr,`Rails ${profile.label} — ${label}`,rails,R.frameLoss,profile.rail,margin);
  if(height>profile.stud.length+1e-9){blocking.push({code:'PLQ-FRAME-LENGTH',message:`${label} : les montants ${profile.label} de la démo font ${profile.stud.length} m, insuffisant pour une hauteur de ${fmt(height)} m. Catalogue réel / étude requis.`});}
  else {
    const bars=Math.ceil(studCount*(1+R.frameLoss/100)),purchased=bars*profile.stud.length;
    arr.push({name:`Montants ${profile.label} — ${label}`,qty:purchased,unit:'ml',order:`${bars} barre(s) de ${profile.stud.length} m`,unitPrice:margin==null?null:(profile.stud.price/profile.stud.length)*(1+margin),total:margin==null?null:bars*profile.stud.price*(1+margin),note:`${studCount} montant(s) pleine hauteur (${fmt(studsMl)} ml théoriques) + ${R.frameLoss} % de perte ; une barre entière est requise par montant. Prix annexe 5.`,vat:vatFor('normal',blocking)});
    trace('MAT-STUDS',{label,profile:w.framing.profile,positions,openingStuds,studCount,bars,height});
  }
  alerts.push(...wallTechnicalAlerts(w,height,label).map(x=>x.message));
}
function addCeilingFrame(arr,blocking,alerts,p,c,area,margin){
  if(c.support==='autoportant'){blocking.push({code:'PLQ-CEILING-AUTOPORTANT-STUDY',message:`Plafond ${p.name} : dimensionnement autoportant (portée/profil/entraxe) requis avant chiffrage.`});return;}
  const four=chooseCheapestLinear(area*R.ceiling.furring*(1+R.frameLoss/100),DEMO_CATALOG.f530,margin);addNeed(arr,`Fourrure F47/F530 plafond — ${p.name}`,area*R.ceiling.furring,R.frameLoss,'ml',four,'Annexe 5 / plafond sur fourrures');
  addPackagedLinear(arr,`Cornière CR2 — ${p.name}`,area*R.ceiling.angle,R.frameLoss,DEMO_CATALOG.cr2,margin);
  const drop=Number(c.dropMm),suspNeed=area*R.ceiling.hanger;
  if(c.support==='bois'){
    if(!(drop>0)){blocking.push({code:'PLQ-CEILING-DROP',message:`Plafond ${p.name} : plénum bois manquant.`});}
    else if(drop<=150)addManualUnitNeed(arr,`Suspentes longues F530 bois — ${p.name}`,suspNeed,R.frameLoss,'u',CEILING_FIXING_CATALOG.woodLongEach,margin,'Plénum jusqu’à 150 mm · catalogue SpeedArti');
    else if(drop<=280)addManualUnitNeed(arr,`Suspentes Maxi F530 bois — ${p.name}`,suspNeed,R.frameLoss,'u',CEILING_FIXING_CATALOG.woodMaxiEach,margin,'Plénum jusqu’à 280 mm · catalogue SpeedArti');
    else if(drop<=580)addManualUnitNeed(arr,`Suspentes sécables F530 bois — ${p.name}`,suspNeed,R.frameLoss,'u',CEILING_FIXING_CATALOG.woodSecableEach,margin,'Plénum jusqu’à 580 mm · catalogue SpeedArti');
    else blocking.push({code:'PLQ-CEILING-WOOD-DROP-STUDY',message:`Plafond ${p.name} : plénum bois > 580 mm, étude de suspension spécifique requise.`});
  }else if(c.support==='beton'){
    if(!(drop>20))blocking.push({code:'PLQ-CEILING-DROP',message:`Plafond ${p.name} : dalle béton, plénum > 20 mm requis.`});
    else{
      addManualUnitNeed(arr,`Chevilles M6 béton — ${p.name}`,suspNeed,R.frameLoss,'u',CEILING_FIXING_CATALOG.concreteAnchorEach,margin,'Ancrage tige filetée M6 · catalogue SpeedArti');
      addManualUnitNeed(arr,`Tige filetée M6 — ${p.name}`,suspNeed*(drop/1000),R.frameLoss,'ml',CEILING_FIXING_CATALOG.threadedRodPerM,margin,`Retombée ${fmt(drop)} mm · catalogue SpeedArti`);
      addManualUnitNeed(arr,`Cavaliers F530 — ${p.name}`,suspNeed,R.frameLoss,'u',CEILING_FIXING_CATALOG.cavalierEach,margin,'Système dalle béton Placo · catalogue SpeedArti');
    }
  }else if(c.support==='hourdis'){
    if(!(drop>=40))blocking.push({code:'PLQ-CEILING-DROP',message:`Plafond ${p.name} : suspente H hourdis, plénum minimum 40 mm.`});
    else{
      addManualUnitNeed(arr,`Suspentes H F530 hourdis — ${p.name}`,suspNeed,R.frameLoss,'u',CEILING_FIXING_CATALOG.hourdisHEach,margin,'Support poutrelles-hourdis · catalogue SpeedArti');
      if(drop>40)addManualUnitNeed(arr,`Tige filetée M6 rallonge hourdis — ${p.name}`,suspNeed*((drop-40)/1000),R.frameLoss,'ml',CEILING_FIXING_CATALOG.threadedRodPerM,margin,`Rallonge pour plénum ${fmt(drop)} mm · catalogue SpeedArti`);
      if(drop>1000)blocking.push({code:'PLQ-CEILING-HOURDIS-DROP-STUDY',message:`Plafond ${p.name} : plénum hourdis > 1 m, étude spécifique requise.`});
    }
  }else blocking.push({code:'PLQ-CEILING-SUPPORT',message:`Plafond ${p.name} : support / fixation non choisi.`});
  const cat=state.catalog||catalogDefault(),splicePrice=positive(cat.ceilingSplicePriceEach)?cat.ceilingSplicePriceEach:CEILING_ACCESSORY_CATALOG.ceilingSplicePriceEach,connectorPrice=positive(cat.ceilingConnectorPriceEach)?cat.ceilingConnectorPriceEach:CEILING_ACCESSORY_CATALOG.ceilingConnectorPriceEach;
  addManualUnitNeed(arr,`Éclisses — ${p.name}`,area*R.ceiling.splice,R.frameLoss,'u',splicePrice,margin,'Catalogue SpeedArti · Placo Stil F530 · prix public HT/unité');
  addManualUnitNeed(arr,`Cavaliers / connecteurs — ${p.name}`,area*R.ceiling.connector,R.frameLoss,'u',connectorPrice,margin,'Catalogue SpeedArti · Placo Stil F530 · prix public HT/unité');
  if(!four&&margin!=null)blocking.push({code:'PLQ-CATALOG-PRICE',message:`Plafond ${p.name} : impossible de résoudre le conditionnement des fourrures.`});
}
function addIsolation(arr,sales,alerts,blocking,iso,surface,label,margin,profileWidth,allowMembranes=false){if(!iso?.active||surface<=0)return;const ref=ABAQUE.find(x=>x.id===iso.reference);if(!ref){blocking.push({code:'PLQ-ISO-REF',message:`${label} : isolant couche 1 introuvable.`});return;}const loss=ref.kind==='blown'?R.isoBlownLoss:R.isoLoss,rawPrice=iso.price,price=rawPrice==null||rawPrice===''?NaN:Number(rawPrice),base=price*(iso.semiRigid?R.semiRigidMaterial:1),qty=surface*(1+loss/100);if(!Number.isFinite(price)||price<0)blocking.push({code:'PLQ-ISO-PRICE',message:`${label} : prix isolant couche 1 manquant ou invalide.`});arr.push({name:`Isolation — ${label} — ${ref.nom} ${iso.thickness||ref.epaisseurMm} mm`,qty,unit:'m²',order:`${fmt(qty)} m²`,unitPrice:margin==null?null:base*(1+margin),total:margin==null?null:qty*base*(1+margin),note:`Prix abaque modifiable · perte ${loss} %${iso.semiRigid?' · semi-rigide ×1,20':''}.`,vat:vatFor('isolation',blocking)});if(Number.isFinite(profileWidth)&&profileWidth>0&&(+iso.thickness||ref.epaisseurMm)>profileWidth)alerts.push(`⚠️ ${label} : isolant plus épais que le profil (${profileWidth} mm), sans blocage.`);if(iso.doubleLayer){const ref2=ABAQUE.find(x=>x.id===iso.secondReference);if(!ref2){blocking.push({code:'PLQ-ISO2-REF',message:`${label} : isolant couche 2 introuvable.`});}else{const loss2=ref2.kind==='blown'?R.isoBlownLoss:R.isoLoss,rawPrice2=iso.secondPrice,price2=rawPrice2==null||rawPrice2===''?NaN:Number(rawPrice2),qty2=surface*(1+loss2/100),base2=price2*(iso.semiRigid?R.semiRigidMaterial:1);if(!Number.isFinite(price2)||price2<0)blocking.push({code:'PLQ-ISO2-PRICE',message:`${label} : prix isolant couche 2 manquant ou invalide.`});arr.push({name:`Isolation couche 2 — ${label} — ${ref2.nom}`,qty:qty2,unit:'m²',order:`${fmt(qty2)} m²`,unitPrice:margin==null?null:base2*(1+margin),total:margin==null?null:qty2*base2*(1+margin),note:'Deuxième couche réellement commandée et margée.',vat:vatFor('isolation',blocking)});}const crossedCoef=iso.crossed?R.crossedLabor:1;sales.push(saleLine(`Pose isolation 2 couches${iso.crossed?' croisées':''} — ${label}`,surface*R.secondLayerSale*crossedCoef,'isolation'));trace('ISO-LAYER2-LABOR',{label,surface,baseHtM2:R.secondLayerSale,crossed:!!iso.crossed,coefficient:crossedCoef,total:surface*R.secondLayerSale*crossedCoef});}if((iso.pareVapeur||iso.freinVapeur)&&!allowMembranes){blocking.push({code:'PLQ-MEMBRANE-SCOPE',message:`${label} : membranes non calculées car la portée validée fournie concerne le doublage isolé.`});}else{if(iso.pareVapeur)sales.push(saleLine(`Pare-vapeur — ${label}`,surface*R.pareVapeur,'isolation'));if(iso.freinVapeur)sales.push(saleLine(`Membrane hygrovariable — ${label}`,surface*R.freinVapeur,'isolation'));}}
function addPackagedLinear(arr,name,theoretical,loss,pack,margin){const need=theoretical*(1+loss/100),bars=Math.ceil(need/pack.length),purchased=bars*pack.length;arr.push({name,qty:purchased,unit:'ml',order:`${bars} barre(s) de ${pack.length} m`,unitPrice:margin==null?null:(pack.price/pack.length)*(1+margin),total:margin==null?null:bars*pack.price*(1+margin),note:`Besoin ${fmt(theoretical)} ml + ${loss} % de perte. Prix annexe 5.`,vat:vatFor('normal',[])});}
function addNeed(arr,name,theoretical,loss,unit,packageInfo,note){const qty=theoretical*(1+loss/100);arr.push({name,qty,unit,order:packageInfo?.order||'Catalogue / prix requis',unitPrice:packageInfo?.unitPrice??null,total:packageInfo?.total??null,note:`${note}. Besoin ${fmt(theoretical)} + ${loss} % de perte.`,vat:vatFor('normal',[])});}
function addManualUnitNeed(arr,name,theoretical,loss,unit,purchaseUnitPrice,margin,note){const qty=theoretical*(1+loss/100),p=Number(purchaseUnitPrice),ok=Number.isFinite(p)&&p>0;arr.push({name,qty,unit,order:ok?`${fmt(qty)} ${unit}`:'Catalogue / prix requis',unitPrice:ok&&margin!=null?p*(1+margin):null,total:ok&&margin!=null?qty*p*(1+margin):null,note:`${note}. Besoin ${fmt(theoretical)} + ${loss} % de perte.`,vat:vatFor('normal',[])});trace('CATALOG-MANUAL-PRICE',{name,purchaseUnitPrice:ok?p:null,margin,connected:ok});}
function chooseCheapestLinear(required,packs,margin){if(!packs?.length||margin==null)return null;let best=null;for(let a=0;a<=Math.ceil(required/packs[0].length)+2;a++){for(let b=0;b<=Math.ceil(required/packs[1].length)+2;b++){const qty=a*packs[0].length+b*packs[1].length;if(qty+1e-9<required)continue;const cost=a*packs[0].price+b*packs[1].price;const count=a+b;const candidate={qty,cost,count,a,b};if(!best||cost<best.cost-1e-9||(Math.abs(cost-best.cost)<1e-9&&(qty-required)<(best.qty-required)-1e-9)||(Math.abs(cost-best.cost)<1e-9&&Math.abs((qty-required)-(best.qty-required))<1e-9&&count<best.count))best=candidate;}}if(!best)return null;const parts=[];if(best.a)parts.push(`${best.a}×${packs[0].length} m`);if(best.b)parts.push(`${best.b}×${packs[1].length} m`);return {order:parts.join(' + '),unitPrice:(best.cost/best.qty)*(1+margin),total:best.cost*(1+margin)};}
function chooseCheapestPackages(required,packs){
  if(!(Number(required)>0)||!Array.isArray(packs)||!packs.length||packs.some(p=>!positive(p.price)||!positive(p.qty)))return null;
  const min=Math.min(...packs.map(p=>p.qty)),maxCount=Math.ceil(required/min)+2;let best=null;
  const walk=(i,counts,qty,cost,count)=>{if(i===packs.length){if(qty+1e-9<required)return;const c={counts:[...counts],qty,cost,count,surplus:qty-required};if(!best||c.cost<best.cost-1e-9||(Math.abs(c.cost-best.cost)<1e-9&&c.surplus<best.surplus-1e-9)||(Math.abs(c.cost-best.cost)<1e-9&&Math.abs(c.surplus-best.surplus)<1e-9&&c.count<best.count))best=c;return;}for(let n=0;n<=maxCount;n++){counts[i]=n;walk(i+1,counts,qty+n*packs[i].qty,cost+n*packs[i].price,count+n);}};
  walk(0,[],0,0,0);if(!best)return null;const parts=[];best.counts.forEach((n,i)=>{if(n)parts.push(`${n}×${packs[i].qty} ${packs[i].unit||''}`.trim());});return {order:parts.join(' + '),qty:best.qty,total:best.cost,unitPrice:best.cost/best.qty,count:best.count};
}
function vatFor(kind,blocking){if(state.project.olderThan2Years===false)return 20;if(state.project.olderThan2Years===true)return kind==='isolation'&&state.project.eligibilityConfirmed?5.5:10;return null;}
function finishLabel(k){return ({bandes:'bandes',pret_a_peindre:'prêt à peindre',soignee:'soignée',aucune:'aucune'})[k]||k;}
function dedupeBlocking(list){const seen=new Set();return list.filter(x=>{const k=x.code+'|'+x.message;if(seen.has(k))return false;seen.add(k);return true;});}

/* =========================
   CONNEXIONS UI -> STATE
   ========================= */
function onClick(e){
  const wallHit=e.target.closest('[data-plan-wall]');if(wallHit){if(!checkBinding('special','wall.planSelection',`piece:${wallHit.dataset.pieceid}`))return;selected[wallHit.dataset.pieceid]=wallHit.dataset.planWall;if(selected[wallHit.dataset.pieceid]!==wallHit.dataset.planWall)critical('WALL-SELECT-WRITE','La sélection du mur n’a pas été mémorisée.',{pieceId:wallHit.dataset.pieceid,wanted:wallHit.dataset.planWall,actual:selected[wallHit.dataset.pieceid]});trace('WALL-SELECT',{pieceId:wallHit.dataset.pieceid,wallId:wallHit.dataset.planWall});const resolved=getWallByScope(`piece:${wallHit.dataset.pieceid}:${wallHit.dataset.planWall}`);if(!resolved||resolved.id!==wallHit.dataset.planWall)critical('WALL-SELECT-MISMATCH','Le mur affiché et le mur résolu ne correspondent pas.',{selected:wallHit.dataset.planWall,resolved:resolved?.id});if(content)render();return;}
  const age=e.target.closest('[data-age]');if(age){if(!checkBinding('special','project.olderThan2Years','project'))return;const v=age.dataset.age==='old';state.project.olderThan2Years=v;verifyWrite(state,'project.olderThan2Years',v,'special-age');state.project.eligibilityConfirmed=false;trace('PROJECT-AGE',{olderThan2Years:v});save();if(content)render();return;}
  const finish=e.target.closest('[data-finish]');if(finish){if(!checkBinding('special','options.finish','options'))return;const v=finish.dataset.finish;state.options.finish=v;verifyWrite(state,'options.finish',v,'special-finish');if(!['pret_a_peindre','soignee'].includes(state.options.finish))state.options.impression=false;trace('FINISH',{finish:state.options.finish});save();if(content)render();return;}
  const a=e.target.closest('[data-action]');if(!a)return;const action=a.dataset.action;if(!KNOWN_ACTIONS.has(action)){critical('ACTION-UNKNOWN','Bouton sans action déclarée.',{action});return;}trace('ACTION',{action});if(action==='add-piece')state.pieces.push(makePiece(state.pieces.length+1));if(action==='remove-piece')state.pieces=state.pieces.filter(x=>x.id!==a.dataset.id);if(action==='add-simple')state.simpleWalls.push(makeSimpleWall(state.simpleWalls.length+1));if(action==='remove-simple')state.simpleWalls=state.simpleWalls.filter(x=>x.id!==a.dataset.id);if(action==='add-opening'){const w=getWallByScope(a.dataset.scope);if(!w){critical('OPENING-WALL-NOT-FOUND','Impossible de rattacher l’ouverture au mur.',{scope:a.dataset.scope});return;}w.openings.push({id:uid(),type:null,width:null,height:null,qty:null});trace('OPENING-ADD',{scope:a.dataset.scope,wallId:w.id});}if(action==='remove-opening'){const w=getWallByScope(a.dataset.scope);if(w)w.openings=w.openings.filter(x=>x.id!==a.dataset.openid);}if(action==='add-extra')state.options.extras.push({id:uid(),name:'',qty:null,price:null});if(action==='remove-extra')state.options.extras=state.options.extras.filter(x=>x.id!==a.dataset.id);trace('ACTION-POST',{action,pieces:state.pieces.length,simpleWalls:state.simpleWalls.length,extras:state.options.extras.length});save();if(content)render();
}
function onInput(e){
  const t=e.target,isCommit=e.type==='change';
  if(t.dataset.path){if(!checkBinding('global',t.dataset.path,'global'))return;const v=valueOf(t);setPath(state,t.dataset.path,v);verifyWrite(state,t.dataset.path,v,'global');save();if(isCommit&&t.dataset.path==='project.eligibilityConfirmed'&&content)render();return;}
  if(t.dataset.piece){if(!checkBinding('piece',t.dataset.pkey,`piece:${t.dataset.piece}`))return;const p=state.pieces.find(x=>x.id===t.dataset.piece);if(!p){critical('PIECE-NOT-FOUND','Pièce introuvable lors de la saisie.',{id:t.dataset.piece});return;}const v=valueOf(t);setPath(p,t.dataset.pkey,v);verifyWrite(p,t.dataset.pkey,v,`piece:${p.id}`);if(['shape','shapeA','shapeB','length','width'].includes(t.dataset.pkey))syncPieceWalls(p);if(t.dataset.pkey==='height'){syncPieceWalls(p);p.walls.forEach(w=>clearManualPlateCountsIfNotTall(w,p.height,'piece-height-change'));}save();if(step===1&&content)updatePiecePreview(p.id);if(isCommit&&step===1&&content&&(t.dataset.pkey==='shape'||t.dataset.pkey==='ceiling.active'))render();return;}
  if(t.dataset.simple){if(!checkBinding('simple',t.dataset.skey,`simple:${t.dataset.simple}`))return;const w=state.simpleWalls.find(x=>x.id===t.dataset.simple);if(!w){critical('SIMPLE-WALL-NOT-FOUND','Mur simple introuvable.',{id:t.dataset.simple});return;}const v=valueOf(t);setPath(w,t.dataset.skey,v);verifyWrite(w,t.dataset.skey,v,`simple:${w.id}`);save();return;}
  if(t.dataset.wall){
    if(!checkBinding('wall',t.dataset.wkey,t.dataset.wall))return;
    const w=getWallByScope(t.dataset.wall);if(!w){critical('WALL-NOT-FOUND','Mur introuvable lors de la saisie.',{scope:t.dataset.wall});return;}
    const otherWalls=snapshotOtherWalls(w),resolvedId=w.id,v=valueOf(t);
    setPath(w,t.dataset.wkey,v);verifyWrite(w,t.dataset.wkey,v,`${t.dataset.wall}/resolved:${resolvedId}`);if(t.dataset.wkey==='height')clearManualPlateCountsIfNotTall(w,v,'simple-wall-height-change');
    trace('WALL-WRITE',{scope:t.dataset.wall,resolvedWallId:resolvedId,path:t.dataset.wkey,value:v});
    if(t.dataset.wkey==='framing.system'&&v==='optima'){w.framing.profile=null;w.framing.spacingCm=null;w.framing.doubledStuds=null;trace('FRAMING-CLEAN',{wallId:w.id,reason:'optima',cleared:['profile','spacingCm','doubledStuds']});}
    if(t.dataset.wkey==='type'&&v==='cloison'&&w.framing.system!=null){w.framing.system=null;w.framing.optimaRows=null;trace('FRAMING-CLEAN',{wallId:w.id,reason:'cloison',cleared:['system','optimaRows']});}if(t.dataset.wkey==='type'&&v==='cloison'){if(!w.framing.profile)w.framing.profile='M48';if(![40,60].includes(Number(w.framing.spacingCm)))w.framing.spacingCm=60;if(typeof w.framing.doubledStuds!=='boolean')w.framing.doubledStuds=false;trace('FRAMING-DEFAULT',{wallId:w.id,profile:w.framing.profile,spacingCm:w.framing.spacingCm,doubledStuds:w.framing.doubledStuds});}if(t.dataset.wkey==='type'&&v!=='doublage'&&(w.isolation.pareVapeur||w.isolation.freinVapeur)){w.isolation.pareVapeur=false;w.isolation.freinVapeur=false;trace('MEMBRANE-SCOPE-CLEAR',{wallId:w.id,reason:'membranes-only-doublage'});}
    if(['isolation.reference','isolation.thickness','isolation.doubleLayer','isolation.secondReference','isolation.semiRigid'].includes(t.dataset.wkey)&&t.dataset.wkey!=='isolation.validated')w.isolation.validated=false;
    if(t.dataset.wkey==='isolation.reference'){const ref=ABAQUE.find(x=>x.id===t.value);if(ref){w.isolation.price=ref.prixAchatHtM2;w.isolation.thickness=ref.epaisseurMm;if(!w.isolation.secondReference){w.isolation.secondReference=ref.id;w.isolation.secondPrice=ref.prixAchatHtM2;}}}
    if(t.dataset.wkey==='isolation.secondReference'){const ref=ABAQUE.find(x=>x.id===t.value);if(ref)w.isolation.secondPrice=ref.prixAchatHtM2;}
    if(t.dataset.wkey==='isolation.active'&&w.isolation.active&&!w.isolation.reference)applyWallIsolationSuggestion(w,'activation');
    if(['type','framing.profile'].includes(t.dataset.wkey)&&w.isolation.active&&!w.isolation.reference)applyWallIsolationSuggestion(w,t.dataset.wkey);
    verifyNoOtherWallChanged(otherWalls,w,`${t.dataset.wall}/${t.dataset.wkey}`);save();if(step===2&&content&&['height','type','framing.profile','framing.spacingCm','framing.doubledStuds','face1.doubleSkin','face2.doubleSkin'].includes(t.dataset.wkey))updateWallTechnicalAlert(t.dataset.wall,w);if(isCommit&&step===2&&content)render();return;
  }
  if(t.dataset.open){
    if(!checkBinding('opening',t.dataset.okey,t.dataset.scope))return;
    const w=getWallByScope(t.dataset.scope),o=w?.openings.find(x=>x.id===t.dataset.open);if(!o){critical('OPENING-NOT-FOUND','Ouverture introuvable lors de la saisie.',{scope:t.dataset.scope,id:t.dataset.open});return;}
    const otherWalls=snapshotOtherWalls(w),v=valueOf(t);o[t.dataset.okey]=v;verifyWrite(o,t.dataset.okey,v,`${t.dataset.scope}/opening:${o.id}`);
    trace('OPENING-WRITE',{wallId:w.id,openingId:o.id,path:t.dataset.okey,value:v});verifyNoOtherWallChanged(otherWalls,w,`${t.dataset.scope}/opening:${o.id}/${t.dataset.okey}`);save();if(isCommit&&step===2&&content)render();return;
  }
  if(t.dataset.ceiling){
    if(!checkBinding('ceiling',t.dataset.ckey,`ceiling:${t.dataset.ceiling}`))return;
    const p=state.pieces.find(x=>x.id===t.dataset.ceiling);if(!p){critical('CEILING-PIECE-NOT-FOUND','Pièce du plafond introuvable.',{id:t.dataset.ceiling});return;}
    ensureCeiling(p.ceiling);const otherCeilings=snapshotOtherCeilings(p),v=valueOf(t);setPath(p.ceiling,t.dataset.ckey,v);verifyWrite(p.ceiling,t.dataset.ckey,v,`ceiling:${p.id}`);
    if(['isolation.reference','isolation.thickness','isolation.doubleLayer','isolation.secondReference','isolation.semiRigid'].includes(t.dataset.ckey)&&t.dataset.ckey!=='isolation.validated')p.ceiling.isolation.validated=false;
    if(t.dataset.ckey==='isolation.reference'){const ref=ABAQUE.find(x=>x.id===t.value);if(ref){p.ceiling.isolation.price=ref.prixAchatHtM2;p.ceiling.isolation.thickness=ref.epaisseurMm;if(!p.ceiling.isolation.secondReference){p.ceiling.isolation.secondReference=ref.id;p.ceiling.isolation.secondPrice=ref.prixAchatHtM2;}}}
    if(t.dataset.ckey==='isolation.secondReference'){const ref=ABAQUE.find(x=>x.id===t.value);if(ref)p.ceiling.isolation.secondPrice=ref.prixAchatHtM2;}
    if(t.dataset.ckey==='isolation.active'&&p.ceiling.isolation.active&&!p.ceiling.isolation.reference)applyCeilingIsolationSuggestion(p.ceiling,'activation');
    verifyNoOtherCeilingChanged(otherCeilings,p,`ceiling:${p.id}/${t.dataset.ckey}`);save();if(isCommit&&step===3&&content)render();return;
  }
  if(t.dataset.extra){if(!checkBinding('extra',t.dataset.ekey,`extra:${t.dataset.extra}`))return;const x=state.options.extras.find(y=>y.id===t.dataset.extra);if(!x){critical('EXTRA-NOT-FOUND','Extra introuvable.',{id:t.dataset.extra});return;}const v=valueOf(t);x[t.dataset.ekey]=v;verifyWrite(x,t.dataset.ekey,v,`extra:${x.id}`);trace('EXTRA-WRITE',{id:x.id,path:t.dataset.ekey,value:v});save();return;}
}

function allWalls(){const out=[];state.pieces.forEach(p=>{syncPieceWalls(p);p.walls.forEach(w=>out.push({wall:w,height:+p.height||0,label:`${p.name} — ${w.label}`}));});state.simpleWalls.forEach(w=>{ensureWall(w);out.push({wall:w,height:+w.height||0,label:w.label});});return out;}
function normalizePieceShape(p){if(!['rectangle','L','T','U'].includes(p.shape))p.shape='rectangle';if(p.shapeA===undefined)p.shapeA=null;if(p.shapeB===undefined)p.shapeB=null;return p;}
function piecePolygon(p){
  normalizePieceShape(p);
  const L=Number(p.length),W=Number(p.width),A=Number(p.shapeA),B=Number(p.shapeB);
  const rect=[[0,0],[Math.max(0,L||0),0],[Math.max(0,L||0),Math.max(0,W||0)],[0,Math.max(0,W||0)]];
  if(!(L>0&&W>0)||p.shape==='rectangle')return rect;
  if(!(A>0&&B>0&&A<L&&B<W))return rect;
  if(p.shape==='L')return [[0,0],[L,0],[L,W-B],[L-A,W-B],[L-A,W],[0,W]];
  if(p.shape==='T'){const x1=(L-A)/2,x2=(L+A)/2;return [[0,0],[L,0],[L,B],[x2,B],[x2,W],[x1,W],[x1,B],[0,B]];}
  if(p.shape==='U'){const side=(L-A)/2;return [[0,0],[L,0],[L,W],[L-side,W],[L-side,W-B],[side,W-B],[side,W],[0,W]];}
  return rect;
}
function pieceSegments(p){
  const pts=piecePolygon(p),ids='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return pts.map((pt,i)=>{const next=pts[(i+1)%pts.length],length=Math.hypot(next[0]-pt[0],next[1]-pt[1]);return {id:ids[i],label:p.shape==='rectangle'?['Mur A (face)','Mur B (droite)','Mur C (fond)','Mur D (gauche)'][i]:`Mur ${ids[i]}`,length,from:pt,to:next};});
}
function pieceFloorArea(p){const pts=piecePolygon(p);let s=0;for(let i=0;i<pts.length;i++){const [x1,y1]=pts[i],[x2,y2]=pts[(i+1)%pts.length];s+=x1*y2-x2*y1;}return Math.abs(s)/2;}
function piecePreviewModel(p){
  const pts=piecePolygon(p),L=Math.max(.1,Number(p.length)||.1),W=Math.max(.1,Number(p.width)||.1),scale=Math.min(360/L,150/W);
  return {pts,L,W,scale,drawnWidth:L*scale,drawnHeight:W*scale};
}
function piecePreviewSvg(p){
  const model=piecePreviewModel(p),viewW=420,viewH=210,x=(viewW-model.drawnWidth)/2,y=(viewH-model.drawnHeight)/2;
  const screen=model.pts.map(([px,py])=>[x+px*model.scale,y+py*model.scale]),polygon=screen.map(([px,py])=>`${px},${py}`).join(' ');
  const valid=Number(p.length)>0&&Number(p.width)>0;
  const dims=p.shape==='rectangle'
    ?`${fmt(p.length)} × ${fmt(p.width)} m`
    :`${fmt(p.length)} × ${fmt(p.width)} m · A ${fmt(p.shapeA)} · B ${fmt(p.shapeB)}`;
  return `<svg viewBox="0 0 ${viewW} ${viewH}" role="img" aria-label="Aperçu dynamique de la pièce"><polygon points="${polygon}" fill="#fff" stroke="#2563eb" stroke-width="4"/><text x="${viewW/2}" y="18" text-anchor="middle" font-size="12" font-weight="700">${valid?esc(String(p.shape||'rectangle').toUpperCase())+' · '+esc(dims):'Renseignez les dimensions'}</text><text x="${viewW/2}" y="${viewH-8}" text-anchor="middle" font-size="12">${valid?'Surface '+fmt(pieceFloorArea(p))+' m²':''}</text></svg>`;
}
function piecePreviewMarkup(p){
  return `<div class="piece-preview-panel"><div class="piece-preview-title"><b>Aperçu de la pièce</b><span data-piece-meta="${p.id}">${p.walls.length} murs · ${fmt(pieceFloorArea(p))} m²</span></div><div class="piece-preview" data-piece-preview="${p.id}">${piecePreviewSvg(p)}</div></div>`;
}
function updatePiecePreview(pieceId){
  if(!content)return;
  const p=state.pieces.find(x=>x.id===pieceId);if(!p)return;
  const box=content.querySelector(`[data-piece-preview="${pieceId}"]`),meta=content.querySelector(`[data-piece-meta="${pieceId}"]`);
  if(box)box.innerHTML=piecePreviewSvg(p);
  if(meta)meta.textContent=`${p.walls.length} murs · ${fmt(pieceFloorArea(p))} m²`;
}
function syncPieceWalls(p){normalizePieceShape(p);const specs=pieceSegments(p),old=new Map((p.walls||[]).map(w=>[w.id,w]));p.walls=specs.map(spec=>{const w=old.get(spec.id)||wallBase(spec.id,spec.label,spec.length);w.label=spec.label;w.length=spec.length;return ensureWall(w);});if(!p.ceiling)p.ceiling=ceilingDefault();ensureCeiling(p.ceiling);}
function ensureWall(w){if(!w.framing)w.framing=framingDefault();if(w.framing.profile==='48/50')w.framing.profile='M48';if(w.framing.profile==='72/50')w.framing.profile='M70';if(w.framing.profile==='100/50')w.framing.profile='M100';if(!w.face1)w.face1=faceDefault();if(!w.face2)w.face2=faceDefault();if(w.face1.manualPlateCount===undefined)w.face1.manualPlateCount=null;if(w.face2.manualPlateCount===undefined)w.face2.manualPlateCount=null;if(!w.isolation)w.isolation=isoDefault();if(w.isolation.secondPrice===undefined){const r=ABAQUE.find(x=>x.id===w.isolation.secondReference);w.isolation.secondPrice=r?.prixAchatHtM2??null;}if(!w.openings)w.openings=[];if(w.reinforcementPrice==null)w.reinforcementPrice=R.reinforcement;if(w.outsideAnglesQty==null)w.outsideAnglesQty=0;if(w.cuts==null)w.cuts=false;return w;}
function ensureCeiling(c){if(!c.face)c.face=faceDefault();if(!c.isolation)c.isolation=isoDefault();if(c.isolation.secondPrice===undefined){const r=ABAQUE.find(x=>x.id===c.isolation.secondReference);c.isolation.secondPrice=r?.prixAchatHtM2??null;}if(c.support===undefined)c.support=null;if(c.dropMm===undefined)c.dropMm=null;if(c.hangerLength===undefined)c.hangerLength=null;if(c.plateFormatHeight===undefined)c.plateFormatHeight=null;if(c.cuts==null)c.cuts=false;return c;}
function clearManualPlateCountsIfNotTall(w,height,reason){
  const maxHeight=DEMO_CATALOG.plates.at(-1)?.height??null;if(maxHeight==null||!(Number(height)>0)||Number(height)>maxHeight)return;
  ['face1','face2'].forEach(key=>{if(w[key]?.manualPlateCount!=null){trace('PLATE-MANUAL-CLEAR',{wallId:w.id,face:key,old:w[key].manualPlateCount,height,reason});w[key].manualPlateCount=null;}});
}

function getWallByScope(scope){const [kind,id,directWallId]=String(scope||'').split(':');if(kind==='piece'){const p=state.pieces.find(x=>x.id===id);if(!p){critical('SCOPE-PIECE-MISSING','Scope de pièce introuvable.',{scope});return null;}const wanted=directWallId||selected[id]||null;if(!wanted){critical('SCOPE-WALL-UNSELECTED','Aucun identifiant de mur explicite ni sélection courante : aucune cible par défaut n’est utilisée.',{scope,pieceId:id});return null;}const wall=p.walls.find(w=>w.id===wanted)||null;trace('WALL-RESOLVE',{scope,directWallId:directWallId||null,selected:selected[id]||null,wanted,resolved:wall?.id});if(!wall){critical('WALL-RESOLVE-MISSING','Le mur demandé n’existe pas dans cette pièce.',{scope,wanted,available:p.walls.map(w=>w.id)});return null;}if(wall.id!==wanted)critical('WALL-RESOLVE-MISMATCH','Le résolveur de mur a retourné un autre mur.',{scope,wanted,resolved:wall.id});return wall;}if(kind==='simple'){const wall=state.simpleWalls.find(w=>w.id===id)||null;trace('WALL-RESOLVE',{scope,wanted:id,resolved:wall?.id});return wall;}critical('SCOPE-INVALID','Scope de mur invalide.',{scope});return null;}
function openingSurface(w){return w.openings.reduce((s,o)=>s+Math.max(0,+o.width||0)*Math.max(0,+o.height||0)*Math.max(0,+o.qty||0),0);}
function wallNet(w,height){return Math.max(0,Math.max(0,+w.length||0)*Math.max(0,+height||0)-openingSurface(w));}
function ceilingArea(p){if(p.ceiling.type==='droit')return pieceFloorArea(p);if(['rampant','rampant_complexe'].includes(p.ceiling.type))return Math.max(0,+p.ceiling.manualArea||0);return 0;}
function suggestRows(h){const n=Number(h);if(!(n>0))return null;return API.getSuggestedOptimaRows?API.getSuggestedOptimaRows(n):Math.max(1,Math.ceil(n/1.35)-1);}
function planSvg(p,sel){
  const pts=piecePolygon(p),L=Math.max(.1,+p.length||.1),W=Math.max(.1,+p.width||.1),scale=Math.min(420/L,220/W),x=(520-L*scale)/2,y=(310-W*scale)/2;
  const screen=pts.map(([px,py])=>[x+px*scale,y+py*scale]),polygon=screen.map(([px,py])=>`${px},${py}`).join(' ');
  let lines='';p.walls.forEach((w,i)=>{const a=screen[i],b=screen[(i+1)%screen.length],c=[a[0],a[1],b[0],b[1]],cl=!w.active?'wall-off':w.type==='cloison'?'wall-cloison':w.type==='doublage'?'wall-doublage':'wall-null',mid=[(c[0]+c[2])/2,(c[1]+c[3])/2];lines+=`<g data-plan-wall="${w.id}" data-pieceid="${p.id}" class="${sel===w.id?'selected-wall':''}"><line class="wall-hit" x1="${c[0]}" y1="${c[1]}" x2="${c[2]}" y2="${c[3]}"></line><line class="wall-line ${cl}" x1="${c[0]}" y1="${c[1]}" x2="${c[2]}" y2="${c[3]}"></line><text class="wall-label" x="${mid[0]}" y="${mid[1]-8}" text-anchor="middle">${w.id}</text>${openingSvg(w,c)}</g>`;});
  return `<svg viewBox="0 0 520 310"><polygon points="${polygon}" fill="#fff" stroke="#cbd5e1"/>${lines}<text x="260" y="22" text-anchor="middle" font-size="12">Forme ${esc(String(p.shape||'rectangle').toUpperCase())} · ${fmt(pieceFloorArea(p))} m²</text><text x="260" y="295" text-anchor="middle" font-size="12">H : ${fmt(p.height)} m</text></svg>`;
}
function openingSvg(w,c){const os=w.openings.filter(o=>Number(o.width)>0&&Number(o.qty)>0).flatMap(o=>Array.from({length:Math.min(8,Math.floor(Number(o.qty)))},()=>o));if(!os.length)return'';const horiz=Math.abs(c[2]-c[0])>0,len=Math.hypot(c[2]-c[0],c[3]-c[1]),wallLength=Number(w.length);if(!(wallLength>0))return'';return os.map((o,i)=>{const t=(i+1)/(os.length+1),cx=c[0]+(c[2]-c[0])*t,cy=c[1]+(c[3]-c[1])*t,ww=Math.max(15,Math.min(len*.25,Number(o.width)/wallLength*len)),klass=o.type==='porte'?'opening-door':'opening-window';return horiz?`<line class="${klass}" x1="${cx-ww/2}" y1="${cy}" x2="${cx+ww/2}" y2="${cy}"/>`:`<line class="${klass}" x1="${cx}" y1="${cy-ww/2}" x2="${cx}" y2="${cy+ww/2}"/>`;}).join('');}
function valueOf(t){if(t.type==='checkbox')return t.checked;if(t.type==='number')return t.value===''?null:+t.value;if(t.value==='true')return true;if(t.value==='false')return false;if((t.tagName==='SELECT'||t.select===true)&&t.value==='')return null;return t.value;}
function setPath(obj,path,value){const ps=path.split('.');let x=obj;for(let i=0;i<ps.length-1;i++)x=x[ps[i]]||(x[ps[i]]={});x[ps.at(-1)]=value;}
function getPath(obj,path){return path.split('.').reduce((x,k)=>x?.[k],obj);}
function val(v){return v==null?'':v;}
function fmt(n){return Number(n||0).toLocaleString('fr-FR',{maximumFractionDigits:2});}
function eur(n){return Number(n||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});}function eurMaybe(n,label='Non calculé'){return n==null||!Number.isFinite(Number(n))?label:eur(n);}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(msg){if(typeof document==='undefined')return;const e=document.createElement('div');e.className='alert ok toast';e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),1600);}

/* =========================
   AUTO-TESTS DE CONNEXION
   ========================= */
function runIntegrityTests(){
  const savedState=state,savedSelected=selected;const results=[];INTEGRITY_TEST_RUNNING=true;
  const assert=(cond,msg)=>{if(!cond)throw new Error(msg);};
  const fresh=()=>{state=createInitial();selected={};return state.pieces[0];};
  const validOneWall=(type='cloison')=>{const p=fresh();p.length=5;p.width=4;p.height=2.5;syncPieceWalls(p);p.walls.forEach(w=>w.active=false);const w=p.walls[0];w.active=true;w.type=type;w.framing.profile='M48';w.framing.spacingCm=60;w.framing.doubledStuds=false;w.framing.system=type==='doublage'?'classique':null;w.face1.plate='BA13';w.face1.doubleSkin=false;w.face2.plate='BA13';w.face2.doubleSkin=false;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';return {p,w};};
  const test=(name,fn)=>{try{fresh();fn();results.push({name,ok:true});trace('TEST-PASS',{name});}catch(err){results.push({name,ok:false,error:err.message});trace('TEST-FAIL',{name,error:err.message});}};
  const fakeCheckbox=(dataset,checked=true,type='change')=>({type,target:{dataset,type:'checkbox',checked,value:checked?'on':''}});
  const fakeControl=(dataset,value,kind='text')=>({type:'change',target:{dataset,type:kind==='checkbox'?'checkbox':kind==='number'?'number':'text',checked:kind==='checkbox'?!!value:false,value:kind==='checkbox'?(value?'on':''):String(value??''),tagName:kind==='select'?'SELECT':'INPUT',select:kind==='select'}});
  const fakePlanClick=(pieceId,wallId)=>({target:{closest:(selector)=>selector==='[data-plan-wall]'?{dataset:{pieceid:pieceId,planWall:wallId}}:null}});
  const fakeAction=(action,dataset={})=>({target:{closest:(selector)=>selector==='[data-action]'?{dataset:{action,...dataset}}:null}});
  try{
    test('T01 — 4 murs stables A/B/C/D',()=>{const p=state.pieces[0];assert(p.walls.map(w=>w.id).join(',')==='A,B,C,D','IDs murs invalides');});
    ['A','B','C','D'].forEach((id,i)=>test(`T0${i+2} — résolution exacte Mur ${id}`,()=>{const p=state.pieces[0];selected[p.id]=id;assert(getWallByScope(`piece:${p.id}`).id===id,`Mur ${id} mal résolu`);}));
    test('T06 — scope direct B prioritaire même si sélection globale A',()=>{const p=state.pieces[0];selected[p.id]='A';assert(getWallByScope(`piece:${p.id}:B`).id==='B','Scope direct B non prioritaire');});
    test('T07 — vraie connexion checkbox Mur B écrit uniquement dans B',()=>{const p=state.pieces[0],a=p.walls[0],b=p.walls[1];selected[p.id]='B';onInput(fakeCheckbox({wall:`piece:${p.id}:B`,wkey:'isolation.active'},true));assert(b.isolation.active===true,'B non modifié');assert(a.isolation.active===false,'A contaminé');});
    test('T08 — après B→C une checkbox C reste cliquable et indépendante',()=>{const p=state.pieces[0],b=p.walls[1],c=p.walls[2];selected[p.id]='B';onInput(fakeCheckbox({wall:`piece:${p.id}:B`,wkey:'cuts'},true));selected[p.id]='C';onInput(fakeCheckbox({wall:`piece:${p.id}:C`,wkey:'cuts'},true));assert(b.cuts===true&&c.cuts===true,'B ou C n’a pas enregistré la case');assert(p.walls[0].cuts===false,'A contaminé');});
    test('T09 — plaque Mur C indépendante',()=>{const p=state.pieces[0];p.walls[2].face1.plate='hydro';assert(p.walls[2].face1.plate==='hydro'&&p.walls[0].face1.plate==='BA13','Plaques liées entre murs');});
    test('T10 — double peau Face 1/Face 2 indépendante',()=>{const d=state.pieces[0].walls[3];d.face1.doubleSkin=true;assert(d.face1.doubleSkin&&!d.face2.doubleSkin,'Peaux liées à tort');});
    test('T11 — ouverture rattachée au seul mur ciblé',()=>{const p=state.pieces[0],b=p.walls[1];selected[p.id]='A';const w=getWallByScope(`piece:${p.id}:B`);w.openings.push({id:'o',type:'porte',width:1,height:2,qty:1});assert(b.openings.length===1&&p.walls[0].openings.length===0,'Ouverture rattachée au mauvais mur');});
    test('T12 — mur simple résolu par son propre ID',()=>{const s=makeSimpleWall(1);state.simpleWalls.push(s);assert(getWallByScope(`simple:${s.id}`).id===s.id,'Mur simple mal résolu');});
    test('T13 — changement dimensions conserve les IDs et réglages murs',()=>{const p=state.pieces[0];p.walls[1].face1.plate='phonique';p.length=7;p.width=3;syncPieceWalls(p);assert(p.walls.map(w=>w.id).join(',')==='A,B,C,D','IDs recréés');assert(p.walls[1].face1.plate==='phonique','Réglage B perdu');assert(p.walls[0].length===7&&p.walls[1].length===3,'Longueurs non synchronisées');});
    test('T14 — mur inactif exclu du résultat',()=>{const {p,w}=validOneWall('cloison');const r=calculate();assert(r.wallRows.length===1&&r.wallRows[0].label.includes('Mur A'),'Mur inactif encore calculé');});
    test('T15 — cloison = 2 faces nettes',()=>{const {w}=validOneWall('cloison');const r=calculate(),row=r.wallRows[0];assert(Math.abs(row.cladding-row.netOne*2)<1e-9,'Cloison != 2 faces');});
    test('T16 — doublage = 1 face nette',()=>{validOneWall('doublage');const r=calculate(),row=r.wallRows[0];assert(Math.abs(row.cladding-row.netOne)<1e-9,'Doublage != 1 face');});
    test('T17 — aucune répartition 60/40 : doublage reste 100 % doublage',()=>{validOneWall('doublage');const r=calculate();assert(r.wallRows.length===1&&r.wallRows[0].type==='Doublage','Type réel perdu');assert(!r.materials.some(m=>/cloison/i.test(m.name)),'Matériau cloison inventé');});
    test('T18 — ouverture déduite de la surface',()=>{const {p,w}=validOneWall('doublage');w.openings=[{id:'o',type:'porte',width:1,height:2,qty:1}];assert(Math.abs(wallNet(w,p.height)-(w.length*p.height-2))<1e-9,'Ouverture non déduite');});
    test('T19 — ouverture ajoute 4 montants + 2× largeur',()=>{const {w}=validOneWall('cloison');w.openings=[{id:'o',type:'fenetre',width:1.2,height:1.1,qty:1}];const horiz=w.openings.reduce((s,o)=>s+R.openingHorizontalFactor*o.width*o.qty,0),studs=w.openings.reduce((s,o)=>s+R.openingStuds*o.qty,0);assert(studs===4&&Math.abs(horiz-2.4)<1e-9,'Ossature périphérique incorrecte');});
    test('T20 — aucun ouvrage actif = blocage PLQ-V2-001',()=>{const p=fresh();p.walls.forEach(w=>w.active=false);p.ceiling.active=false;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-V2-001'),'Blocage ouvrage absent manquant');});
    test('T21 — type mur non choisi bloque le calcul',()=>{const {w}=validOneWall('cloison');w.type=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-WALL-TYPE'),'Type non choisi non bloqué');});
    test('T22 — ouverture invalide bloque le calcul',()=>{const {w}=validOneWall('doublage');w.openings=[{id:'o',type:'porte',width:0,height:2,qty:1}];const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-OPENING-INVALID'),'Ouverture invalide non bloquée');});
    test('T23 — isolation choisie ne demande plus de validation artisan',()=>{const {w}=validOneWall('doublage');w.framing.profile='M70';w.isolation.active=true;applyWallIsolationSuggestion(w,'test');const r=calculate();assert(!r.blocking.some(x=>x.code==='PLQ-ISO-VALIDATION'),'Validation artisan encore bloquante');});
    test('T24 — prix isolation null ne devient jamais 0 silencieusement',()=>{const {w}=validOneWall('doublage');w.framing.profile='M70';w.isolation.active=true;applyWallIsolationSuggestion(w,'test');w.isolation.validated=true;w.isolation.price=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-ISO-PRICE'),'Prix null accepté comme 0');});
    test('T25 — prix couche 2 null est bloqué',()=>{const {w}=validOneWall('doublage');w.framing.profile='M70';w.isolation.active=true;applyWallIsolationSuggestion(w,'test');w.isolation.validated=true;w.isolation.doubleLayer=true;w.isolation.secondPrice=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-ISO2-PRICE'),'Prix couche 2 null accepté');});
    test('T26 — suggestion isolation cloison M48 = référence compatible ≤48 mm',()=>{const {w}=validOneWall('cloison');w.framing.profile='M48';w.isolation.active=true;const ref=applyWallIsolationSuggestion(w,'test');assert(ref&&/cloison/i.test(ref.usage)&&ref.epaisseurMm<=48,'Suggestion cloison incompatible');});
    test('T27 — suggestion isolation doublage M70 = référence compatible ≤70 mm',()=>{const {w}=validOneWall('doublage');w.framing.profile='M70';w.isolation.active=true;const ref=applyWallIsolationSuggestion(w,'test');assert(ref&&/doublage/i.test(ref.usage)&&ref.epaisseurMm<=70,'Suggestion doublage incompatible');});
    test('T28 — couche 2 conserve un prix indépendant',()=>{const {w}=validOneWall('doublage');w.isolation.secondPrice=12.34;assert(w.isolation.secondPrice===12.34,'Prix couche 2 non indépendant');});
    test('T29 — pose croisée ×1,15 uniquement sur la pose de 2e couche',()=>{const {w}=validOneWall('doublage');w.framing.profile='M70';w.isolation.active=true;applyWallIsolationSuggestion(w,'test');w.isolation.validated=true;w.isolation.doubleLayer=true;w.isolation.crossed=true;w.isolation.secondReference=w.isolation.reference;w.isolation.secondPrice=w.isolation.price;const sales=[],mats=[],alerts=[],blocks=[];addIsolation(mats,sales,alerts,blocks,w.isolation,10,'TEST',0,70);const line=sales.find(x=>x.name.includes('Pose isolation 2 couches'));assert(line&&Math.abs(line.total-34.5)<1e-9,'Pose croisée doit donner 10 × 3 × 1,15 = 34,50 €');});
    test('T30 — plafond actif exige un format commercial explicite',()=>{const p=fresh();p.length=5;p.width=4;p.height=2.5;syncPieceWalls(p);p.walls.forEach(w=>w.active=false);p.ceiling.active=true;p.ceiling.type='droit';p.ceiling.face.plate='BA13';p.ceiling.face.doubleSkin=false;p.ceiling.plateFormatHeight=null;p.ceiling.support='bois';p.ceiling.dropMm=100;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-PLAFOND-PLAQUE'),'Format plafond inventé silencieusement');});
    test('T31 — plafond utilise 1,67 ml/m² de fourrure',()=>assert(Math.abs(R.ceiling.furring-1.67)<1e-9,'Fourrure plafond != 1,67'));
    test('T32 — pertes plaques = murs 7 / plafond 10 / rampant 12',()=>assert(R.plateLossWall===7&&R.plateLossCeiling===10&&R.plateLossRampant===12,'Pertes plaques incorrectes'));
    test('T33 — Optima propose 2 rangées à 2,80 m',()=>assert(suggestRows(2.8)===2,'Optima 2,80 m incorrect'));
    test('T34 — A→B→C conserve toutes les données indépendantes',()=>{const p=state.pieces[0];p.walls[0].face1.plate='phonique';p.walls[1].face1.plate='hydro';p.walls[2].face1.doubleSkin=true;assert(p.walls[0].face1.plate==='phonique'&&p.walls[1].face1.plate==='hydro'&&p.walls[2].face1.doubleSkin,'Données perdues entre murs');});
    test('T35 — prix Annexes 5 utilisés exactement',()=>assert(DEMO_CATALOG.plates[0].price===8.90&&DEMO_CATALOG.plates[2].price===10.20&&DEMO_CATALOG.profiles.M48.rail.price===3.20&&DEMO_CATALOG.profiles.M70.stud.price===6.20&&DEMO_CATALOG.screwBox.price===5.80,'Catalogue annexe 5 incohérent'));
    test('T36 — bandes/enduit utilisent le catalogue intégré sans saisie artisan',()=>{validOneWall('cloison');state.options.finish='bandes';state.catalog.band30Price=null;state.catalog.band150Price=null;state.catalog.compound5Price=null;state.catalog.compound15Price=null;state.catalog.compound25Price=null;const r=calculate(),b=r.materials.find(x=>x.name.startsWith('Bandes')),e=r.materials.find(x=>x.name.startsWith('Enduit'));assert(b?.total>0&&e?.total>0&&!r.blocking.some(x=>x.code==='PLQ-V2-007'),'Catalogue finition intégré non utilisé en secours');});
    test('T37 — complexité doit être choisie explicitement',()=>{const {w}=validOneWall('cloison');state.options.complexity=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-CFG-COMPLEXITE'),'Complexité implicite acceptée');});
    test('T38 — âge logement doit être choisi explicitement',()=>{validOneWall('cloison');state.project.olderThan2Years=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-TVA-CONTEXTE'),'Contexte TVA implicite accepté');});
    test('T39 — taux horaire et marge absents sont bloqués',()=>{validOneWall('cloison');state.options.hourlyRate=null;state.options.materialMargin=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-CFG-TAUX')&&r.blocking.some(x=>x.code==='PLQ-CFG-MARGE'),'Paramètres entreprise cachés');});
    test('T40 — option directe active avec prix nul est bloquée',()=>{validOneWall('cloison');state.options.reprise=true;state.options.reprisePrice=0;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-V2-008'),'Option directe à 0 non bloquée');});
    test('T41 — renfort actif avec prix nul est bloqué',()=>{const {w}=validOneWall('cloison');w.reinforcementQty=1;w.reinforcementPrice=0;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-V2-008'),'Renfort à 0 non bloqué');});
    test('T42 — membranes plafond non inventées : portée absente = blocage et aucune vente',()=>{const p=fresh();p.length=5;p.width=4;p.height=2.5;syncPieceWalls(p);p.walls.forEach(w=>w.active=false);p.ceiling.active=true;p.ceiling.type='droit';p.ceiling.face.plate='BA13';p.ceiling.face.doubleSkin=false;p.ceiling.plateFormatHeight=2.5;p.ceiling.hangerLength=90;p.ceiling.isolation.active=true;const ref=ABAQUE[0];p.ceiling.isolation.reference=ref.id;p.ceiling.isolation.price=ref.prixAchatHtM2;p.ceiling.isolation.thickness=ref.epaisseurMm;p.ceiling.isolation.validated=true;p.ceiling.isolation.pareVapeur=true;p.ceiling.isolation.freinVapeur=true;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-MEMBRANE-SCOPE'),'Portée membrane plafond inventée');assert(!r.sales.some(x=>x.name.includes('Pare-vapeur')||x.name.includes('Membrane hygrovariable')),'Membrane plafond vendue sans portée validée');});
    test('T43 — manifeste de connexions : aucune destination vide',()=>{for(const [group,map] of Object.entries(CONNECTION_DESTINATIONS)){assert(Object.keys(map).length>0,`Groupe ${group} vide`);for(const [path,dest] of Object.entries(map))assert(typeof dest==='string'&&dest.trim(),`${group}.${path} sans destination`);}});
    test('T44 — règles essentielles chargées sans fallback silencieux',()=>assert(ABAQUE.length===43&&R.screwsBox===500&&R.finishBandWall===1.8&&R.finishCompoundCeiling===0.6&&R.openingStuds===4,'Règle essentielle absente'));
    test('T45 — pose croisée ne multiplie pas les heures de base du mur',()=>{const {w}=validOneWall('doublage');w.framing.profile='M70';w.isolation.active=true;applyWallIsolationSuggestion(w,'test');w.isolation.validated=true;w.isolation.doubleLayer=true;w.isolation.secondReference=w.isolation.reference;w.isolation.secondPrice=w.isolation.price;w.isolation.crossed=false;const a=calculate().labor.find(x=>x.name.includes('Mur A')).hours;w.isolation.crossed=true;const b=calculate().labor.find(x=>x.name.includes('Mur A')).hours;assert(Math.abs(a-b)<1e-9,'La pose croisée a modifié toute la MO au lieu de la 2e couche');});
    test('T46 — nouveau mur = actif + BA13 simple peau, type et ossature restent à choisir',()=>{const w=state.pieces[0].walls[0];assert(w.active===true&&w.type==null&&w.framing.profile==null&&w.framing.spacingCm==null&&w.framing.doubledStuds==null&&w.face1.plate==='BA13'&&w.face1.doubleSkin===false,'Valeurs par défaut UX incorrectes');});
    test('T47 — mur actif avec défauts BA13 reste bloqué tant que ossature absente',()=>{const p=fresh();p.length=4;p.width=3;p.height=2.5;syncPieceWalls(p);const w=p.walls[0];w.active=true;w.type='cloison';state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-PROFILE')&&!r.blocking.some(x=>x.code==='PLQ-CAT-PLAQUE-TYPE'||x.code==='PLQ-SKIN-CHOICE'),'Défauts BA13/simple peau non pris en compte ou ossature non bloquée');});
    test('T48 — montant catalogue trop court bloque la commande',()=>{const {p,w}=validOneWall('cloison');p.height=3.05;syncPieceWalls(p);w.framing.profile='M70';w.framing.spacingCm=60;w.framing.doubledStuds=true;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-FRAME-LENGTH'),'Montant 3 m utilisé à tort sur mur >3 m');});
    test('T49 — sans finition explicite aucune bande/enduit n’est commandé',()=>{validOneWall('cloison');state.options.finish='aucune';const r=calculate();assert(!r.materials.some(x=>x.name.startsWith('Bandes'))&&!r.materials.some(x=>x.name.startsWith('Enduit')),'Finition ajoutée alors que Sans finition est choisi');});
    test('T50 — finition non choisie est bloquante',()=>{validOneWall('cloison');state.options.finish=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-FINISH-CHOICE'),'Finition implicite acceptée');});
    test('T51 — plafond actif sans type est bloquant',()=>{const p=fresh();p.length=5;p.width=4;p.height=2.5;syncPieceWalls(p);p.walls.forEach(w=>w.active=false);p.ceiling.active=true;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-CEILING-TYPE'),'Type plafond inventé');});
    test('T52 — plafond actif exige le choix simple/double peau',()=>{const p=fresh();p.length=5;p.width=4;p.height=2.5;syncPieceWalls(p);p.walls.forEach(w=>w.active=false);p.ceiling.active=true;p.ceiling.type='droit';p.ceiling.face.plate='BA13';p.ceiling.face.doubleSkin=null;p.ceiling.plateFormatHeight=2.5;p.ceiling.hangerLength=90;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-SKIN-CHOICE'),'Peau plafond inventée');});
    test('T53 — Optima sans saisie prix artisan utilise le catalogue intégré',()=>{const {w}=validOneWall('doublage');w.framing.system='optima';w.framing.profile=null;w.framing.spacingCm=null;w.framing.doubledStuds=null;w.framing.optimaRows=null;state.catalog.optimaClipPricePerMl=null;state.catalog.optimaSupportPriceEach=null;const r=calculate();assert(!r.blocking.some(x=>x.code==='PLQ-CATALOG-PRICE')&&r.materials.some(x=>/Appuis Optima2 avec clé/.test(x.name)&&x.total>0),'Catalogue Optima intégré non utilisé');});
    test('T54 — toutes les connexions de mur écrivent dans le mur B uniquement',()=>{const samples={
      'active':[true,'checkbox'],'type':['doublage','select'],'height':[3.1,'number'],'framing.profile':['M70','select'],'framing.spacingCm':[40,'number'],'framing.system':['classique','select'],'framing.doubledStuds':[true,'select'],'framing.optimaRows':[2,'number'],
      'face1.plate':['hydro','select'],'face1.doubleSkin':[true,'select'],'face1.manualPlateCount':[4,'number'],'face2.plate':['phonique','select'],'face2.doubleSkin':[true,'select'],'face2.manualPlateCount':[5,'number'],
      'isolation.active':[true,'checkbox'],'isolation.reference':[ABAQUE[0].id,'select'],'isolation.thickness':[45,'number'],'isolation.price':[9.99,'number'],'isolation.validated':[true,'checkbox'],'isolation.semiRigid':[true,'checkbox'],'isolation.doubleLayer':[true,'checkbox'],'isolation.secondReference':[ABAQUE[1].id,'select'],'isolation.secondPrice':[8.88,'number'],'isolation.crossed':[true,'checkbox'],'isolation.pareVapeur':[true,'checkbox'],'isolation.freinVapeur':[true,'checkbox'],
      'reinforcementQty':[2,'number'],'reinforcementPrice':[99,'number'],'outsideAnglesQty':[3,'number'],'cuts':[true,'checkbox']};
      for(const path of Object.keys(CONNECTION_DESTINATIONS.wall)){fresh();const p=state.pieces[0],a=p.walls[0],b=p.walls[1],beforeA=JSON.stringify(a),sample=samples[path];assert(sample,`Échantillon manquant ${path}`);onInput(fakeControl({wall:`piece:${p.id}:B`,wkey:path},sample[0],sample[1]));assert(sameValue(getPath(b,path),sample[0]),`Connexion B incorrecte : ${path}`);assert(JSON.stringify(a)===beforeA,`Mur A contaminé par ${path}`);}});
    test('T55 — toutes les connexions ouverture restent sur le mur B',()=>{const p=fresh(),a=p.walls[0],b=p.walls[1];b.openings.push({id:'open-b',type:null,width:null,height:null,qty:null});const samples={type:['porte','select'],width:[0.9,'number'],height:[2.1,'number'],qty:[2,'number']};for(const path of Object.keys(CONNECTION_DESTINATIONS.opening)){const beforeA=JSON.stringify(a);const sample=samples[path];onInput(fakeControl({open:'open-b',scope:`piece:${p.id}:B`,okey:path},sample[0],sample[1]));assert(sameValue(getPath(b.openings[0],path),sample[0]),`Ouverture ${path} mal écrite`);assert(JSON.stringify(a)===beforeA,`Mur A contaminé par ouverture ${path}`);}});
    test('T56 — toutes les connexions plafond restent dans la bonne pièce',()=>{const p1=fresh(),p2=makePiece(2);state.pieces.push(p2);const samples={'active':[true,'checkbox'],'type':['droit','select'],'manualArea':[22,'number'],'support':['beton','select'],'dropMm':[150,'number'],'face.plate':['hydro','select'],'face.doubleSkin':[true,'select'],'plateFormatHeight':['2.8','select'],'cuts':[true,'checkbox'],'isolation.active':[true,'checkbox'],'isolation.reference':[ABAQUE[0].id,'select'],'isolation.thickness':[45,'number'],'isolation.price':[7.7,'number'],'isolation.validated':[true,'checkbox'],'isolation.semiRigid':[true,'checkbox'],'isolation.doubleLayer':[true,'checkbox'],'isolation.secondReference':[ABAQUE[1].id,'select'],'isolation.secondPrice':[8.8,'number'],'isolation.crossed':[true,'checkbox']};for(const path of Object.keys(CONNECTION_DESTINATIONS.ceiling)){const before2=JSON.stringify(p2.ceiling),sample=samples[path];assert(sample,`Échantillon plafond manquant ${path}`);onInput(fakeControl({ceiling:p1.id,ckey:path},sample[0],sample[1]));assert(sameValue(getPath(p1.ceiling,path),sample[0]),`Connexion plafond incorrecte ${path}`);assert(JSON.stringify(p2.ceiling)===before2,`Plafond pièce 2 contaminé par ${path}`);}});
    test('T57 — toutes les connexions globales, pièce, mur simple et extra passent par leur manifeste',()=>{
      const globalSamples={'project.name':['Test','text'],'options.hourlyRate':[55,'number'],'options.materialMargin':[12.5,'number'],'project.eligibilityConfirmed':[true,'checkbox'],'options.impression':[true,'checkbox'],'options.reprise':[true,'checkbox'],'options.reprisePrice':[175,'number'],'options.access':[true,'checkbox'],'options.accessPrice':[475,'number'],'options.complexity':['complexe','select'],};
      for(const path of Object.keys(CONNECTION_DESTINATIONS.global)){fresh();const sample=globalSamples[path];assert(sample,`Échantillon global manquant ${path}`);onInput(fakeControl({path},sample[0],sample[1]));assert(sameValue(getPath(state,path),sample[0]),`Connexion globale incorrecte ${path}`);}
      const pieceSamples={name:['Cuisine','text'],shape:['L','select'],shapeA:[1.2,'number'],shapeB:[1.1,'number'],length:[6.2,'number'],width:[3.8,'number'],height:[2.7,'number'],'ceiling.active':[true,'select']};
      for(const path of Object.keys(CONNECTION_DESTINATIONS.piece)){const p=fresh(),sample=pieceSamples[path];assert(sample,`Échantillon pièce manquant ${path}`);onInput(fakeControl({piece:p.id,pkey:path},sample[0],sample[1]));assert(sameValue(getPath(p,path),sample[0]),`Connexion pièce incorrecte ${path}`);}
      const simpleSamples={label:['Mur test','text'],length:[4.4,'number'],height:[2.6,'number']};
      for(const path of Object.keys(CONNECTION_DESTINATIONS.simple)){fresh();const sw=makeSimpleWall(1);state.simpleWalls.push(sw);const sample=simpleSamples[path];assert(sample,`Échantillon mur simple manquant ${path}`);onInput(fakeControl({simple:sw.id,skey:path},sample[0],sample[1]));assert(sameValue(getPath(sw,path),sample[0]),`Connexion mur simple incorrecte ${path}`);}
      const extraSamples={name:['Niche','text'],qty:[2,'number'],price:[80,'number']};
      for(const path of Object.keys(CONNECTION_DESTINATIONS.extra)){fresh();const ex={id:'e',name:'',qty:null,price:null};state.options.extras.push(ex);const sample=extraSamples[path];assert(sample,`Échantillon extra manquant ${path}`);onInput(fakeControl({extra:'e',ekey:path},sample[0],sample[1]));assert(sameValue(getPath(ex,path),sample[0]),`Connexion extra incorrecte ${path}`);}
    });
    test('T58 — clic réel B puis C + cases à cocher restent indépendants',()=>{const p=fresh(),a=p.walls[0],b=p.walls[1],c=p.walls[2];onClick(fakePlanClick(p.id,'B'));onInput(fakeCheckbox({wall:`piece:${p.id}:B`,wkey:'cuts'},true));onClick(fakePlanClick(p.id,'C'));onInput(fakeCheckbox({wall:`piece:${p.id}:C`,wkey:'isolation.active'},true));assert(b.cuts===true&&c.isolation.active===true,'Flux clic B→C cassé');assert(a.cuts===false&&a.isolation.active===false,'Mur A contaminé dans flux clic B→C');});
    test('T59 — balises spéciales âge/finition sont déclarées',()=>{assert(checkBinding('special','project.olderThan2Years','test')&&checkBinding('special','options.finish','test')&&checkBinding('special','wall.planSelection','test'),'Balise spéciale manquante');});
    test('T60 — balise anti-contamination mur détecte zéro changement hors cible',()=>{const p=fresh(),b=p.walls[1];const before=snapshotOtherWalls(b);b.cuts=true;verifyNoOtherWallChanged(before,b,'test-T60');assert(!RUNTIME_ERRORS.some(x=>x.code==='WALL-CONTAMINATION'),'Fausse contamination mur');});
    test('T61 — balise anti-contamination plafond détecte zéro changement hors cible',()=>{const p1=fresh(),p2=makePiece(2);state.pieces.push(p2);const before=snapshotOtherCeilings(p1);p1.ceiling.active=true;verifyNoOtherCeilingChanged(before,p1,'test-T61');assert(!RUNTIME_ERRORS.some(x=>x.code==='CEILING-CONTAMINATION'),'Fausse contamination plafond');});
    test('T62 — balise structure valide IDs pièces/murs/ouvertures',()=>{fresh();assert(checkStateStructure('test-T62'),'Structure rejetée à tort');});
    test('T63 — scope direct B reste prioritaire même si le mur sélectionné devient C',()=>{const p=fresh();selected[p.id]='C';const b=getWallByScope(`piece:${p.id}:B`);assert(b?.id==='B','Le scope direct ne prime plus sur la sélection');});
    test('T64 — sauvegarde passe par structure + checksum',()=>{fresh();const n=TRACE.length;save();const recent=TRACE.slice(n).map(x=>x.tag);assert(recent.includes('STATE-STRUCTURE-OK')&&recent.includes('SAVE-CHECKSUM'),'Balise de sauvegarde absente');});
    test('T65 — membranes cumulables uniquement sur doublage isolé',()=>{const {w}=validOneWall('doublage');const ref=ABAQUE[0];w.isolation.active=true;w.isolation.reference=ref.id;w.isolation.price=ref.prixAchatHtM2;w.isolation.thickness=ref.epaisseurMm;w.isolation.validated=true;w.isolation.pareVapeur=true;w.isolation.freinVapeur=true;const r=calculate();assert(!r.blocking.some(x=>x.code==='PLQ-MEMBRANE-SCOPE'),'Doublage membrane bloqué à tort');assert(r.sales.some(x=>x.name.includes('Pare-vapeur'))&&r.sales.some(x=>x.name.includes('Membrane hygrovariable')),'Membranes doublage non cumulées');});
    test('T66 — mur > plaque maxi sans quantité artisan est bloqué',()=>{const {p,w}=validOneWall('doublage');p.length=2;p.height=3.2;syncPieceWalls(p);w.face1.manualPlateCount=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-PLATE-TALL-MANUAL'),'Calepinage mur haut inventé au lieu de bloquer');});
    test('T67 — mur haut utilise uniquement la quantité de plaques saisie par artisan',()=>{const {p,w}=validOneWall('doublage');p.length=2;p.height=3.2;syncPieceWalls(p);w.face1.manualPlateCount=4;const r=calculate();assert(!r.blocking.some(x=>x.code==='PLQ-PLATE-TALL-MANUAL'||x.code==='PLQ-PLATE-MANUAL-LOW'),'Quantité manuelle valide refusée');const m=r.materials.find(x=>x.name.includes('Face 1'));assert(m&&m.order.startsWith('4 plaque(s)'),'La quantité manuelle n’est pas utilisée');assert(TRACE.some(x=>x.tag==='PLATE-MANUAL-OVERRIDE'&&x.data.count===4),'Balise override manuel absente');});
    test('T68 — mur haut avec ouverture reste bloqué sans quantité artisan',()=>{const {p,w}=validOneWall('doublage');p.length=2;p.height=3.2;syncPieceWalls(p);w.openings.push({id:'haut-o',type:'porte',width:.9,height:2.1,qty:1});w.face1.manualPlateCount=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-PLATE-TALL-MANUAL'),'Mur haut avec ouverture a reçu un calepinage inventé');});
    test('T69 — quantité manuelle plaques Face 1 du mur B ne touche aucune autre face/mur',()=>{const p=fresh();p.height=3.2;syncPieceWalls(p);const a=p.walls[0],b=p.walls[1];const beforeA=JSON.stringify(a),beforeFace2=JSON.stringify(b.face2);onInput(fakeControl({wall:`piece:${p.id}:B`,wkey:'face1.manualPlateCount'},4,'number'));assert(b.face1.manualPlateCount===4,'Quantité manuelle non écrite sur B face1');assert(JSON.stringify(a)===beforeA,'Mur A contaminé');assert(JSON.stringify(b.face2)===beforeFace2,'Face 2 contaminée');});
    test('T70 — ajouter une ouverture ne préremplit aucune donnée métier',()=>{const p=fresh(),b=p.walls[1];onClick(fakeAction('add-opening',{scope:`piece:${p.id}:B`}));const o=b.openings.at(-1);assert(o&&o.type===null&&o.width===null&&o.height===null&&o.qty===null,'Une ouverture contient une valeur métier inventée');});
    test('T71 — ajouter un extra ne préremplit ni quantité ni prix et bloque tant qu’il est incomplet',()=>{validOneWall('cloison');onClick(fakeAction('add-extra'));const x=state.options.extras.at(-1);assert(x&&x.name===''&&x.qty===null&&x.price===null,'Extra prérempli avec une valeur inventée');const r=calculate();assert(r.blocking.some(b=>b.code==='PLQ-EXTRA-INCOMPLETE'),'Extra incomplet ignoré silencieusement');});
    test('T72 — complexité absente bloque et n’injecte aucun coefficient 1 silencieux',()=>{validOneWall('cloison');state.options.complexity=null;const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-CFG-COMPLEXITE'),'Complexité absente non bloquée');assert(r.laborHours===0,'Main-d’œuvre calculée avec coefficient implicite malgré blocage');});
    test('T73 — quantité manuelle de plaques est effacée et tracée quand la hauteur repasse sous 3 m',()=>{const p=fresh();p.height=3.2;syncPieceWalls(p);p.walls[0].face1.manualPlateCount=4;onInput(fakeControl({piece:p.id,pkey:'height'},2.8,'number'));assert(p.walls[0].face1.manualPlateCount===null,'Ancienne quantité manuelle devenue orpheline');assert(TRACE.some(x=>x.tag==='PLATE-MANUAL-CLEAR'&&x.data.wallId==='A'),'Balise de nettoyage quantité manuelle absente');});
    test('T74 — ouverture ajoutée puis laissée vide est bloquée par validation',()=>{const {p,w}=validOneWall('cloison');onClick(fakeAction('add-opening',{scope:`piece:${p.id}:A`}));const r=calculate();assert(r.blocking.some(x=>x.code==='PLQ-OPENING-TYPE')&&r.blocking.some(x=>x.code==='PLQ-OPENING-INVALID'),'Ouverture vide ignorée au calcul');});
    test('T75 — tous les boutons d’ajout/suppression déclarés modifient uniquement la collection prévue',()=>{const p=fresh();const pieces0=state.pieces.length;onClick(fakeAction('add-piece'));assert(state.pieces.length===pieces0+1,'add-piece');const addedPiece=state.pieces.at(-1);onClick(fakeAction('remove-piece',{id:addedPiece.id}));assert(state.pieces.length===pieces0,'remove-piece');onClick(fakeAction('add-simple'));assert(state.simpleWalls.length===1,'add-simple');const sw=state.simpleWalls[0];onClick(fakeAction('remove-simple',{id:sw.id}));assert(state.simpleWalls.length===0,'remove-simple');onClick(fakeAction('add-opening',{scope:`piece:${p.id}:B`}));assert(p.walls[1].openings.length===1&&p.walls[0].openings.length===0,'add-opening cible');const oid=p.walls[1].openings[0].id;onClick(fakeAction('remove-opening',{scope:`piece:${p.id}:B`,openid:oid}));assert(p.walls[1].openings.length===0,'remove-opening');onClick(fakeAction('add-extra'));assert(state.options.extras.length===1,'add-extra');const eid=state.options.extras[0].id;onClick(fakeAction('remove-extra',{id:eid}));assert(state.options.extras.length===0,'remove-extra');assert(KNOWN_ACTIONS.size===8,'Une action déclarée n’est pas couverte par ce test');});
    test('T76 — activer isolation plafond ne choisit aucune référence sans critère validé',()=>{const p=fresh();p.ceiling.active=true;onInput(fakeCheckbox({ceiling:p.id,ckey:'isolation.active'},true));assert(p.ceiling.isolation.reference===''&&p.ceiling.isolation.price===null&&p.ceiling.isolation.thickness===null,'Référence isolation plafond inventée automatiquement');assert(TRACE.some(x=>x.tag==='ISO-SUGGEST-NONE'&&x.data.scope==='ceiling'),'Balise absence de suggestion plafond manquante');});
    test('T77 — étape 1 bloque le passage sans taux horaire obligatoire',()=>{fresh();state.project.olderThan2Years=false;state.options.materialMargin=0;state.options.hourlyRate=null;assert(validateStep(0).some(x=>x.code==='PLQ-REQ-HOURLY'),'Étape 1 laisse passer sans taux horaire');});
    test('T78 — étape 1 bloque le passage sans contexte TVA',()=>{fresh();state.options.hourlyRate=40;state.options.materialMargin=0;state.project.olderThan2Years=null;assert(validateStep(0).some(x=>x.code==='PLQ-REQ-TVA-CONTEXT'),'Étape 1 laisse passer sans contexte TVA');});
    test('T79 — étape 2 bloque une pièce avec dimensions manquantes',()=>{fresh();assert(validateStep(1).some(x=>x.code==='PLQ-REQ-PIECE-DIM'),'Étape 2 laisse passer des dimensions vides');});
    test('T80 — étape 3 bloque un mur actif tant que ossature absente',()=>{const p=fresh();p.length=4;p.width=3;p.height=2.5;syncPieceWalls(p);p.walls[0].active=true;p.walls[0].type='cloison';const e=validateStep(2);assert(e.some(x=>x.code==='PLQ-REQ-PROFILE')&&!e.some(x=>x.code==='PLQ-REQ-PLATE'||x.code==='PLQ-REQ-SKIN'),'Défauts BA13/simple peau non pris en compte ou ossature non bloquée');});
    test('T81 — Optima utilise le catalogue SpeedArti sans demander de prix artisan',()=>{const {w}=validOneWall('doublage');w.framing.system='optima';w.framing.profile=null;w.framing.spacingCm=null;w.framing.doubledStuds=null;state.catalog.optimaClipPricePerMl=null;state.catalog.optimaSupportPriceEach=null;const e=validateStep(2),r=calculate();assert(!e.some(x=>x.code==='PLQ-REQ-CATALOG-OPTIMA')&&!r.blocking.some(x=>x.code==='PLQ-CATALOG-PRICE')&&r.materials.some(x=>/Appuis Optima2 avec clé/.test(x.name)),'Optima demande encore un prix artisan ou catalogue intégré non utilisé');});
    test('T82 — étape 4 utilise les prix catalogue accessoires plafond sans saisie artisan',()=>{const p=fresh();p.length=5;p.width=4;p.height=2.5;syncPieceWalls(p);p.ceiling.active=true;p.ceiling.type='droit';p.ceiling.face.plate='BA13';p.ceiling.face.doubleSkin=false;p.ceiling.plateFormatHeight=2.5;p.ceiling.support='bois';p.ceiling.dropMm=100;const e=validateStep(3);assert(!e.some(x=>x.code==='PLQ-REQ-CATALOG-SPLICE'||x.code==='PLQ-REQ-CATALOG-CONNECTOR'),'Prix accessoires plafond encore demandés');assert(catalogDefault().ceilingSplicePriceEach===0.53&&catalogDefault().ceilingConnectorPriceEach===0.44,'Prix catalogue accessoires plafond incorrects');});
    test('T83 — étape 5 ne demande plus les prix de finition',()=>{validOneWall('cloison');state.options.finish='bandes';const e=validateStep(4);assert(!e.some(x=>x.code==='PLQ-REQ-CATALOG-FINISH'),'Prix finition encore demandés');const d=catalogDefault();assert(d.band30Price===2.49&&d.band150Price===4.99&&d.compound5Price===8.33&&d.compound15Price===14.08&&d.compound25Price===17.42,'Catalogue finition intégré incorrect');});
    test('T84 — logement de plus de 2 ans applique 10 % par défaut sans case cochée',()=>{validOneWall('cloison');state.project.olderThan2Years=true;state.project.eligibilityConfirmed=false;const r=calculate();assert(!r.blocking.some(x=>x.code==='PLQ-TVA-CONFIRM')&&r.vat>0&&Math.abs(r.vat-r.totalHT*.10)<1e-6,'TVA 10 % par défaut incorrecte pour un logement de plus de 2 ans');});
    test('T85 — logement neuf reste à 20 % même si la case 5,5 % est activée en état',()=>{validOneWall('cloison');state.project.olderThan2Years=false;state.project.eligibilityConfirmed=true;const r=calculate();assert(r.blocking.length===0&&r.vat>0&&Math.abs(r.vat-r.totalHT*.20)<1e-6&&r.totalTTC>r.totalHT,'Le contexte neuf ne force pas la TVA 20 %');});
    test('T103 — seul l’isolant éligible passe à 5,5 % pour un logement de plus de 2 ans',()=>{state.project.olderThan2Years=true;state.project.eligibilityConfirmed=false;assert(vatFor('normal',[])===10&&vatFor('isolation',[])===10,'TVA 10 % par défaut incorrecte');state.project.eligibilityConfirmed=true;assert(vatFor('normal',[])===10&&vatFor('isolation',[])===5.5,'Le taux 5,5 % déborde sur les travaux non isolants');state.project.olderThan2Years=false;assert(vatFor('normal',[])===20&&vatFor('isolation',[])===20,'Le taux 5,5 % est autorisé sur un logement neuf');state.project.olderThan2Years=null;assert(vatFor('isolation',[])===null,'Le taux TVA est déterminé sans contexte logement');});
    test('T86 — main-d’œuvre calculée avec taux horaire + complexité renseignés',()=>{validOneWall('cloison');const r=calculate();assert(r.laborHours>0&&r.laborCost>0,'Main-d’œuvre reste à 0 malgré les paramètres complets');});
    test('T87 — matériaux catalogue connus produisent des prix et totaux',()=>{validOneWall('cloison');const r=calculate();const priced=r.materials.filter(x=>x.billable!==false);assert(priced.length>0&&priced.every(x=>Number.isFinite(x.total)&&x.total>0),'Matériaux catalogue connus restent sans prix');});
    test('T88 — bandes/enduit catalogue sont chiffrés en coût interne sans double facturation',()=>{validOneWall('cloison');state.options.finish='bandes';const r=calculate(),internals=r.materials.filter(x=>x.billable===false);assert(r.blocking.length===0&&internals.length===2&&internals.every(x=>x.total>0),'Coût interne bandes/enduit non calculé');const expected=r.materials.filter(x=>x.billable!==false).reduce((a,x)=>a+(x.total||0),0)+r.sales.reduce((a,x)=>a+x.total,0)+r.laborCost;assert(Math.abs(r.totalHT-expected)<1e-6,'Coût interne refacturé une deuxième fois');});
    test('T89 — catalogue : Optima, plafond et finition sont intégrés',()=>{const d=catalogDefault();assert(d.optimaClipPricePerMl===1.53&&d.optimaSupportPriceEach===1.70&&d.ceilingSplicePriceEach===0.53&&d.ceilingConnectorPriceEach===0.44&&d.band30Price===2.49&&d.compound25Price===17.42,'Prix intégrés catalogue incorrects');assert(!('optimaKeyPriceEach' in d)&&!('optimaFixingPriceEach' in d),'Anciennes saisies Optima encore présentes');});
    test('T90 — plafond apparaît dans Surfaces par ouvrage',()=>{const p=fresh();p.length=5;p.width=4;p.height=2.5;syncPieceWalls(p);p.walls.forEach(w=>w.active=false);p.ceiling.active=true;p.ceiling.type='droit';p.ceiling.face.plate='BA13';p.ceiling.face.doubleSkin=false;p.ceiling.plateFormatHeight=2.5;p.ceiling.hangerLength=90;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';const r=calculate(),row=r.wallRows.find(x=>x.label===`Plafond — ${p.name}`);assert(row&&row.type==='Plafond droit'&&Math.abs(row.netOne-20)<1e-9&&Math.abs(row.cladding-20)<1e-9,'Plafond absent ou surface incorrecte dans le détail des ouvrages');});
    test('T91 — total matériaux final est exposé dans le résultat',()=>{validOneWall('cloison');const r=calculate();const expected=r.materials.filter(x=>x.billable!==false&&Number.isFinite(x.total)).reduce((s,x)=>s+x.total,0);assert(Number.isFinite(r.materialTotal)&&Math.abs(r.materialTotal-expected)<1e-9&&r.materialTotal>0,'Total matériaux absent ou incohérent');});
    test('T92 — nouveaux murs actifs avec BA13 simple peau par défaut',()=>{const p=fresh();assert(p.walls.every(w=>w.active&&w.face1.plate==='BA13'&&w.face1.doubleSkin===false&&w.face2.plate==='BA13'&&w.face2.doubleSkin===false),'Valeurs par défaut mur non appliquées');});
    test('T93 — choisir Cloison préremplit M48 entraxe 60 simple',()=>{const p=fresh(),w=p.walls[0];w.type=null;w.framing=framingDefault();onInput(fakeControl({wall:`piece:${p.id}:A`,wkey:'type'},'cloison','select'));assert(w.framing.profile==='M48'&&w.framing.spacingCm===60&&w.framing.doubledStuds===false,'Préremplissage cloison incorrect');});
    test('T94 — M48 simple entraxe 60 à 2,80 m génère une alerte non bloquante',()=>{const {p,w}=validOneWall('cloison');p.height=2.8;syncPieceWalls(p);w.framing.profile='M48';w.framing.spacingCm=60;w.framing.doubledStuds=false;const r=calculate();assert(r.alerts.some(x=>/hauteur limite 2,5 m/.test(x))&&!r.blocking.some(x=>/DTU|hauteur limite/i.test(x.message||'')),'Alerte DTU absente ou bloquante');});
    test('T95 — pièce en L crée 6 murs et surface réelle',()=>{const p=fresh();p.length=6;p.width=4;p.shape='L';p.shapeA=2;p.shapeB=1;syncPieceWalls(p);assert(p.walls.length===6&&Math.abs(pieceFloorArea(p)-22)<1e-9,'Géométrie L incorrecte');});
    test('T96 — pièce en T crée 8 murs et surface réelle',()=>{const p=fresh();p.length=6;p.width=5;p.shape='T';p.shapeA=2;p.shapeB=2;syncPieceWalls(p);assert(p.walls.length===8&&Math.abs(pieceFloorArea(p)-18)<1e-9,'Géométrie T incorrecte');});
    test('T97 — pièce en U crée 8 murs et surface réelle',()=>{const p=fresh();p.length=6;p.width=5;p.shape='U';p.shapeA=2;p.shapeB=2;syncPieceWalls(p);assert(p.walls.length===8&&Math.abs(pieceFloorArea(p)-26)<1e-9,'Géométrie U incorrecte');});
    test('T98 — plafond droit utilise la surface de la forme',()=>{const p=fresh();p.length=6;p.width=4;p.shape='L';p.shapeA=2;p.shapeB=1;syncPieceWalls(p);p.ceiling.type='droit';assert(Math.abs(ceilingArea(p)-22)<1e-9,'Surface plafond forme incorrecte');});
    test('T99 — plafond bois choisit automatiquement la suspente selon plénum',()=>{const p=fresh();p.length=5;p.width=4;p.ceiling.active=true;p.ceiling.type='droit';p.ceiling.support='bois';p.ceiling.dropMm=200;p.ceiling.face.plate='BA13';p.ceiling.face.doubleSkin=false;p.ceiling.plateFormatHeight=2.5;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';p.walls.forEach(w=>w.active=false);const r=calculate();assert(r.materials.some(x=>/Suspentes Maxi F530 bois/.test(x.name)),'Suspente bois adaptée non choisie');});
    test('T100 — plafond béton génère cheville + tige + cavalier',()=>{const p=fresh();p.length=5;p.width=4;p.ceiling.active=true;p.ceiling.type='droit';p.ceiling.support='beton';p.ceiling.dropMm=150;p.ceiling.face.plate='BA13';p.ceiling.face.doubleSkin=false;p.ceiling.plateFormatHeight=2.5;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';p.walls.forEach(w=>w.active=false);const r=calculate();assert(r.materials.some(x=>/Chevilles M6 béton/.test(x.name))&&r.materials.some(x=>/Tige filetée M6 —/.test(x.name))&&r.materials.some(x=>/Cavaliers F530/.test(x.name)),'Système béton incomplet');});
    test('T101 — plafond hourdis génère suspente H et rallonge si nécessaire',()=>{const p=fresh();p.length=5;p.width=4;p.ceiling.active=true;p.ceiling.type='droit';p.ceiling.support='hourdis';p.ceiling.dropMm=200;p.ceiling.face.plate='BA13';p.ceiling.face.doubleSkin=false;p.ceiling.plateFormatHeight=2.5;state.project.olderThan2Years=false;state.options.hourlyRate=40;state.options.materialMargin=0;state.options.complexity='moyenne';state.options.finish='aucune';p.walls.forEach(w=>w.active=false);const r=calculate();assert(r.materials.some(x=>/Suspentes H F530 hourdis/.test(x.name))&&r.materials.some(x=>/rallonge hourdis/.test(x.name)),'Système hourdis incomplet');});
    test('T102 — aperçu rectangle 10 × 2 conserve un ratio visuel 5:1',()=>{const p=fresh();p.length=10;p.width=2;const m=piecePreviewModel(p);assert(Math.abs((m.drawnWidth/m.drawnHeight)-5)<1e-9,'Aperçu rectangle non proportionnel');});
    test('T103 — aperçu 4 × 4 reste carré',()=>{const p=fresh();p.length=4;p.width=4;const m=piecePreviewModel(p);assert(Math.abs(m.drawnWidth-m.drawnHeight)<1e-9,'Aperçu carré déformé');});
    test('T104 — modifier A/B d’une pièce en L modifie surface et aperçu',()=>{const p=fresh();p.length=6;p.width=4;p.shape='L';p.shapeA=2;p.shapeB=1;syncPieceWalls(p);const a1=pieceFloorArea(p),svg1=piecePreviewSvg(p);p.shapeA=3;p.shapeB=2;syncPieceWalls(p);const a2=pieceFloorArea(p),svg2=piecePreviewSvg(p);assert(a1!==a2&&svg1!==svg2&&p.walls.length===6,'A/B ne mettent pas à jour la vraie géométrie');});
    test('T105 — alerte DTU immédiate M48 simple 60 à 2,80 m',()=>{const {w}=validOneWall('cloison');const a=wallTechnicalAlerts(w,2.8,'Test');assert(a.length===1&&a[0].code==='PLQ-DTU-M48-HEIGHT'&&Math.abs(a[0].limit-2.5)<1e-9,'Alerte technique temps réel absente');});
    test('T106 — passer M48 simple à entraxe 40 supprime l’alerte à 2,80 m',()=>{const {w}=validOneWall('cloison');w.framing.spacingCm=40;assert(wallTechnicalAlerts(w,2.8,'Test').length===0,'Alerte conservée sur configuration conforme');});
    test('T107 — montants doublés recalculent la limite et suppriment l’alerte à 2,80 m',()=>{const {w}=validOneWall('cloison');w.framing.doubledStuds=true;assert(wallTechnicalAlerts(w,2.8,'Test').length===0,'Limite montants doublés non recalculée');});
    test('T108 — double peau sur les deux faces recalculent la limite',()=>{const {w}=validOneWall('cloison');w.face1.doubleSkin=true;w.face2.doubleSkin=true;assert(wallTechnicalAlerts(w,2.8,'Test').length===0,'Limite double parement non recalculée');});
    test('T109 — mur simple affiche entièrement les choix Cloison/Doublage',()=>{const w=makeSimpleWall(1);w.height=2.5;const html=wallEditor(w,w.height,`simple:${w.id}`,true);assert(html.includes('simple-wall-main-grid')&&html.includes('Cloison — 2 faces')&&html.includes('Doublage — 1 face'),'Affichage mur simple incomplet');});
    test('T110 — isolation plafond inactive ne contient aucun texte mur et utilise les bindings plafond',()=>{const html=isoEditor(isoDefault(),'ceiling:test',20,null,'plafond',true);assert(!/Aucune isolation calculée|sur ce mur/.test(html)&&html.includes('Ajouter une isolation au plafond')&&html.includes('data-ceiling="test"')&&!html.includes('data-wall='),'Isolation plafond encore rendue comme un mur');});
    test('T111 — alerte DTU reste informative et non bloquante dans le calcul',()=>{const {p,w}=validOneWall('cloison');p.height=2.8;syncPieceWalls(p);w.framing.profile='M48';w.framing.spacingCm=60;w.framing.doubledStuds=false;const r=calculate();assert(r.alerts.some(x=>/hauteur limite 2,5 m/.test(x))&&!r.blocking.some(x=>/DTU|PLQ-DTU-M48-HEIGHT|hauteur limite/i.test((x.code||'')+' '+(x.message||''))),'Alerte DTU devenue bloquante');});
    test('T112 — aucune erreur de balise runtime pendant la suite de tests',()=>assert(RUNTIME_ERRORS.length===0,`Erreurs runtime détectées : ${JSON.stringify(RUNTIME_ERRORS)}`));
  } finally {state=savedState;selected=savedSelected;INTEGRITY_TEST_RUNNING=false;}
  const failed=results.filter(x=>!x.ok).length,summary={total:results.length,passed:results.length-failed,failed,results};trace('TEST-SUMMARY',{total:summary.total,passed:summary.passed,failed});return summary;
}
if(typeof window!=='undefined'&&!TEST_MODE){
  window.addEventListener('error',e=>critical('JS-RUNTIME',e.message||'Erreur JavaScript non interceptée.',{file:e.filename||null,line:e.lineno||null,column:e.colno||null}));
  window.addEventListener('unhandledrejection',e=>critical('PROMISE-RUNTIME','Promesse rejetée sans traitement.',{reason:String(e.reason?.message||e.reason||'inconnue')}));
}
ROOT.SpeedArtiPlaquisteDebug={runIntegrityTests,connectionDestinations:CONNECTION_DESTINATIONS,knownActions:[...KNOWN_ACTIONS],getTrace:()=>TRACE.slice(),getRuntimeErrors:()=>RUNTIME_ERRORS.slice(),getState:()=>JSON.parse(JSON.stringify(state)),setState:(s)=>{state=JSON.parse(JSON.stringify(s));},selectWall:(pieceId,wallId)=>{selected[pieceId]=wallId;},getWallByScope,calculate,createInitial,checkStateStructure,auditRenderedBindings};
initUI();
