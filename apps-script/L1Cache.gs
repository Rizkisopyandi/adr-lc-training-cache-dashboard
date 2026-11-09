/** Independent persistent L1 aggregates. Only this generated folder is written. */
function l1CacheTick_(){L1Cache.tick();}
var L1Cache=(function(){
 var TTL=3600000;
 function props(){return PropertiesService.getScriptProperties();}
 function active(){var value=props().getProperty('ADR_L1_ACTIVE');return value?JSON.parse(value):null;}
 function save(job){
  DriveApp.getFileById(job.fileId).setContent(JSON.stringify(job));
  props().setProperty('ADR_L1_PROGRESS',JSON.stringify({snapshotId:job.id,status:job.status,scannedRows:job.scanned,totalRows:job.end===null?null:Math.max(0,job.end-1),error:job.error,failures:job.failures,startedAt:job.startedAt}));
 }
 function merge(target,rows){rows.forEach(function(b){var key=JSON.stringify([b.program,b.date,b.trainer]);if(!target[key])target[key]=b;else{target[key].responses+=b.responses;b.counts.forEach(function(c,i){c.forEach(function(v,j){target[key].counts[i][j]+=v;});});}});}
 function status(){
  var a=active(),raw=props().getProperty('ADR_L1_PROGRESS');
  return {success:true,cacheVersion:'l1-v1',installed:!!props().getProperty('ADR_L1_FOLDER'),ready:!!a,snapshotId:a?a.snapshotId:'',generatedAt:a?a.generatedAt:null,expiresAt:a?a.expiresAt:null,responseCount:a?a.responseCount:0,trainerCount:a?a.trainerCount:0,stale:!a||Date.now()>Date.parse(a.expiresAt),job:raw?JSON.parse(raw):null};
 }
 function start(){
  var lock=LockService.getScriptLock();if(!lock.tryLock(500))return {success:false,error:'Worker lain sedang menyimpan cache. Coba kembali.'};
  try{
   var p=props(),id=p.getProperty('ADR_L1_JOB');
   if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='l1CacheTick_';}))ScriptApp.newTrigger('l1CacheTick_').timeBased().everyMinutes(1).create();
   if(id&&cacheReadJson_(id).status==='running')return {success:true,queued:false};
   var folderId=p.getProperty('ADR_L1_FOLDER');if(!folderId){folderId=DriveApp.createFolder('ADR LC - Database L1 Cache').getId();p.setProperty('ADR_L1_FOLDER',folderId);}
   // A single dedicated trigger resumes independently of the five-source cache.
   var a=active(),job={version:1,id:Utilities.getUuid(),status:'running',startedAt:new Date().toISOString(),cursor:2,end:null,scanned:0,skipped:0,blank:0,unnamed:0,sessions:{},trainers:{},slot:a&&a.slot===1?2:1,error:'',failures:0};
   var folder=DriveApp.getFolderById(folderId);job.fileId=cacheWriteJson_(folder,'l1-job.json',job);save(job);p.setProperty('ADR_L1_JOB',job.fileId);
   return {success:true,queued:true,snapshotId:job.id};
  }finally{lock.releaseLock();}
 }
 function report(){var a=active();if(!a)return {success:false,error:'Cache Database L1 belum tersedia. Perbarui Cache L1 dari halaman Database.'};var r=cacheReadJson_(a.fileId);if(r.snapshotId!==a.snapshotId||r.cacheVersion!=='l1-v1')throw new Error('Snapshot L1 tidak cocok.');return r;}
 function tick(){
  var lock=LockService.getScriptLock();if(!lock.tryLock(200))return;
  try{
   var p=props(),id=p.getProperty('ADR_L1_JOB');if(!id)return;
   var job=cacheReadJson_(id);if(job.status!=='running')return;
   var checkpoint=JSON.parse(JSON.stringify(job));
   try{
    var page=L1Evaluation.report({row:job.cursor,end:job.end});
    if(!page||page.success!==true||page.version!==1||page.row!==job.cursor||(job.end!==null&&page.end!==job.end)||page.scanned!==Math.min(2000,Math.max(0,page.end-job.cursor+1))||page.nextRow!==(job.cursor+page.scanned<=page.end?job.cursor+page.scanned:null))throw new Error('Halaman sumber L1 tidak cocok.');
    var count=page.sessions.reduce(function(n,b){return n+b.responses;},0);if(count+page.blank+page.skipped!==page.scanned)throw new Error('Rekonsiliasi baris L1 gagal.');
    merge(job.sessions,page.sessions);merge(job.trainers,page.trainers);job.end=page.end;job.scanned+=page.scanned;job.skipped+=page.skipped;job.blank+=page.blank;job.unnamed+=page.unnamed;job.cursor=page.nextRow;job.failures=0;job.error='';
    if(page.nextRow===null){
     var sessions=Object.keys(job.sessions).map(function(k){return job.sessions[k];}),trainers=Object.keys(job.trainers).map(function(k){return job.trainers[k];});
     var responses=sessions.reduce(function(n,b){return n+b.responses;},0);if(responses+job.skipped+job.blank!==job.end-1)throw new Error('Jumlah baris snapshot L1 tidak lengkap.');
     var now=new Date().toISOString(),expires=new Date(Date.now()+TTL).toISOString();
     var result={success:true,cacheVersion:'l1-v1',snapshotId:job.id,startedAt:job.startedAt,generatedAt:now,expiresAt:expires,sessions:sessions,trainers:trainers,skipped:job.skipped,blank:job.blank,unnamed:job.unnamed,end:job.end};
     var file=cacheWriteJson_(DriveApp.getFolderById(p.getProperty('ADR_L1_FOLDER')),'l1-snapshot-'+job.slot+'.json',result);
     // Publish only after the entire immutable result has been written successfully.
     p.setProperty('ADR_L1_ACTIVE',JSON.stringify({snapshotId:job.id,fileId:file,slot:job.slot,generatedAt:now,expiresAt:expires,responseCount:responses,trainerCount:trainers.reduce(function(n,b){return n+b.responses;},0)}));
     job.status='complete';
    }
    save(job);
   }catch(e){job=checkpoint;job.failures++;job.error=String(e.message||e);if(job.failures>=3)job.status='failed';save(job);}
  }finally{lock.releaseLock();}
 }
 return {status:status,start:start,report:report,tick:tick};
})();

/** Jalankan sekali dari editor untuk memberi izin Trigger & Drive. Tidak mengubah data apa pun. */
function otorisasiL1Cache() {
  ScriptApp.getProjectTriggers();
  DriveApp.getRootFolder();
  Logger.log('Izin L1 Cache sudah aktif. Silakan klik "Perbarui Cache L1" di dashboard.');
}
