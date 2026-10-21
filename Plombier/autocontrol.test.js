const fs=require('fs'),vm=require('vm'),path=require('path');
global.window=global;
const root=__dirname;
for(const f of ['catalogue-data.js','catalogue-service.js','engine-current.js','angel-knowledge.js'])vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
const CAT=global.SpeedArtiCatalogueService,API=global.SpeedArtiPlombierCurrent,ANGEL=global.SpeedArtiAngelPlombierKnowledge,DB=global.SpeedArtiCataloguePlombier;
let ok=0;function assert(cond,msg){if(!cond)throw new Error(`ASSERT ${ok+1}: ${msg}`);ok++}
function approx(a,b,t=.011){return Math.abs(Number(a)-Number(b))<=t}
function base(){return{metier:'plombier',nom_calcul:'AUTOCONTROLE v0.8.1',options:{type_projet:'installation_complete',gamme:'premium',complexite:'moyen',taux_horaire:52,nb_ouvriers:1,taux_tva:20,type_tuyau:'per',forfaits:{},chauffe_eau:{enabled:false,type:'cumulus',capacity:200},adoucisseur:{enabled:false,price_ht:1000},articles_libres:[]},installation:{surface_maison_m2:100,equipments:[],network:{distance_ce_sdb:5,distance_ce_cuisine:8,ef_only:0,ec_only:0,ef_ec:0,evac_points:0,platines_ef:0,platines_ec:0,platines_ef_ec:0,platines_evac:0,evac_price_ml:6,time_h:4},annexe1:{}},petits_travaux:{prestations:[]},settings:{annexe1:{},forfaits:{},services:{},component_preferences:{},slot_preferences:{},sanitary_time_preferences:{}}}}
function selectFirst(ctx,pred=()=>true){const a=CAT.search({context:ctx,limit:100}).find(x=>x.prix>0&&x.code&&pred(x));assert(!!a,`Référence exploitable contexte ${ctx}`);return CAT.selection(a)}
function netRefs(d){const ctx=d.options.type_tuyau==='cuivre'?'raccord_cuivre':d.options.type_tuyau==='multicouche'?'raccord_multicouche':'raccord_per';d.installation.network.fitting_catalogue=selectFirst(ctx);d.installation.network.stop_valve_catalogue=selectFirst('robinet_arret');}

// 1. Intégrité catalogue
assert(CAT.count===7456,'Catalogue = 7456 références');
assert(DB.articles.length===7456,'Table réelle = 7456 lignes');
assert(CAT.priceCount===7451,'7451 prix exploitables');
assert(DB.articles.filter(a=>a.prix==null).length===5,'5 prix Téréva absents');
assert(DB.articles.filter(a=>!a.produit).length===551,'551 titres exacts non extraits');
assert(DB.articles.filter(a=>a.marque==='À identifier').length===2139,'2139 marques à identifier');
const known=CAT.search({q:'1306629',limit:5});
assert(known.length>0,'Code 1306629 retrouvé');
assert(known[0].code==='1306629','Code exact prioritaire');
assert(approx(known[0].prix,117.19),'Prix -20 % = 117,19');
assert(CAT.search({q:'grohe chromé',limit:10}).length>0,'Recherche Grohe chromé');
assert(CAT.search({q:'grohe chromé',limit:10}).every(x=>String(x.marque).toLowerCase().includes('grohe')),'Recherche multi-critères respecte la marque');
assert(CAT.search({context:'platine',limit:100}).length===11,'Contexte platine dédié = 11 articles détectés');
assert(CAT.search({context:'raccord_per',limit:100}).length>0,'Contexte raccord PER');
assert(CAT.search({context:'raccord_multicouche',limit:100}).length>0,'Contexte raccord multicouche');
assert(CAT.search({context:'raccord_cuivre',limit:100}).length>0,'Contexte raccord cuivre');
assert(CAT.search({context:'raccord_per',limit:100}).every(a=>/\bper\b/i.test(`${a.produit} ${a.variante} ${a.famille}`)),'Filtre PER cohérent');
assert(CAT.search({context:'raccord_multicouche',limit:100}).every(a=>/multicouche/i.test(`${a.produit} ${a.variante} ${a.famille}`)&&!/\bper\b/i.test(`${a.produit} ${a.variante}`)),'Filtre multicouche exclut PER explicite');
assert(CAT.search({context:'raccord_cuivre',limit:100}).every(a=>/cuivre|laiton|bic[oô]ne/i.test(`${a.produit} ${a.variante} ${a.famille}`)),'Filtre cuivre/laiton cohérent');
assert(CAT.filters('wc_poser').brands.length>0,'Filtres marques WC');
assert(CAT.filters('douche').types.length>0,'Filtres types douche');
assert(CAT.filters('all').brands.length>20,'Filtres catalogue global');
let allSelectionOK=true;for(let i=0;i<DB.articles.length;i++){const a=CAT.byIndex(i),s=CAT.selection(a);if(!s||s.code!==a.code||s.index!==i||s.catalogue!=='Téréva 2026 -20%'){allSelectionOK=false;break}}
assert(allSelectionOK,'Les 7456 références se sélectionnent sans perte code/index/version');

// 2. WC exact + balises + gamme non remultipliée
const wcSel=selectFirst('wc_poser');
const d1=base();netRefs(d1);d1.installation.equipments.push({id:'wc1',kind:'wc',subtype:'poser',catalogue:wcSel,price_ht:wcSel.prix,time_h:2});
const r1=API.calculate(d1);const wcLine=r1.materiaux.find(x=>x.catalogue_code===wcSel.code);
assert(!!wcLine,'Ligne WC catalogue présente');
assert(approx(wcLine.prix_unitaire_ht,wcSel.prix),'Prix exact WC non remultiplié Premium');
assert(wcLine.catalogue_version==='Téréva 2026 -20%','Version catalogue balisée');
assert(!!wcLine.catalogue_source_page,'Page source catalogue balisée');
assert(String(wcLine.source).includes('Catalogue Téréva 2026 -20%'),'Source catalogue visible');
assert(r1.controle_balises.ok===true,'Balises scénario WC OK');
assert(r1.controle_balises.version==='BALISES-ABSOLUES-v1.8','Version balises v1.7');
assert(r1.finalisation_bloquee===false,'WC complet finalisable');
assert(r1.surfaces.detail_par_face.EF_ml===8,'WC = 8 ml EF');
assert(r1.surfaces.detail_par_face.EC_ml===0,'WC = 0 ml EC');
assert(r1.surfaces.detail_par_face.evac_ml===1,'WC = 1 ml évacuation');
const fittingsWC=r1.materiaux.find(x=>x.article_id==='raccords_per');
assert(fittingsWC.quantite_finale===7,'6 raccords/appareil +10 % => 7 pour 1 WC');
const stopsWC=r1.materiaux.find(x=>x.article_id==='robinets_arret');
assert(stopsWC.quantite_finale===1,'Annexe 2 WC = 1 robinet d’arrêt');

// 3. Lavabo Annexe 2 : 1 appareil, 2 alimentations, 2 robinets, pas 12 raccords
const lavSel=selectFirst('lavabo');
const dLav=base();netRefs(dLav);dLav.installation.equipments.push({id:'lav1',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2});
const rLav=API.calculate(dLav);
assert(rLav.surfaces.detail_par_face.EF_ml===13,'Lavabo SDB = 8 ml EF + distance nourrice SDB 5 m');
assert(rLav.surfaces.detail_par_face.EC_ml===13,'Lavabo SDB = 8 ml EC + distance SDB 5 m');
assert(rLav.materiaux.find(x=>x.article_id==='raccords_per').quantite_finale===7,'Lavabo = 6 raccords/appareil +10 %, pas 12');
assert(rLav.materiaux.find(x=>x.article_id==='robinets_arret').quantite_finale===2,'Annexe 2 lavabo : robinets d’arrêt pluriels = 2 alimentations');
assert(rLav.finalisation_bloquee===false,'Lavabo complet finalisable');

// 4. Réseau seul, pas +13 m fantômes, temps réseau obligatoire
const d2=base();d2.installation.network.ef_ec=4;d2.installation.network.fitting_catalogue=selectFirst('raccord_per');
const r2=API.calculate(d2);
assert(r2.surfaces.detail_par_face.EF_ml===32,'Réseau seul 4 points = 32 ml EF');
assert(r2.surfaces.detail_par_face.EC_ml===32,'Réseau seul 4 points = 32 ml EC sans +13');
assert(r2.materiaux.find(x=>x.article_id==='raccords_per').quantite_finale===27,'4 points réseau => ceil(4×6×1,1)=27 raccords');
assert(r2.main_oeuvre.heures_homme===4,'Temps réseau saisi = heures-homme réseau');
assert(r2.finalisation_bloquee===false,'Réseau seul renseigné finalisable');
const d2b=base();d2b.installation.network.ef_ec=1;d2b.installation.network.time_h=undefined;d2b.installation.network.fitting_catalogue=selectFirst('raccord_per');
const r2b=API.calculate(d2b);
assert(r2b.finalisation_bloquee===false,'Temps réseau absent reçoit une proposition technique');
assert(!r2b.blocages.some(x=>/TEMPS/.test(x)),'Aucun blocage temps réseau avec proposition technique');
assert(r2b.main_oeuvre.heures_homme>0,'Temps réseau technique calculé automatiquement');
const d2c=base();d2c.installation.network.ef_ec=2;d2c.installation.network.manual_ef_ml=12;d2c.installation.network.manual_ec_ml=15;d2c.installation.network.fitting_catalogue=selectFirst('raccord_per');
const r2c=API.calculate(d2c);
assert(r2c.surfaces.detail_par_face.EF_ml===12,'Override longueur EF appliqué');
assert(r2c.surfaces.detail_par_face.EC_ml===15,'Override longueur EC appliqué');

// 5. Raccords par matériau + incompatibilité
for(const [pipe,ctx] of [['per','raccord_per'],['multicouche','raccord_multicouche'],['cuivre','raccord_cuivre']]){
  const dd=base();dd.options.type_tuyau=pipe;dd.installation.network.ef_only=1;dd.installation.network.fitting_catalogue=selectFirst(ctx);const rr=API.calculate(dd);
  assert(!rr.blocages.some(x=>/COMPATIBILITÉ.*raccord/.test(x)),`Raccord ${pipe} compatible accepté`);
  assert(rr.materiaux.some(x=>x.article_id===`raccords_${pipe}`),`Ligne raccord ${pipe} créée`);
}
const bad=base();bad.options.type_tuyau='per';bad.installation.network.ef_only=1;bad.installation.network.fitting_catalogue=selectFirst('raccord_cuivre');const badR=API.calculate(bad);
assert(badR.finalisation_bloquee===true,'Raccord cuivre sur réseau PER bloque');
assert(badR.blocages.some(x=>/COMPATIBILITÉ/.test(x)),'Balise compatibilité raccord explicite');

// 6. Platines catalogue et manuel
const platSel=selectFirst('platine');
const dp=base();dp.installation.network.platines_ef=2;dp.installation.network.platine_ef_catalogue=platSel;dp.installation.network.fitting_catalogue=selectFirst('raccord_per');const rp=API.calculate(dp);
const pl=rp.materiaux.find(x=>x.article_id==='platine_ef');
assert(!!pl,'Ligne platine EF créée');
assert(pl.quantite_finale===2,'Quantité platine conservée');
assert(approx(pl.prix_unitaire_ht,platSel.prix),'Prix exact platine catalogue');
assert(rp.finalisation_bloquee===false,'Platine catalogue finalisable');
const dpm=base();dpm.installation.network.platines_ec=1;dpm.installation.network.platine_ec_price_ht=42;dpm.installation.network.fitting_catalogue=selectFirst('raccord_per');const rpm=API.calculate(dpm);
assert(rpm.materiaux.find(x=>x.article_id==='platine_ec').prix_unitaire_ht===42,'Platine prix manuel accepté');
assert(rpm.materiaux.find(x=>x.article_id==='platine_ec').source==='saisie artisan','Platine manuelle tracée');
assert(rpm.finalisation_bloquee===false,'Platine manuelle finalisable');
const dp0=base();dp0.installation.network.platines_ef_ec=1;dp0.installation.network.fitting_catalogue=selectFirst('raccord_per');const rp0=API.calculate(dp0);
assert(rp0.finalisation_bloquee===false,'Platine sans sélection artisan utilise Téréva technique');
assert(rp0.materiaux.find(x=>x.article_id==='platine_ef_ec')?.catalogue_code==='3160404','Platine EF+EC PER résolue par Téréva');

