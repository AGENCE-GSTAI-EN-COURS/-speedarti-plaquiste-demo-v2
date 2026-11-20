import fs from 'node:fs';
// Usage: node scripts/build-prices.mjs releves.json contexte-public.json
const [relevePath,publicPath]=process.argv.slice(2);
if(!relevePath||!publicPath)throw new Error('Deux fichiers JSON de relevés et de contexte public sont requis.');
const data=JSON.parse(fs.readFileSync(relevePath,'utf8'));
const context=JSON.parse(fs.readFileSync(publicPath,'utf8'));
const norm=s=>String(s??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const sku=url=>String(url??'').match(/-A(\d+)/i)?.[1];
function cleanText(value){return String(value??'').replace(/\(\s*(?:ancienne?\s+)?r[ée]f[^)]*\)/giu,'').replace(/\bR[ée]f(?:[ée]rence)?\.?\s*:?\s*.*$/iu,'').replace(/https?:\/\/\S+/giu,'').replace(/\s+/g,' ').trim();}
const asPrice=o=>({manufacturer:o.brand,label:cleanText(o.title),model_id:o.id??null,color_observed:o.color??null,sale_price_ht:o.price,sale_unit:o.unit,pieces_per_sale_unit:o.quantity??null,unit_price_ht:o.quantity>0?Number((o.price/o.quantity).toFixed(6)):null,observed_at:o.date,conditioning:cleanText(o.conditioning)||null});
const tiles=data.tiles.map(asPrice);
function family(label){const n=norm(label);return /douille/.test(n)?'Tuiles à douille':/chatiere|ventilation/.test(n)?'Ventilation':/rive/.test(n)?'Rives':/fronton|about/.test(n)?'Frontons et abouts':/fait|aret/.test(n)?'Faîtage et arêtier':/crochet|clip|vis|fixation/.test(n)?'Fixations':/closoir/.test(n)?'Closoirs':/demi|quart|double tuile|bi-tuile/.test(n)?'Tuiles spéciales':'Autres accessoires';}
const accessories=data.access.map((o,i)=>({...asPrice(o),id:`accessory-${String(i+1).padStart(4,'0')}`,family:family(o.title),models_cited:o.model??null,compatibility:'À confirmer avec le modèle et la version de couverture',unit:o.quantity>0?'u':o.unit}));
const modelPrices={};
for(const b of context.base){
 const id=b[9],publicRows=context.public.filter(r=>r[0]===id&&r[14]==='OUI'),selected=new Set(publicRows.map(r=>sku(r[15])).filter(Boolean));
 const preferredPiece=norm(b[14]);
 const candidates=data.tiles.filter(o=>o.id===id&&o.quantity>0).filter(o=>!(preferredPiece.includes('couvert')&&/\bcourant\b/.test(norm(o.title)))&&!(preferredPiece.includes('courant')&&norm(o.title).includes('couvert')));
 candidates.sort((a,b)=>Number(selected.has(b.refpp))-Number(selected.has(a.refpp))||b.date.localeCompare(a.date)||b.rank-a.rank||a.refpp.localeCompare(b.refpp));
 const professional=candidates[0];
 const publicBenchmark=Number.isFinite(b[2])&&b[2]>0?{unit_price_ht:b[2],source:'Prix public HT de référence',observed_at:String(b[8]??'').slice(0,10)}:null;
 if(professional||publicBenchmark)modelPrices[id]={model_id:id,manufacturer:b[0],model:b[1],color_policy:'Un coloris tarifé suffit pour le modèle',professional:professional?asPrice(professional):null,public_benchmark:publicBenchmark};
}
const payload={version:'2026-11-20',currency:'EUR',tax_status:'HT',policy:{professional_first:true,ignore_color_for_model_price:true,professional_discount_applied:0,accessory_compatibility_requires_selection:true},model_prices:modelPrices,tile_prices:tiles,accessories};
fs.writeFileSync(new URL('../pricing-data.js',import.meta.url),'// Tarifs HT de démonstration : données commerciales anonymisées.\nwindow.SpeedArtiRoofPrices='+JSON.stringify(payload,null,2)+';\n');
console.log(JSON.stringify({models:Object.keys(modelPrices).length,professional:Object.values(modelPrices).filter(p=>p.professional).length,public_only:Object.values(modelPrices).filter(p=>!p.professional).length,tiles:tiles.length,accessories:accessories.length}));
