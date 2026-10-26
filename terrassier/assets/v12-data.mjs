/**
 * SPEEDARTI TERRASSIER V1.2 — Démonstration, indépendante de V2
 * Tarifs = données de travail en HT, à remplacer par devis fournisseurs 2026 locaux.
 * Les prix historiques ont pour source de consultation en lecture seule :
 *   GSTAI-Sp/speedarti-v2/src/services/chiffrage/regles/terrassier.bpu.ts
 * Ne pas présenter ce fichier comme un catalogue fournisseur validé.
 */
export const FAMILLES={
 terrassement_fondation:{nom:'Terrassement et fondations',icon:'🏗️'},
 chemin_acces:{nom:'Chemins et parkings',icon:'🛤️'},
 enrobe:{nom:'Enrobé et voirie',icon:'🛣️'},
 reseaux:{nom:'Réseaux et canalisations',icon:'🔧'},
 demolition:{nom:'Démolition',icon:'🏚️'}
};
const f=(label,unit='m',val=1,description='')=>({label,unit,val,description});
export const CHAMPS={
 L:f('Longueur','m',20),W:f('Largeur','m',0.6),D:f('Profondeur','m',0.8),
 S:f('Surface','m²',80),E:f('Épaisseur','cm',20),N:f('Nombre','u',1),
 p:f('Pente de réseau','%',1.5),distance:f('Distance vers décharge','km',20),
 BR:f('Longueur de bordures','ml',0),gnt:f('Épaisseur de GNT','cm',20),
 nbRegards:f('Nombre de regards','u',2),nbCouches:f('Nombre de couches','u',2),
 ep2:f('Épaisseur 2e couche','cm',4),arbres:f('Nombre de souches','u',2),
 diametreArbre:f('Diamètre moyen des souches','cm',40),
 prepa:f('Épaisseur à déposer','cm',6),securite:f('Marge de sécurité','%',0)
};
const common={sol:'terre_meuble',acces:'normal',evac:true,tva:20,engin:'auto',transport:true};
const def=(famille,nom,mesure,champs,recette,extra={})=>({
 famille,nom,mesure,champs,recette,statut:'indicatif',
 aVerifier:'Quantités et prix à vérifier selon étude, implantation, géotechnique et devis locaux.',
 defauts:{...common,...extra}
});
export const PRESTATIONS={
 tranchee:def('terrassement_fondation','Tranchée et fouille en rigole','volume',['L','W','D','distance'],'tranchee',{L:20,W:.6,D:1}),
 fouille:def('terrassement_fondation','Fouille en masse','volume',['L','W','D','distance'],'fouille',{L:12,W:10,D:1.5}),
 fondations_superficielles:def('terrassement_fondation','Fondations superficielles','volume',['L','W','D','distance'],'fondations_superficielles',{L:45,W:.5,D:.6}),
 fondations_profondes:def('terrassement_fondation','Fondations profondes (pré-étude)','volume',['L','W','D','N'],'fondations_profondes',{L:12,W:.6,D:2.5,N:4}),
 nivellement:def('terrassement_fondation','Nivellement et réglage','surface',['S','E'],'nivellement',{S:250,E:10,evac:false}),
 decaissement:def('terrassement_fondation','Décaissement de plateforme','surface',['S','E','distance'],'decaissement',{S:120,E:30}),
 allee_beton:def('chemin_acces','Allée béton','surface',['S','E','gnt','distance'],'allee_beton',{S:75,E:12,gnt:15}),
 allee_enrobe:def('chemin_acces','Allée enrobée','surface',['S','E','gnt','distance'],'allee_enrobe',{S:90,E:6,gnt:20}),
 allee_paves:def('chemin_acces','Allée pavée','surface',['S','E','gnt','distance'],'allee_paves',{S:65,E:6,gnt:20}),
 allee_gravier:def('chemin_acces','Allée gravillonnée','surface',['S','E','gnt','distance'],'allee_gravier',{S:100,E:5,gnt:20}),
 parking:def('chemin_acces','Parking / aire de stationnement','surface',['S','E','gnt','BR','distance'],'parking',{S:200,E:6,gnt:25,BR:60}),
 pose_enrobe_neuf:def('enrobe','Enrobé neuf','surface',['S','E','gnt'],'pose_enrobe_neuf',{S:150,E:6,gnt:20,evac:false}),
 pose_enrobe_multicouches:def('enrobe','Enrobé multicouche','surface',['S','E','ep2','gnt'],'pose_enrobe_multicouches',{S:180,E:6,ep2:4,gnt:20,evac:false}),
 enrobe_rechargement:def('enrobe','Rechargement d’enrobé','surface',['S','E'],'enrobe_rechargement',{S:150,E:4,evac:false}),
 reparation:def('enrobe','Réparation / reprise locale','surface',['S','E'],'reparation',{S:30,E:5,evac:false}),
 assainissement_eu:def('reseaux','Réseaux d’eaux usées','reseau',['L','W','D','nbRegards','p','distance'],'assainissement_eu',{L:30,W:.6,D:1.1,nbRegards:3,p:1.5}),
 assainissement_ep:def('reseaux','Réseaux d’eaux pluviales','reseau',['L','W','D','nbRegards','p','distance'],'assainissement_ep',{L:25,W:.6,D:.9,nbRegards:2,p:1}),
 eau_potable:def('reseaux','Réseau eau potable (estimatif)','reseau',['L','W','D','distance'],'eau_potable',{L:30,W:.5,D:.8}),
 reseau_sec:def('reseaux','Fourreaux / réseaux secs','reseau',['L','W','D','distance'],'reseau_sec',{L:40,W:.5,D:.7}),
 fosse_septique:def('reseaux','Fosse toutes eaux / ANC','unite',['N','L','W','D','distance'],'fosse_septique',{N:1,L:6,W:3,D:1.6}),
 drainage:def('reseaux','Drainage périphérique','reseau',['L','W','D','distance'],'drainage',{L:35,W:.5,D:.8}),
 demolition_beton:def('demolition','Démolition de béton','surface',['S','E','distance'],'demolition_beton',{S:65,E:15}),
 demolition_enrobe:def('demolition','Fraisage / dépose d’enrobé','surface',['S','E','distance'],'demolition_enrobe',{S:130,E:8}),
 depose_reseaux:def('demolition','Dépose d’anciennes canalisations','reseau',['L','W','D','distance'],'depose_reseaux',{L:30,W:.55,D:.8}),
 dessouchage:def('demolition','Dessouchage','unite',['arbres','diametreArbre','distance'],'dessouchage',{arbres:4,diametreArbre:45})
};
export const MENU=Object.entries(FAMILLES).map(([id,fam])=>({id,...fam,
 sousTypes:Object.entries(PRESTATIONS).filter(([,p])=>p.famille===id).map(([code,p])=>({code,nom:p.nom}))}));
