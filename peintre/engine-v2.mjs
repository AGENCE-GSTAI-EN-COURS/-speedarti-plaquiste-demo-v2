// SpeedArti Peintre V2.4 — moteur de DÉMONSTRATION, hors production.
// Références historiques de l'ancien calculateur SpeedArti V2 (non validées fournisseurs).
const num = v => v === '' || v === null || v === undefined ? null : Number(v);
const valid = v => Number.isFinite(num(v)) && num(v) >= 0;
const positive = v => valid(v) && num(v) > 0;
const n = v => valid(v) ? num(v) : 0;
const r = v => Math.round((v + Number.EPSILON) * 100) / 100;
const total = a => a.reduce((s,x)=>s+x,0);
const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9));
const req = (v,label) => { if (!positive(v)) throw Error(label+' doit être strictement positif.'); return num(v); };
const nonneg = (v,label) => { if (!valid(v)) throw Error(label+' doit être positif ou nul.'); return num(v); };
const missing = (warnings,label) => {if (!warnings.includes(label)) warnings.push(label);};
export const PREPARATIONS=Object.freeze([
 {id:'none',title:'Aucune préparation'},
 {id:'light',title:'Ponçage léger'},
 {id:'repair',title:'Ponçage + rattrapage'},
 {id:'skim',title:'Ratissage complet'}
]);

export function roomPolygon(p) {
 const L=req(p.length,p.name+' longueur'),W=req(p.width,p.name+' largeur');
 const shape=p.shape||'rectangle',rect=[[0,0],[L,0],[L,W],[0,W]];
 if(shape==='rectangle')return rect;
 const A=req(p.shapeA,p.name+' retrait A'),B=req(p.shapeB,p.name+' retrait B');
 if(A>=L||B>=W)throw Error(p.name+' : mesures de forme supérieures aux dimensions.');
 if(shape==='L')return [[0,0],[L,0],[L,W-B],[L-A,W-B],[L-A,W],[0,W]];
 if(shape==='T'){const x1=(L-A)/2,x2=(L+A)/2;return [[0,0],[L,0],[L,B],[x2,B],[x2,W],[x1,W],[x1,B],[0,B]];}
 if(shape==='U'){const side=(L-A)/2;return [[0,0],[L,0],[L,W],[L-side,W],[L-side,W-B],[side,W-B],[side,W],[0,W]];}
 throw Error('Forme inconnue : '+shape);
}
export function roomSegments(work) {
 const pts=roomPolygon(work),ids='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 return pts.map((p,i)=>{
  const q=pts[(i+1)%pts.length];
  return {id:ids[i],length:r(Math.hypot(q[0]-p[0],q[1]-p[1])),from:p,to:q};
 });
}
export function roomArea(work) {
 const pts=roomPolygon(work);
 return r(Math.abs(pts.reduce((a,p,i)=>{
  const q=pts[(i+1)%pts.length];return a+p[0]*q[1]-q[0]*p[1];
 },0))/2);
}


export const PREP_DEFAULTS=Object.freeze({
 light:{hoursM2:0.10,consumablePriceM2:1},
 repair:{hoursM2:0.25,consumablePriceM2:3},
 skim:{hoursM2:0.45,consumablePriceM2:5}
});
export function preparationRates(p) {
 const level=p?.level||'none',base=(p?.supportType==='wood'?WOOD_PREP_DEFAULTS:PREP_DEFAULTS)[level];
 if(!base)return {hoursM2:0,consumablePriceM2:0};
 return {
  hoursM2:p?.hoursM2===''||p?.hoursM2==null?base.hoursM2:p.hoursM2,
  consumablePriceM2:p?.consumablePriceM2===''||p?.consumablePriceM2==null?base.consumablePriceM2:p.consumablePriceM2
 };
}

