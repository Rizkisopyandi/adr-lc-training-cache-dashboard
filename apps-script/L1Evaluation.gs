/** Read-only L1 source. Return aggregates only; never respondent comments or raw rows. */
var L1Evaluation=(function(){
 var ID='10DgCSgbUayP9okBQ2l-3OLe_Nx_o4T4exwYHLWEvvPA', PAGE=2000;
 function text(v){return String(v==null?'':v).trim();}
 function date(v){
  if(v instanceof Date&&!isNaN(v.getTime())){var dStr=Utilities.formatDate(v,'Asia/Bangkok','yyyy-MM-dd'),y=Number(dStr.slice(0,4));return (y>=2020&&y<=2030)?dStr:'';}
  var s=text(v),m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m)s=m[3]+'-'+m[2]+'-'+m[1];
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
  var year=Number(s.slice(0,4));if(year<2020||year>2030)return '';
  var d=new Date(s+'T00:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s?s:'';
 }
 function bucket(program,day,trainer,n){return {program:program,date:day,trainer:trainer,responses:0,counts:Array.from({length:n},function(){return [0,0,0,0,0,0];})};}
 function add(b,row,indices){b.responses++;indices.forEach(function(c,i){var v=text(row[c]),score=/^[1-5]$/.test(v)?Number(v):0;b.counts[i][score]++;});}
 function report(p){
  var sheet=SpreadsheetApp.openById(ID).getSheetByName('Form Responses 1');if(!sheet)throw new Error('Tab L1 Form Responses 1 tidak ditemukan.');
  var headers=sheet.getRange(1,1,1,38).getDisplayValues()[0];
  var expected={0:'Timestamp',1:'Materi Training',2:'Tanggal Pelaksanaan',4:'Tema pelatihan',10:'Service penyelenggara',12:'Nama Trainer',21:'Nama Trainer',30:'Nama Trainer'};
  ['Tema pelatihan','Manfaat materi bagi fungsi kerja','Kelengkapan materi sesuai dengan tema/topik pelatihan','Layout ruangan','Suasana ruangan','Perlengkapan dan alat bantu','Service penyelenggara'].forEach(function(h,i){expected[i+4]=h;});
  [12,21,30].forEach(function(start){['Penguasaan materi','Cara penyajian atau penyampaian','Menjawab pertanyaan','Interaksi dengan peserta','Pengaturan waktu','Activity/Game/Studi Kasus/ Role Play'].forEach(function(h,i){expected[start+1+i]=h;});});
  Object.keys(expected).forEach(function(c){if(text(headers[c])!==expected[c])throw new Error('Struktur kolom L1 berubah. Periksa pemetaan sebelum membaca data.');});
  var last=sheet.getLastRow(),row=Number(p.row||2),end=p.end?Number(p.end):last;
  if(!Number.isInteger(row)||row<2||!Number.isInteger(end)||end<1||end>last||row>end+1)throw new Error('Rentang L1 tidak valid atau sumber berubah; muat ulang.');
  if(p.end&&last!==end)throw new Error('Jumlah baris L1 berubah selama pembacaan; muat ulang.');
  var n=Math.max(0,Math.min(PAGE,end-row+1)),rows=n?sheet.getRange(row,1,n,38).getValues():[],sessions=new Map(),trainers=new Map(),skipped=0,blank=0,unnamed=0;
  rows.forEach(function(r){
   // Helper columns elsewhere in this sheet can extend lastRow: ignore rows without a response timestamp.
   if(!text(r[0])){blank++;return;}
   var program=text(r[1]),day=date(r[2]);if(!program||!day){skipped++;return;}
   var key=JSON.stringify([program,day]);if(!sessions.has(key))sessions.set(key,bucket(program,day,'',7));add(sessions.get(key),r,[4,5,6,7,8,9,10]);
   [12,21,30].forEach(function(start){var name=text(r[start]);if(!name){if(r.slice(start+1,start+7).some(function(v){return text(v)!=='';}))unnamed++;return;}
    var tk=JSON.stringify([program,day,name]);if(!trainers.has(tk))trainers.set(tk,bucket(program,day,name,6));add(trainers.get(tk),r,[start+1,start+2,start+3,start+4,start+5,start+6]);
   });
  });
  return {success:true,version:1,row:row,end:end,nextRow:row+n<=end?row+n:null,scanned:n,skipped:skipped,blank:blank,unnamed:unnamed,generatedAt:new Date().toISOString(),sessions:Array.from(sessions.values()),trainers:Array.from(trainers.values())};
 }
 return {report:report};
})();
