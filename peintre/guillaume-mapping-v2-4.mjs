// Correspondances EXPLICITES entre 64 options existantes et références PDF.
// Une option sans correspondance fiable reste manuelle. On ne convertit jamais les unités.
import {GUILLAUME_BAREME} from './guillaume-bareme-v2-4.mjs';
import {OPTION_CATEGORIES} from './options-catalog-v2.mjs';

const matchPairs=[
 ['op0-0',1,8],['op0-1',1,9],['op0-2',1,10],['op0-3',1,11],['op0-4',1,12],['op0-5',1,12],
 ['op1-0',1,13],['op1-1',1,14],['op1-2',1,15],['op1-3',1,16],['op1-4',1,17],
 ['op1-5',1,18],['op1-6',1,19],['op1-7',1,20],['op1-8',1,22],['op1-10',1,23],['op1-11',1,24],['op1-12',1,25],
 ['op2-0',2,14],['op2-1',1,27],['op2-2',1,28],['op2-3',1,29],['op2-4',2,2],['op2-5',2,3],
 ['op2-6',2,4],['op2-7',1,32],['op2-8',2,13],['op2-9',2,5],['op2-10',1,35],['op2-11',1,36],['op2-12',1,37],
 ['op3-0',1,38],['op3-1',2,6],['op3-2',1,40],['op3-4',1,42],['op3-5',1,46],['op3-6',1,47],['op3-7',1,48],
 ['op4-0',1,49],['op4-1',1,50],['op4-2',1,51],['op4-3',1,53],['op4-4',1,54],['op4-5',1,55],
 ['op4-6',1,56],['op4-7',1,57],['op4-8',1,58],['op4-9',1,59],['op4-10',1,60],['op4-11',1,61],
 ['op5-0',2,17],['op5-1',2,10],['op5-2',2,11],['op5-3',1,63],['op5-4',1,64],
 ['op5-5',2,19],['op5-6',2,20],['op5-7',1,67],['op5-8',2,12],['op5-9',2,25],['op5-10',2,21],['op5-11',2,22]
];
const fmt=(source,num)=>'guillaume-'+(source===1?'p1':'p2')+'-'+String(num).padStart(2,'0');
export const GENERIC_BAREME_MATCH = Object.freeze(Object.fromEntries(matchPairs.map(([id,source,row])=>[id,fmt(source,row)])));
const byId=new Map(GUILLAUME_BAREME.map(x=>[x.id,x]));
export function referenceForOption(option){
 return byId.get(GENERIC_BAREME_MATCH[option.id]||option.id)||null;
}
export const BAREME_OPTION_GROUPS=Object.freeze([
 {name:'Barème Guillaume — surfaces (m²)',unit:'m²'},
 {name:'Barème Guillaume — linéaires (ml)',unit:'ml'},
 {name:'Barème Guillaume — à l’unité',unit:'unité'},
 {name:'Barème Guillaume — forfaits',unit:'forfait'}
].map(g=>Object.freeze({...g,items:Object.freeze(GUILLAUME_BAREME.filter(x=>x.unit===g.unit).map(x=>Object.freeze({
 id:x.id,label:x.label,unit:x.unit,materialUnitHT:x.materialUnitHT,hoursPerUnit:x.hoursPerUnit,notes:x.notes,source:x.source,sourcePage:x.sourcePage,
 sourceRow:x.sourceRow,indicative:true
})))})));
const equivalentIds=Object.freeze({
 'plinth-paint':['guillaume-p1-30','guillaume-p2-02'],
 'housing-paint':['guillaume-p1-31','guillaume-p2-04'],
 'pipe-paint':['guillaume-p1-34','guillaume-p2-05'],
 'moulding-install':['guillaume-p1-39','guillaume-p2-06'],
 'cornice-install':['guillaume-p1-41','guillaume-p2-07'],
 'radiator-paint':['guillaume-p1-33','guillaume-p2-13'],
 'door-paint':['guillaume-p1-26','guillaume-p2-14'],
 'floor-marking':['guillaume-p1-57','guillaume-p2-09'],
 'deep-clean':['guillaume-p1-65','guillaume-p2-19'],
 'waste':['guillaume-p1-66','guillaume-p2-20'],
 'wallpaper-removal':['guillaume-p1-67','guillaume-p2-24'],
 'protect-furniture':['guillaume-p1-64','guillaume-p2-17']
});
const keyById=new Map(Object.entries(equivalentIds).flatMap(([key,ids])=>ids.map(id=>[id,key])));
export function serviceKey(optionOrExtra){
 const id=optionOrExtra?.catalogId||optionOrExtra?.id||'';
 const reference=GENERIC_BAREME_MATCH[id]||id;
 return keyById.get(reference)||reference;
}
export function alreadySelected(option,extras){
 const key=serviceKey(option);
 return extras.some(x=>serviceKey(x)===key);
}
export function createExtra(option){
 const ref=referenceForOption(option);
 return {
  catalogId:option.id,serviceKey:serviceKey(option),name:ref?ref.label:option.label,
  unit:ref?.unit||option.unit||'forfait',quantity:1,
  materialUnitHT:ref?.materialUnitHT??'',hoursPerUnit:ref?.hoursPerUnit??'',
  notes:ref?.notes||'',referenceId:ref?.id||null,
  referenceSource:ref?.source||null,referenceRow:ref?.sourceRow||null,
  indicative:Boolean(ref),sourceAccepted:false
 };
}
export function matchesCatalogCount(){
 return OPTION_CATEGORIES.flatMap(g=>g.items).filter(o=>referenceForOption(o)).length;
}