// 7. Prix Téréva absent => manuel résout sans inventer
const missingA=DB.articles.find(a=>a.prix==null&&a.code);assert(!!missingA,'Référence sans prix trouvée');
const missSel=CAT.selection({...missingA,__index:DB.articles.indexOf(missingA)});
const dm=base();dm.installation.network.ef_only=1;dm.installation.network.fitting_catalogue=selectFirst('raccord_per');dm.options.articles_libres=[{catalogue:missSel,price_ht:undefined,quantite:1}];const rm=API.calculate(dm);
assert(rm.finalisation_bloquee===true,'Référence sans prix bloque');
assert(rm.blocages.some(x=>/BALISE PRIX|Prix catalogue manquant/.test(x)),'Blocage prix balisé');
const dm2=base();dm2.installation.network.ef_only=1;dm2.installation.network.fitting_catalogue=selectFirst('raccord_per');const missManual={...missSel,price_overridden:true,manual_price_ht:99};dm2.options.articles_libres=[{catalogue:missManual,price_ht:99,quantite:2}];const rm2=API.calculate(dm2);const ml=rm2.materiaux.find(x=>x.categorie==='Article libre');
assert(rm2.finalisation_bloquee===false,'Prix manuel résout prix Téréva absent');
assert(ml.prix_unitaire_ht===99,'Prix manuel utilisé');
assert(ml.total_ht===198,'Prix manuel × quantité correct');
assert(String(ml.source).includes('Prix manuel sur référence Téréva'),'Source override manuel tracée');
assert(ml.catalogue_code===missSel.code,'Code Téréva conservé après override');

// 8. Titre exact absent = informatif, non bloquant
const noTitle=DB.articles.find(a=>!a.produit&&a.prix>0&&a.code);assert(!!noTitle,'Référence sans titre trouvée');
const ntSel=CAT.selection({...noTitle,__index:DB.articles.indexOf(noTitle)});const dnt=base();dnt.installation.network.ef_only=1;dnt.installation.network.fitting_catalogue=selectFirst('raccord_per');dnt.options.articles_libres=[{catalogue:ntSel,price_ht:ntSel.prix,quantite:1}];const rnt=API.calculate(dnt);
assert(rnt.alertes.some(x=>/Information catalogue/.test(x)),'Titre manquant signalé en information');
assert(!rnt.blocages.some(x=>/Information catalogue/.test(x)),'Titre manquant non bloquant');
assert(rnt.finalisation_bloquee===false,'Titre manquant ne bloque pas si code/prix/source présents');

// 9. Douche italienne : temps +40 % seulement douche, SPEC
const recSel=selectFirst('receveur');
const di=base();netRefs(di);di.installation.equipments.push({id:'sh1',kind:'douche',subtype:'italienne',catalogue:recSel,price_ht:recSel.prix,time_h:10,spec_mode:'spec',spec_surface_m2:5});const ri=API.calculate(di);
assert(ri.main_oeuvre.heures_homme===18,'Douche italienne 10×1,4 + réseau 4 h = 18 h');
assert(ri.materiaux.some(x=>x.article_id==='douche_sh1_spec'&&x.total_ht===80),'SPEC 5 m² ×16 = 80 €');
assert(ri.finalisation_bloquee===false,'Douche italienne complète finalisable');
const di0=base();netRefs(di0);di0.installation.equipments.push({id:'sh0',kind:'douche',subtype:'italienne',catalogue:recSel,price_ht:recSel.prix,time_h:2,spec_mode:'natte',spec_surface_m2:0});const ri0=API.calculate(di0);
assert(ri0.finalisation_bloquee===true,'SPEC/natte sans surface bloque');
assert(ri0.blocages.some(x=>/BALISE SURFACE/.test(x)),'Balise surface explicite');

// 10. Complexité uniquement MO, ouvriers uniquement durée
const dc=base();dc.options.complexite='complexe';dc.options.nb_ouvriers=2;dc.installation.network.ef_only=1;dc.installation.network.fitting_catalogue=selectFirst('raccord_per');dc.installation.network.time_h=10;const rc=API.calculate(dc);
assert(rc.main_oeuvre.heures_homme===10,'Heures-homme inchangées par nb ouvriers');
assert(rc.main_oeuvre.temps_estime_heures===5,'2 ouvriers divisent durée chantier');
assert(approx(rc.main_oeuvre.cout_total,10*52*1.4),'Complexité ×1,4 sur MO');
const matExpected=rc.materiaux.reduce((s,x)=>s+x.total_ht,0);assert(approx(rc.totaux.materiaux_ht,matExpected),'Complexité ne remultiplie pas matériaux');

// 11. TVA 10 / 20
const tv10=base();tv10.options.taux_tva=10;tv10.installation.network.ef_only=1;tv10.installation.network.fitting_catalogue=selectFirst('raccord_per');const rt10=API.calculate(tv10);assert(approx(rt10.totaux.tva,rt10.totaux.total_ht*.10),'TVA 10 réelle');
const tv20=base();tv20.options.taux_tva=20;tv20.installation.network.ef_only=1;tv20.installation.network.fitting_catalogue=selectFirst('raccord_per');const rt20=API.calculate(tv20);assert(approx(rt20.totaux.tva,rt20.totaux.total_ht*.20),'TVA 20 réelle');

// 12. Petit travaux : aucun => blocage
const p0=base();p0.options.type_projet='petits_travaux';const pr0=API.calculate(p0);assert(pr0.finalisation_bloquee===true,'Petits travaux vide bloque');assert(pr0.blocages.some(x=>/BALISE PRESTATION/.test(x)),'Balise prestation vide explicite');

// 13. Débouchage : tarif entreprise automatique, tout compris, un seul déplacement
const pd0=base();pd0.options.type_projet='petits_travaux';pd0.petits_travaux.prestations=[{id:'d1',type:'debouchage'}];const rd0=API.calculate(pd0);assert(rd0.finalisation_bloquee===true,'Débouchage sans montant bloque');assert(rd0.blocages.some(x=>/tarif entreprise SpeedArti du débouchage/i.test(x)),'Blocage tarif entreprise débouchage explicite');
const pd=base();pd.options.type_projet='petits_travaux';pd.options.forfaits.deplacement=true;pd.settings.services.debouchage=240;pd.petits_travaux.prestations=[{id:'d1',type:'debouchage'}];const rd=API.calculate(pd);const dl=rd.materiaux.find(x=>x.article_id==='debouchage_d1');
assert(dl.prix_unitaire_ht===240,'Débouchage utilise automatiquement le tarif entreprise');assert(dl.includes_labor===true&&dl.includes_travel===true,'Débouchage balisé MO + déplacement inclus');assert(rd.main_oeuvre.cout_total===0,'Pas de seconde MO débouchage');assert(!rd.materiaux.some(x=>x.article_id==='forfait_deplacement'),'Pas de second déplacement débouchage');assert(rd.finalisation_bloquee===false,'Débouchage renseigné finalisable');

// 14. Réparation chauffe-eau : forfait entreprise automatique
const pc0=base();pc0.options.type_projet='petits_travaux';pc0.petits_travaux.prestations=[{id:'c1',type:'chauffe_eau',ce_type:'reparation'}];const rc0=API.calculate(pc0);assert(rc0.finalisation_bloquee===true,'Réparation CE sans montant bloque');
const pc=base();pc.options.type_projet='petits_travaux';pc.settings.services.chauffe_eau_reparation=175;pc.petits_travaux.prestations=[{id:'c1',type:'chauffe_eau',ce_type:'reparation',duration_h:8}];const rcp=API.calculate(pc);assert(rcp.materiaux.find(x=>x.article_id==='ce_c1').prix_unitaire_ht===175,'Réparation CE utilise le tarif entreprise');assert(rcp.main_oeuvre.cout_total===0,'Réparation CE forfait complet sans seconde MO même si ancienne durée existe');assert(rcp.finalisation_bloquee===false,'Réparation CE finalisable');

// 15. Recherche de fuite : tout compris sans MO doublée
const pf=base();pf.options.type_projet='petits_travaux';pf.settings.services.fuite_camera=180;pf.petits_travaux.prestations=[{id:'f1',type:'fuite',method:'camera',duration_h:9}];const rf=API.calculate(pf);assert(rf.materiaux.some(x=>x.article_id==='diag_f1'&&x.total_ht===150),'Diagnostic fuite = 150');assert(rf.materiaux.some(x=>x.article_id==='fuite_f1'&&x.total_ht===180),'Méthode fuite = tarif entreprise automatique');assert(rf.main_oeuvre.cout_total===0,'Recherche fuite tout compris sans seconde MO');assert(rf.finalisation_bloquee===false,'Recherche fuite renseignée finalisable');

// 16. Plusieurs prestations : déplacement unique
const pm=base();pm.options.type_projet='petits_travaux';pm.options.forfaits.deplacement=true;pm.settings.services.fuite_camera=100;pm.settings.services.debouchage=200;pm.petits_travaux.prestations=[{id:'f1',type:'fuite',method:'camera'},{id:'d1',type:'debouchage'}];const rmult=API.calculate(pm);assert(rmult.materiaux.filter(x=>x.article_id==='forfait_deplacement').length===0,'Débouchage inclus empêche déplacement supplémentaire');assert(rmult.materiaux.filter(x=>x.includes_travel).length===1,'Un seul poste inclut déplacement');

// 17. Chauffe-eau fourniture : catalogue prioritaire et capacité contrôlée
const ce200raw=CAT.search({context:'chauffe_eau',q:'200',limit:100}).find(a=>a.prix>0&&/200\s*l/i.test(`${a.produit} ${a.variante}`));assert(!!ce200raw,'Référence CE 200 L détectée');const ce200=CAT.selection(ce200raw);
const ce=base();ce.options.chauffe_eau={enabled:true,type:/thermodynamique/i.test(`${ce200.produit}`)?'ballon_thermo':'cumulus',capacity:200,catalogue:ce200,price_ht:ce200.prix,time_h:3};const rce=API.calculate(ce);assert(rce.materiaux.some(x=>x.catalogue_code===ce200.code&&approx(x.prix_unitaire_ht,ce200.prix)),'CE exact prix catalogue');assert(!rce.blocages.some(x=>/capacité|COMPATIBILITÉ.*chauffe-eau/.test(x)),'CE 200 L compatible ne bloque');
const cem=base();cem.options.chauffe_eau={enabled:true,type:/thermodynamique/i.test(`${ce200.produit}`)?'ballon_thermo':'cumulus',capacity:300,catalogue:ce200,price_ht:ce200.prix,time_h:3};const rcem=API.calculate(cem);assert(rcem.finalisation_bloquee===true,'Capacité CE incompatible bloque');assert(rcem.blocages.some(x=>/COMPATIBILITÉ.*200 L.*300 L/.test(x)),'Balise capacité CE explicite');

// 18. MLL / MLV suivent paramètres entreprise, sans double robinet générique
const mllv=base();mllv.settings.annexe1.robinet_mll=91;mllv.settings.annexe1.robinet_mlv=97;netRefs(mllv);mllv.installation.equipments.push({id:'ll',kind:'lave_linge'},{id:'lv',kind:'lave_vaisselle'});const rml=API.calculate(mllv);assert(rml.materiaux.find(x=>x.article_id==='equip_ll').prix_unitaire_ht===91,'MLL prend paramètre entreprise');assert(rml.materiaux.find(x=>x.article_id==='equip_lv').prix_unitaire_ht===97,'MLV prend paramètre entreprise');assert(!rml.materiaux.some(x=>x.article_id==='robinets_arret'),'MLL/MLV n’ajoutent pas un robinet générique en double');assert(rml.finalisation_bloquee===false,'MLL/MLV avec réseau finalisables');

