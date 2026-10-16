'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const BASE=process.env.ELEC_TEST_URL||'http://127.0.0.1:8000/electricien/';
async function change(page,selector,value){
  const el=page.locator(selector);
  await el.fill(String(value));await el.press('Tab');
}
async function run(){
  const browser=await chromium.launch({headless:true});
  try{
    const desktop=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await desktop.newPage();
    const consoleErrors=[],failedAssets=[];
    page.on('pageerror',e=>consoleErrors.push(e.message));
    page.on('response',response=>{
      if(response.status()>=400 && /\.(js|css)(\?|$)/i.test(response.url()))failedAssets.push(response.url()+' '+response.status());
    });
    await page.goto(BASE,{waitUntil:'networkidle'});
    await page.locator('#content h1').waitFor();
    assert((await page.locator('button[data-step]').count())===6,'six steps');
    await change(page,'input[data-path="installation.surface"]',120);
    assert.equal(await page.locator('input[data-path="installation.surface"]').inputValue(),'120');
    await page.locator('button[data-step="1"]').click();
    await change(page,'input[data-path="rooms.chambre"]',4);
    await page.locator('button[data-step="2"]').click();
    await change(page,'input[data-path="pointOverrides.generalSockets"]',26);
    await change(page,'input[data-path="pointOverrides.kitchenSockets"]',6);
    await change(page,'input[data-path="appareillage.socketDistribution.double"]',4);
    await change(page,'input[data-path="appareillage.socketDistribution.triple"]',2);
    assert((await page.locator('#content').innerText()).includes('18 simple(s)'),'socket equivalence');
    await page.locator('select[data-catalog-brand="priseSimple"]').selectOption('Legrand');
    await page.locator('select[data-catalog-gamme="priseSimple"]').selectOption('Dooxie');
    const choices=page.locator('select[data-catalog-choice="priseSimple"] option');
    assert(await choices.count()>1,'Dooxie models');
    await page.locator('select[data-catalog-choice="priseSimple"]').selectOption({index:1});
    await page.locator('select[data-catalog-brand="interrupteur"]').selectOption('Schneider Electric');
    await page.locator('select[data-catalog-gamme="interrupteur"]').selectOption('Odace');
    await page.locator('select[data-catalog-brand="rj45"]').selectOption('Hager');
    await page.locator('select[data-catalog-gamme="rj45"]').selectOption('Gallery');
    await page.locator('select[data-catalog-brand="tv"]').selectOption('Legrand');
    await page.locator('button[data-step="0"]').click();
    await page.locator('button[data-step="2"]').click();
    assert.equal(await page.locator('select[data-catalog-brand="priseSimple"]').inputValue(),'Legrand','state retained');
    assert.equal(await page.locator('input[data-path="appareillage.socketDistribution.double"]').inputValue(),'4','blocks retained');
    await page.locator('#calcBtn').click();
    assert((await page.locator('#content').innerText()).includes('Résultat du chiffrage'));
    await page.reload({waitUntil:'networkidle'});
    assert((await page.locator('#content').innerText()).includes('Résultat du chiffrage'),'result state retained');
    assert.deepEqual(consoleErrors,[],'no JavaScript page errors');
    assert.deepEqual(failedAssets,[],'no missing JS/CSS resources');
    console.log('PASS Desktop 1440: navigation, AUTO/manual, sockets, 4 catalogue families, persistence, calculation');

    const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const phone=await mobile.newPage();
    const phoneErrors=[];
    phone.on('pageerror',e=>phoneErrors.push(e.message));
    await phone.goto(BASE,{waitUntil:'networkidle'});
    await phone.locator('button[data-set="installation.type"][data-value="renovation"]').click();
    await phone.locator('button[data-step="2"]').click();
    assert(await phone.locator('table.reno-table').count()===1,'reno matrix on mobile');
    await change(phone,'input[data-path="renovation.prises.create"]',1);
    await change(phone,'input[data-path="renovation.routes.prises"]',4);
    await phone.locator('button[data-step="3"]').click();
    await phone.locator('input[data-path="circuits.pac"]').check();
    await change(phone,'input[data-path="circuits.pacManual.section"]',6);
    await change(phone,'input[data-path="circuits.pacManual.breaker"]',32);
    await change(phone,'input[data-path="circuits.pacManual.materialPrice"]',100);
    await change(phone,'input[data-path="circuits.pacManual.route"]',15);
    await phone.locator('button[data-step="4"]').click();
    await change(phone,'input[data-path="tableau.panelPrice"]',450);
    await phone.locator('#calcBtn').click();
    assert((await phone.locator('#content').innerText()).includes('Chiffrage provisoire'),'incomplete renovation clearly provisional');
    const width=await phone.evaluate(()=>({body:document.documentElement.scrollWidth,screen:window.innerWidth}));
    assert(width.body<=width.screen+3,'no full-page horizontal overflow: '+JSON.stringify(width));
    assert.deepEqual(phoneErrors,[],'no mobile page errors');
    console.log('PASS Mobile 390: renovation, manual manufacturer, panel, result, no horizontal page overflow');

    await phone.screenshot({path:'electricien-mobile-result.png',fullPage:true});
    await page.screenshot({path:'electricien-desktop-result.png',fullPage:true});
    await desktop.close();await mobile.close();
  }finally{await browser.close();}
}
run().catch(err=>{console.error('FAIL UI',err);process.exitCode=1;});