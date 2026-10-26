import { PRESTATIONS, SOLS, TARIFS } from './v12-data.mjs';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const limit=(v,name,zero=false)=>{
 const n=Number(v);if(v==null||v===''||!Number.isFinite(n)||n<0||(!zero&&n===0))throw Error(name+' doit être '+(zero?'positif ou nul':'supérieur à zéro'));
 if(n>1000000)throw Error(name+' trop élevé');return n;
};
const entr=(m,type)=>Number(m?.[type]);
export function calculerV12(entree,tarifsPerso={},edits={}){
 if(!entree||!PRESTATIONS[entree.type])throw Error('Prestations inconnue');
 const spec=PRESTATIONS[entree.type],v={...spec.defauts,...entree.valeurs},
  o={...spec.defauts,...entree.options},sol=SOLS[o.sol]||SOLS.terre_meuble;
 for(const key of spec.champs){
   if(!Number.isFinite(Number(v[key]))||v[key]==null||v[key]===''||Number(v[key])<0)
     throw Error('Renseignez '+key+' avec une valeur valide');
 }
 const volume=()=>limit(v.L,'Longueur')*limit(v.W,'Largeur')*limit(v.D,'Profondeur');
 const surface=()=>limit(v.S,'Surface');
 const ep=()=>limit(v.E,'Épaisseur')/100;
 const volSurface=()=>surface()*ep();
 const s3=round, liste=[],alertes=[],conseils=[],provisoire=[];
 let heures=0,volumeEvac=0,duree=0,engin=null;
 const taxe=limit(o.tva??20,'TVA',true);
 if(![0,5.5,10,20].includes(taxe))throw Error('TVA non autorisée : sélectionner 0, 5,5, 10 ou 20 %');
 const prix=(id)=>{const base=TARIFS[id];if(!base)throw Error('Référence tarifaire manquante : '+id);
  const custom=tarifsPerso?.[id];return custom===undefined?base.prix:limit(custom,'Prix '+id,true)};
 const item=(id,q,coef=1,libelle=null)=>{
  if(!Number.isFinite(q)||q<0)throw Error('Quantité invalide '+id);
  if(q===0)return;
  const base=TARIFS[id];if(!base)throw Error('Référence absente : '+id);
  const qFinal=s3(q*coef);
  const manuel=edits?.[id]||{};
  const qReel=manuel.quantite===undefined?qFinal:limit(manuel.quantite,'Quantité '+id,true);
  const pu=manuel.pu===undefined?prix(id):limit(manuel.pu,'Prix '+id,true);
  liste.push({id,nom:libelle||base.nom,unite:base.unite,quantite:s3(qReel),
   quantite_calcul:s3(qFinal),pu:s3(pu),montant:s3(qReel*pu),
   famille:id.startsWith('MO_')?'Main-d’œuvre':id.startsWith('ENG_')||id.startsWith('TRANSPORT')?'Engins et transport':'Matériaux et prestations',
   provenance:tarifsPerso?.[id]===undefined?base.origine:'Prix personnalisé local'});
 };
 const mo=(type,h)=>{if(!Number.isFinite(h)||h<0)throw Error('Temps incohérent '+type);heures+=h;item(type,h)};
 const eng=(id,heuresChantier)=>{
  const volH=Number(heuresChantier)||8;
  duree=Math.max(1,Math.ceil(volH/7));
  const choix=o.engin&&o.engin!=='auto'?o.engin:id;
  if(!TARIFS[choix]||!choix.startsWith('ENG_'))throw Error('Engin invalide');
  engin=choix;item(choix,duree);
  if(o.transport!==false)item('TRANSPORT_ENG',1);
 };
 const evac=(vol,type='EVAC_TERRE')=>{
  if(o.evac===false||vol<=0)return;
  volumeEvac=vol;
  item(type,vol);
  if(Number(v.distance)>0)item('TRANSPORT_DECH',vol*Number(v.distance));
 };
 const gnt=(vol)=>item('GRAN_GNT',vol,1.10);
 const geo=(area)=>item('GEOT_200',area,1.15);
 const drain=(long)=>{item('DRAIN',long,1.05);item('GRAN_GRAV',long*.12,1.1);geo(long*1.6);};
 const reseau=(code,long,diametre='PVC_160',nb=0)=>{
  item(diametre,long,1.05);
  if(nb>0)item('REG_40',nb);
  item('GRAN_SABLE',long*Number(v.W||.6)*.2,1.10);
  item('GRAN_080',long*Number(v.W||.6)*Math.max(0,Number(v.D||.8)-.2),1.08);
  geo(long*(Number(v.W||.6)+.4));
  item('GRILLAGE',long);
  if(Number(v.p)>0)conseils.push('Pente saisie : '+v.p+' % — contrôle des altimétries et prescriptions à réaliser.');
 };
 const q=spec.mesure==='volume'?volume():spec.mesure==='surface'?surface():spec.mesure==='reseau'?limit(v.L,'Longueur'):Number(v.N)||Number(v.arbres)||1;
 const m2=spec.mesure==='volume'?limit(v.L,'Longueur')*limit(v.W,'Largeur'):spec.mesure==='surface'?q:spec.mesure==='reseau'?q*Number(v.W||.6):Number(v.L||0)*Number(v.W||0);
 const m3=spec.mesure==='volume'?q:spec.mesure==='surface'?volSurface():spec.mesure==='reseau'?q*Number(v.W||.6)*Number(v.D||.8):Number(v.L||0)*Number(v.W||0)*Number(v.D||0);
 const foison=s3(m3*sol.foison);
 const hExcav=m3/sol.rendement;
 const complexity=o.acces==='difficile'?1.25:1;
 if(o.acces==='difficile')alertes.push('Accès difficile : rendement majoré, vérifier possibilité d’utilisation de l’engin.');
 if(Number(v.D||0)>1.3)alertes.push('Fouille > 1,30 m : vérifier stabilité, blindage et mesures de prévention selon configuration réelle.');
 if(o.sol==='argile')conseils.push('Sol argileux : vérifier les risques géotechniques et le retrait-gonflement.');
 if(o.sol==='roche'||o.sol==='roche_dure')conseils.push('Sol rocheux : prévoir l’outillage et les rendements adaptés.');
 const t=entree.type;
 switch(t){
  case 'tranchee':
    evac(s3(m3*sol.foison));item('GRAN_SABLE',m2*.10,1.10);
    mo('MO_COND',(hExcav+.08*m2)*complexity);mo('MO_OUV',.08*m2*complexity);
    eng(m3>40?'ENG_8':'ENG_3',heures+3);
    break;
  case 'fouille':
    evac(s3(m3*sol.foison));mo('MO_COND',(hExcav+.015*m2)*complexity);
    mo('MO_OUV',.025*m2);eng(m3>180?'ENG_14':m3>45?'ENG_8':'ENG_3',heures+2);break;
  case 'fondations_superficielles':
    evac(s3(m3*sol.foison));item('B25',m3*.8,1.05);item('POLY',m2,1.1);
    mo('MO_COND',hExcav*complexity);mo('MO_OUV',m3*.55*complexity);
    eng('ENG_3',heures+2);
    provisoire.push('Vérifier dimensionnement, dosage, ferraillage et bétonnage : aciers/coffrage non chiffrés.');
    break;
  case 'fondations_profondes':
    evac(s3(m3*sol.foison));mo('MO_COND',hExcav*1.8*complexity);
    eng('ENG_14',heures+4);
    provisoire.push('Forage, tubes, armatures, béton de fondation profonde, essais et étude G2/G3 non chiffrés : estimation partielle et non utilisable comme devis.');
    break;
  case 'nivellement':
    mo('MO_COND',(m2/240*7)*complexity);mo('MO_OUV',m2*.008);
    eng('ENG_BULL',heures+2);
    if(o.evac)evac(s3(m3*sol.foison));
    break;
  case 'decaissement':
    evac(s3(m3*sol.foison));mo('MO_COND',hExcav*complexity+1);
    mo('MO_OUV',m2*.018);eng(m3>100?'ENG_8':'ENG_3',heures+2);
    break;
  case 'allee_beton':
    evac(s3(m2*.25*sol.foison));gnt(m2*Number(v.gnt)/100);
    geo(m2);item('B25',m3,1.07);
    mo('MO_COND',m2*.02*complexity);mo('MO_OUV',m2*.16*complexity);
    eng('ENG_PLAQUE',heures);
    provisoire.push('Treillis, joints, coffrage et finition béton à détailler après choix technique.');
    break;
  case 'allee_enrobe':
    evac(s3(m2*.26*sol.foison));gnt(m2*Number(v.gnt)/100);geo(m2);
    item('EN_BBSG',m3*2.3,1.05);item('ACCRO',m2);
    mo('MO_COND',m2*.025);mo('MO_OUV',m2*.07);
    eng('ENG_ROUL',heures);
    break;
  case 'allee_paves':
    evac(s3(m2*.25*sol.foison));gnt(m2*Number(v.gnt)/100);
    item('GRAN_SABLE',m2*.04,1.1);geo(m2);item('PAVES',m2,1.08);
    mo('MO_COND',m2*.02);mo('MO_OUV',m2*.22*complexity);
    eng('ENG_PLAQUE',heures);
    break;
  case 'allee_gravier':
    evac(s3(m2*(Number(v.E)+Number(v.gnt))/100*sol.foison));
    gnt(m2*Number(v.gnt)/100);geo(m2);
    item('GRAN_GRAV',m3,1.08);mo('MO_COND',m2*.018);
    mo('MO_OUV',m2*.045*complexity);eng('ENG_PLAQUE',heures);break;
  case 'parking':
    evac(s3(m2*(Number(v.E)+Number(v.gnt))/100*sol.foison));
    gnt(m2*Number(v.gnt)/100);geo(m2);
    item('EN_BBSG',m3*2.3,1.05);item('ACCRO',m2);
    item('BORDURE',limit(v.BR,'Bordures',true));
    mo('MO_COND',m2*.028);mo('MO_OUV',m2*.075);
    eng('ENG_ROUL',heures);
    break;
  case 'pose_enrobe_neuf':
    gnt(m2*Number(v.gnt)/100);geo(m2);
    item('EN_BBSG',m3*2.3,1.05);item('ACCRO',m2);
    mo('MO_COND',m2*.026);mo('MO_OUV',m2*.065);
    eng('ENG_FIN',heures);
    break;
  case 'pose_enrobe_multicouches':
    gnt(m2*Number(v.gnt)/100);geo(m2);
    item('EN_BBSG',m3*2.3,1.05,'BBSG couche de base');
    item('EN_BBM',m2*limit(v.ep2,'Épaisseur deuxième couche')/100*2.3,1.05);
    item('ACCRO',m2*2);
    mo('MO_COND',m2*.044);mo('MO_OUV',m2*.095);
    eng('ENG_FIN',heures);
    break;
  case 'enrobe_rechargement':
    item('EN_BBSG',m3*2.3,1.05);item('ACCRO',m2);
    mo('MO_COND',m2*.014);mo('MO_OUV',m2*.04);
    eng('ENG_FIN',heures);break;
  case 'reparation':
    evac(s3(m3*1.25),'EVAC_ENROBE');item('EN_BBSG',m3*2.3,1.09);
    item('ACCRO',m2);item('ENG_CAROT',1);
    mo('MO_OUV',m2*.14);mo('MO_COND',m2*.065);
    eng('ENG_PLAQUE',heures);
    break;
  case 'assainissement_eu':
    reseau(t,q,'PVC_160',limit(v.nbRegards,'Regards',true));
    evac(s3(m3*sol.foison));
    mo('MO_COND',(q/15*7)*complexity);mo('MO_OUV',q*.18);
    eng('ENG_3',heures+2);break;
  case 'assainissement_ep':
    reseau(t,q,'PVC_200',limit(v.nbRegards,'Regards',true));
    evac(s3(m3*sol.foison));
    mo('MO_COND',(q/16*7)*complexity);mo('MO_OUV',q*.17);
    eng('ENG_3',heures+2);break;
  case 'eau_potable':
    reseau(t,q,'AEP_32',0);
    evac(s3(m3*sol.foison));
    mo('MO_COND',(q/17*7)*complexity);mo('MO_OUV',q*.23);
    eng('ENG_3',heures+2);
    provisoire.push('Raccords, vannes, désinfection, épreuves de pression, conformité concessionnaire et comptage non chiffrés.');
    break;
  case 'reseau_sec':
    reseau(t,q,'TPC_63',0);
    evac(s3(m3*sol.foison));
    mo('MO_COND',(q/20*7)*complexity);mo('MO_OUV',q*.13);
    eng('ENG_3',heures+2);
    provisoire.push('Nombre de fourreaux, boîtes de tirage, câblage, prescriptions du gestionnaire à compléter.');
    break;
  case 'fosse_septique':
    evac(s3(m3*sol.foison));item('FOSSE_3000',limit(v.N,'Nombre de fosses'));
    item('GRAN_SABLE',m2*.20,1.10);item('PVC_100',10,1.05);
    mo('MO_COND',(hExcav+4)*complexity);mo('MO_OUV',10);
    eng('ENG_8',heures+3);
    provisoire.push('Dispositif ANC non complet : étude de sol, filière de traitement, ventilation, raccordements, contrôles SPANC non chiffrés.');
    break;
  case 'drainage':
    drain(q);evac(s3(m3*sol.foison));
    mo('MO_COND',(q/14*7)*complexity);mo('MO_OUV',q*.18);
    eng('ENG_3',heures+2);break;
  case 'demolition_beton':
    evac(s3(m3*1.45),'EVAC_GRAV');item('ENG_BRH',Math.max(1,Math.ceil(m3/8)));
    mo('MO_COND',m3/2.3*complexity);mo('MO_MAN',m3*.32);
    eng(m3>30?'ENG_8':'ENG_3',heures+2);
    conseils.push('Diagnostic préalable et gestion des poussières/éléments structurels selon ouvrage.');
    break;
  case 'demolition_enrobe':
    evac(s3(m3*1.35),'EVAC_ENROBE');
    mo('MO_COND',m2/65*7*complexity);mo('MO_MAN',m2*.012);
    eng('ENG_FRAIS',heures+2);break;
  case 'depose_reseaux':
    evac(s3(m3*.45),'EVAC_GRAV');
    mo('MO_COND',q/11*7*complexity);mo('MO_MAN',q*.26);
    eng('ENG_3',heures+2);
    provisoire.push('Consignation et neutralisation des fluides/câbles et risques pollution non chiffrés.');
    break;
  case 'dessouchage':
    {
    const nb=limit(v.arbres,'Nombre de souches'),diam=limit(v.diametreArbre,'Diamètre');
    const hd=nb*(.8+diam/60)*complexity;
    evac(s3(nb*(diam/100)**3*.9),'EVAC_VERT');
    mo('MO_COND',hd);mo('MO_MAN',nb*.35);eng('ENG_DESS',heures);
    conseils.push('Vérifier réseaux et contraintes racinaires, protection des arbres conservés.');
    }
    break;
  default:throw Error('La recette de cette prestation est absente');
 }
 if(o.evac===false&&['tranchee','fouille','fondations_superficielles','decaissement','demolition_beton','demolition_enrobe','depose_reseaux'].includes(t))
   conseils.push('Aucune évacuation : stockage des déblais sur site à valider.');
 if(provisoire.length===0&&['fondations_superficielles','parking','allee_beton'].includes(t))
   conseils.push('Vérifier les plans d’exécution et les préconisations de l’étude de sol.');
 conseils.push('Prix de démonstration, non validés pour devis réel. Le coût des engins est séparé de la main-d’œuvre pour éviter le double comptage.');
 conseils.push('Vérifier DT/DICT, contraintes de sécurité et filières de déchets selon le chantier.');
 const totalHT=s3(liste.reduce((n,x)=>n+x.montant,0)),
    montantTVA=s3(totalHT*taxe/100);
 return {
  version:'1.2',type:t,nom:spec.nom,famille:spec.famille,
  devise:'EUR',tva:taxe,
  metriques:{surface_m2:s3(m2),volume_m3:s3(m3),volume_foisonne_m3:foison,
    volume_evac_m3:s3(volumeEvac),heures_estimees:s3(heures),jours_location:duree,
    engin:engin||'aucun'},
  lignes:liste,totaux:{total_ht:totalHT,tva:montantTVA,total_ttc:s3(totalHT+montantTVA)},
  alertes,conseils,provisoire,fiable_pour_devis:false,
  date_references:'2024–2025 + hypothèses internes non validées en 2026',
  signale:'Les coûts de fourniture, main-d’œuvre et engins sont distincts; vérifier transport, traitement, dimensionnement et conditions locales.'
 };
}