// 19. Prix catalogue exact override manuel
const ov=base();netRefs(ov);const ovSel={...wcSel,price_overridden:true,manual_price_ht:wcSel.prix+50};ov.installation.equipments.push({id:'wc2',kind:'wc',subtype:'poser',catalogue:ovSel,price_ht:ovSel.manual_price_ht,time_h:2});const rov=API.calculate(ov);const ovl=rov.materiaux.find(x=>x.catalogue_code===wcSel.code);assert(approx(ovl.prix_unitaire_ht,wcSel.prix+50),'Override manuel exact utilisé');assert(String(ovl.source).includes('Prix manuel sur référence Téréva'),'Override exact source tracée');assert(rov.controle_balises.ok===true,'Balises après override exact');

// 20. Auto-contrôle totaux
assert(approx(r1.controle_balises.materiaux_ht_controles,r1.totaux.materiaux_ht),'Contrôle matériaux = total matériaux');
assert(approx(r1.controle_balises.main_oeuvre_ht_controlee,r1.totaux.main_oeuvre_ht),'Contrôle MO = total MO');
assert(approx(r1.controle_balises.total_ht_controle,r1.totaux.total_ht),'Contrôle HT = total HT');
assert(approx(r1.controle_balises.tva_controlee,r1.totaux.tva),'Contrôle TVA = TVA');

// 21. Ordre scripts HTML
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const posData=html.indexOf('catalogue-data.js'),posService=html.indexOf('catalogue-service.js'),posEngine=html.indexOf('engine-current.js'),posAngel=html.indexOf('angel-knowledge.js'),posApp=html.indexOf('app.js');
assert(posData>0&&posData<posService&&posService<posEngine&&posEngine<posAngel&&posAngel<posApp,'Ordre de chargement catalogue -> service -> moteur -> Angel -> app');
assert(/v0\.8\.1/.test(html),'HTML annonce v0.8.1');

// 22. Contrôles statiques UI / absence de règles cachées
const appSrc=fs.readFileSync(path.join(root,'app.js'),'utf8'),engSrc=fs.readFileSync(path.join(root,'engine-current.js'),'utf8'),catSrc=fs.readFileSync(path.join(root,'catalogue-service.js'),'utf8'),cssSrc=fs.readFileSync(path.join(root,'styles.css'),'utf8');
assert(appSrc.includes('installation.network.time_h'),'Champ temps réseau présent dans UI');
assert(appSrc.includes('manual_platine_ef_qty'),'Quantité platine EF automatique/modifiable présente');
assert(!appSrc.includes('Forfait débouchage HT'),'Aucun champ prix débouchage dans le parcours artisan');
assert(!appSrc.includes('Forfait débouchage 180 €'),'Ancien prix débouchage caché absent UI');
assert(!/reparation:\{[^}]*price:120/.test(engSrc),'Ancien 120 € réparation caché absent moteur');
assert(!/(?:\*\s*\.15|\*\s*0\.15)/.test(engSrc),'Ancien rendement réseau 0,15 h/ml absent');
assert(catSrc.includes("raccord_per")&&catSrc.includes("raccord_multicouche")&&catSrc.includes("raccord_cuivre"),'Trois contextes raccord matériau présents');
assert(appSrc.includes("smallWorkOptions()"),'Options petits travaux dédiées sans saisie de prix');


// 23. Composition interne des équipements et articles complémentaires explicites
assert(Array.isArray(API.annexe2For('lavabo'))&&API.annexe2For('lavabo').length===15,'Annexe 2 lavabo = 15 postes de référence');
assert(API.annexe2For('meuble_vasque').length===API.annexe2For('lavabo').length,'Meuble vasque réutilise la composition lavabo/vasque');
assert(API.annexe2For('douche').some(x=>x.label==='Bonde de douche'),'Annexe 2 douche contient la bonde');
assert(API.annexe2For('baignoire').some(x=>x.label==='Vidage baignoire'),'Annexe 2 baignoire contient le vidage');
assert(API.annexe2For('evier').some(x=>x.label==='Raccordement lave-vaisselle si prévu'),'Annexe 2 évier conserve le raccordement LV conditionnel');
assert(API.annexe2For('wc','poser').length===16&&API.annexe2For('wc','poser').some(x=>x.label==='Mécanisme de chasse'),'Annexe 2 WC à poser = 16 postes et contient le mécanisme');
assert(API.annexe2For('wc','suspendu').length===15&&API.annexe2For('wc','suspendu').some(x=>x.label==='Plaque de commande'),'Annexe 2 WC suspendu = 15 postes et contient la plaque de commande');
assert(API.annexe2For('wc','urinoir').length===0,'Aucune composition Annexe 2 inventée pour urinoir');
const a2Defs=[['lavabo',''],['meuble_vasque',''],['douche',''],['baignoire',''],['evier',''],['wc','poser'],['wc','suspendu'],['lave_main',''],['lave_linge',''],['lave_vaisselle','']];
for(const [kind,sub] of a2Defs){const defs=API.annexe2For(kind,sub),keys=defs.map(x=>x.key);assert(new Set(keys).size===keys.length,`Clés Annexe 2 uniques — ${kind} ${sub}`);for(const def of defs.filter(x=>x.role==='selectable'))assert(CAT.search({context:def.context||'all',q:def.q||'',limit:1}).length>0,`Recherche préremplie exploitable — ${kind}/${def.key}`)}
assert(API.annexe2For('lave_linge').some(x=>x.label==='Robinet machine à laver'),'Annexe 2 lave-linge contient le robinet machine');
assert(API.annexe2For('lave_vaisselle').some(x=>x.label.includes('siphon')),'Annexe 2 lave-vaisselle contient le raccordement siphon');

const dA2Base=base();netRefs(dA2Base);dA2Base.installation.equipments.push({id:'lava2base',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2});
const rA2Base=API.calculate(dA2Base);
assert(rA2Base.materiaux.some(x=>x.auto_component&&x.annexe2_slot==='siphon'&&x.catalogue_code==='1054371'),'Siphon lavabo prérempli automatiquement avec référence SpeedArti');
assert(rA2Base.materiaux.some(x=>x.auto_component&&x.annexe2_slot==='bonde'&&x.catalogue_code==='2864095'),'Bonde lavabo préremplie automatiquement avec référence SpeedArti');
assert(rA2Base.nomenclature_annexe2.length===1,'Nomenclature Annexe 2 produite par appareil');
assert(rA2Base.nomenclature_annexe2[0].components.find(x=>x.key==='ef').status==='géré par réseau','Alimentation EF balisée réseau sans doublon');
assert(rA2Base.nomenclature_annexe2[0].components.find(x=>x.key==='appareil').status==='article principal sélectionné','Article principal balisé dans nomenclature');

const bondeRaw=CAT.search({context:'evacuation',q:'bonde',limit:100}).find(a=>a.prix>0&&a.code);assert(!!bondeRaw,'Référence bonde exploitable trouvée');const bondeSel=CAT.selection(bondeRaw);
const dA2=base();netRefs(dA2);dA2.installation.equipments.push({id:'lava2',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2,annexe2_items:{bonde:{catalogue:bondeSel,price_ht:bondeSel.prix,quantite:2,note:'Non comprise dans le lavabo'}}});
const rA2=API.calculate(dA2),a2Line=rA2.materiaux.find(x=>x.annexe2_slot==='bonde');
assert(!!a2Line,'Composant Annexe 2 sélectionné devient une ligne réelle');
assert(a2Line.categorie==='Fourniture automatique','Composant automatique conserve une catégorie dédiée');
assert(a2Line.parent_equipment_id==='lava2','Balise parent équipement conservée');
assert(a2Line.annexe2_source==='Annexe 2 Guillaume','Source Annexe 2 balisée');
assert(a2Line.catalogue_code===bondeSel.code,'Code Téréva composant conservé');
assert(a2Line.quantite_finale===2,'Quantité composant visible appliquée');
assert(approx(a2Line.total_ht,bondeSel.prix*2),'Quantité × prix exact composant cohérent');
assert(rA2.nomenclature_annexe2[0].components.find(x=>x.key==='bonde').status==='référence personnalisée','Nomenclature reflète la référence personnalisée');
assert(rA2.controle_balises.ok===true,'Balises v1.2 valides avec composant Annexe 2');
assert(rA2.finalisation_bloquee===false,'Scénario Annexe 2 complet finalisable');

const dA2Qty=base();netRefs(dA2Qty);dA2Qty.installation.equipments.push({id:'a2q',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2,annexe2_items:{bonde:{catalogue:bondeSel,price_ht:bondeSel.prix,quantite:0}}});
const rA2Qty=API.calculate(dA2Qty);assert(rA2Qty.finalisation_bloquee===true,'Composant automatique sélectionné avec quantité nulle bloque');assert(rA2Qty.blocages.some(x=>/QUANTITÉ AUTO/.test(x)),'Blocage quantité automatique explicite');

const noPriceRaw=DB.articles.find(a=>a.prix==null&&a.code);assert(!!noPriceRaw,'Référence Téréva sans prix disponible pour test');const noPriceSel=CAT.selection({...noPriceRaw,__index:DB.articles.indexOf(noPriceRaw)});
const dA2NoPrice=base();netRefs(dA2NoPrice);dA2NoPrice.installation.equipments.push({id:'a2np',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2,annexe2_items:{bonde:{catalogue:noPriceSel,quantite:1}}});
const rA2NoPrice=API.calculate(dA2NoPrice);assert(rA2NoPrice.finalisation_bloquee===true,'Composant automatique Téréva sans prix bloque');assert(rA2NoPrice.blocages.some(x=>/AUTO.*prix|prix Téréva manquant/i.test(x)),'Blocage prix composant automatique explicite');

const manualA2={...bondeSel,price_overridden:true,manual_price_ht:bondeSel.prix+12};const dA2Man=base();netRefs(dA2Man);dA2Man.installation.equipments.push({id:'a2m',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2,annexe2_items:{bonde:{catalogue:manualA2,price_ht:manualA2.manual_price_ht,quantite:1}}});const rA2Man=API.calculate(dA2Man),a2m=rA2Man.materiaux.find(x=>x.annexe2_slot==='bonde');
assert(approx(a2m.prix_unitaire_ht,bondeSel.prix+12),'Override manuel composant Annexe 2 utilisé');assert(String(a2m.source).includes('Prix manuel sur référence Téréva'),'Override composant Annexe 2 tracé');

// 24. Annexe 2 également sur remplacement petits travaux
const ptA2=base();ptA2.options.type_projet='petits_travaux';ptA2.petits_travaux.prestations=[{id:'rep1',type:'remplacement',equipment:{id:'repLav',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2,annexe2_items:{bonde:{catalogue:bondeSel,price_ht:bondeSel.prix,quantite:1}}}}];const rptA2=API.calculate(ptA2);
assert(rptA2.nomenclature_annexe2.length===1,'Remplacement réutilise nomenclature Annexe 2');assert(rptA2.materiaux.some(x=>x.annexe2_slot==='bonde'),'Remplacement réutilise article complémentaire Annexe 2');assert(rptA2.controle_balises.ok===true,'Balises remplacement + Annexe 2 OK');

// 25. Contrôles statiques composition / catalogue
assert(!appSrc.includes('Composition Annexe 2'),'UI artisan ne montre plus le libellé Annexe 2');
assert(appSrc.includes('data-catalogue-q'),'Recherche composant peut préremplir la barre catalogue');
assert(appSrc.includes('nomenclature_annexe2'),'Résultat UI affiche la nomenclature Annexe 2');
assert(engSrc.includes("annexe2_source:'Annexe 2 Guillaume'"),'Moteur balise explicitement la source Annexe 2');
assert(engSrc.includes('parent_equipment_id'),'Moteur conserve le parent équipement des composants');
assert(appSrc.includes('eq.annexe2_items={}'),'Changement de sous-type WC nettoie la nomenclature associée devenue obsolète');
assert(engSrc.includes("version:'BALISES-ABSOLUES-v1.8'"),'Moteur balises v1.8');


