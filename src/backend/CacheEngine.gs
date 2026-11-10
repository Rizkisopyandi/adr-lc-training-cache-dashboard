/** Persistent cache in a dedicated Drive folder. Source spreadsheets are READ ONLY. */
var ADR_CACHE_VERSION = 'executive-training-v3';

var ADR_CACHE_TTL_MS = 60 * 60 * 1000;
var ADR_CACHE_PAGE_ROWS = 500;

function installExecutiveCache_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADR_CACHE_FOLDER')) {
    props.setProperty('ADR_CACHE_FOLDER', DriveApp.createFolder('ADR LC Executive - Cache').getId());
  }
  ScriptApp.getProjectTriggers().forEach(function(t){if(t.getHandlerFunction()==='executiveCacheTick')ScriptApp.deleteTrigger(t);});
  var exists = ScriptApp.getProjectTriggers().some(function(t) { return t.getHandlerFunction() === 'executiveCacheTick_'; });
  if (!exists) ScriptApp.newTrigger('executiveCacheTick_').timeBased().everyMinutes(1).create();
  Logger.log(JSON.stringify(ExecutiveCache.requestRefresh(false)));
}

function executiveCacheTick_() { try{ExecutiveCache.tick();}finally{if(typeof CacheRetention!=='undefined')CacheRetention.run();} }

function cacheReadJson_(id) { return JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8')); }
function cacheWriteJson_(folder, name, value) {
  var existing=folder.getFilesByName(name);
  if(existing.hasNext()){var file=existing.next();file.setContent(JSON.stringify(value));return file.getId();}
  return folder.createFile(name, JSON.stringify(value), MimeType.PLAIN_TEXT).getId();
}
function cacheReusableSnapshot_(manifestId, rootId) {
  if(!manifestId)return '';
  // Reuse only an obsolete generated snapshot folder under the dedicated root.
  var parents=DriveApp.getFileById(manifestId).getParents();
  if(!parents.hasNext())return '';
  var snapshot=parents.next(), roots=snapshot.getParents();
  if(snapshot.getName().indexOf('snapshot-')!==0||!roots.hasNext()||roots.next().getId()!==rootId)return '';
  return snapshot.getId();
}
function cacheSaveJob_(job) {
  DriveApp.getFileById(job.fileId).setContent(JSON.stringify(job));
  PropertiesService.getScriptProperties().setProperty('ADR_CACHE_PROGRESS',JSON.stringify({id:job.id,cacheVersion:job.version,status:job.status,error:job.error||'',failures:job.failures||0,sources:job.sources.map(function(s){return {key:s.key,status:s.status,scannedRows:Math.max(0,s.cursor-2),totalRows:Math.max(0,s.lastRow-1),recordCount:s.recordCount};})}));
}
function cacheField_(headers, candidates) {
  var normalized = headers.map(normalizeHeader_);
  for (var i = 0; i < candidates.length; i++) { var n = normalized.indexOf(normalizeHeader_(candidates[i])); if (n >= 0) return n; }
  return -1;
}
function cacheValue_(row, index) { return index < 0 ? '' : String(row[index] == null ? '' : row[index]).trim(); }
function cacheDate_(raw) {
  var value = String(raw || '').trim();
  var months = { januari:1, februari:2, maret:3, april:4, mei:5, juni:6, juli:7, agustus:8, september:9, oktober:10, november:11, desember:12, january:1, february:2, march:3, may:5, june:6, july:7, august:8, october:10, december:12 };
  var m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/), y, month, d;
  if (m) { y = +m[1]; month = +m[2]; d = +m[3]; }
  else {
    m = value.match(/^(\d{1,2})[\/\-\s]([\p{L}\d]+)[\/\-\s](\d{2,4})$/u);
    if (!m) return '';
    d = +m[1]; month = /^\d+$/.test(m[2]) ? +m[2] : months[m[2].toLowerCase()]; y = +m[3]; if (y < 100) y += 2000;
  }
  if (!month || month > 12 || d < 1 || d > new Date(y, month, 0).getDate()) return '';
  return y + '-' + ('0'+month).slice(-2) + '-' + ('0'+d).slice(-2);
}
function cacheNumber_(value) {
  var s = String(value == null ? '' : value).trim();
  if (!s || s === '-' || !/^\d+(?:[.,]\d+)*$/.test(s)) return null;
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  var n = Number(s); return isFinite(n) && n >= 0 ? n : null;
}
function cacheAccumulate_(job, source, row, sourceRow, countaPresence) {
  var f = source.fields;
  var id = cacheValue_(row,(source.key==='staff'||source.key==='eksternal')?f.invitation:f.id);
  if (!id) {source.meetdirMissingClassId=(source.meetdirMissingClassId||0)+1;return false;}
  var name=cacheValue_(row,f.name),title=cacheValue_(row,f.title);
  if(normalizeHeader_(name)==='namalengkap'||normalizeHeader_(title)==='judulpelatihan') {source.repeatedHeaders++;return false;}
  source.recordCount++;
  if(!cacheValue_(row,f.nip))source.missingNip++;
  var date=cacheDate_(cacheValue_(row,f.date));
  if(!date)source.invalidDates++;
  if(cacheValue_(row,f.attendance).toLowerCase()!=='hadir')return true;
  source.attendedCount++;
  if(['cancel','cancelled','canceled','batal'].indexOf(cacheValue_(row,f.status).toLowerCase())>=0)source.statusConflicts++;
  meetdirAccumulate_(job,source,row,date);
  return true;
}

