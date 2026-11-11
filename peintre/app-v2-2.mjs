import {createDefaultState,newWork,newOpening,calculateEstimate,PREPARATIONS,PREP_DEFAULTS,WOOD_PREP_DEFAULTS,preparationRates,roomPolygon,roomSegments,roomArea,measureSurface,optionQuantity,demoYield,DEMO_REFERENCE} from './engine-v2.mjs';
import {OPTION_CATEGORIES} from './options-catalog-v2.mjs';
import {referenceForOption,alreadySelected,createExtra} from './guillaume-mapping-v2-4.mjs';
import {CLASSIFIED_OPTION_CATEGORIES,filterCategory} from './classified-options-v2-5.mjs';

let state=createDefaultState(),step=0,selected={wi:0,key:'A'},lastError='';
const categoryOpen=Object.fromEntries(CLASSIFIED_OPTION_CATEGORIES.map((g,i)=>[g.id,i===0]));
const optionSearch=Object.create(null);
let cartExpanded=false;
let cartScrollToLast=false;
let optionScope='';
const el=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>x==null?'À confirmer':Number(x).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const fmt=x=>x==null?'À confirmer':Number(x).toLocaleString('fr-FR',{maximumFractionDigits:2});
const get=path=>path.split('.').reduce((a,k)=>a?.[k],state);
const set=(path,value)=>{const fields=path.split('.');let target=state;for(const k of fields.slice(0,-1)){target=target[k];if(!target)throw Error('Champ absent : '+path);}target[fields.at(-1)]=value;};
const field=(title,path,value,type='number',help='')=>'<label class="field"><span>'+esc(title)+'</span><input type="'+type+'" data-path="'+esc(path)+'" value="'+esc(value)+'" '+(type==='number'?'step="0.01" min="0"':'')+' '+(help?'placeholder="'+esc(help)+'"':'')+'></label>';
const select=(title,path,val,opts)=>'<label class="field"><span>'+esc(title)+'</span><select data-path="'+esc(path)+'">'+opts.map(([v,l])=>'<option value="'+esc(v)+'" '+(String(v)===String(val)?'selected':'')+'>'+esc(l)+'</option>').join('')+'</select></label>';
const tick=(title,path,val)=>'<label class="tick"><input type="checkbox" data-path="'+esc(path)+'" '+(val?'checked':'')+'>'+esc(title)+'</label>';
const grid=(...fields)=>'<div class="grid-fields">'+fields.join('')+'</div>';
const card=(title,body)=>'<section class="card"><h3>'+esc(title)+'</h3>'+body+'</section>';
const button=(label,action,args='',klass='outline')=>'<button type="button" class="btn '+klass+'" data-action="'+action+'" '+args+'>'+label+'</button>';
const heading=(h,p)=>'<div class="section-heading"><div><span class="eyebrow">SPEEDARTI — PEINTRE V2.6</span><h1>'+h+'</h1><p>'+p+'</p></div></div>';
const gear=(title,html)=>'<details class="advanced"><summary aria-label="Ouvrir les paramètres de '+esc(title)+'"><span class="tool-icon" aria-hidden="true">⚙<small>🔧</small></span><strong>Paramètres '+esc(title)+'</strong><span class="advanced-chevron">▾</span></summary><div class="advanced-body">'+html+'</div></details>';
function current(){
 const wi=Math.min(Math.max(0,selected.wi),state.works.length-1);
 const w=state.works[wi];if(!w)return null;
 const segments=w.type==='room'?roomSegments(w).map(x=>x.id):['surface'];
 let key=selected.wi===wi?selected.key:segments[0];
 if(![...segments,...(w.type==='room'?['ceiling']:[])].includes(key))key=segments[0];
 const surface=w.type==='room'?(key==='ceiling'?w.ceiling:w.walls[key]):w.surface;
 const path='works.'+wi+(w.type==='room'?(key==='ceiling'?'.ceiling':'.walls.'+key):'.surface');
 return {wi,w,key,surface,path};
}
function plan(work,wi) {
 if(work.type!=='room')return '';
 const pts=roomPolygon(work),segs=roomSegments(work);
 const L=Math.max(...pts.map(p=>p[0])),H=Math.max(...pts.map(p=>p[1])),scale=Math.min(315/L,145/H);
 const ox=(400-L*scale)/2,oy=(250-H*scale)/2,px=p=>[ox+p[0]*scale,oy+p[1]*scale];
 return '<div class="plan-wrap"><svg role="img" viewBox="0 0 400 250" aria-label="Plan pièce '+esc(work.shape||'rectangle')+'">'
 +'<polygon points="'+pts.map(p=>px(p).join(',')).join(' ')+'" fill="#eaf3ff" stroke="#b2cdf3" stroke-width="2"/>'
 +segs.map(seg=>{
  const a=px(seg.from),b=px(seg.to),mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],sw=work.walls[seg.id],on=selected.wi===wi&&selected.key===seg.id;
  return '<g data-action="pick-support" data-wi="'+wi+'" data-key="'+seg.id+'" role="button" tabindex="0" aria-label="Mur '+seg.id+'" class="wall-hit '+(on?'picked':'')+'"><line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" class="wall-segment '+(sw.active?'enabled':'disabled')+'"/><line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" class="wall-touch"/><circle cx="'+mid[0]+'" cy="'+mid[1]+'" r="11" fill="white" stroke="#b2cdf3"/><text x="'+mid[0]+'" y="'+(mid[1]+4)+'" class="wall-letter" text-anchor="middle">'+seg.id+'</text></g>';
 }).join('')
 +'<g data-action="pick-support" data-wi="'+wi+'" data-key="ceiling" role="button" tabindex="0" aria-label="Plafond"><rect x="142" y="102" width="116" height="47" rx="9" fill="white" stroke="#bed6f5"/><text x="200" y="122" text-anchor="middle" class="ceiling-label">Plafond</text><text x="200" y="139" text-anchor="middle" class="ceiling-small">'+(work.ceiling.active?'Actif':'Exclu')+'</text></g></svg></div>';
}
function areaOutput(wi,s){
 let textValue='Cotes à vérifier';
 try{textValue=fmt(measureSurface(state.works[wi],s).net)+' m²';}catch(e){}
 return '<output class="area-value" aria-live="polite" data-area-work="'+wi+'" data-area-surface="'+esc(s.id)+'">'+textValue+'</output>';
}
function overview(w,wi){
 let surfaces;try{surfaces=w.type==='room'?[...roomSegments(w).map(k=>w.walls[k.id]),w.ceiling]:[w.surface];}
 catch(e){return '<p class="hint">Dimensions à corriger : '+esc(e.message)+'</p>';}
 return '<section class="work-area-overview"><h4>Surfaces calculées</h4><div class="area-stat-grid">'
 +surfaces.map(s=>{
  let meta='';
  try{const m=measureSurface(w,s);meta=fmt(m.gross)+' m² bruts'+(m.deduction?' − '+fmt(m.deduction)+' m² d’ouvertures':'');}catch(e){meta='Dimensions à vérifier';}
  return '<div class="area-stat"><span>'+esc(s.name)+(s.active?'':' (exclu)')+'</span>'+areaOutput(wi,s)+'<small>'+meta+'</small></div>';
 }).join('')+'</div></section>';
}
function activeScopes(){
 const rows=[];
 for(const w of state.works){
  let surfaces;try{surfaces=w.type==='room'?[...roomSegments(w).map(k=>w.walls[k.id]),w.ceiling]:[w.surface];}catch(e){continue;}
  for(const sf of surfaces){
   if(!sf.active||sf.mode==='none')continue;
   try{const m=measureSurface(w,sf);
    rows.push({key:w.id+'::'+sf.id,workId:w.id,surfaceId:sf.id,area:m.net,label:w.name+' — '+sf.name+' ('+fmt(m.net)+' m² nets)'});
   }catch(e){}
  }
 }
 return rows;
}
function effectiveScope(){
 const rows=activeScopes();
 if(optionScope==='manual')return 'manual';
 if(optionScope&&rows.some(x=>x.key===optionScope))return optionScope;
 return rows.length===1?rows[0].key:'';
}
function availableSelections(option){
 if(option.unit!=='m²')return state.extras;
 const scope=effectiveScope();
 if(!scope||scope==='manual')return state.extras;
 const [w,s]=scope.split('::');
 return state.extras.filter(x=>!x.autoQuantity||x.targetWorkId===w&&x.targetSurfaceId===s);
}
function alreadyForScope(option){return alreadySelected(option,availableSelections(option));}
function scopePicker(){
 const selected=effectiveScope();
 return '<label class="field"><span>Mur ou surface concerné(e) par les options au m²</span><select data-option-scope aria-label="Choisir le support pour les options">'
 +'<option value="" '+(!selected?'selected':'')+'>Sélectionner un support</option>'
 +activeScopes().map(x=>'<option value="'+esc(x.key)+'" '+(selected===x.key?'selected':'')+'>'+esc(x.label)+'</option>').join('')
 +'<option value="manual" '+(selected==='manual'?'selected':'')+'>Métrage libre à saisir</option></select></label>';
}
function extraScopePicker(opt,i){
 const value=opt.autoQuantity?opt.targetWorkId+'::'+opt.targetSurfaceId:opt.quantity===''?'':'manual';
 return '<label class="field cart-scope"><span>À appliquer sur</span><select data-extra-scope="'+i+'">'
 +'<option value="" '+(!value?'selected':'')+'>Choisir un support</option>'
 +activeScopes().map(x=>'<option value="'+esc(x.key)+'" '+(value===x.key?'selected':'')+'>'+esc(x.label)+'</option>').join('')
 +'<option value="manual" '+(value==='manual'?'selected':'')+'>Saisie libre</option></select></label>';
}
function updateAreaOutputs(){
 document.querySelectorAll?.('[data-area-work][data-area-surface]')?.forEach(el=>{
  const w=state.works[Number(el.dataset.areaWork)];if(!w)return;
  try{const sf=w.type==='room'?(w.ceiling.id===el.dataset.areaSurface?w.ceiling:Object.values(w.walls).find(x=>x.id===el.dataset.areaSurface)):w.surface;
    el.textContent=sf?fmt(measureSurface(w,sf).net)+' m²':'—';
  }catch(e){el.textContent='Cotes à vérifier';}
 });
}

