'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.SpeedArtiPlaquisteAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const ADAPTER_VERSION='1.6.2';
  const BUSINESS_SCHEMA='1.6.1';
  const CONTRACT='speedarti-plaquiste-bridge-v1';

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function finite(v){return Number.isFinite(Number(v));}
  function positive(v){return finite(v)&&Number(v)>0;}
  function assertObject(value,label){if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(label+' invalide');}
  function freezeCheck(before,value,label){if(JSON.stringify(value)!==before)throw new Error(label+' a été modifié par l’adaptateur');}
  function unique(values){return [...new Set(values)];}

  function catalogueEntry(map,material){
    if(!map||typeof map!=='object')return null;
    return map[material.name]||map[material.catalogueKey||'']||null;
  }

  function materialDrafts(result,catalogueMap){
    return (result.materials||[]).map((m,index)=>{
      const mapping=catalogueEntry(catalogueMap,m);
      const billable=m.billable!==false;
      return {
        source_index:index,
        source_name:m.name,
        billable,
        article_id:mapping?.article_id||null,
        catalogue_item:mapping?.catalogue_item||null,
        categorie:mapping?.categorie||null,
        quantite_theorique:finite(m.qty)?Number(m.qty):null,
        quantite_avec_perte:finite(m.qty)?Number(m.qty):null,
        quantite_finale:finite(m.qty)?Number(m.qty):null,
        unite:m.unit||null,
        prix_unitaire_ht:finite(m.unitPrice)?Number(m.unitPrice):null,
        total_ht:finite(m.total)?Number(m.total):null,
        taux_tva:finite(m.vat)?Number(m.vat):null,
        stock_disponible:0,
        a_commander:finite(m.qty)?Number(m.qty):null,
        coef_perte_applique:0,
        conditionnement:mapping?.conditionnement??null,
        notes:m.note||null,
        mapping_status:mapping?.article_id?'MAPPED':'MAPPING_REQUIRED'
      };
    });
  }

  function geometryCompatibility(state){
    const issues=[];
    const pieces=(state.pieces||[]).map(p=>{
      const wallIds=(p.walls||[]).map(w=>String(w.id));
      const dynamicWalls=wallIds.some(id=>!['A','B','C','D'].includes(id))||wallIds.length!==4;
      if(dynamicWalls)issues.push({
        code:'PLQ-PROD-DYNAMIC-WALLS',
        severity:'BLOCKING',
        piece_id:p.id,
        message:'Le contrat MurConfig du SpeedArti actuel limite les IDs à A/B/C/D ; cette pièce '+(p.shape||'rectangle')+' contient '+wallIds.length+' murs.'
      });
      if((p.shape||'rectangle')!=='rectangle')issues.push({
        code:'PLQ-PROD-NON_RECTANGULAR_CEILING',
        severity:'BLOCKING',
        piece_id:p.id,
        message:'Le calculateur SpeedArti actuel recalcule encore le plafond par longueur × largeur ; la surface réelle '+(p.shape||'')+' doit rester celle du moteur V1.6.1.'
      });
      return {
        id:p.id,
        nom:p.name,
        shape:p.shape||'rectangle',
        longueur:p.length,
        largeur:p.width,
        hauteur:p.height,
        shapeA:p.shapeA??null,
        shapeB:p.shapeB??null,
        traiter_murs:(p.walls||[]).some(w=>w.active),
        traiter_plafond:!!p.ceiling?.active,
        murs:(p.walls||[]).map(w=>({
          id:w.id,
          label:w.label,
          actif:!!w.active,
          type:w.type,
          longueur_m:w.length,
          framing:clone(w.framing),
          isolation:clone(w.isolation),
          face1:clone(w.face1),
          face2:clone(w.face2),
          openings:clone(w.openings||[]),
          reinforcementQty:w.reinforcementQty||0,
          outsideAnglesQty:w.outsideAnglesQty||0,
          cuts:!!w.cuts
        })),
        ceiling:clone(p.ceiling)
      };
    });
    return {pieces,issues};
  }

  function buildDonneesChantierDraft(state,options={}){
    assertObject(state,'state');
    const geo=geometryCompatibility(state);
    const rectanglePieces=geo.pieces.filter(p=>p.shape==='rectangle'&&p.murs.length===4&&p.murs.every(w=>['A','B','C','D'].includes(String(w.id))));
    return {
      metier:'plaquiste',
      nom_calcul:state.project?.name||'Chiffrage Plaquiste',
      ...(options.chantierId?{chantier_id:options.chantierId}:{}),
      dimensions:{
        pieces:rectanglePieces.map(p=>({
          id:p.id,
          nom:p.nom,
          longueur:Number(p.longueur)||0,
          largeur:Number(p.largeur)||0,
          hauteur:Number(p.hauteur)||0,
          traiter_murs:p.traiter_murs,
          traiter_plafond:p.traiter_plafond,
          murs:p.murs.map(w=>({id:w.id,label:w.label,actif:w.actif,type:w.type,longueur_m:Number(w.longueur_m)||0}))
        }))
      },
      options:{
        complexite:state.options?.complexity||'moyenne',
        taux_horaire:finite(state.options?.hourlyRate)?Number(state.options.hourlyRate):undefined,
        finition:state.options?.finish||undefined
      },
      _speedarti_bridge:{
        contract:CONTRACT,
        adapter_version:ADAPTER_VERSION,
        business_schema:BUSINESS_SCHEMA,
        source_of_truth:'plaquiste-v1.6.1',
        full_geometry:geo.pieces,
        compatibility_issues:geo.issues
      }
    };
  }

  function resultCompatibility(result,catalogueMap,options={}){
    const mats=materialDrafts(result,catalogueMap);
    const issues=[];
    const billable=mats.filter(m=>m.billable);
    const missingMap=billable.filter(m=>!m.article_id);
    if(missingMap.length)issues.push({
      code:'PLQ-CATALOGUE-MAPPING',
      severity:'BLOCKING',
      count:missingMap.length,
      materials:missingMap.map(m=>m.source_name),
      message:'Des matériaux facturables n’ont pas encore de article_id/code_unique SpeedArti. Aucun identifiant n’est inventé.'
    });
    if(!finite(options.laborVatRate))issues.push({
      code:'PLQ-LABOR-VAT-RATE',
      severity:'BLOCKING',
      message:'Le taux TVA de la main-d’œuvre doit être fourni explicitement par le contexte fiscal SpeedArti.'
    });
    return {materials:mats,issues};
  }

  function buildResultatCalculDraft(result,catalogueMap,options={}){
    assertObject(result,'result');
    const rc=resultCompatibility(result,catalogueMap,options);
    const billable=rc.materials.filter(m=>m.billable);
    const surfaceNette=(Number(result.surfaces?.cladding)||0)+(Number(result.surfaces?.ceiling)||0);
    return {
      surfaces:{
        totale:surfaceNette,
        nette:surfaceNette,
        avec_pertes:surfaceNette,
        detail_par_face:Object.fromEntries((result.wallRows||[]).map((r,i)=>['ouvrage_'+(i+1),Number(r.cladding)||0]))
      },
      materiaux:billable.map(m=>({
        article_id:m.article_id,
        catalogue_item:m.catalogue_item,
        nom:m.source_name,
        categorie:m.categorie,
        quantite_theorique:m.quantite_theorique,
        quantite_avec_perte:m.quantite_avec_perte,
        quantite_finale:m.quantite_finale,
        unite:m.unite,
        prix_unitaire_ht:m.prix_unitaire_ht,
        total_ht:m.total_ht,
        stock_disponible:m.stock_disponible,
        a_commander:m.a_commander,
        coef_perte_applique:m.coef_perte_applique,
        ...(m.conditionnement!=null?{conditionnement:m.conditionnement}:{}),
        notes:m.notes
      })),
      main_oeuvre:{
        temps_estime_heures:Number(result.laborHours)||0,
        decomposition:(result.labor||[]).map(x=>({poste:x.name,temps_heures:Number(x.hours)||0})),
        taux_horaire:positive(options.hourlyRate)?Number(options.hourlyRate):(Number(result.laborHours)>0?Number(result.laborCost)/Number(result.laborHours):0),
        nombre_ouvriers:positive(options.workerCount)?Number(options.workerCount):1,
        cout_total:Number(result.laborCost)||0
      },
      totaux:{
        materiaux_ht:Number(result.materialTotal)||0,
        main_oeuvre_ht:Number(result.laborCost)||0,
        total_ht:Number(result.totalHT)||0,
        tva:Number(result.vat)||0,
        total_ttc:Number(result.totalTTC)||0
      },
      stock_status:{
        disponible:false,
        articles_manquants:billable.filter(m=>m.article_id).map(m=>({article_id:m.article_id,nom:m.source_name,quantite_manquante:Number(m.a_commander)||0}))
      },
      recommandations:[],
      alertes:clone(result.alerts||[]),
      _speedarti_bridge:{
        contract:CONTRACT,
        adapter_version:ADAPTER_VERSION,
        business_schema:BUSINESS_SCHEMA,
        ready:rc.issues.length===0,
        compatibility_issues:rc.issues,
        internal_materials:rc.materials.filter(m=>!m.billable),
        sale_lines:clone(result.sales||[]),
        source_totals:{materialTotal:result.materialTotal,internalMaterialTotal:result.internalMaterialTotal,totalHT:result.totalHT,vat:result.vat,totalTTC:result.totalTTC}
      }
    };
  }

  function buildDevisLines(result,catalogueMap,options={}){
    assertObject(result,'result');
    if(!finite(options.laborVatRate))throw new Error('laborVatRate explicite requis pour générer les lignes de devis');
    const mats=materialDrafts(result,catalogueMap);
    const lines=[];
    mats.filter(m=>m.billable).forEach(m=>{
      if(!m.article_id)throw new Error('article_id manquant pour '+m.source_name);
      if(!finite(m.taux_tva))throw new Error('TVA manquante pour '+m.source_name);
      lines.push({
        source:'material',
        article_id:m.article_id,
        description:m.source_name,
        quantite:m.quantite_finale,
        unite:m.unite,
        prix_unitaire_ht:m.prix_unitaire_ht,
        total_ht:m.total_ht,
        taux_tva:m.taux_tva
      });
    });
    (result.sales||[]).forEach(s=>{
      if(!finite(s.vat))throw new Error('TVA manquante pour forfait '+s.name);
      lines.push({
        source:'sale',
        article_id:null,
        description:s.name,
        quantite:1,
        unite:'forfait',
        prix_unitaire_ht:Number(s.total)||0,
        total_ht:Number(s.total)||0,
        taux_tva:Number(s.vat)
      });
    });
    if(Number(result.laborCost)>0)lines.push({
      source:'labor',
      article_id:null,
      description:'Main-d’œuvre plaquiste',
      quantite:Number(result.laborHours)||1,
      unite:'h',
      prix_unitaire_ht:Number(result.laborHours)>0?Number(result.laborCost)/Number(result.laborHours):Number(result.laborCost),
      total_ht:Number(result.laborCost),
      taux_tva:Number(options.laborVatRate)
    });
    return lines;
  }

  function buildStockCandidates(result,catalogueMap){
    const mats=materialDrafts(result,catalogueMap);
    return mats.filter(m=>m.billable&&m.article_id).map(m=>({
      article_id:m.article_id,
      nom:m.source_name,
      quantite_finale:m.quantite_finale,
      unite:m.unite
    }));
  }

  function buildAngelContext(state,result,options={}){
    return {
      metier:'plaquiste',
      module_version:BUSINESS_SCHEMA,
      adapter_version:ADAPTER_VERSION,
      current_step:options.currentStep??null,
      selected_piece_id:options.selectedPieceId??null,
      selected_wall_id:options.selectedWallId??null,
      project:{name:state.project?.name||null},
      pieces:(state.pieces||[]).map(p=>({id:p.id,name:p.name,shape:p.shape||'rectangle',wall_count:(p.walls||[]).length,ceiling_active:!!p.ceiling?.active})),
      simple_walls:(state.simpleWalls||[]).map(w=>({id:w.id,label:w.label,active:!!w.active,type:w.type})),
      totals:result?{material_ht:result.materialTotal,total_ht:result.totalHT,vat:result.vat,total_ttc:result.totalTTC}:null,
      alerts:clone(result?.alerts||[]),
      blocking:clone(result?.blocking||[]),
      knowledge_base:'plaquiste/angel-knowledge-base.json',
      rule:'Ángel explique et assiste ; il ne recalcule jamais le chiffrage.'
    };
  }

  function buildBridgePackage(state,result,options={}){
    assertObject(state,'state');assertObject(result,'result');
    const stateBefore=JSON.stringify(state),resultBefore=JSON.stringify(result);
    const input=buildDonneesChantierDraft(state,options);
    const output=buildResultatCalculDraft(result,options.catalogueMap||{},options);
    const geometryIssues=input._speedarti_bridge.compatibility_issues;
    const resultIssues=output._speedarti_bridge.compatibility_issues;
    const pkg={
      contract:CONTRACT,
      adapter_version:ADAPTER_VERSION,
      business_schema:BUSINESS_SCHEMA,
      source_of_truth:'Plaquiste V1.6.1 — aucun recalcul métier dans cet adaptateur',
      donnees_chantier_draft:input,
      resultat_calcul_draft:output,
      devis_lines_draft:finite(options.laborVatRate)&&resultIssues.length===0?buildDevisLines(result,options.catalogueMap||{},options):null,
      stock_candidates:buildStockCandidates(result,options.catalogueMap||{}),
      angel_context:buildAngelContext(state,result,options),
      compatibility:{
        ready:geometryIssues.length===0&&resultIssues.length===0,
        blocking:[...geometryIssues,...resultIssues],
        rules:[
          'Aucune géométrie L/T/U ne doit être aplatie en rectangle.',
          'Aucun article_id ne doit être inventé.',
          'Aucun coût interne billable=false ne doit devenir une ligne de devis ou de stock.',
          'La TVA doit rester portée par ligne lors de la création du devis.',
          'Le moteur Plaquiste V1.6.1 reste la source de vérité.'
        ]
      }
    };
    freezeCheck(stateBefore,state,'state');
    freezeCheck(resultBefore,result,'result');
    return pkg;
  }

  function runContractTests(){
    const tests=[];const test=(name,fn)=>{try{fn();tests.push({name,ok:true});}catch(e){tests.push({name,ok:false,error:e.message});}};
    const rectangle={
      schemaVersion:'1.6.1',project:{name:'Test'},options:{complexity:'moyenne',hourlyRate:50,finish:'aucune'},
      pieces:[{id:'p1',name:'Pièce',shape:'rectangle',length:5,width:4,height:2.5,walls:['A','B','C','D'].map(id=>({id,label:'Mur '+id,active:true,type:'cloison',length:id==='A'||id==='C'?5:4,framing:{profile:'M48'},isolation:{active:false},face1:{plate:'BA13'},face2:{plate:'BA13'},openings:[]})),ceiling:{active:false}}],
      simpleWalls:[]
    };
    const result={
      surfaces:{cladding:90,ceiling:0},wallRows:[{cladding:20}],materials:[
        {name:'Plaque BA13',qty:10,unit:'m²',unitPrice:5,total:50,vat:10,billable:true},
        {name:'Enduit interne',qty:2,unit:'kg',unitPrice:4,total:8,vat:10,billable:false}
      ],materialTotal:50,internalMaterialTotal:8,sales:[{name:'Forfait finition',total:20,vat:10}],labor:[{name:'Pose',hours:2}],laborHours:2,laborCost:100,totalHT:170,vat:17,totalTTC:187,alerts:[],blocking:[]
    };
    const map={'Plaque BA13':{article_id:'TEST-BA13',categorie:'plaques'}};
    test('T1 — adaptateur ne modifie ni état ni résultat',()=>{const s=JSON.stringify(rectangle),r=JSON.stringify(result);buildBridgePackage(rectangle,result,{catalogueMap:map,laborVatRate:10});if(JSON.stringify(rectangle)!==s||JSON.stringify(result)!==r)throw new Error('mutation');});
    test('T2 — rectangle 4 murs compatible géométrie actuelle',()=>{const x=geometryCompatibility(rectangle);if(x.issues.length)throw new Error('rectangle bloqué');});
    test('T3 — L/6 murs bloqué plutôt qu’aplati',()=>{const s=clone(rectangle);s.pieces[0].shape='L';s.pieces[0].walls.push({id:'E'},{id:'F'});const x=geometryCompatibility(s);if(!x.issues.some(i=>i.code==='PLQ-PROD-DYNAMIC-WALLS')||!x.issues.some(i=>i.code==='PLQ-PROD-NON_RECTANGULAR_CEILING'))throw new Error('L non protégé');});
    test('T4 — aucun article_id inventé',()=>{const x=resultCompatibility(result,{},{});if(!x.issues.some(i=>i.code==='PLQ-CATALOGUE-MAPPING')||x.materials[0].article_id!==null)throw new Error('mapping inventé');});
    test('T5 — coût interne exclu du devis et du stock',()=>{const d=buildDevisLines(result,map,{laborVatRate:10}),s=buildStockCandidates(result,map);if(d.some(x=>x.description==='Enduit interne')||s.some(x=>x.nom==='Enduit interne'))throw new Error('coût interne exporté');});
    test('T6 — TVA conservée par ligne',()=>{const d=buildDevisLines(result,map,{laborVatRate:10});if(d.find(x=>x.source==='material').taux_tva!==10||d.find(x=>x.source==='sale').taux_tva!==10||d.find(x=>x.source==='labor').taux_tva!==10)throw new Error('TVA perdue');});
    test('T7 — forfaits de vente conservés',()=>{const d=buildDevisLines(result,map,{laborVatRate:10});if(!d.some(x=>x.source==='sale'&&x.description==='Forfait finition'))throw new Error('forfait perdu');});
    test('T8 — package prêt seulement si géométrie + catalogue + TVA résolus',()=>{const p=buildBridgePackage(rectangle,result,{catalogueMap:map,laborVatRate:10});if(!p.compatibility.ready||!p.devis_lines_draft)throw new Error('package non prêt');});
    const failed=tests.filter(t=>!t.ok);return {total:tests.length,passed:tests.length-failed.length,failed:failed.length,results:tests};
  }

  return Object.freeze({
    ADAPTER_VERSION,BUSINESS_SCHEMA,CONTRACT,
    geometryCompatibility,resultCompatibility,
    buildDonneesChantierDraft,buildResultatCalculDraft,buildDevisLines,
    buildStockCandidates,buildAngelContext,buildBridgePackage,runContractTests
  });
});
