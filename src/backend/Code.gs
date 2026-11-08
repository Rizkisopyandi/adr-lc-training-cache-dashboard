/** Install in the separate Executive project only. */
function executiveAuthorize_() {
 var email=Session.getActiveUser().getEmail().toLowerCase();
 var allowed=String(PropertiesService.getScriptProperties().getProperty('ADR_ALLOWED_EMAILS')||'').toLowerCase().split(',').map(function(s){return s.trim();});
 if(!email||allowed.indexOf(email)<0)throw new Error('Akses belum diizinkan. Masuk dengan akun yang didaftarkan administrator.');
}
function executiveDispatch_(action,p) {
 p=p||{};var source=String(p.source||'ptu');
 if(action==='getStatus'||action==='testConnection')return DatabaseService.getStatus(source);
 if(action==='getPreview')return DatabaseService.getPreview(source,10);
 if(action==='cacheStatus'){var state=ExecutiveCache.status();state.calendarVersion=PropertiesService.getScriptProperties().getProperty('ADR_CALENDAR_VERSION')||'';state.calendarVersion+='|'+(PropertiesService.getScriptProperties().getProperty('ADR_CALENDAR_PROGRESS')||'');return state;}
 if(action==='cacheReport'){var report=ExecutiveCache.report();if(report.success)report.calendar=TrainingCalendar.report(report.snapshotId);return report;}
 if(action==='cacheStart')return ExecutiveCache.requestRefresh(p.force===true||p.force==='true');
 throw new Error('Action tidak dikenal');
}
function executiveRpc(action,p) {
 executiveAuthorize_();
 try{return JSON.parse(JSON.stringify(executiveDispatch_(action,p)));}
 catch(e){return {success:false,error:String(e.message||e)};}
}
function doGet(e) {
 var p=e&&e.parameter||{};
 if(!p.action)return HtmlService.createHtmlOutputFromFile('Index').setTitle('ADR Learning Center | Training Intelligence').addMetaTag('viewport','width=device-width, initial-scale=1');
 var result;
 try{
  var token=PropertiesService.getScriptProperties().getProperty('ADR_API_TOKEN');
  if(!token||p.token!==token)throw new Error('API token server tidak valid. Gunakan web app atau konfigurasi token di server AI Studio.');
  result=executiveDispatch_(p.action,p);
 }catch(err){result={success:false,error:String(err.message||err),columns:[],records:[]};}
 return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
function setupExecutiveAccess_() {
 var props=PropertiesService.getScriptProperties(),email=Session.getEffectiveUser().getEmail();
 if(!props.getProperty('ADR_ALLOWED_EMAILS'))props.setProperty('ADR_ALLOWED_EMAILS',email);
 if(!props.getProperty('ADR_API_TOKEN'))props.setProperty('ADR_API_TOKEN',Utilities.getUuid()+Utilities.getUuid());
 Logger.log('Akses pemilik disiapkan. Atur ADR_ALLOWED_EMAILS dan salin ADR_API_TOKEN dari Script Properties jika memakai AI Studio.');
}
