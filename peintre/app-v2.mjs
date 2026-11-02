import {createDefaultState,newWork,newOpening,calculateEstimate,surfacesFor,PREPARATIONS} from './engine-v2.mjs';
let state=createDefaultState(),step=0,selected={wi:0,key:'A'},error='';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&quot;':'&quot;',"'":'&#39;'}[c]));
const money=n=>n===null||n===undefined?'À confirmer':Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const fmt=n=>n==null?'—':Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2});
const choices=(options,v)=>options.map(([id,name])=>'<option value="'+esc(id)+'" '+(String(id)===String(v)?'selected':'')+'>'+esc(name)+'</option>').join('');
const input=(label,path,val,opts={})=>{
 const type=opts.type||'number';
 return '<label class="field"><span>'+label+'</span><input data-set="'+esc(path)+'" data-trace="'+esc(path)+'" type="'+type+'" value="'+esc(val)+'" '+(type==='number'?'min="'+(opts.min??0)+'" step="'+(opts.step??0.01)+'"':'')+' '+(opts.placeholder?'placeholder="'+esc(opts.placeholder)+'"':'')+'></label>';
};
const select=(label,path,val,options)=>'<label class="field"><span>'+label+'</span><select data-set="'+esc(path)+'" data-trace="'+esc(path)+'">'+choices(options,val)+'</select></label>';
const toggle=(label,path,val)=>'<label class="tick"><input type="checkbox" data-set="'+esc(path)+'" data-trace="'+esc(path)+'" '+(val?'checked':'')+'><span>'+label+'</span></label>';
const grid=(items,clazz='grid-fields')=>'<div class="'+clazz+'">'+items.join('')+'</div>';
const card=(title,content,actions='')=>'<section class="card"><div class="card-heading"><h3>'+title+'</h3>'+actions+'</div>'+content+'</section>';
const head=(title,subtitle)=>'<div class="section-heading"><div><span class="eyebrow">CHIFFRAGE PEINTRE V2</span><h1>'+title+'</h1><p>'+subtitle+'</p></div></div>';
const btn=(text,act,attrs='',variant='outline')=>'<button class="btn '+variant+'" type="button" data-action="'+act+'" data-trace="'+act+'" '+attrs+'>'+text+'</button>';
const makeKey=wi=>state.works[wi]?.type==='room'?'A':'surface';
const current=()=>{
 let wi=Math.min(selected.wi,state.works.length-1);if(wi<0)return null;
 const w=state.works[wi];
 let key=(wi===selected.wi?selected.key:makeKey(wi));
 if(w.type!=='room')key='surface';
 if(w.type==='room'&&!['A','B','C','D','ceiling'].includes(key))key='A';
 const surface=w.type==='room'?(key==='ceiling'?w.ceiling:w.walls[key]):w.surface;
 const path='works.'+wi+(w.type==='room'?(key==='ceiling'?'.ceiling':'.walls.'+key):'.surface');
 return {wi,w,key,surface,path};
};
function addWork(type){
 const count=state.works.filter(x=>x.type===type).length+1;
 const name=type==='room'?'Pièce '+count:type==='wall'?'Mur simple '+count:'Surface simple '+count;
 state.works.push(newWork(type,name));
 selected={wi:state.works.length-1,key:type==='room'?'A':'surface'};error='';render();
}
function description(w){
 if(w.type==='room')return 'Pièce rectangulaire • 4 murs indépendants + plafond';
 if(w.type==='wall')return 'Mur autonome • longueur × hauteur';
 return 'Surface autonome • longueur × largeur ou m²';
}
function works(){
 return head('Vos ouvrages','Comme dans Plaquiste, ajoutez une pièce entière, un mur indépendant ou une surface de plafond à repeindre.')
 +'<div class="add-works">'
 +[['room','▣','Ajouter une pièce','4 murs A/B/C/D + plafond'],['wall','▥','Ajouter un mur simple','Longueur, hauteur et ouvertures'],['surface','◫','Ajouter une surface simple','Plafond ou autre support']].map(([type,icon,title,description])=>
 '<button class="add-card" data-action="add-work" data-type="'+type+'" data-trace="add-'+type+'" type="button"><span class="add-ico">'+icon+'</span><strong>'+title+'</strong><small>'+description+'</small><span class="add-plus">+ Ajouter</span></button>').join('')+'</div>'
 +card('Informations du chantier',grid([input('Nom du chiffrage','projectName',state.projectName,{type:'text'})]))
 +'<div class="list-head"><h2>Ouvrages ajoutés <span class="counter">'+state.works.length+'</span></h2></div>'
 +(state.works.length===0?'<div class="empty">Commencez par ajouter votre premier ouvrage.</div>':'<div class="work-list">'+state.works.map((w,i)=>{
   const path='works.'+i;
   return '<article class="work-card"><div class="work-header"><div class="work-num">'+(i+1)+'</div><div><h3>'+esc(w.name)+'</h3><p>'+description(w)+'</p></div>'
    +'<div class="work-actions">'+btn('Configurer','edit-work','data-index="'+i+'"','primary')+btn('Retirer','remove-work','data-index="'+i+'"','danger')+'</div></div>'
    +grid([input('Nom',path+'.name',w.name,{type:'text'}),...(w.type==='room'?
      [input('Longueur (m)',path+'.length',w.length),input('Largeur (m)',path+'.width',w.width),input('Hauteur (m)',path+'.height',w.height)]:
      [input('Longueur (m)',path+'.surface.length',w.surface.length),input(w.type==='wall'?'Hauteur (m)':'Largeur (m)',path+'.surface.height',w.surface.height)])])+'</article>';
 }).join('')+'</div>');
}
function drawing(w,wi){
 if(w.type!=='room')return '<div class="solo-drawing"><span>◫</span><strong>'+esc(w.name)+'</strong><small>Support unique • sélectionné</small></div>';
 const sides=[{k:'A',x1:76,y1:48,x2:324,y2:48,lx:200,ly:25},
 {k:'B',x1:324,y1:48,x2:324,y2:208,lx:348,ly:132},
 {k:'C',x1:324,y1:208,x2:76,y2:208,lx:200,ly:232},
 {k:'D',x1:76,y1:208,x2:76,y2:48,lx:50,ly:132}];
 return '<div class="plan-wrap"><svg viewBox="0 0 400 260" role="img" aria-label="Schéma des murs A B C D et du plafond">'
  +'<rect x="82" y="54" width="236" height="148" rx="7" fill="#e8f2ff" opacity=".8" stroke="#d7e6fa"/>'
  +sides.map(({k,x1,y1,x2,y2,lx,ly})=>{
   const s=w.walls[k],picked=selected.wi===wi&&selected.key===k;
   return '<g class="wall-hit '+(picked?'picked':'')+'" data-action="pick-surface" data-index="'+wi+'" data-key="'+k+'" data-trace="pick-wall-'+k+'" role="button" tabindex="0" aria-label="Sélectionner mur '+k+'">'
    +'<line class="wall-segment '+(s.active?'enabled':'disabled')+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>'
    +'<line class="wall-touch" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>'
    +'<text x="'+lx+'" y="'+ly+'" text-anchor="middle" class="wall-letter '+(!s.active?'off':'')+'">'+k+'</text></g>';
   }).join('')
  +'<g data-action="pick-surface" data-index="'+wi+'" data-key="ceiling" data-trace="pick-ceiling" role="button" tabindex="0" aria-label="Sélectionner plafond">'
  +'<rect x="136" y="103" width="128" height="53" rx="10" fill="'+(selected.wi===wi&&selected.key==='ceiling'?'#dbeafe':'white')+'" stroke="#adcbef"/>'
  +'<text x="200" y="124" text-anchor="middle" class="ceiling-label">Plafond</text><text x="200" y="143" text-anchor="middle" class="ceiling-small">'+(w.ceiling.active?'Activé':'Désactivé')+'</text></g></svg>'
  +'<p class="plan-caption">Cliquez sur A, B, C, D ou le plafond pour modifier son revêtement.</p>'
  +'<div class="legend"><span><i class="dot on"></i>Mur actif</span><span><i class="dot off"></i>Mur exclu</span><span><i class="dot picked"></i>Support sélectionné</span></div></div>';
}
function supportDetails(ctx){
 const {w,key,surface:s,path}=ctx;
 const room=w.type==='room',ceiling=room&&key==='ceiling';
 return '<div class="support-card"><div class="support-top"><div><small>SUPPORT SÉLECTIONNÉ</small><h2>'+esc(s.name)+'</h2></div>'+toggle('Inclure ce support',path+'.active',s.active)+'</div>'
 +(s.active?'<div class="support-body">'
   +(!room?card('Dimensions du support',grid([
      input('Longueur (m)',path+'.length',s.length),
      input(w.type==='wall'?'Hauteur (m)':'Largeur (m)',path+'.height',s.height)
   ])):'<p class="note">Dimensions reprises de la pièce : '+(ceiling?'longueur × largeur':'longueur du mur × hauteur')+'.</p>')
   +card('Revêtement choisi',grid([
     select('Type de revêtement',path+'.mode',s.mode,[['paint','Peinture'],['wallpaper','Papier peint'],['none','Aucun revêtement']])
   ])+(s.mode==='paint'?paintEditor(path+'.paint',s.paint):
      s.mode==='wallpaper'?wallpaperEditor(path+'.wallpaper',s.wallpaper):'<p class="note">Ce support est activé, mais ne comporte aucun revêtement.</p>'))
   +card('Préparation du support',preparationEditor(path+'.preparation',s.preparation))
   +(s.mode!=='none'?card('Ouvertures et menuiseries',openingsEditor(path,s)):'' )
   +'</div>':'<div class="excluded"><strong>Support désactivé</strong><p>Il est grisé sur le plan et exclu des métrés, de la préparation, des fournitures et des plinthes automatiques.</p></div>')
 +'</div>';
}
function paintEditor(path,p){
 return '<div class="sub-section"><div class="field-grid">'
 +select('Famille peinture',path+'.type',p.type,[['acrylique','Acrylique'],['glycero','Glycéro'],['alkyde','Alkyde'],['autre','Autre']])
 +select('Finition',path+'.finish',p.finish,[['mat','Mat'],['velours','Velours'],['satin','Satin'],['brillant','Brillant / laqué'],['autre','Autre']])
 +select('Teinte',path+'.color',p.color,[['white','Blanc'],['color','Couleur']])
 +(p.color==='color'?input('Référence couleur (RAL/NCS)',path+'.colorRef',p.colorRef,{type:'text',placeholder:'RAL 7016'}):'')
 +input('Nombre de couches',path+'.layers',p.layers,{step:1})
 +input('Rendement fabricant m²/L/couche',path+'.yield',p.yield,{placeholder:'À confirmer'})
 +input('Pertes (%)',path+'.loss',p.loss,{step:1})
 +input('Conditionnement (L/pot)',path+'.potLitres',p.potLitres,{placeholder:'À confirmer'})
 +input('Prix HT/pot (€)',path+'.potPrice',p.potPrice,{placeholder:'À confirmer'})
 +input('Temps de pose h/m² (toutes couches)',path+'.hoursM2',p.hoursM2,{placeholder:'À confirmer'})
 +'</div><p class="hint">Un même produit utilisé sur plusieurs murs est regroupé avant l’arrondi aux pots entiers. Les prix sont à renseigner ou raccorder au catalogue SpeedArti.</p></div>';
}
function wallpaperEditor(path,wp){
 return '<div class="sub-section"><div class="field-grid">'
 +select('Type de papier peint',path+'.kind',wp.kind,[['classique','Classique'],['intisse','Intissé'],['vinyle','Vinyle'],['panoramique','Panoramique']])
 +(wp.kind==='panoramique'?
  input('Nombre de panneaux validé',path+'.panels',wp.panels,{step:1,placeholder:'À confirmer'})
  +input('Prix HT par panneau (€)',path+'.panelPrice',wp.panelPrice,{placeholder:'À confirmer'}):
  input('Largeur du rouleau (m)',path+'.rollWidth',wp.rollWidth,{placeholder:'À confirmer'})
  +input('Longueur du rouleau (m)',path+'.rollLength',wp.rollLength,{placeholder:'À confirmer'})
  +input('Raccord motif (cm)',path+'.repeatCm',wp.repeatCm)
  +input('Pertes (%)',path+'.loss',wp.loss,{step:1})
  +input('Prix HT/rouleau (€)',path+'.rollPrice',wp.rollPrice,{placeholder:'À confirmer'}))
 +input('Temps de pose h/m²',path+'.hoursM2',wp.hoursM2,{placeholder:'À confirmer'})
 +'</div><p class="hint">'+(wp.kind==='panoramique'?'Le panoramique exige un nombre de panneaux confirmé selon le produit et le calepinage.':'Les lés sont calculés sur la largeur brute, avec hauteur et raccords, puis les rouleaux sont arrondis.')+'</p></div>';
}
function preparationEditor(path,p){
 return grid([select('Préparation',path+'.level',p.level,PREPARATIONS.map(x=>[x.id,x.title]))])
 +(p.level!=='none'?'<div class="field-grid prep-grid">'
  +input('Temps de préparation (h/m²)',path+'.hoursM2',p.hoursM2,{placeholder:'À confirmer'})
  +input('Consommables HT/m² (€)',path+'.consumablePriceM2',p.consumablePriceM2,{placeholder:'À confirmer'})
  +'</div><p class="hint">Ponçage léger : dépoussiérage et abrasifs. Ponçage + rattrapage : petites reprises avant peinture. Ratissage complet : enduit sur toute la surface, ponçage et contrôle. Durées et fournitures non inventées.</p>':'<p class="hint">Aucune préparation par défaut. Chaque support peut avoir un niveau différent.</p>');
}
function openingsEditor(path,s){
 return '<div class="opening-head"><p class="hint">Déduire une ouverture, ajouter une menuiserie à peindre, ou les deux.</p>'
  +btn('+ Ajouter une ouverture','add-opening','data-path="'+esc(path)+'"','small-primary')+'</div>'
  +(s.openings.length===0?'<p class="empty-line">Aucune ouverture pour ce support.</p>':
    s.openings.map((o,i)=>{
      const p=path+'.openings.'+i;
      return '<div class="opening-block"><div class="opening-header"><strong>Ouverture '+(i+1)+'</strong>'
       +btn('Supprimer','remove-opening','data-path="'+esc(path)+'" data-oi="'+i+'"','danger')+'</div>'
       +'<div class="field-grid">'
       +input('Nom',p+'.name',o.name,{type:'text'})
       +select('Nature',p+'.type',o.type,[['door','Porte'],['window','Fenêtre'],['other','Autre']])
       +select('Traitement',p+'.mode',o.mode,[['deduct','Déduire du support'],['supplement','Menuiserie à peindre en supplément'],['both','Déduire + peindre la menuiserie']])
       +input('Nombre',p+'.count',o.count,{step:1})
       +input('Largeur (m)',p+'.width',o.width)
       +input('Hauteur (m)',p+'.height',o.height)
       +'</div>'
       +(o.mode!=='deduct'?'<div class="nested"><h4>Menuiserie à peindre (supplément)</h4>'
         +grid([select('Faces peintes',p+'.faces',o.faces,[[1,'1 face'],[2,'2 faces']])])
         +paintEditor(p+'.paint',o.paint)
         +'<h4>Préparation menuiserie</h4>'+preparationEditor(p+'.preparation',o.preparation)
         +'</div>':'')+'</div>';
    }).join(''));
}
function options(){
 const ctx=current();
 if(!ctx)return head('Revêtements et supports','Ajoutez d’abord une pièce ou une surface.')+'<div class="empty">Aucun ouvrage à configurer.</div>';
 return head('Revêtements par support','Sélectionnez un mur ou un plafond ; chaque support possède son propre produit, sa finition, ses ouvertures et sa préparation.')
   +'<div class="config-layout"><aside class="config-side"><div class="side-head">Vos ouvrages</div>'
   +state.works.map((w,i)=>'<button type="button" class="work-tab '+(i===ctx.wi?'active':'')+'" data-action="pick-work" data-index="'+i+'" data-trace="pick-work"><strong>'+esc(w.name)+'</strong><small>'+esc(w.type==='room'?'Pièce':w.type==='wall'?'Mur simple':'Surface simple')+'</small></button>').join('')
   +drawing(ctx.w,ctx.wi)
   +(ctx.w.type==='room'?'<div class="wall-tabs">'+['A','B','C','D','ceiling'].map(key=>{
      const s=key==='ceiling'?ctx.w.ceiling:ctx.w.walls[key];
      return '<button type="button" class="wall-btn '+(ctx.key===key?'selected':'')+' '+(!s.active?'inactive':'')+'" data-action="pick-surface" data-index="'+ctx.wi+'" data-key="'+key+'" data-trace="pick-support">'
        +(key==='ceiling'?'Plafond':key)+' '+(s.active?'●':'○')+'</button>';
    }).join('')+'</div>':'')
   +(ctx.w.type==='room'?'<div class="side-plinth">'+toggle('Plinthes automatiques sur murs actifs','works.'+ctx.wi+'.plinth.enabled',ctx.w.plinth.enabled)
     +(ctx.w.plinth.enabled?grid([
      input('Ajout manuel dans cette pièce (ml)','works.'+ctx.wi+'.plinth.manualLength',ctx.w.plinth.manualLength),
      input('Temps plinthes (h/ml)','works.'+ctx.wi+'.plinth.hoursMl',ctx.w.plinth.hoursMl),
      input('Fourniture plinthes HT/ml','works.'+ctx.wi+'.plinth.pricePerMl',ctx.w.plinth.pricePerMl)
    ],'side-fields'):'')+'</div>':'')
   +'</aside><div class="editor-column">'+supportDetails(ctx)+'</div></div>';
}
function settings(){
 return head('Paramètres et ajouts','Vérifiez les paramètres artisan et ajoutez, si nécessaire, des plinthes indépendantes des pièces.')
  +card('Paramètres métier',grid([
    input('Taux horaire HT (€)','labor.hourlyRate',state.labor.hourlyRate,{placeholder:'Paramètre artisan'}),
    input('Nombre d’ouvriers','labor.workers',state.labor.workers,{step:1}),
    select('TVA du chantier (à vérifier)','vatRate',state.vatRate,[[20,'20 %'],[10,'10 %'],[5.5,'5,5 %'],[0,'0 % cas justifié']])
  ])+'<p class="hint">Dans l’application, le taux horaire et l’effectif viendront des paramètres existants de l’artisan. Cette démo ne décide pas de l’éligibilité fiscale.</p>')
  +card('Ajouter des plinthes manuellement',grid([
    input('Longueur supplémentaire (ml)','manualPlinth.length',state.manualPlinth.length),
    input('Temps de pose/peinture (h/ml)','manualPlinth.hoursMl',state.manualPlinth.hoursMl),
    input('Fourniture et peinture HT/ml (€)','manualPlinth.pricePerMl',state.manualPlinth.pricePerMl)
  ])+'<p class="hint">Les plinthes automatiques des pièces dépendent uniquement des murs actifs. Cette ligne manuelle est indépendante.</p>')
  +'<div class="info">Les tarifs historiques de Guillaume ne sont pas injectés comme prix actuels ; les données manquantes restent « À confirmer ».</div>';
}
function results(){
 let result;
 try{result=calculateEstimate(state)}catch(e){return head('Résultat','Corrigez les champs signalés.')+'<div class="alert error">'+esc(e.message)+'</div>';}
 return head('Chiffrage détaillé','Résultat par support avec déductions, menuiseries, préparations, pots et heures de main-d’œuvre.')
  +'<div class="metrics">'
   +[['Supports comptés',result.geometry.filter(g=>g.kind!=='menuiserie'&&g.kind!=='plinth').length],
    ['Heures-homme',fmt(result.hoursMan)+' h'],['Durée chantier',fmt(result.durationHours)+' h'],
    ['Fournitures HT',money(result.materialsHT)],['Main-d’œuvre HT',money(result.laborHT)],
    ['Total HT',money(result.totalHT)],['TVA',money(result.taxHT)],['Total TTC',money(result.ttc)]]
    .map(([l,v])=>'<div class="metric"><small>'+l+'</small><strong>'+v+'</strong></div>').join('')+'</div>'
  +card('Métrés par ouvrage','<div class="scroll-table"><table><thead><tr><th>Support</th><th>Traitement</th><th>Brut</th><th>Déduction</th><th>Net</th><th>Préparation</th></tr></thead><tbody>'
   +result.geometry.map(g=>'<tr><td>'+esc(g.work)+' — '+esc(g.surface)+'</td><td>'+esc(g.mode)+'</td><td>'+fmt(g.gross)+'</td><td>'+fmt(g.deduction)+'</td><td><strong>'+fmt(g.net)+'</strong></td><td>'+esc(PREPARATIONS.find(x=>x.id===g.treatment)?.title||'Aucune')+'</td></tr>').join('')+'</tbody></table></div>')
  +card('Fournitures et main-d’œuvre','<div class="scroll-table"><table><thead><tr><th>Poste</th><th>Qté</th><th>Unité</th><th>Prix HT</th><th>Montant HT</th></tr></thead><tbody>'
   +result.lines.map(x=>'<tr><td>'+esc(x.name)+'<small class="row-sub">'+esc(x.tag)+'</small></td><td>'+fmt(x.quantity)+'</td><td>'+esc(x.unit)+'</td><td>'+money(x.unitPrice)+'</td><td><strong>'+money(x.amount)+'</strong></td></tr>').join('')+'</tbody></table></div>'
   +'<p class="hint">Les pots identiques sont regroupés ; une peinture colorée différente reste un poste distinct.</p>')
  +(result.complete?'<div class="info ok">Tous les montants des postes actifs sont calculables. Il reste à vérifier les références et le chantier avant devis.</div>':
    '<div class="alert error"><strong>Chiffrage incomplet</strong> — les montants inconnus ne sont jamais remplacés par zéro. Sous-total des seules lignes calculables : '+money(result.confirmedHT)+'.</div>')
  +(result.warnings.length?card('Points à confirmer','<ul class="warnings">'+result.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul>'):'')
  +'<div class="export">'+btn('Exporter le résultat JSON (local)','export','','primary')+'</div>';
}
function render(){
 $('steps').innerHTML=['1. Ouvrages','2. Revêtements','3. Plinthes et tarifs','4. Résultats'].map((label,i)=>
 '<button class="step '+(step===i?'active':'')+'" type="button" data-action="step" data-step="'+i+'" data-trace="step-'+i+'" '+(i>0&&state.works.length===0?'disabled':'')+'><b>'+label+'</b><span>'+(i===step?'En cours':'')+'</span></button>').join('');
 $('content').innerHTML=(step===0?works():step===1?options():step===2?settings():results());
 $('previous').disabled=step===0;
 $('next').disabled=step===3||state.works.length===0;
 $('next').textContent=step===2?'Voir le résultat →':'Suivant →';
 $('stepcount').textContent='Étape '+(step+1)+' / 4';
}
function setPath(path,val){
 const parts=path.split('.');let obj=state;
 for(const part of parts.slice(0,-1)){obj=obj[part];if(obj==null)throw Error('Champ introuvable : '+path);}
 obj[parts.at(-1)]=val;
}
function getPath(path){return path.split('.').reduce((v,k)=>v?.[k],state);}
function move(to){
 if(to<0||to>3||(to>0&&!state.works.length))return;
 step=to;render();window.scrollTo({top:0,behavior:'auto'});
}
function handleAction(t){
 const act=t.dataset.action,i=Number(t.dataset.index);
 if(act==='step'){move(Number(t.dataset.step));return;}
 if(act==='add-work'){addWork(t.dataset.type);return;}
 if(act==='remove-work'){state.works.splice(i,1);selected={wi:0,key:makeKey(0)};render();return;}
 if(act==='pick-work'||act==='edit-work'){selected={wi:i,key:makeKey(i)};move(1);return;}
 if(act==='pick-surface'){selected={wi:i,key:t.dataset.key};render();return;}
 if(act==='add-opening'){const p=t.dataset.path;getPath(p).openings.push(newOpening());render();return;}
 if(act==='remove-opening'){getPath(t.dataset.path).openings.splice(Number(t.dataset.oi),1);render();return;}
 if(act==='export'){
   const result=calculateEstimate(state);
   const blob=new Blob([JSON.stringify({origin:'SpeedArti Peintre demo-only',state,result},null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='speedarti-peintre-v2-demo.json';anchor.click();
   setTimeout(()=>URL.revokeObjectURL(url),0);return;
 }
}
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-action]');
 if(t)handleAction(t);
});
document.addEventListener('keydown',e=>{
 if((e.key==='Enter'||e.key===' ')&&e.target.closest('svg [data-action]')){e.preventDefault();handleAction(e.target.closest('[data-action]'));}
});
document.addEventListener('input',e=>{
 const t=e.target;if(t.dataset.set&&t.type!=='checkbox'&&t.tagName!=='SELECT')setPath(t.dataset.set,t.value);
});
document.addEventListener('change',e=>{
 const t=e.target;if(!t.dataset.set)return;
 setPath(t.dataset.set,t.type==='checkbox'?t.checked:t.value);
 if(t.type==='checkbox'||t.tagName==='SELECT')render();
});
$('previous').addEventListener('click',()=>move(step-1));
$('next').addEventListener('click',()=>move(step+1));
render();
