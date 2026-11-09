const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),assert=require('node:assert/strict'),{transformSync}=require('esbuild');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const m={exports:{}};vm.runInNewContext(transformSync(fs.readFileSync('src/services/demoTraining.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module:m,exports:m.exports});
const fixture=m.exports.demoTraining();
fixture.report.insights={version:1,ready:true,snapshotId:fixture.report.snapshotId,sourceGeneratedAt:fixture.report.generatedAt,generatedAt:fixture.report.generatedAt,scannedRows:80,excludedRows:0,mapping:{passThreshold:70,excellentThreshold:85,objectives:[{label:'PTO — kelulusan uji',metric:'passRate',source:'pto',target:95}]},classes:Array.from({length:4},(_,i)=>({id:'SIM-PTO-'+i,source:'pto',classId:'SIM-CLASS-'+i,date:'2026-11-0'+(i+1),program:i<2?'HIRADC uji':'Multiskill uji',type:i<2?'In Class':'OJT',category:i<2?'Basic Skill':'Multi Skill',batch:i%2?'B':'A',batchMapped:true,scoreMapped:true,statusMapped:true,metadataConflict:false,state:['actual','actual','planned','cancelled'][i],invited:20,attended:18,scored:18,passed:15,excellent:10,failed:3,scoreSum:1440,missingScore:0,invalidScore:0}))};
fixture.status.insightsVersion='test-v1';let mode='mapped';
const dist=path.resolve('dist'),server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,file=path.join(dist,pathname==='/'?'index.html':pathname);if(!file.startsWith(dist+path.sep)){res.writeHead(403).end();return;}try{const data=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);}catch{res.writeHead(404).end();}});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(u.pathname==='/api/session')return route.fulfill({json:{success:true,configured:true,authenticated:true}});if(u.pathname==='/api/executive'){
   const action=u.searchParams.get('action');let data;
   if(action==='cacheStatus')data=fixture.status;
   else if(action==='cacheReport'){data=JSON.parse(JSON.stringify(fixture.report));if(mode==='unmapped'){data.insights.mapping={passThreshold:null,excellentThreshold:null,objectives:[]};data.insights.classes.forEach(r=>{r.batchMapped=false;r.batch='';r.scoreMapped=false;for(const k of ['scored','passed','failed','excellent','scoreSum','missingScore','invalidScore'])r[k]=0;});}if(mode==='mismatch')data.insights.snapshotId='wrong-snapshot';}
   else if(action==='l1CacheStatus')data={success:true,cacheVersion:'l1-v1',ready:false,snapshotId:'',installed:false,stale:true,job:null};
   else data={success:true};return route.fulfill({json:data});
 }return route.continue();});
 await page.goto(base+'/#/dashboard');const all=page.locator('#training-plan-actual'),qo=page.locator('#training-quality-objective'),pto=page.locator('#training-pto-detail');
 await all.getByRole('heading',{name:'Seluruh training · Plan vs aktual'}).waitFor();await pto.getByLabel('Batch PTO').waitFor();
 assert.equal(await page.locator('#training-plan-actual ~ #training-quality-objective ~ #training-pto-detail').count(),1,'all three cards share one vertical dashboard');
 assert.equal(await pto.locator('tbody tr').count(),4);const qoBefore=await qo.innerText(),allBefore=await all.innerText();
 await pto.getByLabel('Batch PTO').selectOption('A');assert.equal(await pto.locator('tbody tr').count(),2);assert.equal(await qo.innerText(),qoBefore);assert.equal(await all.innerText(),allBefore);
 await pto.getByLabel('Kategori PTO').selectOption('Basic Skill');assert.equal(await pto.getByLabel('Batch PTO').inputValue(),'');assert.equal(await pto.locator('tbody tr').count(),2);await pto.getByLabel('Batch PTO').selectOption('B');assert.equal(await pto.locator('tbody tr').count(),1);await pto.locator('tbody').getByRole('button',{name:'HIRADC uji'}).click();await pto.getByText('Tutup rincian kelas').waitFor();
 await pto.getByLabel('Ukuran hasil PTO').selectOption('averageScore');await pto.getByText('80 /100',{exact:true}).waitFor();await pto.getByLabel('Ukuran hasil PTO').selectOption('passRate');
 await pto.getByLabel('Kategori PTO').selectOption('');await pto.getByLabel('Batch PTO').selectOption('');
 const out=process.env.TEST_OUTPUT_DIR||path.resolve('../../outputs');fs.mkdirSync(out,{recursive:true});
 await page.screenshot({path:path.join(out,'dashboard-training-cards-desktop-SIMULASI.png'),fullPage:true});
 await page.locator('[aria-label="Analisis seluruh training, Quality Objective, dan PTO"]').screenshot({path:path.join(out,'dashboard-three-cards-SIMULASI.png')});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'dashboard-training-cards-mobile-SIMULASI.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'no page-level horizontal overflow');
 mode='unmapped';await page.reload();await qo.getByText(/Rumus dan target QO belum dipetakan/).waitFor();assert.equal(await pto.getByLabel('Batch PTO').count(),0);await pto.getByText(/Batch belum dipetakan; kolom Kategori/).waitFor();assert.equal(await pto.getByRole('heading',{name:'Training PTO · Program & batch'}).count(),1);
 mode='mismatch';await page.reload();await all.getByText(/Indeks analisis tidak valid atau berbeda snapshot/).waitFor();assert.deepEqual(errors,[]);
 console.log('PASS browser: one-page vertical card order, API-to-report rendering, batch/category reset, isolated PTO filters, class drill-down, 390px layout, unmapped states, snapshot mismatch rejection and no page errors. Screenshots use synthetic fixtures only.');
 }finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