export const SOLS={
 terre_meuble:{nom:'Terre meuble',foison:1.25,rendement:15},
 sable:{nom:'Sable',foison:1.15,rendement:12},
 argile:{nom:'Argile et limon',foison:1.35,rendement:10},
 roche:{nom:'Roche tendre',foison:1.5,rendement:4},
 roche_dure:{nom:'Roche dure',foison:1.6,rendement:2}
};
/**
 * La "date de contrôle" signifie une vérification de l'existence du prix dans V2,
 * pas une vérification commerciale auprès d'un fournisseur.
 */
const ancien='Base V2 (2024–2025), contrôle technique octobre 2026';
const provision='Provision interne V1.2, non sourcée fournisseur';
const p=(nom,prix,unite,origine=ancien,description='')=>({nom,prix,unite,origine,description});
export const TARIFS={
 MO_COND:p('Conducteur d’engin',55,'h'),
 MO_OUV:p('Ouvrier terrassier',45,'h'),
 MO_CHEF:p('Chef d’équipe',60,'h'),
 MO_MAN:p('Manœuvre',38,'h'),
 ENG_1_5:p('Mini-pelle 1,5 t',280,'jour'),
 ENG_3:p('Mini-pelle 3 t',350,'jour'),
 ENG_8:p('Pelle 8 t',520,'jour'),
 ENG_14:p('Pelle 14 t',750,'jour'),
 ENG_BULL:p('Bulldozer',680,'jour'),
 ENG_ROUL:p('Compacteur / rouleau',320,'jour'),
 ENG_FIN:p('Finisseur',1200,'jour'),
 ENG_BRH:p('BRH et accessoires',155,'jour',provision),
 ENG_CAMION:p('Camion benne 3,5 t',260,'jour',provision),
 ENG_CAROT:p('Carotteuse / scie de sol',170,'jour',provision),
 ENG_FRAIS:p('Raboteuse compacte',570,'jour',provision),
 ENG_DESS:p('Rogneuse de souches',310,'jour',provision),
 ENG_PLAQUE:p('Plaque vibrante',95,'jour',provision),
 TRANSPORT_ENG:p('Acheminement aller-retour engin',180,'forfait',provision),
 TRANSPORT_DECH:p('Rotation transport déblais',1.8,'m³·km',provision),
 B20:p('Béton C20/25 (hors mise en œuvre)',105,'m³'),
 B25:p('Béton C25/30 (hors mise en œuvre)',120,'m³'),
 B30:p('Béton C30/37',135,'m³'),
 B35:p('Béton haute résistance',155,'m³'),
 MORTIER:p('Mortier de scellement',120,'m³',provision),
 EN_BBSG:p('Enrobé BBSG',85,'t'),
 EN_BBM:p('Enrobé BBM',90,'t'),
 EN_BBME:p('Enrobé BBME',95,'t'),
 EN_BBDr:p('Enrobé drainant BBDr',110,'t'),
 ACCRO:p('Couche d’accrochage',1.8,'m²',provision),
 PAVES:p('Pavés autobloquants fournis',55,'m²',provision),
 DALLES:p('Dalles béton fournies',45,'m²',provision),
 GRAN_GNT:p('GNT 0/31,5',28,'m³'),
 GRAN_080:p('Grave 0/80',22,'m³'),
 GRAN_SABLE:p('Sable 0/4',32,'m³'),
 GRAN_GRAV:p('Gravillon décoratif',55,'m³'),
 GEOT_200:p('Géotextile 200 g/m²',2.5,'m²'),
 POLY:p('Polyane 200 µ',1.5,'m²'),
 DRAIN:p('Drain perforé Ø100',9,'ml',provision),
 PVC_100:p('Tuyau PVC Ø100',12.5,'ml'),
 PVC_125:p('Tuyau PVC Ø125',18,'ml'),
 PVC_160:p('Tuyau PVC Ø160',28,'ml'),
 PVC_200:p('Tuyau PVC Ø200',42,'ml'),
 AEP_32:p('PEHD eau potable Ø32',5.5,'ml',provision),
 TPC_63:p('Gaine TPC Ø63',4.8,'ml',provision),
 GRILLAGE:p('Grillage avertisseur',1.6,'ml',provision),
 REG_40:p('Regard 40×40',85,'u'),
 REG_50:p('Regard 50×50',120,'u'),
 REG_60:p('Regard 60×60',165,'u'),
 FOSSE_3000:p('Fosse toutes eaux 3 000 L',1200,'u'),
 FOSSE_5000:p('Fosse toutes eaux 5 000 L',1800,'u'),
 MICRO_4:p('Micro-station 4 EH',5500,'u'),
 MICRO_6:p('Micro-station 6 EH',7200,'u'),
 EVAC_TERRE:p('Filière déblais inertes',25,'m³'),
 EVAC_GRAV:p('Filière gravats / roche',45,'m³'),
 EVAC_VERT:p('Filière déchets verts',30,'m³',provision),
 EVAC_ENROBE:p('Filière enrobé recyclé',48,'m³',provision),
 POMPAGE:p('Pompage provisoire',180,'jour',provision),
 BLINDAGE:p('Blindage provisoire',35,'m²',provision),
 BORDURE:p('Bordure fournie avec pose',42,'ml',provision),
 SIGNAL:p('Signalisation / balisage chantier',95,'forfait',provision)
};
export const AUDIT_PRIX={
 date:'2026-10-26',
 note:'Les valeurs restent des prix indicatifs HT de simulation. Aucun barème fournisseur local et aucune remise ne sont raccordés.',
 comparatifs:[
  {code:'ENG_3',observation:'Fourchette variable selon loueur et profil (220–422 €/j HT relevés web 2026); prix hérité 350 €/j HT non certifié.',source:'https://pellejaune.fr/prix-location-mini-pelle/'},
  {code:'B25',observation:'Le béton livré est souvent plus cher que 120 €/m³ HT; comparer livraison/toupie selon quantité.',source:'https://conseils.hellopro.fr/combien-coute-le-beton-pret-a-l-emploi-4395.html'}
 ]
};
export const DEFAULTS={categorie:'terrassement_fondation',type:'tranchee',sol:'terre_meuble',difficulte:'normale',tva:20};