function cacheReports_(buckets) {
  var periods = { all:true }, entries = Object.keys(buckets).map(function(k) { return buckets[k]; });
  entries.forEach(function(b) { periods[b.month] = true; periods[b.month.slice(0,4)] = true; periods[b.month.slice(0,4)+'-Q'+Math.ceil(Number(b.month.slice(5))/3)] = true; });
  var output = {};
  Object.keys(periods).sort().forEach(function(period) {
    var total = { participants:0,hours:0,classes:{},people:{} }, groups = {};
    entries.forEach(function(b) {
      var quarter = b.month.slice(0,4)+'-Q'+Math.ceil(Number(b.month.slice(5))/3);
      if (period !== 'all' && period !== b.month && period !== b.month.slice(0,4) && period !== quarter) return;
      var key = JSON.stringify([b.type,b.category]);
      if (!groups[key]) groups[key] = { type:b.type,category:b.category,participants:0,hours:0,classes:{},people:{} };
      [total,groups[key]].forEach(function(g) { g.participants += b.participants; g.hours += b.hours; Object.keys(b.classes).forEach(function(k){g.classes[k]=true;}); Object.keys(b.people).forEach(function(k){g.people[k]=true;}); });
    });
    function publicMetrics(g) { return { participants:g.participants, participantHours:Math.round(g.hours*100)/100, classCount:Object.keys(g.classes).length, uniqueEmployees:Object.keys(g.people).length }; }
    output[period] = { total:publicMetrics(total), groups:Object.keys(groups).sort().map(function(k){var g=groups[k]; return { type:g.type,category:g.category,metrics:publicMetrics(g) };}) };
  });
  return output;
}

