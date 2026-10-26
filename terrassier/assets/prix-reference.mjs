/**
 * SpeedArti Terrassier — références historiques tirées de l'analyse de V2 en lecture seule.
 * Source : src/services/chiffrage/regles/terrassier.bpu.ts
 * Tarifs de démonstration 2024–2025 non validés pour 2026 ; aucune donnée client ou clé.
 */
export const SOLS = Object.freeze({
  terre_meuble: { label:'Terre meuble', foisonnement:1.25, productivite:15, difficulte:1 },
  sable: { label:'Sable', foisonnement:1.15, productivite:12, difficulte:1.1 },
  argile: { label:'Argile / limon', foisonnement:1.35, productivite:10, difficulte:1.4 },
  roche: { label:'Roche tendre', foisonnement:1.5, productivite:4, difficulte:2.8 },
  roche_dure: { label:'Roche dure', foisonnement:1.6, productivite:2, difficulte:4 }
});
export const MAIN_OEUVRE = Object.freeze({ conducteur:55, ouvrier:45, chef:60, manoeuvre:38 });
export const ENGINS = Object.freeze([
  { id:'mini_1_5', nom:'Mini-pelle 1,5 T', jour:280, transport:120, volume_min:0, volume_max:10 },
  { id:'mini_3', nom:'Mini-pelle 3 T', jour:350, transport:120, volume_min:10, volume_max:50 },
  { id:'pelle_8', nom:'Pelle 8 T', jour:520, transport:180, volume_min:50, volume_max:200 },
  { id:'pelle_14', nom:'Pelle 14 T', jour:750, transport:250, volume_min:200, volume_max:Infinity },
  { id:'bulldozer', nom:'Bulldozer', jour:680, transport:300, volume_min:100, volume_max:Infinity },
  { id:'rouleau', nom:'Rouleau compacteur', jour:320, transport:150, volume_min:0, volume_max:Infinity },
  { id:'finisseur', nom:'Finisseur enrobé', jour:1200, transport:400, volume_min:0, volume_max:Infinity }
]);
export const BETON = Object.freeze({ B20:105, B25:120, B30:135, B35:155 });
export const ENROBES = Object.freeze({
  BBSG:{prix_tonne:85,densite:2.3}, BBME:{prix_tonne:95,densite:2.3},
  BBM:{prix_tonne:90,densite:2.3}, BBDr:{prix_tonne:110,densite:2.2}, EAC:{prix_tonne:75,densite:2.3}
});
export const REVETEMENTS = Object.freeze({
  beton_desactive:{nom:'Béton désactivé',prix_m2:85}, beton_lisse:{nom:'Béton lissé',prix_m2:65},
  enrobe_chaud:{nom:'Enrobé chaud',prix_m2:35}, enrobe_froid:{nom:'Enrobé froid',prix_m2:25},
  paves_autobloquants:{nom:'Pavés autobloquants',prix_m2:55},
  gravillons:{nom:'Gravillons compactés',prix_m2:15}, dalles_beton:{nom:'Dalles béton',prix_m2:45}
});
export const TUYAUX_PVC = Object.freeze({ PVC_100:12.5, PVC_125:18, PVC_160:28, PVC_200:42, PVC_250:65, PVC_315:95 });
export const REGARDS = Object.freeze({ '40x40':85, '50x50':120, '60x60':165 });
export const GRANULATS = Object.freeze({ GNT_0_315:28, grave_0_80:22, sable_0_4:32, gravier_decoratif:55 });
export const PROTECTIONS = Object.freeze({ geotextile_200:2.5, geotextile_300:3.8, polyane_200:1.5 });
export const EVACUATION = Object.freeze({ terre:25, roche:45, amiante:180 });
export const ASSAINISSEMENT = Object.freeze({
  fosse_septique_3000l:{ nom:'Fosse septique 3 000 L',prix:1200 },
  fosse_septique_5000l:{ nom:'Fosse septique 5 000 L',prix:1800 },
  micro_station_4eh:{ nom:'Micro-station 4 EH',prix:5500 },
  micro_station_6eh:{ nom:'Micro-station 6 EH',prix:7200 },
  bac_a_graisse:{ nom:'Bac à graisse 200 L',prix:350 }
});
export const CATEGORIES = Object.freeze({
  terrassement_fondation: { label:'Terrassement et fondations',icone:'🏗️', sousTypes:{
    tranchee:'Tranchée',fouille:'Fouille en masse',fondations_superficielles:'Fondations superficielles',
    fondations_profondes:'Fondations profondes',nivellement:'Nivellement',decaissement:'Décaissement' } },
  chemin_acces: {label:'Chemins et parkings',icone:'🛤️',sousTypes:{
    allee_beton:'Allée béton',allee_enrobe:'Allée enrobée',allee_paves:'Allée pavée',
    allee_gravier:'Allée gravier',parking:'Parking' } },
  enrobe: {label:'Enrobé',icone:'🛣️',sousTypes:{
    pose_enrobe_neuf:'Enrobé neuf',pose_enrobe_multicouches:'Plusieurs couches',
    enrobe_rechargement:'Rechargement',reparation:'Réparation'} },
  reseaux: {label:'Réseaux et canalisations',icone:'🔧',sousTypes:{
    assainissement_eu:'Eaux usées',assainissement_ep:'Eaux pluviales',
    eau_potable:'Eau potable',reseau_sec:'Réseaux secs',
    fosse_septique:'Fosse septique',drainage:'Drainage'} },
  demolition: {label:'Démolition',icone:'🏚️',sousTypes:{
    demolition_beton:'Béton',demolition_enrobe:'Enrobé',
    depose_reseaux:'Dépose réseaux',dessouchage:'Dessouchage'} }
});