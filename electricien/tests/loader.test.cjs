'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'catalogue-en-ligne-loader.js'),'utf8');
const remote=JSON.parse(fs.readFileSync(path.join(root,'catalogue-en-ligne.json'),'utf8'));
async function load(data,fail=false){
  const loaded=[];
  const env={window:{},console:{warn(){},error(){}},AbortSignal,
    fetch:async()=>{if(fail)throw Error('network');return {ok:true,json:async()=>data};},
    document:{createElement:()=>({}),body:{appendChild(el){loaded.push(el.src);queueMicrotask(()=>el.onload());}},querySelector:()=>null}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'catalogue-appareillage.js'),'utf8'),env);
  vm.runInNewContext(code,env);
  await new Promise(resolve=>setTimeout(resolve,20));
  return {env,loaded,status:env.window.SpeedArtiCatalogueEnLigne,items:env.window.SpeedArtiElectricienCatalogue.items};
}
(async()=>{
  const valid=await load(remote);
  assert.equal(valid.status.status,'ready');assert.equal(valid.status.invalid,0);
  const audit=JSON.parse(fs.readFileSync(path.join(root,'AUDIT_REFERENCES_V65.json')));
  assert.equal(valid.items.length,audit.audited);
  assert.deepEqual(valid.loaded,['./catalogue-selector.js','./engine-current.js','./app.js','../shared/field-navigation.js']);
  console.log('PASS complément réel chargé intégralement avant moteur et interface');
  const fallback=await load(null,true);assert.equal(fallback.items.length,258);assert.equal(fallback.status.status,'offline');assert.equal(fallback.loaded.length,4);
  console.log('PASS réseau indisponible : socle historique et interface maintenus sans faux succès');
  const invalid=structuredClone(remote);
  invalid.items=[{...invalid.items[0],'Prix TTC':-5},
    {...invalid.items[0],'Source URL':'https://elec44.fr.evil.example/test'},
    {...invalid.items[0],'Prix HT':Infinity},
    {...invalid.items[0],ID:'ELEC-0001','Référence fabricant':'FAUX'}];
  const rejected=await load(invalid);assert.equal(rejected.status.invalid,4);assert.equal(rejected.items.length,258);
  console.log('PASS prix invalides, fausse origine et collision ID rejetés');
  const schema=await load({...remote,schemaVersion:99});assert.equal(schema.status.status,'offline');assert.equal(schema.items.length,258);
  console.log('PASS schéma inconnu : repli explicite');
})().catch(e=>{console.error(e);process.exitCode=1;});