// 26. Stock réel : aucune disponibilité ni quantité à commander ne doit être inventée
assert(r1.stock_status.connecte===false,'Stock réel non connecté explicitement');
assert(r1.stock_status.disponible===null,'Disponibilité stock inconnue = null, pas faux booléen');
const stockLines=r1.materiaux.filter(x=>x.stockable);
assert(stockLines.length>0,'Scénario WC contient des lignes stockables');
for(const l of stockLines){
  assert(l.stock_status==='non_connecte',`Stock non connecté balisé — ${l.article_id}`);
  assert(l.stock_disponible===null,`Aucun stock disponible inventé — ${l.article_id}`);
  assert(l.quantite_a_commander===null&&l.a_commander===null,`Aucune quantité à commander inventée — ${l.article_id}`);
  assert(approx(l.quantite_besoin,l.quantite_finale),`Besoin chantier = quantité calculée — ${l.article_id}`);
}
assert(!engSrc.includes('stock_disponible:0'),'Ancien stock disponible = 0 supprimé du moteur');
assert(!engSrc.includes('a_commander:extra.stockable?q:0'),'Ancienne commande automatique supprimée');

// 27. Approvisionnement fournisseur : payload structuré sans prétendre commander
const appro=rA2.approvisionnement;
assert(!!appro&&appro.stock_connecte===false,'Approvisionnement déclare stock non connecté');
assert(appro.statut_stock==='non_connecte','Statut approvisionnement non connecté');
assert(appro.nombre_lignes===rA2.materiaux.filter(x=>x.stockable).length,'Liste besoins = lignes stockables');
assert(approx(appro.total_besoins_ht,appro.items.reduce((s,x)=>s+x.total_ht,0)),'Total besoins fournisseur cohérent');
assert(appro.payload_fournisseur.version==='PLB-APPRO-V2','Payload fournisseur V2 multi-fournisseurs');
assert(appro.payload_fournisseur.metier==='plombier','Payload fournisseur métier plombier');
assert(appro.payload_fournisseur.items.length===appro.items.length,'Payload fournisseur reprend tous les besoins');
assert(appro.items.some(x=>x.article_id==='equip_lava2'),'Appareil sanitaire principal présent dans les besoins fournisseur');
assert(!appro.items.some(x=>/Forfait complet|Prestation fourniture \+ MO/.test(x.categorie)),'Forfaits et prestations mixtes exclus du stock fournisseur');
assert(rA2.materiaux.find(x=>x.article_id==='equip_lava2').stockable===true,'Appareil sanitaire physique classé stockable');
assert(rA2.materiaux.filter(x=>x.includes_labor).every(x=>!x.stockable),'Prestations incluant la MO non classées stockables');
const payloadBonde=appro.payload_fournisseur.items.find(x=>x.code_tereva===bondeSel.code);
assert(!!payloadBonde,'Composant Annexe 2 présent dans payload fournisseur');
assert(payloadBonde.quantite===2,'Quantité besoin composant conservée dans payload');
assert(payloadBonde.source_page,'Page source Téréva conservée dans payload');
assert(!JSON.stringify(appro).includes('commande_créée'),'Aucune commande fournisseur fictive produite');

// 28. UI approvisionnement / export
assert(appSrc.includes('Besoins matériaux / fournisseur'),'Résultat affiche le bloc besoins fournisseur');
assert(appSrc.includes('data-export-appro-csv'),'Export CSV besoins présent');
assert(appSrc.includes('data-export-appro-json'),'Export JSON fournisseur présent');
assert(appSrc.includes('data-copy-appro-json'),'Copie payload fournisseur présente');
assert(appSrc.includes('Stock : non connecté'),'UI ne prétend pas connaître le stock');
assert(appSrc.includes('ne prétend pas connaître le stock ni créer une commande'),'Garde-fou commande explicite dans UI');
assert(engSrc.includes("version:'BALISES-ABSOLUES-v1.8'"),'Moteur balises v1.8');


// 29. Correctifs v0.5.2 issus du contrôle humain
assert(appSrc.includes("const storeKey='speedarti-plombier-demo-v081'"),'Clé de sauvegarde propre v0.8.1');
assert(appSrc.includes("legacyStoreKeys=['speedarti-plombier-demo-v080','speedarti-plombier-demo-v071'"),'Migration du brouillon v0.8.0 prévue');
assert(appSrc.includes('function migrateLegacyDraft'),'Fonction de migration brouillon présente');
assert(appSrc.includes("delete p.duration_h"),'Migration supprime les anciennes durées CE non validées');
assert(appSrc.includes("catalogueRenderTimer=setTimeout"),'Recherche catalogue saisie rapide temporisée');
assert(catSrc.includes("wc_suspendu_main"),'Contexte cuvette WC suspendue séparé du bâti-support');
assert(catSrc.includes("wc_suspendu_bati"),'Contexte bâti-support WC suspendu séparé');
assert(CAT.search({context:'wc_suspendu_main',limit:100}).length>0,'Contexte WC suspendu principal retourne des références');
assert(CAT.search({context:'wc_suspendu_main',limit:100}).every(a=>a.type!=='Bâti-support'),'WC suspendu principal exclut les bâtis-supports');
assert(CAT.search({context:'wc_suspendu_bati',limit:100}).every(a=>a.type==='Bâti-support'),'Contexte bâti-support ne retourne que des bâtis-supports');
assert(appSrc.includes("eq.annexe2_items={}"),'Changement de sous-type WC nettoie les anciens composants Annexe 2');
assert(appSrc.includes("poser:[300,2],suspendu:[700,5],urinoir:[300,2],urinoir_bati:[600,5]"),'Changement sous-type WC remet prix/temps validés');
assert(appSrc.includes("'installation.annexe1.aleas','Aléas 4 %','Appliqués uniquement à la main-d’œuvre HT'"),'UI aléas annonce la règle métier validée');
const da=base();da.installation.annexe1.aleas=true;da.installation.network.ef_only=1;da.installation.network.fitting_catalogue=selectFirst('raccord_per');const ra=API.calculate(da);
assert(ra.finalisation_bloquee===false,'Aléas 4 % ne bloque plus après validation métier');
const expectedAleas=Math.round(ra.totaux.main_oeuvre_ht_avant_aleas*.04*100)/100;
assert(Math.abs(ra.totaux.aleas_ht-expectedAleas)<.011,'Aléas = exactement 4 % de la main-d’œuvre HT');
assert(Math.abs(ra.totaux.main_oeuvre_ht-(ra.totaux.main_oeuvre_ht_avant_aleas+ra.totaux.aleas_ht))<.011,'Main-d’œuvre HT totale inclut les aléas');
assert(Math.abs(ra.totaux.total_ht-(ra.totaux.materiaux_ht+ra.totaux.main_oeuvre_ht))<.011,'Total HT inclut matériaux + MO totale avec aléas');
assert(Math.abs(ra.totaux.tva-(ra.totaux.total_ht*ra.totaux.taux_tva/100))<.011,'TVA calculée après ajout des aléas');
assert(!ra.materiaux.some(x=>x.article_id==='ann1_aleas'),'Aléas ne sont pas classés comme matériau/fourniture');
assert(ra.controle_balises.aleas_ht_controle===ra.totaux.aleas_ht,'Balise contrôle vérifie le montant des aléas');
const daMat=base();daMat.installation.annexe1.aleas=true;daMat.installation.annexe1.arret_general=true;daMat.installation.network.ef_only=1;daMat.installation.network.fitting_catalogue=selectFirst('raccord_per');const raMat=API.calculate(daMat);
assert(raMat.totaux.materiaux_ht>ra.totaux.materiaux_ht,'Ajout d’un forfait matière/prestation augmente le hors MO');
assert(Math.abs(raMat.totaux.aleas_ht-ra.totaux.aleas_ht)<.011,'Aléas 4 % ne varient pas avec les matériaux/forfaits');
const daComplex=base();daComplex.options.complexite='complexe';daComplex.installation.annexe1.aleas=true;daComplex.installation.network.ef_only=1;daComplex.installation.network.fitting_catalogue=selectFirst('raccord_per');const raComplex=API.calculate(daComplex);
assert(Math.abs(raComplex.totaux.aleas_ht-(raComplex.totaux.main_oeuvre_ht_avant_aleas*.04))<.011,'Aléas suivent la MO après coefficient de complexité');
const da10=base();da10.options.taux_tva=10;da10.installation.annexe1.aleas=true;da10.installation.network.ef_only=1;da10.installation.network.fitting_catalogue=selectFirst('raccord_per');const ra10=API.calculate(da10);
assert(Math.abs(ra10.totaux.aleas_ht-ra.totaux.aleas_ht)<.011,'Taux de TVA ne modifie pas le montant HT des aléas');
assert(Math.abs(ra10.totaux.tva-(ra10.totaux.total_ht*.10))<.011,'TVA 10 % est appliquée après ajout des aléas');
const des=base();netRefs(des);des.installation.equipments.push({id:'es1',kind:'element_specifique',ef:true,ec:true,evac:false,stop_valves:3,price_ht:50,time_h:1});const res=API.calculate(des);
assert(res.materiaux.find(x=>x.article_id==='robinets_arret').quantite_finale===3,'Élément spécifique utilise son nombre réel de robinets d’arrêt');
assert(appSrc.includes("stop_valves"),'Champ robinets d’arrêt élément spécifique exposé dans UI');
assert(!/changement_200l_elec[^\n]{0,180}duration_h\s*[:=]\s*[0-9]/.test(appSrc+engSrc),'Aucune durée CE cachée codée pour changement 200 L');
assert(!/changement_300l_elec[^\n]{0,180}duration_h\s*[:=]\s*[0-9]/.test(appSrc+engSrc),'Aucune durée CE cachée codée pour changement 300 L');
assert(r1.controle_balises.version==='BALISES-ABSOLUES-v1.8','Version finale balises v1.7');



// 30. Parcours v0.6 — zones chantier et réseau/accessoires automatiques modifiables
const z0=base();z0.installation.zones={rdc_sans:true,r1_sans:false,rdc_avec:false,r1_avec:false};z0.installation.annexe1.attente_rdc=1;z0.installation.network.fitting_catalogue=selectFirst('raccord_per');
const pz0=API.previewNetwork(z0);
assert(pz0.autoEF===8&&pz0.autoEC===8&&pz0.autoEvac===1,'RDC sans sanitaire propose 8 ml EF + 8 ml EC + 1 ml évacuation');
assert(pz0.autoPlatineEfEc===1&&pz0.autoPlatineEvac===1,'RDC sans sanitaire propose une platine EF+EC et une évacuation');
assert(pz0.autoFittings===7,'RDC sans sanitaire propose 7 raccords avec +10 %');
const rz0=API.calculate(z0);assert(rz0.surfaces.detail_par_face.EF_ml===8&&rz0.surfaces.detail_par_face.EC_ml===8,'Moteur utilise les longueurs de la zone sans sanitaire');

const z1=base();z1.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};netRefs(z1);z1.installation.equipments.push({id:'wca',kind:'wc',subtype:'poser',catalogue:wcSel,price_ht:wcSel.prix,time_h:2},{id:'wcb',kind:'wc',subtype:'poser',catalogue:wcSel,price_ht:wcSel.prix,time_h:2},{id:'sha',kind:'douche',subtype:'bac',catalogue:selectFirst('douche'),price_ht:selectFirst('douche').prix,time_h:2});
const pz1=API.previewNetwork(z1);
assert(pz1.autoEF===29,'Deux WC + une douche = 24 ml EF + distance nourrice SDB 5 m');
assert(pz1.autoEC===13,'Une douche SDB = 8 ml EC + distance SDB 5 m');
assert(pz1.autoEvac===3,'Trois sanitaires = 3 ml évacuation locale');
assert(pz1.autoPlatineEf===2&&pz1.autoPlatineEfEc===1&&pz1.autoPlatineEvac===3,'Platines automatiques suivent les trois sanitaires indépendants');
assert(pz1.autoStopValves===4,'Deux WC + une douche = 4 robinets d’arrêt');
assert(pz1.autoFittings===20,'Trois appareils eau = ceil(3×6×1,1)=20 raccords');

