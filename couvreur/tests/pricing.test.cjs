const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),sandbox={window:{}};vm.createContext(sandbox);
for(const name of ['catalog.js','catalog-corrections.js','pricing-data.js','pricing.js','velux-catalog.js','engine-real.js','integration/speedarti-adapter.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),sandbox,{filename:name});
const API=sandbox.window.SpeedArtiCouvreurReal,data=sandbox.window.SpeedArtiRoofPrices,calc=new API.CouvreurCalculateur();
const state=(id='edilians-mediane-plus')=>({metier:'couvreur',nom_calcul:'Test tarifs',dimensions:{surface_toiture:100,pente_pourcent:40,longueur_faitiere:10,rive_gauche:5,rive_droite:5},options:{complexite:'moyenne',product_id:id,ecran_sous_toiture:false,liteaux:false,demi_liteaux:false,ventilation_toiture:false,fixations:false,perte_tuiles_pct:0,coefficient_prix:1,marge_materiaux_pct:0,nombre_velux:0},manualPrices:{}});
const boxed=data.accessories.find(a=>a.pieces_per_sale_unit===250&&a.sale_price_ht===24.68);
const near=(a,b)=>assert.ok(Math.abs(a-b)<0.0000011,`${a} ≠ ${b}`);
test('129 modèles conservés ; 101 tarifs professionnels, 21 prix publics, 7 indicatifs',()=>{
 assert.equal(API.roofProducts.length,129);assert.equal(Object.keys(data.model_prices).length,122);
 const infos=API.roofProducts.map(p=>API.getTilePriceInfo(p));
 assert.equal(infos.filter(i=>i.kind==='professional_supplier').length,101);assert.equal(infos.filter(i=>i.kind==='public_market_benchmark').length,21);assert.equal(infos.filter(i=>!i.sourced).length,7);
 for(const p of API.roofProducts){const row=data.model_prices[p.id];if(row)near(API.getTilePriceInfo(p).value,row.professional?.unit_price_ht??row.public_benchmark.unit_price_ht);}
 assert.equal(data.policy.professional_discount_applied,0);assert.equal(data.tile_prices.length,211);
});
test('un autre coloris suffit : Volnay PV et Horizon 12 utilisent les tarifs réels',()=>{
 near(API.getTilePriceInfo(API.roofProducts.find(p=>p.id==='terreal-volnay-pv')).value,4.4287);
 near(API.getTilePriceInfo(API.roofProducts.find(p=>p.id==='terreal-horizon-12')).value,3.1956);
});
test('les prix au mille gardent leur précision jusqu’au total et les prix manuels priment',async()=>{
 const d=state(),r=await calc.calculer(d),row=r.materiaux.find(x=>x.id==='roof_tiles'),pro=data.model_prices[d.options.product_id].professional;
 near(row.unit_price_ht,pro.unit_price_ht);assert.equal(row.total_ht,Math.round(row.quantity*pro.unit_price_ht*100)/100);
 assert.equal(row.price_observed_at,pro.observed_at);
 d.manualPrices[`roof_tiles:${d.options.product_id}`]=0;const override=await calc.calculer(d);assert.equal(override.materiaux.find(x=>x.id==='roof_tiles').total_ht,0);
});
test('les 788 accessoires sont recherchables et chiffrables avec leurs unités',async()=>{
 assert.equal(API.listPricedAccessories().length,788);assert.equal(new Set(data.accessories.map(a=>a.id)).size,788);
 for(const a of data.accessories)assert.ok(API.listPricedAccessories({query:a.label}).some(x=>x.id===a.id));
 const d=state();d.options.priced_accessory_lines=data.accessories.map(a=>({accessory_id:a.id,quantity:2}));
 const r=await calc.calculer(d),rows=r.materiaux.filter(x=>x.catalogue_accessory_id);assert.equal(rows.length,788);
 for(const a of data.accessories){const row=rows.find(x=>x.catalogue_accessory_id===a.id);near(row.unit_price_ht,a.unit_price_ht??a.sale_price_ht);assert.equal(row.unit,a.unit_price_ht!==null?'u':a.sale_unit);assert.equal(row.quantity,2);assert.equal(row.price_observed_at,a.observed_at);}
 const box=rows.find(x=>x.catalogue_accessory_id===boxed.id);near(box.unit_price_ht,24.68/250);assert.equal(box.unit,'u');
 const unknownBox=data.accessories.find(a=>a.sale_unit==='Boîte'&&a.pieces_per_sale_unit===null);assert.equal(rows.find(x=>x.catalogue_accessory_id===unknownBox.id).unit,'Boîte');
});
test('remplacer un poste retire son estimation et conserve la quantité choisie',async()=>{
 const d=state();d.options.priced_accessory_lines=[{accessory_id:boxed.id,quantity:250,replace_role:'ridge_hips'}];
 const r=await calc.calculer(d);assert.ok(!r.materiaux.some(x=>x.id==='ridge_hips'));const a=r.materiaux.find(x=>x.id===`priced_${boxed.id}`);assert.equal(a.quantity,250);assert.equal(a.total_ht,24.68);
 d.manualPrices[`accessory:${boxed.id}`]=0.2;assert.equal((await calc.calculer(d)).materiaux.find(x=>x.id===a.id).total_ht,50);
});
test('accessoire invalide, quantité manquante et doublon ne créent pas de prix inventé',async()=>{
 const d=state();d.options.priced_accessory_lines=[{accessory_id:'inconnu',quantity:1},{accessory_id:boxed.id,quantity:null},{accessory_id:boxed.id,quantity:10}];
 const r=await calc.calculer(d);assert.equal(r.materiaux.filter(x=>x.id.startsWith('priced_')).length,0);assert.ok(r.alertes.some(a=>a.message.includes('Quantité à renseigner')));assert.ok(r.materiaux.some(x=>x.id==='ridge_hips'));
});
test('tous les modèles restent calculables et les totaux se réconcilient',async()=>{
 for(const p of API.roofProducts){const r=await calc.calculer(state(p.id));assert.ok(r.materiaux.some(x=>x.id==='roof_tiles'),p.id);near(r.totaux.materiaux_ht,Math.round(r.materiaux.reduce((s,x)=>s+x.total_ht,0)*100)/100);assert.ok(Number.isFinite(r.totaux.total_ttc));}
});
test('contrat d’intégration préservé : pas de faux article_id ni réservation de stock',async()=>{
 const d=state();d.options.priced_accessory_lines=[{accessory_id:boxed.id,quantity:250}];const r=await calc.calculer(d),adapter=sandbox.window.SpeedArtiCouvreurAdapter,result=adapter.buildResultatCalculDraft(r);
 assert.ok(result.resultat.materiaux.every(x=>x.article_id===null));assert.equal(result.compatibility.ready_for_stock,false);assert.equal(adapter.runContractTests().failed,0);assert.equal(adapter.buildDonneesChantierDraft(d).options.priced_accessory_lines[0].accessory_id,boxed.id);
});
test('les données et exports commerciaux sont anonymisés',async()=>{
 function visit(value){if(Array.isArray(value))return value.forEach(visit);if(value&&typeof value==='object'){for(const [key,v]of Object.entries(value)){assert.ok(!/^(?:reference.*|refpp|reffab|ean|source_url.*|agency)$/i.test(key),key);visit(v);}}else if(typeof value==='string'){assert.ok(!/https?:\/\//i.test(value),value);assert.ok(!/\br[ée]f[.:]/i.test(value),value);}}
 visit(data);
 const d=state();d.options.priced_accessory_lines=[{accessory_id:boxed.id,quantity:250}];const r=await calc.calculer(d);visit(r.materiaux);visit(sandbox.window.SpeedArtiCouvreurAdapter.buildResultatCalculDraft(r).resultat.materiaux);
});
