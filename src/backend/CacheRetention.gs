/** Permanent deletion is opt-in and restricted to verified application-generated cache files. */
var CacheRetention=(function(){
 function parentIs(item,id){var it=item.getParents(),found=false;while(it.hasNext())if(it.next().getId()===id)found=true;return found;}
 function read(id){return cacheReadJson_(id);}
 function run(){
  var p=PropertiesService.getScriptProperties();if(p.getProperty('ADR_CACHE_RETENTION_SINGLE')!=='1')return {status:'disabled'};
  var refreshProgress=p.getProperty('ADR_CACHE_PROGRESS');if(refreshProgress&&JSON.parse(refreshProgress).status==='running')return {status:'deferred',reason:'training-refresh'};
  var lock=LockService.getScriptLock();if(!lock.tryLock(200))return {status:'busy'};
  var result={status:'complete',deletedFiles:0,deletedFolders:0,compactedJobs:0,updatedAt:new Date().toISOString(),error:''},deadline=Date.now()+10000;
  function budget(){if(result.deletedFiles+result.deletedFolders>=40||Date.now()>deadline){result.status='pending';return false;}return true;}
  function remove(file,rootId){if(!budget())return false;if(!parentIs(file,rootId))throw new Error('Retensi menolak file di luar folder cache.');Drive.Files.remove(file.getId());result.deletedFiles++;return true;}
  function compact(file,rootId,value){if(!parentIs(file,rootId))throw new Error('Checkpoint di luar folder cache.');var changed=false;['buckets','meetdirBuckets','sessions','trainers','events','classes'].forEach(function(k){if(value[k]&&Object.keys(value[k]).length){value[k]={};changed=true;}});if(changed){file.setContent(JSON.stringify(value));result.compactedJobs++;}}
  function root(key,name,parent){var id=p.getProperty(key);if(!id)return null;var f=DriveApp.getFolderById(id);if(f.getName()!==name||(parent&&!parentIs(f,parent)))throw new Error('Folder retensi tidak cocok: '+key);return f;}
  function job(id,folderId,name){if(!id)return null;var f=DriveApp.getFileById(id);if(f.getName()!==name||!parentIs(f,folderId))throw new Error('Lokasi checkpoint tidak cocok.');return {file:f,value:read(id)};}
  function activeFile(id,folderId,name){var f=DriveApp.getFileById(id);if(!parentIs(f,folderId)||(name&&f.getName()!==name))throw new Error('Lokasi snapshot aktif tidak cocok.');return f;}
  try{
   if(typeof Drive==='undefined'||!Drive.Files||typeof Drive.Files.remove!=='function')throw new Error('Aktifkan layanan Advanced Drive v3 sebelum mengaktifkan retensi.');
   var training=root('ADR_CACHE_FOLDER','ADR LC Executive - Cache'),manifest=null;
   if(training&&p.getProperty('ADR_CACHE_ACTIVE')){
    var activeId=p.getProperty('ADR_CACHE_ACTIVE'),mf=DriveApp.getFileById(activeId),parents=mf.getParents();if(!parents.hasNext())throw new Error('Folder snapshot aktif hilang.');var activeFolder=parents.next();
    if(!/^snapshot-/.test(activeFolder.getName())||!parentIs(activeFolder,training.getId())||mf.getName()!=='manifest.json')throw new Error('Snapshot aktif di luar cache training.');
    manifest=read(activeId);var report=read(manifest.reportId);activeFile(manifest.reportId,activeFolder.getId(),'report.json');
    if(manifest.cacheVersion!==ADR_CACHE_VERSION||!manifest.snapshotId||report.success!==true||report.snapshotId!==manifest.snapshotId||!Array.isArray(manifest.pages))throw new Error('Snapshot training baru belum tervalidasi.');
    // Validate all referenced pages before retiring any previous training snapshot.
    var activeFiles={},activeEntries=activeFolder.getFiles();while(activeEntries.hasNext())activeFiles[activeEntries.next().getId()]=true;
    var keep={};keep[activeId]=true;keep[manifest.reportId]=true;manifest.pages.forEach(function(s){if(!Array.isArray(s.pages))throw new Error('Manifest halaman tidak valid.');s.pages.forEach(function(id){if(!activeFiles[id])throw new Error('Halaman snapshot aktif di luar folder cache.');keep[id]=true;});});deadline=Date.now()+10000;
    p.deleteProperty('ADR_CACHE_PREVIOUS');p.deleteProperty('ADR_CACHE_REUSE');
    var folders=training.getFolders(),jobId=p.getProperty('ADR_CACHE_JOB'),currentJob=null;
    if(jobId){var jf=DriveApp.getFileById(jobId),jp=jf.getParents();if(!jp.hasNext())throw new Error('Checkpoint training tanpa folder.');currentJob=job(jobId,jp.next().getId(),'job.json');keep[jobId]=true;}
    while(folders.hasNext()&&budget()){
     var f=folders.next();if(!/^snapshot-/.test(f.getName())||!parentIs(f,training.getId()))continue;
     var isJob=currentJob&&parentIs(currentJob.file,f.getId()),state=isJob?currentJob.value.status:'';
     if(isJob&&(state==='running'||state==='publishing'))continue;
     if(f.getId()===activeFolder.getId()){if(isJob&&['complete','failed','superseded'].indexOf(state)>=0)compact(currentJob.file,f.getId(),currentJob.value);continue;}
     var entries=[],it=f.getFiles(),unknown=false;while(it.hasNext()){var file=it.next();if(!/^(job|report|manifest)\.json$|^(ptu|pto|otomasi|staff|eksternal)-\d+\.json$/.test(file.getName()))unknown=true;entries.push(file);}
     if(unknown||f.getFolders().hasNext())continue;
     if(result.deletedFiles+result.deletedFolders===0)deadline=Date.now()+10000;
     entries.forEach(function(file){if(keep[file.getId()])return;remove(file,f.getId());});
     if(isJob&&(state==='complete'||state==='failed'||state==='superseded'))compact(currentJob.file,f.getId(),currentJob.value);
     if(f.getId()!==activeFolder.getId()&&!isJob&&!f.getFiles().hasNext()&&budget()){Drive.Files.remove(f.getId());result.deletedFolders++;}
    }
    // Legacy pointers must not reference files scheduled for retirement/reuse.
    p.deleteProperty('ADR_CACHE_PREVIOUS');p.deleteProperty('ADR_CACHE_REUSE');
   }
   // A first refresh may fail before any active manifest exists. Only discard its terminal staging data.
   if(training&&!manifest&&p.getProperty('ADR_CACHE_JOB')){
    var firstFile=DriveApp.getFileById(p.getProperty('ADR_CACHE_JOB')),firstParents=firstFile.getParents();
    if(!firstParents.hasNext())throw new Error('Checkpoint tanpa folder.');
    var firstFolder=firstParents.next();
    if(!/^snapshot-/.test(firstFolder.getName())||!parentIs(firstFolder,training.getId()))throw new Error('Checkpoint di luar cache training.');
    var first=job(firstFile.getId(),firstFolder.getId(),'job.json');
    if(['failed','superseded'].indexOf(first.value.status)>=0){
     var staged=firstFolder.getFiles();while(staged.hasNext()&&budget()){var sf=staged.next();if(/^(report|manifest)\.json$|^(ptu|pto|otomasi|staff|eksternal)-\d+\.json$/.test(sf.getName()))remove(sf,firstFolder.getId());}
     compact(first.file,firstFolder.getId(),first.value);
    }
   }
   var l1=root('ADR_L1_FOLDER','ADR LC - Database L1 Cache');
   if(l1){var raw=p.getProperty('ADR_L1_ACTIVE'),a=raw?JSON.parse(raw):null,lj=job(p.getProperty('ADR_L1_JOB'),l1.getId(),'l1-job.json');
    if(a){activeFile(a.fileId,l1.getId());var lr=read(a.fileId);if(lr.success!==true||lr.cacheVersion!=='l1-v1'||lr.snapshotId!==a.snapshotId||!Array.isArray(lr.sessions)||lr.sessions.reduce(function(n,b){return n+b.responses;},0)+lr.skipped+lr.blank!==lr.end-1)throw new Error('Snapshot L1 aktif tidak lengkap.');}
    var li=l1.getFiles();while(li.hasNext()&&budget()){var lf=li.next();if(!/^l1-snapshot-[12]\.json$/.test(lf.getName())||(a&&lf.getId()===a.fileId))continue;if(lj&&(lj.value.status==='running'||lj.value.status==='publishing'))continue;
     var obsolete=read(lf.getId());if(obsolete.cacheVersion==='l1-v1'&&obsolete.snapshotId&&(!a||obsolete.snapshotId!==a.snapshotId))remove(lf,l1.getId());}
    if(lj&&['complete','failed','superseded'].indexOf(lj.value.status)>=0)compact(lj.file,l1.getId(),lj.value);
   }
   if(manifest){
    [['ADR_CALENDAR_FOLDER','Calendar Index','ADR_CALENDAR_ACTIVE','ADR_CALENDAR_JOB','calendar-job.json','ADR_CALENDAR_VERSION'],['ADR_INSIGHTS_FOLDER','Dashboard Insights','ADR_INSIGHTS_ACTIVE','ADR_INSIGHTS_JOB','insights-job.json','ADR_INSIGHTS_VERSION']].forEach(function(spec){
     var f=root(spec[0],spec[1],training.getId());if(!f)return;
     var calendar=spec[0]==='ADR_CALENDAR_FOLDER',raw=p.getProperty(spec[2]),pointer=raw?(calendar?{fileId:raw}:JSON.parse(raw)):null,j=job(p.getProperty(spec[3]),f.getId(),spec[4]);
     if(pointer){activeFile(pointer.fileId,f.getId());var ar=read(pointer.fileId);if(ar.ready!==true||ar.version!==1||!ar.snapshotId)throw new Error('Indeks aktif tidak valid.');if(ar.snapshotId!==manifest.snapshotId){p.deleteProperty(spec[2]);p.deleteProperty(spec[5]);pointer=null;}}
     var it=f.getFiles();while(it.hasNext()&&budget()){var file=it.next(),name=file.getName();if(pointer&&file.getId()===pointer.fileId)continue;if(calendar?!/^calendar-.+\.json$/.test(name)||name==='calendar-job.json':!/^insights-[12]\.json$/.test(name))continue;
      if(j&&(j.value.status==='running'||j.value.status==='publishing')&&j.value.snapshotId===manifest.snapshotId)continue;
      var data=read(file.getId());if(data.ready===true&&data.version===1&&data.snapshotId&&(calendar?name==='calendar-'+data.snapshotId+'.json':true))remove(file,f.getId());
     }
     if(j&&['complete','failed','superseded'].indexOf(j.value.status)>=0)compact(j.file,f.getId(),j.value);
    });
   }
  }catch(e){result.status='blocked';result.error=String(e.message||e);console.error('Cache retention: '+result.error);}
  finally{try{p.setProperty('ADR_CACHE_RETENTION_STATUS',JSON.stringify(result));}finally{lock.releaseLock();}}
  return result;
 }
 return {run:run};
})();
/** Owner opts in only after reviewing permanent deletion and backing up if required. */
function enableSingleSnapshotRetention(){adminSetupCheck_();if(typeof Drive==='undefined'||!Drive.Files)throw new Error('Aktifkan Advanced Drive v3.');PropertiesService.getScriptProperties().setProperty('ADR_CACHE_RETENTION_SINGLE','1');Logger.log(JSON.stringify(CacheRetention.run()));}
function checkSingleSnapshotRetention(){adminSetupCheck_();Logger.log(PropertiesService.getScriptProperties().getProperty('ADR_CACHE_RETENTION_STATUS')||'Retensi belum dijalankan.');}
