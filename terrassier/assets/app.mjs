import { CATEGORIES, SOLS, ENGINS } from './prix-reference.mjs';
import { calculerChantier, defaultChantier } from './engine.mjs';
const $=id=>document.getElementById(id);
const money=n=>Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const qty=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2});
const make=(tag,text,cls='')=>{const e=document.createElement(tag);e.textContent=String(text);if(cls)e.className=cls;return e;};
let active='terrassement_fondation',dernier=null;
const numeric=id=>{const s=$(id).value.replace(',','.');return s===''?undefined:Number(s);};
function masquer(){ $('resultats').hidden=true;dernier=null; }
function categories(){
 const root=$('categories');root.replaceChildren();
 for(const [id,obj] of Object.entries(CATEGORIES)){
  const b=make('button','','category'+(id===active?' selected':''));b.type='button';
  b.setAttribute('aria-pressed',String(id===active));
  b.append(make('span',obj.icone),make('span',obj.label));
  b.addEventListener('click',()=>{active=id;categories();sousTypes();adapter();metres();masquer();});
  root.append(b);
 }
}
function sousTypes(){
 const s=$('sous_type_terrassement');s.replaceChildren();
 for(const [id,label] of Object.entries(CATEGORIES[active].sousTypes)){const o=make('option',label);o.value=id;s.add(o);}
}
function adapter(){
 document.querySelectorAll('[data-for]').forEach(e=>{e.hidden=!e.dataset.for.split(' ').includes(active);});
 if(active==='reseaux' && Number($('profondeur_fouille').value)<=0)$('profondeur_fouille').value='0.8';
}
function metres(){
 const a=numeric('longueur'),b=numeric('largeur'),p=numeric('profondeur_fouille');
 const ok=[a,b,p].every(x=>Number.isFinite(x)&&x>0);
 $('metreSurface').textContent=ok?qty(a*b)+' m²':'–';
 $('metreVolume').textContent=ok?qty(a*b*p)+' m³':'–';
 $('metreFoisonne').textContent=ok?qty(a*b*p*(SOLS[$('nature_sol').value]?.foisonnement||1.25))+' m³':'–';
}
function lire(){
 return {nom_calcul:$('nom_calcul').value.trim(),
 dimensions:{longueur:numeric('longueur'),largeur:numeric('largeur'),profondeur_fouille:numeric('profondeur_fouille')},
 options:{
  categorie_terrassement:active,sous_type_terrassement:$('sous_type_terrassement').value,
  nature_sol:$('nature_sol').value,complexite:$('complexite').value,engin_selectionne:$('engin_selectionne').value,
  evacuation_terres:$('evacuation_terres').checked,presence_eau:$('presence_eau').checked,acces_difficile:$('acces_difficile').checked,
  couche_accrochage:$('couche_accrochage').checked,sous_couche_grave:$('sous_couche_grave').checked,
  blindage_fouille:$('blindage_fouille').checked,bordures:$('bordures').checked,fosse_septique:$('fosse_septique').checked,
  classe_enrobe:$('classe_enrobe').value,epaisseur_enrobe:numeric('epaisseur_enrobe'),
  type_revetement:$('type_revetement').value,diametre_tuyau:$('diametre_tuyau').value,
  nombre_regards:numeric('nombre_regards'),taille_regard:$('taille_regard').value,type_beton:$('type_beton').value,
  type_dechet_evacuation:active==='demolition'?'roche':'terre',
  taux_conducteur:numeric('taux_conducteur'),taux_ouvrier:numeric('taux_ouvrier'),taux_tva:numeric('taux_tva')
 }};
}
function afficher(r){
 dernier=r;
 const blocks=[['Fournitures et locations',r.totaux.materiaux_ht],['Main-d’œuvre',r.totaux.main_oeuvre_ht],
               ['Total HT',r.totaux.total_ht],['Total TTC',r.totaux.total_ttc]];
 $('totaux').replaceChildren();
 for(const [i,pair] of blocks.entries()){
  const d=make('div','','total'+(i===3?' primary':''));d.append(make('small',pair[0]),make('b',money(pair[1])));$('totaux').append(d);
 }
 $('materiaux').replaceChildren();
 for(const line of r.materiaux){
  const tr=document.createElement('tr');
  [line.nom,qty(line.quantite_avec_perte),line.unite,money(line.prix_unitaire_ht),money(line.total_ht)]
   .forEach(x=>tr.append(make('td',x)));
  $('materiaux').append(tr);
 }
 $('mainOeuvre').replaceChildren();
 for(const p of r.main_oeuvre.decomposition){
  const tr=document.createElement('tr');[p.poste,qty(p.temps_heures)+' h'].forEach(x=>tr.append(make('td',x)));
  $('mainOeuvre').append(tr);
 }
 for(const [id,items] of [['alertes',r.alertes],['recommandations',r.recommandations]]){
  $(id).replaceChildren();(items.length?items:['Aucun autre point signalé.']).forEach(x=>$(id).append(make('li',x)));
 }
 $('resultats').hidden=false;$('resultats').scrollIntoView({behavior:'smooth',block:'start'});
}
function exporterCSV(){
 if(!dernier)return;
 const r=dernier;
 const rows=[['Code','Poste','Catégorie','Qté théorique','Qté pertes','Unité','P.U. HT','Montant HT']];
 r.materiaux.forEach(x=>rows.push([x.article_id,x.nom,x.categorie,x.quantite_theorique,x.quantite_avec_perte,x.unite,x.prix_unitaire_ht,x.total_ht]));
 rows.push(['','Main-d’œuvre','','','','','',r.totaux.main_oeuvre_ht]);
 rows.push(['','Total HT','','','','','',r.totaux.total_ht]);
 rows.push(['','TVA','','','','','',r.totaux.tva]);
 rows.push(['','Total TTC','','','','','',r.totaux.total_ttc]);
 const content='\uFEFF'+rows.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='speedarti-terrassier-estimation.csv';a.click();URL.revokeObjectURL(url);
}
function reset(){
 active='terrassement_fondation';
 const d=defaultChantier();
 $('nom_calcul').value=d.nom_calcul;
 $('longueur').value=d.dimensions.longueur;$('largeur').value=d.dimensions.largeur;$('profondeur_fouille').value=d.dimensions.profondeur_fouille;
 categories();sousTypes();adapter();metres();masquer();$('erreur').hidden=true;
}
function init(){
 $('retourMetiers').href='../';categories();sousTypes();adapter();
 for(const e of ENGINS){const o=make('option',e.nom+' — '+money(e.jour)+'/jour');o.value=e.id;$('engin_selectionne').add(o);}
 metres();
 $('formulaire').addEventListener('submit',e=>{
  e.preventDefault();$('erreur').hidden=true;
  try{const d=lire();if(!d.nom_calcul)throw Error('Indiquez un nom de calcul.');afficher(calculerChantier(d));}
  catch(err){masquer();$('erreur').textContent=err.message||String(err);$('erreur').hidden=false;}
 });
 $('formulaire').addEventListener('reset',()=>requestAnimationFrame(reset));
 $('formulaire').addEventListener('input',()=>{metres();masquer();});
 $('formulaire').addEventListener('change',()=>{metres();masquer();});
 $('exportCSV').addEventListener('click',exporterCSV);
 $('imprimer').addEventListener('click',()=>window.print());
}
init();