function stepWorks(){
 return heading('Choix des ouvrages','Comme sur Plaquiste : créez des pièces Rectangle, L, T ou U, des murs simples ou des surfaces seules.')
 +'<div class="add-works">'+[['room','▣','Ajouter une pièce'],['wall','▥','Ajouter un mur simple'],['surface','◫','Ajouter une surface simple']].map(([kind,ico,title])=>'<button class="add-card" data-action="add-work" data-type="'+kind+'" type="button"><span class="add-ico">'+ico+'</span><strong>'+title+'</strong><span class="add-plus">+ Ajouter</span></button>').join('')+'</div>'
 +card('Chantier',grid(field('Nom du chiffrage','projectName',state.projectName,'text')))
 +(state.works.length?state.works.map((w,i)=>{
  const root='works.'+i;
  const fields=w.type==='room'?[
    select('Forme de la pièce',root+'.shape',w.shape||'rectangle',[['rectangle','Rectangle'],['L','Pièce en L'],['T','Pièce en T'],['U','Pièce en U']]),
    field('Longueur totale (m)',root+'.length',w.length),field('Largeur totale (m)',root+'.width',w.width),field('Hauteur (m)',root+'.height',w.height),
    ...(w.shape!=='rectangle'?[
      field(w.shape==='T'?'Largeur du pied (m)':w.shape==='U'?'Largeur ouverture (m)':'Largeur du retrait (m)',root+'.shapeA',w.shapeA),
      field(w.shape==='T'?'Profondeur barre haute (m)':'Profondeur du retrait (m)',root+'.shapeB',w.shapeB)
    ]:[])
  ]:[field('Longueur (m)',root+'.surface.length',w.surface.length),
       field(w.type==='wall'?'Hauteur (m)':'Largeur (m)',root+'.surface.height',w.surface.height),
       ...(w.type==='surface'?[field('Surface directe (m², facultatif)',root+'.surface.areaOverride',w.surface.areaOverride)]:[])];
  let preview='';
  if(w.type==='room')try{preview='<div class="shape-preview">'+plan(w,i)+'<p class="hint">'+roomSegments(w).length+' murs • '+fmt(roomArea(w))+' m² de plafond</p></div>';}catch(e){preview='<div class="alert error">'+esc(e.message)+'</div>';}
  return '<article class="work-card"><div class="work-header"><div class="work-num">'+(i+1)+'</div><strong>'+esc(w.name)+'</strong><div class="work-actions">'
   +button('Configurer','pick-work','data-wi="'+i+'"','primary')+button('Supprimer','remove-work','data-wi="'+i+'"','danger')+'</div></div>'
   +grid(field('Nom',root+'.name',w.name,'text'),...fields)
   +(w.type==='room'?'<div class="shape-ceiling">'+tick('Inclure le plafond',root+'.ceiling.active',w.ceiling.active)+'</div>':'')
   +preview+overview(w,i)+'</article>';
 }).join(''):'<div class="empty">Ajoutez une pièce, un mur ou une surface pour commencer.</div>');
}
function paintEditor(path,p){
 return grid(
  select('Peinture',path+'.type',p.type,[['acrylique','Acrylique'],['glycero','Glycéro'],['alkyde','Alkyde'],['autre','Autre']]),
  select('Finition',path+'.finish',p.finish,[['mat','Mat'],['velours','Velours'],['satin','Satin'],['brillant','Brillant'],['autre','Autre']]),
  select('Teinte',path+'.color',p.color,[['white','Blanc'],['color','Couleur']]),
  ...(p.color==='color'?[field('Référence RAL/NCS',path+'.colorRef',p.colorRef,'text')]:[]),
  field('Couches',path+'.layers',p.layers)
 )+(p.color==='color'&&p.priceSource!=='artisan'?'<p class="hint" style="color:#b45309;font-weight:700">Peinture colorée : renseignez la référence et confirmez le prix du pot dans les paramètres ⚙. Le prix blanc historique n’est pas utilisé automatiquement.</p>':'')+gear('peinture',grid(
   field('Rendement fabricant (m²/L/couche)',path+'.yield',p.yield),
   field('Pertes (%)',path+'.loss',p.loss),
   field('Conditionnement (L/pot)',path+'.potLitres',p.potLitres),
   field(p.color==='color'?'Prix du pot COLORÉ HT (€) — obligatoire':'Prix HT / pot (€)',path+'.potPrice',p.potPrice),
   field('Temps de pose (h/m², couches comprises)',path+'.hoursM2',p.hoursM2)
 )+'<p class="hint">Repères historiques de démonstration, modifiables. Non certifiés fournisseur.</p>');
}
function wallpaperEditor(path,p){
 return grid(
   select('Papier peint',path+'.kind',p.kind,[['classique','Classique'],['intisse','Intissé'],['vinyle','Vinyle'],['panoramique','Panoramique']]),
   ...(p.kind==='panoramique'?[field('Panneaux validés',path+'.panels',p.panels),field('Prix HT / panneau (€)',path+'.panelPrice',p.panelPrice)]:[field('Prix HT / rouleau (€)',path+'.rollPrice',p.rollPrice)])
 )+gear('papier peint',grid(
  ...(p.kind!=='panoramique'?[field('Largeur rouleau (m)',path+'.rollWidth',p.rollWidth),field('Longueur rouleau (m)',path+'.rollLength',p.rollLength)]:[]),
  field('Raccord motif (cm)',path+'.repeatCm',p.repeatCm),
  field('Pertes (%)',path+'.loss',p.loss),
  field('Temps de pose (h/m²)',path+'.hoursM2',p.hoursM2)
 ))+'<p class="hint">Le panoramique exige le calepinage et un nombre de panneaux confirmé.</p>';
}
function preparationEditor(path,p,wood=false){
 const levels=PREPARATIONS.map(x=>[x.id,wood&&x.id==='skim'?'Réparation profonde (sans refabrication)':x.title]);
 const rate=preparationRates(p);
 return select('Préparation du support',path+'.level',p.level,levels)+(p.level!=='none'?gear('préparation',grid(
  field('Temps de préparation (h/m²)',path+'.hoursM2',rate.hoursM2),
  field('Consommables HT/m² (€)',path+'.consumablePriceM2',rate.consumablePriceM2)
 )+'<p class="hint">Coûts de démonstration : léger 1 €, rattrapage 3 €, profond 5 €/m². '+(wood?'Temps dédiés aux boiseries (0,15 / 0,35 / 0,65 h/m²), à valider avant devis.':'Temps distincts des murs, modifiables.')+'</p>'):'');
}
function openingEditor(root,s){
 return '<div class="opening-head"><p class="hint">Ouvertures : déduction, menuiserie à peindre en supplément, ou les deux.</p>'+button('+ Ouverture','add-opening','data-root="'+esc(root)+'"','small-primary')+'</div>'
 +(s.openings.length?s.openings.map((o,i)=>{
  const p=root+'.openings.'+i;
  return '<div class="opening-block"><div class="opening-header"><strong>Ouverture '+(i+1)+'</strong>'+button('Retirer','remove-opening','data-root="'+esc(root)+'" data-index="'+i+'"','danger')+'</div>'
  +grid(field('Nom',p+'.name',o.name,'text'),
   select('Nature',p+'.type',o.type,[['door','Porte'],['window','Fenêtre'],['other','Autre']]),
   select('Traitement',p+'.mode',o.mode,[['deduct','Déduire'],['supplement','Menuiserie à peindre en supplément'],['both','Déduire + peindre']]),
   field('Nombre',p+'.count',o.count),field('Largeur (m)',p+'.width',o.width),field('Hauteur (m)',p+'.height',o.height))
  +(o.mode!=='deduct'?'<div class="nested">'+select('Faces peintes',p+'.faces',o.faces,[[1,'1 face'],[2,'2 faces']])
    +paintEditor(p+'.paint',o.paint)+preparationEditor(p+'.preparation',o.preparation,true)+'</div>':'')+'</div>';
 }).join(''):'<p class="hint">Aucune ouverture sur ce support.</p>');
}
function stepSupports(){
 let c;try{c=current();}catch(err){return heading('Forme à corriger',err.message);}
 if(!c)return heading('Supports','Ajoutez d’abord un ouvrage.');
 const {w,wi,key,surface:s,path}=c;
 return heading('Revêtements par support','Une finition et une préparation par mur, plafond ou surface. Les données avancées sont accessibles par ⚙ et 🔧.')
 +'<div class="config-layout"><aside class="config-side"><h3>Ouvrages</h3>'
 +state.works.map((x,i)=>button(esc(x.name),'pick-work','data-wi="'+i+'"','work-tab '+(i===wi?'active':''))).join('')
 +(w.type==='room'?plan(w,wi)+'<div class="wall-tabs">'+[...roomSegments(w).map(seg=>seg.id),'ceiling'].map(k=>{
  const sw=k==='ceiling'?w.ceiling:w.walls[k];
  return button(k==='ceiling'?'Plafond':k,'pick-support','data-wi="'+wi+'" data-key="'+k+'"','wall-btn '+(key===k?'selected':'')+' '+(sw.active?'':'inactive'));
 }).join('')+'</div>':'')
 +(w.type==='room'?'<div class="side-plinth">'+tick('Plinthes automatiques (uniquement peinture)','works.'+wi+'.plinth.enabled',w.plinth.enabled)
 +(w.plinth.enabled?gear('plinthes',grid(
  field('Ajout manuel dans cette pièce (ml)','works.'+wi+'.plinth.manualLength',w.plinth.manualLength),
  field('Temps plinthes (h/ml)','works.'+wi+'.plinth.hoursMl',w.plinth.hoursMl),
  field('Hauteur peinte (m)','works.'+wi+'.plinth.paintedHeightM',w.plinth.paintedHeightM),
  field('Consommables en supplément HT/ml (facultatif)','works.'+wi+'.plinth.pricePerMl',w.plinth.pricePerMl)
 )+tick('Inclure fourniture de plinthes bois (hors peinture)','works.'+wi+'.plinth.includeWood',w.plinth.includeWood)
 +(w.plinth.includeWood?field('Fourniture bois HT/ml','works.'+wi+'.plinth.woodPriceMl',w.plinth.woodPriceMl):'')
 +'<p class="hint">La peinture des plinthes est calculée en litres et regroupée avec les pots du chantier ; le bois est exclu par défaut.</p>'+paintEditor('works.'+wi+'.plinth.paint',w.plinth.paint)):'')+'</div>':'')
 +'</aside><section class="editor-column"><div class="support-top"><div><h2>'+esc(s.name)+'</h2><div class="surface-area-summary">Surface nette : '+areaOutput(wi,s)+'</div></div>'+tick('Inclure',path+'.active',s.active)+'</div>'
 +(s.active?'<div class="support-body">'
  +(w.type!=='room'?card('Dimensions',grid(field('Longueur (m)',path+'.length',s.length),field(w.type==='wall'?'Hauteur (m)':'Largeur (m)',path+'.height',s.height),
    ...(w.type==='surface'?[field('Surface directe (m²)',path+'.areaOverride',s.areaOverride)]:[]))+'<div class="area-highlight">Surface calculée : '+areaOutput(wi,s)+'</div>'):'<p class="note">Dimensions calculées automatiquement depuis la géométrie de la pièce.</p>')
  +card('Revêtement',select('Type',path+'.mode',s.mode,[['paint','Peinture'],['wallpaper','Papier peint'],['none','Aucun']])
    +(s.mode==='paint'?paintEditor(path+'.paint',s.paint):s.mode==='wallpaper'?wallpaperEditor(path+'.wallpaper',s.wallpaper):''))
  +card('Préparation',preparationEditor(path+'.preparation',s.preparation))
  +(s.mode!=='none'?card('Menuiseries et ouvertures',openingEditor(path,s)):'')
  +'</div>':'<div class="excluded">Support désactivé et exclu du chiffrage.</div>')
 +'</section></div>';
}
function classifiedOptions(group){
 const query=optionSearch[group.id]||'';
 const filtered=filterCategory(group,query);
 const expanded=categoryOpen[group.id]===true;
 const items=filtered.map(item=>{
   const variants=item.variants.length?item.variants:[{id:item.id,label:item.label,unit:item.unit,materialUnitHT:null,hoursPerUnit:null}];
   const actions=variants.map(v=>{
     const already=alreadyForScope(v);
     const isKnown=v.materialUnitHT!=null&&v.hoursPerUnit!=null;
     const label=variants.length>1?'+ '+esc(v.unit):'+ Ajouter';
     const helper=isKnown
       ?fmt(v.materialUnitHT)+' € HT/'+esc(v.unit)+' fourn. • '+fmt(v.hoursPerUnit)+' h/'+esc(v.unit)
       :'Prix et temps à compléter';
     return '<div class="variant-option"><div><strong>'+esc(v.unit)+'</strong><small>'+helper
         +(v.source?'<span class="source">Référence Guillaume · '+esc(v.source)+' ligne '+esc(v.sourceRow)+'</span>':'')+'</small></div>'
         +button(already?'Déjà sélectionnée ✓':label,'add-extra','data-option="'+esc(v.id)+'" '+(already?'disabled':''),'small-primary')+'</div>';
   }).join('');
   return '<article class="classified-option" data-option-id="'+esc(item.id)+'"><div class="option-details"><strong>'+esc(item.label)+'</strong>'
     +(item.variants.length>1?'<span class="option-variant-note">'+item.variants.length+' variantes de chiffrage — choisir une unité</span>':'')
     +(item.variants.length===0?'<small>Pas de barème équivalent certain : saisie manuelle</small>':'')+'</div>'
     +'<div class="variant-list">'+actions+'</div></article>';
 }).join('');
 return '<section class="classified-category" data-category="'+esc(group.id)+'">'
 +'<button class="category-toggle" data-action="toggle-category" data-category="'+esc(group.id)+'" aria-expanded="'+expanded+'">'
  +'<span><strong>'+esc(group.name)+'</strong><small>'+group.items.length+' prestations / variantes disponibles</small></span>'
  +'<span class="category-arrow" aria-hidden="true">'+(expanded?'−':'+')+'</span></button>'
 +(expanded?'<div class="classified-body"><label class="category-search-label" for="search-'+esc(group.id)+'">Rechercher dans '+esc(group.name.toLowerCase())+'</label>'
  +'<div class="category-search"><span aria-hidden="true">⌕</span><input id="search-'+esc(group.id)+'" type="search" data-category-search="'+esc(group.id)+'" value="'+esc(query)+'" placeholder="Rechercher une prestation ou un revêtement..." autocomplete="off" aria-label="Rechercher dans '+esc(group.name)+'"></div>'
  +'<p class="category-count" data-search-count="'+esc(group.id)+'">'+filtered.length+' / '+group.items.length+' prestations affichées</p>'
  +'<div class="classified-rows" data-search-list="'+esc(group.id)+'">'+items+'<div class="empty-option" '+(filtered.length?'hidden':'')+'>Aucun résultat dans cette catégorie.</div></div></div>':'')
 +'</section>';
}
function moneyOrPending(value) {
 return value===null||value===undefined||value===''?'À confirmer':money(value);
}
function optionTotals(opt){
 const qtySource=optionQuantity(state,opt);
 const q=qtySource.quantity===null||qtySource.quantity===''?NaN:Number(qtySource.quantity),price=opt.materialUnitHT===''?null:Number(opt.materialUnitHT),hours=opt.hoursPerUnit===''?null:Number(opt.hoursPerUnit);
 const rate=Number(state.labor.hourlyRate);
 const quantity=Number.isFinite(q)&&q>0?q:0;
 const validPrice=price!==null&&Number.isFinite(price)&&price>=0;
 const validHours=hours!==null&&Number.isFinite(hours)&&hours>=0;
 const material=validPrice?quantity*price:null,labour=validHours&&Number.isFinite(rate)?quantity*hours*rate:null;
 return {material,labour,hours:validHours&&Number.isFinite(q)?quantity*hours:null,amount:!Number.isFinite(q)||material===null||labour===null?null:material+labour,qtySource};
}
function cartView(){
 const totals=state.extras.map(optionTotals);
 const complete=totals.every(x=>x.amount!==null);
 const known=totals.filter(x=>x.amount!==null).reduce((sum,x)=>sum+x.amount,0);
 const content=state.extras.length?state.extras.map((o,i)=>{
  const path='extras.'+i,price=optionTotals(o);
  return '<article class="cart-item"><div class="cart-item-top"><div><strong>'+esc(o.name)+'</strong>'
   +'<small>'+esc(o.referenceSource?o.referenceSource+' · ligne '+o.referenceRow:'Prestation à paramétrer')+'</small></div>'
   +button('✕','remove-extra','data-index="'+i+'" aria-label="Supprimer '+esc(o.name)+'"','danger')+'</div>'
   +(o.unit==='m²'?extraScopePicker(o,i):'')
   +'<div class="cart-fields">'+(o.autoQuantity?'<div class="cart-auto-quantity"><span>Surface nette automatique</span><strong>'+(price.qtySource.quantity===null?'À confirmer':fmt(price.qtySource.quantity)+' m²')+'</strong><small>Actualisée si les dimensions ou ouvertures changent</small></div>':field('Quantité',path+'.quantity',o.quantity))
   +(o.referenceId?'<div class="cart-unit"><span>Unité du barème</span><strong>'+esc(o.unit)+'</strong></div>':
      select('Unité',path+'.unit',o.unit,[['forfait','Forfait'],['m²','m²'],['ml','ml'],['unité','Unité']]))
   +field('Fournitures HT / '+esc(o.unit),path+'.materialUnitHT',o.materialUnitHT)
   +field('Temps h / '+esc(o.unit),path+'.hoursPerUnit',o.hoursPerUnit)+'</div>'
   +(price.qtySource.reason?'<small class="cart-note cart-error">'+esc(price.qtySource.reason)+'</small>':'')
   +(o.notes?'<small class="cart-note">'+esc(o.notes)+'</small>':'')
   +'<div class="cart-line-total">'+(price.amount===null?'<span>À compléter</span>':'<strong>'+money(price.amount)+' HT</strong>')+'</div>'
   +'</article>';
 }).join(''):'<div class="cart-empty">Cliquez sur une prestation à gauche pour l’ajouter au panier.</div>';
 return '<aside id="peintre-options-cart" class="options-cart '+(cartExpanded?'expanded':'')+'" aria-label="Panier des prestations sélectionnées">'
   +'<div class="cart-header"><span><strong>Panier des options</strong><small>'+state.extras.length+' prestation(s) sélectionnée(s)</small></span>'
   +'<button type="button" class="cart-mobile-toggle" data-action="toggle-cart" aria-label="'+(cartExpanded?'Réduire':'Ouvrir')+' le panier" aria-expanded="'+cartExpanded+'">'+(cartExpanded?'−':'+')+'</button></div>'
   +'<div class="cart-content"><div class="cart-list">'+content+'</div>'
   +'<div class="cart-total"><span>'+(complete?'Sous-total options HT':'Sous-total connu HT · incomplet')+'</span><strong>'+money(known)+'</strong></div>'
   +(!complete?'<p class="cart-warning">Certaines prestations attendent un prix ou un temps. Le total du devis reste incomplet.</p>':'')
   +'<p class="cart-disclaimer">Tarifs de fournitures HT et temps indicatifs issus des barèmes Guillaume, modifiables. Le taux horaire entreprise complète la main-d’œuvre.</p></div></aside>';
}
function fiscalFields(){
 return grid(
  select('Type de chantier','taxContext',state.taxContext,[
   ['new','Construction neuve — 20 %'],
   ['professional_local','Local professionnel — 20 %'],
   ['eligible_renovation','Rénovation d’un logement de plus de 2 ans — 10 % si éligible'],
   ['manual','Autre / taux à valider']
  ]),
  field('Nombre d’ouvriers','labor.workers',state.labor.workers),
  ...(state.taxContext==='manual'?[select('Taux TVA à confirmer','vatRate',state.vatRate,[[20,'20 %'],[10,'10 %'],[5.5,'5,5 %'],[0,'0 %']])]:[])
 )+(state.taxContext==='eligible_renovation'?
 tick('Je confirme l’ancienneté du logement et l’éligibilité des travaux au taux de 10 %','taxEligibilityConfirmed',state.taxEligibilityConfirmed):'')
 +'<p class="hint">Le taux de 10 % n’est pas automatique pour toutes les rénovations ; les règles fiscales applicables doivent être vérifiées avant devis.</p>';
}
function stepOptions(){
 return heading('Options','Toutes les prestations Peintre et les 92 références Guillaume sont réparties dans les six familles métier. Recherchez, sélectionnez, puis modifiez votre panier sur le côté.')
 +card('Paramètres du chantier — avant les options',fiscalFields()
   +'<div class="company-rate"><span>Taux horaire entreprise</span><strong>'+money(state.labor.hourlyRate)+' / h</strong><small>Valeur de démonstration : les paramètres entreprise seront utilisés dans SpeedArti.</small></div>'
   +gear('taux horaire entreprise (simulation uniquement)',field('Taux horaire HT (€)','labor.hourlyRate',state.labor.hourlyRate)))
 +'<div class="options-layout"><div class="options-catalog">'
 +card('Support ciblé pour les prestations au m²',scopePicker()+'<p class="hint">Les options au m² reprennent la surface nette du mur ou plafond sélectionné, avec les déductions d’ouvertures. La quantité se recalcule si les cotes changent. Forfaits et unités restent manuels.</p>')
 +'<h2>Choisissez vos prestations</h2>'
 +'<p class="hint">Six familles, sans rubrique « Barème Guillaume » séparée. Les options aux unités différentes restent des variantes d’un même service.</p>'
 +CLASSIFIED_OPTION_CATEGORIES.map(classifiedOptions).join('')
 +card('Consommables courants (facultatifs)', '<p class="hint">Rubans, bâches et abrasifs : prix indicatifs HT modifiables.</p>'
  +(state.supplies||[]).map((x,i)=>'<div class="extra-edit">'+tick(esc(x.name)+' — '+esc(x.unit),'supplies.'+i+'.enabled',x.enabled)
  +(x.enabled?grid(field('Quantité','supplies.'+i+'.quantity',x.quantity),field('Prix HT / '+esc(x.unit),'supplies.'+i+'.unitPrice',x.unitPrice)):'')
  +'<p class="hint">Prix de départ HT indicatif : '+money(x.unitPrice)+' / '+esc(x.unit)+'. '+esc(x.priceSource||'')+' · modifiable.</p></div>').join(''))
 +card('Plinthes supplémentaires',gear('ajout manuel hors pièces',grid(
   field('Longueur (ml)','manualPlinth.length',state.manualPlinth.length),
   field('Hauteur peinte (m)','manualPlinth.paintedHeightM',state.manualPlinth.paintedHeightM),
   field('Temps (h/ml)','manualPlinth.hoursMl',state.manualPlinth.hoursMl),
   field('Consommables supplémentaires HT/ml','manualPlinth.pricePerMl',state.manualPlinth.pricePerMl)
 )+paintEditor('manualPlinth.paint',state.manualPlinth.paint)))
 +'</div>'+cartView()+'</div>';
}

