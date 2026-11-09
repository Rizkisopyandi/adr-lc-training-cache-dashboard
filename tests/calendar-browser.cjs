const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3015';
 const {spawn}=require('node:child_process');
 const server=process.env.TEST_BASE_URL?null:spawn(process.execPath,['server-dist/server.js','--production'],{env:{...process.env,PORT:'3015',NODE_ENV:'production'},stdio:'pipe'});
 let browser;
 try{
 for(let i=0;i<80;i++){try{const res=await fetch(base+'/');if(res.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
 const page=await browser.newPage({viewport:{width:1512,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.clock.setFixedTime(new Date('2026-11-09T03:00:00Z'));
 await page.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.goto(base+'/?demo=1#/dashboard');await page.getByRole('button',{name:'Ringkasan Existing',exact:true}).click();
 await page.getByRole('heading',{name:'Ringkasan Eksekutif Training',exact:true}).waitFor();
 assert.equal(await page.getByRole('grid').count(),0);
 const before=await page.locator('.metric strong').nth(1).innerText();
 await page.getByRole('link',{name:'Kalender',exact:true}).click();
 await page.getByRole('heading',{name:'Kalender Training',exact:true}).waitFor();
 assert.equal(await page.getByRole('heading',{name:'Training Hari Ini',exact:true}).count(),0);
 assert.equal(await page.getByRole('link',{name:'Kalender',exact:true}).getAttribute('aria-current'),'page');
 const count=Number(await page.locator('.calendar-month-summary strong').innerText());
 await page.getByLabel('Sumber kalender',{exact:true}).selectOption('ptu');
 assert.ok(Number(await page.locator('.calendar-month-summary strong').innerText())<count);
 await page.getByRole('link',{name:'Training Hari Ini & Besok',exact:true}).click();
 await page.getByRole('heading',{name:'Training Hari Ini',exact:true}).waitFor();
 assert.equal(await page.getByRole('grid').count(),0);
 assert.equal(await page.getByLabel('Sumber kalender',{exact:true}).inputValue(),'ptu');
 assert.equal(await page.getByRole('heading',{name:'Training Besok',exact:true}).count(),1);
 assert.equal(await page.locator('.calendar-agenda').count(),2);
 assert.equal(await page.getByRole('heading',{name:'Training Mendatang',exact:true}).count(),0);
 await page.getByLabel('Sumber kalender',{exact:true}).selectOption('');
 assert.ok(await page.locator('.calendar-agenda').first().locator('tbody tr').count()>3);
 assert.equal(await page.locator('.calendar-agenda').nth(0).locator('.calendar-agenda-heading p').innerText(),'Senin, 9 November 2026');
 assert.equal(await page.locator('.calendar-agenda').nth(1).locator('.calendar-agenda-heading p').innerText(),'Selasa, 10 November 2026');
 await page.getByLabel('Jenis kalender',{exact:true}).selectOption('Internal');
 await page.getByLabel('Sumber kalender',{exact:true}).selectOption('ptu');
 assert.equal(await page.locator('.calendar-agenda tbody tr').count(),0);
 await page.getByLabel('Jenis kalender',{exact:true}).selectOption('');
 await page.getByLabel('Sumber kalender',{exact:true}).selectOption('');
 const trainingCount=Number(await page.locator('.calendar-month-summary strong').innerText());
 await page.getByRole('checkbox',{name:'Tampilkan dibatalkan'}).check();
 assert.equal(Number(await page.locator('.calendar-month-summary strong').innerText()),trainingCount);
 await page.getByRole('checkbox',{name:'Tampilkan dibatalkan'}).uncheck();
 const output=path.resolve(process.env.QA_OUTPUT||'../../outputs');
 require('node:fs').mkdirSync(output,{recursive:true});
 await page.screenshot({path:path.join(output,'Training_Berlangsung_Mendatang_SIMULASI.png'),fullPage:false});
 await page.getByRole('link',{name:'Kalender',exact:true}).click();
 await page.getByRole('button',{name:'Senin, 9 November 2026',exact:true}).click();
 assert.ok(await page.locator('.calendar-agenda tbody tr').count()>3);
 await page.getByLabel('Bulan kalender',{exact:true}).fill('2024-02');
 assert.equal(await page.getByRole('button',{name:'Kamis, 29 Februari 2024',exact:true}).count(),1);
 await page.getByRole('button',{name:'Bulan kalender berikutnya'}).click();
 assert.equal(await page.getByLabel('Bulan kalender',{exact:true}).inputValue(),'2024-03');
 await page.getByRole('link',{name:'Training Hari Ini & Besok',exact:true}).click();
 await page.getByRole('link',{name:'Kalender',exact:true}).click();
 assert.equal(await page.getByLabel('Bulan kalender',{exact:true}).inputValue(),'2024-03');
 await page.getByRole('button',{name:'Hari ini',exact:true}).click();
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:path.join(output,'Kalender_Terpisah_SIMULASI.png'),fullPage:false});
 for(const label of ['Kalender','Training Hari Ini & Besok']){
  await page.getByRole('link',{name:label,exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(output,label==='Kalender'?'Kalender_Mobile_SIMULASI.png':'Training_Mobile_SIMULASI.png'),fullPage:false});
  await page.setViewportSize({width:1512,height:1100});
 }
 await page.getByRole('link',{name:'Dashboard',exact:true}).click();await page.getByRole('button',{name:'Ringkasan Existing',exact:true}).click();
 assert.equal(await page.locator('.metric strong').nth(1).innerText(),before);
 await page.getByRole('link',{name:'Laporan Meetdir',exact:true}).click();
 await page.getByRole('heading',{name:'Laporan Meetdir',exact:true}).waitFor();
 assert.equal(await page.getByRole('grid').count(),0);
 await page.getByRole('link',{name:'Database',exact:true}).click();
 await page.getByRole('heading',{name:'Database',exact:true}).waitFor();
 for(const [route,heading] of [['kalender','Kalender Training'],['training','Training Hari Ini & Besok']]){
  await page.goto(base+'/?demo=1#/'+route);await page.getByRole('heading',{name:heading,exact:true}).waitFor();
  await page.reload();await page.getByRole('heading',{name:heading,exact:true}).waitFor();
 }
 await page.goBack();await page.getByRole('heading',{name:'Kalender Training',exact:true}).waitFor();
 // No demo parameter: both entry points must remain behind the existing access gate.
 for(const route of ['kalender','training']){
  await page.goto(base+'/#/'+route);await page.getByRole('heading',{name:'Training Intelligence',exact:true}).waitFor();
  assert.equal(await page.getByRole('navigation').count(),0);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS separate Calendar/Training routes, deep links/reload/back, preserved filters/month, today/tomorrow/future agenda, empty results, cancellation, leap dates, unchanged dashboard KPI/Meetdir/Database, mobile overflow, access gate and no page errors.');
}finally{await browser?.close();server?.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
