const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{transformSync}=require('esbuild');
const ctx=vm.createContext({console,Date,normalizeHeader_:v=>String(v).trim().toLowerCase().replace(/[\s_-]+/g,''),cacheField_:(h,ns)=>h.findIndex(v=>ns.some(n=>v.trim().toLowerCase()===n.toLowerCase())),cacheValue_:(r,i)=>i<0?'':String(r[i]??'').trim(),cacheDate_:v=>/^\d{4}-\d{2}-\d{2}$/.test(v)?v:''});
vm.runInContext(fs.readFileSync('src/backend/CalendarCache.gs','utf8'),ctx);
const headers=['Plan Start Date','Judul Pelatihan','Jenis Pelatihan','Nama Trainer 1','Nama Trainer 2','Tempat Pelaksanaan','Waktu','Kehadiran','Status Eksekusi'],fields=ctx.calendarFields_(headers),events={};
const row=['2026-11-09','Basic 5S','PTU','Trainer A','Trainer B','LC','08:00 - 10:00','','Plan'];
ctx.calendarAccumulate_(events,'ptu',row,fields);ctx.calendarAccumulate_(events,'ptu',row,fields);ctx.calendarAccumulate_(events,'staff',row.map((v,i)=>i===7?'Hadir':v),fields);
assert.equal(Object.keys(events).length,1);let e=Object.values(events)[0];assert.equal(e.invited,3);assert.equal(e.attended,1);assert.equal(e.sources.ptu.invited,2);assert.equal(e.sources.staff.attended,1);assert.equal(e.trainers.length,2);
ctx.calendarAccumulate_(events,'ptu',row.map((v,i)=>i===6?'13:00 - 15:00':v),fields);assert.equal(Object.keys(events).length,2);
ctx.calendarAccumulate_(events,'ptu',row.map((v,i)=>i===8?'Cancel':v),fields);assert.equal(Object.keys(events).length,3);assert.ok(Object.values(events).some(e=>e.cancelled));
assert.equal(ctx.calendarAccumulate_(events,'ptu',row.map((v,i)=>i===0?'':v),fields),false);
const client={module:{exports:{}},exports:{}};vm.runInNewContext(transformSync(fs.readFileSync('src/services/trainingCalendar.ts','utf8'),{loader:'ts',format:'cjs'}).code,client);const c=client.module.exports;
assert.equal(c.jakartaToday(new Date('2026-11-08T18:00:00Z')),'2026-11-09');assert.equal(c.nextDate('2026-12-31',1),'2027-01-01');assert.ok(c.monthDates('2024-02').includes('2024-02-29'));assert.equal(c.monthDates('2026-11')[6],'2026-11-01');
const publicEvents=JSON.parse(JSON.stringify(Object.values(events))).map(e=>({...e,statuses:['Plan']}));
assert.equal(c.filterEvents(publicEvents,'staff','',false).length,1);assert.equal(c.filterEvents(publicEvents,'staff','',false)[0].invited,1);assert.equal(c.filterEvents(publicEvents,'','',false).length,2);assert.equal(c.filterEvents(publicEvents,'','',true).length,3);
assert.equal(c.calendarError({version:1,ready:true,snapshotId:'S',events:publicEvents},'S'),'');assert.ok(c.calendarError({version:1,ready:true,snapshotId:'OLD',events:publicEvents},'S'));assert.ok(c.calendarError({version:1,ready:false,snapshotId:'S',events:[]},'S'));
console.log('PASS calendar: timezone/day boundaries, Monday-first/leap month, undeduplicated participant rows, multi-trainer, cross-source aggregation and filtering, separate time sessions, cancellation and stale/partial index rejection');
// Exercise the real cache + calendar worker with simulated Drive and immutable pages.
let suite=fs.readFileSync('tests/cache-engine.cjs','utf8');suite+=`
vm.runInContext(fs.readFileSync('src/backend/CalendarCache.gs','utf8'),context);
const initialReads=reads,snapshot=context.ExecutiveCache.status().snapshotId;
context.TrainingCalendar.start();let injected=false;const originalRead=context.cacheReadJson_;
const firstJob=JSON.parse(files.get(properties.ADR_CALENDAR_JOB).text),failId=firstJob.pages[1].id;
context.cacheReadJson_=id=>{if(id===failId&&!injected){injected=true;throw Error('simulated calendar read failure');}return originalRead(id);};
context.TrainingCalendar.tick();assert.equal(JSON.parse(files.get(properties.ADR_CALENDAR_JOB).text).cursor,1);assert.equal(context.TrainingCalendar.report(snapshot).ready,false);
for(let i=0;i<10&&!context.TrainingCalendar.report(snapshot).ready;i++)context.TrainingCalendar.tick();
const schedule=context.TrainingCalendar.report(snapshot);assert.equal(schedule.ready,true);assert.equal(schedule.recordCount,4195);assert.equal(reads,initialReads);assert.ok(schedule.events.length>0);assert.ok(schedule.events.some(e=>e.cancelled));
assert.equal(schedule.events.reduce((n,e)=>n+e.invited,0),4195);assert.equal(JSON.stringify(schedule).includes('00123'),false);
context.ExecutiveCache.requestRefresh(true);finish();const next=context.ExecutiveCache.status().snapshotId;const legacyManifest=JSON.parse(files.get(properties.ADR_CACHE_ACTIVE).text);delete legacyManifest.inlineCalendar;files.get(properties.ADR_CACHE_ACTIVE).text=JSON.stringify(legacyManifest);assert.notEqual(next,snapshot);assert.equal(context.TrainingCalendar.report(next).ready,false);
context.TrainingCalendar.tick();for(let i=0;i<10&&!context.TrainingCalendar.report(next).ready;i++)context.TrainingCalendar.tick();assert.equal(context.TrainingCalendar.report(next).ready,true);
console.log('PASS calendar worker: resumable failure checkpoint, no source reads, no personal NIP values, full row counts and snapshot isolation');
`;vm.runInThisContext(`(function(require){${suite}\n})`,{filename:'calendar-worker-tests.cjs'})(require);

