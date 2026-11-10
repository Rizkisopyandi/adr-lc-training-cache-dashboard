/** Aggregate immutable cache pages. Never reads or writes source spreadsheets. */
function dashboardInsightsConfig_() {
  var raw=PropertiesService.getScriptProperties().getProperty('ADR_DASHBOARD_MAPPING')||'{}',c=JSON.parse(raw);
  if(!c||typeof c!=='object'||Array.isArray(c))throw new Error('ADR_DASHBOARD_MAPPING harus objek JSON.');
  var threshold=c.passThreshold,excellent=c.excellentThreshold;
  if(threshold!=null&&(typeof threshold!=='number'||!isFinite(threshold)||threshold<0||threshold>100))throw new Error('passThreshold harus 0–100.');
  if(excellent!=null&&(threshold==null||typeof excellent!=='number'||!isFinite(excellent)||excellent<threshold||excellent>100))throw new Error('excellentThreshold harus >= passThreshold dan <=100.');
  if(c.sources!=null&&(typeof c.sources!=='object'||Array.isArray(c.sources)))throw new Error('sources harus objek pemetaan.');
  Object.keys(c.sources||{}).forEach(function(key){var m=c.sources[key];if(['ptu','pto','otomasi','staff','eksternal'].indexOf(key)<0||!m||typeof m!=='object'||Array.isArray(m))throw new Error('Pemetaan sumber tidak valid: '+key);});
  var objectives=c.objectives||[];
  if(!Array.isArray(objectives)||objectives.length>30)throw new Error('objectives harus daftar maksimal 30 indikator.');
  objectives.forEach(function(o){if(!o||typeof o.label!=='string'||!o.label.trim()||['passRate','attendanceRate','realizationRate'].indexOf(o.metric)<0||typeof o.target!=='number'||!isFinite(o.target)||o.target<0||o.target>100)throw new Error('Label, metric, atau target QO tidak valid.');['source','type','category'].forEach(function(k){if(o[k]!=null&&typeof o[k]!=='string')throw new Error('Filter QO tidak valid: '+k);});});
  var statuses=c.statusMap||{done:'actual',completed:'actual',complete:'actual',terlaksana:'actual',selesai:'actual',cancel:'cancelled',cancelled:'cancelled',canceled:'cancelled',batal:'cancelled',dibatalkan:'cancelled',reschedule:'rescheduled',dijadwalkanulang:'rescheduled',plan:'planned',planned:'planned',terjadwal:'planned'};
  var normalized={};Object.keys(statuses).forEach(function(k){if(['actual','cancelled','rescheduled','planned'].indexOf(statuses[k])<0)throw new Error('Nilai statusMap tidak valid.');normalized[normalizeHeader_(k)]=statuses[k];});
  return {version:1,sources:c.sources||{},passThreshold:threshold==null?null:threshold,excellentThreshold:excellent==null?null:excellent,objectives:objectives,statusMap:normalized};
}
function dashboardInsightsFields_(columns,source,config) {
  var m=config.sources[source]||{};
  function exact(key,fallback){if(m[key]!=null){if(typeof m[key]!=='string'||!m[key].trim())throw new Error('Nama kolom '+key+' tidak valid pada '+source);var i=columns.indexOf(m[key]);if(i<0)throw new Error('Kolom terpetakan '+m[key]+' tidak ditemukan pada '+source);if(i!==columns.lastIndexOf(m[key]))throw new Error('Header terpetakan ganda '+m[key]+' pada '+source);return i;}return fallback?cacheField_(columns,fallback):-1;}
  var f={id:exact('classId',source==='staff'||source==='eksternal'?['No Und']:['ID_Training']),date:exact('date',['Plan Start Date','Tanggal Mulai']),title:exact('program',['Judul Pelatihan']),type:exact('type',['Jenis Pelatihan']),category:exact('category',['Kategori']),status:exact('status',['Status Eksekusi','Terlaksana']),attendance:exact('attendance',['Kehadiran']),batch:exact('batch'),score:exact('score')};
  ['id','date','title','type','category','attendance'].forEach(function(k){if(f[k]<0)throw new Error('Header '+k+' tidak tersedia pada cache '+source);});
  return f;
}
function dashboardInsightsAccumulate_(job,source,row,f) {
  var id=cacheValue_(row,f.id),date=cacheDate_(cacheValue_(row,f.date)),title=cacheValue_(row,f.title);job.scannedRows++;
  if(!id||!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(date)||!title){job.excludedRows++;return;}
  var batch=cacheValue_(row,f.batch),type=cacheValue_(row,f.type),category=cacheValue_(row,f.category),key=JSON.stringify([source,id,batch]);
  if(!job.classes[key])job.classes[key]={id:key,source:source,classId:id,date:date,program:title,type:type,category:category,batch:batch,batchMapped:f.batch>=0,scoreMapped:f.score>=0,statusMapped:f.status>=0,metadataConflict:false,statuses:{},invited:0,attended:0,scored:0,passed:0,excellent:0,failed:0,scoreSum:0,missingScore:0,invalidScore:0};
  var c=job.classes[key];if(c.date!==date||c.program!==title||c.type!==type||c.category!==category)c.metadataConflict=true;
  c.invited++;var status=cacheValue_(row,f.status),statusKey=normalizeHeader_(status);c.statuses[statusKey?('status:'+statusKey):'status:']=job.config.statusMap[statusKey]||'unknown';
  if(cacheValue_(row,f.attendance).toLowerCase()!=='hadir')return;
  c.attended++;if(f.score<0)return;var raw=cacheValue_(row,f.score),score=raw!==''?cacheNumber_(raw):null;
  if(raw===''){c.missingScore++;return;}if(score===null||score>100){c.invalidScore++;return;}
  c.scored++;c.scoreSum+=score;if(job.config.passThreshold!==null){if(score>=job.config.passThreshold)c.passed++;else c.failed++;}if(job.config.excellentThreshold!==null&&score>=job.config.excellentThreshold)c.excellent++;
}
function dashboardInsightsPublic_(job) {
  return {version:1,ready:true,snapshotId:job.snapshotId,sourceGeneratedAt:job.sourceGeneratedAt,generatedAt:new Date().toISOString(),mapping:{passThreshold:job.config.passThreshold,excellentThreshold:job.config.excellentThreshold,objectives:job.config.objectives},scannedRows:job.scannedRows,excludedRows:job.excludedRows,classes:Object.keys(job.classes).map(function(k){var c=job.classes[k],states=Object.keys(c.statuses).map(function(s){return c.statuses[s];}).filter(function(s,i,a){return a.indexOf(s)===i;});var state=states.length===1?states[0]:'conflict';return Object.assign({},c,{state:c.metadataConflict?'conflict':state,statuses:undefined});})};
}
var DashboardInsights={
  report:function(snapshotId){
    try{var p=PropertiesService.getScriptProperties(),raw=p.getProperty('ADR_INSIGHTS_ACTIVE'),progress=p.getProperty('ADR_INSIGHTS_PROGRESS'),state=progress?JSON.parse(progress):null;
      var activeManifestId = p.getProperty('ADR_CACHE_ACTIVE');
      if (activeManifestId) {
        var manifest = cacheReadJson_(activeManifestId);
        var inline = manifest.inlineInsights;
        if (manifest.snapshotId === snapshotId && inline && inline.ready === true && inline.version === 1 && inline.snapshotId === snapshotId && inline.signature === JSON.stringify(dashboardInsightsConfig_())) return inline;
      }
      if(raw){var a=JSON.parse(raw);if(a.snapshotId===snapshotId){var result=cacheReadJson_(a.fileId);if(result.snapshotId!==snapshotId||result.version!==1)throw new Error('Snapshot analisis tidak cocok.');if(state&&state.status==='failed')result.warning='Pembaruan indeks gagal; indeks lengkap sebelumnya dipakai. '+(state.error||'');return result;}}
      return {version:1,ready:false,snapshotId:snapshotId,message:p.getProperty('ADR_INSIGHTS_FOLDER')?'Indeks analisis sedang disiapkan dari cache lengkap.':'Pasang DashboardInsights.gs dan jalankan installDashboardInsights dari editor Executive.',progress:state};
    }catch(e){return {version:1,ready:false,snapshotId:snapshotId,message:'Indeks analisis gagal dibaca. Laporan existing tetap tersedia.',progress:{status:'failed',error:String(e.message||e)}};}
  },
  tick:function(){
    var lock=LockService.getScriptLock();if(!lock.tryLock(200))return;
    try{
      var p=PropertiesService.getScriptProperties(),folderId=p.getProperty('ADR_INSIGHTS_FOLDER'),active=p.getProperty('ADR_CACHE_ACTIVE');if(!folderId||!active)return;
      var manifest=cacheReadJson_(active),config=dashboardInsightsConfig_(),signature=JSON.stringify(config),folder=DriveApp.getFolderById(folderId),jobId=p.getProperty('ADR_INSIGHTS_JOB'),job=jobId?cacheReadJson_(jobId):null;
      if (manifest.inlineInsights && manifest.inlineInsights.ready === true && manifest.inlineInsights.snapshotId === manifest.snapshotId && manifest.inlineInsights.signature === signature) {
        p.setProperty('ADR_INSIGHTS_PROGRESS', JSON.stringify({snapshotId:manifest.snapshotId,status:'complete',scannedPages:0,totalPages:0,error:'',mode:'inline'}));
        return;
      }
      function save(){job.fileId=cacheWriteJson_(folder,'insights-job.json',job);p.setProperty('ADR_INSIGHTS_JOB',job.fileId);p.setProperty('ADR_INSIGHTS_PROGRESS',JSON.stringify({snapshotId:job.snapshotId,status:job.status,scannedPages:job.cursor,totalPages:job.pages.length,error:job.error||''}));}
      if(!job||job.snapshotId!==manifest.snapshotId||job.signature!==signature){
        var prior=p.getProperty('ADR_INSIGHTS_ACTIVE'),slot=prior&&JSON.parse(prior).slot===1?2:1,pages=[];manifest.pages.forEach(function(s){s.pages.forEach(function(id){pages.push({source:s.key,id:id});});});
        job={snapshotId:manifest.snapshotId,sourceGeneratedAt:manifest.generatedAt,signature:signature,config:config,slot:slot,status:'running',cursor:0,pages:pages,classes:{},scannedRows:0,excludedRows:0,failures:0,error:''};save();
      }
      if(job.status==='failed'||job.status==='complete'||job.status==='superseded')return;
      var deadline=Date.now()+20000,steps=0;
      while(job.status==='running'&&job.cursor<job.pages.length&&Date.now()<deadline&&steps<8){
        var checkpoint=JSON.parse(JSON.stringify(job));
        try{var item=job.pages[job.cursor],page=cacheReadJson_(item.id),fields=dashboardInsightsFields_(page.columns,item.source,config);page.records.forEach(function(row){dashboardInsightsAccumulate_(job,item.source,row,fields);});job.cursor++;steps++;job.failures=0;job.error='';save();}
        catch(e){job=checkpoint;job.failures++;job.error=String(e.message||e);if(job.failures>=3)job.status='failed';save();return;}
      }
      if(cacheReadJson_(p.getProperty('ADR_CACHE_ACTIVE')).snapshotId!==job.snapshotId){job.status='superseded';save();return;}
      if(job.status==='running'&&job.cursor===job.pages.length){var result=dashboardInsightsPublic_(job);job.resultId=cacheWriteJson_(folder,'insights-'+job.slot+'.json',result);job.generatedAt=result.generatedAt;job.status='publishing';save();}
      if(job.status==='publishing'){p.setProperty('ADR_INSIGHTS_ACTIVE',JSON.stringify({snapshotId:job.snapshotId,fileId:job.resultId,slot:job.slot,generatedAt:job.generatedAt}));p.setProperty('ADR_INSIGHTS_VERSION',job.snapshotId+'|'+job.generatedAt);job.status='complete';save();}
    }catch(e){PropertiesService.getScriptProperties().setProperty('ADR_INSIGHTS_PROGRESS',JSON.stringify({status:'failed',error:String(e.message||e)}));console.error('Dashboard Insights: '+String(e.message||e));}
    finally{lock.releaseLock();if(typeof CacheRetention!=='undefined')CacheRetention.run();}
  }
};
function dashboardInsightsTick_(){DashboardInsights.tick();}
function installDashboardInsights(){
  adminSetupCheck_();var p=PropertiesService.getScriptProperties(),root=p.getProperty('ADR_CACHE_FOLDER');if(!root)throw new Error('Pasang cache lima sumber dahulu.');
  if(!p.getProperty('ADR_INSIGHTS_FOLDER'))p.setProperty('ADR_INSIGHTS_FOLDER',DriveApp.getFolderById(root).createFolder('Dashboard Insights').getId());
  if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='dashboardInsightsTick_';}))ScriptApp.newTrigger('dashboardInsightsTick_').timeBased().everyMinutes(1).create();
  dashboardInsightsConfig_();DashboardInsights.tick();
}
function rebuildDashboardInsights(){adminSetupCheck_();PropertiesService.getScriptProperties().deleteProperty('ADR_INSIGHTS_JOB');DashboardInsights.tick();}
/** Owner-only diagnostics: counts and progress, never credentials or respondent rows. */
function checkDashboardInsights(){
  adminSetupCheck_();var state=ExecutiveCache.status(),r=DashboardInsights.report(state.snapshotId),raw=PropertiesService.getScriptProperties().getProperty('ADR_INSIGHTS_PROGRESS');
  var classes=r.ready?r.classes.filter(function(c){return !c.metadataConflict;}):[],pto=classes.filter(function(c){return c.source==='pto';});
  Logger.log(JSON.stringify({ready:r.ready,snapshotId:r.snapshotId,generatedAt:r.generatedAt||null,progress:raw?JSON.parse(raw):null,excludedRows:r.excludedRows||0,classes:classes.length,actualClasses:classes.filter(function(c){return c.state==='actual';}).length,pto:{classes:pto.length,invited:pto.reduce(function(n,c){return n+c.invited;},0),attended:pto.reduce(function(n,c){return n+c.attended;},0),batchMapped:pto.filter(function(c){return c.batchMapped;}).length,scoreMapped:pto.filter(function(c){return c.scoreMapped;}).length},warning:r.warning||''}));
}
/** Owner-only warmup: at most three bounded ticks; the scheduled worker remains resumable. */
function continueDashboardInsights(){
  adminSetupCheck_();for(var i=0;i<3;i++){DashboardInsights.tick();var raw=PropertiesService.getScriptProperties().getProperty('ADR_INSIGHTS_PROGRESS');if(raw&&JSON.parse(raw).status!=='running')break;}
  checkDashboardInsights();
}
