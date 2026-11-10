/** Schedule index from immutable cache pages only. No reads/writes to source sheets. */
function calendarFields_(columns) {
  return {date:cacheField_(columns,['Plan Start Date','Tanggal Mulai']),title:cacheField_(columns,['Judul Pelatihan']),type:cacheField_(columns,['Jenis Pelatihan']),place:cacheField_(columns,['Tempat Pelaksanaan']),time:cacheField_(columns,['Waktu']),attendance:cacheField_(columns,['Kehadiran']),status:cacheField_(columns,['Status Eksekusi','Terlaksana']),trainers:['Nama Trainer 1','Nama Trainer','Nama Trainer 2','Nama Trainer 3'].map(function(h){return cacheField_(columns,[h]);}).filter(function(v,i,a){return v>=0&&a.indexOf(v)===i;})};
}
function calendarAccumulate_(events,source,row,f) {
  var date=cacheDate_(cacheValue_(row,f.date)),title=cacheValue_(row,f.title);
  if(!date||!title)return false;
  var type=cacheValue_(row,f.type)||'Belum dikategorikan',place=cacheValue_(row,f.place),time=cacheValue_(row,f.time);
  var trainers=f.trainers.map(function(i){return cacheValue_(row,i);}).filter(function(v,i,a){return v&&v!=='-'&&a.indexOf(v)===i;}),status=cacheValue_(row,f.status);
  var cancelled=['cancel','cancelled','canceled','batal','dibatalkan'].indexOf(status.toLowerCase())>=0;
  var key=JSON.stringify([date,title,type,trainers,place,time,cancelled]);
  if(!events[key])events[key]={id:key,date:date,title:title,type:type,trainers:trainers,place:place,time:time,cancelled:cancelled,invited:0,attended:0,statuses:{},sources:{}};
  var e=events[key];e.invited++;if(cacheValue_(row,f.attendance).toLowerCase()==='hadir')e.attended++;
  if(status)e.statuses['status:'+status]=true;
  if(!e.sources[source])e.sources[source]={invited:0,attended:0};
  e.sources[source].invited++;if(cacheValue_(row,f.attendance).toLowerCase()==='hadir')e.sources[source].attended++;
  return true;
}
var TrainingCalendar={
  start:function(){
    var p=PropertiesService.getScriptProperties(),active=p.getProperty('ADR_CACHE_ACTIVE');
    if(!active)return {success:false,error:'Cache lima sumber belum siap.'};
    var manifest=cacheReadJson_(active),old=p.getProperty('ADR_CALENDAR_JOB');
    if(old){var prior=cacheReadJson_(old);if(prior.snapshotId===manifest.snapshotId&&prior.status==='running')return {success:true,queued:false};}
    var folderId=p.getProperty('ADR_CALENDAR_FOLDER');
    if(!folderId){folderId=DriveApp.getFolderById(p.getProperty('ADR_CACHE_FOLDER')).createFolder('Calendar Index').getId();p.setProperty('ADR_CALENDAR_FOLDER',folderId);}
    var folder=DriveApp.getFolderById(folderId),pages=[];
    manifest.pages.forEach(function(s){s.pages.forEach(function(id){pages.push({source:s.key,id:id});});});
    var job={snapshotId:manifest.snapshotId,sourceGeneratedAt:manifest.generatedAt,status:'running',cursor:0,pages:pages,events:{},records:0,skippedRows:0,error:'',failures:0};
    var jobId=cacheWriteJson_(folder,'calendar-job.json',job);p.setProperty('ADR_CALENDAR_JOB',jobId);
    p.setProperty('ADR_CALENDAR_PROGRESS',JSON.stringify({snapshotId:job.snapshotId,status:job.status,scannedPages:0,totalPages:pages.length,error:''}));
    return {success:true,queued:true,snapshotId:job.snapshotId,pages:pages.length};
  },
  tick:function(){
    var lock=LockService.getScriptLock();if(!lock.tryLock(200))return;
    try{
      var p=PropertiesService.getScriptProperties(),active=p.getProperty('ADR_CACHE_ACTIVE');if(!active)return;
      var manifest=cacheReadJson_(active),jobId=p.getProperty('ADR_CALENDAR_JOB'),job=jobId?cacheReadJson_(jobId):null;
      if(!job||job.snapshotId!==manifest.snapshotId){this.start();return;}
      if(job.status!=='running')return;
      var deadline=Date.now()+25000,steps=0,checkpoint;
      try{
        while(job.cursor<job.pages.length&&Date.now()<deadline&&steps<12){
          checkpoint=JSON.parse(JSON.stringify(job));
          var item=job.pages[job.cursor],page=cacheReadJson_(item.id),fields=calendarFields_(page.columns);
          if(fields.date<0||fields.title<0)throw new Error('Header tanggal/judul tidak tersedia pada cache '+item.source);
          page.records.forEach(function(row){job.records++;if(!calendarAccumulate_(job.events,item.source,row,fields))job.skippedRows++;});
          job.cursor++;steps++;job.error='';job.failures=0;
          DriveApp.getFileById(jobId).setContent(JSON.stringify(job));
          p.setProperty('ADR_CALENDAR_PROGRESS',JSON.stringify({snapshotId:job.snapshotId,status:'running',scannedPages:job.cursor,totalPages:job.pages.length,error:''}));
        }
        if(job.cursor===job.pages.length){
          // Refuse to attach an old schedule index to a newly published metrics snapshot.
          if(cacheReadJson_(p.getProperty('ADR_CACHE_ACTIVE')).snapshotId!==job.snapshotId){job.status='superseded';DriveApp.getFileById(jobId).setContent(JSON.stringify(job));return;}
          var result={version:1,ready:true,snapshotId:job.snapshotId,generatedAt:new Date().toISOString(),sourceGeneratedAt:job.sourceGeneratedAt,recordCount:job.records,skippedRows:job.skippedRows,events:Object.keys(job.events).map(function(k){var e=job.events[k];e.statuses=Object.keys(e.statuses).map(function(s){return s.slice(7);});return e;}).sort(function(a,b){return a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||a.title.localeCompare(b.title);})};
          var folder=DriveApp.getFolderById(p.getProperty('ADR_CALENDAR_FOLDER'));
          var reportId=cacheWriteJson_(folder,'calendar-'+job.snapshotId+'.json',result);
          job.status='complete';DriveApp.getFileById(jobId).setContent(JSON.stringify(job));
          p.setProperty('ADR_CALENDAR_ACTIVE',reportId);p.setProperty('ADR_CALENDAR_VERSION',job.snapshotId+'|'+result.generatedAt);
          p.setProperty('ADR_CALENDAR_PROGRESS',JSON.stringify({snapshotId:job.snapshotId,status:'complete',scannedPages:job.cursor,totalPages:job.pages.length,eventCount:result.events.length,error:''}));
        }
      }catch(err){
        if(checkpoint)job=checkpoint;
        job.failures=(job.failures||0)+1;job.error=String(err.message||err);if(job.failures>=3)job.status='failed';
        DriveApp.getFileById(jobId).setContent(JSON.stringify(job));p.setProperty('ADR_CALENDAR_PROGRESS',JSON.stringify({snapshotId:job.snapshotId,status:job.status,scannedPages:job.cursor,totalPages:job.pages.length,error:job.error}));
      }
    }finally{lock.releaseLock();if(typeof CacheRetention!=='undefined')CacheRetention.run();}
  },
  report:function(snapshotId){
    var p=PropertiesService.getScriptProperties(),id=p.getProperty('ADR_CALENDAR_ACTIVE'),progress=p.getProperty('ADR_CALENDAR_PROGRESS');
    if(id){var data=cacheReadJson_(id);if(data.snapshotId===snapshotId)return data;}
    return {version:1,ready:false,snapshotId:snapshotId,events:[],progress:progress?JSON.parse(progress):null,message:'Indeks kalender sedang disiapkan dari snapshot lima sumber.'};
  }
};
function calendarCacheTick_(){TrainingCalendar.tick();}
function installTrainingCalendar(){
  adminSetupCheck_();
  if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='calendarCacheTick_';}))ScriptApp.newTrigger('calendarCacheTick_').timeBased().everyMinutes(1).create();
  Logger.log(JSON.stringify(TrainingCalendar.start()));
}
function continueTrainingCalendar(){
  adminSetupCheck_();
  for(var i=0;i<3;i++){
    var p=PropertiesService.getScriptProperties(),progress=p.getProperty('ADR_CALENDAR_PROGRESS');
    if(progress&&JSON.parse(progress).status!=='running')break;
    var lock=LockService.getScriptLock();if(!lock.tryLock(40000))break;lock.releaseLock();TrainingCalendar.tick();
    Logger.log(PropertiesService.getScriptProperties().getProperty('ADR_CALENDAR_PROGRESS'));
  }
}
function checkTrainingCalendar(){
  adminSetupCheck_();var state=ExecutiveCache.status(),data=TrainingCalendar.report(state.snapshotId);
  Logger.log(JSON.stringify({ready:data.ready,snapshotId:data.snapshotId,generatedAt:data.generatedAt,events:data.events.length,recordCount:data.recordCount,skippedRows:data.skippedRows,progress:data.progress||null}));
}
