/**
 * SpeedArti — Démo Électricien
 * Base: module Electricien existant SpeedArti.
 * Corrections: réponses Guillaume + annexes du questionnaire.
 * Mise à jour V6.1 : fiabilisation globale des prix, protections, rénovation et équipements fabricant. Contrôles d’audit internes non affichés.
 * Les quantités métier Guillaume restent inchangées ; seule la référence/prix d'appareillage sélectionnée pilote le matériel.
 */
(function(){
  const CS=window.ElectricienCatalogueSelector;
  const ROOM_PROFILES = {
    garage:      {label:"Garage", sockets:2, simple:0, vv:1, three:0, tv:0, rj45:0, special20:0, special32:0},
    escalier:    {label:"Cage escalier", sockets:1, simple:0, vv:1, three:0, extraLight:1, tv:0, rj45:0, special20:0, special32:0},
    palier:      {label:"Palier", sockets:1, simple:0, vv:1, three:0, tv:0, rj45:0, special20:0, special32:0},
    sas:         {label:"Sas", sockets:1, simple:0, vv:1, three:0, tv:0, rj45:0, special20:0, special32:0},
    tone:        {label:"T-One", sockets:0, simple:1, vv:0, three:0, tv:0, rj45:0, special20:0, special32:0},
    cave:        {label:"Cave", sockets:0, simple:1, vv:0, three:0, tv:0, rj45:0, special20:0, special32:0},
    hall:        {label:"Hall", sockets:1, simple:1, vv:0, three:0, tv:0, rj45:0, special20:0, special32:0},
    vestibule:   {label:"Vestibule", sockets:0, simple:0, vv:0, three:0, tv:0, rj45:0, special20:0, special32:0},
    wc:          {label:"WC", sockets:0, simple:1, vv:0, three:0, tv:0, rj45:0, special20:0, special32:0},
    wcHand:      {label:"WC PMR", sockets:1, simple:1, vv:0, three:0, tv:0, rj45:0, special20:0, special32:0},
    buanderie:   {label:"Buanderie", sockets:1, simple:1, vv:0, three:0, tv:0, rj45:0, special20:1, special32:0},
    cellier:     {label:"Cellier", sockets:1, simple:1, vv:0, three:0, tv:0, rj45:0, special20:1, special32:0},
    cuisine:     {label:"Cuisine", sockets:6, simple:1, vv:0, three:0, tv:1, rj45:0, special20:2, special32:1},
    sejour:      {label:"Espace de vie", sockets:7, simple:0, vv:1, three:1, tv:1, rj45:1, special20:0, special32:0},
    suite:       {label:"Suite parentale", sockets:3, simple:0, vv:1, three:0, tv:1, rj45:1, special20:0, special32:0},
    dressing:    {label:"Dressing", sockets:1, simple:1, vv:0, three:0, tv:0, rj45:0, special20:0, special32:0},
    sde:         {label:"Salle d'eau", sockets:1, simple:2, vv:0, three:0, tv:0, rj45:0, special20:0, special32:0},
    degagement:  {label:"Dégagement", sockets:1, simple:0, vv:1, three:0, tv:0, rj45:0, special20:0, special32:0},
    chambre:     {label:"Chambre", sockets:3, simple:1, vv:0, three:0, tv:1, rj45:1, special20:0, special32:0},
    bureau:      {label:"Bureau", sockets:3, simple:1, vv:0, three:0, tv:1, rj45:1, special20:0, special32:0},
    sdb:         {label:"Salle de bains", sockets:1, simple:2, vv:0, three:0, tv:0, rj45:0, special20:0, special32:0}
  };

  const HEATING = [
    {max:2250, section:1.5, breaker:10},
    {max:4500, section:2.5, breaker:20},
    {max:5750, section:4, breaker:25},
    {max:7250, section:6, breaker:32}
  ];

  const SOMFY = {
    tahoma: {label:"TaHoma Switch", material:150, hours:.5},
    izymo: {label:"Micro-module Izymo io", material:70, hours:.75},
    izymoProg: {label:"Izymo io + programmation TaHoma", material:70, hours:1},
    alarm: {label:"Home Alarm Essential", material:450, hours:2},
    outdoorCam: {label:"Somfy Outdoor Camera", material:200, hours:1.5},
    indoorCam: {label:"Somfy Indoor Camera", material:130, hours:1},
    visioSomfy: {label:"Visiophone V350/V500 Connect", material:400, hours:2.5},
    connectedLight: {label:"Récepteur/commande éclairage Somfy", material:90, hours:1},
    zigbee: {label:"Prise Zigbee Somfy", material:42, hours:.25},
    ioPlug: {label:"Prise ON/OFF io", material:62, hours:.25},
    programming: {label:"Programmation TaHoma", material:0, hours:1}
  };

  const FIXED = {
    bell: {carillon:170, visio:500, visioGate:750},
    vmc: {auto:600, hygro:800, double:3500, extraMouth:115, roof:90}
  };

  // Synthèse Guillaume modifiée — Annexe 1 : métrés moyens par élément et tranche de surface.
  const LENGTH_RATIOS = [
    {max:60, label:"≤ 60 m²", prise:2.75, eclairage:5.50, interrupteur:3.30, rj45:8.80, tv:8.80, volet:8.80, vmc:6.60, special:13.20},
    {max:80, label:"61 à 80 m²", prise:2.97, eclairage:6.05, interrupteur:3.52, rj45:9.90, tv:9.90, volet:9.90, vmc:7.70, special:14.30},
    {max:100,label:"81 à 100 m²", prise:3.30, eclairage:6.60, interrupteur:3.85, rj45:11.00,tv:11.00,volet:11.00,vmc:8.80, special:16.50},
    {max:120,label:"101 à 120 m²",prise:3.52, eclairage:7.15, interrupteur:4.07, rj45:12.10,tv:12.10,volet:12.10,vmc:8.80, special:17.60},
    {max:150,label:"121 à 150 m²",prise:3.85, eclairage:7.70, interrupteur:4.40, rj45:13.20,tv:13.20,volet:13.20,vmc:9.90, special:18.70},
    {max:180,label:"151 à 180 m²",prise:4.18, eclairage:8.25, interrupteur:4.73, rj45:14.30,tv:14.30,volet:14.30,vmc:11.00,special:19.80},
    {max:220,label:"181 à 220 m²",prise:4.40, eclairage:8.80, interrupteur:4.95, rj45:15.40,tv:15.40,volet:15.40,vmc:11.00,special:22.00},
    {max:Infinity,label:"> 220 m²",prise:4.95, eclairage:9.90, interrupteur:5.50, rj45:16.50,tv:16.50,volet:16.50,vmc:13.20,special:24.20}
  ];

  // Annexe 2 : coefficient général chantier.
  const DIFFICULTY = { simple:0.80, moyenne:1.00, complexe:1.25 };

  // Annexe 3 : temps de tableau électrique.
  // Pour un nombre intermédiaire de circuits, la démo applique le palier supérieur afin de ne pas sous-chiffrer.
  const TABLEAU_HOURS = [
    {circuits:8, mono:4.5, tri:6.0},
    {circuits:12,mono:5.5, tri:7.5},
    {circuits:16,mono:7.0, tri:9.0},
    {circuits:20,mono:8.5, tri:11.0},
    {circuits:24,mono:10.0,tri:13.0},
    {circuits:28,mono:11.5,tri:14.5},
    {circuits:32,mono:13.0,tri:16.0},
    {circuits:36,mono:14.5,tri:18.0},
    {circuits:40,mono:16.0,tri:19.5}
  ];

  const CONTROL_FIXED_PRICE = 150;

  // Base de prix SpeedArti retrouvée sur le Drive — catalogueIntegration.ts / PRIX_MARCHE_DEFAUT.
  // Prix HT. On ne complète pas cette table avec des valeurs supposées.
  const CATALOGUE_PRICES = {
    gaine_icta:               {price:1.20, unit:"ml"},
    gaine_icta_25:            {price:1.50, unit:"ml"},
    gaine_icta_32:            {price:2.00, unit:"ml"},
    cable_1_5mm2:             {price:0.80, unit:"ml"},
    cable_electrique:         {price:1.50, unit:"ml"},
    cable_6mm2:               {price:3.50, unit:"ml"},
    cable_10mm2:              {price:5.50, unit:"ml"},
    // Compléments prix moyens Internet — septembre 2026, uniquement références absentes de la base Drive.
    // Méthode : moyenne arithmétique de produits comparables, prix convertis en HT (TVA 20 % quand source TTC).
    cable_4mm2:               {price:0.82, unit:"ml", source:"Prix moyen Internet 2026 — 4 fournisseurs"},
    cable_rj45_cat6:          {price:0.65, unit:"ml", source:"Prix moyen Internet 2026 — 4 fournisseurs"},
    cable_coax_tv_17vatc:     {price:0.22, unit:"ml", source:"Prix moyen Internet 2026 — 5 fournisseurs"},
    prise_rj45_cat6:          {price:13.13, unit:"u", source:"Prix moyen Internet 2026 — 4 offres complètes"},
    prise_tv:                 {price:9.29, unit:"u", source:"Prix moyen Internet 2026 — 4 offres complètes"},
    coffret_communication_g2: {price:79.17, unit:"u", source:"Prix moyen Internet 2026 — même référence Schneider chez 3 fournisseurs"},
    prise_electrique:         {price:8.50, unit:"u"},
    disjoncteur:              {price:12.00, unit:"u"},
    disjoncteur_2a:           {price:14.52, unit:"u", source:"Prix moyen Schneider/Hager/Legrand 2026"},
    disjoncteur_10a:          {price:7.60, unit:"u", source:"Prix moyen Schneider/Hager/Legrand 2026"},
    disjoncteur_16a:          {price:7.45, unit:"u", source:"Prix moyen Schneider/Hager/Legrand 2026"},
    disjoncteur_20a:          {price:8.15, unit:"u", source:"Prix moyen Schneider/Hager/Legrand 2026"},
    disjoncteur_25a:          {price:14.80, unit:"u", source:"Prix moyen Schneider/Hager/Legrand 2026"},
    disjoncteur_32a:          {price:10.50, unit:"u", source:"Prix moyen Schneider/Hager/Legrand 2026"},
    contacteur_jn:            {price:54.39, unit:"u", source:"Prix moyen Schneider/Hager/Legrand 2026"},
    tableau_electrique:       {price:120.00, unit:"u"},
    interrupteur:             {price:7.00, unit:"u"},
    spot_led:                 {price:15.00, unit:"u"},
    differentiel_30ma_type_a: {price:45.00, unit:"u"},
    differentiel_30ma_type_ac:{price:35.00, unit:"u"},
    boite_encastrement:       {price:0.80, unit:"u"},
    parafoudre_type2:         {price:85.00, unit:"u"},
    piquet_terre:             {price:25.00, unit:"u"},
    cable_terre_25mm2:        {price:4.50, unit:"ml"},
    borne_ve_7kw:             {price:850.00, unit:"u"},
    borne_ve_22kw:            {price:1800.00, unit:"u"}
  };

  function catalogueMaterial(articleId, category, name, qty, unit, note=""){
    const q=Math.max(0,n(qty));
    const ref=CATALOGUE_PRICES[articleId];
    const price=ref ? ref.price : null;
    return {
      articleId, category, name, qty:q, unit, price,
      total: price===null ? null : Math.round(q*price*100)/100,
      source: price===null ? "Référence absente des bases prix" : (ref.source || "Base prix SpeedArti — Drive"),
      note
    };
  }

  function configuredMaterial(state,familyKey,category,baseName,qty,fallbackArticleId,alerts,note=""){
    const q=Math.max(0,n(qty));
    if(!q) return null;
    const resolved=CS && CS.resolve ? CS.resolve(state,familyKey) : null;
    if(resolved && resolved.price!=null && !resolved.partial){
      const ref=resolved.ref ? `Réf. ${resolved.ref}` : "Prix moyen catalogue";
      if(!resolved.exact){
        const cfg=state?.appareillage?.families?.[familyKey];
        if(resolved.partial){
          alerts.push(`${baseName} : composition catalogue incomplète pour ${resolved.brand}${resolved.gamme?` / ${resolved.gamme}`:""}. Le prix affiché ne couvre que les composants présents dans la base de démo.`);
        } else if(cfg && cfg.brand && cfg.brand!=="moyen") {
          alerts.push(`${baseName} : aucun modèle exact sélectionné, moyenne ${resolved.brand}${resolved.gamme?` / ${resolved.gamme}`:""} appliquée.`);
        }
      }
      return {
        articleId:`catalogue:${familyKey}:${resolved.id||"average"}`, category,
        name:`${baseName} — ${resolved.label||resolved.brand||"Catalogue"}`, qty:q, unit:"u",
        price:resolved.price,total:Math.round(q*resolved.price*100)/100,
        source:resolved.source||"Catalogue appareillage multi-gammes 2026",
        note:[ref,resolved.note,note].filter(Boolean).join(" · ")
      };
    }
    // Un modèle double/triple, volet, VMC ou extérieur ne reprend jamais un PU d'une autre fonction.
    const compatibleFallback=["priseSimple","interrupteur","rj45","tv"].includes(familyKey);
    return catalogueMaterial(compatibleFallback?fallbackArticleId:null,category,baseName,q,"u",
      [note,"Référence ou composition compatible indisponible : prix non chiffré."].filter(Boolean).join(" · "));
  }

  function n(v){ const x=Number(v); return Number.isFinite(x)?x:0; }
  function ceilDiv(a,b){ return b>0 ? Math.ceil(a/b) : 0; }
  function pushMany(arr, count, factory){ for(let i=0;i<count;i++) arr.push(factory(i)); }

  function lengthProfileForSurface(surface){
    const s=Math.max(0,n(surface));
    return LENGTH_RATIOS.find(x=>s<=x.max) || LENGTH_RATIOS[LENGTH_RATIOS.length-1];
  }

  function tableauHoursFor(circuitCount, phase, blockers){
    const count=Math.max(0,n(circuitCount));
    const row=TABLEAU_HOURS.find(x=>count<=x.circuits);
    if(!row){
      blockers.push(`Tableau ${count} circuits : l'annexe 3 s'arrête à 40 circuits. Temps tableau à valider manuellement.`);
      return null;
    }
    return {hours:phase==="triphase"?row.tri:row.mono, bracket:row.circuits};
  }

  function computeAutoPoints(state){
    const rooms=state.rooms||{};
    let generalSockets=0, kitchenSockets=0, simple=0, vv=0, three=0, extraLight=0;
    let tv=0, rjFromProfiles=0, autoSpecial20=0, autoSpecial32=0;
    Object.entries(ROOM_PROFILES).forEach(([key,p])=>{
      const count=n(rooms[key]);
      if(!count) return;
      let sockets=p.sockets||0;
      if(key==="sejour"){
        const surf=n(rooms.sejourSurface);
        sockets = surf>0 && surf<28 ? 5 : 7; // annexe 2
      }
      if(key==="cuisine"){
        const surf=n(rooms.cuisineSurface);
        sockets = surf>0 && surf<4 ? 3 : 6; // annexe 2
        kitchenSockets += sockets*count;
      } else {
        generalSockets += sockets*count;
      }
      simple += (p.simple||0)*count;
      vv += (p.vv||0)*count;
      three += (p.three||0)*count;
      extraLight += (p.extraLight||0)*count;
      tv += (p.tv||0)*count;
      rjFromProfiles += (p.rj45||0)*count;
      autoSpecial20 += (p.special20||0)*count;
      autoSpecial32 += (p.special32||0)*count;
    });

    // Annexe 2 : +2 prises près des prises de communication, en priorité dans le séjour.
    const multimediaSockets = n(rooms.sejour)>0 ? 2 : 0;
    generalSockets += multimediaSockets;

    // Annexe 2 RJ45 : T1=2, T2=3, T3+=4. 2 juxtaposées dans le séjour.
    const principalRooms = Math.max(1, n(rooms.sejour)+n(rooms.suite)+n(rooms.chambre)+n(rooms.bureau));
    const rjNorm = principalRooms<=1 ? 2 : principalRooms===2 ? 3 : 4;
    const rj45 = Math.max(rjFromProfiles, rjNorm);

    const lightPoints = simple + vv + three + extraLight;
    const switches = simple + (vv*2) + (three*3);

    return {
      generalSockets, kitchenSockets, multimediaSockets,
      lightPoints, switches, simple, vv, three, extraLight,
      rj45, tv, autoSpecial20, autoSpecial32,
      communicationCabinet: (rj45+tv)>0 ? 1 : 0,
      principalRooms
    };
  }

  function effectivePoints(state){
    const a=computeAutoPoints(state), o=state.pointOverrides||{};
    const val=(key,auto)=> o[key]===null || o[key]===undefined || o[key]==="" ? auto : n(o[key]);
    const out={...a,generalSockets:val("generalSockets",a.generalSockets),kitchenSockets:val("kitchenSockets",a.kitchenSockets),lightPoints:val("lightPoints",a.lightPoints),switches:val("switches",a.switches),rj45:val("rj45",a.rj45),tv:val("tv",a.tv)};
    out.communicationCabinet=(out.rj45+out.tv)>0 ? 1 : 0;
    return out;
  }

  function buildCircuits(state, points, alerts, blockers){
    const circuits=[];
    const phase=state.installation.phase||"monophase";
    const socketMode=state.circuits.socketMode||"2.5_20";
    const socketCfg = socketMode==="1.5_16"
      ? {section:1.5, breaker:16, max:8}
      : {section:2.5, breaker:20, max:12};

    pushMany(circuits, ceilDiv(points.generalSockets,socketCfg.max), i=>({
      name:`Prises générales ${i+1}`, type:"prises", section:socketCfg.section, breaker:socketCfg.breaker,
      diff:"AC/A", supply:"mono", points:Math.min(socketCfg.max,Math.max(0,points.generalSockets-i*socketCfg.max))
    }));
    pushMany(circuits, ceilDiv(points.kitchenSockets,6), i=>({
      name:`Prises cuisine ${i+1}`, type:"cuisine", section:2.5, breaker:20, diff:"AC/A",
      supply:"mono", points:Math.min(6,Math.max(0,points.kitchenSockets-i*6))
    }));
    pushMany(circuits, ceilDiv(points.lightPoints,8), i=>({
      name:`Éclairage ${i+1}`, type:"eclairage", section:1.5, breaker:16, diff:"AC/A",
      supply:"mono", points:Math.min(8,Math.max(0,points.lightPoints-i*8))
    }));

    // Besoins spécialisés issus de l'annexe 1, sans inventer l'équipement exact.
    pushMany(circuits, points.autoSpecial20, i=>({
      name:`Circuit spécialisé 20A annexe pièce ${i+1}`, type:"special", section:2.5, breaker:20,
      diff:"AC/A", supply:"mono", points:1
    }));
    pushMany(circuits, points.autoSpecial32, i=>({
      name:`Circuit spécialisé 32A annexe pièce ${i+1}`, type:"special", section:6, breaker:32,
      diff:"A", supply:"mono", points:1
    }));

    const c=state.circuits||{};
    const dedicated = [
      ["four","Four",2.5,20,"AC/A"],
      ["laveLinge","Lave-linge",2.5,20,"A"],
      ["laveVaisselle","Lave-vaisselle",2.5,20,"AC/A"],
      ["secheLinge","Sèche-linge",2.5,20,"AC/A"],
      ["chauffeEau","Chauffe-eau",2.5,20,"AC/A"],
      ["congelateur","Congélateur",2.5,20,"AC/A/F recommandé"],
      ["priseGTL","Prise GTL",2.5,20,"AC/A"]
    ];
    dedicated.forEach(([key,label,section,breaker,diff])=>{
      if(c[key]) circuits.push({name:label,type:"special",section,breaker,diff,supply:"mono",points:1});
    });

    if(c.volets>0){
      circuits.push({name:"Volets roulants",type:"special",section:1.5,breaker:16,diff:"AC/A",supply:"mono",points:n(c.volets)});
    }
    if(c.vmcType && c.vmcType!=="none"){
      circuits.push({name:"VMC",type:"vmc",section:1.5,breaker:2,diff:"AC/A",supply:"mono",points:1});
    }

    const heatingPower=n(c.heatingPower);
    if(heatingPower>0){
      const cfg=HEATING.find(x=>heatingPower<=x.max);
      if(cfg){
        circuits.push({name:`Chauffage ${heatingPower} W`,type:"chauffage",section:cfg.section,breaker:cfg.breaker,diff:"AC/A",supply:"mono",points:1});
      } else {
        blockers.push("Chauffage > 7 250 W : étude adaptée requise (10 mm² / 40-50 A selon installation).");
      }
    }

    function manualCircuit(flag,key,label,diffDefault){
      if(!flag) return;
      const m=c[key]||{};
      if(!n(m.section)||!n(m.breaker)){
        blockers.push(`${label} : section et protection à saisir selon fabricant.`);
        return;
      }
      circuits.push({
        name:label,type:"manual",section:n(m.section),breaker:n(m.breaker),
        diff:m.diff||diffDefault||"Selon fabricant", supply:m.supply||"mono", points:1, manual:true,
        equipmentPrice:n(m.materialPrice), equipmentLabel:m.materialLabel||label,route:n(m.route)
      });
    }
    manualCircuit(c.pac,"pacManual","PAC","F selon configuration");
    manualCircuit(c.clim,"climManual","Climatisation","F selon configuration");
    manualCircuit(c.gainable,"gainableManual","Gainable","Selon fabricant");
    manualCircuit(c.tone,"toneManual","T.One","Selon fabricant");
    manualCircuit(c.irve,"irveManual","IRVE","Selon borne");
    manualCircuit(c.pv,"pvManual","Raccordement photovoltaïque","Selon étude");

    if(n(c.exteriorLights)>0 || n(c.exteriorSockets)>0){
      alerts.push("Éclairage / prises extérieurs : quantités prises en compte, mais règle de protection extérieure non fournie dans les annexes — validation requise avant commande.");
    }

    if(phase==="triphase"){
      let leg=0;
      circuits.forEach(ci=>{
        if(ci.supply==="3P") ci.phase="L1/L2/L3";
        else { ci.phase=["L1","L2","L3"][leg%3]; leg++; }
      });
      alerts.push("Triphasé : circuits monophasés répartis sur L1/L2/L3. Le temps du tableau est calculé avec l’annexe 3 Guillaume.");
    } else {
      circuits.forEach(ci=>ci.phase="L1");
    }
    return circuits;
  }

  function computeMaterials(state, points, circuits, tableau, alerts, blockers){
    const materials=[];
    const isReno=state.installation.type==="renovation";
    const reno=state.renovation||{};
    const renoQty=(key,act)=>Math.max(0,n(reno[key]?.[act]));
    const purchased=key=>renoQty(key,"replace")+renoQty(key,"create");
    const measured=key=>Math.max(0,n(reno.routes?.[key]));
    const billed=isReno?{...points,generalSockets:purchased("prises"),kitchenSockets:0,
      switches:purchased("interrupteurs"),lightPoints:purchased("luminaires"),
      rj45:purchased("rj45"),tv:purchased("tv")}:points;
    const profile=lengthProfileForSurface(state.installation.surface);
    const sectionMeters={};
    const gaineMeters={gaine_icta:0,gaine_icta_25:0,gaine_icta_32:0};

    function addH07(section, route, label, gaineKey){
      if(route<=0) return;
      // Réponse Guillaume Q14 : phase + neutre + terre = 3 fois le parcours.
      sectionMeters[section]=(sectionMeters[section]||0)+(route*3);
      if(gaineKey) gaineMeters[gaineKey]=(gaineMeters[gaineKey]||0)+route;
      alerts.push(`${label} : métrage automatique ${profile.label} appliqué.`);
    }
    function addCable(name, route, section, note, gaineKey="gaine_icta_32"){
      if(route<=0) return;
      let articleId=null;
      if(Number(section)===4) articleId="cable_4mm2";
      if(Number(section)===6) articleId="cable_6mm2";
      if(Number(section)===10) articleId="cable_10mm2";
      materials.push(catalogueMaterial(articleId, "Câblage", name, Math.ceil(route), "ml", note));
      if(gaineKey) gaineMeters[gaineKey]=(gaineMeters[gaineKey]||0)+route;
    }

    const c=state.circuits||{};
    const socketSection=(c.socketMode||"2.5_20")==="1.5_16" ? 1.5 : 2.5;

    // Annexe 1 : longueur moyenne par unité selon la surface.
    // Diamètres ICTA repris de la logique déjà présente dans l'Électricien SpeedArti :
    // Ø20 éclairage/commandes, Ø25 prises, Ø32 spécialisés.
    if(!isReno){
      addH07(socketSection,points.generalSockets*profile.prise,"Prises générales","gaine_icta_25");
      addH07(2.5,points.kitchenSockets*profile.prise,"Prises cuisine","gaine_icta_25");
      addH07(1.5,points.lightPoints*profile.eclairage,"Éclairage","gaine_icta");
      addH07(1.5,points.switches*profile.interrupteur,"Interrupteurs / commandes","gaine_icta");
    }else{
      addH07(socketSection,measured("prises"),"Prises rénovées","gaine_icta_25");
      addH07(1.5,measured("luminaires"),"Éclairage rénové","gaine_icta");
      addH07(1.5,measured("interrupteurs"),"Commandes rénovées","gaine_icta");
    }

    // Communication : ratios Guillaume + prix moyens Internet 2026 uniquement pour les références absentes du Drive.
    const rjRoute=isReno?measured("rj45"):points.rj45*profile.rj45;
    const tvRoute=isReno?measured("tv"):points.tv*profile.tv;
    if(rjRoute>0)materials.push(catalogueMaterial("cable_rj45_cat6","Communication","Câble communication RJ45 Cat.6 F/UTP",Math.ceil(rjRoute),"ml",isReno?"Parcours mesuré":"Ratio "+profile.label));
    if(tvRoute>0)materials.push(catalogueMaterial("cable_coax_tv_17vatc","Communication","Câble TV coaxial 17VATC",Math.ceil(tvRoute),"ml",isReno?"Parcours mesuré":"Ratio "+profile.label));

    if(n(c.volets)>0) addH07(1.5, n(c.volets)*profile.volet, "Volets roulants", "gaine_icta");
    if(c.vmcType && c.vmcType!=="none") addH07(1.5, profile.vmc, "VMC", "gaine_icta");

    // Circuits spécialisés : l'annexe donne un métrage par circuit.
    const specialized=circuits.filter(ci=>!["prises","cuisine","eclairage","vmc"].includes(ci.type) && ci.name!=="Volets roulants");
    specialized.forEach(ci=>{
      if(isReno&&!ci.manual)return;
      const route=ci.manual?Math.max(0,n(ci.route)):profile.special;
      if(ci.manual&&route===0)blockers.push(ci.name+" : longueur réelle du câble d'alimentation à renseigner.");
      if(ci.supply==="3P"){
        materials.push(catalogueMaterial(null,"Câblage",`Câble triphasé circuit ${ci.name} — ${ci.section} mm²`,Math.ceil(route),"ml","Nombre de conducteurs et référence à confirmer selon appareil / fabricant."));
        blockers.push(`${ci.name} triphasé : câble exact à confirmer selon fabricant.`);
      }else if(ci.section===1.5 || ci.section===2.5){
        addH07(ci.section, route, ci.name, "gaine_icta_32");
      }else{
        addCable(`Câble circuit ${ci.name} — ${ci.section} mm²`, route, ci.section, `Ratio circuit spécialisé ${profile.label}`);
      }
      if(ci.manual && ci.equipmentPrice>0){
        materials.push({articleId:`manual-equipment:${ci.name}`,category:"Équipement fabricant",name:ci.equipmentLabel||ci.name,qty:1,unit:"u",price:ci.equipmentPrice,total:ci.equipmentPrice,source:"Prix saisi par l'artisan",note:"Équipement fabricant / modèle à conserver dans le devis."});
      }
    });

    Object.entries(sectionMeters).forEach(([section,qty])=>{
      const articleId=Number(section)===1.5 ? "cable_1_5mm2" : Number(section)===2.5 ? "cable_electrique" : null;
      materials.push(catalogueMaterial(
        articleId,"Câblage",`Conducteurs H07VU ${section} mm²`,Math.ceil(qty),"ml",
        `Annexe 1 ${profile.label} + règle phase/neutre/terre ×3. Les conducteurs spécifiques constructeur restent selon appareil.`
      ));
    });

    const gaineLabels={gaine_icta:"Gaine ICTA Ø20",gaine_icta_25:"Gaine ICTA Ø25",gaine_icta_32:"Gaine ICTA Ø32"};
    Object.entries(gaineMeters).forEach(([articleId,qty])=>{
      if(qty>0) materials.push(catalogueMaterial(articleId,"Gaines",gaineLabels[articleId],Math.ceil(qty),"ml",`Métré issu des ratios Guillaume ${profile.label}. Aucune marge supplémentaire.`));
    });

    // Appareillage V5 : la quantité métier reste issue de Guillaume, mais le prix/référence vient
    // du choix indépendant de l'artisan (marque → gamme → modèle / finition).
    const totalSockets=points.generalSockets+points.kitchenSockets;
    const socketDist=CS && CS.socketDistribution ? CS.socketDistribution(state,totalSockets) : {simple:totalSockets,double:0,triple:0,valid:true};
    if(!socketDist.valid) blockers.push(`Répartition prises invalide : les blocs doubles/triples représentent plus de ${totalSockets} prises.`);
    if(socketDist.simple>0){ const m=configuredMaterial(state,"priseSimple","Appareillage","Prise 16A 2P+T simple",socketDist.simple,"prise_electrique",alerts); if(m) materials.push(m); }
    if(socketDist.double>0){ const m=configuredMaterial(state,"priseDouble","Appareillage","Bloc prise double 2P+T",socketDist.double,"prise_electrique",alerts,"Un bloc double représente 2 prises normatives."); if(m) materials.push(m); }
    if(socketDist.triple>0){ const m=configuredMaterial(state,"priseTriple","Appareillage","Bloc prise triple 2P+T",socketDist.triple,"prise_electrique",alerts,"Un bloc triple représente 3 prises normatives."); if(m) materials.push(m); }
    if(points.switches>0){ const m=configuredMaterial(state,"interrupteur","Appareillage","Interrupteurs / commandes",points.switches,"interrupteur",alerts); if(m) materials.push(m); }

    const nbBoites=points.generalSockets+points.kitchenSockets+points.switches+points.lightPoints;
    if(nbBoites>0) materials.push(catalogueMaterial("boite_encastrement","Appareillage","Boîtes d'encastrement Ø67",nbBoites,"u","Quantité conservée de la logique Électricien existante ; la répartition multi-postes n'altère pas encore ce calcul de validation."));

    // Communication : même principe, choix indépendant par famille.
    if(points.rj45>0){ const m=configuredMaterial(state,"rj45","Communication","Prises RJ45",points.rj45,"prise_rj45_cat6",alerts); if(m) materials.push(m); }
    if(points.tv>0){ const m=configuredMaterial(state,"tv","Communication","Prises TV / antenne",points.tv,"prise_tv",alerts); if(m) materials.push(m); }
    if(points.communicationCabinet) materials.push(catalogueMaterial("coffret_communication_g2","Communication","Coffret de communication Grade 2TV - 4 RJ45",1,"u"));

    if(n(c.volets)>0){ const m=configuredMaterial(state,"volet","Appareillage","Commandes volets roulants",n(c.volets),"interrupteur",alerts); if(m) materials.push(m); }
    if(c.vmcType && c.vmcType!=="none"){ const m=configuredMaterial(state,"vmc","Appareillage","Commande VMC",1,"interrupteur",alerts); if(m) materials.push(m); }
    if(n(c.exteriorSockets)>0){ const m=configuredMaterial(state,"priseExtSimple","Appareillage extérieur","Prises extérieures IP55",n(c.exteriorSockets),"prise_electrique",alerts); if(m) materials.push(m); }
    if(n(c.exteriorLights)>0 && c.exteriorCommand!=="aucune"){ const m=configuredMaterial(state,"interExt","Appareillage extérieur","Commande éclairage extérieur IP55",1,"interrupteur",alerts,c.exteriorCommand==="va_et_vient"?"Va-et-vient":"Simple allumage avec voyant"); if(m) materials.push(m); }
    if(n(c.exteriorLights)>0 && n(c.exteriorLightMaterialPrice)>0){ materials.push({articleId:"manual:luminaire-exterieur",category:"Éclairage extérieur",name:c.exteriorLightMaterialLabel||(c.exteriorLightType==="spot"?"Spot extérieur":"Applique extérieure"),qty:n(c.exteriorLights),unit:"u",price:n(c.exteriorLightMaterialPrice),total:Math.round(n(c.exteriorLights)*n(c.exteriorLightMaterialPrice)*100)/100,source:"Prix saisi par l'artisan",note:"Luminaire extérieur"}); }

    // Protections divisionnaires : prix par calibre lorsqu'une référence moyenne 2026 existe.
    circuits.forEach(ci=>{
      if(ci.supply==="3P"){
        materials.push(catalogueMaterial(null,"Protection",`Disjoncteur tétrapolaire ${ci.breaker}A — ${ci.name}`,1,"u",`Différentiel ${ci.diff} — référence exacte selon marque`));
        blockers.push(`${ci.name} triphasé : disjoncteur tétrapolaire exact à sélectionner.`);
        return;
      }
      const map={2:"disjoncteur_2a",10:"disjoncteur_10a",16:"disjoncteur_16a",20:"disjoncteur_20a",25:"disjoncteur_25a",32:"disjoncteur_32a"};
      materials.push(catalogueMaterial(map[ci.breaker]||"disjoncteur","Protection",`Disjoncteur ${ci.breaker}A — ${ci.name}`,1,"u",`Différentiel ${ci.diff}`));
    });
    if(c.chauffeEau) materials.push(catalogueMaterial("contacteur_jn","Protection","Contacteur jour/nuit chauffe-eau",1,"u"));

    // Tableau complet : en neuf, ou en rénovation si remplacement complet demandé.
    const fullTable = (state.installation.type||"neuf")==="neuf" || state.tableau.replaceExisting;
    if(fullTable){
      materials.push(catalogueMaterial("tableau_electrique","Tableau électrique",`Tableau ${tableau.rows} rangée(s)`,1,"u",`Marque : ${tableau.brand}`));
      if(tableau.diffA>0) materials.push(catalogueMaterial("differentiel_30ma_type_a","Protection","Interrupteur différentiel 30mA Type A",tableau.diffA,"u"));
      if(tableau.diffAC>0) materials.push(catalogueMaterial("differentiel_30ma_type_ac","Protection","Interrupteur différentiel 30mA Type AC",tableau.diffAC,"u"));
      if(tableau.diffF>0){ materials.push(catalogueMaterial(null,"Protection","Interrupteur différentiel 30mA Type F",tableau.diffF,"u","Référence/calibre à sélectionner selon marque et équipement.")); blockers.push("Différentiel Type F requis : sélectionner la référence et le calibre selon l’équipement."); }
    }else if(state.installation.type==="renovation" && state.tableau.partialExisting){
      alerts.push("Modification partielle du tableau : aucun tableau complet n'est ajouté.");
      if(state.tableau.newMaterialPartial && n(state.tableau.partialMaterialPrice)>0){ materials.push({articleId:"manual:tableau-partiel",category:"Tableau électrique",name:state.tableau.partialMaterialNote||"Matériel neuf pour modification partielle du tableau",qty:1,unit:"forfait",price:n(state.tableau.partialMaterialPrice),total:n(state.tableau.partialMaterialPrice),source:"Prix saisi par l'artisan",note:"Modification partielle"}); }
    }

    if(state.tableau.ground){
      materials.push(catalogueMaterial("cable_terre_25mm2","Mise à la terre","Câblette cuivre 25 mm² vert/jaune",20,"ml"));
      materials.push(catalogueMaterial("piquet_terre","Mise à la terre","Piquet de terre cuivre 1,5 m",1,"u"));
    }
    if(state.tableau.parafoudre) materials.push(catalogueMaterial("parafoudre_type2","Protection","Parafoudre Type 2",1,"u"));
    return materials;
  }

  function computeTableau(state,circuits){
    const isF=c=>/\bF\b|type\s*f|fsi/i.test(String(c.diff||""));
    const isA=c=>!isF(c) && (/type\s*a/i.test(String(c.diff||"")) || String(c.diff||"").trim()==="A");
    const fCount=circuits.filter(isF).length, aCount=circuits.filter(isA).length;
    const acCount=Math.max(0,circuits.length-aCount-fCount);
    const diffA=aCount?Math.max(1,ceilDiv(aCount,8)):0;
    const diffF=fCount?Math.max(1,ceilDiv(fCount,8)):0;
    const diffAC=acCount?Math.max(1,ceilDiv(acCount,8)):0;
    const autoRows=Math.max(1,ceilDiv(circuits.length,13));
    const rows=n(state.tableau.rows)||autoRows;
    return {circuits:circuits.length,diffA,diffAC,diffF,rows,autoRows,brand:state.tableau.brand||"indifferent"};
  }

  function computeLabor(state,points,circuits,alerts,blockers){
    const rate=n(state.pricing.hourlyRate); // taux entreprise : jamais remplacer silencieusement un zéro par 55
    let baseHours=0;
    const detail=[];
    const add=(label,h)=>{ if(h>0){ baseHours+=h; detail.push({label,hours:h}); } };
    const installType=state.installation.type||"neuf";

    if(installType==="neuf"){
      add("Création prises",points.generalSockets*.5 + points.kitchenSockets*.5);
      add("Création commandes / interrupteurs",points.switches*.5);
      add("Création points lumineux",points.lightPoints*.5);
      add("Création RJ45",points.rj45*.5);
      add("Création TV",points.tv*.5);
    } else {
      const r=state.renovation||{};
      ["prises","interrupteurs","luminaires","rj45","tv"].forEach(key=>{
        const x=r[key]||{};
        const create=n(x.create), replace=n(x.replace), move=n(x.move), remove=n(x.remove);
        add(`${key} — créations`,create*.5);
        add(`${key} — remplacements`,replace*(.25+.5));
        add(`${key} — déplacements`,move*(.25+.5));
        add(`${key} — déposes seules`,remove*.25);
      });
      if(state.tableau.replaceExisting) add("Dépose tableau existant",3);
      if(n(r.gaineManualHours)>0) add("Dépose / repassage gaines — temps artisan",n(r.gaineManualHours));
    }

    // Les forfaits VMC/sonnette intègrent déjà leur main-d'œuvre : pas de double comptage.
    const specialized=circuits.filter(c=>!["prises","cuisine","eclairage","vmc"].includes(c.type)).length;
    add("Raccordement circuits spécialisés",specialized*1);

    const fullTableLabor=installType==="neuf" || state.tableau.replaceExisting;
    if(fullTableLabor){ const tableTime=tableauHoursFor(circuits.length,state.installation.phase,blockers); if(tableTime) add(`Pose / raccordement tableau — palier ${tableTime.bracket} circuits`,tableTime.hours); }
    else if(installType==="renovation" && state.tableau.partialExisting) add("Modification partielle du tableau — temps artisan",n(state.tableau.partialHours));
    if(state.tableau.ground) add("Mise à la terre",2);
    add("Tests / mise en service",1.5);

    const complexity=state.options.complexity||"moyenne";
    const coefficient=DIFFICULTY[complexity] ?? 1;
    const adjustedHours=baseHours*coefficient;
    if(coefficient!==1){
      detail.push({label:`Coefficient chantier ${complexity} × ${coefficient.toFixed(2)}`,hours:adjustedHours-baseHours,adjustment:true});
      alerts.push(`Coefficient général chantier appliqué : ${coefficient.toFixed(2)} (${complexity}).`);
    }

    // Guillaume souhaite conserver les supports. Faute de multiplicateurs support distincts,
    // ils produisent une recommandation chantier mais le coefficient chiffré reste celui de l'annexe 2.
    if(state.options.support && state.options.support!=="placo_neuf"){
      alerts.push(`Support sélectionné : ${state.options.support}. Vérifier que le niveau de complexité choisi reflète bien les conditions réelles de passage.`);
    }
    if(state.options.accesDifficile){
      alerts.push("Accès difficile / gaines encastrées signalé : vérifier le niveau de complexité chantier avant validation du devis.");
    }

    return {hours:adjustedHours,baseHours,coefficient,rate,total:adjustedHours*rate,detail};
  }

  function computeFixedServices(state){
    const rows=[]; let total=0;
    const c=state.circuits||{};
    if(c.bellType && c.bellType!=="none"){
      const price=FIXED.bell[c.bellType];
      const labels={carillon:"Carillon simple",visio:"Visiophone sans ouverture",visioGate:"Visiophone avec commande portail/portillon"};
      rows.push({label:labels[c.bellType],price}); total+=price;
    }
    if(c.vmcType && c.vmcType!=="none"){
      const price=FIXED.vmc[c.vmcType];
      const labels={auto:"VMC simple flux autoréglable",hygro:"VMC simple flux hygroréglable",double:"VMC double flux"};
      rows.push({label:labels[c.vmcType],price}); total+=price;
      const extra=n(c.vmcExtraMouths);
      if(extra){ const p=extra*FIXED.vmc.extraMouth; rows.push({label:`${extra} bouche(s) VMC supplémentaire(s)`,price:p}); total+=p; }
      if(c.vmcRoof){ rows.push({label:"Sortie toiture VMC",price:FIXED.vmc.roof}); total+=FIXED.vmc.roof; }
    }

    if(state.tableau.consuel){ rows.push({label:"Consuel — contrôle / vérification chantier",price:CONTROL_FIXED_PRICE}); total+=CONTROL_FIXED_PRICE; }
    if(state.tableau.diagnostic){ rows.push({label:"Diagnostic électrique — contrôle / vérification chantier",price:CONTROL_FIXED_PRICE}); total+=CONTROL_FIXED_PRICE; }

    const d=state.domotique||{};
    Object.entries(SOMFY).forEach(([key,item])=>{
      const qty=n(d[key]);
      if(!qty) return;
      const price=(item.material + item.hours*n(state.pricing.hourlyRate))*qty;
      rows.push({label:`${item.label} × ${qty}`,price,indicative:true}); total+=price;
    });
    return {rows,total};
  }

  function normAlerts(state,points,alerts){
    if(state.installation.type!=="renovation") return;
    const r=state.renovation||{};
    function kept(key){ const x=r[key]||{}; return n(x.keep)+n(x.replace)+n(x.move)+n(x.create); }
    const currentSockets=kept("prises");
    if(currentSockets && currentSockets<points.generalSockets+points.kitchenSockets){
      alerts.push(`Rénovation : prises finales (${currentSockets}) sous le besoin AUTO (${points.generalSockets+points.kitchenSockets}).`);
    }
    const currentRj=kept("rj45");
    if(currentRj && currentRj<points.rj45) alerts.push(`Rénovation : RJ45 finales (${currentRj}) sous le besoin AUTO (${points.rj45}).`);
    const currentTv=kept("tv");
    if(currentTv && currentTv<points.tv) alerts.push(`Rénovation : prises TV finales (${currentTv}) sous le besoin AUTO (${points.tv}).`);
  }


  // Contrôles internes de test V6.1. Ces codes ne sont jamais rendus dans l'interface artisan.
  function audit(state){
    const markers=[]; const add=(level,code,message)=>markers.push({level,code,message});
    const points=effectivePoints(state), c=state.circuits||{}, t=state.tableau||{}, r=state.renovation||{};
    if(n(state.installation?.surface)<=0) add("block","ELEC_SURFACE","Surface habitable invalide.");
    if(n(state.installation?.levels)<1) add("block","ELEC_LEVELS","Nombre de niveaux invalide.");
    const roomCount=Object.entries(state.rooms||{}).filter(([k])=>!["sejourSurface","cuisineSurface"].includes(k)).reduce((s,[,v])=>s+n(v),0);
    if(roomCount===0) add("block","ELEC_ROOMS","Aucune pièce renseignée.");
    if(n(state.rooms?.sejour)>0 && n(state.rooms?.sejourSurface)<=0) add("block","ELEC_SEJOUR_SURFACE","Surface séjour manquante.");
    if(n(state.rooms?.cuisine)>0 && n(state.rooms?.cuisineSurface)<=0) add("block","ELEC_CUISINE_SURFACE","Surface cuisine manquante.");
    const sd=CS&&CS.socketDistribution?CS.socketDistribution(state,points.generalSockets+points.kitchenSockets):{valid:true};
    if(!sd.valid) add("block","ELEC_SOCKET_DIST","Répartition prises invalide.");
    if(state.installation?.type==="renovation"){
      const mapping={prises:points.generalSockets+points.kitchenSockets,interrupteurs:points.switches,luminaires:points.lightPoints,rj45:points.rj45,tv:points.tv};
      for(const [key,expected] of Object.entries(mapping)){
        const actions=r[key]||{};
        const final=["keep","replace","move","create"].reduce((sum,a)=>sum+Math.max(0,n(actions[a])),0);
        if(final!==expected) add("block","ELEC_RENO_"+key.toUpperCase(),key+" : total conservé/remplacé/déplacé/créé ("+final+") différent des points finaux ("+expected+").");
      }
    }
    if(state.installation?.type==="renovation"){
      if(t.replaceExisting&&t.partialExisting) add("block","ELEC_PANEL_CONFLICT","Deux actions tableau incompatibles.");
      if(r.tableauAncien&&!t.replaceExisting&&!t.partialExisting) add("warn","ELEC_OLD_PANEL","Tableau ancien sans action.");
      if(r.pasDeTerre&&!t.ground) add("warn","ELEC_GROUND","Absence de terre sans création.");
      if(r.cablesAlu) add("warn","ELEC_ALU","Conducteurs aluminium à contrôler.");
      if(t.partialExisting&&n(t.partialHours)<=0) add("block","ELEC_PARTIAL_HOURS","Temps tableau partiel manquant.");
      if(t.partialExisting&&t.newMaterialPartial&&n(t.partialMaterialPrice)<=0) add("block","ELEC_PARTIAL_PRICE","Prix matériel tableau partiel manquant.");
    }
    if(t.differentielTete) add("warn","ELEC_HEAD_DIFF","Différentiel de tête à préciser."); if(t.brand!=="indifferent")add("warn","ELEC_PANEL_BRAND","Marque tableau sélectionnée : les prix actuels restent des moyennes non spécifiques à cette marque.");
    if(n(t.rows)>0){ const autoRows=Math.max(1,ceilDiv(buildCircuits(state,points,[],[]).length,13)); if(n(t.rows)<autoRows)add("block","ELEC_ROWS","Rangées insuffisantes."); }
    if(n(state.pricing?.hourlyRate)<=0) add("block","ELEC_RATE","Taux horaire invalide.");
    if(n(state.installation?.height)<=0) add("block","ELEC_HEIGHT","Hauteur sous plafond invalide.");
    if(n(state.installation?.levels)>1||n(state.installation?.height)>3)
      add("warn","ELEC_ACCESS","Plusieurs niveaux ou grande hauteur : vérifier les longueurs AUTO et le coefficient de difficulté avec les conditions réelles.");
    const wet=n(state.rooms?.cuisine)+n(state.rooms?.wc)+n(state.rooms?.wcHand)+n(state.rooms?.sdb)+n(state.rooms?.sde)+n(state.rooms?.cellier)+n(state.rooms?.buanderie);
    if(wet>0&&(!c.vmcType||c.vmcType==="none")) add("warn","ELEC_VMC","Pièces humides sans VMC.");
    if((n(c.vmcExtraMouths)>0||c.vmcRoof)&&(!c.vmcType||c.vmcType==="none")) add("block","ELEC_VMC_ORPHAN","Options VMC sans VMC.");
    for(const [flag,key,label] of [["pac","pacManual","PAC"],["clim","climManual","Climatisation"],["gainable","gainableManual","Gainable"],["tone","toneManual","T.One"],["irve","irveManual","IRVE"],["pv","pvManual","Photovoltaïque"]]) if(c[flag]){ const m=c[key]||{}; if(!n(m.section)||!n(m.breaker))add("block","ELEC_MANUAL_"+flag.toUpperCase(),label+" : section/protection manquante."); if(n(m.materialPrice)<=0)add("block","ELEC_PRICE_"+flag.toUpperCase(),label+" : prix matériel manquant."); if(!String(m.materialLabel||"").trim())add("block","ELEC_REF_"+flag.toUpperCase(),label+" : référence fabricant manquante."); }
    if(state.installation?.phase==="triphase") add("info","ELEC_TRI","Triphasé : équilibrage phases à contrôler.");
    return markers;
  }

  function calculate(state){
    const alerts=[], blockers=[];
    const points=effectivePoints(state);
    const circuits=buildCircuits(state,points,alerts,blockers);
    const tableau=computeTableau(state,circuits);
    const materials=computeMaterials(state,points,circuits,tableau,alerts,blockers);
    const labor=computeLabor(state,points,circuits,alerts,blockers);
    const fixed=computeFixedServices(state);
    normAlerts(state,points,alerts);

    // Contrôles métier internes : exposer uniquement les messages compréhensibles, jamais les codes ELEC_.
    const markers=audit(state);
    markers.filter(m=>m.level==="block").forEach(m=>blockers.push(m.message));
    markers.filter(m=>m.level==="warn").forEach(m=>alerts.push(m.message));
    const materialTotal=materials.reduce((sum,m)=>sum+(m.total===null?0:m.total),0);
    const unknownMaterials=materials.filter(m=>m.price===null);
    if(unknownMaterials.length) blockers.push("Fournitures non chiffrées : compléter les références et prix avant tout devis définitif.");
    if(unknownMaterials.length) alerts.push(`${unknownMaterials.length} ligne(s) matériau ne disposent toujours pas d'un prix validé : elles restent non chiffrées.`);

    return {
      points,circuits,tableau,materials,labor,fixed,materialTotal,unknownMaterials,
      knownTotal: materialTotal+labor.total+fixed.total,
      alerts:[...new Set(alerts)],
      blockers:[...new Set(blockers)],
      pricingComplete: blockers.length===0 && unknownMaterials.length===0
    };
  }

  window.ElectricienEngine={
    ROOM_PROFILES,HEATING,SOMFY,FIXED,LENGTH_RATIOS,DIFFICULTY,TABLEAU_HOURS,CONTROL_FIXED_PRICE,CATALOGUE_PRICES,lengthProfileForSurface,computeAutoPoints,effectivePoints,audit,calculate
  };
})();