// Hypothèses de temps BOIS distinctes de la préparation des murs, à valider métier.
export const WOOD_PREP_DEFAULTS=Object.freeze({
 light:{hoursM2:0.15,consumablePriceM2:1},
 repair:{hoursM2:0.35,consumablePriceM2:3},
 skim:{hoursM2:0.65,consumablePriceM2:5}
});
export const COMMON_SUPPLIES=Object.freeze([
 {id:'masking',name:'Ruban de masquage 48 mm × 50 m',unit:'rouleau',unitPrice:2.47,priceSource:'Bati-Avenue, réf. LIMA 48×50 (repère HT novembre 2026)',url:'https://www.bati-avenue.com/ruban-de-masquage-masking-48mm-x-50m-lima-0000091040048.html'},
 {id:'floor',name:'Bâche de protection 4 × 5 m (20 m²)',unit:'bâche',unitPrice:3.55,priceSource:'Bati-Avenue L’Outil Parfait 40µm (repère HT novembre 2026)',url:'https://www.bati-avenue.com/bache-de-protection-epaisse-dimensions-4-x-5-m-surface-20-m-l-outil-parfait-1049000-l2861049000.html'},
 {id:'abrasive',name:'Abrasifs — lot de 10 feuilles',unit:'lot',unitPrice:2.92,priceSource:'Tecnomat réf. 394863 (repère HT novembre 2026)',url:'https://www.tecnomat.fr/produits/papier-abrasif-lot-de-10-394863.html'}
]);
export const PAINT_TYPES=Object.freeze(['acrylique','glycero','alkyde','autre']);
export const PAINT_FINISHES=Object.freeze(['mat','velours','satin','brillant','autre']);
// Repères issus de GSTAI-Sp/speedarti-v2, PeintreCalculateur.ts (LECTURE SEULE).
// Ce ne sont PAS des rendements/temps/prix fournisseur 2026 vérifiés.
export const DEMO_REFERENCE=Object.freeze({yieldAcrylique:10,yieldGlycero:12,yieldSatin:9,paintPotL:10,paintPricePerLHT:10,paintHoursPerLayerM2:0.15,prepHoursM2:0.2,wallpaperWidthM:0.53,wallpaperLengthM:10,wallpaperPriceHT:25,wallpaperHoursM2:0.25,hourlyRateHT:42});
export function demoYield(type,finish){return finish==='satin'?DEMO_REFERENCE.yieldSatin:type==='glycero'?DEMO_REFERENCE.yieldGlycero:DEMO_REFERENCE.yieldAcrylique;}
export function defaultPaint(){
 return {type:'acrylique',finish:'mat',color:'white',colorRef:'',layers:2,yield:DEMO_REFERENCE.yieldAcrylique,loss:10,potLitres:DEMO_REFERENCE.paintPotL,potPrice:DEMO_REFERENCE.paintPricePerLHT*DEMO_REFERENCE.paintPotL,priceSource:'historic-white',hoursM2:2*DEMO_REFERENCE.paintHoursPerLayerM2,autoHours:true};
}
export function defaultWallpaper(){
 return {kind:'classique',rollWidth:DEMO_REFERENCE.wallpaperWidthM,rollLength:DEMO_REFERENCE.wallpaperLengthM,repeatCm:0,loss:20,rollPrice:DEMO_REFERENCE.wallpaperPriceHT,panels:'',panelPrice:'',hoursM2:DEMO_REFERENCE.wallpaperHoursM2};
}
export function defaultPreparation(supportType='wall'){
 return {supportType,level:'none',hoursM2:'',consumablePriceM2:'',rates:{}};
}
export function newSurface(name='Mur',kind='wall'){
 return {id:uid(),name,active:true,kind,mode:'paint',length:3,height:2.5,areaOverride:'',
   paint:defaultPaint(),wallpaper:defaultWallpaper(),preparation:defaultPreparation(),openings:[]};
}
export function newOpening(){
 return {id:uid(),name:'Porte',type:'door',mode:'deduct',width:0.9,height:2.1,count:1,faces:1,paint:defaultPaint(),preparation:defaultPreparation('wood')};
}
export function newWork(type='room',name){
 if(type==='room'){
   const work={id:uid(),type,name:name||'Pièce',shape:'rectangle',shapeA:2,shapeB:1,length:5,width:4,height:2.5,walls:{},ceiling:newSurface('Plafond','ceiling'),
     plinth:{enabled:false,manualLength:0,hoursMl:0.1,pricePerMl:'',paintedHeightM:0.10,paint:defaultPaint(),includeWood:false,woodPriceMl:''}};
   for(const letter of 'ABCDEFGH')work.walls[letter]=newSurface('Mur '+letter,'wall');
   work.ceiling.active=true;return work;
 }
 if(type==='wall'){const s=newSurface('Mur simple','wall');s.length=4;return {id:uid(),type,name:name||'Mur simple',surface:s};}
 if(type==='surface'){const s=newSurface('Surface simple','surface');s.length=4;s.height=3;return {id:uid(),type,name:name||'Surface simple',surface:s};}
 throw Error('Type d’ouvrage inconnu.');
}
export function createDefaultState(){
 return {version:2.4,projectName:'Chiffrage peintre',works:[],manualPlinth:{length:0,hoursMl:0.1,pricePerMl:'',paintedHeightM:0.10,paint:defaultPaint()},
   labor:{hourlyRate:DEMO_REFERENCE.hourlyRateHT,workers:1},vatRate:20,taxContext:'new',taxEligibilityConfirmed:false,extras:[],supplies:COMMON_SUPPLIES.map(x=>({...x,enabled:false,quantity:1}))};
}
export function surfacesFor(work){
 if(work.type==='room')return [...roomSegments(work).map(seg=>work.walls[seg.id]),work.ceiling];
 return [work.surface];
}
export function getSurface(work,sid){return surfacesFor(work).find(s=>s.id===sid)||null;}
function resolved(work,s){
 if(work.type==='surface' && positive(s.areaOverride)){
   if(s.mode==='wallpaper')throw Error(s.name+' : dimensions longueur/largeur nécessaires pour le calepinage papier peint (désactivez la surface directe m²).');
   return {length:num(s.areaOverride),height:1};
 }
 if(work.type!=='room')return {length:req(s.length,s.name+' longueur'),height:req(s.height,s.name+' hauteur')};
 const len=req(work.length,work.name+' longueur'),width=req(work.width,work.name+' largeur'),h=req(work.height,work.name+' hauteur');
 if(s.id===work.ceiling.id)return {length:roomArea(work),height:1};
 const segment=roomSegments(work).find(seg=>work.walls[seg.id].id===s.id);
 if(!segment)throw Error('Segment de pièce introuvable');
 return {length:segment.length,height:h};
}
function productLines(lists,warnings,label,spec,area,unit){
 if(area<=0)return;
 const layers=req(spec.layers,label+' couches'),loss=nonneg(spec.loss,label+' pertes');
 if(loss>100)throw Error(label+' : pertes supérieures à 100 %.');
 const yieldValue=positive(spec.yield)?num(spec.yield):null;
 const pack=positive(spec.potLitres)?num(spec.potLitres):null;
 const price=(spec.color==='color'&&spec.priceSource==='historic-white'&&num(spec.potPrice)===DEMO_REFERENCE.paintPricePerLHT*DEMO_REFERENCE.paintPotL)?null:(valid(spec.potPrice)?num(spec.potPrice):null);
 if(yieldValue==null)missing(warnings,label+' : rendement fabricant absent.');
 if(pack==null)missing(warnings,label+' : conditionnement absent.');
 if(price==null)missing(warnings,label+(spec.color==='color'?' : prix HT du pot coloré à confirmer selon teinte.':' : prix HT du pot absent.'));
 const key=JSON.stringify([spec.type,spec.finish,spec.color,spec.colorRef,yieldValue,pack,price]);
 let group=lists.paintGroups.get(key);
 if(!group){group={key,label:'Peinture '+spec.type+' '+spec.finish+' '+(spec.color==='color'?'couleur '+(spec.colorRef||'(teinte à préciser)'):'blanche'),
   litresTheoriques:0,litresBesoin:0,canCompute:yieldValue!=null,pack,price,areas:[],unit};lists.paintGroups.set(key,group);}
 group.areas.push(label);
 if(yieldValue!=null){group.litresTheoriques+=area*layers/yieldValue;group.litresBesoin+=area*layers/yieldValue*(1+loss/100);}
 if(spec.color==='color'&&!String(spec.colorRef||'').trim())missing(warnings,label+' : référence couleur non renseignée.');
}
function labor(lists,warnings,label,area,hoursM2,rate,tag){
 if(area<=0)return;
 const ratio=valid(hoursM2)?num(hoursM2):null;
 if(ratio==null)missing(warnings,label+' : temps de main-d’œuvre à confirmer.');
 const hours=ratio==null?null:r(area*ratio);
 lists.lines.push({name:label,kind:'labor',tag,unit:'h-homme',quantity:hours,unitPrice:rate,amount:hours==null||rate==null?null:r(hours*rate),source:'repère historique SpeedArti / modifiable'});
}
function material(lists,warnings,label,area,costM2,tag){
 const cost=valid(costM2)?num(costM2):null;
 if(cost==null)missing(warnings,label+' : consommables à chiffrer.');
 lists.lines.push({name:label,kind:'material',tag,unit:'m²',quantity:r(area),unitPrice:cost,amount:cost==null?null:r(area*cost),source:'saisie artisan'});
}
function prepare(lists,warnings,label,area,prep,rate,tag,isWood=false){
 const level=prep?.level||'none';
 if(level==='none'||area<=0)return;
 const option=PREPARATIONS.find(o=>o.id===level);
 if(!option)throw Error(label+' : préparation inconnue.');
 const rates=preparationRates(prep);
 const title=isWood&&level==='skim'?'Réparation profonde (sans refabrication)':option.title;
 labor(lists,warnings,label+' — '+title,area,rates.hoursM2,rate,tag);
 material(lists,warnings,label+' — consommables '+title,area,rates.consumablePriceM2,tag);
}
function wallpaper(lists,warnings,label,s,width,height,netArea,rate,tag){
 const wp=s.wallpaper||{};const kind=wp.kind||'classique';
 if(kind==='panoramique'){
   const q=positive(wp.panels)&&Number.isInteger(num(wp.panels))?num(wp.panels):null;
   const p=valid(wp.panelPrice)?num(wp.panelPrice):null;
   if(q==null)missing(warnings,label+' : nombre de panneaux panoramiques à confirmer (calepinage).');
   if(p==null)missing(warnings,label+' : prix du panneau panoramique à confirmer.');
   lists.lines.push({name:label+' — panoramique',kind:'material',tag,unit:'panneau',quantity:q,unitPrice:p,
     amount:q==null||p==null?null:r(q*p),source:'référence panoramique à confirmer'});
 }else{
   const rollW=positive(wp.rollWidth)?num(wp.rollWidth):null,rollL=positive(wp.rollLength)?num(wp.rollLength):null;
   const repeat=nonneg(wp.repeatCm??0,label+' raccord')/100;
   const losses=nonneg(wp.loss??20,label+' pertes');
   if(losses>100)throw Error(label+' : pertes papier peint supérieures à 100 %.');
   const drop=repeat>0?Math.ceil(height/repeat)*repeat:height;
   const perRoll=rollL!=null&&drop>0?Math.floor(rollL/drop):null;
   let q=null;
   if(rollW!=null&&perRoll!=null&&perRoll>=1)q=Math.ceil(Math.ceil(width/rollW)/perRoll*(1+losses/100));
   const price=valid(wp.rollPrice)?num(wp.rollPrice):null;
   if(q==null)missing(warnings,label+' : format rouleau/hauteur de lé incompatible ou absent.');
   if(price==null)missing(warnings,label+' : prix du rouleau absent.');
   lists.lines.push({name:label+' — papier peint '+kind,kind:'material',tag,unit:'rouleau',quantity:q,unitPrice:price,
     amount:q==null||price==null?null:r(q*price),source:'estimation lés et raccords'});
   if(s.openings?.some(o=>(o.mode==='deduct'||o.mode==='both')&&num(o.count)>0))
     missing(warnings,label+' : ouvertures déduites des surfaces de pose, mais les lés sont approvisionnés sur largeur brute.');
 }
 labor(lists,warnings,label+' — pose papier peint',netArea,wp.hoursM2,rate,tag);
}
function openingGeometry(s,g,warnings){
 let deduction=0,supplements=[];
 for(const o of s.openings||[]){
   const count=nonneg(o.count??1,'Nombre ouvertures '+s.name);
   if(!Number.isInteger(count))throw Error('Nombre ouvertures : entier requis.');
   if(count===0)continue;
   const area=req(o.width,'Largeur ouverture')*req(o.height,'Hauteur ouverture')*count;
   if(!['deduct','supplement','both'].includes(o.mode))throw Error('Mode ouverture inconnu.');
   if(o.mode!=='supplement')deduction+=area;
   if(o.mode!=='deduct'){
     const faces=req(o.faces||1,'Faces menuiserie à peindre');
     if(!Number.isInteger(faces)||faces>2)throw Error('Nombre de faces menuiserie : 1 ou 2.');
     supplements.push({opening:o,area:area*faces});
   }
 }
 if(deduction>g.length*g.height+1e-8)throw Error(s.name+' : ouvertures supérieures à la surface.');
 return {deduction,supplements};
}
export function calculateEstimate(state){
 if(!Array.isArray(state?.works))throw Error('Liste des ouvrages manquante.');
 const lists={lines:[],paintGroups:new Map()},warnings=[],geometry=[];
 const rate=valid(state.labor?.hourlyRate)?num(state.labor.hourlyRate):null;
 const workers=req(state.labor?.workers,'Nombre ouvriers');
 if(!Number.isInteger(workers))throw Error('Nombre ouvriers : entier obligatoire.');
 const context=state.taxContext||'manual';
 const vat=context==='eligible_renovation'?(state.taxEligibilityConfirmed?10:20):context==='new'||context==='professional_local'?20:nonneg(state.vatRate,'TVA');
 if(![0,5.5,10,20].includes(vat))throw Error('Taux de TVA non autorisé dans la démo.');
 if(context==='eligible_renovation'&&!state.taxEligibilityConfirmed)missing(warnings,'TVA 10 % non confirmée : vérifier logement d’habitation ancien de plus de deux ans et travaux éligibles ; TVA 20 % retenue.');
 if(!state.works.length)missing(warnings,'Ajoutez au moins un ouvrage.');
 let active=0;
 for(const work of state.works){
   const surfaces=surfacesFor(work);let roomPlinth=0;
   for(const s of surfaces){
     if(!s.active||s.mode==='none')continue;
     const g=resolved(work,s),gross=g.length*g.height;
     const openings=openingGeometry(s,g,warnings);
     const net=Math.max(0,gross-openings.deduction);
     const tag=work.name+' / '+s.name;active++;
     geometry.push({workId:work.id,surfaceId:s.id,work:work.name,surface:s.name,kind:s.kind,
       gross:r(gross),deduction:r(openings.deduction),net:r(net),mode:s.mode,
       treatment:s.preparation?.level||'none'});
     if(s.mode==='paint'){
       productLines(lists,warnings,tag,s.paint,net,'pot');
       labor(lists,warnings,tag+' — application '+s.paint.finish,net,s.paint.hoursM2,rate,tag);
     }else if(s.mode==='wallpaper'){
       if(s.kind==='ceiling'&&work.type==='room'&&work.shape!=='rectangle')missing(warnings,tag+' : calepinage complexe non validé sur plafond '+work.shape+'.');
       wallpaper(lists,warnings,tag,s,g.length,g.height,net,rate,tag);
     }else throw Error('Revêtement inconnu : '+s.mode);
     prepare(lists,warnings,tag,net,s.preparation,rate,tag);
     if(work.type==='room'&&s.kind==='wall'&&s.mode==='paint'){
       let subtract=0;
       for(const o of s.openings||[]){
         if((o.mode==='deduct'||o.mode==='both')&&o.type==='door')subtract+=req(o.width,'Largeur porte')*nonneg(o.count,'Nombre portes');
       }
       roomPlinth+=Math.max(0,g.length-subtract);
     }
     for(const x of openings.supplements){
       const label=tag+' / '+(x.opening.name||'Menuiserie')+' ('+x.opening.faces+' face(s))';
       productLines(lists,warnings,label,x.opening.paint,x.area,'pot');
       labor(lists,warnings,label+' — peinture menuiserie',x.area,x.opening.paint.hoursM2,rate,label);
       prepare(lists,warnings,label,x.area,x.opening.preparation,rate,label,true);
       geometry.push({workId:work.id,surfaceId:x.opening.id,work:work.name,surface:label,kind:'menuiserie',
         gross:r(x.area),deduction:0,net:r(x.area),mode:'paint',treatment:x.opening.preparation?.level||'none'});
     }
   }
   if(work.type==='room'&&work.plinth?.enabled){
     const length=roomPlinth+nonneg(work.plinth.manualLength||0,'Ajout manuel plinthes');
     if(length>0){
       const label=work.name+' / plinthes';
       labor(lists,warnings,label+' — application',length,work.plinth.hoursMl,rate,label);
       const paintHeight=positive(work.plinth.paintedHeightM)?num(work.plinth.paintedHeightM):0.1;
       productLines(lists,warnings,label+' — peinture',work.plinth.paint||defaultPaint(),length*paintHeight,'pot');
       // Fournitures facultatives distinctes des pots de peinture (non comprises par défaut).
       if(positive(work.plinth.pricePerMl)){
         const price=num(work.plinth.pricePerMl);
         lists.lines.push({name:label+' — consommables supplémentaires',kind:'material',tag:label,unit:'ml',
           quantity:r(length),unitPrice:price,amount:r(length*price),source:'option artisan'});
       }
       if(work.plinth.includeWood){const pu=valid(work.plinth.woodPriceMl)?num(work.plinth.woodPriceMl):null;
         if(pu==null)missing(warnings,label+' : prix fourniture de plinthes bois manquant.');
         lists.lines.push({name:label+' — fourniture plinthes bois',kind:'material',tag:label,unit:'ml',quantity:r(length),unitPrice:pu,amount:pu==null?null:r(length*pu),source:'option bois activée'});
       }
       geometry.push({workId:work.id,surfaceId:'plinth-'+work.id,work:work.name,surface:'Plinthes',kind:'plinth',
         gross:r(length),deduction:0,net:r(length),mode:'paint',treatment:'none'});
     }
   }
 }

 // Les variantes physiques équivalentes ne doivent jamais être cumulées dans un même devis.
 const seenServices=new Map(),duplicatedServices=[];
 for(const opt of state.extras||[]){
   if(opt.enabled===false)continue;
   const key=opt.serviceKey||opt.catalogId||String(opt.name||'').toLowerCase().trim();
   if(seenServices.has(key))duplicatedServices.push(String(opt.name||key));
   else seenServices.set(key,opt);
 }
 if(duplicatedServices.length)missing(warnings,'Prestations équivalentes comptées plusieurs fois : '+duplicatedServices.join(', ')+'. Choisir une variante par ouvrage.');
 if((state.extras||[]).some(x=>x.enabled!==false && x.serviceKey==='plinth-paint') &&
     state.works.some(w=>w.type==='room'&&w.plinth?.enabled))
   {duplicatedServices.push('plinth-paint');missing(warnings,'Plinthes : choisir les plinthes automatiques OU l’option de peinture des plinthes, pas les deux.');}
  // Options sélectionnées : coût de fourniture et temps séparés ; prix manquant n'est jamais zéro.
 for(const [index,opt] of (state.extras||[]).entries()){
  if(!opt||opt.enabled===false)continue;
  const name=String(opt.name||'Prestation '+(index+1)).trim();
  const qty=req(opt.quantity,name+' quantité'),unit=String(opt.unit||'forfait');
  const mat=valid(opt.materialUnitHT)?num(opt.materialUnitHT):null;
  const duration=valid(opt.hoursPerUnit)?num(opt.hoursPerUnit):null;
  const isMajorations=/intervention en urgence|horaires décalés/i.test(name);
  if(isMajorations&&mat===0)missing(warnings,name+' : majoration commerciale à renseigner (0 € issu du barème n’est pas un prix de vente).');
  if(mat==null)missing(warnings,name+' : prix des fournitures à confirmer.');
  if(duration==null)missing(warnings,name+' : temps de réalisation à confirmer.');
  lists.lines.push({name:name+' — fournitures',kind:'material',tag:name,unit,quantity:qty,unitPrice:mat,
   amount:mat==null?null:r(qty*mat),source:opt.referenceSource?'barème indicatif Guillaume '+opt.referenceSource+' / ligne '+opt.referenceRow:'option / coût à valider',notes:opt.notes||''});
  lists.lines.push({name:name+' — main-d’œuvre',kind:'labor',tag:name,unit:'h-homme',quantity:duration==null?null:r(qty*duration),
   unitPrice:rate,amount:duration==null||rate==null?null:r(qty*duration*rate),source:opt.referenceSource?'barème indicatif Guillaume '+opt.referenceSource+' / ligne '+opt.referenceRow:'option / temps à valider',notes:opt.notes||''});
  if(name.toLowerCase().includes('humidité'))missing(warnings,'Humidité : résoudre et vérifier la cause avant traitement.');
  if(name.toLowerCase().includes('intumescente'))missing(warnings,'Peinture intumescente : système certifié et prescriptions applicables à vérifier.');
  if(name.toLowerCase().includes('prises et interrupteurs'))missing(warnings,'Électricité : dépose/repose à réaliser par une personne habilitée si nécessaire.');
 }
 // Consommables courants cochés par l'artisan. Aucun montant fictif ni double-compte implicite.
 for(const item of (state.supplies||[])){
   if(!item.enabled)continue;
   const quantity=req(item.quantity,item.name+' quantité');
   const price=valid(item.unitPrice)?num(item.unitPrice):null;
   if(price==null)missing(warnings,item.name+' : prix HT/unité à renseigner.');
   lists.lines.push({name:item.name,kind:'material',tag:'Consommables courants',unit:item.unit||'unité',
     quantity,unitPrice:price,amount:price==null?null:r(quantity*price),source:'sélection artisan / à valider'});
 }
 const manual=state.manualPlinth||{};
 if(positive(manual.length)){
   const length=num(manual.length),label='Plinthes ajoutées manuellement';
   labor(lists,warnings,label+' — application',length,manual.hoursMl,rate,label);
   const paintHeight=positive(manual.paintedHeightM)?num(manual.paintedHeightM):0.1;
   productLines(lists,warnings,label+' — peinture',manual.paint||defaultPaint(),length*paintHeight,'pot');
   if(positive(manual.pricePerMl)){
     const price=num(manual.pricePerMl);
     lists.lines.push({name:label+' — consommables supplémentaires',kind:'material',tag:label,unit:'ml',quantity:r(length),
       unitPrice:price,amount:r(length*price),source:'option artisan'});
   }
 }
 for(const group of lists.paintGroups.values()){
   const quantity=group.canCompute&&group.pack!=null?Math.ceil(group.litresBesoin/group.pack):null;
   lists.lines.push({name:group.label,kind:'material',tag:group.areas.join(' • '),unit:'pot',quantity,unitPrice:group.price,
     litresTheoriques:group.canCompute?r(group.litresTheoriques):null,litresBesoin:group.canCompute?r(group.litresBesoin):null,
     conditionnementLitres:group.pack,amount:quantity==null||group.price==null?null:r(quantity*group.price),
     source:'repère historique SpeedArti / à vérifier',prixIndicatif:true});
 }
 if(!active)missing(warnings,'Aucun support actif à chiffrer.');
 if(rate==null&&lists.lines.some(l=>l.kind==='labor'))missing(warnings,'Taux horaire de l’artisan à confirmer.');
 const lines=lists.lines;
 missing(warnings,'Tarifs, rendements et temps préremplis : repères historiques de démonstration SpeedArti V2, à vérifier avant un devis client.');
 const laborRows=lines.filter(l=>l.kind==='labor');
 const unestimatedTasks=laborRows.filter(l=>l.quantity==null).map(l=>l.name);
 const knownHoursMan=r(total(laborRows.filter(l=>l.quantity!=null).map(l=>l.quantity)));
 const hours=unestimatedTasks.length?null:knownHoursMan;
 const missingColor=warnings.some(w=>w.includes('référence couleur non renseignée'));
 const complexCeiling=warnings.some(w=>w.includes('calepinage complexe non validé'));
 const missingMajorations=warnings.some(w=>w.includes('majoration commerciale à renseigner'));
 const complete=active>0&&lines.length>0&&lines.every(l=>l.amount!==null)&&!missingColor&&!complexCeiling&&!missingMajorations&&!duplicatedServices.length;
 const confirmed=r(total(lines.filter(l=>l.amount!==null).map(l=>l.amount)));
 const ht=complete?confirmed:null,tax=complete?r(ht*vat/100):null;
 const byKind=kind=>{const rows=lines.filter(l=>l.kind===kind);return rows.every(l=>l.amount!==null)?r(total(rows.map(l=>l.amount))):null;};
 return {version:2.4,geometry,lines,warnings,complete,confirmedHT:confirmed,
   materialsHT:byKind('material'),laborHT:byKind('labor'),hoursMan:hours,knownHoursMan,unestimatedTasks,
   durationHours:hours==null?null:r(hours/workers),knownDurationHours:r(knownHoursMan/workers),totalHT:ht,vatRate:vat,taxHT:tax,ttc:ht==null?null:r(ht+tax)};
}
