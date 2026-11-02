import {
  STEPS, defaultState, renderStep, validateStep, newElement, setPath, getPath, num, calculate
} from './core.js';
import { SpeedArtiAngelMaconKnowledge } from './angel-knowledge.js';
import './speedarti-integration.js';

const STORAGE_KEY='speedarti-macon-demo-v2-catalogue';
const TRUCK_PREF_KEY='speedarti-macon-truck-default';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function cloneDefault(){ return structuredClone(defaultState()); }
function loadState(){
  const base=cloneDefault();
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    const truck=Number(localStorage.getItem(TRUCK_PREF_KEY));
    const state=saved?{...base,...saved,globals:{...base.globals,...saved.globals},simple:{...base.simple,...saved.simple}}:base;
    state.step=0;
    if(state.simpleType==='escalier')state.simpleType='murs';
    state.elements=(state.elements||[]).filter(e=>e.type!=='escalier');
    for(const e of state.elements)if(e.type==='ouvrage_ba'&&['escalier_ba','paillasse_escalier','palier_ba'].includes(e.data?.workRef))e.data.workRef='beton_proprete';
    if(Number.isFinite(truck)&&truck>0)state.globals.truckPrice=truck;
    return state;
  }catch{return base;}
}
function saveState(){
  const snapshot={...state,result:null};
  delete snapshot.step;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot));
  if(state.globals.saveTruckPrice&&num(state.globals.truckPrice)>0)localStorage.setItem(TRUCK_PREF_KEY,String(num(state.globals.truckPrice)));
}

let state=loadState();

function renderSteps(){
  $('#stepsNav').innerHTML=STEPS.map((s,i)=>{
    const back=i<=state.step?` data-step-nav="${i}" role="button" tabindex="0" title="Aller à l’étape ${i+1}"`:'';
    return `<div class="step-chip ${i===state.step?'active':i<state.step?'done':''}"${back}><span class="num">${i<state.step?'✓':i+1}</span>${s}</div>`;
  }).join('');
}
function render(){
  renderSteps();
  $('#stepHost').innerHTML=renderStep(state);
  globalThis.SpeedArtiAngelMaconContext=SpeedArtiAngelMaconKnowledge.buildContext(state,calculate(state));
  $('#prevBtn').disabled=state.step===0;
  $('#prevBtn').style.opacity=state.step===0?.45:1;
  $('#nextBtn').textContent=state.step===STEPS.length-1?'Recalculer':state.step===STEPS.length-2?'Voir le résultat':'Suivant →';
  $('#footerNote').textContent=state.mode==='simple'?'Mode simple — un ouvrage':'Mode multiple — plusieurs éléments cumulés';
  bindEvents();
}

function normalizeValue(el){
  if(el.type==='checkbox')return el.checked;
  if(el.type==='number')return el.value;
  return el.value;
}
function bindDataField(el,obj,path,rerender=false){
  const dynamicNumberPaths=new Set(['braceQty','rows','microDepth']);
  const commit=()=>{
    const value=normalizeValue(el);
    setPath(obj,path,value);
    if(path==='stack'){if(value&&!(num(obj.stackCount)>0))obj.stackCount=1;if(!value)obj.stackCount=0;}
    if(path==='cap'){if(value&&!(num(obj.capCount)>0))obj.capCount=1;if(!value)obj.capCount=0;}
    saveState();
    return value;
  };
  if(el.type==='number')el.addEventListener('input',commit);
  el.addEventListener('change',()=>{
    commit();
    if(rerender||el.type==='checkbox'||el.tagName==='SELECT'||(el.type==='number'&&dynamicNumberPaths.has(path)))render();
  });
}
function resetSimple(){
  state.simple={openings:[],refOverrides:{},chimneyOverrides:{},count:1,wallKind:'mur',concreteClass:''};
}
function findElement(id){return state.elements.find(e=>e.id===id);}
function splitPair(v){const [id,idx]=String(v).split(':');return [id,Number(idx)];}

