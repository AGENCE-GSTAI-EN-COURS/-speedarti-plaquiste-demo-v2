import { createDefaultState, calculateEstimate } from './engine.mjs';

let state=createDefaultState(),step=0;
const $=id=>document.getElementById(id);
const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const euro=n=>n==null?'À confirmer':Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const fmt=n=>n==null?'À confirmer':Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2});
const input=(label,path,val,kind='number',opts='')=>'<div class="field"><label for="'+safe(path)+'">'+label+'</label><input id="'+safe(path)+'" data-bind="'+safe(path)+'" data-trace="'+safe(path)+'" type="'+kind+'" value="'+safe(val)+'" '+opts+'></div>';
const roomInput=(label,i,key,val,kind='number',opts='')=>'<div class="field"><label>'+label+'<input type="'+kind+'" data-roomindex="'+i+'" data-roomfield="'+key+'" data-trace="room-'+key+'" value="'+safe(val)+'" '+opts+'></label></div>';
const option=(val,label,current)=>'<option value="'+safe(val)+'"'+(String(current)===String(val)?' selected':'')+'>'+label+'</option>';
const select=(label,path,current,opts)=>'<div class="field"><label>'+label+'<select data-bind="'+safe(path)+'" data-trace="'+safe(path)+'">'+opts.map(x=>option(x[0],x[1],current)).join('')+'</select></label></div>';
const roomSelect=(label,i,current)=>'<div class="field"><label>'+label+'<select data-roomindex="'+i+'" data-roomfield="wallFinish" data-trace="room-wallFinish">'
 +[['paint','Peinture'],['wallpaper','Papier peint'],['none','Aucun revêtement mural']].map(x=>option(x[0],x[1],current)).join('')+'</select></label></div>';
