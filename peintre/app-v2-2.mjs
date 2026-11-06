import {createDefaultState,newWork,newOpening,calculateEstimate,PREPARATIONS,PREP_DEFAULTS,WOOD_PREP_DEFAULTS,preparationRates,roomPolygon,roomSegments,roomArea,demoYield,DEMO_REFERENCE} from './engine-v2.mjs';
import {OPTION_CATEGORIES} from './options-catalog-v2.mjs';
import {BAREME_OPTION_GROUPS,referenceForOption,alreadySelected,createExtra} from './guillaume-mapping-v2-4.mjs';

let state=createDefaultState(),step=0,selected={wi:0,key:'A'},lastError='';
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
const heading=(h,p)=>'<div class="section-heading"><div><span class="eyebrow">SPEEDARTI — PEINTRE V2.4</span><h1>'+h+'</h1><p>'+p+'</p></div></div>';
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
   +preview+'</article>';
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
 +'</aside><section class="editor-column"><div class="support-top"><h2>'+esc(s.name)+'</h2>'+tick('Inclure',path+'.active',s.active)+'</div>'
 +(s.active?'<div class="support-body">'
  +(w.type!=='room'?card('Dimensions',grid(field('Longueur (m)',path+'.length',s.length),field(w.type==='wall'?'Hauteur (m)':'Largeur (m)',path+'.height',s.height),
    ...(w.type==='surface'?[field('Surface directe (m²)',path+'.areaOverride',s.areaOverride)]:[]))):'<p class="note">Dimensions calculées automatiquement depuis la géométrie de la pièce.</p>')
  +card('Revêtement',select('Type',path+'.mode',s.mode,[['paint','Peinture'],['wallpaper','Papier peint'],['none','Aucun']])
    +(s.mode==='paint'?paintEditor(path+'.paint',s.paint):s.mode==='wallpaper'?wallpaperEditor(path+'.wallpaper',s.wallpaper):''))
  +card('Préparation',preparationEditor(path+'.preparation',s.preparation))
  +(s.mode!=='none'?card('Menuiseries et ouvertures',openingEditor(path,s)):'')
  +'</div>':'<div class="excluded">Support désactivé et exclu du chiffrage.</div>')
 +'</section></div>';
}
function optionControls(group) {
 return '<details class="option-group"><summary><strong>'+esc(group.name)+'</strong><small>'+group.items.length+' prestations</small></summary><div class="option-items">'
 +group.items.map(option=>{
  const chosen=alreadySelected(option,state.extras),ref=referenceForOption(option);
  const info=ref?'<small class="row-sub">Repère Guillaume : '+fmt(ref.materialUnitHT)+' € HT/'+esc(ref.unit)+' de fournitures · '+fmt(ref.hoursPerUnit)+' h/'+esc(ref.unit)+' · '+esc(ref.source)+' ligne '+ref.sourceRow+'</small>':'<small class="row-sub">Sans barème : données à compléter</small>';
  return '<div class="option-line"><span>'+esc(option.label)+info+'</span>'+button(chosen?'Variante déjà ajoutée ✓':'+ Ajouter','add-extra','data-option="'+option.id+'" '+(chosen?'disabled':''),'small-primary')+'</div>';
 }).join('')+'</div></details>';
}
function stepOptions(){
 return heading('Options','Sélectionnez seulement les prestations nécessaires. Les détails de prix et les temps apparaissent pour chaque prestation ajoutée.')
 +card('Paramètres entreprise', '<p class="note">Taux horaire de référence entreprise : <strong>'+money(state.labor.hourlyRate)+'/h</strong>. À terme récupéré depuis les paramètres SpeedArti.</p>'
  +gear('entreprise (simulation)',field('Taux horaire HT (€)','labor.hourlyRate',state.labor.hourlyRate)))
 +'<h2>Prestations supplémentaires</h2><p class="hint">Chaque option reste indépendante, avec unité, quantité, fournitures et heures de main-d’œuvre.</p>'
 +OPTION_CATEGORIES.map(optionControls).join('')
 +'<details class="option-group"><summary><strong>Barème Guillaume — 92 références (m² / ml / unité / forfait)</strong><small>Variantes chiffrées</small></summary><div class="option-items"><p class="hint">Données indicatives issues des deux PDF de Guillaume. Unité inchangée, coûts et temps modifiables. Ne pas sélectionner deux variantes du même service.</p>'
 +BAREME_OPTION_GROUPS.map(optionControls).join('')+'</div></details>'
 +(state.extras.length?card('Prestations sélectionnées',state.extras.map((o,i)=>{
  const path='extras.'+i;
  return '<div class="extra-edit"><div class="opening-header"><strong>'+esc(o.name)+'</strong>'+button('Supprimer','remove-extra','data-index="'+i+'"','danger')+'</div>'
   +grid(field('Quantité',path+'.quantity',o.quantity),
     select('Unité',path+'.unit',o.unit,[['forfait','Forfait'],['m²','m²'],['ml','ml'],['unité','Unité']]),
     field('Fournitures HT/unité (€)',path+'.materialUnitHT',o.materialUnitHT),
     field('Temps (h/unité)',path+'.hoursPerUnit',o.hoursPerUnit))
   +(o.referenceSource?'<p class="hint"><strong>Source :</strong> '+esc(o.referenceSource)+' — ligne '+esc(o.referenceRow)+' · montant et temps indicatifs, modifiables. '+esc(o.notes||'')+'</p>':'<p class="hint">Pas de barème suffisamment comparable : saisissez les matériaux et le temps.</p>')+'</div>';
 }).join('')):'')
 +card('Consommables courants (facultatifs)', '<p class="hint">Rubans, bâches et abrasifs peuvent être ajoutés au chiffrage. Renseignez les quantités et prix réels : aucun tarif n’est inventé.</p>'
  +(state.supplies||[]).map((x,i)=>'<div class="extra-edit">'+tick(esc(x.name)+' — '+esc(x.unit),'supplies.'+i+'.enabled',x.enabled)
  +(x.enabled?grid(field('Quantité','supplies.'+i+'.quantity',x.quantity),field('Prix HT / '+esc(x.unit),'supplies.'+i+'.unitPrice',x.unitPrice)):'')
  +'<p class="hint">Prix de départ HT indicatif : '+money(x.unitPrice)+' / '+esc(x.unit)+'. '+esc(x.priceSource||'')+' · modifiable.</p></div>').join(''))
 +card('Plinthes supplémentaires',gear('ajout manuel hors pièces',grid(
   field('Longueur (ml)','manualPlinth.length',state.manualPlinth.length),
   field('Hauteur peinte (m)','manualPlinth.paintedHeightM',state.manualPlinth.paintedHeightM),
   field('Temps (h/ml)','manualPlinth.hoursMl',state.manualPlinth.hoursMl),
   field('Consommables supplémentaires HT/ml (facultatif)','manualPlinth.pricePerMl',state.manualPlinth.pricePerMl)
 )+paintEditor('manualPlinth.paint',state.manualPlinth.paint)));

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
 const names=['Ouvrages','Revêtements','Options','Résultats'];
 el('steps').innerHTML=names.map((v,i)=>'<button class="step '+(step===i?'active':'')+'" data-action="go" data-index="'+i+'" '+(i>0&&!state.works.length?'disabled':'')+'><b>'+(i+1)+'. '+v+'</b></button>').join('');
 try{el('content').innerHTML=[stepWorks,stepSupports,stepOptions,stepResults][step]();lastError='';}
 catch(e){lastError=e.message;el('content').innerHTML='<div class="alert error">'+esc(e.message)+'</div>';}
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
 if(action==='remove-work'){state.works.splice(wi,1);selected={wi:0,key:'A'};render();return;}
 if(action==='pick-work'){selected={wi,key:state.works[wi].type==='room'?'A':'surface'};go(1);return;}
 if(action==='pick-support'){selected={wi,key:t.dataset.key};if(step===0)go(1);else render();return;}
 if(action==='add-opening'){get(t.dataset.root).openings.push(newOpening());render();return;}
 if(action==='remove-opening'){get(t.dataset.root).openings.splice(index,1);render();return;}
 if(action==='add-extra'){
  const opt=[...OPTION_CATEGORIES,...BAREME_OPTION_GROUPS].flatMap(g=>g.items).find(x=>x.id===t.dataset.option);
  if(opt&&!alreadySelected(opt,state.extras))state.extras.push(createExtra(opt));
  render();return;
 }
 if(action==='remove-extra'){state.extras.splice(index,1);render();return;}
 if(action==='export'){
  const data={origin:'SpeedArti démo Peintre V2.2',state,result:calculateEstimate(state)};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download='speedarti-peintre-v2-2-demo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);
 }
}
function onChange(t){
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
 if(t.type==='checkbox'||t.tagName==='SELECT'||path.endsWith('.paint.layers')||path==='labor.workers'||/\.(length|width|height|shapeA|shapeB|areaOverride)$/.test(path))render();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-action]');if(t)act(t);});
document.addEventListener('keydown',e=>{
 const t=e.target.closest('svg [data-action]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();act(t);}
});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.path&&t.tagName==='INPUT'&&t.type!=='checkbox'){
  if(t.dataset.path.endsWith('.paint.colorRef')){
   const paint=get(t.dataset.path.slice(0,-'.colorRef'.length));
   if(paint&&paint.color==='color'&&paint.colorRef!==t.value){paint.potPrice='';paint.priceSource='color-needs-price';}
  }
  set(t.dataset.path,t.value);
 }});
document.addEventListener('change',e=>onChange(e.target));
el('previous').addEventListener('click',()=>go(step-1));
el('next').addEventListener('click',()=>go(step+1));
render();