const z2=base();z2.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};netRefs(z2);z2.installation.equipments.push({id:'wcov',kind:'wc',subtype:'poser',catalogue:wcSel,price_ht:wcSel.prix,time_h:2});z2.installation.network.manual_ef_ml=19;z2.installation.network.manual_platine_ef_qty=3;z2.installation.network.manual_fitting_qty=15;z2.installation.network.manual_stop_valve_qty=2;
const pz2=API.previewNetwork(z2);assert(pz2.ef===19,'Override longueur EF artisan devient valeur de calcul');assert(pz2.platineEf===3,'Override platines artisan devient quantité de calcul');assert(pz2.fittings===15,'Override raccords artisan devient quantité de calcul');assert(pz2.stopValves===2,'Override vannes artisan devient quantité de calcul');
const rz2=API.calculate(z2);assert(rz2.surfaces.detail_par_face.EF_ml===19,'Résultat final reprend longueur EF modifiée');assert(rz2.surfaces.detail_par_face.platines_EF===3,'Résultat final reprend platines modifiées');assert(rz2.materiaux.find(x=>x.article_id==='raccords_per').quantite_finale===15,'Résultat final reprend raccords modifiés');assert(rz2.materiaux.find(x=>x.article_id==='robinets_arret').quantite_finale===2,'Résultat final reprend robinets modifiés');

// 31. Nettoyage interface artisan / structure 4 pages corrigée
assert(appSrc.includes("['Base chantier','Dimensionnement & distances']")&&appSrc.includes("['Équipements & réseau','Sanitaires & quantités']")&&appSrc.includes("['Configuration & options','Réglages facultatifs']")&&appSrc.includes("['Résultats','Contrôle avant devis']"),'Parcours principal séparé en quatre pages métier');
assert(appSrc.includes('RDC — Sans sanitaire')&&appSrc.includes('R+1 — Sans sanitaire')&&appSrc.includes('RDC — Avec sanitaires')&&appSrc.includes('R+1 — Avec sanitaires'),'Quatre cases chantier présentes');
assert(appSrc.includes('Deux clics sur WC créent WC 1 et WC 2'),'UI explique les sanitaires indépendants');
assert(appSrc.includes('data-configure-equipment')&&appSrc.includes('configurable?'),'Configurer est piloté par la présence de sanitaires');
assert(appSrc.includes('selectedCart(eqs,false)'),'Page Équipements & réseau affiche le panier sans bouton Configurer');
assert(appSrc.includes('configurable?selectedCart(eqs,true)'), 'Page Configuration & options affiche Configurer seulement si une zone avec sanitaires contient des éléments');
assert(appSrc.includes('Distances depuis le chauffe-eau'),'Distances chauffe-eau visibles sur la Base chantier');
assert(appSrc.includes('Chauffe-eau → salle de bains (m)')&&appSrc.includes('Chauffe-eau → cuisine (m)'),'Deux distances chauffe-eau conservées et modifiables');
assert(appSrc.includes('Quantités réseau proposées'),'Réseau automatique visible sur la page Équipements & réseau');
assert(appSrc.includes('function equipmentIcon(kind)')&&appSrc.includes('<svg ${common}>'),'Icônes sanitaires SVG intégrées');
assert(appSrc.includes("if(el.dataset.configureEquipment){activeEquipmentId=el.dataset.configureEquipment;step=2"),'Configurer ouvre bien la page 3');
assert(appSrc.includes('[renderBase,renderEquipmentNetwork,renderConfiguration,renderResults][step]()'),'Routage des quatre pages actif');
assert(!/head\('Étape 1','Métier/.test(appSrc),'Ancienne première page Métier supprimée du parcours');
assert(!/Annexe 1 — grille|Composition Annexe 2/.test(appSrc),'Aucun libellé Annexe 1/2 n’est exposé dans le parcours artisan actif');
assert(appSrc.includes('function artisanMessage')&&appSrc.includes('Référentiel SpeedArti'),'Messages techniques internes nettoyés avant affichage');
assert(appSrc.includes("eqs.length?selectedCart(eqs,false):''"),'Panier étape 2 apparaît seulement après sélection d’un sanitaire');
assert(appSrc.includes("configurable?selectedCart(eqs,true):''"),'Panier étape 3 conserve les sanitaires et les boutons Configurer');
assert(appSrc.includes("equipmentPalette('rdc')")&&appSrc.includes("equipmentPalette('r1')"),'Ajout sanitaire rattaché à la zone RDC/R+1 quand les deux zones existent');
assert(appSrc.includes("data-zone=\"${zone}\""),'Chaque nouvel équipement transporte sa zone chantier');
assert(!/Prix méthode HT|Forfait débouchage HT|Forfait complet HT|Prix fourniture HT utilisé|Prix HT utilisé|Forfait pose — montant artisan|Forfait dépose — montant artisan/.test(appSrc),'Le parcours artisan ne demande plus de prix pendant le chiffrage');
assert(appSrc.includes("head('Étape 4','Résultats et contrôle'")&&appSrc.includes("step!==3")&&appSrc.includes("step===3"),'Résultats réellement routés sur la page 4');
const psTarif=base();psTarif.options.type_projet='petits_travaux';psTarif.settings.services.debouchage=215;psTarif.petits_travaux.prestations=[{id:'ds',type:'debouchage'}];const rsTarif=API.calculate(psTarif);assert(rsTarif.materiaux.find(x=>x.article_id==='debouchage_ds').prix_unitaire_ht===215,'Tarif service entreprise alimente le moteur sans saisie chantier');

// 32. v0.6.3 — référentiel réseau Téréva + temps technique automatique
const tPer=base();tPer.installation.zones={rdc_sans:true,r1_sans:false,rdc_avec:false,r1_avec:false};tPer.installation.network.time_h=undefined;tPer.installation.network.evac_price_ml=undefined;tPer.installation.network.fitting_catalogue=undefined;const rPer=API.calculate(tPer);const pPer=API.previewNetwork(tPer);
assert(Math.abs(pPer.autoTimeH-1.14)<.011,'Temps technique PER + PVC calculé automatiquement');
assert(Math.abs(rPer.main_oeuvre.heures_homme-1.14)<.011,'Temps automatique réseau repris en heures-homme');
assert(rPer.materiaux.find(x=>x.article_id==='tuyau_per')?.catalogue_code==='2272355','Tube PER résolu par référence Téréva technique');
assert(Math.abs(rPer.materiaux.find(x=>x.article_id==='tuyau_per')?.prix_unitaire_ht-.58)<.011,'Couronne PER ramenée au prix au ml');
assert(rPer.materiaux.find(x=>x.article_id==='tuyau_per')?.balise_prix==='reference_technique_tereva','Tube PER trace la référence technique');
assert(rPer.materiaux.find(x=>x.article_id==='platine_ef_ec')?.catalogue_code==='3160404','Platine double PER Téréva automatique');
assert(!rPer.materiaux.some(x=>x.article_id==='evac_local_pvc40'||x.article_id==='platine_evac_other'),'Zone réseau seul ne reçoit plus silencieusement un DN40 sanitaire');
assert(rPer.blocages.some(x=>/ÉVACUATION GÉNÉRALE/.test(x)),'Zone réseau seul exige un diamètre explicite pour l’évacuation générale');
assert(rPer.materiaux.find(x=>x.article_id==='raccords_per')?.catalogue_code==='1098216','Raccord PER Téréva automatique');
assert(!rPer.alertes.some(x=>/prix catalogue manquant|temps de pose réseau manquant/i.test(x)),'Réseau PER standard sans alerte référentiel manquant');

const tMc=base();tMc.options.type_tuyau='multicouche';tMc.installation.zones={rdc_sans:true,r1_sans:false,rdc_avec:false,r1_avec:false};tMc.installation.network.time_h=undefined;tMc.installation.network.evac_price_ml=undefined;tMc.installation.network.fitting_catalogue=undefined;const rMc=API.calculate(tMc);const pMc=API.previewNetwork(tMc);
assert(rMc.materiaux.find(x=>x.article_id==='tuyau_multicouche')?.catalogue_code==='4146584','Tube multicouche Téréva automatique');
assert(Math.abs(rMc.materiaux.find(x=>x.article_id==='tuyau_multicouche')?.prix_unitaire_ht-1.23)<.011,'Couronne multicouche ramenée au prix au ml');
assert(rMc.materiaux.find(x=>x.article_id==='raccords_multicouche')?.catalogue_code==='4146484','Raccord multicouche Téréva automatique');
assert(rMc.materiaux.find(x=>x.article_id==='platine_ef_ec')?.catalogue_code==='3160402','Platine double multicouche Téréva automatique');
assert(Math.abs(pMc.autoTimeH-pPer.autoTimeH)<.011,'PER et multicouche Ø16 utilisent le même temps technique de référence');

const tCu=base();tCu.options.type_tuyau='cuivre';tCu.installation.zones={rdc_sans:true,r1_sans:false,rdc_avec:false,r1_avec:false};tCu.installation.network.time_h=undefined;tCu.installation.network.evac_price_ml=undefined;tCu.installation.network.fitting_catalogue=undefined;const rCu=API.calculate(tCu);const pCu=API.previewNetwork(tCu);
assert(rCu.materiaux.find(x=>x.article_id==='tuyau_cuivre')?.prix_unitaire_ht===8,'Cuivre conserve le fallback validé 8 €/ml');
assert(/prix tube cuivre Téréva non publié/i.test(rCu.materiaux.find(x=>x.article_id==='tuyau_cuivre')?.source||''),'Fallback cuivre explique l’absence de prix Téréva publié');
assert(rCu.materiaux.find(x=>x.article_id==='raccords_cuivre')?.catalogue_code==='024317Z','Raccord cuivre Téréva automatique');
assert(rCu.materiaux.find(x=>x.article_id==='platine_ef_ec')?.catalogue_code==='1181674','Platine double cuivre Téréva automatique');
assert(pCu.autoTimeH>pPer.autoTimeH,'Temps technique cuivre supérieur au PER pour longueur identique');

const tWc=base();tWc.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};tWc.installation.network.time_h=undefined;tWc.installation.network.evac_price_ml=undefined;tWc.installation.network.fitting_catalogue=undefined;tWc.installation.equipments=[{id:'wc-tech',kind:'wc',subtype:'poser',catalogue:wcSel,price_ht:wcSel.prix,time_h:2}];const rWc=API.calculate(tWc);
assert(rWc.materiaux.find(x=>x.article_id==='evac_local_pvc100')?.catalogue_code==='044788U','WC utilise tube local évacuation DN100 Téréva');
assert(rWc.materiaux.find(x=>x.article_id==='platine_evac_wc')?.catalogue_code==='027749Z','WC utilise raccordement local évacuation DN100 Téréva');
assert(rWc.materiaux.find(x=>x.article_id==='robinets_arret')?.catalogue_code==='142568G','Robinet d’arrêt Téréva automatique');
const tManual=base();tManual.installation.zones={rdc_sans:true,r1_sans:false,rdc_avec:false,r1_avec:false};tManual.installation.network.time_h=3.5;tManual.installation.network.fitting_catalogue=undefined;const rManual=API.calculate(tManual);assert(Math.abs(rManual.main_oeuvre.heures_homme-3.5)<.011,'Temps artisan remplace la proposition technique automatique');
const chosen=selectFirst('raccord_per');const tChosen=base();tChosen.installation.network.ef_only=1;tChosen.installation.network.fitting_catalogue=chosen;const rChosen=API.calculate(tChosen);assert(rChosen.materiaux.find(x=>x.article_id==='raccords_per')?.catalogue_code===chosen.code,'Référence choisie par artisan reste prioritaire sur référence technique');
assert(rPer.controle_balises.version==='BALISES-ABSOLUES-v1.8','Balises v1.8 actives sur référentiel réseau');
assert(appSrc.includes('Proposition technique automatique'),'UI affiche le temps réseau proposé et modifiable');

// v0.6.5 — prix moyens appareillage sans sélection catalogue + base Angel
const avgExpected={lavabo:165.11,meuble_vasque:204.19,douche:428.06,baignoire:307.93,evier:194.69,lave_main:83.59};
for(const [kind,price] of Object.entries(avgExpected)){
  const t=base();t.options.gamme='standard';t.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};t.installation.equipments=[{id:'avg-'+kind,kind,zone:'rdc',time_h:1}];
  if(kind==='douche')t.installation.equipments[0].subtype='bac';
  const rr=API.calculate(t),line=rr.materiaux.find(x=>x.article_id==='equip_avg-'+kind);
  assert(!!line,`Ligne appareil moyen présente pour ${kind}`);
  assert(approx(line.prix_unitaire_ht,price),`Prix moyen standard correct pour ${kind}`);
  assert(line.balise_prix==='moyenne_catalogue',`Source moyenne catalogue tracée pour ${kind}`);
}
const avgLavEco=API.equipmentAveragePrice({kind:'lavabo'},'eco'),avgLavPremium=API.equipmentAveragePrice({kind:'lavabo'},'premium');
assert(approx(avgLavEco.price,82.66)&&approx(avgLavPremium.price,231.37),'Gammes Éco/Premium lavabo exposées');
assert(ANGEL&&ANGEL.version==='PLB-ANGEL-KB-v1.8','Base de connaissances Angel Plombier chargée');
assert(ANGEL.search('prix lavabo sans catalogue',3).some(x=>x.id==='PLB-PRIX-LAVABO'),'Angel retrouve la règle de prix lavabo sans catalogue');
assert(/165,11/.test(ANGEL.answer('prix lavabo sans catalogue')),'Angel répond avec le prix moyen standard lavabo');
assert(appSrc.includes('Prix moyen SpeedArti'),'UI affiche explicitement le prix moyen quand le catalogue n’est pas sélectionné');

