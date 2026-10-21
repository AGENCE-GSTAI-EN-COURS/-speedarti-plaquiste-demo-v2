'use strict';
// Reproduit l'audit de données ; le statut fournisseur vient du relevé documenté,
// jamais d'une requête automatique ou de l'existence seule d'un prix.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),baseline='f24e5d5b0f66e619b37eeb2dd0904ef42bb03010';
const env={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'catalogue-appareillage.js'),'utf8'),env);
const base=env.window.SpeedArtiElectricienCatalogue.items;
const old=JSON.parse(cp.execFileSync('git',['show',baseline+':electricien/catalogue-en-ligne.json'],{cwd:root}));
const current=JSON.parse(fs.readFileSync(path.join(root,'catalogue-en-ligne.json'),'utf8'));
const key=x=>[x['Marque'],x['Gamme'],x['Génération']||'',x['Référence fabricant'],x['Type article']].join('|').toLowerCase();
function merge(extra){const rows=base.map(x=>({...x}));for(const x of extra){const i=rows.findIndex(b=>key(x)===key(b));if(i<0)rows.push({...x});else rows[i]={...rows[i],...x};}return rows;}
const before=merge(old.items),after=merge(current.items);
const rows=after.map(x=>{
  const b=before.find(b=>b.ID===x.ID),type=x['Type validé']||x['Type article'],verified=x['Vérification']==='fiche-produit',issues=[];
  if(!verified)issues.push('Fiche individuelle / composition à confirmer');
  if(x['Prix TTC']===null)issues.push('Prix exact inconnu');
  if(!['Complet','Composition'].includes(type))issues.push('Composant seul : ne pas chiffrer comme ensemble complet');
  if(x['Type validé']&&type!==x['Type article'])issues.push('Type historique corrigé : '+x['Type article']+' → '+type);
  return {id:x.ID,brand:x.Marque,range:x.Gamme,generation:x['Génération'],function:x.Fonction,finish:x['Finition / couleur'],ref:x['Référence fabricant'],manufacturerRefs:x['Références fabricant']||[],type,ttc:x['Prix TTC'],ht:x['Prix HT'],source:x['Source URL'],date:x['Date relevé'],verified,new:!b,changed:!!b&&JSON.stringify(b)!==JSON.stringify(x),oldTTC:b?.['Prix TTC']??null,issues};
});
const audit={date:current.verifiedAt,startingCommit:baseline,startingEntries:before.length,audited:rows.length,added:rows.filter(r=>r.new).length,updated:rows.filter(r=>r.changed).length,supplierVerified:rows.filter(r=>r.verified).length,unverified:rows.filter(r=>!r.verified).length,unknownPrice:rows.filter(r=>r.ttc===null).length,verifiedPrices:rows.filter(r=>r.verified&&r.ttc!==null).length,changedPrices:rows.filter(r=>r.changed&&r.oldTTC!==r.ttc).length,rows};
fs.writeFileSync(path.join(root,'AUDIT_REFERENCES_V65.json'),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({...audit,rows:undefined}));
