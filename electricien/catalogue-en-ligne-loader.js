/**
 * SpeedArti Électricien — catalogue vérifié distribué depuis GitHub Pages.
 * Le JSON publié en ligne est le seul fichier modifiable pour les compléments web.
 * Pas de scraping au navigateur ni de prétention à un prix fournisseur en temps réel.
 * Si le JSON est inaccessible, le catalogue historique reste utilisable.
 */
(function(){
  const base=window.SpeedArtiElectricienCatalogue||{items:[]};
  window.SpeedArtiElectricienCatalogue=base;
  window.SpeedArtiCatalogueEnLigne={status:"loading",added:0,updated:0,verifiedAt:null};
  const modules=["./catalogue-selector.js","./engine-current.js","./app.js","../shared/field-navigation.js"];

  function validateRow(x){
    return x&&typeof x==="object"&&
      ["ID","Marque","Gamme","Fonction","Référence fabricant","Source URL"].every(k=>typeof x[k]==="string"&&x[k].trim()) &&
      /^https:\/\/(www\.)?(123elec\.com|elec44\.fr)\//i.test(x["Source URL"]) &&
      (
        (x["Prix TTC"]===null && x["Prix HT"]===null) ||
        (typeof x["Prix TTC"]==="number" && x["Prix TTC"]>0 &&
          typeof x["Prix HT"]==="number" && x["Prix HT"]>0 &&
          Math.abs(x["Prix TTC"]/1.2-x["Prix HT"])<.02)
      );
  }
  function key(x){
    return [x["Marque"],x["Gamme"],x["Génération"]||"",x["Référence fabricant"],x["Type article"]]
      .map(v=>String(v).trim().toLowerCase()).join("|");
  }
  function loadNextScripts(){
    return modules.reduce((previous,url)=>previous.then(()=>new Promise((resolve,reject)=>{
      const el=document.createElement("script");
      el.src=url;el.onload=resolve;el.onerror=()=>reject(new Error("Module introuvable: "+url));
      document.body.appendChild(el);
    })),Promise.resolve());
  }
  (async()=>{
    try{
      const res=await fetch("./catalogue-en-ligne.json",{cache:"no-cache"});
      if(!res.ok)throw Error("HTTP "+res.status);
      const remote=await res.json();
      if(!Array.isArray(remote.items)||remote.schemaVersion!==1)throw Error("Schéma catalogue incompatible");
      const seen=new Map(base.items.map((item,index)=>[key(item),index]));
      let added=0,updated=0,invalid=0;
      remote.items.forEach(item=>{
        if(!validateRow(item)){invalid++;return;}
        const k=key(item),current=seen.get(k);
        if(current!==undefined){
          base.items[current]={...base.items[current],...item};
          updated++;
        }else{
          seen.set(k,base.items.length);base.items.push(item);added++;
        }
      });
      window.SpeedArtiCatalogueEnLigne={status:"ready",added,updated,invalid,verifiedAt:remote.verifiedAt};
    }catch(error){
      window.SpeedArtiCatalogueEnLigne={status:"offline",added:0,updated:0,
        verifiedAt:base.generatedAt||null,message:"Complément catalogue en ligne indisponible : base historique utilisée."};
      console.warn("SpeedArti catalogue:",error.message);
    }
    await loadNextScripts();
  })().catch(error=>{
    console.error("SpeedArti Électricien : chargement impossible",error);
    const output=document.querySelector("#content");
    if(output)output.textContent="Impossible de charger le module Électricien. Réessayez après actualisation.";
  });
})();