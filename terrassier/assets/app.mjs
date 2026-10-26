import { CATEGORIES, SOLS, ENGINS, ENROBES } from './prix-reference.mjs';
import { calculerChantier, defaultChantier, appliquerAjustements } from './engine.mjs';

const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2});
const euro=n=>Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const node=(tag,texte,cls='')=>{const e=document.createElement(tag);e.textContent=String(texte);if(cls)e.className=cls;return e;};
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const num=id=>{const v=$(id).value.trim().replace(',','.');return v===''?undefined:Number(v);};
const PRESETS={
 tranchee_eu:{name:'Tranchée eaux usées',cat:'reseaux',type:'assainissement_eu',dimensions:{longueur:22,largeur:0.6,profondeur_fouille:1.2},options:{diametre_tuyau:'PVC_160',nombre_regards:3,evacuation_terres:true}},
 fondations:{name:'Fondations de maison',cat:'terrassement_fondation',type:'fondations_superficielles',dimensions:{longueur:45,largeur:0.5,profondeur_fouille:0.65},options:{type_beton:'B25',blindage_fouille:false}},
 acces_gravier:{name:'Accès gravillonné',cat:'chemin_acces',type:'allee_gravier',dimensions:{surface_m2:80},options:{type_revetement:'gravillons',sous_couche_grave:true,bordures:false}},
 parking_enrobe:{name:'Parking enrobé neuf',cat:'enrobe',type:'pose_enrobe_neuf',dimensions:{surface_m2:140},options:{classe_enrobe:'BBSG',epaisseur_enrobe:6,couche_accrochage:true}},
 multicouches:{name:'Enrobé sur plusieurs couches',cat:'enrobe',type:'pose_enrobe_multicouches',dimensions:{surface_m2:160},options:{couche_accrochage:true}},
 fosse:{name:'Fosse septique standard',cat:'reseaux',type:'fosse_septique',dimensions:{longueur:12,largeur:0.8,profondeur_fouille:1.2},options:{fosse_septique:true,type_fosse:'fosse_septique_3000l'}}
};
let categorie='terrassement_fondation', couches=[{classe:'BBSG',epaisseur_cm:6},{classe:'BBM',epaisseur_cm:4}];
let base=null,actuel=null,ajustements={materiaux:{},heures:{}},valide=false;
const categorieSurface=()=>categorie==='enrobe'||categorie==='chemin_acces';

