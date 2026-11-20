const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const vm=require('node:vm'),fixture={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../pricing-data.js'),'utf8'),fixture);
const boxed=fixture.window.SpeedArtiRoofPrices.accessories.find(a=>a.pieces_per_sale_unit===250&&a.sale_price_ht===24.68),packageItem=fixture.window.SpeedArtiRoofPrices.accessories.find(a=>a.sale_unit==='Sac-sachet'&&a.pieces_per_sale_unit===null);
const root=path.resolve(__dirname,'../..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{let name=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!name.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(fs.existsSync(name)&&fs.statSync(name).isDirectory())name=path.join(name,'index.html');fs.readFile(name,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(name)]||'application/octet-stream');res.end(b);});});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/couvreur/`);
 await page.locator('[data-step="2"]').click();
 await page.locator('#productSelect').selectOption('edilians-mediane-plus');
 await page.locator('#pricedAccessories summary').click();
 await page.locator('#accessorySearch').fill(boxed.label);
 assert.match(await page.locator('#accessoryResults').innerText(),/accessoire/);
 await page.locator(`[data-accessory-add="${boxed.id}"]`).click();
 await page.locator(`[data-accessory-quantity="${boxed.id}"]`).fill('250');
 await page.locator(`[data-accessory-role="${boxed.id}"]`).selectOption('ridge_hips');
 await page.locator('#saveBtn').click();await page.reload();await page.locator('[data-step="2"]').click();await page.locator('#pricedAccessories summary').click();
 assert.equal(await page.locator(`[data-accessory-quantity="${boxed.id}"]`).inputValue(),'250');
 assert.equal(await page.locator(`[data-accessory-role="${boxed.id}"]`).inputValue(),'ridge_hips');
 await page.locator('#accessorySearch').fill('');await page.locator('[data-accessory-page="1"]').click();assert.match(await page.locator('#accessoryResults').innerText(),/page 2\//);
 await page.locator('#accessorySearch').fill('faît');assert.match(await page.locator('#accessoryResults').innerText(),/page 1\//);
 // Search/quantity edits must preserve keyboard focus.
 await page.locator('#accessorySearch').fill(boxed.label);assert.equal(await page.evaluate(()=>document.activeElement.id),'accessorySearch');
 await page.locator('#calcBtn').click();
 const rows=page.locator('.table tbody tr');const line=rows.filter({has:page.locator(`[data-price="accessory:${boxed.id}"]`)});assert.equal(await line.count(),1);assert.match(await line.innerText(),/250/);assert.match(await line.innerText(),/24,68/);
 assert.equal(await page.locator('.table tbody tr').filter({hasText:'Faîtières / arêtiers compatibles'}).count(),0);
 const input=line.locator(`[data-price="accessory:${boxed.id}"]`);assert.equal(Number(await input.inputValue()),0.09872);await input.fill('0.2');await input.dispatchEvent('change');
 await page.waitForFunction(id=>Array.from(document.querySelectorAll('.table tbody tr')).some(r=>r.querySelector(`[data-price="accessory:${id}"]`)&&r.textContent.includes('50,00')),boxed.id);
 assert.match(await page.locator('.table tbody tr').filter({has:page.locator(`[data-price="accessory:${boxed.id}"]`)}).innerText(),/50,00/);
 await page.locator('[data-step="2"]').click();await page.locator('#pricedAccessories summary').click();
 await page.locator('#accessorySearch').fill(packageItem.label);await page.locator(`[data-accessory-add="${packageItem.id}"]`).click();
 assert.match(await page.locator('#selectedAccessories').innerText(),/Sac-sachet/);
 const imageDir=process.env.COUVREUR_SCREENSHOT_DIR;
 if(imageDir){fs.mkdirSync(imageDir,{recursive:true});await page.locator('#pricedAccessories').screenshot({path:path.join(imageDir,'accessoires-desktop.png')});}
 await page.setViewportSize({width:390,height:844});await page.locator('#accessorySearch').fill(boxed.label);await page.locator('#accessorySearch').scrollIntoViewIfNeeded();
 assert.ok(await page.locator('#accessorySearch').isVisible());
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 if(imageDir)await page.screenshot({path:path.join(imageDir,'accessoires-mobile.png')});
 assert.deepEqual(errors,[]);console.log('Interface validée : recherche, pagination, ajout, remplacement, sauvegarde, prix manuel, conditionnement et mobile.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