// 30. Correctifs v0.6.5 Guillaume
const dist=base();dist.installation.equipments=[{id:'shdist',kind:'douche',subtype:'bac'},{id:'evdist',kind:'evier',subtype:'inox'}];
const pDist1=API.previewNetwork(dist);assert(pDist1.autoEC===29&&pDist1.autoEF===29,'Distances chauffe-eau 5 m SDB + 8 m cuisine intégrées à EF + EC');
dist.installation.network.distance_ce_sdb=10;dist.installation.network.distance_ce_cuisine=10;
const pDist2=API.previewNetwork(dist);assert(pDist2.autoEC===36&&pDist2.autoEF===36,'Modification distances chauffe-eau modifie réellement EF + EC');
assert(appSrc.includes('additionalCatalogueItemsPanel'),'Meuble vasque accepte une composition multi-articles');
assert(engSrc.includes('addAdditionalCatalogueItems'),'Moteur chiffre les articles complémentaires du meuble vasque');
assert(appSrc.includes('Reprendre le calcul automatique'),'Override réseau peut revenir au calcul automatique');
assert(appSrc.includes('aucune platine n’est calculée'),'Élément spécifique avertit quand aucun raccordement n’est défini');

// 33. v0.6.6 — composants automatiques et habitudes entreprise
const prefSiphon=API.companyComponentPreference(base(),'lavabo_siphon');
const prefBonde=API.companyComponentPreference(base(),'lavabo_bonde');
const prefLaveMainBonde=API.companyComponentPreference(base(),'lave_main_bonde');
assert(prefSiphon.selection?.code==='1054371','Défaut SpeedArti siphon lavabo = Nicoll EASYPHON 1054371');
assert(prefBonde.selection?.code==='2864095','Défaut SpeedArti bonde lavabo/vasque = 2864095');
assert(prefLaveMainBonde.selection?.code==='997361L','Défaut SpeedArti bonde lave-mains = Nicoll 997361L');

const autoLav=base();netRefs(autoLav);autoLav.installation.equipments.push({id:'autolav',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2});
const rAutoLav=API.calculate(autoLav);
assert(rAutoLav.materiaux.some(x=>x.article_id==='auto_autolav_siphon'&&x.catalogue_code==='1054371'&&x.auto_component),'Lavabo chiffre automatiquement son siphon');
assert(rAutoLav.materiaux.some(x=>x.article_id==='auto_autolav_bonde'&&x.catalogue_code==='2864095'&&x.auto_component),'Lavabo chiffre automatiquement sa bonde');

const mvAuto=base();netRefs(mvAuto);mvAuto.installation.equipments.push({id:'mvauto',kind:'meuble_vasque',subtype:'double',time_h:2,additional_catalogue_items:[{catalogue:CAT.selection(CAT.search({context:'meuble_vasque',q:'meuble',limit:100}).find(a=>a.prix>0&&a.code)),quantite:1},{catalogue:CAT.selection(CAT.search({context:'lavabo',q:'vasque',limit:100}).find(a=>a.prix>0&&a.code)),quantite:2}]});
const rMvAuto=API.calculate(mvAuto);
assert(rMvAuto.materiaux.find(x=>x.article_id==='auto_mvauto_siphon')?.quantite_finale===2,'Deux vasques séparées préremplissent deux siphons');
assert(rMvAuto.materiaux.find(x=>x.article_id==='auto_mvauto_bonde')?.quantite_finale===2,'Deux vasques séparées préremplissent deux bondes');

const incl=base();netRefs(incl);incl.installation.equipments.push({id:'incl',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2,annexe2_items:{siphon:{included_in_main:true}}});
const rIncl=API.calculate(incl);
assert(!rIncl.materiaux.some(x=>x.article_id==='auto_incl_siphon'),'Composant déclaré compris dans le produit principal non doublé');
assert(rIncl.nomenclature_annexe2[0].components.find(x=>x.key==='siphon').status.includes('compris'),'Nomenclature trace le composant compris');

const wirquinRaw=CAT.search({context:'all',q:'2804624',limit:10}).find(a=>a.code==='2804624');assert(!!wirquinRaw,'Siphon Wirquin 2804624 disponible dans Téréva');
const prefCustom=base();prefCustom.settings.component_preferences.lavabo_siphon=CAT.selection(wirquinRaw);netRefs(prefCustom);prefCustom.installation.equipments.push({id:'prefcustom',kind:'lavabo',catalogue:lavSel,price_ht:lavSel.prix,time_h:2});
const rPrefCustom=API.calculate(prefCustom);
assert(rPrefCustom.materiaux.find(x=>x.article_id==='auto_prefcustom_siphon')?.catalogue_code==='2804624','Habitude entreprise remplace le défaut SpeedArti');
assert(rPrefCustom.materiaux.find(x=>x.article_id==='auto_prefcustom_siphon')?.auto_component_source==='preference_entreprise','Source habitude entreprise tracée');
assert(appSrc.includes('Habitudes de l’entreprise')&&appSrc.includes('componentPreferencesCard'),'UI expose les références habituelles entreprise');
assert(appSrc.includes('Compris dans le produit principal'),'UI permet d’éviter le double comptage d’un composant inclus');
assert(appSrc.includes('data-catalogue-auto-qty'),'Changement de référence conserve la quantité automatique proposée');
assert(/1054371/.test(ANGEL.answer('siphon lavabo automatique')),'Angel connaît la référence automatique du siphon lavabo');
assert(/habitude entreprise/i.test(ANGEL.answer('habitude entreprise siphon')),'Angel connaît la priorité des habitudes entreprise');

// 34. v0.6.7 — cumul MO sanitaire / raccordement local / réseau général
const moSplit=base();delete moSplit.installation.network.time_h;moSplit.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};
moSplit.installation.equipments=[{id:'mo-lav',kind:'lavabo',zone:'rdc',time_h:2}];
const pMo=API.previewNetwork(moSplit);
assert(pMo.localEvacForLabor===1&&pMo.generalEvacForLabor===0,'1 m évacuation lavabo classé raccordement local');
assert(approx(pMo.autoTimeH,1.66),'Temps réseau lavabo suit EF+EC avec distance nourrice, hors évacuation locale');
const rMo=API.calculate(moSplit);
assert(approx(rMo.main_oeuvre.heures_homme,3.66),'MO totale = 2 h sanitaire/raccordement local + 1,66 h réseau général');
const moSan=rMo.main_oeuvre.decomposition.find(x=>x.poste==='Pose sanitaires + raccordements locaux');
const moNet=rMo.main_oeuvre.decomposition.find(x=>x.poste==='Réseau général EF/EC/évacuation');
assert(approx(moSan?.temps_heures,2),'Décomposition MO sanitaire/raccordement local = 2 h');
assert(approx(moNet?.temps_heures,1.66),'Décomposition MO réseau général = 1,66 h');

const moExtraEvac=base();delete moExtraEvac.installation.network.time_h;moExtraEvac.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};
moExtraEvac.installation.equipments=[{id:'mo-lav2',kind:'lavabo',zone:'rdc',time_h:2}];moExtraEvac.installation.network.manual_evac_local_ml=3;
const pMoExtra=API.previewNetwork(moExtraEvac);
assert(pMoExtra.localEvacForLabor===3&&pMoExtra.generalEvacForLabor===0,'Évacuation locale modifiée reste un raccordement local sanitaire');
assert(approx(pMoExtra.autoTimeH,1.66),'Allonger le raccordement local ne crée pas artificiellement du temps de réseau général');
assert(appSrc.includes('Temps pose sanitaire + raccordements locaux (h)'),'UI distingue le temps sanitaire + raccordements locaux');
assert(appSrc.includes('Temps de pose réseau général (h)'),'UI distingue le temps du réseau général');
assert(appSrc.includes('Détail du cumul main-d’œuvre'),'Résultat affiche le cumul MO détaillé');
assert(/raccordement local/i.test(ANGEL.answer('temps réseau platine raccordement local')),'Angel explique que le raccordement local est inclus dans le temps sanitaire');

// 35. v0.6.8 — évacuations mixtes DN100/DN40 et séparation local/général
const mixedEvac=base();delete mixedEvac.installation.network.time_h;mixedEvac.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};
mixedEvac.installation.equipments=[{id:'mix-wc',kind:'wc',subtype:'poser',time_h:2},{id:'mix-douche',kind:'douche',subtype:'bac',time_h:2}];
const pMixed=API.previewNetwork(mixedEvac);const rMixed=API.calculate(mixedEvac);
assert(pMixed.autoPlatineEvacWc===1&&pMixed.autoPlatineEvacOther===1,'Chantier mixte sépare 1 raccord WC DN100 et 1 raccord autre DN40');
assert(rMixed.materiaux.find(x=>x.article_id==='platine_evac_wc')?.catalogue_code==='027749Z','Raccord WC mixte reste DN100');
assert(rMixed.materiaux.find(x=>x.article_id==='platine_evac_other')?.catalogue_code==='059805D','Raccord douche mixte reste DN40');
assert(rMixed.materiaux.find(x=>x.article_id==='evac_local_pvc100')?.catalogue_code==='044788U','Tube local WC mixte = DN100');
assert(rMixed.materiaux.find(x=>x.article_id==='evac_local_pvc40')?.catalogue_code==='044755V','Tube local douche mixte = DN40');
assert(rMixed.materiaux.find(x=>x.article_id==='platine_evac_wc')?.categorie==='Raccordement local sanitaire','Raccord WC classé en raccordement local');
assert(rMixed.materiaux.find(x=>x.article_id==='platine_evac_other')?.categorie==='Raccordement local sanitaire','Raccord autre sanitaire classé en raccordement local');
assert(!rMixed.materiaux.some(x=>x.article_id==='platine_evac'),'Ancienne ligne générique évacuation supprimée');
assert(!rMixed.blocages.some(x=>/ÉVACUATION GÉNÉRALE/.test(x)),'Chantier sanitaire mixte local ne déclenche pas de faux réseau général');

const specificEvac=base();delete specificEvac.installation.network.time_h;specificEvac.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};
specificEvac.installation.equipments=[{id:'spec-evac',kind:'element_specifique',label:'Équipement spécial',evac:true,time_h:1,price_ht:50}];
const pSpecEvac=API.previewNetwork(specificEvac),rSpecEvac=API.calculate(specificEvac);
assert(pSpecEvac.autoGeneralEvac===1&&pSpecEvac.autoLocalEvac===0,'Évacuation élément spécifique classée réseau général/spécifique');
assert(rSpecEvac.blocages.some(x=>/ÉVACUATION GÉNÉRALE/.test(x)),'Élément spécifique évacuation sans diamètre ne reçoit pas de DN inventé');
assert(!rSpecEvac.materiaux.some(x=>x.article_id==='platine_evac_other'||x.article_id==='platine_evac_wc'),'Élément spécifique sans diamètre ne reçoit pas de raccord sanitaire automatique');

