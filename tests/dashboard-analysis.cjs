const {buildSync}=require('esbuild'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(path){const module={exports:{}};vm.runInNewContext(buildSync({entryPoints:[path],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,{module,exports:module.exports,require,console,Date,Intl});return module.exports;}
const {analyzeDashboard}=load('src/services/dashboardAnalysis.ts');
const {demoTraining}=load('src/services/demoTraining.ts');const report=demoTraining().report;
const all={period:'',source:'',division:''};const whole=analyzeDashboard(report,all,'2026-11-09');
assert.equal(whole.total.participants,report.executive.buckets.reduce((n,b)=>n+b.nipCount,0));
assert.equal(whole.total.classCount,new Set(report.executive.buckets.flatMap(b=>Object.keys(b.classes))).size);
const ptu=analyzeDashboard(report,{...all,source:'ptu',period:'2026-11'},'2026-11-09');
assert.ok(ptu.rows.every(r=>r.source==='ptu'&&r.period==='2026-11'));assert.equal(ptu.sources.length,1);
assert.ok(ptu.past.every(e=>e.date<'2026-11-09'&&!e.cancelled));assert.ok(ptu.attendance.invited>=ptu.attendance.attended);
assert.equal(whole.attendance.notRecordedPresent,whole.attendance.invited-whole.attendance.attended);
const scope=analyzeDashboard(report,{...all,division:'Produksi'},'2026-11-09');assert.equal(scope.attendance,null);assert.equal(scope.events.length,0);assert.ok(scope.calendarIssue.includes('divisi'));
const missing=analyzeDashboard({...report,calendar:undefined},all);assert.equal(missing.attendance,null);assert.equal(missing.total.participants,whole.total.participants);
const stale=analyzeDashboard({...report,calendar:{...report.calendar,snapshotId:'old'}},all);assert.equal(stale.attendance,null);assert.equal(stale.findings.length,0);
assert.throws(()=>analyzeDashboard({...report,sources:report.sources.slice(1)},all));assert.throws(()=>analyzeDashboard({...report,executive:{version:3,buckets:[{...report.executive.buckets[0],hours:NaN}]}},all));
const date='2026-11-09',events=[{id:'future',date:'2026-11-12',title:'Incomplete',type:'PTU',place:'',time:'',trainers:[],statuses:['Plan'],cancelled:false,invited:12,attended:0,sources:{ptu:{invited:12,attended:0}}},{id:'today',date,title:'Today',type:'PTU',place:'LC',time:'08:00',trainers:['A'],statuses:[],cancelled:false,invited:10,attended:0,sources:{ptu:{invited:10,attended:0}}},{id:'past',date:'2026-11-08',title:'Past',type:'PTU',place:'LC',time:'08:00',trainers:['A'],statuses:[],cancelled:false,invited:20,attended:15,sources:{ptu:{invited:20,attended:15}}}];
const r=analyzeDashboard({...report,calendar:{version:1,ready:true,snapshotId:report.snapshotId,events}},all,date);
assert.equal(r.attendance.invited,20);assert.equal(r.attendance.attended,15);assert.equal(r.findings.length,2);assert.ok(r.findings.some(f=>f.id==='future-readiness'));assert.ok(r.findings.some(f=>f.id==='past-status'));assert.ok(!r.findings.some(f=>f.id.includes('today')));
const empty=analyzeDashboard(report,{...all,period:'2030-01'},date);assert.equal(empty.total.participants,0);assert.equal(empty.attendance.invited,0);
console.log('PASS Dashboard analysis: report parity, source/period/division filters, no partial snapshots, missing/stale calendar rejection, unknown attendance retained, today/future exclusion, source-scoped counts and evidence-only findings.');

const {percentages100}=load('src/analysis-design/utils/chartNumbers.ts');assert.deepEqual(Array.from(percentages100([33400000,21400000,27000000,48900000,38900000])),[20,12,16,29,23]);assert.equal(percentages100([903,982,921,895,974]).reduce((n,v)=>n+v,0),100);assert.equal(percentages100([0,0]).reduce((n,v)=>n+v,0),0);assert.throws(()=>percentages100([-1,2]));console.log('PASS donut legend totals 100%, stable rounding, zero and invalid composition.');