function stepResults(){
 let res;try{res=calculateEstimate(state);}catch(err){return heading('Résultats','Corrigez les informations de vos ouvrages.')+'<div class="alert error">'+esc(err.message)+'</div>';}
 const rows=(kind)=>res.lines.filter(x=>x.kind===kind).map(x=>'<tr><td>'+esc(x.name)+'<small class="row-sub">'+esc(x.tag)+'</small></td><td>'+fmt(x.quantity)+' '+esc(x.unit)+'</td><td>'+money(x.unitPrice)+'</td><td><strong>'+money(x.amount)+'</strong></td></tr>').join('');
 const table=(kind)=>'<div class="scroll-table"><table><thead><tr><th>Poste</th><th>Quantité</th><th>Prix HT/unité</th><th>Total HT</th></tr></thead><tbody>'+rows(kind)+'</tbody></table></div>';
 return heading('Résultats du chiffrage','Fournitures et temps de travail sont séparés. Choisissez le nombre d’ouvriers pour obtenir la durée du chantier.')
 +card('Contexte fiscal du chantier',grid(
  select('Type de chantier', 'taxContext',state.taxContext,[['new','Construction neuve'],['professional_local','Local professionnel'],['eligible_renovation','Rénovation logement (> 2 ans) potentiellement éligible'],['manual','Autre / taux à valider']]),
  ...(state.taxContext==='manual'?[select('Taux TVA à confirmer','vatRate',state.vatRate,[[20,'20 %'],[10,'10 %'],[5.5,'5,5 %'],[0,'0 % (justifié)']])]:[]))
  +(state.taxContext==='eligible_renovation'?tick('Je confirme logement ancien et travaux éligibles à 10 %','taxEligibilityConfirmed',state.taxEligibilityConfirmed):'')
  +'<p class="hint">Le taux de 10 % n’est pas automatique pour toute rénovation. Vérifier les conditions fiscales applicables avant devis.</p>') +card('Effectif pour la durée du chantier',grid(field('Nombre d’ouvriers','labor.workers',state.labor.workers))+'<p class="hint">Les heures-homme et leur coût restent identiques ; seule la durée chantier est divisée par le nombre d’ouvriers.</p>')
 +'<div class="metrics">'+[
 ['Heures-homme',res.hoursMan==null?fmt(res.knownHoursMan)+' h connues*':fmt(res.hoursMan)+' h'],['Durée chantier',res.durationHours==null?fmt(res.knownDurationHours)+' h connues*':fmt(res.durationHours)+' h'],
 ['Fournitures HT',money(res.materialsHT)],['Main-d’œuvre HT',money(res.laborHT)],
 ['Total HT',money(res.totalHT)],['TVA '+fmt(res.vatRate)+' %',money(res.taxHT)],['Total TTC',money(res.ttc)]
 ].map(([k,v])=>'<div class="metric"><small>'+k+'</small><strong>'+v+'</strong></div>').join('')+'</div>'
 +(res.unestimatedTasks.length?'<div class="alert error">* Heures partielles : '+fmt(res.knownHoursMan)+' heures-homme calculées, mais '+res.unestimatedTasks.length+' prestation(s) sans temps. Les durées affichées sont des minima, pas un planning définitif.</div>':'')
 +card('Métrés', '<div class="scroll-table"><table><thead><tr><th>Support</th><th>Surface brute</th><th>Déductions</th><th>Surface nette</th></tr></thead><tbody>'
  +res.geometry.map(g=>'<tr><td>'+esc(g.work)+' / '+esc(g.surface)+'</td><td>'+fmt(g.gross)+'</td><td>'+fmt(g.deduction)+'</td><td><strong>'+fmt(g.net)+'</strong></td></tr>').join('')+'</tbody></table></div>')
 +card('Matériaux et fournitures',table('material'))
 +card('Temps de travail / main-d’œuvre',table('labor'))
 +(res.complete?'<div class="info ok">Chiffrage indicatif calculé. Les références fournisseur et la fiscalité restent à vérifier.</div>':
  '<div class="alert error">Chiffrage incomplet : vérifier les montants manquants. Sous-total des lignes calculables : '+money(res.confirmedHT)+'.</div>')
 +(res.warnings.length?card('Points à vérifier','<ul class="warnings">'+res.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul>'):'')
 +button('Exporter le chiffrage en JSON','export','','primary');
}
function render(){
 const previousCart=el('content').querySelector?.('.cart-content');
 const previousScroll=previousCart?.scrollTop||0;
 const names=['Ouvrages','Revêtements','Options','Résultats'];
 el('steps').innerHTML=names.map((v,i)=>'<button class="step '+(step===i?'active':'')+'" data-action="go" data-index="'+i+'" '+(i>0&&!state.works.length?'disabled':'')+'><b>'+(i+1)+'. '+v+'</b></button>').join('');
 try{el('content').innerHTML=[stepWorks,stepSupports,stepOptions,stepResults][step]();lastError='';}
 catch(e){lastError=e.message;el('content').innerHTML='<div class="alert error">'+esc(e.message)+'</div>';}
 if(step===2){
  const cart=el('content').querySelector?.('.cart-content');
  if(cart){cart.scrollTop=cartScrollToLast?cart.scrollHeight:previousScroll;}
 }
 cartScrollToLast=false;
 el('previous').disabled=step===0;el('next').disabled=step===3||!state.works.length;
 el('next').textContent=step===2?'Calculer →':'Suivant →';
 el('stepcount').textContent='Étape '+(step+1)+' / 4';
}
function go(index){if(index<0||index>3||(index>0&&!state.works.length))return;step=index;render();window.scrollTo?.({top:0,behavior:'auto'});}
function act(t){
 const action=t.dataset.action,wi=Number(t.dataset.wi),index=Number(t.dataset.index);
 if(action==='go'){go(index);return;}
 if(action==='add-work'){
  const type=t.dataset.type,number=state.works.filter(x=>x.type===type).length+1;
  state.works.push(newWork(type,(type==='room'?'Pièce ':type==='wall'?'Mur simple ':'Surface simple ')+number));
  selected={wi:state.works.length-1,key:type==='room'?'A':'surface'};render();return;
 }
 if(action==='remove-work'){state.works.splice(wi,1);selected={wi:0,key:'A'};optionScope='';render();return;}
 if(action==='pick-work'){selected={wi,key:state.works[wi].type==='room'?'A':'surface'};
  const w=state.works[wi],sf=w.type==='room'?w.walls.A:w.surface;
  optionScope=w.id+'::'+sf.id;go(1);return;}
 if(action==='pick-support'){selected={wi,key:t.dataset.key};
  const w=state.works[wi],sf=w.type==='room'?(selected.key==='ceiling'?w.ceiling:w.walls[selected.key]):w.surface;
  if(sf)optionScope=w.id+'::'+sf.id;
  if(step===0)go(1);else render();return;}
 if(action==='add-opening'){get(t.dataset.root).openings.push(newOpening());render();return;}
 if(action==='remove-opening'){get(t.dataset.root).openings.splice(index,1);render();return;}
 if(action==='add-extra'){
  const opt=[...OPTION_CATEGORIES,...CLASSIFIED_OPTION_CATEGORIES].flatMap(g=>g.items.flatMap(x=>[x,...(x.variants||[])])).find(x=>x.id===t.dataset.option);
  if(opt&&!alreadyForScope(opt)){
    const extra=createExtra(opt),scope=effectiveScope();
    if(extra.unit==='m²'&&scope&&scope!=='manual'){
      const target=activeScopes().find(x=>x.key===scope);
      if(target){
        extra.autoQuantity=true;extra.targetWorkId=target.workId;extra.targetSurfaceId=target.surfaceId;
        extra.quantity=target.area;
      }
    }else if(extra.unit==='m²'&&!scope){extra.quantity='';}
    state.extras.push(extra);cartExpanded=true;cartScrollToLast=true;
  }
  render();return;
 }
 if(action==='remove-extra'){state.extras.splice(index,1);render();return;}
 if(action==='toggle-category'){const cat=t.dataset.category;categoryOpen[cat]=!categoryOpen[cat];render();return;}
 if(action==='toggle-cart'){cartExpanded=!cartExpanded;render();return;}
 if(action==='export'){
  const data={origin:'SpeedArti démo Peintre V2.5',state,result:calculateEstimate(state)};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download='speedarti-peintre-v2-5-demo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);
 }
}
function onChange(t){
 if(t.dataset.optionScope!==undefined){optionScope=t.value;render();return;}
 if(t.dataset.extraScope!==undefined){
   const i=Number(t.dataset.extraScope),extra=state.extras[i];if(!extra)return;
   const old=optionQuantity(state,extra);
   if(t.value==='manual'){
     extra.autoQuantity=false;extra.targetWorkId=null;extra.targetSurfaceId=null;
     extra.quantity=old.quantity??(extra.quantity===''?1:extra.quantity);
   }else if(t.value){
     const target=activeScopes().find(x=>x.key===t.value);
     if(target){
       extra.autoQuantity=true;extra.targetWorkId=target.workId;extra.targetSurfaceId=target.surfaceId;
       extra.quantity=target.area;
     }
   }else {extra.autoQuantity=false;extra.targetWorkId=null;extra.targetSurfaceId=null;extra.quantity='';}
   render();return;
 }
 const path=t.dataset.path;if(!path)return;
 const old=get(path),next=t.type==='checkbox'?t.checked:t.value;
 set(path,next);
 if(path.endsWith('.preparation.level')){
  const prep=get(path.slice(0,-'.level'.length));
  const previous=prep.rates||{};
  if(old&&old!=='none')previous[old]={hoursM2:prep.hoursM2,consumablePriceM2:prep.consumablePriceM2};
  prep.rates=previous;
  const defaults=(prep.supportType==='wood'?WOOD_PREP_DEFAULTS:PREP_DEFAULTS)[next]||{hoursM2:'',consumablePriceM2:''};
  const rates=previous[next]||defaults;prep.hoursM2=rates.hoursM2;prep.consumablePriceM2=rates.consumablePriceM2;
 }
 if(path.endsWith('.preparation.hoursM2')||path.endsWith('.preparation.consumablePriceM2')){
  const root=path.slice(0,path.lastIndexOf('.')),prep=get(root);
  if(prep.level!=='none'){prep.rates||={};prep.rates[prep.level]||={};prep.rates[prep.level][path.split('.').at(-1)]=next;}
 }
 if(path.endsWith('.paint.type')||path.endsWith('.paint.finish')){
  const p=get(path.slice(0,path.lastIndexOf('.'))),type=path.endsWith('.type')?old:p.type,finish=path.endsWith('.finish')?old:p.finish;
  if(Number(p.yield)===demoYield(type,finish))p.yield=demoYield(p.type,p.finish);
  if(p.color==='color'){p.potPrice='';p.priceSource='color-needs-price';}
 }
 if(path.endsWith('.paint.layers')){
  const p=get(path.slice(0,-'.layers'.length));
  if(p.autoHours!==false)p.hoursM2=Number((Number(p.layers)*DEMO_REFERENCE.paintHoursPerLayerM2).toFixed(2));
 }
 if(path.endsWith('.paint.color')){
  const paint=get(path.slice(0,-'.color'.length));
  if(next==='color') {paint.potPrice='';paint.priceSource='color-needs-price';}
  if(next==='white') {paint.potPrice=DEMO_REFERENCE.paintPricePerLHT*DEMO_REFERENCE.paintPotL;paint.priceSource='historic-white';}
 }
 if(path.endsWith('.paint.potPrice'))get(path.slice(0,-'.potPrice'.length)).priceSource=next===''?'color-needs-price':'artisan';
 if(path.endsWith('.paint.hoursM2'))get(path.slice(0,-'.hoursM2'.length)).autoHours=false;
 if(t.type==='checkbox'||t.tagName==='SELECT'||path.endsWith('.paint.layers')||path==='labor.workers'||path==='labor.hourlyRate'||path.startsWith('extras.')||/\.(length|width|height|shapeA|shapeB|areaOverride)$/.test(path))render();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-action]');if(t)act(t);});
document.addEventListener('keydown',e=>{
 const t=e.target.closest('svg [data-action]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();act(t);}
});
document.addEventListener('input',e=>{const t=e.target;
 if(t.dataset.categorySearch){
  const id=t.dataset.categorySearch;optionSearch[id]=t.value;
  const group=CLASSIFIED_OPTION_CATEGORIES.find(x=>x.id===id);
  const matches=group?filterCategory(group,t.value):[];
  const panel=t.closest?.('[data-category]');const list=panel?.querySelector?.('[data-search-list]');
  const names=new Set(matches.map(x=>x.id));
  if(list){
    list.querySelectorAll?.('[data-option-id]').forEach(row=>{row.hidden=!names.has(row.dataset.optionId);});
    const empty=list.querySelector?.('.empty-option');
    if(empty)empty.hidden=matches.length>0;
  }
  const count=panel?.querySelector?.('[data-search-count]');
  if(count&&group)count.textContent=matches.length+' / '+group.items.length+' prestations affichées';
  return;
 }
 if(t.dataset.path&&t.tagName==='INPUT'&&t.type!=='checkbox'){
  if(t.dataset.path.endsWith('.paint.colorRef')){
   const paint=get(t.dataset.path.slice(0,-'.colorRef'.length));
   if(paint&&paint.color==='color'&&paint.colorRef!==t.value){paint.potPrice='';paint.priceSource='color-needs-price';}
  }
  set(t.dataset.path,t.value);
  if(/\.(length|height|width|shapeA|shapeB|areaOverride)$/.test(t.dataset.path))updateAreaOutputs();
 }});
document.addEventListener('change',e=>onChange(e.target));
el('previous').addEventListener('click',()=>go(step-1));
el('next').addEventListener('click',()=>go(step+1));
render();