assert(appSrc.includes('Évacuation locale sanitaires')&&appSrc.includes('Évacuation réseau général / spécifique'),'UI sépare les longueurs local/général');
assert(appSrc.includes('Raccords évacuation WC DN100')&&appSrc.includes('Raccords évacuation autres sanitaires DN40'),'UI sépare les raccords DN100/DN40');
assert(/DN100/.test(ANGEL.answer('wc evacuation raccord dn100'))&&/DN40/.test(ANGEL.answer('wc evacuation raccord dn100')),'Angel connaît la séparation DN100 WC / DN40 autres');
assert(/ne choisit pas silencieusement un diamètre/i.test(ANGEL.answer('evacuation reseau general element specifique diamètre')),'Angel interdit le DN inventé sur réseau général');

// 36. v0.6.9 — composition automatique étendue WC / douche / baignoire / évier
const autoShower=base();autoShower.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};autoShower.installation.equipments=[{id:'auto-shower',kind:'douche',subtype:'bac',time_h:2}];
const rAutoShower=API.calculate(autoShower);
assert(rAutoShower.materiaux.find(x=>x.article_id==='auto_auto-shower_bonde')?.catalogue_code==='4273010','Douche standard préremplit bonde Ø90 4273010');

const autoShowerFlat=base();autoShowerFlat.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};autoShowerFlat.installation.equipments=[{id:'auto-shower-flat',kind:'douche',subtype:'extra_plat',time_h:2}];
const rAutoShowerFlat=API.calculate(autoShowerFlat);
assert(rAutoShowerFlat.materiaux.find(x=>x.article_id==='auto_auto-shower-flat_bonde')?.catalogue_code==='4281682','Douche extra-plate préremplit bonde 4281682');

const autoItalian=base();autoItalian.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};autoItalian.installation.equipments=[{id:'auto-italian',kind:'douche',subtype:'italienne',time_h:2}];
const rAutoItalian=API.calculate(autoItalian);
assert(!rAutoItalian.materiaux.some(x=>x.article_id==='auto_auto-italian_bonde'),'Douche italienne ne reçoit pas de bonde générique inventée');

const autoBath=base();autoBath.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};autoBath.installation.equipments=[{id:'auto-bath',kind:'baignoire',subtype:'droite',time_h:2}];
const rAutoBath=API.calculate(autoBath);
assert(rAutoBath.materiaux.find(x=>x.article_id==='auto_auto-bath_vidage')?.catalogue_code==='767547L','Baignoire préremplit vidage 767547L');
assert(rAutoBath.materiaux.find(x=>x.article_id==='auto_auto-bath_siphon')?.catalogue_code==='4273012','Baignoire préremplit siphon 4273012');

const autoSink1=base();autoSink1.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};autoSink1.installation.equipments=[{id:'auto-sink1',kind:'evier',subtype:'inox',config:'simple',time_h:2}];
const rAutoSink1=API.calculate(autoSink1);
assert(rAutoSink1.materiaux.find(x=>x.article_id==='auto_auto-sink1_bonde')?.catalogue_code==='4272991','Évier simple préremplit bonde 1 cuve 4272991');
assert(rAutoSink1.materiaux.find(x=>x.article_id==='auto_auto-sink1_siphon')?.catalogue_code==='1066748','Évier simple préremplit siphon 1066748');

const autoSink2=base();autoSink2.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};autoSink2.installation.equipments=[{id:'auto-sink2',kind:'evier',subtype:'inox',config:'double',time_h:2}];
const rAutoSink2=API.calculate(autoSink2);
assert(rAutoSink2.materiaux.find(x=>x.article_id==='auto_auto-sink2_bonde')?.catalogue_code==='4273023','Évier double préremplit bonde 2 cuves 4273023');
assert(rAutoSink2.materiaux.find(x=>x.article_id==='auto_auto-sink2_siphon')?.catalogue_code==='1066748','Évier double conserve siphon évier 1066748');

const autoWc=base();autoWc.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};autoWc.installation.equipments=[{id:'auto-wc',kind:'wc',subtype:'poser',time_h:2}];
const rAutoWc=API.calculate(autoWc);
assert(rAutoWc.materiaux.find(x=>x.article_id==='auto_auto-wc_fixations_sol')?.catalogue_code==='1085426','WC à poser préremplit fixation au sol 1085426');
assert(!rAutoWc.materiaux.some(x=>x.article_id==='auto_auto-wc_pipe_wc'),'Pipe WC non automatisée car géométrie dépendante de la pose');

const autoWcSusp=base();autoWcSusp.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};autoWcSusp.installation.equipments=[{id:'auto-wcs',kind:'wc',subtype:'suspendu',time_h:5}];
const rAutoWcSusp=API.calculate(autoWcSusp);
assert(!rAutoWcSusp.materiaux.some(x=>x.auto_component),'WC suspendu ne reçoit pas d’accessoire générique arbitraire');

const bathIncluded=base();bathIncluded.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};bathIncluded.installation.equipments=[{id:'bath-included',kind:'baignoire',subtype:'droite',time_h:2,annexe2_items:{vidage:{included_in_main:true}}}];
const rBathIncluded=API.calculate(bathIncluded);
assert(!rBathIncluded.materiaux.some(x=>x.article_id==='auto_bath-included_vidage'),'Vidage déclaré compris dans la baignoire non doublé');
assert(rBathIncluded.materiaux.some(x=>x.article_id==='auto_bath-included_siphon'),'Siphon baignoire reste indépendant si non déclaré compris');

assert(appSrc.includes("Object.keys(API.AUTO_COMPONENT_PREFERENCES||{})"),'UI habitudes entreprise expose toutes les références automatiques');
assert(appSrc.includes("API.autoComponentKind?.(eq)"),'UI applique les composants conditionnels par type/configuration');
assert(/4273010/.test(ANGEL.answer('bonde douche standard automatique')),'Angel connaît la bonde douche standard');
assert(/4281682/.test(ANGEL.answer('bonde douche extra plate automatique')),'Angel connaît la bonde douche extra-plate');
assert(/767547L/.test(ANGEL.answer('vidage baignoire automatique'))&&/4273012/.test(ANGEL.answer('vidage baignoire automatique')),'Angel connaît vidage et siphon baignoire');
assert(/4272991/.test(ANGEL.answer('bonde evier une cuve automatique'))&&/1066748/.test(ANGEL.answer('bonde evier une cuve automatique')),'Angel connaît la composition évier 1 cuve');
assert(/4273023/.test(ANGEL.answer('bonde evier deux cuves automatique')),'Angel connaît la bonde évier 2 cuves');
assert(/1085426/.test(ANGEL.answer('fixation wc poser automatique')),'Angel connaît la fixation WC à poser');
assert(/ne force pas de référence/i.test(ANGEL.answer('pipe wc douche italienne composant depend de la pose')),'Angel connaît les limites de l’automatisation');

// 37. Sprint C v0.7.0 — Téréva source unique des références/prix réseau
assert(typeof CAT.byCode==='function','Catalogue expose une résolution exacte par code');
const exactPer=CAT.byCode('2272355');assert(exactPer?.code==='2272355'&&approx(exactPer.prix,70.04),'Résolution exacte tube PER depuis catalogue-data');
const techPer=API.resolveTechnicalReference({code:'2272355',expected:'tube_per'});assert(techPer.status==='ok','Résolveur technique accepte le tube PER attendu');
const techMissing=API.resolveTechnicalReference({code:'CODE-INEXISTANT-SPEEDARTI',expected:'tube_per'});assert(techMissing.status==='missing','Référence technique disparue détectée');
const techIncompatible=API.resolveTechnicalReference({code:'044755V',expected:'raccord_per'});assert(techIncompatible.status==='incompatible','Référence technique incompatible détectée');
assert(Object.keys(API.PIPE_FALLBACK).length===1&&API.PIPE_FALLBACK.cuivre===8,'Seul le fallback cuivre 8 €/ml est conservé');
assert(!/prix:70\.04|prix:123\.06|prix:2\.77|prix:3\.14|prix:21\.26|prix:27\.67|prix:20\.12|prix:27\.00|prix:1\.28|prix:15\.94|prix:57\.63|prix:1\.88|prix:3\.76|prix:10\.24|prix:8\.70|prix:16\.48/.test(engSrc),'Aucun prix Téréva réseau recopié en dur');
const cPer=base();cPer.installation.zones={rdc_sans:true,r1_sans:false,rdc_avec:false,r1_avec:false};cPer.installation.network.time_h=undefined;cPer.installation.network.evac_price_ml=undefined;
const rcPer=API.calculate(cPer),catTubePer=CAT.byCode('2272355'),lineTubePer=rcPer.materiaux.find(x=>x.article_id==='tuyau_per');
assert(lineTubePer?.catalogue_code==='2272355'&&approx(lineTubePer.prix_unitaire_ht,catTubePer.prix/120),'Prix tube PER lu depuis catalogue');
const catFitPer=CAT.byCode('1098216'),lineFitPer=rcPer.materiaux.find(x=>x.article_id==='raccords_per');
assert(lineFitPer?.catalogue_code==='1098216'&&approx(lineFitPer.prix_unitaire_ht,catFitPer.prix),'Prix raccord PER lu depuis catalogue');
assert(/catalogue Téréva embarqué|codes métier|fallback silencieux/i.test(ANGEL.answer('source unique références réseau Téréva codes métier')),'Angel v1.5 connaît la source unique Téréva');

// 38. Sprint D v0.7.1 — automatisations issues de l'audit humain
const sinkDefault=base();sinkDefault.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};sinkDefault.installation.equipments=[{id:'sink-default',kind:'evier',subtype:'inox',time_h:2}];
const rSinkDefault=API.calculate(sinkDefault);
assert(rSinkDefault.materiaux.find(x=>x.article_id==='auto_sink-default_bonde')?.catalogue_code==='4272991','Évier sans config explicite = simple bac avec bonde 4272991');

const learnedTime=base();learnedTime.settings.sanitary_time_preferences.lavabo=2;delete learnedTime.installation.network.time_h;learnedTime.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};learnedTime.installation.equipments=[{id:'learned-lav',kind:'lavabo',zone:'rdc'}];
const rLearnedTime=API.calculate(learnedTime);
assert(approx(rLearnedTime.main_oeuvre.heures_homme,3.66),'Habitude temps lavabo 2 h + réseau 1,66 h automatisée');
assert(!rLearnedTime.blocages.some(x=>/Temps de pose manquant pour « Lavabo/.test(x)),'Habitude temps supprime le manque de temps lavabo');

const noLearnedTime=base();delete noLearnedTime.installation.network.time_h;noLearnedTime.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};noLearnedTime.installation.equipments=[{id:'no-time-lav',kind:'lavabo',zone:'rdc'}];
const rNoLearnedTime=API.calculate(noLearnedTime);
assert(rNoLearnedTime.blocages.some(x=>/Temps de pose manquant pour « Lavabo/.test(x)),'Sans temps fiable SpeedArti n’invente toujours pas de durée');

const spec40=base();delete spec40.installation.network.time_h;spec40.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};spec40.installation.equipments=[{id:'spec40',kind:'element_specifique',label:'Équipement spécial',evac:true,evac_diameter:'40',time_h:1,price_ht:50}];
const rSpec40=API.calculate(spec40);
assert(rSpec40.materiaux.find(x=>x.article_id==='evac_specific_pvc40')?.catalogue_code==='044755V','Élément spécifique DN40 ajoute automatiquement tube 044755V');
assert(rSpec40.materiaux.find(x=>x.article_id==='evac_specific_raccord40')?.catalogue_code==='059805D','Élément spécifique DN40 ajoute automatiquement raccord 059805D');
assert(!rSpec40.blocages.some(x=>/ÉVACUATION GÉNÉRALE/.test(x)),'Élément spécifique DN40 chiffré sans blocage diamètre');

