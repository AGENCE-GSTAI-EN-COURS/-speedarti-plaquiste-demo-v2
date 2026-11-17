/**
 * SPEEDARTI Terrassier V1.3 — modèle de chantier composé (sans réseau).
 * Compatible avec les référentiels et le moteur existants de V1.2.
 * Aucun appel à Supabase ni aucune modification du dépôt V2.
 */
import { MENU,PRESTATIONS,CHAMPS,TARIFS } from './v12-data.mjs';
import { calculerV12 } from './v12-engine.mjs';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export const ADDONS={
 POMPAGE:{label:'Pompage / gestion de l’eau',familles:['terrassement_fondation','reseaux'],qte:1},
 BLINDAGE:{label:'Blindage provisoire de fouille',familles:['terrassement_fondation','reseaux'],qte:10},
 SIGNAL:{label:'Signalisation de chantier',familles:['terrassement_fondation','chemin_acces','enrobe','reseaux','demolition'],qte:1},
 BORDURE:{label:'Bordures et pose complémentaires',familles:['chemin_acces'],qte:10},
 GEOT_200:{label:'Géotextile complémentaire',familles:['terrassement_fondation','chemin_acces','reseaux'],qte:10}
};
const famillesValid=new Set(MENU.map(x=>x.id));
export function nouveauChantier(){
 return {version:'1.3',nom:'Nouveau chantier Terrassier',familles:[],prestations:[],createdAt:new Date().toISOString()};
}
function newItem(type){
 const spec=PRESTATIONS[type];if(!spec)throw Error('Prestation inconnue : '+type);
 const valeurs={};
 for(const k of spec.champs) valeurs[k]=spec.defauts[k]??CHAMPS[k].val;
 return {id:type,type,valeurs,options:{...spec.defauts,engin:'auto',evac:spec.defauts.evac!==false},
  equipe:{conducteurs:1,aides:0},addons:{},corrections:{},tarifEngin4t:null};
}
export function verifierChantier(st){
 if(!st||!Array.isArray(st.familles)||!Array.isArray(st.prestations))throw Error('Chantier invalide');
 if(st.familles.some(x=>!famillesValid.has(x)))throw Error('Famille inconnue');
 if(st.prestations.some(x=>!PRESTATIONS[x.type]||!st.familles.includes(PRESTATIONS[x.type].famille)))throw Error('Prestation hors famille');
 if(new Set(st.prestations.map(x=>x.type)).size!==st.prestations.length)throw Error('Prestation dupliquée');
 return st;
}
export function selectionnerFamille(ch,code,actif){
 if(!famillesValid.has(code))throw Error('Famille inconnue : '+code);
 if(actif&&!ch.familles.includes(code))ch.familles.push(code);
 if(!actif){ch.familles=ch.familles.filter(x=>x!==code);ch.prestations=ch.prestations.filter(x=>PRESTATIONS[x.type].famille!==code);}
 return verifierChantier(ch);
}
export function selectionnerPrestation(ch,type,actif){
 const spec=PRESTATIONS[type];if(!spec)throw Error('Prestation inconnue : '+type);
 if(!ch.familles.includes(spec.famille))throw Error('Sélectionner d’abord la famille');
 if(actif&&!ch.prestations.some(x=>x.type===type))ch.prestations.push(newItem(type));
 if(!actif)ch.prestations=ch.prestations.filter(x=>x.type!==type);
 return verifierChantier(ch);
}
export function restaurerChantier(ch){
 // Chargement sûr : les paramètres non reconnus sont écartés.
 const result=nouveauChantier();result.nom=typeof ch?.nom==='string'?ch.nom.slice(0,120):result.nom;
 for(const f of Array.isArray(ch?.familles)?ch.familles:[])if(famillesValid.has(f))selectionnerFamille(result,f,true);
 for(const i of Array.isArray(ch?.prestations)?ch.prestations:[]){
  if(!PRESTATIONS[i?.type]||!result.familles.includes(PRESTATIONS[i.type].famille))continue;
  selectionnerPrestation(result,i.type,true);
  const item=result.prestations.find(x=>x.type===i.type);
  if(i.valeurs&&typeof i.valeurs==='object')for(const [k,v] of Object.entries(i.valeurs)){
   if(PRESTATIONS[i.type].champs.includes(k)&&Number.isFinite(Number(v))&&v!==null&&v!==''&&Number(v)>=0)item.valeurs[k]=Number(v);
  }
  if(i.options&&typeof i.options==='object'){
   for(const k of ['sol','acces','evac','transport','engin','tva'])
    if(i.options[k]!==undefined)item.options[k]=i.options[k];
  }
  if(i.equipe&&typeof i.equipe==='object'){
   if(Number.isInteger(i.equipe.aides)&&i.equipe.aides>=0&&i.equipe.aides<=3)item.equipe.aides=i.equipe.aides;
  }
  if(i.addons&&typeof i.addons==='object')for(const [k,v] of Object.entries(i.addons)){
   if(ADDONS[k]&&Number.isFinite(Number(v))&&Number(v)>0)item.addons[k]=Number(v);
  }
  if(i.corrections&&typeof i.corrections==='object')for(const [id,v] of Object.entries(i.corrections)){
   if(TARIFS[id]&&v&&Number.isFinite(Number(v.pu))&&Number(v.pu)>=0)item.corrections[id]={pu:Number(v.pu)};
  }
  if(i.tarifEngin4t!=null&&Number.isFinite(Number(i.tarifEngin4t))&&Number(i.tarifEngin4t)>0)item.tarifEngin4t=Number(i.tarifEngin4t);
 }
 return verifierChantier(result);
}
function calculePrestation(item,tarifsPerso){
 const nom=PRESTATIONS[item.type]?.nom||item.type;
 const v={...item.valeurs},options={...item.options};
 let engin4=options.engin==='ENG_4';
 if(engin4)options.engin='ENG_3'; // uniquement pour calculer les jours, tarif 3T exclu immédiatement.
 const base=calculerV12({type:item.type,valeurs:v,options},tarifsPerso,item.corrections||{});
 const lignes=base.lignes.map(l=>({...l}));
 const alertes=[...base.alertes],manquants=[...base.provisoire];
 if(engin4){
  const machine=lignes.find(x=>x.id==='ENG_3');
  if(!machine) throw Error('Durée d’engin non calculable pour '+nom);
  const p=Number(item.tarifEngin4t);
  machine.id='ENG_4';machine.nom='Pelle 4 t — tarif personnel à confirmer';
  if(!Number.isFinite(p)||p<=0){
   machine.pu=0;machine.montant=0;
   manquants.push('Prix de location pelle 4 t absent : chiffrage incomplet. Saisir le tarif HT/jour dans l’étape 2.');
  }else{machine.pu=round(p);machine.montant=round(machine.quantite*p);}
  machine.provenance='Prix utilisateur (4 t), aucun barème fabricant validé';
 }
 const aides=Number(item.equipe?.aides??0);
 if(!Number.isInteger(aides)||aides<0||aides>3)throw Error('Nombre d’aides invalide');
 const chauffeur=lignes.find(x=>x.id==='MO_COND');
 const aide=lignes.find(x=>x.id==='MO_OUV'||x.id==='MO_MAN');
 if(aide){
  if(aides===0){
   if(chauffeur){chauffeur.quantite=round(chauffeur.quantite+aide.quantite);chauffeur.montant=round(chauffeur.quantite*chauffeur.pu);}
   else manquants.push('Prestations nécessitant une manutention sans chauffeur identifié.');
   lignes.splice(lignes.indexOf(aide),1);
   alertes.push('Conducteur seul : les heures initialement affectées à un aide sont reprises par le conducteur (hypothèse à vérifier).');
  }else{
   aide.quantite=round(aide.quantite*aides);
   aide.montant=round(aide.quantite*aide.pu);
   if(aides>1)alertes.push(aides+' aides : heures d’aide multipliées par '+aides+' (hypothèse de simulation).');
  }
 }
 for(const [id,q] of Object.entries(item.addons||{})){
  if(!ADDONS[id]||!ADDONS[id].familles.includes(PRESTATIONS[item.type].famille))continue;
  if(lignes.some(l=>l.id===id)){alertes.push('Option '+TARIFS[id]?.nom+' déjà comprise dans la recette : aucun doublon ajouté.');continue;}
  if(q==null||q==='')throw Error('Quantité complémentaire manquante : '+id);
  const qty=Number(q);if(!Number.isFinite(qty)||qty<0)throw Error('Quantité complémentaire invalide : '+id);
  if(qty===0)continue;
  const price=TARIFS[id];if(!price)throw Error('Tarif manquant pour l’option '+id);
  const custom=tarifsPerso?.[id],pu=custom==null?price.prix:Number(custom);
  if(!Number.isFinite(pu)||pu<0)throw Error('Prix complémentaire invalide : '+id);
  lignes.push({id,nom:price.nom+' (complément)',unite:price.unite,
    quantite:round(qty),quantite_calcul:round(qty),pu:round(pu),montant:round(qty*pu),
    famille:'Options complémentaires',provenance:custom==null?price.origine:'Prix personnalisé local'});
 }
 const totalHT=round(lignes.reduce((s,l)=>s+l.montant,0));
 const totalTVA=round(totalHT*base.tva/100);
 return {id:item.id,type:item.type,nom,famille:PRESTATIONS[item.type].famille,
   lignes,totaux:{total_ht:totalHT,tva:totalTVA,total_ttc:round(totalHT+totalTVA)},tva:base.tva,
   metriques:base.metriques,alertes,manquants,conseils:base.conseils};
}
export function calculerChantierCompose(ch,tarifsPerso={}){
 verifierChantier(ch);
 const prestations=[],errors=[];
 for(const item of ch.prestations){
  try{prestations.push(calculePrestation(item,tarifsPerso));}
  catch(e){errors.push({type:item.type,message:e.message});}
 }
 const ht=round(prestations.reduce((s,p)=>s+p.totaux.total_ht,0));
 const tva=round(prestations.reduce((s,p)=>s+p.totaux.tva,0));
 return {prestations,errors,totaux:{total_ht:ht,tva,total_ttc:round(ht+tva)},
   incomplet:errors.length>0||prestations.some(p=>p.manquants.length>0),
   nombre_familles:ch.familles.length,nombre_prestations:ch.prestations.length};
}