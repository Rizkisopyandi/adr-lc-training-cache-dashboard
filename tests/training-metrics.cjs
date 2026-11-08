const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {transformSync}=require('esbuild');
const code=transformSync(fs.readFileSync('src/services/executiveMetrics.ts','utf8'),{loader:'ts',format:'cjs'}).code;
const box={module:{exports:{}},exports:{},Date,Set,Map};box.exports=box.module.exports;vm.runInNewContext(code,box);const m=box.module.exports;
const context=vm.createContext({console,Date});vm.runInContext(fs.readFileSync('src/backend/DatabaseService.gs','utf8')+fs.readFileSync('src/backend/MeetdirReport.gs','utf8')+fs.readFileSync('src/backend/CacheEngine.gs','utf8'),context);
const fields={name:0,title:1,nip:2,id:3,invitation:4,type:5,category:6,date:7,duration:8,attendance:9,status:10,division:11,month:12};
const source={key:'ptu',fields,recordCount:0,missingNip:0,invalidDates:0,invalidDurations:0,attendedCount:0,statusConflicts:0,repeatedHeaders:0},job={meetdirBuckets:{}};
const base=['Name','Course','0001','CLASS-A','INV','Internal','Hard skill','01/11/2026','2','Hadir','','Production','November'];
function row(changes={}){const r=base.slice();for(const [k,v] of Object.entries(changes))r[fields[k]]=v;context.cacheAccumulate_(job,source,r,2,{nip:true,division:true});}
row();row(); // Repeated attendance rows must remain; class only once.
row({id:''});row({id:'CLASS-B',nip:'',division:''});row({id:'CLASS-C',nip:0,division:0});row({id:'-',nip:'-',division:'-'});
row({id:'NO-MONTH',month:''});row({id:'NO-YEAR',date:''});row({id:'ABSENT',attendance:'Tidak Hadir'});row({id:'NO-TYPE',type:''});
const rows=JSON.parse(JSON.stringify(Object.values(job.meetdirBuckets)));const f={...m.initialFilters(),start:'2026-11',end:'2026-11',basis:'nipCount'};
const total=m.select(rows,f);assert.equal(total.classCount,4);assert.equal(total.participants,4);assert.equal(total.participantHours,10);
assert.equal(m.select(rows,{...f,basis:'divisionCount'}).participants,4);
assert.equal(source.recordCount,9);assert.equal(source.meetdirMissingClassId,1);assert.equal(source.meetdirInvalidMonthRows,1);assert.equal(source.meetdirFallbackYearRows,1);
const cross=[...rows,{...rows[0],source:'pto'}];assert.equal(m.select(cross,f).classCount,4);assert.ok(m.select(cross,f).participants>total.participants);
assert.equal(m.offsetMonth('2026-01',-2),'2025-11');assert.equal(m.offsetMonth('2026-12',1),'2027-01');
assert.throws(()=>m.validateCube({version:2,buckets:[]}));assert.throws(()=>m.validateCube({version:3,buckets:[{...rows[0],hours:NaN}]}));
assert.equal(m.select(rows,{...f,source:'missing'}).participants,0);
assert.equal(m.select(rows,{...f,start:'2025-01',end:'2025-12'}).classCount,0);
console.log('PASS evaluated empty cells, numeric zero, dash, valid ID gate, no row dedup, global class union, participant-hours, month/year quarantine, source filter, year boundary and invalid cube rejection');
const access=vm.createContext({Session:{getActiveUser:()=>({getEmail:()=>''})},PropertiesService:{getScriptProperties:()=>({getProperty:()=>''})}});vm.runInContext(fs.readFileSync('src/backend/Code.gs','utf8'),access);assert.throws(()=>access.executiveRpc('cacheReport',{}),/Akses/);console.log('PASS anonymous RPC denied');
require('./cache-engine.cjs');
