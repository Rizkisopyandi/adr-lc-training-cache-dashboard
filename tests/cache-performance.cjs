const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const files=new Map(),folders=new Map(),properties={},triggers=[];let sequence=0,failPage=false,reads=0;
function iterator(items){let i=0;return{hasNext:()=>i<items.length,next:()=>items[i++]};}
function folder(name,parent){const id='folder-'+ ++sequence;const f={id,name,parent,trashed:false,getId:()=>id,getName:()=>name,getParents:()=>iterator(parent?[folders.get(parent)]:[]),getFilesByName:n=>iterator([...files.values()].filter(v=>v.folderId===id&&v.name===n)),setTrashed(v){f.trashed=v;},createFolder:n=>folder(n,id),createFile(n,text){if(failPage&&n.startsWith('pto-')){failPage=false;throw Error('simulated Drive page write failure');}const fid='file-'+ ++sequence;const file={id:fid,name:n,text,folderId:id,getId:()=>fid,getParents:()=>iterator([f]),getBlob:()=>({getDataAsString:()=>file.text}),setContent(t){file.text=t;return file;}};files.set(fid,file);return file;}};folders.set(id,f);return f;}
const sourceRows={ptu:1201,pto:1301,otomasi:600,staff:1000,eksternal:93};
const baseHeaders=['Nama Lengkap','NIP','ID_Training','No Und','Judul Pelatihan','Jenis Pelatihan','Kategori','Plan Start Date','Durasi','Kehadiran','Status Eksekusi','Waktu','Divisi','Filter Bulan'];
const data={};for(const key of Object.keys(sourceRows))data[key]={headers:baseHeaders.map(h=>(key==='staff'||key==='eksternal')&&h==='ID_Training'?'Unused':h),rows:Array.from({length:sourceRows[key]},(_,i)=>['Test participant',i<3&&key==='staff'?'':'00123','CLASS-'+i%20,'INV-1','Test course',key,'Batch 1',i%2?'02-Februari-2026':'06/01/2026',i===0?'1,5':'2','Hadir',i===0?'Cancel':'Done','08:00','Divisi A',i%2?'Februari':'Januari'])};
const props={getProperty:k=>properties[k]||null,setProperty(k,v){properties[k]=v;return this;}};
function environment(){return vm.createContext({console:{error(){}},MimeType:{PLAIN_TEXT:'text/plain'},PropertiesService:{getScriptProperties:()=>props},DriveApp:{createFolder:n=>folder(n,null),getFolderById:id=>{assert.ok(folders.has(id));return folders.get(id);},getFileById:id=>{assert.ok(files.has(id),id);return files.get(id);}},ScriptApp:{getProjectTriggers:()=>triggers,newTrigger:name=>({timeBased(){return this;},everyMinutes(){return this;},create(){triggers.push({getHandlerFunction:()=>name});}})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},Utilities:{getUuid:()=>`uuid-${++sequence}`},Logger:{log(){}},SpreadsheetApp:{openById(id){reads++;const key=Object.keys(context.SOURCE_CONFIG).find(k=>context.SOURCE_CONFIG[k].spreadsheetId===id);assert.ok(key);const d=data[key];return{getSheetByName:name=>{assert.equal(name,context.SOURCE_CONFIG[key].sheetName);return{getName:()=>name,getSheetId:()=>key.length,getLastColumn:()=>d.headers.length,getLastRow:()=>d.rows.length+1,getRange(r,col,n,w){return{getDisplayValues:()=>[d.headers,...d.rows].slice(r-1,r-1+n).map(row=>row.slice(col-1,col-1+w))};}};}};}}});}
const backend=fs.readFileSync('src/backend/DatabaseService.gs','utf8'),engine=fs.readFileSync('src/backend/MeetdirReport.gs','utf8')+fs.readFileSync('src/backend/CacheEngine.gs','utf8')+fs.readFileSync('src/backend/DashboardInsights.gs','utf8')+fs.readFileSync('src/backend/CalendarCache.gs','utf8');
let context=environment();vm.runInContext(backend+engine,context);let checks=0;
function test(name,f){f();checks++;console.log('PASS',name);}
function finish(){for(let i=0;i<20;i++){context.ExecutiveCache.tick();const s=context.ExecutiveCache.status();if(s.job?.status!=='running')return s;}throw Error('worker did not finish');}
test('first install creates one private cache folder and one trigger; no source writes',()=>{context.installExecutiveCache_();context.installExecutiveCache_();assert.equal(triggers.length,1);assert.equal(context.ExecutiveCache.status().ready,false);});
test('page failure rolls back counters and checkpoint; never publishes partial data',()=>{failPage=true;context.ExecutiveCache.tick();assert.equal(context.ExecutiveCache.status().ready,false);assert.equal(context.ExecutiveCache.status().job.failures,1);});
test('restart resumes checkpoint and all 4195 rows are cached, not just ten',()=>{context=environment();vm.runInContext(backend+engine,context);const s=finish();assert.equal(s.ready,true);assert.equal(s.job.status,'complete');assert.equal(s.sources.reduce((n,v)=>n+v.recordCount,0),4195);const r=context.ExecutiveCache.report();assert.equal(r.executive.buckets.reduce((n,b)=>n+b.nipCount,0),4192);assert.equal(r.sources.find(s=>s.key==='staff').missingNip,3);assert.equal(r.sources.reduce((n,s)=>n+s.statusConflicts,0),5);});
test('cached detail is paged at 500 rows with exact source row provenance',()=>{const p=context.ExecutiveCache.page('ptu',0);assert.equal(p.records.length,500);assert.equal(p.sourceRows[0],2);assert.equal(context.ExecutiveCache.page('ptu',2).records.length,201);assert.throws(()=>context.ExecutiveCache.page('ptu',99));});
test('v3 cube and participant-hours use all cached rows without personal NIP values',()=>{const r=context.ExecutiveCache.report();assert.equal(r.executive.version,3);assert.equal(r.executive.buckets.reduce((n,b)=>n+b.hours,0),8387.5);assert.equal(r.executive.buckets.reduce((n,b)=>n+b.nipCount,0),4192);assert.equal(JSON.stringify(r).includes('00123'),false);});
test('inline reports match independent page replay after failed batch and restart',()=>{
  const manifest=JSON.parse(files.get(properties.ADR_CACHE_ACTIVE).text);
  assert.ok(manifest.inlineInsights?.ready);
  assert.ok(manifest.inlineCalendar?.ready);
  const expected={config:context.dashboardInsightsConfig_(),classes:{},scannedRows:0,excludedRows:0};
  const schedule={events:{},records:0,skippedRows:0};
  manifest.pages.forEach(source=>source.pages.forEach(id=>{
    const page=JSON.parse(files.get(id).text);
    const fields=context.dashboardInsightsFields_(page.columns,source.key,expected.config);
    const calendarFields=context.calendarFields_(page.columns);
    page.records.forEach(row=>{
      context.dashboardInsightsAccumulate_(expected,source.key,row,fields);
      schedule.records++;
      if(!context.calendarAccumulate_(schedule.events,source.key,row,calendarFields))schedule.skippedRows++;
    });
  }));
  assert.equal(JSON.stringify(manifest.inlineInsights.classes),JSON.stringify(context.dashboardInsightsPublic_(expected).classes));
  assert.equal(manifest.inlineInsights.scannedRows,4195);
  assert.equal(JSON.stringify(manifest.inlineCalendar.events),JSON.stringify(context.calendarPublic_(schedule,manifest.snapshotId,manifest.generatedAt).events));
  assert.equal(context.DashboardInsights.report(manifest.snapshotId).ready,true);
  assert.equal(context.TrainingCalendar.report(manifest.snapshotId).ready,true);
});
const published=properties.ADR_CACHE_ACTIVE;
test('restart can read report without rereading any source spreadsheet',()=>{const before=reads;context=environment();vm.runInContext(backend+engine,context);assert.equal(context.ExecutiveCache.report().executive.buckets.reduce((n,b)=>n+b.nipCount,0),4192);assert.equal(reads,before);});
test('broken refresh stops after three retries and retains last full snapshot',()=>{context.ExecutiveCache.requestRefresh(true);data.ptu.headers[0]='Broken header';const status=finish();assert.equal(status.job.status,'failed');assert.equal(properties.ADR_CACHE_ACTIVE,published);assert.equal(context.ExecutiveCache.report().executive.buckets.reduce((n,b)=>n+b.nipCount,0),4192);assert.equal(context.ExecutiveCache.requestRefresh(false).queued,false);data.ptu.headers[0]='Nama Lengkap';});
test('date parsing handles display dates and rejects impossible dates',()=>{assert.equal(context.cacheDate_('12-Januari-2026'),'2026-01-12');assert.equal(context.cacheDate_('31/02/2026'),'');assert.equal(context.cacheDate_('2026-08-09'),'2026-08-09');});
test('rotation keeps two completed snapshots and reuses staging folders without unbounded copies',()=>{context.ExecutiveCache.requestRefresh(true);finish();context.ExecutiveCache.requestRefresh(true);finish();const folderCount=folders.size;context.ExecutiveCache.requestRefresh(true);finish();assert.equal(folders.size,folderCount);assert.equal([...folders.values()].filter(f=>f.trashed).length,0);assert.equal(folders.get(properties.ADR_CACHE_FOLDER).trashed,false);});
test('obsolete job is replaced safely for v3 cube schema',()=>{context.ExecutiveCache.requestRefresh(true);const oldId=properties.ADR_CACHE_JOB,job=JSON.parse(files.get(oldId).text);job.version='drive-cache-v1';files.get(oldId).text=JSON.stringify(job);const progress=JSON.parse(properties.ADR_CACHE_PROGRESS);progress.cacheVersion='drive-cache-v1';properties.ADR_CACHE_PROGRESS=JSON.stringify(progress);const active=properties.ADR_CACHE_ACTIVE;context.ExecutiveCache.tick();assert.equal(properties.ADR_CACHE_ACTIVE,active);assert.notEqual(JSON.parse(files.get(properties.ADR_CACHE_JOB).text).id,job.id);const status=finish();assert.equal(status.ready,true);assert.equal(context.ExecutiveCache.report().executive.version,3);});
console.log(`${checks} cache engine tests passed. Drive, triggers and all source data simulated.`);
