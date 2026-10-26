import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const BASE=process.env.TERRASSIER_E2E_URL||'http://127.0.0.1:8020/terrassier/';
const num=t=>Number(t.replace(/[^\d,]/g,'').replace(',','.'));
test('V1.2 navigation des 5 familles, 25 prestations, champs spécifiques, tarifs et sauvegarde',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:880},acceptDownloads:true});
 const page=await context.newPage();const errs=[];
 page.on('pageerror',e=>errs.push(e.message));
 try{
  const r=await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  assert.equal(r.status(),200);
  assert.match(await page.title(),/Terrassier V1\.2/);
  assert.equal(await page.locator('#familles button').count(),5);
  assert.equal(await page.locator('#prestations button').count(),6);
  assert.equal(await page.locator('#mesures input').count(),4);
  // Démolition : nouveaux formulaires et machines
  await page.locator('#familles button').nth(4).click();
  assert.equal(await page.locator('#prestations button').count(),4);
  assert.equal(await page.locator('#mesures input').count(),3);
  assert.match(await page.locator('#mesures').innerText(),/Surface/);
  assert.match(await page.locator('#lignesV12').innerText(),/BRH/);
  await page.getByRole('button',{name:'Fraisage / dépose d’enrobé'}).click();
  assert.match(await page.locator('#lignesV12').innerText(),/Raboteuse/);
  await page.getByRole('button',{name:'Dessouchage'}).click();
  assert.equal(await page.locator('#mesures input').count(),3);
  assert.match(await page.locator('#mesures').innerText(),/Nombre de souches/);
  assert.match(await page.locator('#lignesV12').innerText(),/Rogneuse/);
  // Chemins : clic sous-types change réellement recettes
  await page.locator('#familles button').nth(1).click();
  await page.getByRole('button',{name:'Allée béton'}).click();
  assert.match(await page.locator('#lignesV12').innerText(),/Béton C25/);
  await page.getByRole('button',{name:'Allée pavée'}).click();
  assert.match(await page.locator('#lignesV12').innerText(),/Pavés/);
  assert.doesNotMatch(await page.locator('#lignesV12').innerText(),/Béton C25/);
  // Réseaux : recette et champs changent
  await page.locator('#familles button').nth(3).click();
  await page.getByRole('button',{name:'Fourreaux / réseaux secs'}).click();
  assert.match(await page.locator('#lignesV12').innerText(),/TPC/);
  assert.doesNotMatch(await page.locator('#lignesV12').innerText(),/PVC Ø160/);
  await page.getByRole('button',{name:'Réseaux d’eaux usées'}).click();
  assert.match(await page.locator('#mesures').innerText(),/Pente de réseau/);
  // Recette réagit aux métrés sans clic sur calculer
  const cost1=num(await page.locator('#totauxV12 .total').last().innerText());
  const longInput=page.locator('input[data-dimension="L"]');
  await longInput.fill('60');
  const cost2=num(await page.locator('#totauxV12 .total').last().innerText());
  assert.ok(cost2>cost1,'Le calcul doit varier instantanément');
  // Prix catalogue personnalisable, localStorage enregistré
  await page.locator('#catalogueDetails summary').click();
  await page.fill('#recherchePrix','PVC Ø160');
  const own=page.locator('#prixLignes tr:first-child input[type="number"]');
  assert.equal(await page.locator('#prixLignes tr').count(),1);
  await own.fill('95');await own.blur();
  assert.match(await page.locator('#saveStatut').innerText(),/Enregistré localement/);
  assert.equal(await page.locator('#prixLignes tr').count(),1);
  const o1=num(await page.locator('#totauxV12 .total').last().innerText());
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#mesures input[data-dimension="L"]').inputValue(),'60');
  assert.equal(num(await page.locator('#totauxV12 .total').last().innerText()),o1);
  await page.locator('#catalogueDetails summary').click();
  await page.fill('#recherchePrix','PVC Ø160');
  assert.equal(await page.locator('#prixLignes tr:first-child input[type="number"]').inputValue(),'95');
  // Correction prix chantier + export CSV
  const first=page.locator('#lignesV12 tr').first();
  const input=first.locator('input[type="number"]').last();
  await input.fill('123');
  await input.blur();
  const down=page.waitForEvent('download');
  await page.click('#exportCSV12');
  assert.match((await down).suggestedFilename(),/speedarti-terrassier.*csv/);
  // saisie invalide signale blocage
  await page.locator('input[data-dimension="L"]').fill('0');
  assert.equal(await page.locator('#rapport').isVisible(),false);
  assert.equal(await page.locator('#erreurV12').isVisible(),true);
  await page.locator('input[data-dimension="L"]').fill('40');
  assert.equal(await page.locator('#rapport').isVisible(),true);
  // Mobile
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.locator('#familles button').first().isVisible());
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(dims.scroll<=dims.viewport+2,'Débordement mobile '+JSON.stringify(dims));
  assert.deepEqual(errs,[],errs.join('\n'));
 }finally{await browser.close();}
});