var ExecutiveCache = {
  status: function() {
    var p = PropertiesService.getScriptProperties(), active = p.getProperty('ADR_CACHE_ACTIVE'), jobId = p.getProperty('ADR_CACHE_JOB');
    var job = jobId && p.getProperty('ADR_CACHE_PROGRESS') ? JSON.parse(p.getProperty('ADR_CACHE_PROGRESS')) : null;
    var manifest = active ? cacheReadJson_(active) : null;
    return { success:true, cacheVersion:ADR_CACHE_VERSION, installed:!!p.getProperty('ADR_CACHE_FOLDER'), ready:!!manifest, snapshotId:manifest ? manifest.snapshotId : null, generatedAt:manifest ? manifest.generatedAt : null, expiresAt:manifest ? manifest.expiresAt : null,
      stale:!manifest || manifest.cacheVersion !== ADR_CACHE_VERSION || new Date(manifest.expiresAt).getTime() <= Date.now(), sources:manifest ? manifest.sources : [],
      job:job };
  },
  requestRefresh: function(force) {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(200)) return { success:true, queued:false, message:'Sinkronisasi sedang bekerja.' };
    try {
      var p = PropertiesService.getScriptProperties(), folderId = p.getProperty('ADR_CACHE_FOLDER');
      if (!folderId) throw new Error('Jalankan installExecutiveCache_ sekali di editor Apps Script Executive, kemudian izinkan Drive dan trigger.');
      var oldJob = p.getProperty('ADR_CACHE_JOB');
      if (oldJob) {
        var progress=p.getProperty('ADR_CACHE_PROGRESS');
        var oldStatus=progress ? JSON.parse(progress).status : cacheReadJson_(oldJob).status;
        if (oldStatus === 'running' || (oldStatus === 'failed' && !force)) return { success:true,queued:false };
      }
      var active = p.getProperty('ADR_CACHE_ACTIVE');
      if (!force && active) {var current=cacheReadJson_(active);if(current.cacheVersion===ADR_CACHE_VERSION&&new Date(current.expiresAt).getTime()>Date.now())return { success:true,queued:false };}
      var reusable=p.getProperty('ADR_CACHE_REUSE');
      if(oldJob&&(oldStatus==='failed'||oldStatus==='superseded'))reusable=cacheReadJson_(oldJob).folderId;
      var protectedFolders=[p.getProperty('ADR_CACHE_ACTIVE'),p.getProperty('ADR_CACHE_PREVIOUS')].filter(function(id){return !!id;}).map(function(id){return cacheReusableSnapshot_(id,folderId);});
      if(reusable&&protectedFolders.indexOf(reusable)>=0)reusable='';
      if(reusable){var candidate=DriveApp.getFolderById(reusable),parents=candidate.getParents();if(candidate.getName().indexOf('snapshot-')!==0||!parents.hasNext()||parents.next().getId()!==folderId)throw new Error('Folder cache tidak sesuai root cache Executive.');}
      var folder = reusable ? DriveApp.getFolderById(reusable) : DriveApp.getFolderById(folderId).createFolder('snapshot-'+Date.now());
      p.setProperty('ADR_CACHE_REUSE','');
      var job = { id:Utilities.getUuid(), version:ADR_CACHE_VERSION,fileId:'', folderId:folder.getId(),status:'running',startedAt:new Date().toISOString(),sources:[],buckets:{},meetdirBuckets:{},index:0,failures:0,error:'' };
      // Source metadata is initialized by the background worker, not by this HTTP request.
      Object.keys(SOURCE_CONFIG).forEach(function(key){ job.sources.push({ key:key,status:'pending',cursor:2,lastRow:1,columns:[],pages:[],recordCount:0,missingNip:0,invalidDates:0,invalidDurations:0,statusConflicts:0,repeatedHeaders:0,compositeClassRows:0,unresolvedClassRows:0 }); });
      job.fileId = cacheWriteJson_(folder,'job.json',job); cacheSaveJob_(job); p.setProperty('ADR_CACHE_JOB',job.fileId);
      return { success:true,queued:true,jobId:job.id };
    } finally{lock.releaseLock();if(typeof CacheRetention!=='undefined')CacheRetention.run();}
  },
  tick: function() {
    var p = PropertiesService.getScriptProperties(), jobId = p.getProperty('ADR_CACHE_JOB');
    var progress=p.getProperty('ADR_CACHE_PROGRESS');
    if(jobId&&progress&&JSON.parse(progress).status==='running'&&JSON.parse(progress).cacheVersion!==ADR_CACHE_VERSION){
      var migrationLock=LockService.getScriptLock();if(!migrationLock.tryLock(200))return;
      try{var obsolete=cacheReadJson_(jobId);if(obsolete.version!==ADR_CACHE_VERSION){obsolete.status='superseded';cacheSaveJob_(obsolete);}}finally{migrationLock.releaseLock();}
      this.requestRefresh(true);return;
    }
    if (!jobId || (progress ? JSON.parse(progress).status : cacheReadJson_(jobId).status) !== 'running') { this.requestRefresh(false); return; }
    var lock = LockService.getScriptLock(); if (!lock.tryLock(200)) return;
    var job, checkpoint;
    try {
      job = cacheReadJson_(jobId);
      if (job.status !== 'running') return;
      var deadline = Date.now()+30000, folder = DriveApp.getFolderById(job.folderId), steps = 0, contexts={};
      while (job.index < job.sources.length && Date.now() < deadline && steps < 8) {
        checkpoint=JSON.parse(JSON.stringify(job));
        var source = job.sources[job.index], c = contexts[source.key] || DatabaseService.openSource(source.key), sheet = c.sheet;
        contexts[source.key]=c;
        if (source.status === 'pending') {
          source.columns=c.headers; source.lastRow=Math.max(1,sheet.getLastRow()); source.spreadsheetId=c.config.spreadsheetId; source.sheetName=sheet.getName(); source.sheetId=sheet.getSheetId(); source.idColumnFound=c.idIndex>=0;
          source.fields = { name:cacheField_(c.headers,['Nama Lengkap','Nama']),title:cacheField_(c.headers,['Judul Pelatihan']),nip:cacheField_(c.headers,['NIP']),id:cacheField_(c.headers,['ID_Training']),invitation:cacheField_(c.headers,['No Und']),type:cacheField_(c.headers,['Jenis Pelatihan']),category:cacheField_(c.headers,['Kategori']),date:cacheField_(c.headers,['Plan Start Date','Tanggal Mulai']),duration:cacheField_(c.headers,['Durasi']),attendance:cacheField_(c.headers,['Kehadiran']),status:cacheField_(c.headers,['Status Eksekusi','Terlaksana']),time:cacheField_(c.headers,['Waktu']),division:cacheField_(c.headers,['Divisi']),month:cacheField_(c.headers,['Filter Bulan']) };
          var nipColumns=[];c.headers.forEach(function(h,i){if(normalizeHeader_(h)==='nip')nipColumns.push(i);});
          if(nipColumns.length>1){
            var selected=Number(PropertiesService.getScriptProperties().getProperty('ADR_NIP_COLUMN_'+source.key.toUpperCase()));
            if(!selected||nipColumns.indexOf(selected-1)<0)throw new Error('NIP ganda pada '+source.key+'. Verifikasi kolom NIP lalu set ADR_NIP_COLUMN_'+source.key.toUpperCase()+' (nomor kolom mulai 1).');
            source.fields.nip=selected-1;
          }
          ['name','title','type','category','date','duration','attendance','nip','division','month'].forEach(function(k){if(source.fields[k]<0) throw new Error('Header wajib '+k+' tidak ditemukan untuk '+source.key);});
          var classField=source.key==='staff'||source.key==='eksternal'?'invitation':'id';if(source.fields[classField]<0)throw new Error('Header identitas kelas '+classField+' tidak ditemukan untuk '+source.key);
          source.status='running';
        } else if (JSON.stringify(c.headers)!==JSON.stringify(source.columns) || sheet.getLastRow()!==source.lastRow) throw new Error('Struktur/jumlah baris '+source.key+' berubah saat sinkronisasi. Mulai ulang agar tidak mencampur versi.');
        if (source.cursor <= source.lastRow) {
          var n=Math.min(ADR_CACHE_PAGE_ROWS,source.lastRow-source.cursor+1), rows=sheet.getRange(source.cursor,1,n,source.columns.length).getDisplayValues(), records=[], sourceRows=[], countaPresence=[];
          var batchRange=sheet.getRange(source.cursor,1,n,source.columns.length);
          var evaluated=typeof batchRange.getValues==='function'?batchRange.getValues():null;
          rows.forEach(function(row,i){
            if(evaluated){
              ['name','title','nip','id','invitation','type','category','duration','attendance','status','time','division','month'].forEach(function(k){var col=source.fields[k];if(col>=0)row[col]=evaluated[i][col]==null?'':String(evaluated[i][col]);});
              var rawDate=evaluated[i][source.fields.date];
              if(Object.prototype.toString.call(rawDate)==='[object Date]'&&!isNaN(rawDate.getTime()))row[source.fields.date]=Utilities.formatDate(rawDate,Session.getScriptTimeZone(),'yyyy-MM-dd');
            }
            function present(index,formulas){return index>=0&&String(row[index] == null ? '' : row[index]).trim().length>0;}
            var presence={nip:present(source.fields.nip),division:present(source.fields.division)};
            if(cacheAccumulate_(job,source,row,source.cursor+i,presence)){records.push(row);sourceRows.push(source.cursor+i);countaPresence.push(presence);}
          });
          var pageId=cacheWriteJson_(folder,source.key+'-'+source.cursor+'.json',{sourceKey:source.key,columns:source.columns,records:records,sourceRows:sourceRows,countaPresence:countaPresence});
          source.pages.push(pageId); source.cursor+=n; steps++; job.failures=0;job.error=''; cacheSaveJob_(job);
        }
        if (source.cursor > source.lastRow) { source.status='complete';job.index++; cacheSaveJob_(job); }
      }
      if (job.index === job.sources.length) {
        var now=new Date().toISOString();
        var report={success:true,cacheVersion:ADR_CACHE_VERSION,snapshotId:job.id,generatedAt:now,startedAt:job.startedAt,expiresAt:new Date(Date.now()+ADR_CACHE_TTL_MS).toISOString(),definition:{attendance:'Hadir',date:'Plan Start Date / Tanggal Mulai',hours:'SUM Durasi pada baris peserta hadir',classes:'COUNTUNIQUE ID_Training global; No Und untuk Staff/Eksternal; ID kosong dikecualikan'},periods:cacheReports_(job.buckets),executive:{version:3,buckets:Object.keys(job.meetdirBuckets).map(function(k){return job.meetdirBuckets[k];})},sources:job.sources.map(function(s){return {key:s.key,spreadsheetId:s.spreadsheetId,sheetName:s.sheetName,columnCount:s.columns.length,idColumnFound:s.idColumnFound,recordCount:s.recordCount,scannedRows:s.lastRow-1,missingNip:s.missingNip,invalidDates:s.invalidDates,invalidDurations:s.invalidDurations,statusConflicts:s.statusConflicts,repeatedHeaders:s.repeatedHeaders,compositeClassRows:s.compositeClassRows,unresolvedClassRows:s.unresolvedClassRows,meetdirMissingClassId:s.meetdirMissingClassId||0,meetdirFallbackYearRows:s.meetdirFallbackYearRows||0,meetdirInvalidMonthRows:s.meetdirInvalidMonthRows||0};})};
        var reportId=cacheWriteJson_(folder,'report.json',report);
        var manifestId=cacheWriteJson_(folder,'manifest.json',{cacheVersion:ADR_CACHE_VERSION,snapshotId:job.id,generatedAt:now,expiresAt:report.expiresAt,reportId:reportId,sources:report.sources,pages:job.sources.map(function(s){return {key:s.key,pages:s.pages};})});
        // Mark the staging job complete before publishing, so recovery never rewrites an active folder.
        job.status='complete';cacheSaveJob_(job);checkpoint=null;
        // Publish only after every source and every file has completed successfully.
        var retire=p.getProperty('ADR_CACHE_PREVIOUS');
        var previous=p.getProperty('ADR_CACHE_ACTIVE'); if(previous)p.setProperty('ADR_CACHE_PREVIOUS',previous);
        p.setProperty('ADR_CACHE_ACTIVE',manifestId);p.setProperty('ADR_CACHE_EXPIRES',String(new Date(report.expiresAt).getTime()));
        try{p.setProperty('ADR_CACHE_REUSE',cacheReusableSnapshot_(retire,p.getProperty('ADR_CACHE_FOLDER')));}catch(cleanupError){console.error('Cache rotation: '+String(cleanupError));}
      }
    } catch(err) {
      if(job){if(checkpoint)job=checkpoint;job.failures=(job.failures||0)+1;job.error=String(err.message||err);if(job.status!=='complete'&&job.failures>=3)job.status='failed';cacheSaveJob_(job);}
      console.error(String(err.message||err));
    } finally{lock.releaseLock();if(typeof CacheRetention!=='undefined')CacheRetention.run();}
  },
  report: function() {
    var id=PropertiesService.getScriptProperties().getProperty('ADR_CACHE_ACTIVE');
    if(!id) return {success:false,error:'Cache lengkap belum tersedia. Tunggu sinkronisasi lima sumber; tidak ada perhitungan dari data parsial.'};
    return cacheReadJson_(cacheReadJson_(id).reportId);
  },
  page: function(sourceKey,pageIndex) {
    var id=PropertiesService.getScriptProperties().getProperty('ADR_CACHE_ACTIVE');if(!id)throw new Error('Cache belum siap');
    var m=cacheReadJson_(id),source=m.pages.filter(function(s){return s.key===sourceKey;})[0], n=Number(pageIndex);
    if(!source||!Number.isInteger(n)||n<0||n>=source.pages.length)throw new Error('Halaman cache tidak valid');
    var result=cacheReadJson_(source.pages[n]);result.success=true;result.snapshotId=m.snapshotId;result.page=n;result.pageCount=source.pages.length;result.nextPage=n+1<source.pages.length?n+1:null;return result;
  }
};
