import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const URL=process.env.TERRASSIER_E2E_URL||'http://127.0.0.1:8020/terrassier/';
const toNumber=s=>Number(s.replace(/[^0-9,]/g,'').replace(',','.'));
test('Terrassier V1.3 — plusieurs familles, plusieurs prestations et configuration indépendante',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1330,height:850},acceptDownloads:true});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const response=await page.goto(URL,{waitUntil:'networkidle',timeout:30000});
  assert.equal(response.status(),200);
  assert.match(await page.title(),/Terrassier V1\.3/);
  assert.equal(await page.locator('#famillesV13 input').count(),5);
  // Deux familles actives simultanément.
  await page.locator('input[aria-label="Famille Terrassement et fondations"]').check();
  await page.locator('input[aria-label="Famille Enrobé et voirie"]').check();
  assert.equal(await page.locator('#famillesV13 input:checked').count(),2);
  // Trois prestations simultanées, deux dans une même famille.
  await page.locator('input[aria-label="Prestation Tranchée et fouille en rigole"]').check();
  await page.locator('input[aria-label="Prestation Fondations superficielles"]').check();
  await page.locator('input[aria-label="Prestation Enrobé multicouche"]').check();
  assert.equal(await page.locator('#prestationsV13 input:checked').count(),3);
  assert.equal(await page.locator('#formulairesV13 .v13-work-card').count(),3);
  assert.equal(await page.locator('#supplementsV13 .v13-work-card').count(),3);
  const boxes=page.locator('#formulairesV13 .v13-work-card');
  const tr=boxes.filter({has:page.getByRole('heading',{name:/Tranchée et fouille/})});
  const fon=boxes.filter({has:page.getByRole('heading',{name:/Fondations superficielles/})});
  assert.equal(await tr.count(),1);
  assert.equal(await fon.count(),1);
  assert.ok((await tr.locator('input[data-field="L"]').inputValue()).length>0);
  const fonBefore=await fon.locator('input[data-field="L"]').inputValue();
  await tr.locator('input[data-field="L"]').fill('55');
  assert.equal(await fon.locator('input[data-field="L"]').inputValue(),fonBefore);
  await tr.locator('select[id^="aides_"]').selectOption('2');
  assert.match(await page.locator('#recapV13').innerText(),/Tranchée/);
  // Machine 4T non tarifée signalée, puis entrée de prix explicite.
  await tr.locator('select[id^="engin_"]').selectOption('ENG_4');
  assert.match(await page.locator('#recapV13').innerText(),/Pelle 4 t/);
  await tr.locator('input[data-field="prix4t"]').fill('480');
  assert.match(await page.locator('#recapV13').innerText(),/Pelle 4 t/);
  // Option stage 3 par ouvrage, indépendante de l'autre prestation.
  const supp=page.locator('#supplementsV13 .v13-work-card').filter({has:page.getByRole('heading',{name:/Tranchée et fouille/})});
  await supp.locator('input[aria-label^="Option Signalisation"]').check();
  assert.equal(await page.locator('#recapV13').getByText('Signalisation / balisage chantier (complément)').count(),1);
  // Mise à jour du récapitulatif total
  const totals=page.locator('#recapV13 .v13-total b');
  assert.equal(await totals.count(),3);
  assert.ok(toNumber(await totals.last().innerText())>0);
  // Persistance locale après actualisation
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#famillesV13 input:checked').count(),2);
  assert.equal(await page.locator('#prestationsV13 input:checked').count(),3);
  const tranchee=page.locator('#formulairesV13 .v13-work-card').filter({has:page.getByRole('heading',{name:/Tranchée et fouille/})});
  assert.equal(await tranchee.locator('input[data-field="L"]').inputValue(),'55');
  assert.equal(await tranchee.locator('input[data-field="prix4t"]').inputValue(),'480');
  // Les fondations superficielles signalent des postes à compléter.
  assert.match(await page.locator('#recapV13').innerText(),/ferraillage/i);
  assert.equal(await page.locator('#exportCSV13').isDisabled(),true);
  // Retirer fondations partielles et vérifier CSV téléchargeable.
  await page.locator('input[aria-label="Prestation Fondations superficielles"]').uncheck();
  assert.equal(await page.locator('#formulairesV13 .v13-work-card').count(),2);
  assert.equal(await page.locator('#exportCSV13').isDisabled(),false);
  const downloadWait=page.waitForEvent('download');
  await page.click('#exportCSV13');
  assert.match((await downloadWait).suggestedFilename(),/chantier-compose\.csv/);
  // La sauvegarde JSON reste accessible pour réviser plus tard.
  const jsonWait=page.waitForEvent('download');
  await page.click('#exportJSON13');
  assert.match((await jsonWait).suggestedFilename(),/chantier\.json/);
  // Affichage téléphone
  await page.setViewportSize({width:390,height:844});
  const v=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
  assert.ok(v.scroll<=v.inner+2,'Débordement mobile '+JSON.stringify(v));
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});