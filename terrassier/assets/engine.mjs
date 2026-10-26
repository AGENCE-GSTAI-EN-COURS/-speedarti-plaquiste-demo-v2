/**
 * Terrassier — moteur métier de démonstration autonome réécrit à partir de SpeedArti V2.
 * Aucune connexion à Supabase ni à la production ; prix indicatifs historiques.
 */
import { SOLS, MAIN_OEUVRE, ENGINS, BETON, ENROBES, REVETEMENTS,
 TUYAUX_PVC, REGARDS, GRANULATS, PROTECTIONS, EVACUATION, ASSAINISSEMENT, CATEGORIES } from './prix-reference.mjs';
const r2=v=>Math.round((v+Number.EPSILON)*100)/100;
const r1=v=>Math.round((v+Number.EPSILON)*10)/10;
const positive=(v,nom,allowZero=false)=>{
 const n=Number(v);
 if(!Number.isFinite(n)||n<0||(!allowZero&&n===0))throw new Error('Valeur invalide : '+nom);
 return n;
};
export function defaultChantier(){
 return {
  nom_calcul:'Chantier terrassement — démo',
  dimensions:{longueur:15,largeur:3,profondeur_fouille:0.8,surface_m2:null},
  options:{categorie_terrassement:'terrassement_fondation',sous_type_terrassement:'tranchee',
    nature_sol:'terre_meuble',complexite:'moyenne',evacuation_terres:true,type_dechet_evacuation:'terre',
    type_revetement:'gravillons',classe_enrobe:'BBSG',epaisseur_enrobe:6,diametre_tuyau:'PVC_160',
    taille_regard:'40x40',nombre_regards:2,engin_selectionne:'auto',taux_tva:20,acces_difficile:false,
    presence_eau:false,remblai_gnt:false,compactage:false,geotextile:true,
    taux_conducteur:MAIN_OEUVRE.conducteur,taux_ouvrier:MAIN_OEUVRE.ouvrier}
 };
}
function ajouter(liste,id,nom,categorie,quantite,unite,pu,perte=1){
 if(!Number.isFinite(quantite)||quantite<0||!Number.isFinite(pu)||pu<0)throw Error('Calcul incohérent : '+id);
 if(quantite===0)return;
 const q=r2(quantite),qp=r2(quantite*perte);
 liste.push({article_id:id,nom,categorie,quantite_theorique:q,quantite_avec_perte:qp,
 quantite_finale:Math.ceil(quantite*perte),unite,prix_unitaire_ht:pu,
 total_ht:r2(quantite*perte*pu),coef_perte_applique:perte});
}
function mainOeuvre(postes,tauxEquipe,nbOuvriers){
 const decomposition=postes.map(([poste,h])=>({poste,temps_heures:r1(h)}));
 const heures=postes.reduce((s,p)=>s+p[1],0);
 return {decomposition,temps_equipe_heures:r1(heures),temps_estime_heures:r1(heures/nbOuvriers),
 nombre_ouvriers:nbOuvriers,taux_equipe_horaire:tauxEquipe,cout_total:r2(r1(heures)*tauxEquipe)};
}
const coefComplexite=(c,demolition=false)=>c==='complexe'?(demolition?1.5:1.3):c==='simple'?0.9:1;
export function calculerChantier(entree){
 if(!entree||typeof entree!=='object')throw new Error('Chantier absent');
 const d={...(entree.dimensions||{})},o={...(entree.options||{})};
 const categorie=o.categorie_terrassement||o.categorie_travaux||'terrassement_fondation';
 if(!CATEGORIES[categorie])throw Error('Catégorie inconnue');
 const sousType=o.sous_type_terrassement||o.sous_type_travaux||Object.keys(CATEGORIES[categorie].sousTypes)[0];
 if(!(sousType in CATEGORIES[categorie].sousTypes))throw Error('Sous-type non compatible avec la catégorie');
 const surfaceDirecte=d.surface_m2!=null&&['enrobe','chemin_acces'].includes(categorie)
   ?positive(d.surface_m2,'surface m²'):null;
 const longueur=positive(d.longueur??(surfaceDirecte!=null?Math.sqrt(surfaceDirecte):undefined),'longueur');
 const largeur=positive(d.largeur??(surfaceDirecte!=null?Math.sqrt(surfaceDirecte):categorie==='reseaux'?0.6:undefined),'largeur');
 const profondeur=positive(d.profondeur_fouille??(categorie==='reseaux'?0.8:0.3),'profondeur');
 const sol=SOLS[o.nature_sol]||SOLS.terre_meuble;
 const surface=r2(surfaceDirecte??longueur*largeur),volume=r2(surface*profondeur);
 const volumeFoisonne=r2(volume*sol.foisonnement);
 const coef=coefComplexite(o.complexite||'moyenne',categorie==='demolition');
 const tauxCond=positive(o.taux_conducteur??MAIN_OEUVRE.conducteur,'taux conducteur');
 const tauxOuv=positive(o.taux_ouvrier??MAIN_OEUVRE.ouvrier,'taux ouvrier');
 const TVA=positive(o.taux_tva??20,'tva',true);
 if(TVA>100)throw Error('TVA hors plage');
 const m=[],alertes=[],recommandations=[],travaux=[];
 let mo;
 const evac=o.evacuation_terres===true;
 if(profondeur>1.3)alertes.push('Fouille profonde : étudier le blindage et les mesures de stabilité avec un professionnel compétent.');
 if(o.presence_eau)alertes.push('Présence d’eau : pompage provisionnel chiffré selon hypothèses de démonstration, étude et dimensionnement à confirmer.');
 if(o.acces_difficile)alertes.push('Accès difficile : contraintes engins et majoration de main-d’œuvre.');
 recommandations.push('Vérifier les démarches DT/DICT et les réseaux existants avant travaux.');
 if(evac)recommandations.push('Vérifier la classification des terres et leur filière de traitement.');
 if(categorie==='terrassement_fondation'){
  if(['tranchee','fondations_superficielles','fondations_profondes'].includes(sousType))
    ajouter(m,'GNT','GNT 0/31,5 remblai','Remblai',volume*.3,'m³',GRANULATS.GNT_0_315,1.1);
  if(['fondations_superficielles','fondations_profondes'].includes(sousType)){
    const classe=BETON[o.type_beton]?o.type_beton:'B25';
    ajouter(m,'BETON','Béton '+classe,'Béton',volume*.8,'m³',BETON[classe],1.05);
    ajouter(m,'POLYANE','Polyane 200 µ','Protection',surface,'m²',PROTECTIONS.polyane_200,1.1);
  }
  ajouter(m,'GEO','Géotextile 200 g/m²','Protection',surface,'m²',PROTECTIONS.geotextile_200,1.15);
  if(evac)ajouter(m,'EVAC','Évacuation déblais','Évacuation',volumeFoisonne,'m³',EVACUATION[o.type_dechet_evacuation]??EVACUATION.terre);
  const hp=volume/sol.productivite,hf=surface*.05,hi=Math.max(1,volume*.02),n=volume>50?3:2;
  mo=mainOeuvre([['Implantation / piquetage',hi*coef],['Excavation mécanique',hp*coef],['Réglage / compactage',hf*coef]],tauxCond+tauxOuv*(n-1),n);
 }else if(categorie==='enrobe'){
  const multicouche=sousType==='pose_enrobe_multicouches';
  const couches=multicouche?(Array.isArray(o.couches_enrobe)&&o.couches_enrobe.length>=2?o.couches_enrobe:[
    {classe:'BBSG',epaisseur_cm:6},{classe:'BBM',epaisseur_cm:4}
  ]):[{classe:o.classe_enrobe||'BBSG',epaisseur_cm:o.epaisseur_enrobe??6}];
  if(couches.length>5)throw Error('5 couches maximum');
  let totalEpaisseurCm=0,tonnageEnrobe=0;
  couches.forEach((c,i)=>{
    if(!ENROBES[c.classe])throw Error('Classe d’enrobé inconnue, couche '+(i+1));
    const ep=positive(c.epaisseur_cm,'épaisseur enrobé couche '+(i+1))/100;
    const e=ENROBES[c.classe],tonnage=surface*ep*e.densite;
    totalEpaisseurCm+=ep*100;tonnageEnrobe+=tonnage;
    ajouter(m,'ENROBE_C'+(i+1),'Enrobé couche '+(i+1)+' — '+c.classe+' ('+r1(ep*100)+' cm)','Enrobé',tonnage,'tonne',e.prix_tonne,1.05);
    if(i>0||o.couche_accrochage)ajouter(m,'ACCROCHAGE_C'+(i+1),'Accrochage couche '+(i+1),'Enrobé',surface,'m²',1.8,1.1);
    if(ep<.04)alertes.push('Épaisseur inférieure à 4 cm sur couche '+(i+1)+' : vérifier le choix technique.');
  });
  if(['pose_enrobe_neuf','pose_enrobe_multicouches'].includes(sousType))
    ajouter(m,'GNT','GNT sous-couche 20 cm','Remblai',surface*.2,'m³',GRANULATS.GNT_0_315,1.1);
  ajouter(m,'GEO','Géotextile 200 g/m²','Protection',surface,'m²',PROTECTIONS.geotextile_200,1.15);
  mo=mainOeuvre([['Préparation support',surface*.02*coef],['Pose enrobé',surface/400*7*coef]],tauxCond+tauxOuv*2,3);
  recommandations.push('Contrôler température, formulation et compactage de l’enrobé.');
  recommandations.push('Épaisseur totale d’enrobé : '+r1(totalEpaisseurCm)+' cm ; tonnage indicatif : '+r2(tonnageEnrobe)+' t.');
 }else if(categorie==='reseaux'){
  const dia=TUYAUX_PVC[o.diametre_tuyau]!=null?o.diametre_tuyau:'PVC_160';
  const nr=positive(o.nombre_regards??Math.max(2,Math.ceil(longueur/15)),'regards',true);
  if(!Number.isInteger(nr))throw Error('Nombre de regards entier requis');
  const regard=REGARDS[o.taille_regard]!=null?o.taille_regard:'40x40';
  ajouter(m,'TUYAU','Canalisation '+dia.replace('_',' Ø')+' mm','Réseaux',longueur,'ml',TUYAUX_PVC[dia],1.05);
  ajouter(m,'REGARDS','Regards '+regard,'Réseaux',nr,'u',REGARDS[regard]);
  ajouter(m,'SABLE','Sable 0/4 enrobage','Remblai',longueur*largeur*.2,'m³',GRANULATS.sable_0_4,1.1);
  ajouter(m,'GEO','Géotextile 200 g/m²','Protection',longueur*(largeur+.4),'m²',PROTECTIONS.geotextile_200,1.15);
  if(sousType==='fosse_septique'||o.fosse_septique===true){
   const fosse=ASSAINISSEMENT[o.type_fosse||'fosse_septique_3000l'];
   if(!fosse)throw Error('Modèle de fosse inconnu');
   ajouter(m,'FOSSE',fosse.nom,'Assainissement',1,'u',fosse.prix);
   alertes.push('Assainissement non collectif : étude de sol, agrément de filière, terrassement spécial et raccordements à valider ; non compris au-delà des postes affichés.');
  }
  ajouter(m,'REMBLAI','Grave 0/80 remblai','Remblai',longueur*largeur*Math.max(0,profondeur-.2),'m³',GRANULATS.grave_0_80,1.1);
  mo=mainOeuvre([['Ouverture tranchée',longueur/15*7*coef],['Pose regards',nr*1.5*coef],['Remblaiement',longueur*.1*coef]],tauxCond+tauxOuv,2);
  recommandations.push('Réseaux : contrôler pente, lit de pose, grillage avertisseur et études techniques.');
 }else if(categorie==='chemin_acces'){
  const rev=REVETEMENTS[o.type_revetement]||REVETEMENTS.gravillons;
  ajouter(m,'REVETEMENT',rev.nom,'Revêtement',surface,'m²',rev.prix_m2,1.05);
  if(o.sous_couche_grave!==false)ajouter(m,'GNT','GNT 0/31,5 sous-couche','Remblai',surface*.2,'m³',GRANULATS.GNT_0_315,1.1);
  if(o.geotextile!==false)ajouter(m,'GEO','Géotextile 200 g/m²','Protection',surface,'m²',PROTECTIONS.geotextile_200,1.15);
  if(evac)ajouter(m,'EVAC','Évacuation terre décaissement','Évacuation',surface*.3*SOLS.terre_meuble.foisonnement,'m³',EVACUATION.terre);
  mo=mainOeuvre([['Décaissement',surface*.02*coef],['Compactage',surface*.015*coef],['Pose revêtement',surface*.03*coef]],tauxCond+tauxOuv,2);
 }else if(categorie==='demolition'){
  const type=o.type_dechet_evacuation||'roche';
  if(evac)ajouter(m,'EVAC_DEMO','Évacuation gravats','Évacuation',volume*1.5,'m³',EVACUATION[type]??EVACUATION.roche);
  mo=mainOeuvre([['Démolition mécanique',volume/3*coef],['Chargement / tri',volume/8*coef]],tauxCond+MAIN_OEUVRE.manoeuvre,2);
 }
 const refVol=volume>0?volume:surface*.5;
 const enginAuto=ENGINS.find(e=>refVol>=e.volume_min&&refVol<e.volume_max)||ENGINS[2];
 const engin=ENGINS.find(e=>e.id===o.engin_selectionne)||enginAuto;
 const jours=Math.max(1,Math.ceil((refVol/sol.productivite)/7));
 ajouter(m,'ENGIN','Location '+engin.nom,'Engins',jours,'jour',engin.jour);
 ajouter(m,'TRANSPORT','Transport aller-retour engin','Engins',1,'forfait',engin.transport);
 // Hypothèses de simulation à compléter avec des prix fournisseurs avant devis réel.
 if(o.presence_eau)ajouter(m,'POMPAGE','Pompage de chantier (provision simulation)','Sécurité / eau',jours,'jour',180);
 if(o.blindage_fouille){
   const surfBlindage=2*longueur*profondeur;
   ajouter(m,'BLINDAGE','Blindage de fouille (provision simulation)','Sécurité',surfBlindage,'m²',35);
 }
 if(o.bordures&&categorie==='chemin_acces')
   ajouter(m,'BORDURES','Bordures + pose (provision simulation)','Voirie',positive(o.longueur_bordures??2*longueur,'longueur bordures'),'ml',42);
 if(o.presence_eau||o.blindage_fouille||o.bordures)alertes.push('Postes de sécurité/finition : prix et quantités de simulation, à remplacer impérativement selon devis réels.');
 const majorationMO=(o.acces_difficile?1.15:1)*(['roche','roche_dure'].includes(o.nature_sol)?1.5:1);
 mo.majoration_prix=majorationMO;
 mo.cout_total=r2(mo.cout_total*majorationMO);
 const materiaux_ht=r2(m.reduce((s,x)=>s+x.total_ht,0));
 const main_oeuvre_ht=mo.cout_total,total_ht=r2(materiaux_ht+main_oeuvre_ht),tva=r2(total_ht*TVA/100);
 if(travaux.length)alertes.push(...travaux.map(x=>x+' : chiffrage incomplet.'));
 return {categorie,sous_type:sousType,
 volumes:{surface_m2:surface,volume_m3:volume,volume_foisonne_m3:volumeFoisonne,longueur_ml:longueur,
 tonnage_enrobe:categorie==='enrobe'?r2(m.filter(x=>x.article_id.startsWith('ENROBE_C')).reduce((n,x)=>n+x.quantite_theorique,0)):0},
 materiaux:m,main_oeuvre:mo,totaux:{materiaux_ht,main_oeuvre_ht,total_ht,tva,total_ttc:r2(total_ht+tva),taux_tva:TVA},
 alertes,recommandations,travaux_non_chiffres:travaux,
 reference:'BPU V2 indicatif 2024–2025 — catalogue, stock et prix fournisseurs non connectés'};
}
/** Révision manuelle ligne par ligne : quantités, PU, heures et prix d'équipe. Ne modifie jamais les métrés originaux. */
export function appliquerAjustements(calcul, ajustements={}){
 const a=ajustements.materiaux||{},b=ajustements.heures||{};
 const copie={
  ...calcul,
  materiaux:calcul.materiaux.map(l=>{
   const override=a[l.article_id]||{};
   const quantite=positive(override.quantite??l.quantite_avec_perte,'quantité '+l.article_id,true);
   const prix=positive(override.prix??l.prix_unitaire_ht,'P.U. '+l.article_id,true);
   return {...l,quantite_avec_perte:r2(quantite),quantite_finale:Math.ceil(quantite),
     prix_unitaire_ht:r2(prix),total_ht:r2(quantite*prix)};
  }),
  main_oeuvre:{...calcul.main_oeuvre,
   decomposition:calcul.main_oeuvre.decomposition.map(p=>({
     ...p,temps_heures:r2(positive(b[p.poste]??p.temps_heures,'heures '+p.poste,true))}))}
 };
 const mo=copie.main_oeuvre;
 mo.temps_equipe_heures=r2(mo.decomposition.reduce((t,p)=>t+p.temps_heures,0));
 mo.temps_estime_heures=r2(mo.temps_equipe_heures/mo.nombre_ouvriers);
 mo.cout_total=r2(mo.temps_equipe_heures*mo.taux_equipe_horaire*(mo.majoration_prix||1));
 const materiaux_ht=r2(copie.materiaux.reduce((t,l)=>t+l.total_ht,0));
 const main_oeuvre_ht=mo.cout_total,total_ht=r2(materiaux_ht+main_oeuvre_ht);
 const tva=r2(total_ht*(copie.totaux.taux_tva??20)/100);
 copie.totaux={...copie.totaux,materiaux_ht,main_oeuvre_ht,total_ht,tva,total_ttc:r2(total_ht+tva)};
 copie.revision_manuelle=true;
 return copie;
}
