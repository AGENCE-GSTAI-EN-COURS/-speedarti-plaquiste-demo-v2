// SpeedArti Peintre V2.5 — catalogue unique classé selon les SIX familles définies par Guillaume.
// Chaque ligne PDF est associée à une famille, sans septième catégorie "Barème Guillaume".
import {OPTION_CATEGORIES} from './options-catalog-v2.mjs';
import {GUILLAUME_BAREME} from './guillaume-bareme-v2-4.mjs';
import {referenceForOption,serviceKey} from './guillaume-mapping-v2-4.mjs';

export const CATEGORIES=Object.freeze([
 {id:'traitements',name:'Traitements spécifiques'},
 {id:'decorations',name:'Finitions décoratives'},
 {id:'boiseries',name:'Boiseries intérieures'},
 {id:'revetements',name:'Revêtements et décoration complémentaires'},
 {id:'techniques',name:'Prestations techniques et spécialisées'},
 {id:'services',name:'Services complémentaires facturables'}
]);

// Ces indices respectent l'ordre d'apparition dans les PDF de Guillaume.
// PDF peinture.pdf : 67 lignes ; PDF peinture 2.pdf : 25 lignes.
export function categoryForBareme(ref) {
 if(ref.source==='peinture.pdf'){
  const i=ref.sourceRow;
  if(i>=1&&i<=12)return 0;
  if(i<=25)return 1;
  if(i<=37)return 2;
  if(i<=48)return 3;
  if(i<=61)return 4;
  if(i<=67)return 5;
 }
 if(ref.source==='peinture 2.pdf'){
  const i=ref.sourceRow;
  if(i===1)return 0;
  if([2,3,4,5,13,14].includes(i))return 2;
  if([6,7,15].includes(i))return 3;
  if([8,9].includes(i))return 4;
  if(i>=10&&i<=25)return 5;
 }
 throw Error('Référence PDF sans classement : '+ref.id);
}
export function normalizeSearch(text){
 return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr-FR').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}

export function buildClassifiedCatalog(){
 const remaining=new Map(GUILLAUME_BAREME.map(r=>[r.id,r]));
 const groups=CATEGORIES.map((cat,i)=>({...cat,items:[]}));
 // Les 64 options demandées par Guillaume demeurent les intitulés principaux.
 OPTION_CATEGORIES.forEach((cat,i)=>{
  for(const option of cat.items){
   const matched=referenceForOption(option);
   const k=serviceKey(option);
   const variants=[];
   for(const row of remaining.values()){
    if((matched&&row.id===matched.id)||serviceKey(row)===k){
     variants.push(row);
   }
   }
   for(const v of variants)remaining.delete(v.id);
   groups[i].items.push({
    id:option.id,label:option.label,kind:'original',unit:option.unit,
    variants:variants.map(v=>({id:v.id,label:v.label,unit:v.unit,materialUnitHT:v.materialUnitHT,
      hoursPerUnit:v.hoursPerUnit,source:v.source,sourceRow:v.sourceRow,notes:v.notes})),
    searchable:[option.label,...variants.map(v=>v.label)].join(' ')
   });
  }
 });
 // Les références non reprises par une option existante sont visibles DANS leur famille métier.
 for(const row of remaining.values()){
  const cat=categoryForBareme(row);
  groups[cat].items.push({
   id:row.id,label:row.label,kind:'bareme',unit:row.unit,
   variants:[{id:row.id,label:row.label,unit:row.unit,materialUnitHT:row.materialUnitHT,
      hoursPerUnit:row.hoursPerUnit,source:row.source,sourceRow:row.sourceRow,notes:row.notes}],
   searchable:row.label+' '+row.unit
  });
 }
 return groups;
}
export const CLASSIFIED_OPTION_CATEGORIES=Object.freeze(buildClassifiedCatalog().map(g=>Object.freeze({
 ...g,items:Object.freeze(g.items.map(item=>Object.freeze({...item,variants:Object.freeze(item.variants)})))
})));
export function filterCategory(group,query){
 const normalized=normalizeSearch(query);
 if(!normalized)return group.items;
 const tokens=normalized.split(/\s+/);
 return group.items.filter(item=>tokens.every(t=>normalizeSearch(item.searchable).includes(t)));
}
export function coverage(){
 const ids=new Set(CLASSIFIED_OPTION_CATEGORIES.flatMap(g=>g.items.flatMap(i=>i.variants.map(v=>v.id))));
 return {categories:CLASSIFIED_OPTION_CATEGORIES.length,originalItems:CLASSIFIED_OPTION_CATEGORIES.flatMap(g=>g.items).filter(x=>x.kind==='original').length,
   pdfCovered:ids.size,pdfTotal:GUILLAUME_BAREME.length,uncovered:GUILLAUME_BAREME.filter(r=>!ids.has(r.id)).map(r=>r.id)};
}
