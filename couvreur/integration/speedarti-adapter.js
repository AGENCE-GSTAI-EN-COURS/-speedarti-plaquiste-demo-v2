(function(root){
  const clone=x=>JSON.parse(JSON.stringify(x??null));
  const physicalSafety=new Set(['anchors']);

  function selectedProduct(state){
    const API=root.SpeedArtiCouvreurReal;
    return API?.roofProducts?.find(p=>p.id===state?.options?.product_id)||null;
  }

  function buildDonneesChantierDraft(state){
    const p=selectedProduct(state);
    const vp=root.SpeedArtiCouvreurReal?.getVeluxProduct?.(state?.options?.velux_product_id)||null;
    return {
      metier:'couvreur',
      nom_calcul:state?.nom_calcul||'',
      chantier_id:state?.chantier_id,
      dimensions:clone(state?.dimensions||{}),
      options:{
        ...clone(state?.options||{}),
        roof_product_id:p?.id||null,
        fabricant_tuile:p?.manufacturer||null,
        modele_tuile:p?.model||null,
        catalogue_source:p?.source||null
      },
      _integration:{
        schema:'couvreur-demo-0.3.0',
        requires_production_contract_extension:true,
        reason:'Ne pas rabattre surface_toiture et le modèle exact sur les anciens champs génériques.'
      }
    };
  }

  function buildResultatCalculDraft(result,mapping={}){
    const missing=[];
    const materiaux=(result?.materiaux||[]).map(m=>{
      const map=mapping[m.id]||{};
      const isSafety=m.category==='Sécurité';
      const stockPhysical=!isSafety||physicalSafety.has(m.id);
      const articleId=map.article_id||map.code_unique||null;
      if(stockPhysical&&!articleId)missing.push({role:m.id,nom:m.label});
      return {
        article_id:articleId,
        nom:m.label,
        categorie:m.category,
        quantite_theorique:m.quantity,
        quantite_avec_perte:m.quantity,
        quantite_finale:m.quantity,
        unite:m.unit,
        prix_unitaire_ht:m.unit_price_ht,
        total_ht:m.total_ht,
        stock_disponible:0,
        a_commander:stockPhysical?m.quantity:0,
        coef_perte_applique:1,
        notes:[m.source,m.note,m.product_reference?('Réf. fabricant '+m.product_reference):''].filter(Boolean).join(' — '),
        _stock_physical:stockPhysical
      };
    });
    return {
      resultat:{
        surfaces:clone(result?.surfaces),
        materiaux,
        main_oeuvre:{
          temps_estime_heures:result?.main_oeuvre?.temps_estime_heures||0,
          decomposition:clone(result?.main_oeuvre?.decomposition||[]),
          taux_horaire:result?.main_oeuvre?.taux_horaire||0,
          nombre_ouvriers:result?.main_oeuvre?.nombre_ouvriers||1,
          cout_total:result?.main_oeuvre?.cout_total||0,
          heures_homme:result?.main_oeuvre?.heures_homme||0
        },
        totaux:{
          materiaux_ht:result?.totaux?.materiaux_ht||0,
          main_oeuvre_ht:result?.totaux?.main_oeuvre_ht||0,
          total_ht:result?.totaux?.total_ht||0,
          tva:result?.totaux?.tva||0,
          total_ttc:result?.totaux?.total_ttc||0
        },
        stock_status:{disponible:false,articles_manquants:[]},
        recommandations:clone(result?.recommandations||[]),
        alertes:(result?.alertes||[]).map(a=>typeof a==='string'?a:a.message),
        _couvreur_technical:clone(result?.technical||{})
      },
      compatibility:{
        ready_for_stock:missing.length===0,
        ready_for_save:true,
        missing_catalogue_ids:missing,
        rule:'Ne pas réserver le stock sans article_id/code_unique réel.'
      }
    };
  }

  function buildStockCandidates(adapted){
    return (adapted?.resultat?.materiaux||[])
      .filter(m=>m._stock_physical&&m.article_id)
      .map(m=>({article_id:m.article_id,nom_article:m.nom,quantite_reservee:m.quantite_finale}));
  }

  function buildAngelContext(state,result){
    const p=selectedProduct(state);
    return {
      metier:'couvreur',
      module_version:'0.3.0',
      nom_calcul:state?.nom_calcul||'',
      produit:p?{id:p.id,fabricant:p.manufacturer,modele:p.model,famille:p.family,source:p.source}:null,
      fenetre_toit:vp?{id:vp.id,fabricant:'VELUX',modele:vp.model,gamme:vp.range,dimension:vp.size_code,largeur_cm:vp.width_cm,hauteur_cm:vp.height_cm,prix_artisan_estime_ht:vp.artisan_ht}:null,
      dimensions:clone(state?.dimensions||{}),
      options:clone(state?.options||{}),
      technical:clone(result?.technical||{}),
      totaux:clone(result?.totaux||{}),
      alertes:clone(result?.alertes||[]),
      knowledge_source:'couvreur/angel-knowledge-base.json',
      rule:'Ángel explique le contexte ; il ne recalcule pas silencieusement le chantier.'
    };
  }

  function runContractTests(){
    const state={metier:'couvreur',nom_calcul:'Test',dimensions:{surface_toiture:100,longueur_faitiere:0,longueur_egout:0},options:{product_id:'x',tuiles_par_m2_retenu:12}};
    const before=JSON.stringify(state);
    const draft=buildDonneesChantierDraft(state);
    const tests=[];
    tests.push({name:'non_mutation_state',ok:JSON.stringify(state)===before});
    tests.push({name:'no_hidden_10m_defaults',ok:draft.dimensions.longueur_faitiere===0&&draft.dimensions.longueur_egout===0});
    tests.push({name:'surface_toiture_preserved',ok:draft.dimensions.surface_toiture===100});
    const rr=buildResultatCalculDraft({surfaces:{totale:100,nette:100,avec_pertes:100},materiaux:[{id:'roof_tiles',label:'Tuile X',category:'Couverture',quantity:1200,unit:'u',unit_price_ht:1,total_ht:1200}],main_oeuvre:{temps_estime_heures:10,decomposition:[],taux_horaire:50,nombre_ouvriers:2,cout_total:1000,heures_homme:20},totaux:{materiaux_ht:1200,main_oeuvre_ht:1000,total_ht:2200,tva:440,total_ttc:2640},alertes:[],recommandations:[],technical:{tiles_per_m2:12}},{});
    tests.push({name:'no_fake_article_id',ok:rr.resultat.materiaux[0].article_id===null});
    tests.push({name:'stock_blocked_without_mapping',ok:rr.compatibility.ready_for_stock===false&&rr.compatibility.missing_catalogue_ids.length===1});
    tests.push({name:'angel_context_uses_engine_result',ok:buildAngelContext(state,{technical:{tiles_per_m2:12}}).technical.tiles_per_m2===12});
    return {total:tests.length,passed:tests.filter(t=>t.ok).length,failed:tests.filter(t=>!t.ok).length,tests};
  }

  root.SpeedArtiCouvreurAdapter={buildDonneesChantierDraft,buildResultatCalculDraft,buildStockCandidates,buildAngelContext,runContractTests,version:'0.3.0'};
})(typeof window!=='undefined'?window:globalThis);
