import {MENU,PRESTATIONS,CHAMPS,TARIFS} from './v12-data.mjs';
import {nouveauChantier,restaurerChantier,selectionnerFamille,selectionnerPrestation,calculerChantierCompose,ADDONS} from './v13-model.mjs';
import {calculerV12} from './v12-engine.mjs';

const $=id=>document.getElementById(id);
const node=(tag,s='',cls='')=>{const el=document.createElement(tag);el.textContent=String(s);if(cls)el.className=cls;return el};
const euro=x=>Number(x).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const fmt=x=>Number(x).toLocaleString('fr-FR',{maximumFractionDigits:2});
const KEY='speedarti.terrassier.demo.v13';
const KEY_PRIX='speedarti.terrassier.demo.v12';
let chantier=nouveauChantier(),rapport=null,storageAvailable=true;
function readStore(){
 try{
  const s=localStorage.getItem(KEY);
  if(s){const data=JSON.parse(s);chantier=restaurerChantier(data);}
 }catch(e){storageAvailable=false;console.warn('Storage indisponible',e);}
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(chantier));storageAvailable=true;status('Chantier conservé localement, sans serveur.');}
 catch(e){storageAvailable=false;status('Impossible de conserver automatiquement : utilisez l’export JSON.');}
}
function status(txt){$('localStatus').textContent=txt;$('localStatus').classList.toggle('warn',!storageAvailable);}
function tarifsPersonnels(){
 try{
  const old=JSON.parse(localStorage.getItem(KEY_PRIX)||'{}');
  return Object.fromEntries(Object.entries(old.prixPerso||{}).filter(([k,v])=>TARIFS[k]&&Number.isFinite(Number(v.prix))&&Number(v.prix)>=0).map(([k,v])=>[k,Number(v.prix)]));
 }catch(e){return {};}
}
function selected(type){return chantier.prestations.find(x=>x.type===type);}
function card(title,caption){
 const el=node('div','','v13-work-card');
 const h=node('h3',title);el.append(h);
 if(caption)el.append(node('p',caption,'helper'));
 return el;
}
function renderStage1(){
 const fam=$('famillesV13');fam.replaceChildren();
 for(const x of MENU){
  const is=chantier.familles.includes(x.id);
  const label=node('label','','v13-family'+(is?' selected':''));
  const input=document.createElement('input');input.type='checkbox';input.checked=is;
  input.value=x.id;input.setAttribute('aria-label','Famille '+x.nom);
  input.addEventListener('change',()=>{
   selectionnerFamille(chantier,x.id,input.checked);
   renderAll();save();
  });
  label.append(input,node('span',x.icon),node('strong',x.nom),node('small',x.sousTypes.length+' prestations'));
  fam.append(label);
 }
 const list=$('prestationsV13');list.replaceChildren();
 for(const x of MENU.filter(x=>chantier.familles.includes(x.id))){
  const group=node('section','','v13-family-group');
  group.append(node('h3',x.icon+' '+x.nom));
  const choices=node('div','','v13-service-grid');
  for(const s of x.sousTypes){
   const active=!!selected(s.code);
   const label=node('label','','v13-service'+(active?' selected':''));
   const input=document.createElement('input');input.type='checkbox';input.checked=active;
   input.value=s.code;input.setAttribute('aria-label','Prestation '+s.nom);
   input.addEventListener('change',()=>{selectionnerPrestation(chantier,s.code,input.checked);renderAll();save();});
   label.append(input,node('span',s.nom));choices.append(label);
  }
  group.append(choices);list.append(group);
 }
 if(!chantier.familles.length)list.append(node('p','Sélectionnez une ou plusieurs familles ci-dessus.','v13-empty'));
 $('selectionCompteur').textContent=chantier.familles.length+' famille(s) · '+chantier.prestations.length+' prestation(s) sélectionnée(s)';
}
function labelSelect(title,id,choices,value,listener,help=''){
 const label=node('label',title,'v13-field');
 const sel=document.createElement('select');sel.id=id;
 for(const [val,txt] of choices){const o=node('option',txt);o.value=String(val);sel.add(o);}
 sel.value=String(value);
 sel.addEventListener('change',()=>listener(sel.value));
 label.append(sel);if(help)label.append(node('small',help));
 return label;
}
function numberField(title,code,value,fn,unite='',min=0){
 const label=node('label','','v13-field');label.append(node('span',title+(unite?' ('+unite+')':'')));
 const input=document.createElement('input');input.type='number';input.step='any';input.min=String(min);
 input.value=value==null?'':String(value);
 input.setAttribute('aria-label',title);input.dataset.field=code;
 input.addEventListener('input',()=>{
  const val=input.value.trim()===''?null:Number(input.value);
  fn(val);renderRecap();save();
 });
 label.append(input);return label;
}
function statutItem(item){
 const spec=PRESTATIONS[item.type];
 const lbl=spec.famille==='terrassement_fondation'?'Terrassement / fondations':spec.famille==='chemin_acces'?'Accès / parking':spec.famille==='enrobe'?'Enrobé / voirie':spec.famille==='reseaux'?'Réseaux':'Démolition';
 return lbl;
}
function renderStage2(){
 const parent=$('formulairesV13');parent.replaceChildren();
 if(!chantier.prestations.length){parent.append(node('p','Sélectionnez au moins une prestation à l’étape 1.','v13-empty'));return;}
 for(const [position,item] of chantier.prestations.entries()){
  const spec=PRESTATIONS[item.type];
  const container=card((position+1)+'. '+spec.nom,statutItem(item));
  const grid=node('div','','v13-fields');
  for(const k of spec.champs){
   const desc=CHAMPS[k];
   grid.append(numberField(desc.label,k,item.valeurs[k],v=>{item.valeurs[k]=v;},desc.unit,k==='BR'||k==='nbRegards'?0:0.001));
  }
  container.append(grid);
  const options=node('div','','v13-fields v13-field-secondary');
  options.append(labelSelect('Type de sol','sol_'+item.type,
   [['terre_meuble','Terre meuble'],['sable','Sable'],['argile','Argile/limon'],['roche','Roche tendre'],['roche_dure','Roche dure']],
   item.options.sol,v=>{item.options.sol=v;renderRecap();save();}));
  options.append(labelSelect('Accès chantier','acces_'+item.type,
   [['normal','Normal'],['difficile','Difficile']],item.options.acces,
   v=>{item.options.acces=v;renderRecap();save();}));
  const engOptions=[['auto','Choix automatique selon l’ouvrage'],
    ['ENG_1_5','Mini-pelle 1,5 t'],['ENG_3','Mini-pelle 3 t'],['ENG_4','Pelle 4 t — prix à renseigner'],
    ['ENG_8','Pelle 8 t'],['ENG_14','Pelle 14 t'],['ENG_BULL','Bulldozer'],
    ['ENG_ROUL','Compacteur'],['ENG_FIN','Finisseur'],
    ['ENG_FRAIS','Raboteuse'],['ENG_DESS','Rogneuse'],['ENG_PLAQUE','Plaque vibrante']
  ];
  options.append(labelSelect('Machine utilisée','engin_'+item.type,engOptions,item.options.engin||'auto',v=>{
    item.options.engin=v;renderStage2();renderRecap();save();
  },'4 t sans prix fournisseur confirmé'));
  if(item.options.engin==='ENG_4'){
   options.append(numberField('Prix de location pelle 4 t HT/jour','prix4t',item.tarifEngin4t,v=>{
    item.tarifEngin4t=v;},'€',0));
  }
  const aideOptions=[['0','Conducteur seul'],['1','Conducteur + 1 aide'],['2','Conducteur + 2 aides'],['3','Conducteur + 3 aides']];
  options.append(labelSelect('Équipe et main-d’œuvre','aides_'+item.type,aideOptions,item.equipe.aides,
    v=>{item.equipe.aides=Number(v);renderRecap();save();},
    'Les heures des aides sont estimées et modifiables dans le chiffrage.'));
  options.append(labelSelect('Gestion des déblais','evac_'+item.type,
    [['false','Terres laissées sur place / sans évacuation'],['true','Évacuation hors chantier']],String(item.options.evac!==false),
    v=>{item.options.evac=v==='true';renderRecap();save();}));
  options.append(labelSelect('Acheminement de la machine','transport_'+item.type,
    [['true','Transport aller-retour compris'],['false','Machine déjà sur place']],String(item.options.transport!==false),
    v=>{item.options.transport=v==='true';renderRecap();save();}));
  options.append(labelSelect('TVA indicative','tva_'+item.type,
    [['20','20 %'],['10','10 %'],['5.5','5,5 %'],['0','0 %']],String(item.options.tva??20),
    v=>{item.options.tva=Number(v);renderRecap();save();}));
  container.append(options);
  const foot=node('p','Chaque saisie reste associée à cette prestation, indépendamment des autres ouvrages.','helper');
  container.append(foot);parent.append(container);
 }
}
function getRecipeCodes(item){
 try{
  const options={...item.options,engin:item.options.engin==='ENG_4'?'ENG_3':item.options.engin};
  return new Set(calculerV12({type:item.type,valeurs:item.valeurs,options},tarifsPersonnels()).lignes.map(l=>l.id));
 }catch(e){return new Set();}
}
function renderStage3(){
 const parent=$('supplementsV13');parent.replaceChildren();
 if(!chantier.prestations.length){parent.append(node('p','Aucune prestation sélectionnée.','v13-empty'));return;}
 for(const item of chantier.prestations){
  const cont=card(PRESTATIONS[item.type].nom,'Options facultatives en dehors du chiffrage de base');
  const list=node('div','','v13-addon-list');const taken=getRecipeCodes(item);
  const options=Object.entries(ADDONS).filter(([id,val])=>val.familles.includes(PRESTATIONS[item.type].famille));
  for(const [id,opt] of options){
   const tariff=TARIFS[id],isTaken=taken.has(id),actif=item.addons[id]!=null;
   const row=node('div','','v13-addon'+(isTaken?' included':''));
   const label=node('label','','v13-addon-label'),checkbox=document.createElement('input');
   checkbox.type='checkbox';checkbox.checked=actif;checkbox.disabled=isTaken;
   checkbox.setAttribute('aria-label','Option '+opt.label+' pour '+PRESTATIONS[item.type].nom);
   checkbox.addEventListener('change',()=>{
    if(checkbox.checked)item.addons[id]=opt.qte;else delete item.addons[id];
    renderStage3();renderRecap();save();
   });
   label.append(checkbox,node('span',opt.label+(isTaken?' — déjà prévu':' ')));
   row.append(label);
   if(!isTaken){
    row.append(node('small',euro(tariff.prix)+' HT/'+tariff.unite+' (indicatif)','v13-price-hint'));
    if(actif)row.append(numberField('Quantité',id,item.addons[id],value=>{
     item.addons[id]=value;},tariff.unite,0));
   }
   list.append(row);
  }
  cont.append(list);parent.append(cont);
 }
}
function renderRecap(){
 const root=$('recapV13');root.replaceChildren();
 if(!chantier.prestations.length){
  root.append(node('p','Choisissez plusieurs prestations pour constituer votre chantier.','v13-empty'));
  rapport=null;disableExport(true);return;
 }
 try{rapport=calculerChantierCompose(chantier,tarifsPersonnels());}
 catch(e){root.append(node('p',e.message,'error'));rapport=null;disableExport(true);return;}
 const totals=node('div','','v13-totals');
 totals.append(totalCard('Total des travaux HT',euro(rapport.totaux.total_ht)),
  totalCard('TVA cumulée',euro(rapport.totaux.tva)),
  totalCard('Estimation TTC',euro(rapport.totaux.total_ttc),'main'));
 root.append(totals);
 if(rapport.incomplet)root.append(node('p','Attention : au moins une prestation est partielle ou une ligne tarifaire reste à renseigner. Ce total ne peut pas servir de devis professionnel.','notice v13-alert'));
 for(const error of rapport.errors){
  root.append(node('p',PRESTATIONS[error.type]?.nom+' : '+error.message,'error'));
 }
 for(const result of rapport.prestations){
  const details=document.createElement('details');details.className='v13-recap-work';details.open=true;
  const summary=node('summary',result.nom+' — '+euro(result.totaux.total_ht)+' HT');
  details.append(summary);
  const box=node('div','','scroll'),table=node('table','','v13-report-table');
  const thead=document.createElement('thead'),tr=document.createElement('tr');
  ['Désignation','Quantité','Unité','Prix HT','Total HT'].forEach(x=>tr.append(node('th',x)));
  thead.append(tr);table.append(thead);
  const tbody=document.createElement('tbody');
  for(const line of result.lignes){
   const row=document.createElement('tr');
   [line.nom,fmt(line.quantite),line.unite,euro(line.pu),euro(line.montant)].forEach(v=>row.append(node('td',v)));
   tbody.append(row);
  }
  table.append(tbody);box.append(table);details.append(box);
  if(result.manquants.length||result.alertes.length){
   const ul=document.createElement('ul');ul.className='v13-notes';
   [...result.manquants,...result.alertes].forEach(x=>ul.append(node('li',x)));
   details.append(ul);
  }
  root.append(details);
 }
 disableExport(rapport.incomplet||rapport.errors.length>0);
}
function totalCard(label,amount,cls=''){
 const c=node('div','','v13-total'+(cls?' '+cls:''));c.append(node('small',label),node('b',amount));return c;
}
function disableExport(disabled){
 // Export JSON reste toujours possible pour terminer ultérieurement un chantier.
 $('exportCSV13').disabled=disabled;
 $('printV13').disabled=disabled;
}
function renderAll(){renderStage1();renderStage2();renderStage3();renderRecap();}
function download(name,content,mime){
 const blob=new Blob([content],{type:mime}),href=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=href;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(href),2000);
}
function csv(){
 if(!rapport||rapport.incomplet||rapport.errors.length)return;
 const rows=[['Famille','Prestation','Poste','Quantité','Unité','P.U. HT','Montant HT']];
 for(const p of rapport.prestations)for(const l of p.lignes)rows.push([p.famille,p.nom,l.nom,l.quantite,l.unite,l.pu,l.montant]);
 rows.push(['','','TOTAL HT','','','',rapport.totaux.total_ht]);
 rows.push(['','','TOTAL TVA','','','',rapport.totaux.tva]);
 rows.push(['','','TOTAL TTC','','','',rapport.totaux.total_ttc]);
 const protect=x=>{const s=String(x??'');return /^[=+\-@]/.test(s)?"'"+s:s};
 const data='\ufeff'+rows.map(row=>row.map(x=>'"'+protect(x).replaceAll('"','""')+'"').join(';')).join('\r\n');
 download('speedarti-terrassier-chantier-compose.csv',data,'text/csv;charset=utf-8');
}
function init(){
 try{readStore();}catch(e){chantier=nouveauChantier();}
 $('chantierNom').value=chantier.nom;
 $('chantierNom').addEventListener('input',()=>{chantier.nom=$('chantierNom').value;save();});
 $('exportCSV13').addEventListener('click',csv);
 $('exportJSON13').addEventListener('click',()=>download('speedarti-terrassier-chantier.json',JSON.stringify({
  schema:'speedarti-terrassier-chantier-v13',exportedAt:new Date().toISOString(),chantier
 },null,2),'application/json'));
 $('printV13').addEventListener('click',()=>window.print());
 $('resetV13').addEventListener('click',()=>{
  if(!confirm('Créer un nouveau chantier ? Le chantier actuel sera remplacé (exportez le JSON auparavant).'))return;
  chantier=nouveauChantier();$('chantierNom').value=chantier.nom;renderAll();save();
 });
 $('importJSON13').addEventListener('click',()=>$('fileJSON13').click());
 $('fileJSON13').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(file.size>1024*1024)throw Error('Fichier trop volumineux (1 Mo maximum).');
   const obj=JSON.parse(await file.text());
   if(obj.schema!=='speedarti-terrassier-chantier-v13')throw Error('Sauvegarde incompatible.');
   chantier=restaurerChantier(obj.chantier);$('chantierNom').value=chantier.nom;
   renderAll();save();
  }catch(err){alert('Import impossible : '+err.message);}
  e.target.value='';
 });
 renderAll();
 status(storageAvailable?'Données locales sur cet appareil — aucun envoi externe.':'Sauvegarde locale indisponible : export JSON recommandé.');
}
init();