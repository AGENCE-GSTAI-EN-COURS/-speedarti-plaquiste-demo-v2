/**
 * SpeedArti — Sélecteur catalogue appareillage Électricien V5
 * Transforme la base multi-gammes 2026 en choix utilisables dans la démo.
 * Aucune donnée de production : catalogue statique de validation GitHub.
 */
(function(){
  const source = window.SpeedArtiElectricienCatalogue || {items:[]};
  const raw = Array.isArray(source.items) ? source.items : [];

  const BRAND_LABELS = {
    "Schneider Electric":"Schneider Electric",
    "Hager":"Hager",
    "Legrand":"Legrand"
  };

  function txt(v){ return String(v == null ? "" : v).trim(); }
  function n(v){ const x=Number(v); return Number.isFinite(x)?x:0; }
  function slug(v){ return txt(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
  function isExterior(i){
    return /ip5[45]|ip6/i.test(i.ip) || ["Mureva Styl","Cubyko","Plexo"].includes(i.gamme);
  }
  function hasWord(i,word){ return `${i.fonction} ${i.modele}`.toLowerCase().includes(word); }

  const items = raw.map((r,idx)=>({
    id: txt(r["ID"]) || `CAT-${idx+1}`,
    brand: txt(r["Marque"]),
    gamme: txt(r["Gamme"]),
    generation: txt(r["Génération"]),
    type: txt(r["Type article"]),
    fonction: txt(r["Fonction"]),
    modele: txt(r["Modèle / variante"]),
    finition: txt(r["Finition / couleur"]),
    postes: Math.max(1,n(r["Nb postes"])||1),
    pose: txt(r["Pose"]),
    ip: txt(r["IP"]),
    ref: txt(r["Référence fabricant"]),
    priceTTC: n(r["Prix TTC"]),
    priceHT: n(r["Prix HT"]) || (n(r["Prix TTC"])?Math.round(n(r["Prix TTC"])/1.2*100)/100:0),
    supplier: txt(r["Fournisseur"]),
    source: txt(r["Source URL"]),
    date: txt(r["Date relevé"]),
    status: txt(r["Statut"]),
    notes: txt(r["Notes"])
  })).filter(i=>i.brand && i.gamme && i.priceHT>0);

  const FAMILY_DEFS = {
    priseSimple:{label:"Prises simples",match:i=>i.fonction==="Prise 2P+T" && !isExterior(i) && !hasWord(i,"double") && !hasWord(i,"triple") && !hasWord(i,"renforc")},
    priseDouble:{label:"Prises doubles",match:i=>i.fonction==="Prise 2P+T" && !isExterior(i) && hasWord(i,"double")},
    priseTriple:{label:"Prises triples",match:i=>i.fonction==="Prise 2P+T" && !isExterior(i) && hasWord(i,"triple")},
    interrupteur:{label:"Interrupteurs / commandes",match:i=>!isExterior(i) && ["Va-et-vient","Poussoir","Permutateur","Interrupteur / poussoir","Va-et-vient / poussoir"].includes(i.fonction)},
    rj45:{label:"Prises RJ45",match:i=>!isExterior(i) && i.fonction==="Prise RJ45"},
    tv:{label:"Prises TV",match:i=>!isExterior(i) && i.fonction.startsWith("Prise TV")},
    volet:{label:"Commandes volets roulants",match:i=>!isExterior(i) && i.fonction==="Commande volet roulant"},
    vmc:{label:"Commandes VMC",match:i=>!isExterior(i) && i.fonction==="Commande VMC"},
    priseExtSimple:{label:"Prises extérieures simples",match:i=>isExterior(i) && i.fonction==="Prise 2P+T" && !hasWord(i,"double") && !hasWord(i,"triple") && !hasWord(i,"renforc")},
    priseExtDouble:{label:"Prises extérieures doubles",match:i=>isExterior(i) && i.fonction==="Prise 2P+T" && hasWord(i,"double")},
    priseExtTriple:{label:"Prises extérieures triples",match:i=>isExterior(i) && i.fonction==="Prise 2P+T" && hasWord(i,"triple")},
    interExt:{label:"Interrupteurs extérieurs",match:i=>isExterior(i) && i.fonction==="Va-et-vient"}
  };

  const ACCESSORY_FUNCTION = {
    priseSimple:"prise", priseDouble:"prise", priseTriple:"prise",
    interrupteur:"commande", rj45:"rj45", tv:"tv", volet:"volet", vmc:"vmc",
    priseExtSimple:"prise", priseExtDouble:"prise", priseExtTriple:"prise", interExt:"commande"
  };

  function familyBaseItems(key){
    const def=FAMILY_DEFS[key]; if(!def) return [];
    return items.filter(i=>def.match(i) && ["Complet","Semi-complet","Mécanisme"].includes(i.type));
  }
  function sameGamme(a,b){ return txt(a.gamme)===txt(b.gamme) && txt(a.generation)===txt(b.generation); }
  function platesFor(base){
    return items.filter(p=>p.brand===base.brand && sameGamme(p,base) && p.type==="Plaque" && p.postes===base.postes);
  }
  function finishKey(v){
    const x=txt(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const keys=["blanc","noir","anthracite","titane","dune","aluminium","alu","bronze","champagne","taupe","rose","vert","gris","laiton","inox","basalte","gres","craie"];
    return keys.find(k=>x.includes(k)) || x;
  }
  function accessoryCandidates(base,key){
    const wanted=ACCESSORY_FUNCTION[key]||"";
    return items.filter(a=>a.brand===base.brand && sameGamme(a,base) && a.type==="Enjoliveur" && a.fonction.toLowerCase().includes(wanted));
  }
  function accessoryFor(base,key,plate){
    const arr=accessoryCandidates(base,key);
    if(!arr.length) return null;
    const finish=finishKey(plate?.finition);
    return arr.find(a=>finishKey(a.finition)===finish) || null;
  }
  function directChoice(base,key){
    return {
      id:base.id, family:key, exact:true, components:[base], price:base.priceHT,
      brand:base.brand,gamme:base.gamme,finition:base.finition||"Standard",ref:base.ref,
      type:base.type,
      label:`${base.gamme} · ${base.modele||base.fonction}${base.finition?` · ${base.finition}`:""} · réf. ${base.ref}`,
      source:base.source||base.supplier||"Catalogue 2026",
      note:base.type==="Semi-complet"?"Référence semi-complète : plaque ajoutée si sélectionnée dans la composition.":base.notes
    };
  }
  function assembliesFor(base,key){
    if(base.type==="Complet") return [directChoice(base,key)];
    const plates=platesFor(base);
    // Si la gamme ne propose aucune plaque dans notre base, garder le composant comme sélection partielle explicite.
    if(!plates.length){
      const c=directChoice(base,key); c.exact=false; c.partial=true; c.note="Composition incomplète : plaque/cadre compatible absent de la base de démo."; return [c];
    }
    const needsAccessory=base.type==="Mécanisme" && accessoryCandidates(base,key).length>0;
    const out=[];
    plates.forEach(plate=>{
      const acc=base.type==="Mécanisme" ? accessoryFor(base,key,plate) : null;
      // Ne jamais fabriquer une composition mélangeant des finitions incompatibles.
      if(needsAccessory && !acc) return;
      const comps=[base]; if(acc) comps.push(acc); comps.push(plate);
      const price=Math.round(comps.reduce((s,x)=>s+x.priceHT,0)*100)/100;
      const refs=comps.map(x=>x.ref).filter(Boolean).join(" + ");
      out.push({
        id:comps.map(x=>x.id).join("+"),family:key,exact:true,partial:false,components:comps,price,
        brand:base.brand,gamme:base.gamme,finition:plate.finition||base.finition||"Standard",ref:refs,
        type:"Composition",
        label:`${base.gamme} · ${base.modele||base.fonction} · ${plate.finition||"plaque standard"} · ${refs}`,
        source:base.source||plate.source||base.supplier||"Catalogue 2026",
        note:`Composition : ${comps.map(x=>`${x.type} ${x.ref}`).join(" + ")}`
      });
    });
    if(out.length) return out;
    const c=directChoice(base,key); c.exact=false; c.partial=true; c.note="Composition incomplète : aucun enjoliveur/plaque de finition compatible n'est présent dans la base de démo."; return [c];
  }
  function choices(key,brand="",gamme=""){
    let arr=familyBaseItems(key);
    if(brand) arr=arr.filter(i=>i.brand===brand);
    if(gamme) arr=arr.filter(i=>i.gamme===gamme);
    const out=[];
    arr.forEach(base=>assembliesFor(base,key).forEach(c=>out.push(c)));
    const seen=new Set();
    return out.filter(c=>{ if(seen.has(c.id)) return false; seen.add(c.id); return true; })
      .sort((a,b)=>a.brand.localeCompare(b.brand)||a.gamme.localeCompare(b.gamme)||a.price-b.price||a.label.localeCompare(b.label));
  }
  function brands(key){ return [...new Set(familyBaseItems(key).map(i=>i.brand))].sort(); }
  function gammes(key,brand){ return [...new Set(familyBaseItems(key).filter(i=>!brand||i.brand===brand).map(i=>i.gamme))].sort(); }
  function allGammes(brand){ return [...new Set(items.filter(i=>i.brand===brand).map(i=>i.gamme))].sort(); }
  function average(list){ const valid=list.filter(c=>c.exact&&!c.partial); return valid.length?Math.round(valid.reduce((s,c)=>s+c.price,0)/valid.length*100)/100:null; }
  function getCfg(state,key){ return state?.appareillage?.families?.[key] || {brand:"moyen",gamme:"",choiceId:""}; }
  function resolve(state,key){
    const cfg=getCfg(state,key); const brand=cfg.brand||"moyen";
    if(brand==="moyen"){
      const list=choices(key); return {price:average(list),exact:false,brand:"Prix moyen",gamme:"Toutes gammes",ref:"",label:`Prix moyen ${FAMILY_DEFS[key]?.label||key}`,source:"Catalogue multi-gammes 2026 — moyenne générale"};
    }
    const list=choices(key,brand,cfg.gamme||"");
    const picked=cfg.choiceId ? list.find(c=>c.id===cfg.choiceId) : null;
    if(picked) return picked;
    return {price:average(list),exact:false,brand,gamme:cfg.gamme||"Toutes gammes",ref:"",label:`Moyenne ${brand}${cfg.gamme?` · ${cfg.gamme}`:""}`,source:"Catalogue multi-gammes 2026 — moyenne de la sélection"};
  }
  function socketDistribution(state,total){
    const d=state?.appareillage?.socketDistribution||{};
    const double=Math.max(0,Math.floor(n(d.double)));
    const triple=Math.max(0,Math.floor(n(d.triple)));
    const used=double*2+triple*3;
    const simple=Math.max(0,Math.floor(n(total)-used));
    return {simple,double,triple,used,points:n(total),valid:used<=n(total),remaining:n(total)-used};
  }

  window.ElectricienCatalogueSelector={
    items,FAMILY_DEFS,BRAND_LABELS,brands,gammes,allGammes,choices,resolve,socketDistribution,
    familyKeys:()=>Object.keys(FAMILY_DEFS)
  };
})();
