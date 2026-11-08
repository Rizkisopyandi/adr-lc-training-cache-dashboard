/** Executive Dashboard only. All spreadsheet access is read-only. */
var SOURCE_CONFIG = {
  ptu: { spreadsheetId: '1mvZxcYjGwQk5fuAnMGaywUBGGL5_C1eQNK08J04sKjs', sheetName: 'DataBase', idColumn: 'ID_Training' },
  // Other IDs in the ZIP repeat PTU's ID and are unverified. Fill correct existing source IDs before enabling.
  pto: { spreadsheetId: '1gb0cMY9F4rw7YS0yeqTytOncxAvMuXubo9GgeE1bZSI', sheetName: 'DataBase', idColumn: 'ID_Training' },
  otomasi: { spreadsheetId: '1WZ2SZ7nEV_orKrg3Ht8tOjf5E8UXLwi5NsgvoDHFjbY', sheetName: 'DataBase', idColumn: 'ID_Training' },
  staff: { spreadsheetId: '1qoYM88IRSU8gKuU_XeDP0Cbfg0Hwk2LDb3Xpd-zbp9c', sheetName: 'Database_2026', idColumn: 'No Und' },
  eksternal: { spreadsheetId: '150Na8hW2n6_lodveSTeP4W4hA0rCosY1jfPi9q7F6Fk', sheetName: 'DataBase', idColumn: 'No Und' }
};
function normalizeHeader_(value) { return String(value).trim().toLowerCase().replace(/[\s_-]+/g, ''); }
var DatabaseService = {
  openSource: function(key) {
    var config = SOURCE_CONFIG[key];
    if (!config) throw new Error('Source tidak dikenal: ' + key);
    if (!config.spreadsheetId) throw new Error('Konfigurasi sumber ' + key + ' belum diverifikasi. Isi ID sumber yang benar pada backend Executive.');
    var sheet = SpreadsheetApp.openById(config.spreadsheetId).getSheetByName(config.sheetName);
    if (!sheet) throw new Error('Worksheet ' + config.sheetName + ' tidak ditemukan untuk ' + key);
    var width = sheet.getLastColumn();
    var headers = width ? sheet.getRange(1, 1, 1, width).getDisplayValues()[0] : [];
    var idIndex = headers.map(normalizeHeader_).indexOf(normalizeHeader_(config.idColumn));
    var recordIndex = config.recordColumn ? headers.map(normalizeHeader_).indexOf(normalizeHeader_(config.recordColumn)) : idIndex;
    if (config.recordColumn && recordIndex < 0) throw new Error('Kolom penanda record ' + config.recordColumn + ' tidak ditemukan untuk ' + key);
    return { sheet: sheet, headers: headers, idIndex: idIndex, recordIndex: recordIndex, config: config };
  },
  getStatus: function(sourceKey) {
    var c = this.openSource(sourceKey);
    return { success: true, sourceKey: sourceKey, status: 'Connected', sheetName: c.sheet.getName(), columnCount: c.headers.length, idColumnFound: c.idIndex >= 0 };
  },
  getPreview: function(sourceKey, limit) {
    var properties=PropertiesService.getScriptProperties(),active=properties.getProperty('ADR_CACHE_ACTIVE');
    if(!active)throw new Error('Cache lengkap belum siap. Tunggu sinkronisasi lima sumber.');
    var manifest=cacheReadJson_(active),info=manifest.sources.filter(function(s){return s.key===sourceKey;})[0];
    if(!info)throw new Error('Source tidak ditemukan pada snapshot.');
    var item=manifest.pages.filter(function(s){return s.key===sourceKey;})[0],records=[],sourceRows=[],columns=[];
    for(var i=0;i<item.pages.length&&records.length<10;i++){
      var page=cacheReadJson_(item.pages[i]);columns=page.columns;
      for(var j=0;j<page.records.length&&records.length<10;j++){records.push(page.records[j]);sourceRows.push(page.sourceRows[j]);}
    }
    return {success:true,sourceKey:sourceKey,sheetName:info.sheetName,columns:columns,records:records,totalRecords:info.recordCount,sourceRows:sourceRows,spreadsheetId:info.spreadsheetId,snapshotId:manifest.snapshotId,contractVersion:'preview-v1',action:'getPreview'};
  }
};