const specNoDiam=base();delete specNoDiam.installation.network.time_h;specNoDiam.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};specNoDiam.installation.equipments=[{id:'specnod',kind:'element_specifique',label:'Équipement spécial',evac:true,time_h:1,price_ht:50}];
const rSpecNoDiam=API.calculate(specNoDiam);
assert(rSpecNoDiam.blocages.some(x=>/fourniture reste non chiffrée/.test(x)),'Élément spécifique sans diamètre signale explicitement la fourniture non chiffrée');

const robRaw=CAT.search({context:'all',q:'mitigeur lavabo',limit:100}).find(a=>a.prix>0&&a.code);assert(!!robRaw,'Une référence mitigeur lavabo exploitable existe pour tester l’habitude');
const robSel=CAT.selection(robRaw);
const autoRob=base();delete autoRob.installation.network.time_h;autoRob.settings.component_preferences.meuble_vasque_robinet=robSel;autoRob.settings.sanitary_time_preferences.option_meuble_vasque_robinet=1;autoRob.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};autoRob.installation.equipments=[{id:'mvrob',kind:'meuble_vasque',subtype:'double',time_h:2,robinet:true}];
const rAutoRob=API.calculate(autoRob),robLine=rAutoRob.materiaux.find(x=>x.article_id==='robinet_mvrob');
assert(robLine?.catalogue_code===robSel.code&&robLine.quantite_finale===2,'Double vasque utilise automatiquement 2 robinets de l’habitude entreprise');
assert(approx(rAutoRob.main_oeuvre.heures_homme,4.66),'Temps robinetterie habituel 1 h ajouté automatiquement au sanitaire + réseau');
assert(!rAutoRob.blocages.some(x=>/ROBINETTERIE|Robinetterie meuble vasque/.test(x)),'Habitude robinetterie complète évite le blocage');

const noRobHabit=base();noRobHabit.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};noRobHabit.installation.equipments=[{id:'mvno',kind:'meuble_vasque',subtype:'double',time_h:2,robinet:true}];
const rNoRobHabit=API.calculate(noRobHabit);
assert(rNoRobHabit.blocages.some(x=>/ROBINETTERIE/.test(x)),'Sans référence fiable la robinetterie reste explicitement à compléter');
assert(appSrc.includes("eq.config='simple'"),'UI initialise réellement un nouvel évier en simple bac');
assert(appSrc.includes('sanitary_time_preferences'),'UI mémorise les habitudes de temps sanitaires');
assert(appSrc.includes('Diamètre évacuation'),'UI demande le diamètre seulement pour l’élément spécifique avec évacuation');
assert(/habitude entreprise/i.test(ANGEL.answer('temps sanitaire automatique habitude entreprise')),'Angel v1.6 connaît l’automatisation des temps par habitude');
assert(/DN40 ou DN100/.test(ANGEL.answer('element specifique evacuation diametre automatique')),'Angel v1.6 connaît le chiffrage évacuation spécifique par diamètre');

// 39. Sprint E v0.8.0 — retour Guillaume complet
const lm=base();delete lm.installation.network.time_h;lm.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};lm.installation.equipments=[{id:'lm-e',kind:'lave_main',subtype:'standard',time_h:1}];
const pLm=API.previewNetwork(lm),rLm=API.calculate(lm);
assert(pLm.efPoints===1&&pLm.ecPoints===1,'Lave-main = un point EF + un point EC');
assert(pLm.autoPlatineEfEc===1&&pLm.autoPlatineEf===0,'Lave-main utilise une platine EF+EC');
assert(pLm.autoEF===13&&pLm.autoEC===13,'Lave-main SDB applique aussi la distance 5 m à EF + EC');
assert(rLm.materiaux.some(x=>x.article_id==='platine_ef_ec'&&x.catalogue_code==='3160404'&&x.quantite_finale===1),'Lave-main chiffre la platine double EF+EC Téréva 3160404');
assert(appSrc.includes('Alimentation automatique EF + EC'),'UI explique la règle EF+EC du lave-main');
assert(!appSrc.includes("toggle(`${prefix}.ec`,'Eau chaude prévue'"),'Ancien choix lave-main EF seul supprimé');

const lavRobRef=CAT.selection(CAT.search({context:'all',q:'mitigeur lavabo',limit:100}).find(a=>a.prix>0&&a.code));
assert(!!lavRobRef?.code,'Référence robinet lavabo exploitable');
const lavRob=base();delete lavRob.installation.network.time_h;lavRob.settings.component_preferences.lavabo_robinet=lavRobRef;lavRob.settings.sanitary_time_preferences.option_lavabo_robinet=.5;lavRob.installation.zones={rdc_sans:false,r1_sans:false,rdc_avec:true,r1_avec:false};lavRob.installation.equipments=[{id:'lav-rob',kind:'lavabo',time_h:1,robinet:true}];
const rLavRob=API.calculate(lavRob),lavRobLine=rLavRob.materiaux.find(x=>x.article_id==='robinet_lav-rob');
assert(lavRobLine?.catalogue_code===lavRobRef.code,'Lavabo/vasque reprend automatiquement la robinetterie habituelle');
assert(appSrc.includes("'lavabo_robinet','Robinet / mitigeur'"),'Lavabo/vasque possède le choix rapide robinet Oui/Non');

const flexRaw=CAT.search({context:'all',q:'flexible',limit:100}).find(a=>a.prix>0&&a.code);assert(!!flexRaw,'Référence flexible exploitable pour habitude générique');
const flexSel=CAT.selection(flexRaw),slot=base();slot.settings.slot_preferences['lavabo_flexibles']=flexSel;slot.installation.equipments=[{id:'lav-slot',kind:'lavabo',time_h:1}];
const rSlot=API.calculate(slot),slotLine=rSlot.materiaux.find(x=>x.article_id==='annexe2_lav-slot_flexibles');
assert(slotLine?.catalogue_code===flexSel.code&&slotLine.slot_preference_source==='preference_entreprise','Habitude accessoire générique appliquée sans sélection chantier');
assert(API.slotPreferenceKey({kind:'lavabo'},'flexibles')==='lavabo_flexibles','Clé habitude accessoire stable');
assert(appSrc.includes('Mémoriser comme habitude'),'UI permet de mémoriser un accessoire configurable comme habitude');

assert(CAT.providers?.tereva?.enabled===true,'Téréva reste fournisseur actif');
assert(CAT.providers?.ccl?.enabled===false&&CAT.providers.ccl.count===0,'CCL préparé mais inactif sans données inventées');
const supplierSel=CAT.selection(CAT.byCode('1054371'));assert(supplierSel.supplier_id==='tereva','Sélection catalogue trace le fournisseur Téréva');
const supp=base();supp.installation.equipments=[{id:'sup-lav',kind:'lavabo',time_h:1}];const rSupp=API.calculate(supp);
assert(rSupp.approvisionnement.payload_fournisseur.version==='PLB-APPRO-V2','Payload fournisseur passe en V2 multi-fournisseurs');
assert(rSupp.approvisionnement.items.some(x=>x.catalogue_fournisseur==='tereva'),'Approvisionnement conserve le fournisseur article');

assert(appSrc.includes('catalogue-shortcuts')&&appSrc.includes('catalogueShortcutIcon'),'Catalogue visuel par familles présent');
assert(appSrc.includes('catalogueGlobalPanel()+componentPreferencesCard()'),'Catalogue visuel affiché à l’étape 3');
assert(cssSrc.includes('@media(max-width:1180px)')&&cssSrc.includes('.layout-with-cart{display:block}'),'Étape 3 bascule sans chevauchement sur écrans intermédiaires');
assert(cssSrc.includes('.grid>*{min-width:0}'),'Protection anti-débordement des grilles active');
assert(appSrc.includes('Ajouté automatiquement au chiffrage'),'Résumé visible des composants automatiques présent');
assert(/nourrices/.test(ANGEL.answer('distance chauffe eau eau froide nourrices')),'Angel v1.7 connaît EF + EC selon distance nourrices');
assert(/platine EF\+EC/.test(ANGEL.answer('lave main eau chaude froide platine')),'Angel v1.7 connaît lave-main EF+EC');
assert(/CCL/.test(ANGEL.answer('catalogue CCL fournisseur')),'Angel v1.7 sait que CCL est préparé sans données inventées');

// 40. Sprint F v0.8.1 — distance moyenne SDB + copie vers éléments similaires
assert(appSrc.includes('Chauffe-eau → distance moyenne salle de bain (m)'),'Libellé distance moyenne salle de bain affiché');
assert(appSrc.includes('Distance moyenne salle de bain'),'Résumé réseau utilise aussi le nouveau libellé');

const similarSource={
  id:'wc-source',kind:'wc',subtype:'suspendu',zone:'rdc',
  catalogue:{code:'WC-SRC',produit:'WC suspendu test',prix:500},
  price_ht:500,time_h:5,pmr_wc:true,
  annexe2_items:{fixations:{catalogue:{code:'FIX-SRC',produit:'Fixation test',prix:10},quantite:2}},
  additional_catalogue_items:[{catalogue:{code:'ADD-SRC',produit:'Accessoire test',prix:20},quantite:1}]
};
const similarTarget={id:'wc-target',kind:'wc',subtype:'suspendu',zone:'r1',catalogue:{code:'OLD'},time_h:2};
const copiedSimilar=API.copyEquipmentCharacteristics(similarSource,similarTarget);
assert(copiedSimilar?.id==='wc-target'&&copiedSimilar.zone==='r1','Copie similaire conserve ID et zone de la cible');
assert(copiedSimilar?.catalogue?.code==='WC-SRC'&&copiedSimilar.time_h===5&&copiedSimilar.pmr_wc===true,'Copie similaire reprend les caractéristiques principales');
assert(copiedSimilar?.annexe2_items?.fixations?.catalogue?.code==='FIX-SRC','Copie similaire reprend les accessoires et références');
assert(copiedSimilar?.additional_catalogue_items?.[0]?.catalogue?.code==='ADD-SRC','Copie similaire reprend les articles complémentaires');
assert(API.similarEquipmentKey(similarSource)===API.similarEquipmentKey(similarTarget),'Deux WC suspendus sont similaires');

const wcPoser={id:'wc-poser',kind:'wc',subtype:'poser',zone:'rdc'};
assert(API.similarEquipmentKey(similarSource)!==API.similarEquipmentKey(wcPoser),'WC suspendu et WC à poser ne sont pas similaires');
assert(API.copyEquipmentCharacteristics(similarSource,wcPoser)===null,'Aucune copie WC suspendu vers WC à poser');

const sinkSimple={id:'sink-a',kind:'evier',subtype:'inox',config:'simple',zone:'rdc'};
const sinkDouble={id:'sink-b',kind:'evier',subtype:'inox',config:'double',zone:'rdc'};
assert(API.similarEquipmentKey(sinkSimple)!==API.similarEquipmentKey(sinkDouble),'Évier simple et double ne sont pas similaires');

const specA={id:'sp-a',kind:'element_specifique',label:'Broyeur',zone:'rdc'};
const specB={id:'sp-b',kind:'element_specifique',label:'Pompe',zone:'rdc'};
assert(API.similarEquipmentKey(specA)!==API.similarEquipmentKey(specB),'Éléments spécifiques de désignations différentes ne sont pas similaires');

assert(appSrc.includes('data-apply-similar'),'Bouton appliquer aux éléments similaires présent dans l’UI');
assert(appSrc.includes('Caractéristiques appliquées à'),'Retour utilisateur après copie présent');
assert(/éléments similaires/.test(ANGEL.answer('appliquer caracteristiques elements similaires wc suspendu')),'Angel v1.8 connaît la copie des caractéristiques');
assert(/distance moyenne salle de bain/.test(ANGEL.answer('distance chauffe eau salle de bain')),'Angel v1.8 connaît le nouveau libellé distance moyenne salle de bain');

console.log(JSON.stringify({status:'OK',assertions:ok,catalogueCount:CAT.count,priceCount:CAT.priceCount,knownPrice117_19:known[0].prix,balisesVersion:r1.controle_balises.version,networkOnly:{ef:r2.surfaces.detail_par_face.EF_ml,ec:r2.surfaces.detail_par_face.EC_ml},fittingsOneFixture:fittingsWC.quantite_finale},null,2));