function listeCategories(){
 const target=$('categories');target.replaceChildren();
 for(const [id,cat] of Object.entries(CATEGORIES)){
  const b=node('button','','category'+(categorie===id?' selected':''));b.type='button';
  b.setAttribute('aria-pressed',String(categorie===id));
  b.append(node('span',cat.icone),node('span',cat.label));
  b.addEventListener('click',()=>{
    categorie=id;listeCategories();listeSousTypes();adapter();
    $('modeleActif').textContent='Saisie libre — catégorie : '+cat.label;
    actualiser();
  });
  target.append(b);
 }
}
function listeSousTypes(preferred){
 const s=$('sous_type_terrassement');s.replaceChildren();
 for(const [id,label] of Object.entries(CATEGORIES[categorie].sousTypes)){
  const option=node('option',label);option.value=id;s.add(option);
 }
 if(preferred&&CATEGORIES[categorie].sousTypes[preferred])s.value=preferred;
}
function adapter(){
 const type=$('sous_type_terrassement').value;
 for(const e of document.querySelectorAll('[data-for]'))e.hidden=!e.dataset.for.split(' ').includes(categorie);
 const multiple=categorie==='enrobe'&&type==='pose_enrobe_multicouches';
 $('couchesEnrobe').hidden=!multiple;
 for(const id of ['classe_enrobe','epaisseur_enrobe'])$(id).closest('label').hidden=multiple||categorie!=='enrobe';
 $('blocAjouterFosse').hidden=categorie!=='reseaux'||type==='fosse_septique';
 $('blocTypeFosse').hidden=categorie!=='reseaux'||(type!=='fosse_septique'&&!$('fosse_septique').checked);
 $('blocLongueurBordures').hidden=categorie!=='chemin_acces'||!$('bordures').checked;
 if(multiple && $('listeCouches').children.length!==couches.length)dessinerCouches();
 $('metreVolumeLabel').textContent=categorie==='enrobe'?'Enrobé':'Volume terrassé';
 $('metreFoisonneLabel').textContent=categorie==='enrobe'?'Épaisseur enrobé':'Volume foisonné';
}
function coucheTexte(index){return 'Couche '+(index+1);}
function dessinerCouches(){
 const root=$('listeCouches');root.replaceChildren();
 couches.forEach((c,i)=>{
   const row=node('div','','layerRow');
   const numLabel=node('strong',coucheTexte(i));
   const classe=document.createElement('select');
   classe.setAttribute('aria-label','Classe enrobé couche '+(i+1));
   for(const nom of Object.keys(ENROBES)){const op=node('option',nom);op.value=nom;classe.append(op);}
   classe.value=c.classe;
   classe.addEventListener('change',()=>{c.classe=classe.value;actualiser();});
   const ep=document.createElement('input');ep.type='number';ep.min='1';ep.max='40';ep.step='0.5';ep.value=c.epaisseur_cm;
   ep.setAttribute('aria-label','Épaisseur cm couche '+(i+1));
   ep.addEventListener('input',()=>{c.epaisseur_cm=ep.value===''?null:Number(ep.value);actualiser();});
   const unite=node('span','cm','small-unit');
   row.append(numLabel,classe,ep,unite);
   if(couches.length>2){
    const b=node('button','Retirer','removeLayer');b.type='button';b.setAttribute('aria-label','Retirer couche '+(i+1));
    b.addEventListener('click',()=>{couches.splice(i,1);dessinerCouches();actualiser();});row.append(b);
   }
   root.append(row);
 });
 $('ajouterCouche').disabled=couches.length>=5;
}
function mesurer(){
 const direct=categorieSurface(),l=num('longueur'),w=num('largeur'),p=num('profondeur_fouille'),sa=num('surface_m2');
 const surface=direct?sa:l*w,profondeur=direct?0.3:p;
 const valid=Number.isFinite(surface)&&surface>0&&Number.isFinite(profondeur)&&profondeur>0;
 $('metreSurface').textContent=valid?fmt(surface)+' m²':'–';
 $('metreVolume').textContent=valid?(categorie==='enrobe'?fmt(surface*couchesTotalTonnageParM2())+' t':fmt(surface*profondeur)+' m³'):'–';
 $('metreFoisonne').textContent=valid?(categorie==='enrobe'?fmt(couches.reduce((t,c)=>t+(Number(c.epaisseur_cm)||0),0))+' cm':fmt(surface*profondeur*(SOLS[$('nature_sol').value]?.foisonnement||1.25))+' m³'):'–';
 $('schemaLargeur').textContent=valid?(direct?'Surface '+fmt(surface)+' m²':'Largeur '+fmt(w)+' m'):'Dimensions';
 $('schemaLongueur').textContent=direct?(categorie==='enrobe'?'Enrobé : couches en cm':'Surface de l’ouvrage'):('Longueur : '+(Number.isFinite(l)?fmt(l):'–')+' m');
 $('schemaProfondeur').textContent=direct?('surface '+(Number.isFinite(sa)?fmt(sa):'–')+' m²'):((Number.isFinite(p)?fmt(p):'–')+' m');
 $('schemaDescription').textContent=categorie==='enrobe'?'Coupe de voirie et couches superposées, épaisseurs indicatives.'
  :categorie==='reseaux'?'Tranchée et canalisation — vérifier profondeur et pente.'
  :categorie==='chemin_acces'?'Coupe simplifiée des couches de voirie.'
  :categorie==='demolition'?'Épaisseur / profondeur de la zone à déposer.':'Coupe de fouille schématique, non à l’échelle.';
 $('schemaCouche').setAttribute('fill',categorie==='enrobe'?'#454f61':categorie==='chemin_acces'?'#8aabbc':categorie==='reseaux'?'#6eb6cc':'#7ca5da');
 $('schemaOuvrage').setAttribute('d',categorie==='enrobe'||categorie==='chemin_acces'?'M110 70V116H520V70': 'M183 70V136H470V70');
}
function couchesTotalTonnageParM2(){
 if(categorie!=='enrobe')return 0;
 const multi=$('sous_type_terrassement').value==='pose_enrobe_multicouches';
 const arr=multi?couches:[{classe:$('classe_enrobe').value,epaisseur_cm:num('epaisseur_enrobe')}];
 return arr.reduce((t,c)=>t+(Number(c.epaisseur_cm)||0)/100*(ENROBES[c.classe]?.densite||0),0);
}
function saisir(){
 const surface=categorieSurface();
 return {nom_calcul:$('nom_calcul').value.trim(),
 dimensions:{longueur:surface?undefined:num('longueur'),largeur:surface?undefined:num('largeur'),
   profondeur_fouille:surface?0.3:num('profondeur_fouille'),surface_m2:surface?num('surface_m2'):null},
 options:{categorie_terrassement:categorie,sous_type_terrassement:$('sous_type_terrassement').value,
  nature_sol:$('nature_sol').value,complexite:$('complexite').value,engin_selectionne:$('engin_selectionne').value,
  evacuation_terres:$('evacuation_terres').checked,presence_eau:$('presence_eau').checked,
  acces_difficile:$('acces_difficile').checked,couche_accrochage:$('couche_accrochage').checked,
  sous_couche_grave:$('sous_couche_grave').checked,geotextile:$('geotextile').checked,
  blindage_fouille:$('blindage_fouille').checked,bordures:$('bordures').checked,
  fosse_septique:$('fosse_septique').checked,type_fosse:$('type_fosse').value,
  classe_enrobe:$('classe_enrobe').value,epaisseur_enrobe:num('epaisseur_enrobe'),
  couches_enrobe:couches.map(c=>({...c})),type_revetement:$('type_revetement').value,
  diametre_tuyau:$('diametre_tuyau').value,nombre_regards:num('nombre_regards'),
  taille_regard:$('taille_regard').value,type_beton:$('type_beton').value,
  longueur_bordures:num('longueur_bordures'),type_dechet_evacuation:categorie==='demolition'?'roche':'terre',
  taux_conducteur:num('taux_conducteur'),taux_ouvrier:num('taux_ouvrier'),taux_tva:num('taux_tva')
 }};
}
function renduTotaux(r){
 const lignes=[['Fournitures + engins',r.totaux.materiaux_ht],['Main-d’œuvre',r.totaux.main_oeuvre_ht],
  ['Total HT',r.totaux.total_ht],['Total TTC',r.totaux.total_ttc]];
 const t=$('totaux');t.replaceChildren();
 lignes.forEach(([titre,prix],index)=>{const div=node('div','','total'+(index===3?' primary':''));
 div.append(node('small',titre),node('b',euro(prix)));t.append(div);});
 $('montantDirect').textContent=euro(r.totaux.total_ttc)+' TTC';
 $('statutDirect').textContent=valide?'Récapitulatif validé localement — modifiable.':
 'Estimation HT : '+euro(r.totaux.total_ht)+' · recalcul instantané';
}
function champCellule(value,aria,id,cb,step='0.01'){
 const e=document.createElement('input');e.type='number';e.min='0';e.step=step;
 e.value=String(value);e.className='recapInput';e.setAttribute('aria-label',aria);
 e.dataset.line=id;e.addEventListener('input',()=>cb(e.value));return e;
}
function afficherTableau(r){
 $('materiaux').replaceChildren();
 r.materiaux.forEach(p=>{
  const tr=document.createElement('tr');tr.dataset.article=p.article_id;
  tr.append(node('td',p.nom));
  const q=document.createElement('td'),u=document.createElement('td'),price=document.createElement('td'),total=node('td',euro(p.total_ht),'ligneTotal');
  q.append(champCellule(p.quantite_avec_perte,'Quantité '+p.nom,p.article_id,value=>changerLigne(p.article_id,'quantite',value)));
  u.textContent=p.unite;
  price.append(champCellule(p.prix_unitaire_ht,'Prix unitaire HT '+p.nom,p.article_id,value=>changerLigne(p.article_id,'prix',value)));
  tr.append(q,u,price,total);$('materiaux').append(tr);
 });
 $('mainOeuvre').replaceChildren();
 r.main_oeuvre.decomposition.forEach(p=>{
  const tr=document.createElement('tr');const td=document.createElement('td');
  td.append(champCellule(p.temps_heures,'Heures '+p.poste,p.poste,value=>changerHeures(p.poste,value)));
  tr.append(node('td',p.poste),td);$('mainOeuvre').append(tr);
 });
}
function notifierRevision(){
 valide=false;$('validationInfo').textContent='Corrections manuelles en cours. Validez localement après vérification.';
}
function changerLigne(id,cle,texte){
 if(texte===''){valide=false;$('validationInfo').textContent='Complétez la case vide pour recalculer : le dernier total ne tient pas compte de ce champ.';return; }
 const valeur=Number(texte);if(!Number.isFinite(valeur)||valeur<0){$('validationInfo').textContent='Quantité ou prix invalide.';return;}
 (ajustements.materiaux[id]??={})[cle]=valeur;
 actualiserCorrections();
}
function changerHeures(poste,texte){
 if(texte===''){valide=false;$('validationInfo').textContent='Complétez les heures : dernier total inchangé.';return;}
 const valeur=Number(texte);if(!Number.isFinite(valeur)||valeur<0){$('validationInfo').textContent='Heures invalides.';return;}
 ajustements.heures[poste]=valeur;actualiserCorrections();
}
function actualiserCorrections(){
 if(!base)return;
 try{
  actuel=appliquerAjustements(base,ajustements);notifierRevision();renduTotaux(actuel);
  actuel.materiaux.forEach(l=>{const tr=[...$('materiaux').rows].find(t=>t.dataset.article===l.article_id);
    if(tr)tr.querySelector('.ligneTotal').textContent=euro(l.total_ht);});
  $('erreur').hidden=true;
 }catch(e){ $('validationInfo').textContent='Impossible de recalculer : '+e.message;}
}
function messages(r){
 for(const [id,items] of [['alertes',r.alertes],['recommandations',r.recommandations]]){
  $(id).replaceChildren();
  (items.length?items:['Aucun point signalé.']).forEach(t=>$(id).append(node('li',t)));
 }
}
function actualiser(scroll=false,showError=false){
 adapter();mesurer();ajustements={materiaux:{},heures:{}};valide=false;
 $('validationInfo').textContent='Simulation modifiable — validation locale, sans création de devis.';
 try{
  const d=saisir();if(!d.nom_calcul)throw Error('Renseignez un nom de chantier.');
  base=calculerChantier(d);actuel=base;
  afficherTableau(actuel);renduTotaux(actuel);messages(actuel);
  $('resultats').hidden=false;$('voirDetail').hidden=false;
  $('erreur').hidden=true;
  if(scroll)$('resultats').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){
  base=null;actuel=null;$('resultats').hidden=true;$('voirDetail').hidden=true;
  $('montantDirect').textContent='–';$('statutDirect').textContent=e.message||'Complétez les dimensions.';
  $('erreur').textContent=e.message||'Saisie invalide.';$('erreur').hidden=!showError;
 }
}
function chargerPreset(code){
 const p=PRESETS[code];if(!p)return;
 // Préset indépendant du précédent : réinitialise les options avant préremplissage.
 for(const [id,checked] of Object.entries({
   evacuation_terres:true,presence_eau:false,acces_difficile:false,
   couche_accrochage:false,sous_couche_grave:true,geotextile:true,
   blindage_fouille:false,bordures:false,fosse_septique:false
 }))$(id).checked=checked;
 $('nombre_regards').value=2;$('complexite').value='moyenne';
 $('engin_selectionne').value='auto';$('type_fosse').value='fosse_septique_3000l';
 categorie=p.cat;listeCategories();listeSousTypes(p.type);
 for(const [id,value] of Object.entries(p.dimensions))if($(id))$(id).value=value;
 for(const [id,value] of Object.entries(p.options)){
  const e=$(id);if(e){if(e.type==='checkbox')e.checked=value;else e.value=value;}
 }
 if(p.type==='pose_enrobe_multicouches'){couches=[{classe:'BBSG',epaisseur_cm:6},{classe:'BBM',epaisseur_cm:4}];$('listeCouches').replaceChildren();}
 $('nom_calcul').value=p.name;
 $('modeleActif').textContent='Prestation type sélectionnée : '+p.name+' · tous les champs sont modifiables.';
 actualiser();
 $('formulaire').scrollIntoView({behavior:'smooth',block:'start'});
}
function restaurer(){
 const d=defaultChantier();
 for(const e of $('formulaire').elements){
  if(!e.id)continue;
  if(e.type==='checkbox')e.checked=e.defaultChecked;
  else if(e.tagName==='SELECT'){if(e.id!=='sous_type_terrassement')e.selectedIndex=[...e.options].findIndex(o=>o.defaultSelected)>=0?[...e.options].findIndex(o=>o.defaultSelected):0;}
  else e.value=e.defaultValue;
 }
 categorie='terrassement_fondation';
 couches=[{classe:'BBSG',epaisseur_cm:6},{classe:'BBM',epaisseur_cm:4}];
 $('nom_calcul').value=d.nom_calcul;
 $('longueur').value=d.dimensions.longueur;$('largeur').value=d.dimensions.largeur;
 $('profondeur_fouille').value=d.dimensions.profondeur_fouille;$('surface_m2').value=80;
 listeCategories();listeSousTypes('tranchee');
 $('modeleActif').textContent='Modèle libre — saisie personnalisée.';
 actualiser();
}
function correctionsCompletes(){
 return [...document.querySelectorAll('.recapInput')].every(e=>
  e.value.trim()!==''&&Number.isFinite(Number(e.value))&&Number(e.value)>=0);
}
function exportCSV(){
 if(!actuel)return;
 if(!correctionsCompletes()){
  $('validationInfo').textContent='Complétez les champs du récapitulatif avant export.';
  return;
 }
 const rows=[['Code','Poste','Catégorie','Quantité corrigée','Unité','P.U. HT','Montant HT']];
 for(const l of actuel.materiaux)rows.push([l.article_id,l.nom,l.categorie,l.quantite_avec_perte,l.unite,l.prix_unitaire_ht,l.total_ht]);
 for(const p of actuel.main_oeuvre.decomposition)rows.push(['MO',p.poste,'Main-d’œuvre',p.temps_heures,'h','','']);
 rows.push(['','Main-d’œuvre totale','','','','',actuel.totaux.main_oeuvre_ht]);
 for(const [label,valeur] of [['Total HT',actuel.totaux.total_ht],['TVA',actuel.totaux.tva],['Total TTC',actuel.totaux.total_ttc]])rows.push(['',label,'','','','',valeur]);
 const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='speedarti-terrassier-estimation.csv';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function init(){
 listeCategories();listeSousTypes('tranchee');adapter();
 ENGINS.forEach(e=>{const o=node('option',e.nom+' — '+euro(e.jour)+'/jour');o.value=e.id;$('engin_selectionne').append(o);});
 $('presets').querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>chargerPreset(b.dataset.preset)));
 $('ajouterCouche').addEventListener('click',()=>{
  if(couches.length>=5)return;couches.push({classe:'BBSG',epaisseur_cm:4});dessinerCouches();actualiser();
 });
 $('formulaire').addEventListener('submit',e=>{e.preventDefault();actualiser(true,true);});
 $('formulaire').addEventListener('reset',e=>{e.preventDefault();restaurer();});
 $('formulaire').addEventListener('input',e=>{
   if(e.target.id==='nom_calcul')return;
   actualiser(false,false);
 });
 $('formulaire').addEventListener('change',e=>{
  if(e.target.id==='sous_type_terrassement')adapter();
  if(e.target.id==='fosse_septique'||e.target.id==='bordures')adapter();
  if(e.target.id==='nom_calcul')actualiser();
 });
 $('validerRecap').addEventListener('click',()=>{
  if(!actuel)return;
  if(!correctionsCompletes()){
    $('validationInfo').textContent='Complétez tous les champs de quantité, prix et heures avant validation.';
    return;
  }
  valide=true;
  $('validationInfo').textContent='Récapitulatif validé localement. Vous pouvez exporter le CSV ou imprimer, aucun devis n’a été créé.';
  renduTotaux(actuel);
 });
 $('exportCSV').addEventListener('click',exportCSV);
 $('imprimer').addEventListener('click',()=>window.print());
 actualiser();
}
init();