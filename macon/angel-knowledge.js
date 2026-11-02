import {
  STRUCTURE_WARNING, FIBRE_WARNING, PREFAB_TEAM_ADVICE, PREFAB_H_PER_ML,
  TRUCK_8X4_DEFAULT, FIBRES, CHIMNEY_CONDUITS, CHIMNEY_STACKS, CHIMNEY_CAPS,
  CONCRETE_CLASSES, MASONRY_DEFAULTS, MORTAR_SITE_PARPAING_20, TREILLIS_GUILLAUME, MICROPILE_PRICE_BY_DEPTH, LONGRINE_PRICE_ML,
  PREFAB_DEFAULT_PRICE_M2, PUMP_DEFAULT_PRICE, TOUPIE_PRICE_M3, TOUPIE_MIN_BILLABLE_M3,
  TOUPIE_CAPACITY_M3, WORKS
} from './references.js';

const euro=n=>Number(n||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' € HT';
const fmt=(n,d=2)=>Number(n||0).toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const baseEntries=[
  {
    id:'MAC-SEC-STRUCTURE',topic:'securite',
    tags:['structure','dimensionnement','charge','beton','acier','ferraillage','ingenieur','etude beton','securite'],
    title:'Limite de dimensionnement structurel',
    answer:STRUCTURE_WARNING
  },
  {
    id:'MAC-PRIX-PRIORITE',topic:'prix',
    tags:['prix','catalogue','automatique','manuel','a confirmer','priorite','resultat'],
    title:'Priorité des prix Maçon',
    answer:'Priorité SpeedArti Maçon : le moteur calcule d’abord les quantités, puis cherche automatiquement un article catalogue compatible et tarifé. Un prix personnel explicite remplace le prix automatique. Si aucun prix fiable n’existe, le résultat reste accessible et le poste est signalé « à confirmer » ; aucun prix n’est inventé.'
  },
  {
    id:'MAC-MO-OUVRIERS',topic:'main_oeuvre',
    tags:['ouvrier','ouvriers','heures homme','heures-homme','duree','planning','main oeuvre','cout'],
    title:'Heures-homme et nombre d’ouvriers',
    answer:'Le nombre d’ouvriers ne change pas les heures-homme nécessaires à l’ouvrage. Durée chantier = heures-homme totales ÷ nombre d’ouvriers. Coût de main-d’œuvre = heures-homme totales × taux horaire.'
  },
  {
    id:'MAC-MURS-RATIOS-PARPAING',topic:'murs',
    tags:['mur','parpaing','ratio','blocs','temps','heures homme','prerempli'],
    title:'Ratios parpaing préremplis',
    answer:'Pour le parpaing, la démo propose automatiquement '+MASONRY_DEFAULTS.parpaing.blocksPerM2+' blocs/m² et '+fmt(MASONRY_DEFAULTS.parpaing.wallHPerM2,2)+' h-homme/m². Ces valeurs restent modifiables. Aucun ratio n’est appliqué automatiquement aux autres matériaux sans référentiel validé.'
  },
  {
    id:'MAC-MURS-CLASSE-BETON-BA',topic:'murs',
    tags:['mur','classe beton','chainage','linteau','poutre','ba','bloquant'],
    title:'Classe béton visible pour les ouvrages BA des murs',
    answer:'Lorsqu’un mur utilise des chaînages, linteaux, poutres BA ou du béton banché, la classe béton doit être visible et renseignable dans le parcours. Le chiffrage ne doit jamais bloquer sur une classe béton sans afficher le champ correspondant.'
  },
  {
    id:'MAC-CHEMINEE-QUANTITES',topic:'cheminee',
    tags:['cheminee','souche','chapeau','quantite','defaut'],
    title:'Quantité par défaut souche et chapeau',
    answer:'Lorsqu’une souche ou un chapeau est sélectionné, la quantité proposée est 1. Elle reste modifiable. Une référence sélectionnée avec quantité nulle doit produire une alerte explicite et ne doit jamais disparaître silencieusement du prix.'
  },
  {
    id:'MAC-ARRONDI-MONETAIRE',topic:'prix',
    tags:['arrondi','centime','tva','ttc','ht','total'],
    title:'Arrondis monétaires cohérents',
    answer:'Les montants monétaires sont arrondis au centime. La TVA est arrondie au centime et le TTC est calculé comme HT arrondi + TVA arrondie, afin que les montants affichés s’additionnent exactement.'
  },
  {
    id:'MAC-MORTIER-CHANTIER-PARPAING',topic:'murs',
    tags:['mortier','chantier','ciment','sable','parpaing','20 cm','dtu 20.1'],
    title:'Mortier traditionnel fabriqué sur chantier',
    answer:'Pour un mur en parpaings de 20 cm à pose traditionnelle, la démo propose '+MORTAR_SITE_PARPAING_20.cementKgPerM2+' kg de ciment/m² et '+MORTAR_SITE_PARPAING_20.sandM3PerM2+' m³ de sable 0/4/m². Le dosage correspond à environ '+MORTAR_SITE_PARPAING_20.cementDosageKgPerM3Sand+' kg de ciment par m³ de sable, dans la plage DTU 20.1 de 300 à 350 kg/m³. Les valeurs restent modifiables.'
  },
  {
    id:'MAC-CATALOGUE-CONDITIONNEMENT',topic:'catalogue',
    tags:['catalogue','piece','barre','conditionnement','linteau','prix','kg'],
    title:'Besoin métier et conditionnement fournisseur',
    answer:'Le besoin métier peut rester exprimé en kg tandis que le fournisseur vend une armature à la pièce. Dans ce cas SpeedArti calcule le nombre de pièces à commander à partir de la longueur réelle et facture le nombre de pièces, jamais les kilogrammes multipliés par le prix d’une pièce.'
  },
  {
    id:'MAC-REFERENTIELS-INTERNES-UX',topic:'murs',
    tags:['consommation','blocs','temps','ratio','interne','speedarti','artisan','interface'],
    title:'Référentiels métier internes masqués aux artisans',
    answer:'Les consommations par m², temps unitaires et dosages internes servant au calcul sont des données SpeedArti. Elles alimentent automatiquement le moteur mais ne doivent pas être demandées ni affichées comme réglages métier à l’artisan.'
  },
  {
    id:'MAC-NAVIGATION-DEPART',topic:'parcours',
    tags:['etape','navigation','demarrage','retour','precedent'],
    title:'Démarrage et retour entre étapes',
    answer:'À chaque ouverture de la démo, le parcours démarre à l’étape 1. Les données du projet peuvent être conservées, mais l’étape courante n’est pas persistée. Les étapes déjà parcourues restent accessibles pour revenir en arrière.'
  },
  {
    id:'MAC-S65-RETOUR-GUILLAUME',topic:'parcours',
    tags:['s6.5','refend','semelle','coffre tunnel','seuil ba','isolation plancher','genoise','mobile','escalier'],
    title:'S6.5 — corrections pré-production Guillaume',
    answer:'Le module Maçon ne propose plus l’escalier. Un mur de refend en soubassement comprend sa semelle filante. Les coffres tunnels brique/résine sont chiffrés au ml avec prix explicite. Le seuil BA ne demande plus de hauteur de baie. L’isolation de plancher et les génoises demandent un prix explicite tant que l’audit catalogue n’est pas terminé. Les saisies numériques mobiles ne doivent plus provoquer de rerendu complet du formulaire.'
  },
  {
    id:'MAC-MURS-OUVERTURES',topic:'murs',
    tags:['mur','murs','ouverture','ouvertures','fenetre','porte','surface nette','linteau','seuil','appui'],
    title:'Déduction des ouvertures dans les murs',
    answer:'Les ouvertures sont déduites de la surface brute du mur. Les ouvrages associés à l’ouverture, par exemple linteau, seuil ou appui, restent calculés séparément lorsqu’ils sont sélectionnés.'
  },
  {
    id:'MAC-SEMELLE-DIMENSIONS',topic:'fondations',
    tags:['semelle','fondation','longueur','largeur','hauteur','epaisseur','cm','metre','volume'],
    title:'Saisie des semelles',
    answer:'Format SpeedArti : longueur en mètres × largeur en centimètres × hauteur/épaisseur béton en centimètres. La profondeur de fouille reste une donnée séparée lorsqu’elle est utilisée.'
  },
  {
    id:'MAC-CHAINAGE-V',topic:'murs',
    tags:['chainage','vertical','ratio','estimation','perimetre','hauteur','3.5','3,5'],
    title:'Estimation du chaînage vertical',
    answer:'Estimation métier proposée : ceil(périmètre ÷ 3,50) × hauteur. Cette valeur reste modifiable et est explicitement présentée comme une estimation par ratio, jamais comme un contrôle DTU ou un dimensionnement structurel.'
  },
  {
    id:'MAC-TOUPIE-PRIX',topic:'beton',
    tags:['toupie','beton livre','prix','minimum','6 m3','capacite','7 m3','camion'],
    title:'Toupie — prix, minimum et capacité',
    answer:'Référence actuelle : '+euro(TOUPIE_PRICE_M3)+'/m³, minimum facturé '+fmt(TOUPIE_MIN_BILLABLE_M3,0)+' m³ soit '+euro(TOUPIE_PRICE_M3*TOUPIE_MIN_BILLABLE_M3)+'. Capacité logistique de référence : '+fmt(TOUPIE_CAPACITY_M3,0)+' m³ maximum par toupie. Ces valeurs commerciales restent modifiables.'
  },
  {
    id:'MAC-TOUPIE-CALCUL',topic:'beton',
    tags:['toupie','nombre','camion','camions','volume','automatique','calcul'],
    title:'Nombre de toupies estimé',
    answer:'En mode automatique, le nombre logistique estimé de toupies = ceil(volume béton ÷ '+fmt(TOUPIE_CAPACITY_M3,0)+' m³). La facturation au m³ et le nombre de camions sont deux notions distinctes.'
  },
  {
    id:'MAC-BETON-PRODUCTIVITE',topic:'main_oeuvre',
    tags:['betonniere','toupie','productivite','beton','4 h','1 h','heure homme','controle'],
    title:'Contrôle de productivité béton',
    answer:'Contrôle informatif actuel : béton à la bétonnière = 4 h-homme/m³ ; béton livré par toupie = 1 h-homme/m³. Ce contrôle n’est pas additionné automatiquement aux temps d’ouvrage afin d’éviter une double main-d’œuvre.'
  },
  {
    id:'MAC-POMPE',topic:'beton',
    tags:['pompe','camion pompe','beton','prix','forfait'],
    title:'Camion-pompe béton',
    answer:'Prix de référence actuel : '+euro(PUMP_DEFAULT_PRICE)+' par forfait. Valeur modifiable dans le chiffrage.'
  },
  {
    id:'MAC-BENNE',topic:'transport',
    tags:['camion','benne','8x4','transport','prix','jour'],
    title:'Camion-benne 8×4',
    answer:'Prix de référence actuel : '+euro(TRUCK_8X4_DEFAULT)+' par jour. Le prix peut être modifié et mémorisé lorsque l’option correspondante est utilisée.'
  },
  {
    id:'MAC-PREFAB',topic:'murs',
    tags:['mur','prefabrique','prefab','pose','grutage','planning','prix','m2'],
    title:'Mur préfabriqué béton',
    answer:'Prix de référence actuel : '+euro(PREFAB_DEFAULT_PRICE_M2)+'/m² posé, livré et gruté, modifiable. Temps de pose planning : '+fmt(PREFAB_H_PER_ML.standard,2)+' / '+fmt(PREFAB_H_PER_ML.hauteur_importante,2)+' / '+fmt(PREFAB_H_PER_ML.lourd_complexe,2)+' h-homme/ml selon le cas. Les heures restent au planning sans être refacturées une seconde fois lorsque le prix les inclut. '+PREFAB_TEAM_ADVICE
  },
  {
    id:'MAC-LONGRINE',topic:'fondations',
    tags:['longrine','micropieux','micro pieux','prix','ml','beton','acier','coffrage'],
    title:'Longrine avec micro-pieux',
    answer:'Référence actuelle : '+euro(LONGRINE_PRICE_ML)+'/ml, modifiable et séparée du prix des micro-pieux. Les quantités physiques béton/acier/coffrage peuvent rester visibles comme incluses pour conserver la traçabilité sans double facturation.'
  },
  {
    id:'MAC-MICROPIEUX-PRINCIPE',topic:'fondations',
    tags:['micropieu','micro-pieu','micro pieu','profondeur','prix','dimensionnement','main oeuvre'],
    title:'Micro-pieux — principe de chiffrage',
    answer:'La profondeur sert uniquement à proposer un prix métier par micro-pieu. Elle ne sert jamais à dimensionner automatiquement le micro-pieu. Le prix proposé est traité comme fourniture + main-d’œuvre incluse afin d’éviter une double facturation.'
  },
  {
    id:'MAC-FIBRES-FORMULE',topic:'beton',
    tags:['fibre','fibres','dosage','kg m3','dalle','volume','formule'],
    title:'Calcul des fibres béton',
    answer:'Quantité de fibres = volume béton × dosage saisi en kg/m³. Le dosage exact reste une donnée explicite et modifiable. '+FIBRE_WARNING
  },
  {
    id:'MAC-CLASSE-BETON',topic:'beton',
    tags:['classe','beton','c20 25','c25 30','c30 37','c35 45','ouvrage'],
    title:'Classe béton par ouvrage',
    answer:'La classe béton est portée par chaque ouvrage concerné. Les classes disponibles dans le moteur sont : '+CONCRETE_CLASSES.join(', ')+'. SpeedArti ne choisit pas automatiquement une classe structurelle pour un nouveau chiffrage.'
  },
  {
    id:'MAC-SIMPLE-MULTI',topic:'parcours',
    tags:['simple','multiple','mode','etat','ancienne valeur','calcul'],
    title:'Indépendance des parcours simple et multiple',
    answer:'Les parcours simple et multiple doivent rester indépendants. Une donnée devenue inactive après un changement de mode ne doit plus influencer les calculs.'
  },
  {
    id:'MAC-PRIX-MANUEL',topic:'prix',
    tags:['prix manuel','override','remplace','catalogue','personnel'],
    title:'Prix personnel artisan',
    answer:'Un prix personnel saisi explicitement par l’artisan devient prioritaire pour la ligne concernée. Il remplace le prix automatique sans modifier la quantité métier calculée.'
  },
  {
    id:'MAC-TRACABILITE',topic:'trace',
    tags:['source','trace','tracabilite','quantite','unite','prix','calcul','catalogue'],
    title:'Traçabilité du chiffrage',
    answer:'La base Angèle Maçon est dérivée du référentiel et des règles réellement présents dans macon/references.js et macon/core.js. Une réponse Angèle doit distinguer quantité métier, unité, référence, prix, source, main-d’œuvre et règles de sécurité.'
  },
  {
    id:'MAC-PARCOURS-PARAMETRES',topic:'parcours',
    tags:['taux horaire','ouvrier','parametres artisan','profil','speedarti','cache','automatique'],
    title:'Paramètres artisan dans le parcours',
    answer:'Dans le parcours final SpeedArti, le taux horaire et l’effectif par défaut viennent des paramètres de l’artisan et ne doivent pas être redemandés pendant chaque chiffrage. La démo simule ces valeurs uniquement pour rester autonome.'
  },
  {
    id:'MAC-TVA-VERIFICATION',topic:'tva',
    tags:['tva','neuf','renovation','entretien','2 ans','5.5','10','20','verification'],
    title:'TVA qualifiée avant le résultat',
    answer:'La TVA chantier se qualifie à l’étape Vérification : construction neuve 20 % ; rénovation/entretien d’un logement de moins de 2 ans 20 % ; logement de plus de 2 ans 10 % ; rénovation énergétique 5,5 % seulement sous réserve d’éligibilité. Dans SpeedArti, le service TVA réel et le statut fiscal de l’entreprise restent la source de vérité.'
  },
  {
    id:'MAC-FIBRES-PRIX',topic:'prix',
    tags:['fibre','fibres','prix','catalogue','dosage','a confirmer','reference'],
    title:'Prix des fibres à confirmer si le dosage produit n’est pas validé',
    answer:'Une fibre générique ne reçoit plus automatiquement le prix d’une référence catalogue lorsque le dosage fabricant n’est pas validé avec le dosage métier. La quantité reste calculée, le prix reste « à confirmer » sans bloquer le résultat, et l’artisan peut choisir explicitement une référence compatible ou saisir son prix.'
  },
  {
    id:'MAC-TOUPIE-MINIMUM',topic:'beton',
    tags:['toupie','minimum fournisseur','volume reel','volume facture','double facturation'],
    title:'Lecture du minimum toupie',
    answer:'Le résultat distingue le volume de béton réellement nécessaire du volume minimum facturé par le fournisseur. Quand la toupie est active, les lignes béton physiques restent visibles pour la quantité mais sont incluses dans la fourniture toupie afin d’éviter toute double facturation.'
  },
  {
    id:'MAC-RACCORDEMENTS-SPEEDARTI',topic:'integration',
    tags:['raccordement','speedarti','catalogue','stock','client','chantier','satellite','calepinage','devis','historique','angel'],
    title:'Raccordements préparés avec SpeedArti',
    answer:'Le module prépare les raccordements aux paramètres artisan, catalogue, fournisseurs, stocks, client, chantier, mesures satellite, calepinage, historique, devis, TVA et Angèle. La démo reste déconnectée de la production : le fichier speedarti-integration.js décrit le contrat de données sans appeler Supabase ni une API de production.'
  }
];

const disabledWorkIds=new Set(['escalier_ba','paillasse_escalier','palier_ba']);
const workEntries=WORKS.filter(w=>!disabledWorkIds.has(w.id)).map(w=>({
  id:'MAC-OUVRAGE-'+w.id.toUpperCase(),
  sourceId:w.id,
  topic:'ouvrage',
  tags:['ouvrage','macon',w.id,w.label,w.unite,'beton','acier','coffrage','main oeuvre','heures homme'],
  title:'Ouvrage — '+w.label,
  answer:w.label+' : unité métier '+w.unite+' ; béton '+fmt(w.betonParUnite,3)+' m³/'+w.unite+' ; acier '+fmt(w.acierParUnite,2)+' '+w.acierUnite+' ; coffrage '+fmt(w.coffrageParUnite,2)+' m²/'+w.unite+' ; main-d’œuvre '+fmt(w.moHParUnite,2)+' h-homme/'+w.unite+'. Ces ratios sont des références de chiffrage modifiables et ne constituent pas un dimensionnement structurel.'
}));

const treillisEntries=Object.entries(TREILLIS_GUILLAUME).map(([id,t])=>({
  id:'MAC-TREILLIS-'+id,
  sourceId:id,
  topic:'treillis',
  tags:['treillis','ferraillage','dalle',id,t.label,t.diametre,t.maille,t.usage],
  title:'Treillis — '+t.label,
  answer:t.label+' : diamètre '+t.diametre+', maille '+t.maille+', usage indicatif « '+t.usage+' », prix métier '+euro(t.priceM2)+'/m² et temps de pose '+fmt(t.hPerM2,2)+' h-homme/m². Valeur de chiffrage modifiable ; pas de dimensionnement structurel automatique.'
}));

const fibreEntries=Object.entries(FIBRES).map(([id,f])=>({
  id:'MAC-FIBRE-'+id.toUpperCase(),
  sourceId:id,
  topic:'fibres',
  tags:['fibre','fibres','beton','dosage',id,f.label],
  title:'Fibres — '+f.label,
  answer:f.label+' : plage indicative '+fmt(f.min,0)+' à '+fmt(f.max,0)+' kg/m³. Le dosage réel doit rester explicite et modifiable. '+FIBRE_WARNING
}));

const chimneyConduitEntries=Object.entries(CHIMNEY_CONDUITS).map(([id,c])=>({
  id:'MAC-CHEM-CONDUIT-'+id,
  sourceId:id,
  topic:'cheminee',
  tags:['cheminee','conduit','boisseau',id,c.label],
  title:'Cheminée — '+c.label,
  answer:c.label+' : fourniture de référence '+euro(c.supply)+'/ml ; temps '+fmt(c.h,2)+' h-homme/ml ; total de référence '+euro(c.total)+'/ml. Les valeurs sont modifiables.'
}));
const chimneyStackEntries=Object.entries(CHIMNEY_STACKS).map(([id,c])=>({
  id:'MAC-CHEM-SOUCHE-'+id.toUpperCase(),
  sourceId:id,
  topic:'cheminee',
  tags:['cheminee','souche',id,c.label],
  title:'Cheminée — '+c.label,
  answer:c.label+' : fourniture de référence '+euro(c.supply)+' ; temps '+fmt(c.h,2)+' h-homme ; total de référence '+euro(c.total)+'. Valeurs modifiables.'
}));
const chimneyCapEntries=Object.entries(CHIMNEY_CAPS).map(([id,c])=>({
  id:'MAC-CHEM-CHAPEAU-'+id.toUpperCase(),
  sourceId:id,
  topic:'cheminee',
  tags:['cheminee','chapeau',id,c.label],
  title:'Cheminée — '+c.label,
  answer:c.label+' : fourniture de référence '+euro(c.supply)+' ; temps '+fmt(c.h,2)+' h-homme ; total de référence '+euro(c.total)+'. Valeurs modifiables.'
}));

const micropileEntries=MICROPILE_PRICE_BY_DEPTH.map((r,i)=>({
  id:'MAC-MICROPIEU-TRANCHE-'+String(i+1),
  sourceId:String(i+1),
  topic:'fondations',
  tags:['micropieu','micro-pieu','profondeur','prix',r.label],
  title:'Micro-pieu — '+r.label,
  answer:'Pour la tranche '+r.label+', proposition métier actuelle : '+euro(r.price)+' par micro-pieu, fourniture + main-d’œuvre incluse. Cette profondeur sert au chiffrage, jamais au dimensionnement.'
}));

export const ANGEL_MACON_ENTRIES=[
  ...baseEntries,
  ...workEntries,
  ...treillisEntries,
  ...fibreEntries,
  ...chimneyConduitEntries,
  ...chimneyStackEntries,
  ...chimneyCapEntries,
  ...micropileEntries
];

const ANGEL_STOP_WORDS=new Set(['le','la','les','un','une','des','du','de','d','a','au','aux','et','ou','pour','par','avec','sans','dans','sur','sous','quel','quelle','quels','quelles','combien','faire','fait','est','sont','mon','ma','mes','ton','ta','tes','son','sa','ses']);
function angelTokens(q){return norm(q).split(/\s+/).filter(t=>t.length>=3&&!ANGEL_STOP_WORDS.has(t)&&!/^\d+$/.test(t))}
function angelOutOfDomain(q){
  const s=norm(q);
  return /barbecue|barbeque|four a pizza|four pizza|mortier refractaire|cheminee decorative exterieure|grue mobile|grue de chantier/.test(s);
}
function structuralSizingQuery(q){q=norm(q);return /dimension|dimensionnement|ferraillage|section|portee|profondeur|diametre|charge|charges|epaisseur minimale|quelle armature|quel acier/.test(q)&&/fondation|semelle|radier|poutre|poteau|mur porteur|soutenement|dalle|plancher|chainage|micro pieu|micropieu/.test(q)}
export function searchAngelMacon(query,limit=5){
 if(angelOutOfDomain(query))return [];
 const tokens=angelTokens(query);if(!tokens.length)return [];const q=norm(query),min=tokens.length===1?1:Math.ceil(tokens.length*.5);
 return ANGEL_MACON_ENTRIES.map(e=>{const title=norm(e.title),tags=(e.tags||[]).map(norm),hay=norm([e.id,e.sourceId,e.topic,e.title,e.answer,...(e.tags||[])].join(' '));let score=0,matched=0;if(q.length>=4&&hay.includes(q))score+=10;for(const t of tokens){let hit=false;if(hay.includes(t)){score++;hit=true}if(title.includes(t)){score+=3;hit=true}if(tags.some(x=>x.includes(t))){score+=3;hit=true}if(norm(e.id).includes(t)||norm(e.sourceId).includes(t)){score+=2;hit=true}if(hit)matched++}return{...e,score,matched}}).filter(e=>e.matched>=min&&e.score>=5).sort((a,b)=>b.score-a.score||b.matched-a.matched||a.id.localeCompare(b.id)).slice(0,Math.max(1,Math.min(10,Number(limit)||5)));
}
const ANGEL_STEP_LABELS=['Mode','Ouvrage(s)','Configuration','Options','Prix / catalogue','Vérification','Résultat'];

export function buildAngelMaconContext(state={},result={}){
  const lines=(result.lines||[]).map(l=>({
    id:l.id,name:l.name,category:l.category,qty:Number(l.qty||0),unit:l.unit,
    price:Number(l.price||0),priceMode:l.priceMode,source:l.source||'',
    catalogueReference:l.catalogueSelection||l.catalogueResolution?.product?.referenceCatalogue||null,
    toConfirm:l.priceMode==='required'&&!(Number(l.price)>0)
  }));
  return {
    metier:'macon',
    step:Number(state.step||0),
    stepLabel:ANGEL_STEP_LABELS[Number(state.step||0)]||'Inconnue',
    mode:state.mode||'simple',
    simpleType:state.simpleType||null,
    simple:state.simple||{},
    elements:state.elements||[],
    taxContext:state.taxContext||{},
    vat:Number(result.vat||0),
    totals:{materials:Number(result.materials||0),labor:Number(result.laborCost||0),ht:Number(result.totalHT||0),tax:Number(result.tax||0),ttc:Number(result.ttc||0)},
    hours:Number(result.hours||0),
    workers:Number(result.workers||0),
    lines,
    missingPrices:lines.filter(l=>l.toConfirm).map(l=>({id:l.id,name:l.name,qty:l.qty,unit:l.unit})),
    alerts:[...(result.alerts||[])],
    recommendations:[...(result.reco||[])]
  };
}

function contextualAngelAnswer(query,context){
  if(!context)return '';
  const q=norm(query),lines=context.lines||[];
  if(/ou en suis|etape|etape actuelle|parcours/.test(q)){
    return `Vous êtes à l’étape « ${context.stepLabel} » du chiffrage Maçon, en mode ${context.mode==='multiple'?'multi-éléments':'simple'}.`;
  }
  if(/toupie|beton livre|minim/.test(q)){
    const t=lines.find(l=>l.id==='toupie');
    if(t){
      const concrete=lines.filter(l=>l.category==='Béton'&&l.unit==='m³').reduce((s,l)=>s+l.qty,0);
      return `Sur ce chiffrage : ${fmt(concrete,2)} m³ de béton sont nécessaires et ${fmt(t.qty,2)} m³ sont facturés par la toupie à ${euro(t.price)}/m³. Les lignes béton physiques sont incluses dans cette fourniture et ne sont pas refacturées une seconde fois.`;
    }
  }
  if(/fibre|fibres/.test(q)){
    const fs=lines.filter(l=>/\bfibres?\b/i.test(l.name||''));
    if(fs.length){
      return fs.map(l=>`${l.name} : ${fmt(l.qty,2)} ${l.unit}. Prix ${l.toConfirm?'à confirmer':euro(l.price)+'/'+l.unit} ; source : ${l.source||'non renseignée'}.`).join('\n');
    }
  }
  if(/tva|taxe/.test(q)&&context.vat>0){
    return `TVA actuellement retenue pour ce chiffrage : ${fmt(context.vat,1)} %. Contexte : ${JSON.stringify(context.taxContext)}. Le service TVA réel SpeedArti reste la source de vérité lors du raccordement.`;
  }
  if(/prix|source|catalogue|a confirmer/.test(q)&&context.missingPrices?.length){
    return `${context.missingPrices.length} poste${context.missingPrices.length>1?'s sont':' est'} encore à confirmer : ${context.missingPrices.map(x=>x.name).join(', ')}. Le chiffrage reste accessible et aucun prix n’est inventé.`;
  }
  if(/total|montant|combien.*ht|combien.*ttc/.test(q)&&context.totals){
    return `Total actuel : ${euro(context.totals.ht)} HT ; TVA ${euro(context.totals.tax)} ; total TTC ${Number(context.totals.ttc||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} €.`;
  }
  return '';
}

export function answerAngelMacon(query,context=null){
 if(structuralSizingQuery(query))return `${STRUCTURE_WARNING}\n\nAngèle ne doit jamais proposer seule une profondeur, une section, un ferraillage ou un dimensionnement structurel : utiliser l’étude de sol / étude béton et les prescriptions du projet.`;
 const contextual=contextualAngelAnswer(query,context);
 if(contextual)return contextual;
 const hits=searchAngelMacon(query,3);return hits.length?hits.map(x=>x.answer).join('\n\n'):'Aucune règle Maçon correspondante dans la base Angèle. Ne pas inventer : demander ou vérifier la règle dans le moteur SpeedArti.';
}
export function getAngelMaconEntry(id){
  return ANGEL_MACON_ENTRIES.find(e=>e.id===id||e.sourceId===id)||null;
}

export const SpeedArtiAngelMaconKnowledge=Object.freeze({
  version:'MAC-ANGEL-KB-v1.5',
  metier:'macon',
  source:'macon/references.js + macon/core.js + macon/catalogue-macon.js + macon/speedarti-integration.js (main)',
  entries:ANGEL_MACON_ENTRIES,
  search:searchAngelMacon,
  answer:answerAngelMacon,
  buildContext:buildAngelMaconContext,
  getById:getAngelMaconEntry
});

if(typeof globalThis!=='undefined')globalThis.SpeedArtiAngelMaconKnowledge=SpeedArtiAngelMaconKnowledge;