const check=(label,path,checked)=>'<label class="check"><input type="checkbox" data-bind="'+safe(path)+'" data-trace="'+safe(path)+'" '+(checked?'checked':'')+'>'+label+'</label>';
const section=(title,body)=>'<section class="section"><h3>'+title+'</h3>'+body+'</section>';
const fieldset=(body)=>'<div class="fields">'+body+'</div>';
const heading=(title,subtitle)=>'<div class="heading"><div><h2>'+title+'</h2><p>'+subtitle+'</p></div></div>';
function roomCard(room,i) {
  const openings=(room.openings||[]).map((op,j)=>'<div class="opening">'
    +'<div class="field"><label>Type<select data-roomindex="'+i+'" data-openingindex="'+j+'" data-openingfield="type" data-trace="opening-type">'
      +[['door','Porte'],['window','Fenêtre'],['other','Autre ouverture']].map(x=>option(x[0],x[1],op.type)).join('')+'</select></label></div>'
    +openingField('Nombre',i,j,'count',op.count,'min="0" step="1"')
    +openingField('Largeur (m)',i,j,'width',op.width,'min="0.01" step="0.01"')
    +openingField('Hauteur (m)',i,j,'height',op.height,'min="0.01" step="0.01"')
    +'<button type="button" class="btn danger" data-action="remove-opening" data-roomindex="'+i+'" data-openingindex="'+j+'" data-trace="removeOpening">Retirer</button></div>').join('');
  return '<article class="section"><div class="section-title"><h3>Pièce '+(i+1)+'</h3>'
    +(state.rooms.length>1?'<button class="btn danger" type="button" data-action="remove-room" data-roomindex="'+i+'" data-trace="removeRoom">Supprimer</button>':'')+'</div>'
    +'<div class="fields">'+roomInput('Nom',i,'name',room.name,'text')
    +roomInput('Longueur (m)',i,'length',room.length,'number','min="0.01" step="0.01"')
    +roomInput('Largeur (m)',i,'width',room.width,'number','min="0.01" step="0.01"')
    +roomInput('Hauteur (m)',i,'height',room.height,'number','min="0.01" step="0.01"')
    +roomSelect('Finition murs',i,room.wallFinish)
    +'<div class="field"><label>Plafond</label><label class="check"><input data-roomindex="'+i+'" data-roomfield="ceiling" data-trace="room-ceiling" type="checkbox" '+(room.ceiling?'checked':'')+'>Peindre le plafond</label></div></div>'
    +'<hr class="divider"><div class="section-title"><strong>Ouvertures à déduire</strong><button class="btn textbtn" data-action="add-opening" data-roomindex="'+i+'" data-trace="addOpening" type="button">+ Ouverture</button></div>'
    +(openings||'<p class="help">Aucune ouverture. Les portes et fenêtres ne sont pas déduites automatiquement sans dimensions.</p>')
    +'</article>';
}
function openingField(label,i,j,key,val,opts) {
  return '<div class="field"><label>'+label+'<input type="number" data-roomindex="'+i+'" data-openingindex="'+j+'" data-openingfield="'+key+'" data-trace="opening-'+key+'" value="'+safe(val)+'" '+opts+'></label></div>';
}
function renderRooms(){
  return heading('1. Métré des pièces','Chaque pièce a ses propres dimensions, ouvertures et finitions. Les fenêtres et portes sont déduites des surfaces de murs.')
    +section('Chantier',fieldset(input('Nom du projet','projectName',state.projectName,'text')))
    +'<div class="stack">'+state.rooms.map(roomCard).join('')+'</div>'
    +'<div style="margin-top:15px"><button class="btn textbtn" type="button" data-action="add-room" data-trace="addRoom">+ Ajouter une pièce</button></div>';
}
function renderSettings() {
  const c=state.coating,p=state.primer,w=state.woodwork,wp=state.wallpaper;
  return heading('2. Choix des produits et temps','Les quantités de peinture dépendent du rendement déclaré et des pots réellement achetés. Aucun tarif fournisseur n’est inventé.')
   +'<div class="stack">'
   +section('Peinture murs et plafonds',fieldset(
    select('Type de peinture','coating.label',c.label,[['Acrylique','Acrylique'],['Glycéro','Glycéro'],['Velours','Velours'],['Satinée','Satinée'],['Brillante','Brillante'],['Époxy','Époxy'],['Lasure','Lasure / Bois'],['Autre','Autre']])
    +input('Nombre de couches','coating.layers',c.layers,'number','min="1" step="1"')
    +input('Rendement fabricant (m²/L/couche)','coating.yieldM2PerL',c.yieldM2PerL,'number','min="0.01" step="0.01" placeholder="À renseigner"')
    +input('Pertes (%)','coating.lossPct',c.lossPct,'number','min="0" max="100" step="1"')
    +input('Taille du pot (L)','coating.potSizeL',c.potSizeL,'number','min="0.01" step="0.01" placeholder="À renseigner"')
    +input('Prix du pot HT (€)','coating.potPriceHT',c.potPriceHT,'number','min="0" step="0.01" placeholder="À renseigner"')
    +input('Temps application (h-homme/m² total)','coating.hoursPerM2',c.hoursPerM2,'number','min="0" step="0.01" placeholder="Couches comprises"'))
    +'<p class="help">Le temps indiqué correspond à toutes les couches, pour éviter de le multiplier deux fois.</p>')
   +section('Préparation et primaire',check('Ajouter une sous-couche / un primaire','primer.enabled',p.enabled)
    +(p.enabled?fieldset(input('Rendement primaire (m²/L)','primer.yieldM2PerL',p.yieldM2PerL,'number','min="0.01" step="0.01"')+
      input('Taille du pot primaire (L)','primer.potSizeL',p.potSizeL,'number','min="0.01" step="0.01"')+
      input('Prix du pot primaire HT (€)','primer.potPriceHT',p.potPriceHT,'number','min="0" step="0.01"')+
      input('Temps primaire (h/m²)','primer.hoursPerM2',p.hoursPerM2,'number','min="0" step="0.01"')):'')
    +'<hr class="divider">'+fieldset(select('Niveau de préparation','preparation.level',state.preparation.level,[['none','Aucune'],['1','1 — légères retouches'],['2','2 — préparation normale'],['3','3 — reprise importante'],['4','4 — support très dégradé']])
    +(state.preparation.level==='none'?'':input('Temps préparation (h/m²)','preparation.hoursPerM2',state.preparation.hoursPerM2,'number','min="0" step="0.01"'))))
   +section('Boiseries (distinctes des murs)',fieldset(input('Surface boiseries (m² par faces réellement peintes)','woodwork.areaM2',w.areaM2,'number','min="0" step="0.01"')
      +input('Nombre de couches','woodwork.layers',w.layers,'number','min="1" step="1"')
      +input('Rendement boiseries (m²/L)','woodwork.yieldM2PerL',w.yieldM2PerL,'number','min="0.01" step="0.01"')
      +input('Taille du pot (L)','woodwork.potSizeL',w.potSizeL,'number','min="0.01" step="0.01"')
      +input('Prix pot boiseries HT (€)','woodwork.potPriceHT',w.potPriceHT,'number','min="0" step="0.01"')
      +input('Temps boiseries (h/m² total)','woodwork.hoursPerM2',w.hoursPerM2,'number','min="0" step="0.01"')))
   +section('Plinthes',check('Peindre les plinthes (linéaire net des portes)','plinth.enabled',state.plinth.enabled)
       +(state.plinth.enabled?fieldset(input('Temps plinthes (h/ml)','plinth.hoursPerMl',state.plinth.hoursPerMl,'number','min="0" step="0.01"')):'')
       +'<p class="help">La consommation de peinture plinthes sera à associer au catalogue avant chiffrage complet.</p>')
   +section('Papier peint (uniquement pour les pièces sélectionnées)',fieldset(input('Largeur rouleau (m)','wallpaper.rollWidthM',wp.rollWidthM,'number','min="0.01" step="0.01"')
       +input('Longueur rouleau (m)','wallpaper.rollLengthM',wp.rollLengthM,'number','min="0.01" step="0.01"')
       +input('Prix rouleau HT (€)','wallpaper.rollPriceHT',wp.rollPriceHT,'number','min="0" step="0.01"')
       +input('Pertes estimées (%)','wallpaper.lossPct',wp.lossPct,'number','min="0" max="100" step="1"')
       +input('Temps de pose (h/m²)','wallpaper.hoursPerM2',wp.hoursPerM2,'number','min="0" step="0.01"'))
       +'<p class="help">Quantité de rouleaux indicative : le calepinage des lés/raccords reste à vérifier.</p>')
   +section('Travaux particuliers / forfaits', '<p class="help">Escaliers, poutres, verrières, radiateurs… Prix forfaitaire de vente pose incluse, non rajouté à la main-d’œuvre. Les heures servent seulement au planning.</p>'
      +state.extras.map((x,i)=>'<div class="extra">'+extraField('Désignation',i,'name',x.name,'text')
          +extraField('Quantité',i,'quantity',x.quantity,'number','min="1" step="1"')
          +extraField('Prix forfaitaire HT/unité',i,'unitPriceHT',x.unitPriceHT,'number','min="0" step="0.01"')
          +extraField('Heures incluses/unité',i,'hoursPerUnit',x.hoursPerUnit,'number','min="0" step="0.1"')
          +'<button class="btn danger" type="button" data-action="remove-extra" data-extraindex="'+i+'" data-trace="removeExtra">Retirer</button></div>').join('')
      +'<button class="btn textbtn" type="button" data-action="add-extra" data-trace="addExtra">+ Ajouter un forfait</button>')
   +section('Paramètres artisan / fiscalité',fieldset(input('Taux horaire HT (€)','labor.hourlyRate',state.labor.hourlyRate,'number','min="0" step="0.01"')
      +input('Nombre d’ouvriers','labor.workers',state.labor.workers,'number','min="1" step="1"')
      +select('TVA du chantier (à vérifier)','vatRate',state.vatRate,[[20,'20 %'],[10,'10 %'],[5.5,'5,5 %'],[0,'0 % (cas justifié)']]))
     +'<p class="help">La démo ne détermine pas automatiquement l’éligibilité à la TVA réduite. Les paramètres réels viendront de SpeedArti lors du raccordement.</p>')
  +'</div>';
}
function extraField(label,i,key,val,type,opts='') {
  return '<div class="field"><label>'+label+'<input type="'+type+'" value="'+safe(val)+'" data-extraindex="'+i+'" data-extrafield="'+key+'" data-trace="extra-'+key+'" '+opts+'></label></div>';
}
function renderResults(){
 let result;
 try { result=calculateEstimate(state); } catch(err) {
   return heading('3. Résultats','Vérifiez les saisies.')+'<div class="alert warning" role="alert">'+safe(err.message)+'</div><p class="help">Revenez aux étapes précédentes pour corriger les dimensions et les tarifs.</p>';
 }
 const rows=result.lines.map(l=>'<tr><td><strong>'+safe(l.name)+'</strong><br><span class="tag">'+safe(l.category==='materiel'?'Fourniture':l.category==='main_oeuvre'?'Main-d’œuvre':'Forfait pose incluse')+'</span></td>'
   +'<td class="num">'+fmt(l.quantity)+' '+safe(l.unit)+'</td><td class="num">'+euro(l.priceHT)+'</td><td class="num"><strong>'+euro(l.totalHT)+'</strong></td></tr>').join('');
 return heading('3. Résultat du chiffrage','Métrés, conditionnements et heures-homme séparés. Le devis n’est pas créé automatiquement.')
  +'<div class="stack">'
  +section('Surfaces mesurées','<div class="metrics">'
     +metric('Murs à peindre',fmt(result.geometry.paintWallsM2)+' m²')
     +metric('Plafonds',fmt(result.geometry.ceilingM2)+' m²')
     +metric('Papier peint',fmt(result.geometry.wallpaperM2)+' m²')
     +metric('Boiseries',fmt(result.woodworkM2)+' m²')
     +'</div><div class="chips" style="margin-top:14px"><span class="chip">Ouvertures déduites : '+fmt(result.geometry.openingsM2)+' m²</span><span class="chip">Plinthes nettes : '+fmt(result.geometry.plinthMl)+' ml</span></div>')
  +section('Fournitures, poses et forfaits','<div class="table-wrap"><table><thead><tr><th>Poste</th><th class="num">Quantité</th><th class="num">Prix HT/unité</th><th class="num">Total HT</th></tr></thead><tbody>'+rows+'</tbody></table></div>')
  +section('Synthèse', '<div class="metrics">'
      +metric('Fournitures HT',euro(result.materialsHT))
      +metric('Main-d’œuvre HT',euro(result.laborHT))
      +metric('Forfaits HT',euro(result.extrasHT))
      +metric('Heures-homme',fmt(result.hoursMan)+' h')
      +metric('Durée estimée',fmt(result.durationHours)+' h')
      +metric('Total HT',euro(result.totalHT))
      +metric('TVA '+fmt(result.vatRate)+' %',euro(result.vatHT))
      +metric('Total TTC',euro(result.ttc))
      +'</div><p class="help">Sous-total des lignes calculables : '+euro(result.confirmedHT)+'. Ce sous-total n’est pas un devis complet si des postes restent à confirmer.</p>'
      +(result.complete?'<p class="ok">✓ Tous les postes activés ont un montant renseigné (sous réserve des consommables explicitement exclus).</p>':'<p class="alert warning">Chiffrage incomplet : aucun total global n’est affiché tant que des postes sont à confirmer.</p>'))
  +(result.warnings.length?section('Alertes et limites','<div class="alert"><ul>'+result.warnings.map(x=>'<li>'+safe(x)+'</li>').join('')+'</ul></div>'):'')
  +'<div><button type="button" data-action="export" data-trace="exportEstimate" class="btn secondary">Exporter ce calcul en JSON (local)</button></div></div>';
}
const metric=(label,val)=>'<div class="metric"><small>'+label+'</small><strong>'+val+'</strong></div>';
function render(){
 const stages=['Dimensions','Produits & tarifs','Résultats'];
 $('steps').innerHTML=stages.map((s,i)=>'<button class="step '+(step===i?'active':'')+'" type="button" data-action="step" data-step="'+i+'" data-trace="step'+i+'" aria-current="'+(step===i?'step':'false')+'"><span class="num">'+(i+1)+'</span><span>'+s+'</span></button>').join('');
 $('stepContent').innerHTML=step===0?renderRooms():step===1?renderSettings():renderResults();
 $('prevBtn').disabled=step===0;
 $('nextBtn').disabled=step===2;
 $('nextBtn').textContent=step===1?'Afficher le résultat →':'Suivant →';
 $('stepInfo').textContent='Étape '+(step+1)+' / 3 • Démonstration isolée';
}
function move(target){
 if(target<0||target>2)return;
 if(target===2){try{calculateEstimate(state)}catch(e){ /* afficher les erreurs dans la page des résultats */ }}
 step=target;render();window.scrollTo({top:0,behavior:'auto'});
}
function setNested(path,raw){
 const parts=path.split('.');
 let target=state;
 for(let i=0;i<parts.length-1;i++)target=target[parts[i]];
 target[parts.at(-1)]=raw;
}
document.addEventListener('change',event=>{
 const t=event.target, v=t.type==='checkbox'?t.checked:t.value;
 if(t.dataset.bind){setNested(t.dataset.bind,v);render();}
 else if(t.dataset.roomindex!==undefined){
   const r=state.rooms[Number(t.dataset.roomindex)];
   if(t.dataset.openingindex!==undefined)r.openings[Number(t.dataset.openingindex)][t.dataset.openingfield]=v;
   else r[t.dataset.roomfield]=v;
   render();
 } else if(t.dataset.extraindex!==undefined){state.extras[Number(t.dataset.extraindex)][t.dataset.extrafield]=v;render();}
});
document.addEventListener('click',event=>{
 const t=event.target.closest('[data-action]');
 if(!t)return;
 const act=t.dataset.action,i=Number(t.dataset.roomindex),j=Number(t.dataset.openingindex);
 if(act==='step'){move(Number(t.dataset.step));return;}
 if(act==='add-room')state.rooms.push({id:'piece-'+Date.now(),name:'Pièce '+(state.rooms.length+1),length:4,width:3,height:2.5,wallFinish:'paint',ceiling:true,openings:[]});
 if(act==='remove-room'&&state.rooms.length>1)state.rooms.splice(i,1);
 if(act==='add-opening')state.rooms[i].openings.push({type:'door',count:1,width:.9,height:2.1});
 if(act==='remove-opening')state.rooms[i].openings.splice(j,1);
 if(act==='add-extra')state.extras.push({name:'Escalier',quantity:1,unitPriceHT:'',hoursPerUnit:''});
 if(act==='remove-extra')state.extras.splice(Number(t.dataset.extraindex),1);
 if(act==='export'){
   let result;try{result=calculateEstimate(state);}catch(e){alert(e.message);return;}
   const json=JSON.stringify({meta:{module:'peintre',status:'demo-only',generatedAt:new Date().toISOString()},state,result},null,2);
   const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='speedarti-peintre-chiffrage-demo.json';a.click();URL.revokeObjectURL(url);return;
 }
 render();
});
$('prevBtn').addEventListener('click',()=>move(step-1));
$('nextBtn').addEventListener('click',()=>move(step+1));
render();
