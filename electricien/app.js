(function(){
  const E=window.ElectricienEngine;
  const CS=window.ElectricienCatalogueSelector;
  const STORAGE="speedarti-electricien-demo-v62";
  const LEGACY_STORAGE="speedarti-electricien-demo-v61";
  const steps=[
    {id:"installation",title:"Installation",sub:"Neuf / rénovation • mono / tri"},
    {id:"logement",title:"Logement",sub:"Pièces & surfaces"},
    {id:"points",title:"Points",sub:"AUTO + correction artisan"},
    {id:"circuits",title:"Circuits",sub:"Spécialisés & équipements"},
    {id:"tableau",title:"Tableau",sub:"Protections & conformité"},
    {id:"resultat",title:"Résultat",sub:"Quantités • temps • alertes"}
  ];

  const emptyAction=()=>({keep:0,replace:0,move:0,create:0,remove:0});
  const defaultState=()=>({
    step:0,
    installation:{type:"neuf",phase:"monophase",typeBien:"maison",surface:80,levels:1,height:2.5,localisationTableau:"rdc",distanceMean:""},
    rooms:{
      garage:0,escalier:0,palier:0,sas:0,tone:0,cave:0,hall:1,vestibule:0,wc:1,wcHand:0,
      buanderie:0,cellier:0,cuisine:1,cuisineSurface:10,sejour:1,sejourSurface:30,suite:0,dressing:0,
      sde:0,degagement:1,chambre:3,bureau:0,sdb:1
    },
    pointOverrides:{generalSockets:null,kitchenSockets:null,lightPoints:null,switches:null,rj45:null,tv:null},
    appareillage:{
      global:{brand:"moyen",gamme:""},
      socketDistribution:{double:0,triple:0},
      families:{
        priseSimple:{brand:"moyen",gamme:"",choiceId:""},
        priseDouble:{brand:"moyen",gamme:"",choiceId:""},
        priseTriple:{brand:"moyen",gamme:"",choiceId:""},
        interrupteur:{brand:"moyen",gamme:"",choiceId:""},
        rj45:{brand:"moyen",gamme:"",choiceId:""},
        tv:{brand:"moyen",gamme:"",choiceId:""},
        volet:{brand:"moyen",gamme:"",choiceId:""},
        vmc:{brand:"moyen",gamme:"",choiceId:""},
        priseExtSimple:{brand:"moyen",gamme:"",choiceId:""},
        priseExtDouble:{brand:"moyen",gamme:"",choiceId:""},
        priseExtTriple:{brand:"moyen",gamme:"",choiceId:""},
        interExt:{brand:"moyen",gamme:"",choiceId:""}
      }
    },
    circuits:{
      socketMode:"2.5_20",
      four:true,laveLinge:true,laveVaisselle:true,secheLinge:false,chauffeEau:true,congelateur:false,priseGTL:true,
      volets:0,heatingPower:0,
      pac:false,pacManual:{section:"",breaker:"",diff:"F selon configuration",supply:"mono",materialLabel:"",materialPrice:""},
      clim:false,climManual:{section:"",breaker:"",diff:"F selon configuration",supply:"mono",materialLabel:"",materialPrice:""},
      gainable:false,gainableManual:{section:"",breaker:"",diff:"Selon fabricant",supply:"mono",materialLabel:"",materialPrice:""},
      tone:false,toneManual:{section:"",breaker:"",diff:"Selon fabricant",supply:"mono",materialLabel:"",materialPrice:""},
      irve:false,irveManual:{section:"",breaker:"",diff:"Selon borne",supply:"mono",materialLabel:"",materialPrice:""},
      pv:false,pvManual:{section:"",breaker:"",diff:"Selon étude",supply:"mono",materialLabel:"",materialPrice:""},
      exteriorLights:0,exteriorSockets:0,exteriorLightType:"applique",exteriorCommand:"simple_voyant",exteriorDetectors:0,exteriorLightMaterialLabel:"",exteriorLightMaterialPrice:"",
      bellType:"none",
      vmcType:"none",vmcExtraMouths:0,vmcRoof:false
    },
    tableau:{
      rows:"",brand:"indifferent",replaceExisting:false,partialExisting:false,newMaterialPartial:false,partialHours:"",partialMaterialPrice:"",partialMaterialNote:"",
      ground:false,parafoudre:false,differentielTete:false,consuel:false,diagnostic:false
    },
    renovation:{
      prises:emptyAction(),interrupteurs:emptyAction(),luminaires:emptyAction(),rj45:emptyAction(),tv:emptyAction(),
      gaineManualHours:0,routes:{prises:0,interrupteurs:0,luminaires:0,rj45:0,tv:0},newCommunicationCabinet:false,
      tableauAncien:false,pasDeTerre:false,cablesAlu:false,prisesInsuffisantes:false
    },
    options:{complexity:"moyenne",support:"placo_neuf",accesDifficile:false},
    pricing:{hourlyRate:55},
    domotique:{tahoma:0,izymo:0,izymoProg:0,alarm:0,outdoorCam:0,indoorCam:0,visioSomfy:0,connectedLight:0,zigbee:0,ioPlug:0,programming:0}
  });

  let state=load();
  let lastResult=null;

  const $=s=>document.querySelector(s);
  const content=$("#content");
  function load(){
    try{
      const raw=localStorage.getItem(STORAGE) || localStorage.getItem(LEGACY_STORAGE);
      if(raw) return merge(defaultState(),JSON.parse(raw));
    }catch(e){}
    return defaultState();
  }
  function merge(base,obj){
    if(!obj||typeof obj!=="object") return base;
    Object.keys(obj).forEach(k=>{
      if(obj[k] && typeof obj[k]==="object" && !Array.isArray(obj[k]) && base[k] && typeof base[k]==="object"){
        base[k]=merge(base[k],obj[k]);
      }else base[k]=obj[k];
    });
    return base;
  }
  function save(show=true){
    localStorage.setItem(STORAGE,JSON.stringify(state));
    if(show) toast("Démo Électricien enregistrée localement.","ok");
  }
  function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
  function euro(v){return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(Number(v)||0);}
  function num(v){const x=Number(v);return Number.isFinite(x)?x:0;}
  function val(path){
    return path.split(".").reduce((o,k)=>o?.[k],state);
  }
  function set(path,value){
    const parts=path.split("."); let o=state;
    parts.slice(0,-1).forEach(k=>{if(!o[k]||typeof o[k]!=="object")o[k]={};o=o[k];});
    o[parts.at(-1)]=value;
  }
  function input(path,label,opt={}){
    const v=val(path)??"";
    const type=opt.type||"number";
    return `<div class="field ${opt.cls||""}"><label>${label}</label><input class="input" data-path="${path}" type="${type}" ${type==="number"?`min="${opt.min??0}" step="${opt.step??1}"`:""} value="${esc(v)}" ${opt.placeholder?`placeholder="${esc(opt.placeholder)}"`:""}></div>`;
  }
  function select(path,label,options,opt={}){
    const v=String(val(path)??"");
    return `<div class="field ${opt.cls||""}"><label>${label}</label><select class="select" data-path="${path}">${options.map(([x,t])=>`<option value="${esc(x)}" ${String(x)===v?"selected":""}>${esc(t)}</option>`).join("")}</select></div>`;
  }
  function check(path,label,opt={}){
    return `<label class="check ${opt.cls||""}"><input type="checkbox" data-path="${path}" ${val(path)?"checked":""}><span>${label}</span></label>`;
  }
  function toggle(path,options){
    const v=String(val(path));
    return `<div class="toggle">${options.map(([x,t])=>`<button type="button" data-set="${path}" data-value="${x}" class="${String(x)===v?"active":""}">${t}</button>`).join("")}</div>`;
  }
  function head(eyebrow,title,desc){
    return `<div class="head"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${desc}</p></div>`;
  }
  function note(text,kind="note-card"){return `<div class="${kind}">${text}</div>`;}
  function toast(text,kind="ok"){
    const el=document.createElement("div");el.className=`alert ${kind} toast`;el.textContent=text;document.body.appendChild(el);
    setTimeout(()=>el.remove(),2600);
  }

  function familyCfg(key){
    state.appareillage=state.appareillage||defaultState().appareillage;
    state.appareillage.families=state.appareillage.families||{};
    if(!state.appareillage.families[key]) state.appareillage.families[key]={brand:"moyen",gamme:"",choiceId:""};
    return state.appareillage.families[key];
  }
  function optionTags(options,current,placeholder){
    return `${placeholder!==undefined?`<option value="">${esc(placeholder)}</option>`:""}${options.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(current)?"selected":""}>${esc(l)}</option>`).join("")}`;
  }
  function activeAppareillageFamilies(points){
    if(!CS) return [];
    const dist=CS.socketDistribution(state,num(points.generalSockets)+num(points.kitchenSockets));
    const c=state.circuits||{};
    return [
      ["priseSimple","Prises simples",dist.simple],
      ["priseDouble","Prises doubles",dist.double],
      ["priseTriple","Prises triples",dist.triple],
      ["interrupteur","Interrupteurs / commandes",num(points.switches)],
      ["rj45","RJ45",num(points.rj45)],
      ["tv","TV / antenne",num(points.tv)],
      ["volet","Commandes volets roulants",num(c.volets)],
      ["vmc","Commande VMC",c.vmcType&&c.vmcType!=="none"?1:0],
      ["priseExtSimple","Prises extérieures",num(c.exteriorSockets)]
    ].filter(x=>x[2]>0);
  }
  function renderFamilySelector(key,label,qty){
    if(!CS) return "";
    const cfg=familyCfg(key);
    const brands=CS.brands(key);
    const brandOpts=[["moyen","Prix moyen"]].concat(brands.map(b=>[b,b]));
    const gammeOpts=cfg.brand!=="moyen"?CS.gammes(key,cfg.brand):[];
    const choiceOpts=cfg.brand!=="moyen"?CS.choices(key,cfg.brand,cfg.gamme||""):[];
    const resolved=CS.resolve(state,key);
    return `<div class="catalog-family">
      <div class="catalog-family-head"><div><b>${esc(label)}</b><span>${qty} unité(s) à chiffrer</span></div><strong>${resolved&&resolved.price!=null?euro(resolved.price)+" / u":"Non chiffré"}</strong></div>
      <div class="grid catalog-fields">
        <div class="field c4"><label>Marque</label><select class="select" data-catalog-brand="${esc(key)}">${optionTags(brandOpts,cfg.brand)}</select></div>
        ${cfg.brand!=="moyen"?`<div class="field c4"><label>Gamme</label><select class="select" data-catalog-gamme="${esc(key)}">${optionTags(gammeOpts.map(g=>[g,g]),cfg.gamme,"Toutes les gammes / moyenne")}</select></div>`:`<div class="c4 surfacebox"><b>Prix moyen</b><br>${resolved&&resolved.price!=null?euro(resolved.price):"—"}<br><span class="muted">Toutes marques compatibles.</span></div>`}
        ${cfg.brand!=="moyen"?`<div class="field c4"><label>Modèle / finition</label><select class="select" data-catalog-choice="${esc(key)}">${optionTags(choiceOpts.map(c=>[c.id,`${c.label} — ${euro(c.price)}`]),cfg.choiceId,"Moyenne de cette sélection")}</select></div>`:""}
      </div>
      <div class="catalog-resolved"><span>${resolved?.exact?"Référence exacte":"Prix de repli"}</span><b>${esc(resolved?.label||"")}</b>${resolved?.ref?`<small>Réf. ${esc(resolved.ref)}</small>`:""}${resolved?.note?`<small>${esc(resolved.note)}</small>`:""}</div>
    </div>`;
  }
  function renderAppareillage(points){
    if(!CS) return note("Catalogue multi-gammes indisponible dans cette copie de démo.","alert err");
    state.appareillage=state.appareillage||defaultState().appareillage;
    state.appareillage.global=state.appareillage.global||{brand:"moyen",gamme:""};
    state.appareillage.socketDistribution=state.appareillage.socketDistribution||{double:0,triple:0};
    const g=state.appareillage.global;
    const allBrands=[...new Set(CS.familyKeys().flatMap(k=>CS.brands(k)))].sort();
    const globalGammes=g.brand!=="moyen"?CS.allGammes(g.brand):[];
    const totalSockets=num(points.generalSockets)+num(points.kitchenSockets);
    const dist=CS.socketDistribution(state,totalSockets);
    const families=activeAppareillageFamilies(points);
    return `<div class="card catalog-card"><div class="row between"><div><h2>Appareillage & finitions</h2><p class="muted">Chaque famille peut avoir sa propre marque, gamme et finition. Le choix global ci-dessous est uniquement un raccourci.</p></div><span class="status-chip">Catalogue multi-gammes 2026</span></div>
      <div class="catalog-global"><div class="grid">
        <div class="field c4"><label>Choix global rapide</label><select class="select" data-path="appareillage.global.brand">${optionTags([["moyen","Prix moyen"]].concat(allBrands.map(b=>[b,b])),g.brand)}</select></div>
        ${g.brand!=="moyen"?`<div class="field c4"><label>Gamme globale</label><select class="select" data-path="appareillage.global.gamme">${optionTags(globalGammes.map(x=>[x,x]),g.gamme,"Choisir / laisser libre")}</select></div>`:""}
        <div class="c4"><label class="fake-label">&nbsp;</label><button type="button" class="btn secondary full-btn" data-apply-global>Appliquer aux familles compatibles</button></div>
      </div></div>
      <div class="catalog-distribution"><h3>Répartition physique des prises</h3><p class="muted">Le besoin normatif reste ${totalSockets} prises. Indique uniquement combien de blocs doubles ou triples tu souhaites ; le reste est automatiquement en prises simples.</p>
        <div class="grid">
          ${input("appareillage.socketDistribution.double","Blocs prises doubles",{cls:"c3",min:0})}
          ${input("appareillage.socketDistribution.triple","Blocs prises triples",{cls:"c3",min:0})}
          <div class="surfacebox c6"><b>${dist.simple} simple(s) + ${dist.double} double(s) + ${dist.triple} triple(s)</b><br><span class="muted">Équivalent : ${dist.simple+dist.double*2+dist.triple*3} / ${totalSockets} prises.</span></div>
        </div>
        ${!dist.valid?`<div class="alert err">La répartition dépasse le nombre de prises calculé. Réduis les blocs doubles/triples.</div>`:""}
      </div>
      <div class="catalog-families">${families.map(([k,l,q])=>renderFamilySelector(k,l,q)).join("")}</div>
      <p class="note">Règle de prix : tarif artisan/fournisseur → référence exacte choisie → moyenne marque/gamme → moyenne générale. Les câbles et gaines restent au prix moyen.</p>
    </div>`;
  }

  function renderSteps(){
    $("#steps").innerHTML=steps.map((s,i)=>`<button class="step ${i===state.step?"active":""}" data-step="${i}"><b>${i+1}. ${s.title}</b><span>${s.sub}</span></button>`).join("");
  }

  function renderInstallation(){
    const reno=state.installation.type==="renovation";
    return head("Étape 1","Installation","Le parcours existant est conservé. Les choix validés Neuf / Rénovation et Monophasé / Triphasé pilotent réellement le calcul.")+
    `<div class="card"><h2>Type d'installation</h2><p class="muted">Décision Guillaume : conserver uniquement Neuf et Rénovation.</p>
      <div class="choice-grid">${[
        ["neuf","🏗️","Construction neuve","Calcul AUTO complet des besoins par pièce."],
        ["renovation","🔧","Rénovation","Conservation / remplacement / déplacement / création."]
      ].map(([x,ic,t,d])=>`<button class="choice-card ${state.installation.type===x?"selected":""}" data-set="installation.type" data-value="${x}"><b>${ic} ${t}</b><span>${d}</span></button>`).join("")}</div>
    </div>
    <div class="card"><h2>Alimentation</h2>
      ${toggle("installation.phase",[["monophase","Monophasé"],["triphase","Triphasé"]])}
      ${state.installation.phase==="triphase"?note("Le moteur répartit les circuits monophasés sur L1/L2/L3 et applique le temps de tableau triphasé de l’annexe 3 selon le nombre de circuits.","alert ok"):""}
    </div>
    <div class="card"><h2>Caractéristiques conservées du module existant</h2>
      <div class="grid">
        ${select("installation.typeBien","Type de bien",[["maison","Maison"],["appartement","Appartement"],["local_pro","Local professionnel"]],{cls:"c4"})}
        ${input("installation.surface","Surface totale (m²)",{cls:"c4",min:1})}
        ${input("installation.levels","Nombre de niveaux",{cls:"c4",min:1})}
        ${input("installation.height","Hauteur sous plafond (m)",{cls:"c4",min:2,step:.1})}
        ${select("installation.localisationTableau","Localisation du tableau",[["cave","Cave / Sous-sol"],["rdc","RDC / Entrée"],["palier","Palier / Étage"],["garage","Garage"]],{cls:"c4"})}
        <div class="c4 surfacebox"><b>Métrés câblage AUTO</b><br>${E.lengthProfileForSurface(state.installation.surface).label}<br><span class="muted">Annexe 1 Guillaume</span></div>
      </div>
      ${note("Les longueurs de prises, éclairages, interrupteurs, RJ45, TV, volets, VMC et circuits spécialisés sont maintenant calculées automatiquement par tranche de surface selon l’annexe 1.","alert ok")}
    </div>
    ${reno?`<div class="card"><h2>État existant — rénovation</h2><div class="option-list">
      ${check("renovation.tableauAncien","Tableau ancien / fusibles")}
      ${check("renovation.pasDeTerre","Pas de mise à la terre")}
      ${check("renovation.cablesAlu","Câbles aluminium")}
      ${check("renovation.prisesInsuffisantes","Prises insuffisantes")}
    </div></div>`:""}`;
  }

  const roomGroups=[
    ["Pièces de vie",[["sejour","Espace de vie / séjour"],["cuisine","Cuisine"],["chambre","Chambres"],["suite","Suite parentale"],["bureau","Bureau"],["dressing","Dressing"]]],
    ["Pièces d'eau & service",[["sdb","Salles de bains"],["sde","Salles d'eau"],["wc","WC"],["wcHand","WC PMR"],["buanderie","Buanderies"],["cellier","Celliers"]]],
    ["Circulations & annexes",[["hall","Halls"],["vestibule","Vestibules"],["degagement","Dégagements"],["escalier","Cages d'escalier"],["palier","Paliers"],["sas","Sas"],["garage","Garages"],["cave","Caves"],["tone","T-One"]]]
  ];

  function renderLogement(){
    const auto=E.computeAutoPoints(state);
    return head("Étape 2","Composition du logement","Le nombre de pièces ambigu n'est plus inventé depuis la surface : l'artisan décrit directement les pièces, comme demandé par Guillaume.")+
    roomGroups.map(([title,items])=>`<div class="card"><h2>${title}</h2><div class="grid">${items.map(([k,l])=>input(`rooms.${k}`,l,{cls:"c3",min:0})).join("")}</div></div>`).join("")+
    `<div class="card"><h2>Surfaces nécessaires aux minima</h2><div class="grid">
      ${input("rooms.sejourSurface","Surface séjour (m²)",{cls:"c4",min:0,step:.5})}
      ${input("rooms.cuisineSurface","Surface cuisine (m²)",{cls:"c4",min:0,step:.5})}
      <div class="c4 surfacebox"><b>Surface logement</b><br>${esc(state.installation.surface)} m²<br><span class="muted">Utilisée pour les ratios de câblage de l’annexe 1.</span></div>
    </div></div>
    <div class="card simple-card"><h2>Aperçu AUTO</h2><div class="metrics">
      <div class="metric"><span>Prises générales</span><strong>${auto.generalSockets}</strong></div>
      <div class="metric"><span>Prises cuisine</span><strong>${auto.kitchenSockets}</strong></div>
      <div class="metric"><span>Points lumineux</span><strong>${auto.lightPoints}</strong></div>
      <div class="metric"><span>RJ45</span><strong>${auto.rj45}</strong></div>
    </div>
    <p class="note">Annexe 1 prioritaire + minima annexe 2. Le détail reste modifiable à l'étape suivante.</p></div>`;
  }

  function overrideInput(key,label,auto){
    const raw=state.pointOverrides[key];
    return `<div class="field c4"><label>${label}</label><div class="auto-line"><span class="auto-badge">AUTO ${auto}</span><input class="input" data-path="pointOverrides.${key}" type="number" min="0" placeholder="AUTO" value="${raw===null||raw===undefined?"":esc(raw)}"></div></div>`;
  }

  function renovationMatrix(){
    const rows=[["prises","Prises"],["interrupteurs","Interrupteurs"],["luminaires","Points lumineux"],["rj45","RJ45"],["tv","TV / antenne"]];
    return `<div class="card"><h2>Traitement de l'existant</h2><p class="muted">Règle Guillaume : distinguer conservation, remplacement, déplacement et création. La dépose seule reste disponible.</p>
      <div class="table-wrap"><table class="table reno-table"><thead><tr><th>Élément</th><th>Conserver</th><th>Remplacer</th><th>Déplacer</th><th>Créer</th><th>Déposer seul</th></tr></thead><tbody>
      ${rows.map(([k,l])=>`<tr><td><b>${l}</b></td>${["keep","replace","move","create","remove"].map(a=>`<td><input class="mini-input" data-path="renovation.${k}.${a}" type="number" min="0" value="${num(val(`renovation.${k}.${a}`))}"></td>`).join("")}</tr>`).join("")}
      </tbody></table></div>
      <div class="grid top-gap">${input("renovation.gaineManualHours","Temps manuel dépose / repassage gaines (h)",{cls:"c6",min:0,step:.25})}</div>
      <h3>Longueurs réelles des parcours créés ou déplacés</h3>
      <p class="muted">Ne renseigner que les mètres de nouveaux cheminements : une prise conservée ou simplement remplacée sans recâblage ne doit pas déclencher de métrage automatique.</p>
      <div class="grid">
        ${input("renovation.routes.prises","Câbles prises — parcours (ml)",{cls:"c4",min:0,step:.5})}
        ${input("renovation.routes.interrupteurs","Câbles commandes — parcours (ml)",{cls:"c4",min:0,step:.5})}
        ${input("renovation.routes.luminaires","Câbles éclairage — parcours (ml)",{cls:"c4",min:0,step:.5})}
        ${input("renovation.routes.rj45","Câble RJ45 (ml)",{cls:"c4",min:0,step:.5})}
        ${input("renovation.routes.tv","Câble TV/coaxial (ml)",{cls:"c4",min:0,step:.5})}
      </div>
      <div class="option-list">${check("renovation.newCommunicationCabinet","Installer un nouveau coffret de communication")}</div>
      <p class="note">Renseigner les cinq lignes pour que conserver + remplacer + déplacer + créer corresponde au nombre final de points. Une dépose seule n'entre pas dans le total final. Dépose prise/interrupteur/point lumineux : 15 min. Dépose tableau : 3 h.</p>
    </div>`;
  }

  function renderPoints(){
    const a=E.computeAutoPoints(state), p=E.effectivePoints(state);
    return head("Étape 3","Points à créer","Le mode AUTO est la base, puis chaque valeur peut être corrigée par l'artisan sans perdre les contrôles de cohérence.")+
    `<div class="card"><div class="row between"><div><h2>Mode AUTO + correction</h2><p class="muted">Laissez un champ vide pour reprendre l'AUTO.</p></div><span class="status-chip">Artisan maître du calcul</span></div>
      <div class="grid">
        ${overrideInput("generalSockets","Prises générales",a.generalSockets)}
        ${overrideInput("kitchenSockets","Prises cuisine",a.kitchenSockets)}
        ${overrideInput("lightPoints","Points lumineux",a.lightPoints)}
        ${overrideInput("switches","Commandes / interrupteurs",a.switches)}
        ${overrideInput("rj45","RJ45",a.rj45)}
        ${overrideInput("tv","TV / antenne",a.tv)}
      </div>
    </div>
    <div class="card"><h2>Détail de l'AUTO</h2><div class="grid">
      <div class="surfacebox c3"><b>Simple allumage</b><br>${a.simple}</div>
      <div class="surfacebox c3"><b>Va-et-vient</b><br>${a.vv}</div>
      <div class="surfacebox c3"><b>Éclairage 3 points</b><br>${a.three}</div>
      <div class="surfacebox c3"><b>Coffret communication</b><br>${p.communicationCabinet?"Oui":"Non"}</div>
    </div>
    <p class="note">RJ45 : T1=2, T2=3, T3+=4 minimum ; 2 juxtaposées dans le séjour. Dès qu'il existe une RJ45 ou TV, le coffret de communication est créé automatiquement.</p></div>
    ${renderAppareillage(p)}
    ${state.installation.type==="renovation"?renovationMatrix():""}`;
  }

  function manualBlock(flagPath,dataPath,title){
    if(!val(flagPath)) return "";
    return `<div class="manual-config"><b>${title} — selon fabricant</b><div class="grid top-gap">
      ${input(`${dataPath}.section`,"Section (mm²)",{cls:"c3",min:0,step:.5})}
      ${input(`${dataPath}.breaker`,"Disjoncteur (A)",{cls:"c3",min:0,step:1})}
      ${select(`${dataPath}.supply`,"Alimentation",[["mono","Mono"],["3P","Triphasé 3P"]],{cls:"c3"})}
      ${input(`${dataPath}.diff`,"Différentiel / remarque",{cls:"c3",type:"text"})}
      ${input(`${dataPath}.materialLabel`,"Référence / modèle fabricant",{cls:"c6",type:"text",placeholder:"Ex. référence fabricant"})}
      ${input(`${dataPath}.materialPrice`,"Prix matériel HT (€)",{cls:"c3",min:0,step:.01})}
      ${input(`${dataPath}.route`,"Longueur réelle de câblage (ml)",{cls:"c3",min:0,step:.5})}
    </div></div>`;
  }

  function renderCircuits(){
    return head("Étape 4","Circuits & équipements","Les circuits validés sont automatisés. PAC, climatisation, gainable, T.One, IRVE et raccordement photovoltaïque restent saisis selon fabricant quand la règle n'est pas fournie.")+
    `<div class="card"><h2>Circuits prises</h2>
      ${select("circuits.socketMode","Choix conservé pour les prises générales",[["2.5_20","2,5 mm² • 20 A • 12 prises max"],["1.5_16","1,5 mm² • 16 A • 8 prises max"]])}
      <p class="note">Les deux configurations figurent dans l'annexe 3. La démo démarre sur 2,5 mm² / 20 A pour rester cohérente avec le câblage 2,5 mm² déjà utilisé par le module existant.</p>
    </div>
    <div class="card"><h2>Circuits spécialisés courants</h2><div class="option-list">
      ${check("circuits.four","Four — 2,5 mm² / 20 A")}
      ${check("circuits.laveLinge","Lave-linge — 2,5 mm² / 20 A / type A")}
      ${check("circuits.laveVaisselle","Lave-vaisselle — 2,5 mm² / 20 A")}
      ${check("circuits.secheLinge","Sèche-linge — 2,5 mm² / 20 A")}
      ${check("circuits.chauffeEau","Chauffe-eau — 2,5 mm² / 20 A")}
      ${check("circuits.congelateur","Congélateur — 2,5 mm² / 20 A / type F recommandé")}
      ${check("circuits.priseGTL","Prise GTL — circuit dédié")}
    </div><div class="grid top-gap">
      ${input("circuits.volets","Nombre de volets roulants",{cls:"c4",min:0})}
      ${input("circuits.heatingPower","Puissance chauffage électrique totale (W)",{cls:"c4",min:0,step:50})}
    </div></div>
    <div class="card"><h2>Équipements selon fabricant</h2><p class="muted">Conservés dans le module, mais aucune section/protection n'est inventée.</p>
      <div class="option-list">
        ${check("circuits.pac","PAC")}
        ${manualBlock("circuits.pac","circuits.pacManual","PAC")}
        ${check("circuits.clim","Climatisation")}
        ${manualBlock("circuits.clim","circuits.climManual","Climatisation")}
        ${check("circuits.gainable","Gainable")}
        ${manualBlock("circuits.gainable","circuits.gainableManual","Gainable")}
        ${check("circuits.tone","T.One")}
        ${manualBlock("circuits.tone","circuits.toneManual","T.One")}
        ${check("circuits.irve","Borne IRVE")}
        ${manualBlock("circuits.irve","circuits.irveManual","IRVE")}
        ${check("circuits.pv","Raccordement électrique photovoltaïque")}
        ${manualBlock("circuits.pv","circuits.pvManual","Raccordement photovoltaïque")}
      </div>
    </div>
    <div class="card"><h2>VMC, sonnette & extérieur</h2><div class="grid">
      ${select("circuits.vmcType","VMC",[["none","Aucune"],["auto","Simple flux autoréglable — 600 € HT"],["hygro","Simple flux hygroréglable — 800 € HT"],["double","Double flux — 3 500 € HT"]],{cls:"c4"})}
      ${input("circuits.vmcExtraMouths","Bouches supplémentaires",{cls:"c4",min:0})}
      <div class="c4 field"><label>Sortie toiture</label>${check("circuits.vmcRoof","Oui (+90 € HT)")}</div>
      ${select("circuits.bellType","Sonnette / visiophone",[["none","Aucun"],["carillon","Carillon simple — 170 € HT"],["visio","Visiophone sans ouverture — 500 € HT"],["visioGate","Visiophone avec ouverture — 750 € HT"]],{cls:"c4"})}
      ${input("circuits.exteriorLights","Points d'éclairage extérieur",{cls:"c4",min:0})}
      ${input("circuits.exteriorSockets","Prises extérieures",{cls:"c4",min:0})}
      ${select("circuits.exteriorLightType","Type éclairage extérieur",[["applique","Applique"],["spot","Spot"]],{cls:"c4"})}
      ${select("circuits.exteriorCommand","Commande extérieur",[["simple_voyant","Simple allumage avec voyant"],["va_et_vient","Va-et-vient"],["aucune","Aucune commande"]],{cls:"c4"})}
      ${input("circuits.exteriorDetectors","Détecteurs de mouvement",{cls:"c4",min:0})}
      ${input("circuits.exteriorLightMaterialLabel","Référence luminaire extérieur",{cls:"c4",type:"text",placeholder:"Optionnel"})}
      ${input("circuits.exteriorLightMaterialPrice","Prix luminaire unitaire HT (€)",{cls:"c4",min:0,step:.01})}
    </div></div>
    <div class="card"><h2>Domotique Somfy / TaHoma</h2><p class="muted">Annexe 5 — matériel indicatif + temps de pose, recalculé avec le taux horaire de l'entreprise.</p>
      <div class="grid">${Object.entries(E.SOMFY).map(([k,v])=>input(`domotique.${k}`,v.label,{cls:"c4",min:0})).join("")}</div>
    </div>`;
  }

  function renderTableau(){
    return head("Étape 5","Tableau électrique & conformité","Le tableau est calculé depuis les circuits. Les choix historiques sont conservés et reliés quand une règle existe.")+
    `<div class="card"><h2>Configuration tableau</h2><div class="grid">
      ${input("tableau.rows","Nombre de rangées (vide = AUTO)",{cls:"c4",min:1})}
      ${select("tableau.brand","Marque",[["indifferent","Indifférent"],["schneider","Schneider Electric"],["legrand","Legrand"],["hager","Hager"]],{cls:"c4"})}
      ${input("pricing.hourlyRate","Taux horaire entreprise (€ HT/h)",{cls:"c4",min:0,step:.5})}
    </div><div class="option-list top-gap">
      ${check("tableau.replaceExisting","Remplacement complet du tableau")}
      ${check("tableau.partialExisting","Modification partielle du tableau")}
      ${state.tableau.partialExisting?check("tableau.newMaterialPartial","Commander du matériel neuf pour la modification partielle"):""}
      ${state.tableau.partialExisting?input("tableau.partialHours","Temps de modification partielle (h)",{cls:"c4",min:0,step:.25}):""}
      ${state.tableau.partialExisting&&state.tableau.newMaterialPartial?input("tableau.partialMaterialPrice","Matériel neuf tableau — prix HT (€)",{cls:"c4",min:0,step:.01}):""}
      ${state.tableau.partialExisting&&state.tableau.newMaterialPartial?input("tableau.partialMaterialNote","Matériel neuf tableau — référence / note",{cls:"c8",type:"text"}):""}
      ${check("tableau.parafoudre","Parafoudre Type 2")}
      ${check("tableau.differentielTete","Différentiel de tête")}
    </div>
    <p class="note">La marque sélectionne la gamme catalogue ; Guillaume indique que les références métier sont communes et que la différence porte surtout sur le prix / les habitudes artisan.</p></div>
    <div class="card"><h2>Conformité & conditions</h2><div class="option-list">
      ${check("tableau.ground","Mise à la terre complète — 20 m câblette cuivre + 1 piquet")}
      ${check("tableau.consuel","Attestation / contrôle Consuel — 150 € HT")}
      ${check("tableau.diagnostic","Diagnostic électrique — 150 € HT")}
      ${check("options.accesDifficile","Accès difficile / gaines encastrées")}
    </div>
    ${select("options.complexity","Niveau de complexité",[["simple","Très simple — coefficient 0,80"],["moyenne","Normal — coefficient 1,00"],["complexe","Complexe — coefficient 1,25"]])}
    ${select("options.support","Type de support",[["placo_neuf","Doublage placo neuf"],["placo_existant","Cloison placo existante"],["brique","Brique / briquette enduite"],["beton","Béton"],["moulure","Apparent sous moulure"],["combles","Combles / vide technique"]])}
    ${note("Annexe 2 : coefficient général appliqué à la main-d’œuvre du chantier. Le type de support reste conservé comme information et alerte métier, sans multiplicateur supplémentaire non fourni.","alert ok")}
    </div>`;
  }

  function renderResult(){
    lastResult=E.calculate(state);
    const r=lastResult;
    return head("Étape 6","Résultat du chiffrage","Récapitulatif des quantités, fournitures, temps de main-d’œuvre et prix calculés à partir des choix du chantier.")+
    `<div class="metrics">
      <div class="metric"><span>Circuits</span><strong>${r.tableau.circuits}</strong></div>
      <div class="metric"><span>Rangées tableau</span><strong>${r.tableau.rows}</strong></div>
      <div class="metric"><span>Main-d'œuvre</span><strong>${r.labor.hours.toFixed(1)} h</strong><small>coef. ${r.labor.coefficient.toFixed(2)}</small></div>
      <div class="metric"><span>Matériaux chiffrés</span><strong>${euro(r.materialTotal)}</strong></div>
      <div class="metric"><span>${r.pricingComplete?"Total calculé*":"Sous-total connu — incomplet*"}</span><strong>${euro(r.knownTotal)}</strong></div>
    </div>
    ${!r.pricingComplete?'<div class="alert err"><strong>Chiffrage provisoire — non utilisable comme devis définitif.</strong> Corriger les points bloquants et compléter les fournitures sans prix.</div>':""}
    <p class="note">* Calcul basé sur les données et tarifs renseignés ; validité réglementaire et validation artisan indispensables.</p>
    ${r.blockers.length?`<div class="card"><h2>⛔ Points bloqués / non chiffrés</h2>${r.blockers.map(x=>`<div class="alert err">${esc(x)}</div>`).join("")}</div>`:""}
    ${r.alerts.length?`<div class="card"><h2>⚠️ Alertes & contrôles</h2>${r.alerts.map(x=>`<div class="alert warn">${esc(x)}</div>`).join("")}</div>`:""}
    <div class="card"><h2>Points retenus</h2><div class="metrics">
      <div class="metric"><span>Prises générales</span><strong>${r.points.generalSockets}</strong></div>
      <div class="metric"><span>Prises cuisine</span><strong>${r.points.kitchenSockets}</strong></div>
      <div class="metric"><span>Éclairage</span><strong>${r.points.lightPoints}</strong></div>
      <div class="metric"><span>RJ45 / TV</span><strong>${r.points.rj45} / ${r.points.tv}</strong></div>
    </div></div>
    <div class="card"><h2>Circuits</h2><div class="table-wrap"><table class="table"><thead><tr><th>Circuit</th><th>Section</th><th>Disj.</th><th>Diff.</th><th>Phase</th></tr></thead><tbody>
      ${r.circuits.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.section)} mm²</td><td>${esc(c.breaker)} A</td><td>${esc(c.diff)}</td><td>${esc(c.phase)}</td></tr>`).join("")||`<tr><td colspan="5">Aucun circuit</td></tr>`}
    </tbody></table></div></div>
    <div class="card"><h2>Matériaux / commande</h2><div class="table-wrap"><table class="table"><thead><tr><th>Catégorie</th><th>Désignation</th><th>Qté</th><th>PU HT</th><th>Total HT</th><th>Source</th><th>Note</th></tr></thead><tbody>
      ${r.materials.map(m=>`<tr><td>${esc(m.category)}</td><td>${esc(m.name)}</td><td>${esc(m.qty)} ${esc(m.unit)}</td><td>${m.price===null?'<span class="catalog-tag">Non trouvé</span>':euro(m.price)}</td><td>${m.total===null?'—':euro(m.total)}</td><td>${esc(m.source||"")}</td><td>${esc(m.note||"")}</td></tr>`).join("")}
      <tr><td colspan="4"><b>Total matériaux chiffrés</b></td><td><b>${euro(r.materialTotal)}</b></td><td colspan="2"></td></tr>
    </tbody></table></div></div>
    <div class="card"><h2>Main-d'œuvre</h2><div class="table-wrap"><table class="table"><thead><tr><th>Poste</th><th>Temps</th></tr></thead><tbody>
      ${r.labor.detail.map(x=>`<tr><td>${esc(x.label)}</td><td>${x.hours.toFixed(2)} h</td></tr>`).join("")}
      <tr><td><b>Total main-d'œuvre @ ${euro(r.labor.rate)}/h — coefficient ${r.labor.coefficient.toFixed(2)}</b></td><td><b>${euro(r.labor.total)}</b></td></tr>
    </tbody></table></div></div>
    <div class="card"><h2>Forfaits & équipements à prix connu</h2>${r.fixed.rows.length?`<div class="table-wrap"><table class="table"><tbody>${r.fixed.rows.map(x=>`<tr><td>${esc(x.label)}${x.indicative?' <span class="muted">(annexe 5)</span>':''}</td><td>${euro(x.price)}</td></tr>`).join("")}<tr><td><b>Total forfaits</b></td><td><b>${euro(r.fixed.total)}</b></td></tr></tbody></table></div>`:`<p class="muted">Aucun forfait sélectionné.</p>`}</div>`;
  }

  function render(){
    renderSteps();
    const renderers=[renderInstallation,renderLogement,renderPoints,renderCircuits,renderTableau,renderResult];
    content.innerHTML=renderers[state.step]();
    $("#prev").disabled=state.step===0;
    $("#next").textContent=state.step===steps.length-1?"Revenir au début":"Suivant →";
    bind();
  }

  function bind(){
    document.querySelectorAll("[data-path]").forEach(el=>{
      el.addEventListener("change",()=>{
        let v;
        if(el.type==="checkbox") v=el.checked;
        else if(el.type==="number") v=el.value==="" ? "" : Number(el.value);
        else v=el.value;
        set(el.dataset.path,v);
        save(false); render();
      });
    });
    document.querySelectorAll("[data-set]").forEach(el=>{
      el.addEventListener("click",()=>{set(el.dataset.set,el.dataset.value);save(false);render();});
    });
    document.querySelectorAll("[data-catalog-brand]").forEach(el=>{
      el.addEventListener("change",()=>{
        const cfg=familyCfg(el.dataset.catalogBrand); cfg.brand=el.value; cfg.gamme=""; cfg.choiceId="";
        save(false);render();
      });
    });
    document.querySelectorAll("[data-catalog-gamme]").forEach(el=>{
      el.addEventListener("change",()=>{
        const cfg=familyCfg(el.dataset.catalogGamme); cfg.gamme=el.value; cfg.choiceId="";
        save(false);render();
      });
    });
    document.querySelectorAll("[data-catalog-choice]").forEach(el=>{
      el.addEventListener("change",()=>{
        const cfg=familyCfg(el.dataset.catalogChoice); cfg.choiceId=el.value;
        save(false);render();
      });
    });
    document.querySelectorAll("[data-apply-global]").forEach(el=>{
      el.addEventListener("click",()=>{
        const g=state.appareillage.global||{brand:"moyen",gamme:""};
        CS.familyKeys().forEach(key=>{
          const cfg=familyCfg(key); cfg.brand=g.brand||"moyen"; cfg.choiceId="";
          if(cfg.brand==="moyen") cfg.gamme="";
          else cfg.gamme=CS.gammes(key,cfg.brand).includes(g.gamme)?g.gamme:"";
        });
        save(false);render();toast("Choix global appliqué. Chaque famille reste modifiable indépendamment.","ok");
      });
    });
    document.querySelectorAll("[data-step]").forEach(el=>{
      el.addEventListener("click",()=>{state.step=Number(el.dataset.step);save(false);render();});
    });
  }

  $("#saveBtn").addEventListener("click",()=>save(true));
  $("#calcBtn").addEventListener("click",()=>{state.step=steps.length-1;save(false);render();toast("Calcul de validation effectué.","ok");});
  $("#prev").addEventListener("click",()=>{state.step=Math.max(0,state.step-1);save(false);render();window.scrollTo({top:0,behavior:"smooth"});});
  $("#next").addEventListener("click",()=>{state.step=state.step===steps.length-1?0:Math.min(steps.length-1,state.step+1);save(false);render();window.scrollTo({top:0,behavior:"smooth"});});

  render();
})();