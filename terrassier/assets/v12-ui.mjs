import { MENU,PRESTATIONS,CHAMPS,TARIFS,AUDIT_PRIX } from './v12-data.mjs';
import { calculerV12 } from './v12-engine.mjs';
const $=id=>document.getElementById(id),euro=n=>Number(n).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
const fmt=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2}),round=n=>Math.round(n*100)/100;
const el=(tag,text='',cls='')=>{const x=document.createElement(tag);x.textContent=String(text);if(cls)x.className=cls;return x};
const STORAGE='speedarti.terrassier.demo.v12';
const INITIAL={type:'tranchee',valeurs:{},options:{},corrections:{},prixPerso:{}};
const clone=o=>JSON.parse(JSON.stringify(o));
let state=clone(INITIAL),report=null,sauvegardeOK=true,section='terrassement_fondation';
function readStorage(){
 try{const raw=localStorage.getItem(STORAGE);if(!raw)return;
 const obj=JSON.parse(raw);if(obj&&typeof obj==='object'){
  for(const key of Object.keys(INITIAL))if(obj[key]&&typeof obj[key]==='object'||key==='type'&&typeof obj[key]==='string')state[key]=obj[key];
  if(!PRESTATIONS[state.type])state.type='tranchee';
 }}catch(err){sauvegardeOK=false;console.warn('Sauvegarde locale non disponible',err);}
}
function save(){
 try{localStorage.setItem(STORAGE,JSON.stringify(state));sauvegardeOK=true;texteSauvegarde('Enregistré localement sur cet appareil. Aucun envoi serveur.');}
 catch(e){sauvegardeOK=false;texteSauvegarde('Sauvegarde indisponible sur cet appareil : exporter un JSON pour conserver vos prix et corrections.');}
}
function texteSauvegarde(t){$('saveStatut').textContent=t;$('saveStatut').classList.toggle('warn',!sauvegardeOK)}
function setupType(){
 const type=state.type,p=PRESTATIONS[type];
 if(!state.valeurs[type])state.valeurs[type]={};
 if(!state.options[type])state.options[type]={};
 if(!state.corrections[type])state.corrections[type]={};
 const values=state.valeurs[type],options=state.options[type];
 for(const key of p.champs){
  if(values[key]===undefined)values[key]=p.defauts[key]??CHAMPS[key].val;
 }
 for(const key of ['sol','acces','evac','transport','tva','engin']){
  if(options[key]===undefined)options[key]=p.defauts[key]??({sol:'terre_meuble',acces:'normal',evac:true,transport:true,tva:20,engin:'auto'})[key];
 }
 section=p.famille;
}
function activeTarifs(){
 const result={};for(const [code,p] of Object.entries(state.prixPerso)){
   const n=Number(p?.prix);
   if(TARIFS[code]&&Number.isFinite(n)&&n>=0&&n<=1e6)result[code]=n;
 }
 return result;
}
function navigate(){
 $('familles').replaceChildren();
 for(const cat of MENU){
   const b=el('button','','v12Famille'+(section===cat.id?' selected':''));
   b.type='button';b.setAttribute('aria-pressed',String(section===cat.id));
   b.append(el('span',cat.icon),el('b',cat.nom),el('small',cat.sousTypes.length+' prestations'));
   b.addEventListener('click',()=>{
     if(section===cat.id)return;
     section=cat.id;state.type=cat.sousTypes[0].code;
     setupType();renderAll();save();
   });
   $('familles').append(b);
 }
 $('prestations').replaceChildren();
 const cat=MENU.find(x=>x.id===section);
 for(const st of cat.sousTypes){
   const b=el('button',st.nom,'v12Prestation'+(state.type===st.code?' selected':''));
   b.type='button';b.setAttribute('aria-pressed',String(state.type===st.code));
   b.addEventListener('click',()=>{
     state.type=st.code;setupType();renderAll();save();
   });
   $('prestations').append(b);
 }
 $('travauxAvertissement').textContent=PRESTATIONS[state.type].aVerifier;
}
function renderMesures(){
 const p=PRESTATIONS[state.type];$('titreFormulaire').textContent=p.nom;
 $('descriptionFormulaire').textContent='Saisissez '+p.champs.map(k=>CHAMPS[k].label.toLowerCase()).join(', ')+'.';
 $('mesures').replaceChildren();
 for(const key of p.champs){
   const def=CHAMPS[key],label=el('label',def.label+' ('+def.unit+')');
   const input=el('input');input.type='number';input.step=key==='N'||key==='nbRegards'||key==='arbres'?'1':'any';
   input.min=key==='BR'||key==='nbRegards'||key==='securite'?'0':'0.001';
   input.required=true;input.dataset.dimension=key;
   input.value=String(state.valeurs[state.type][key]);
   input.title='Unité : '+def.unit;
   input.addEventListener('input',()=>{
    const val=input.value===''?null:Number(input.value);
    state.valeurs[state.type][key]=val;calculerEtAfficher();save();
   });
   label.append(input);$('mesures').append(label);
 }
 const opts=state.options[state.type];
 $('v12Sol').value=opts.sol||'terre_meuble';
 $('v12Acces').value=opts.acces||'normal';
 $('v12Tva').value=String(opts.tva??20);
 $('v12Evac').checked=opts.evac!==false;
 $('v12Transport').checked=opts.transport!==false;
 $('v12Engin').value=opts.engin||'auto';
 const relevant=!['enrobe','chemin_acces'].includes(section);
 $('v12Sol').closest('label').hidden=!relevant;
 $('v12Evac').closest('label').hidden=opts.evac===undefined?false:!p.champs.includes('distance')&&section==='enrobe';
}
function bindOptions(){
 const mapping=[['v12Sol','sol'],['v12Acces','acces'],['v12Tva','tva'],['v12Engin','engin'],['v12Evac','evac'],['v12Transport','transport']];
 for(const [id,key] of mapping){
  const input=$(id);
  input.addEventListener('change',()=>{
   state.options[state.type][key]=input.type==='checkbox'?input.checked:id==='v12Tva'?Number(input.value):input.value;
   calculerEtAfficher();save();
  });
 }
}
function renderAll(){setupType();navigate();renderMesures();calculerEtAfficher(); }
function calculerEtAfficher(){
 $('erreurV12').hidden=true;
 try{
  report=calculerV12({type:state.type,valeurs:state.valeurs[state.type],
   options:state.options[state.type]},activeTarifs(),state.corrections[state.type]);
  $('rapport').hidden=false;
  renderMetrics();renderTotals();renderLines();renderWarnings();
 }catch(err){
  report=null;$('rapport').hidden=true;$('erreurV12').textContent=err.message||'Erreur de saisie';
  $('erreurV12').hidden=false;$('metresV12').replaceChildren();
 }
}
function renderMetrics(){
 $('metresV12').replaceChildren();
 const m=report.metriques;
 for(const [label,val] of [
   ['Surface',fmt(m.surface_m2)+' m²'],['Volume traité',fmt(m.volume_m3)+' m³'],
   ['Évacuation prévue',fmt(m.volume_evac_m3)+' m³'],
   ['Temps équipe indicatif',fmt(m.heures_estimees)+' h']]){
  const item=el('div');item.append(el('small',label),el('b',val));$('metresV12').append(item);
 }
}
function renderTotals(){
 const r=report;if(!r)return;
 $('totauxV12').replaceChildren();
 const vals=[['Fournitures et transport',r.lignes.filter(l=>l.famille!=='Main-d’œuvre').reduce((n,l)=>n+l.montant,0)],
 ['Main-d’œuvre',r.lignes.filter(l=>l.famille==='Main-d’œuvre').reduce((n,l)=>n+l.montant,0)],
 ['Total HT',r.totaux.total_ht],['Total TTC',r.totaux.total_ttc]];
 vals.forEach(([label,amount],i)=>{
  const d=el('div','','total'+(i===3?' primary':''));d.append(el('small',label),el('b',euro(amount)));
  $('totauxV12').append(d);
 });
}
function renderWarnings(){
 const r=report;
 $('alertesV12').replaceChildren();
 $('limitesV12').replaceChildren();
 for(const x of r.alertes.length?r.alertes:['Vérifier l’ouvrage et la sécurité du chantier.'])$('alertesV12').append(el('li',x));
 for(const x of [...r.provisoire,...r.conseils])$('limitesV12').append(el('li',x));
 $('noticePrix').textContent=r.provisoire.length?
  'ESTIMATION PARTIELLE : des postes obligatoires ne sont pas chiffrés. Ne pas utiliser ce total pour établir un devis.':
  'Simulation HT/TTC non contractuelle : références historiques et prix provisoires à confirmer.';
 $('noticePrix').classList.toggle('danger',r.provisoire.length>0);
}
function renderLines(){
 const parent=$('lignesV12');parent.replaceChildren();
 for(const l of report.lignes){
  const tr=el('tr');tr.dataset.ref=l.id;
  const name=el('td');name.append(el('strong',l.nom),el('small',l.famille,'v12LineCat'));
  tr.append(name,el('td',fmt(l.quantite_calcul)));
  const q=el('td');const qInput=el('input','','v12Edit');
  qInput.type='number';qInput.min='0';qInput.step='any';qInput.value=String(l.quantite);
  qInput.setAttribute('aria-label','Quantité '+l.nom);
  const unit=el('td',l.unite),p=el('td'),pInput=el('input','','v12Edit');
  pInput.type='number';pInput.min='0';pInput.step='any';pInput.value=String(l.pu);
  pInput.setAttribute('aria-label','Prix HT '+l.nom);
  const total=el('td',euro(l.montant),'v12LineTotal');
  const etat=el('td',l.provenance.includes('personnalisé')?'Personnalisé':l.provenance.includes('Provision')?'Provision':'Historique','v12Source');
  function updateField(input,field){
   const val=input.value===''?NaN:Number(input.value);
   if(!Number.isFinite(val)||val<0){
    input.classList.add('invalid');$('erreurV12').textContent='Saisie incomplète : corrigez ce prix ou cette quantité avant export.';$('erreurV12').hidden=false;
    $('exportCSV12').disabled=true;$('exportJSON12').disabled=true;return;
   }
   input.classList.remove('invalid');
   const ed=state.corrections[state.type];ed[l.id]??={};ed[l.id][field]=val;
   try{
    report=calculerV12({type:state.type,valeurs:state.valeurs[state.type],
      options:state.options[state.type]},activeTarifs(),ed);
    total.textContent=euro(report.lignes.find(item=>item.id===l.id)?.montant??0);
    renderTotals();renderWarnings();
    $('erreurV12').hidden=true;$('exportCSV12').disabled=false;$('exportJSON12').disabled=false;
    save();
   }catch(err){$('erreurV12').textContent=err.message;$('erreurV12').hidden=false;}
  }
  qInput.addEventListener('input',()=>updateField(qInput,'quantite'));
  pInput.addEventListener('input',()=>updateField(pInput,'pu'));
  q.append(qInput);p.append(pInput);
  tr.append(q,unit,p,total,etat);parent.append(tr);
 }
}
function catalog(){
 const q=$('recherchePrix').value.toLowerCase().trim();
 const parent=$('prixLignes');parent.replaceChildren();
 for(const [code,p] of Object.entries(TARIFS)){
  if(q&&!(code+' '+p.nom+' '+p.origine).toLowerCase().includes(q))continue;
  const tr=el('tr');
  tr.append(el('td',p.nom),el('td',euro(p.prix)),el('td',p.unite));
  const own=el('td'),input=el('input','','v12Edit');input.type='number';input.min='0';input.step='any';
  input.placeholder=String(p.prix);input.value=state.prixPerso[code]?.prix??'';
  input.setAttribute('aria-label','Mon prix HT '+p.nom);
  const source=el('td'),textSource=el('small',p.origine,'v12Source');
  const detail=el('input','','v12SourceInput');detail.type='text';detail.maxLength=180;
  detail.placeholder='Source / fournisseur local';detail.value=state.prixPerso[code]?.source||'';
  detail.setAttribute('aria-label','Source du prix '+p.nom);
  input.addEventListener('change',()=>{
    const value=input.value.trim();
    if(value===''){delete state.prixPerso[code];save();calculerEtAfficher();catalog();return;}
    const n=Number(value);
    if(!Number.isFinite(n)||n<0||n>1000000){input.classList.add('invalid');return;}
    state.prixPerso[code]={prix:n,source:detail.value.trim(),updatedAt:new Date().toISOString().slice(0,10)};
    save();calculerEtAfficher();catalog();
  });
  detail.addEventListener('change',()=>{
    if(!state.prixPerso[code])return;
    state.prixPerso[code].source=detail.value.trim();save();
  });
  own.append(input);source.append(textSource,detail);
  if(state.prixPerso[code]?.updatedAt)source.append(el('small','Modifié le '+state.prixPerso[code].updatedAt,'v12Source'));
  tr.append(own,source);parent.append(tr);
 }
}
function exportBlob(text,name,mime){
 const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportCSV(){
 if(!report||$('erreurV12').hidden===false)return;
 const rows=[['Code','Prestation','Poste','Catégorie','Quantité','Unité','Prix HT','Total HT','Origine']];
 for(const l of report.lignes)rows.push([l.id,report.nom,l.nom,l.famille,l.quantite,l.unite,l.pu,l.montant,l.provenance]);
 rows.push(['','','TOTAL HT','','','','',report.totaux.total_ht],
 ['','','TVA '+report.tva+' %','','','','',report.totaux.tva],
 ['','','TOTAL TTC','','','','',report.totaux.total_ttc]);
 const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
 exportBlob(csv,'speedarti-terrassier-'+state.type+'.csv','text/csv;charset=utf-8');
}
function exportJSON(){
 if(!report||$('erreurV12').hidden===false)return;
 exportBlob(JSON.stringify({schema:'speedarti-terrassier-v12',exportedAt:new Date().toISOString(),
   state,rapport:report},null,2),'speedarti-terrassier-sauvegarde.json','application/json');
}
async function importJSON(file){
 if(!file||file.size>1e6)throw Error('Le fichier doit être un JSON de moins de 1 Mo');
 const data=JSON.parse(await file.text());
 if(data.schema!=='speedarti-terrassier-v12'||!data.state||typeof data.state!=='object')
  throw Error('Format de sauvegarde non reconnu');
 const incoming=data.state,copy=clone(INITIAL);
 if(PRESTATIONS[incoming.type])copy.type=incoming.type;
 for(const section of ['valeurs','options','corrections']){
  const all=incoming[section];if(!all||typeof all!=='object')continue;
  for(const [id,obj] of Object.entries(all))if(PRESTATIONS[id]&&obj&&typeof obj==='object'){
    copy[section][id]={};
    for(const [key,val] of Object.entries(obj)){
     if(section==='valeurs'&&PRESTATIONS[id].champs.includes(key)&&Number.isFinite(Number(val))&&Number(val)>=0)
       copy.valeurs[id][key]=Number(val);
     if(section==='options'&&['sol','acces','evac','transport','tva','engin'].includes(key))
       copy.options[id][key]=val;
     if(section==='corrections'&&obj[key]&&typeof obj[key]==='object'){
      const row=obj[key];copy.corrections[id][key]={};
      for(const k of ['quantite','pu'])if(Number.isFinite(Number(row[k]))&&Number(row[k])>=0)copy.corrections[id][key][k]=Number(row[k]);
     }
    }
  }
 }
 for(const [code,p] of Object.entries(incoming.prixPerso||{})){
  if(!TARIFS[code]||p==null||!Number.isFinite(Number(p.prix))||Number(p.prix)<0||Number(p.prix)>1e6)continue;
  copy.prixPerso[code]={prix:Number(p.prix),source:String(p.source||'').slice(0,180),updatedAt:String(p.updatedAt||'').slice(0,10)};
 }
 state=copy;setupType();renderAll();catalog();save();
}
function init(){
 readStorage();setupType();
 for(const [code,p] of Object.entries(TARIFS))if(code.startsWith('ENG_')){
  const opt=el('option',p.nom+' ('+euro(p.prix)+'/jour)');opt.value=code;$('v12Engin').append(opt);
 }
 $('formulaireV12').addEventListener('submit',e=>{e.preventDefault();calculerEtAfficher();if(report)$('rapport').scrollIntoView({behavior:'smooth',block:'start'});});
 $('resetTravaux').addEventListener('click',()=>{
  delete state.valeurs[state.type];delete state.options[state.type];delete state.corrections[state.type];
  setupType();renderAll();save();
 });
 $('clearCorrections').addEventListener('click',()=>{state.corrections[state.type]={};calculerEtAfficher();save();});
 $('exportCSV12').addEventListener('click',exportCSV);
 $('exportJSON12').addEventListener('click',exportJSON);
 $('imprimer12').addEventListener('click',()=>window.print());
 $('recherchePrix').addEventListener('input',catalog);
 $('prixReset').addEventListener('click',()=>{
   if(!confirm('Réinitialiser tous les prix personnalisés enregistrés sur cet appareil ?'))return;
   state.prixPerso={};save();calculerEtAfficher();catalog();
 });
 $('importJSON12').addEventListener('click',()=>$('fichierJSON12').click());
 $('fichierJSON12').addEventListener('change',async e=>{
   try{await importJSON(e.target.files[0]);alert('Sauvegarde locale importée.');}
   catch(err){alert('Import impossible : '+err.message);}
   e.target.value='';
 });
 bindOptions();renderAll();catalog();
 texteSauvegarde(sauvegardeOK?'Stockage local actif — vos saisies restent sur cet appareil.':
 'Le stockage local est indisponible — utilisez une sauvegarde JSON.');
}
init();