function bindEvents(){
  $$('input[type="number"]').forEach(el=>el.addEventListener('focus',()=>{try{el.select()}catch{}}));
  $$('[data-step-nav]').forEach(el=>{
    const go=()=>{const target=Number(el.dataset.stepNav);if(Number.isInteger(target)&&target>=0&&target<=state.step){state.step=target;saveState();render();scrollWizardTop();}};
    el.onclick=go;
    el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};
  });
  $$('[data-mode]').forEach(b=>b.onclick=()=>{
    state.mode=b.dataset.mode;
    if(state.mode==='simple')state.elements=[]; else resetSimple();
    saveState();render();
  });
  $$('[data-simple-type]').forEach(b=>b.onclick=()=>{
    state.simpleType=b.dataset.simpleType;
    resetSimple();saveState();render();
  });
  $$('[data-add-element]').forEach(b=>b.onclick=()=>{
    const el=newElement(b.dataset.addElement); if(el)state.elements.push(el);
    saveState();render();
  });
  $$('[data-remove-element]').forEach(b=>b.onclick=()=>{
    state.elements=state.elements.filter(e=>e.id!==b.dataset.removeElement);
    saveState();render();
  });

  $$('[data-simple]').forEach(el=>bindDataField(el,state.simple,el.dataset.simple,false));
  $$('[data-global]').forEach(el=>bindDataField(el,state.globals,el.dataset.global,false));
  $$('[data-root-field]').forEach(el=>bindDataField(el,state,el.dataset.rootField,false));
  $$('[data-el-id][data-field]').forEach(el=>{
    const e=findElement(el.dataset.elId); if(e)bindDataField(el,e.data,el.dataset.field,false);
  });

  $$('[data-add-simple-opening]').forEach(b=>b.onclick=()=>{
    state.simple.openings=state.simple.openings||[];
    state.simple.openings.push({width:'',height:'',associated:''});saveState();render();
  });
  $$('[data-remove-simple-opening]').forEach(b=>b.onclick=()=>{
    state.simple.openings.splice(Number(b.dataset.removeSimpleOpening),1);saveState();render();
  });

  $$('[data-add-opening]').forEach(b=>b.onclick=()=>{
    const e=findElement(b.dataset.addOpening); if(!e)return;
    e.data.openings=e.data.openings||[];e.data.openings.push({type:'seuil_ba',width:'',height:''});saveState();render();
  });
  $$('[data-remove-opening]').forEach(b=>b.onclick=()=>{
    const [id,idx]=splitPair(b.dataset.removeOpening),e=findElement(id);if(!e)return;
    e.data.openings.splice(idx,1);saveState();render();
  });
  $$('[data-add-beam]').forEach(b=>b.onclick=()=>{
    const e=findElement(b.dataset.addBeam);if(!e)return;
    e.data.beams=e.data.beams||[];e.data.beams.push({length:'',widthCm:'',heightCm:'',ref:'poutre_ba_courante'});saveState();render();
  });
  $$('[data-remove-beam]').forEach(b=>b.onclick=()=>{
    const [id,idx]=splitPair(b.dataset.removeBeam),e=findElement(id);if(!e)return;
    e.data.beams.splice(idx,1);saveState();render();
  });
  $$('[data-add-pignon]').forEach(b=>b.onclick=()=>{
    const e=findElement(b.dataset.addPignon);if(!e)return;
    e.data.pignons=e.data.pignons||[];e.data.pignons.push({width:'',slope:''});saveState();render();
  });
  $$('[data-remove-pignon]').forEach(b=>b.onclick=()=>{
    const [id,idx]=splitPair(b.dataset.removePignon),e=findElement(id);if(!e)return;
    e.data.pignons.splice(idx,1);saveState();render();
  });
}

function scrollWizardTop(){const run=()=>{const target=$('#stepsNav')||$('#stepHost');if(target?.scrollIntoView)target.scrollIntoView({behavior:'smooth',block:'start'});else globalThis.scrollTo?.({top:0,behavior:'smooth'});};if(globalThis.requestAnimationFrame)globalThis.requestAnimationFrame(run);else run();}
$('#prevBtn').onclick=()=>{if(state.step>0){state.step--;saveState();render();scrollWizardTop();}};
$('#nextBtn').onclick=()=>{if(state.step===STEPS.length-1){render();scrollWizardTop();return;}const err=validateStep(state,state.step);if(err){alert(err);return;}state.step++;saveState();render();scrollWizardTop();};

render();
