/** Tambahkan hanya pada project Executive Dashboard terpisah. */
function adminSetupCheck_() {
  var ownerEmail = 'GANTI_DENGAN_EMAIL_GOOGLE_ANDA';
  var currentEmail = Session.getActiveUser().getEmail();
  if (!currentEmail || currentEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
    throw new Error('Ganti ownerEmail pada AdminSetup.gs dengan email Google pemilik project, lalu jalankan dari editor memakai akun tersebut.');
  }
}

function setupExecutiveAccess() {
  adminSetupCheck_();
  setupExecutiveAccess_();
}

function installExecutiveCache() {
  adminSetupCheck_();
  installExecutiveCache_();
}

/** Pilih NIP peserta sesuai header dan mulai ulang cache, tanpa menulis spreadsheet. */
function configureTrainingNipCache() {
  adminSetupCheck_();
  var selections = {ptu:13, pto:12, otomasi:12};
  var settings = {};
  Object.keys(selections).forEach(function(key) {
    var c = DatabaseService.openSource(key), index = selections[key] - 1;
    if (normalizeHeader_(c.headers[index]) !== 'nip' || normalizeHeader_(c.headers[index-1]) !== 'namalengkap') {
      throw new Error('Header NIP peserta berubah untuk ' + key + '. Pengaturan belum disimpan.');
    }
    settings['ADR_NIP_COLUMN_' + key.toUpperCase()] = String(selections[key]);
  });
  PropertiesService.getScriptProperties().setProperties(settings);
  Logger.log('Pilihan NIP peserta disimpan: PTU=13, PTO=12, Otomasi=12.');
  Logger.log(JSON.stringify(ExecutiveCache.requestRefresh(true)));
  ExecutiveCache.tick();
  Logger.log(JSON.stringify(ExecutiveCache.status()));
}

/** Lanjutkan checkpoint aktif; tidak memulai ulang job yang sudah selesai. */
function continueTrainingCache() {
  adminSetupCheck_();
  ADR_CACHE_PAGE_ROWS = 2000;
  for (var step = 0; step < 3; step++) {
    var before = ExecutiveCache.status();
    if (!before.job || before.job.status !== 'running') break;
    var workerLock = LockService.getScriptLock();
    if (!workerLock.tryLock(40000)) { Logger.log('Worker terjadwal masih aktif; lanjut pada pemanggilan berikutnya.'); break; }
    workerLock.releaseLock();
    ExecutiveCache.tick();
    var state = ExecutiveCache.status();
    Logger.log(JSON.stringify({job:state.job,snapshotId:state.snapshotId,generatedAt:state.generatedAt,stale:state.stale}));
    if (!state.job || state.job.status !== 'running') break;
  }
}
function checkTrainingCache() {
  adminSetupCheck_();
  var state = ExecutiveCache.status();
  var output = {job:state.job,snapshotId:state.snapshotId,generatedAt:state.generatedAt,stale:state.stale};
  if (state.ready && !state.stale) {
    var report = ExecutiveCache.report(), cube = report.executive;
    if (!cube || cube.version !== 3 || !Array.isArray(cube.buckets)) throw new Error('Kontrak cube v3 belum tersedia.');
    var keys = ['ptu','pto','otomasi','staff','eksternal'];
    if (report.sources.length !== 5 || !keys.every(function(k){return report.sources.some(function(s){return s.key === k;});})) throw new Error('Snapshot tidak memuat lima sumber lengkap.');
    cube.buckets.forEach(function(b){
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.period) || keys.indexOf(b.source)<0 || !b.type || !b.classes || Array.isArray(b.classes)) throw new Error('Kontrak dimensi cube tidak valid.');
      ['nipCount','divisionCount','hours'].forEach(function(k){if(typeof b[k]!=='number'||!isFinite(b[k])||b[k]<0)throw new Error('Metrik cube tidak valid.');});
      if(!Object.keys(b.classes).every(function(k){return b.classes[k]===true;}))throw new Error('Kontrak kelas tidak valid.');
    });
    var end = Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM');
    var y=Number(end.slice(0,4)),m=Number(end.slice(5)),startMonth=m-2;
    if(startMonth<=0){startMonth+=12;y--;}
    var start=y+'-'+('0'+startMonth).slice(-2);
    function metrics(first,last,basis){
      var classes={},participants=0,hours=0;
      cube.buckets.forEach(function(b){if(b.period<first||b.period>last)return;participants+=b[basis];hours+=b.hours;Object.keys(b.classes).forEach(function(k){classes[k]=true;});});
      return {start:first,end:last,basis:basis,classCount:Object.keys(classes).length,participants:participants,participantHours:Math.round(hours*100)/100};
    }
    output.version=cube.version;output.buckets=cube.buckets.length;
    output.reportBytes=Utilities.newBlob(JSON.stringify(report)).getBytes().length;
    output.recordCount=report.sources.reduce(function(n,s){return n+s.recordCount;},0);
    output.sources=report.sources;
    output.threeMonths=metrics(start,end,'nipCount');
    output.monthly=metrics(end,end,'divisionCount');
    output.validation='PASS: lima sumber lengkap dan kontrak cube cocok dengan dashboard';
  }
  Logger.log(JSON.stringify(output));
}
