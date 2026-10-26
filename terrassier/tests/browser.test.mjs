import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const BASE=process.env.TERRASSIER_E2E_URL||'http://127.0.0.1:8020/terrassier/';
const money=txt=>Number(txt.replace(/[^0-9,]/g,'').replace(',','.'));
test('Terrassier V1.1 — navigation, ergonomie et fonctionnalités en navigateur',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:1320,height:850},acceptDownloads:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const response=await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  assert.equal(response.status(),200);
  assert.match(await page.title(),/Terrassier/);
  assert.equal(await page.locator('#categories button').count(),5);
  assert.equal(await page.locator('#resultats').isVisible(),true);
  assert.match(await page.locator('#montantDirect').innerText(),/€/);
  assert.equal(await page.locator('#presets .preset').count(),6);
  // Surface seule pour enrobé, mise à jour immédiate sans bouton calculer
  await page.click('[data-preset="parking_enrobe"]');
  assert.equal(await page.locator('#surface_m2').isVisible(),true);
  assert.equal(await page.locator('#longueur').isVisible(),false);
  assert.match(await page.locator('#materiaux').innerText(),/Enrobé couche 1/);
  const totalAvant=money(await page.locator('#montantDirect').innerText());
  await page.fill('#surface_m2','240');
  const totalApres=money(await page.locator('#montantDirect').innerText());
  assert.ok(totalApres>totalAvant,'Le total doit augmenter quand la surface augmente');
  // Multicouches : chaque couche porte sa propre épaisseur et classe
  await page.click('[data-preset="multicouches"]');
  assert.equal(await page.locator('#listeCouches .layerRow').count(),2);
  assert.match(await page.locator('#materiaux').innerText(),/Enrobé couche 2/);
  const initial=money(await page.locator('#montantDirect').innerText());
  await page.locator('#listeCouches .layerRow').nth(1).locator('input').fill('7');
  assert.match(await page.locator('#metreFoisonne').innerText(),/13 cm/);
  assert.notEqual(money(await page.locator('#montantDirect').innerText()),initial);
  await page.click('#ajouterCouche');
  assert.equal(await page.locator('#listeCouches .layerRow').count(),3);
  assert.match(await page.locator('#materiaux').innerText(),/Enrobé couche 3/);
  // Fosse incluse directement sans case supplémentaire
  await page.click('[data-preset="fosse"]');
  assert.match(await page.locator('#materiaux').innerText(),/Fosse septique 3 000 L/);
  await page.selectOption('#type_fosse','micro_station_6eh');
  assert.match(await page.locator('#materiaux').innerText(),/Micro-station 6 EH/);
  // Blindage et pompage : lignes de coût réellement présentes
  await page.click('[data-preset="tranchee_eu"]');
  await page.check('#blindage_fouille');await page.check('#presence_eau');
  assert.match(await page.locator('#materiaux').innerText(),/Blindage de fouille/);
  assert.match(await page.locator('#materiaux').innerText(),/Pompage de chantier/);
  // Ajustement manuel sans perdre le focus lors des saisies
  const ligne=page.locator('#materiaux tr').first();
  const montantInitial=money(await page.locator('#montantDirect').innerText());
  await ligne.locator('input').nth(0).fill('99');
  await ligne.locator('input').nth(1).fill('700');
  const nouveau=money(await page.locator('#montantDirect').innerText());
  assert.notEqual(nouveau,montantInitial);
  await page.locator('#mainOeuvre tr:first-child input').fill('20');
  assert.match(await page.locator('#montantDirect').innerText(),/€/);
  await page.click('#validerRecap');
  assert.match(await page.locator('#validationInfo').innerText(),/validé localement/i);
  // Export après corrections
  const pending=page.waitForEvent('download');
  await page.click('#exportCSV');
  const download=await pending;
  assert.match(download.suggestedFilename(),/terrassier.*csv/);
  // Champ invalidé : empêcher tout résultat périmé
  await page.click('[data-preset="fondations"]');
  await page.fill('#longueur','0');
  assert.equal(await page.locator('#resultats').isVisible(),false);
  await page.click('button[type="submit"]');
  assert.equal(await page.locator('#erreur').isVisible(),true);
  // Vue mobile sans débordement de l'ensemble de la page
  await page.click('[data-preset="acces_gravier"]');
  await page.setViewportSize({width:390,height:844});
  const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
  assert.ok(sizes.scroll<=sizes.inner+2,'Débordement mobile de '+(sizes.scroll-sizes.inner)+'px');
  assert.equal(await page.locator('#resultats').isVisible(),true);
  await page.click('#retourMetiers');
  await page.waitForURL(url=>!url.toString().includes('/terrassier/'));
  assert.match(await page.locator('a[href="./terrassier/"]').innerText(),/Terrassier/);
  assert.deepEqual(errors,[],'Aucune erreur JS navigateur');
 }finally{await browser.close();}
});