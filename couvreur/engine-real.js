(function(){
const C=window.SpeedArtiRoofCatalog;if(!C)throw new Error('Catalogue toiture non chargé');
const PRODUCTS=C.products.filter(p=>p.active!==false);
const PRICE={
  tile:{canal:1.85,plate:1.55,grand_moule:1.72,petit_moule:1.62,default:1.70},
  underlay:2.60,counterBatten:1.35,batten:1.25,eavesApron:5.80,ridge:5.90,rake:6.20,closer:7.50,eavesComb:2.90,valley:11.50,flashing:13,
  ventTile:29,outlet125:79,outlet160:88,roofWindow:520,chimneyFlashing:175,fixing:0.12,
  gutter:{zinc:18.5,pvc:9.5,aluminium:21,cuivre:52},gutterHook:2.3,gutterOutlet:14,gutterEnd:6.5,gutterJoint:5.5,downpipe:18,elbow:8.5,collar:4.2,dolphin:26,
  boxGutter:42,fascia:{bois:15,pvc:22,aluminium:29,zinc:33},
  scaffold:14,lifeline:260,guardrail:18,safetyNet:9,roofLadder:85,materialLift:420,anchor:34
};
const round=(v,d=2)=>Math.round((Number(v)||0)*10**d)/10**d; const ceil=v=>Math.ceil(Math.max(0,Number(v)||0));
const avg=r=>r&&Number.isFinite(Number(r.mean))?Number(r.mean):undefined;
function numericRange(r){
  if(!r)return null;
  const min=Number(r.min),max=Number(r.max),mean=Number(r.mean);
  const vals=[min,max,mean].filter(Number.isFinite);
  if(!vals.length)return null;
  const lo=Number.isFinite(min)?min:(Number.isFinite(mean)?mean:max);
  const hi=Number.isFinite(max)?max:(Number.isFinite(mean)?mean:min);
  return {min:Math.min(lo,hi),max:Math.max(lo,hi),mean:Number.isFinite(mean)?mean:(lo+hi)/2};
}
function tileConsumptionInfo(p,o={}){
  const r=numericRange(p?.technical?.tiles_per_m2);
  if(!r)return {calculable:false,value:null,min:null,max:null,exact:false,defaulted:false,source:'Consommation fabricant absente'};
  const exact=Math.abs(r.max-r.min)<1e-9;
  if(exact)return {calculable:true,value:r.max,min:r.min,max:r.max,exact:true,defaulted:false,source:p.technical?.tiles_per_m2_source||'Fiche fabricant'};
  const manual=Number(o.tuiles_par_m2_retenu);
  if(Number.isFinite(manual)&&manual>=r.min&&manual<=r.max){
    return {calculable:true,value:manual,min:r.min,max:r.max,exact:false,defaulted:false,source:'Valeur choisie par l’artisan dans la plage fabricant'};
  }
  return {calculable:true,value:r.max,min:r.min,max:r.max,exact:false,defaulted:true,source:'Borne haute de la plage fabricant retenue par défaut'};
}
function product(id){return PRODUCTS.find(p=>p.id===id)}
function manufacturers(){return [...new Set(PRODUCTS.map(p=>p.manufacturer))].sort()}
function products(manufacturer){return PRODUCTS.filter(p=>!manufacturer||p.manufacturer===manufacturer).sort((a,b)=>a.model.localeCompare(b.model,'fr'))}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function findAccessory(p,words){return (p.accessories||[]).find(a=>words.some(w=>norm(a.name).includes(norm(w))))}
function minPitch(p,input){
  const exact=(p.pitch_rules||[]).find(r=>typeof r.min_pitch_percent==='number'&&r.zone===input.context.zone&&r.site===input.context.exposure&&r.screen===input.context.underlay);
  if(exact)return {value:exact.min_pitch_percent,source:'Fiche fabricant',review:false};
  if(typeof p.technical.min_pitch_percent==='number')return {value:p.technical.min_pitch_percent,source:'Fiche fabricant',review:false};
  const dtu=String(p.technical.dtu||'').replace(/\s/g,'');
  if(dtu.includes('40-21')||dtu.includes('40.21')){
    const t={false:{protected:{1:35,2:35,3:50},normal:{1:40,2:50,3:60},exposed:{1:60,2:70,3:80}},true:{protected:{1:30,2:30,3:45},normal:{1:35,2:45,3:50},exposed:{1:50,2:60,3:70}}};
    return {value:t[String(!!input.context.underlay)][input.context.exposure][input.context.zone],source:'DTU 40.21 - contrôle requis',review:true};
  }
  return {value:null,source:'Non déterminée',review:true};
}
function fixRatio(p,input){const pitch=input.geometry.pitch_percent,severe=input.context.exposure==='exposed'||input.context.coastal||input.context.mountain,canal=norm(p.family).includes('canal');if(input.context.high_vibration||pitch>60)return {ratio:1,reason:'Toutes les tuiles fixées - validation fabricant requise'};if(canal){if(pitch<=30&&!severe&&input.context.zone<=2)return {ratio:0,reason:'Partie courante non fixée dans le cas favorable; périphérie fixée'};if(pitch<=40&&!severe)return {ratio:.2,reason:'Provision 1 tuile sur 5'};return {ratio:1/3,reason:'Provision renforcée 1 tuile sur 3'}}return severe||pitch>45?{ratio:1/3,reason:'Provision renforcée'}:{ratio:.2,reason:'Provision courante'} }
function ventCount(area,isolationCase,section){const standard=[[100,6],[150,9],[200,11],[250,14]],high=[[100,10],[150,14],[200,19],[250,24]],arr=Number(isolationCase)===3?high:standard;let ref=arr.find(x=>area<=x[0]);let count=ref?ref[1]:Math.ceil(area*(arr[arr.length-1][1]/arr[arr.length-1][0]));let need=count*35;return {count:Math.ceil(need/Math.max(1,section||35)),requiredAreaCm2:need}}
function item(id,label,category,qty,unit,price,source='Base de démonstration',note='',ref=''){qty=unit==='u'?ceil(qty):round(qty,1);return{id,label,category,quantity:qty,unit,unit_price_ht:round(price,2),total_ht:round(qty*price,2),source,note,product_reference:ref}}
function rateForLinear(p,words,fallback){const a=findAccessory(p,words);return {rate:a?.units_per_linear_m||fallback,ref:a?.reference||'',source:a?.units_per_linear_m?'Fiche fabricant':'Rendement visible à valider'}}
class CouvreurCalculateur{
 async calculer(d){
   if(!d?.metier)throw new Error('Le métier est requis');if(!d?.nom_calcul)throw new Error('Le nom du calcul est requis');if(!d?.options?.complexite)throw new Error('La complexité est requise');
   const o=d.options||{},dm=d.dimensions||{},p=product(o.product_id);if(!p)throw new Error('Sélectionnez un modèle de couverture.');
   const roofArea=Math.max(0,Number(dm.surface_toiture)||0);if(!roofArea)throw new Error('Renseignez la surface de toiture à chiffrer.');
   const input={geometry:{roof_area_m2:roofArea,pitch_percent:Number(dm.pente_pourcent)||0,ridge_length_m:Number(dm.longueur_faitiere)||0,hip_length_m:Number(dm.longueur_aretiers)||0,valley_length_m:Number(dm.longueur_noues)||0,left_rake_length_m:Number(dm.rive_gauche)||0,right_rake_length_m:Number(dm.rive_droite)||0,eaves_length_m:Number(dm.longueur_egout)||0,wall_flashing_length_m:Number(dm.longueur_solin)||0},context:{zone:Number(o.zone)||1,exposure:o.exposition||'normal',underlay:o.ecran_sous_toiture!==false,coastal:!!o.bord_mer,mountain:!!o.montagne,high_vibration:!!o.vibrations,isolation_case:Number(o.cas_isolation)||1},openings:{roof_windows:Number(o.nombre_velux)||0,chimneys:Number(o.nombre_cheminees)||0,vmc_outlets_125:Number(o.sorties_vmc_125)||0,vmc_outlets_160:Number(o.sorties_vmc_160)||0,other_outlets:Number(o.autres_sorties)||0}};
   const items=[],alerts=[],waste=Math.max(0,Number(o.perte_tuiles_pct)||0),tileInfo=tileConsumptionInfo(p,o),tpm=tileInfo.value,bpm=avg(p.technical.battens_linear_m_per_m2),gauge=avg(p.technical.gauge);
   const family=norm(p.family);const tilePrice=family.includes('canal')?PRICE.tile.canal:family.includes('plate')?PRICE.tile.plate:family.includes('petit')?PRICE.tile.petit_moule:family.includes('grand')?PRICE.tile.grand_moule:PRICE.tile.default;
   let tiles=0;if(tpm){tiles=ceil(roofArea*tpm*(1+waste/100));items.push(item('roof_tiles',`${p.manufacturer} ${p.model} — plain carré`,'Couverture',tiles,'u',tilePrice,'Fiche fabricant + prix indicatif',`${tpm} tuiles/m²; perte ${waste}%`))}else alerts.push({level:'blocking',message:'Nombre de tuiles au m² non validé pour ce modèle : poste tuiles bloqué.'});
   if(o.ecran_sous_toiture!==false)items.push(item('underlay','Écran sous-toiture HPV','Sous-toiture',roofArea*(1+(Number(o.perte_ecran_pct)||0)/100),'m²',PRICE.underlay,'Quantité géométrique','Majoration saisie'));
   if(o.demi_liteaux){const ratio=Math.max(0,Number(o.demi_liteaux_ml_m2)||0);if(ratio)items.push(item('counter_battens','Demi-liteaux / contre-liteaux','Sous-toiture',roofArea*ratio,'ml',PRICE.counterBatten,'Ratio saisi par l’artisan',`${ratio} ml/m²`));else alerts.push({level:'warning',message:'Demi-liteaux activés mais ratio ml/m² non renseigné.'})}
   if(o.liteaux!==false){const ratio=bpm||Math.max(0,Number(o.liteaux_ml_m2_manuel)||0);if(ratio)items.push(item('battens','Liteaux','Sous-toiture',roofArea*ratio*1.05,'ml',PRICE.batten,bpm?'Fiche fabricant':'Ratio manuel','+5% de coupe'));else alerts.push({level:'warning',message:'Consommation de liteaux absente : renseignez le ratio manuel.'})}
   if(o.bavette_egout)items.push(item('eaves_apron','Bavette d’égout','Sous-toiture',input.geometry.eaves_length_m,'ml',PRICE.eavesApron));
   const rr=rateForLinear(p,['faîtière','faitiere','faîteau','faiteau'],Math.max(.1,Number(o.faitieres_par_ml)||2.5));const ridgeLen=input.geometry.ridge_length_m+input.geometry.hip_length_m;if(ridgeLen)items.push(item('ridge_hips','Faîtières / arêtiers compatibles','Accessoires',ridgeLen*rr.rate,'u',PRICE.ridge,rr.source,`${rr.rate}/ml`,rr.ref));
   const rak=rateForLinear(p,['rive'],Math.max(.1,Number(o.rives_par_ml)||3));const rakeLen=input.geometry.left_rake_length_m+input.geometry.right_rake_length_m;if(rakeLen)items.push(item('rakes','Rives compatibles','Accessoires',rakeLen*rak.rate,'u',PRICE.rake,rak.source,`${rak.rate}/ml`,rak.ref));
   if(o.closoir&&ridgeLen)items.push(item('closer','Closoir ventilé','Ventilation',ridgeLen,'ml',PRICE.closer,'Quantité géométrique'));
   if(o.peigne_egout&&input.geometry.eaves_length_m)items.push(item('eaves_comb','Peigne d’égout','Accessoires',input.geometry.eaves_length_m,'ml',PRICE.eavesComb));
   if(input.geometry.valley_length_m)items.push(item('valley','Noue métallique','Étanchéité',input.geometry.valley_length_m,'ml',PRICE.valley));
   if(input.geometry.wall_flashing_length_m)items.push(item('flashing','Solin / bande porte-solin','Étanchéité',input.geometry.wall_flashing_length_m,'ml',PRICE.flashing));
   const section=Math.max(1,Number(o.section_chatiere_cm2)||35),vent=ventCount(roofArea,input.context.isolation_case,section);if(o.ventilation_toiture!==false)items.push(item('vent_tiles','Tuiles chatières / ventilation','Ventilation',vent.count,'u',PRICE.ventTile,'Règle ventilation',`${vent.requiredAreaCm2} cm² requis; ${section} cm²/pièce`));
   if(input.openings.vmc_outlets_125)items.push(item('vmc125','Tuiles à douille / sorties VMC Ø125','Ventilation',input.openings.vmc_outlets_125,'u',PRICE.outlet125));if(input.openings.vmc_outlets_160)items.push(item('vmc160','Tuiles à douille / sorties VMC Ø160','Ventilation',input.openings.vmc_outlets_160,'u',PRICE.outlet160));
   if(input.openings.roof_windows)items.push(item('roof_windows','Fenêtres de toit + raccords','Pénétrations',input.openings.roof_windows,'u',PRICE.roofWindow,'Prix indicatif','Les dimensions sont à préciser dans SpeedArti final'));if(input.openings.chimneys)items.push(item('chimneys','Abergements de cheminée','Pénétrations',input.openings.chimneys,'u',PRICE.chimneyFlashing));
   const fixing=fixRatio(p,input);if(tiles&&o.fixations!==false){const periph=ceil((input.geometry.eaves_length_m+rakeLen)/.3),cnt=ceil(tiles*fixing.ratio)+periph;items.push(item('fixings','Crochets / vis / clips de fixation','Fixations',cnt,'u',PRICE.fixing,'Règle provisoire visible',fixing.reason))}
   // Zinguerie - lengths are always explicit, never derived from hidden doubles
   if(o.gouttieres){const gl=Math.max(0,Number(dm.longueur_gouttiere)||0),gt=o.type_gouttiere||'zinc',gp=PRICE.gutter[gt]||PRICE.gutter.zinc,nd=Math.max(0,Number(dm.nombre_descentes)||0),hd=Math.max(0,Number(dm.hauteur_descentes)||0);if(gl){items.push(item('gutter',`Gouttière ${gt}`,'Zinguerie',gl,'ml',gp));items.push(item('gutter_hooks','Crochets de gouttière','Zinguerie',gl/Math.max(.1,Number(o.ecartement_crochets_m)||.5),'u',PRICE.gutterHook,'Entraxe saisi'));items.push(item('gutter_ends','Fonds de gouttière','Zinguerie',Math.max(2,Number(o.nombre_fonds)||2),'u',PRICE.gutterEnd));items.push(item('gutter_joints','Jonctions de gouttière','Zinguerie',Math.max(0,Number(o.nombre_jonctions)||0),'u',PRICE.gutterJoint))}if(nd){items.push(item('gutter_outlet','Naissances','Zinguerie',nd,'u',PRICE.gutterOutlet));items.push(item('downpipes','Descentes EP','Zinguerie',nd*hd,'ml',PRICE.downpipe));items.push(item('elbows','Coudes de descente','Zinguerie',nd*Math.max(0,Number(o.coudes_par_descente)||2),'u',PRICE.elbow));items.push(item('collars','Colliers de descente','Zinguerie',nd*Math.ceil(hd/Math.max(.1,Number(o.ecartement_colliers_m)||1.5)),'u',PRICE.collar));items.push(item('dolphins','Dauphins / raccords bas','Zinguerie',nd,'u',PRICE.dolphin))}}
   if(Number(dm.longueur_cheneau)>0)items.push(item('box_gutter','Chéneau','Zinguerie',dm.longueur_cheneau,'ml',PRICE.boxGutter));if(Number(dm.longueur_planche_rive)>0){const typ=o.type_planche_rive||'bois';items.push(item('fascia',`Planche de rive ${typ}`,'Zinguerie',dm.longueur_planche_rive,'ml',PRICE.fascia[typ]||PRICE.fascia.bois))}
   // Safety explicit dimensions
   if(o.echafaudage){const area=Math.max(0,Number(dm.longueur_echafaudage)||0)*Math.max(0,Number(dm.hauteur_echafaudage)||0);if(area)items.push(item('scaffold','Échafaudage de façade','Sécurité',area,'m²',PRICE.scaffold,'Dimensions saisies'));else alerts.push({level:'warning',message:'Échafaudage activé : renseignez longueur et hauteur.'})}
   if(o.ligne_vie)items.push(item('lifeline','Ligne de vie temporaire','Sécurité',1,'u',PRICE.lifeline));if(o.garde_corps&&Number(dm.longueur_garde_corps)>0)items.push(item('guardrail','Garde-corps périphériques','Sécurité',dm.longueur_garde_corps,'ml',PRICE.guardrail));if(o.filets&&Number(dm.surface_filets)>0)items.push(item('nets','Filets antichute','Sécurité',dm.surface_filets,'m²',PRICE.safetyNet));if(o.echelle_toit)items.push(item('roof_ladder','Échelle de toit','Sécurité',Math.max(1,Number(o.nombre_echelles)||1),'u',PRICE.roofLadder));if(o.monte_materiaux)items.push(item('lift','Monte-matériaux','Sécurité',1,'u',PRICE.materialLift));if(Number(o.nombre_ancrages)>0)items.push(item('anchors','Points d’ancrage','Sécurité',o.nombre_ancrages,'u',PRICE.anchor));
   // Allow manual unit price overrides
   const mult=Math.max(.01,Number(o.coefficient_prix)||1)*(1+Math.max(0,Number(o.marge_materiaux_pct)||0)/100);items.forEach(x=>{const manual=d.manualPrices?.[x.id];x.unit_price_ht=round(manual!==undefined?Number(manual):x.unit_price_ht*mult,2);x.total_ht=round(x.quantity*x.unit_price_ht,2)});
   const mp=minPitch(p,input);if(mp.value!==null){if(input.geometry.pitch_percent<mp.value)alerts.push({level:'blocking',message:`Pente insuffisante : ${input.geometry.pitch_percent}% pour un minimum de ${mp.value}% (${mp.source}).`});else alerts.push({level:mp.review?'warning':'ok',message:`Pente : ${input.geometry.pitch_percent}% ≥ ${mp.value}% (${mp.source}).`})}else alerts.push({level:'warning',message:'Pente minimale non déterminée automatiquement pour ce modèle : contrôle fabricant requis.'});
   if(p.validation?.status!=='validated_core')alerts.push({level:'warning',message:`Fiche ${p.model} partielle : certaines données nécessitent une validation humaine avant usage production.`});
   // Labor: visible rates, no hidden topology lengths
   const cm={simple:.9,moyenne:1,complexe:1.25}[o.complexite]||1;const prep=roofArea*Math.max(0,Number(o.mo_preparation_h_m2)||.04),sub=(o.ecran_sous_toiture!==false||o.demi_liteaux||o.liteaux!==false)?roofArea*Math.max(0,Number(o.mo_sous_toiture_h_m2)||.08):0,lay=roofArea*Math.max(0,Number(o.mo_couverture_h_m2)||.16),lin=(ridgeLen+rakeLen+input.geometry.valley_length_m+input.geometry.eaves_length_m+input.geometry.wall_flashing_length_m)*Math.max(0,Number(o.mo_accessoires_h_ml)||.12),pen=(input.openings.roof_windows+input.openings.chimneys+input.openings.vmc_outlets_125+input.openings.vmc_outlets_160+input.openings.other_outlets)*Math.max(0,Number(o.mo_penetration_h_u)||1.5),gut=o.gouttieres?Math.max(0,Number(dm.longueur_gouttiere)||0)*Math.max(0,Number(o.mo_gouttiere_h_ml)||.18):0,safe=(o.echafaudage?Math.max(0,Number(o.mo_echafaudage_h)||8):0)+(o.ligne_vie?Math.max(0,Number(o.mo_ligne_vie_h)||2):0);const decomp=[['Préparation et calepinage',prep],['Écran, demi-liteaux et liteaux',sub],['Pose couverture',lay],['Accessoires linéaires',lin],['Pénétrations et sorties',pen],['Gouttières et descentes',gut],['Mise en sécurité',safe]].filter(x=>x[1]>0).map(x=>({poste:x[0],temps_heures:round(x[1]*cm,1)}));const totalHH=round(decomp.reduce((s,x)=>s+x.temps_heures,0),1),workers=Math.max(1,Number(o.nb_ouvriers)||1),duration=round(totalHH/workers,1),labor=round(totalHH*Math.max(0,Number(o.taux_horaire)||48),2);
   const material=round(items.reduce((s,x)=>s+x.total_ht,0),2),security=round(items.filter(x=>x.category==='Sécurité').reduce((s,x)=>s+x.total_ht,0),2),total=round(material+labor,2),vatRate=Math.max(0,Number(o.taux_tva)||20),vat=round(total*vatRate/100,2);
   return {product:p,input,surfaces:{totale:roofArea,nette:roofArea,avec_pertes:round(roofArea*(1+waste/100),2),detail_par_face:{toiture:roofArea}},materiaux:items,main_oeuvre:{temps_estime_heures:duration,heures_homme:totalHH,decomposition:decomp,taux_horaire:Number(o.taux_horaire)||48,nombre_ouvriers:workers,cout_total:labor},totaux:{materiaux_ht:material,securite_ht:security,main_oeuvre_ht:labor,total_ht:total,tva:vat,total_ttc:round(total+vat,2)},stock_status:{disponible:true,articles_manquants:[]},recommandations:[`Modèle : ${p.manufacturer} ${p.model}`,`Fixation : ${fixing.reason}`,`Ventilation : ${vent.count} chatière(s) calculée(s)`],alertes:alerts,technical:{tiles_per_m2:tpm||null,battens_ml_m2:bpm||null,gauge_mm:gauge||null,min_pitch:mp.value,validation:p.validation?.status||'unknown'}};
 }
}
window.SpeedArtiCouvreurReal={CouvreurCalculateur,roofProducts:PRODUCTS,listManufacturers:manufacturers,listProducts:products,version:'0.1.0'};
})();
