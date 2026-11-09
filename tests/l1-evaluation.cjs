const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const moduleL1={exports:{}};vm.runInNewContext(buildSync({entryPoints:['src/services/l1Evaluation.ts'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,{module:moduleL1,exports:moduleL1.exports,require,console,Date,AbortSignal});
const {loadL1,analyzeL1,demoL1}=moduleL1.exports;
const headers=Array(38).fill('');headers[0]='Timestamp';headers[1]='Materi Training';headers[2]='Tanggal Pelaksanaan';
['Tema pelatihan','Manfaat materi bagi fungsi kerja','Kelengkapan materi sesuai dengan tema/topik pelatihan','Layout ruangan','Suasana ruangan','Perlengkapan dan alat bantu','Service penyelenggara'].forEach((h,i)=>headers[i+4]=h);
for(const start of [12,21,30]){headers[start]='Nama Trainer';['Penguasaan materi','Cara penyajian atau penyampaian','Menjawab pertanyaan','Interaksi dengan peserta','Pengaturan waktu','Activity/Game/Studi Kasus/ Role Play'].forEach((h,i)=>headers[start+1+i]=h);}
function response(day='09/11/2026',score=5){const r=Array(38).fill('');r[0]='09/11/2026 10:00';r[1]='Program A';r[2]=day;for(let i=4;i<=10;i++)r[i]=score;r[12]='Trainer A';for(let i=13;i<=18;i++)r[i]=score;return r;}
const first=response(),second=response(undefined,3);second[4]='';second[21]='Trainer B';for(let i=22;i<=27;i++)second[i]=4;second[30]='Trainer C';for(let i=31;i<=36;i++)second[i]=2;
const rows=[first,second,response('31/02/2026'),Array(38).fill('')];
let last=2002;while(rows.length<2001)rows.push(Array(38).fill(''));rows[2000]=response('10/11/2026',4);
const sheet={getLastRow:()=>last,getRange:(row,col,n,width)=>({getDisplayValues:()=>[headers],getValues:()=>rows.slice(row-2,row-2+n)})};
const sandbox={Date,Map,Utilities:{formatDate:d=>d.toISOString().slice(0,10)},SpreadsheetApp:{openById:id=>{assert.equal(id,'10DgCSgbUayP9okBQ2l-3OLe_Nx_o4T4exwYHLWEvvPA');return {getSheetByName:name=>{assert.equal(name,'Form Responses 1');return sheet;}};}}};
vm.runInNewContext(fs.readFileSync('src/backend/L1Evaluation.gs','utf8'),sandbox);
(async()=>{
 let calls=0;const progress=[];const report=await loadL1((n,total)=>progress.push([n,total]),()=>false,async(action,p)=>{assert.equal(action,'l1Report');calls++;return sandbox.L1Evaluation.report(p);});
 assert.equal(calls,2);assert.equal(report.skipped,1);assert.equal(report.sessions.reduce((n,b)=>n+b.responses,0),3);assert.equal(progress.at(-1)[0],2001);
 const a=analyzeL1(report,{period:'2026-11',program:'',trainer:''});assert.equal(a.responses,3);assert.equal(a.trainerResponses,5);assert.equal(a.material[0].missing,1);assert.equal(a.material[0].positive,2);assert.ok(Math.abs(a.materialScore-200/3)<1e-10);assert.equal(a.ranking.length,3);
 const b=analyzeL1(report,{period:'',program:'',trainer:'Trainer B'});assert.equal(b.responses,3);assert.equal(b.trainerResponses,1);assert.equal(b.trainerScore,100);assert.equal(b.materialScore,a.materialScore);
 const empty=analyzeL1(report,{period:'1999-01',program:'',trainer:''});assert.equal(empty.materialScore,null);assert.equal(empty.trainerScore,null);
 assert.equal(a.distribution.reduce((n,d)=>n+d.value,0),3*7+5*6);
 assert.ok(!JSON.stringify(report).includes('Komentar'));assert.ok(!JSON.stringify(report).includes('Timestamp'));
 await assert.rejects(()=>loadL1(()=>{},()=>true,async()=>{throw Error('should not call');}),/dibatalkan/);
 await assert.rejects(()=>loadL1(()=>{},()=>false,async()=>({success:false,error:'Action tidak dikenal'})),/Action tidak dikenal/);
 let pages=0;await assert.rejects(()=>loadL1(()=>{},()=>false,async(_,p)=>{const r=sandbox.L1Evaluation.report(p);if(++pages===2)r.sessions[0].counts[0][4]=-1;return r;}),/Kontrak/);
 const page=sandbox.L1Evaluation.report({row:2});last++;assert.throws(()=>sandbox.L1Evaluation.report({row:2002,end:page.end}),/berubah/);last--;
 headers[4]='wrong';assert.throws(()=>sandbox.L1Evaluation.report({row:2}),/Struktur/);headers[4]='Tema pelatihan';
 assert.equal(analyzeL1(demoL1(),{period:'',program:'',trainer:''}).responses,10);
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),ui={exports:{}};
 vm.runInNewContext(buildSync({entryPoints:['src/components/L1EvaluationPanel.tsx'],bundle:true,platform:'node',format:'cjs',external:['react','react-dom'],write:false}).outputFiles[0].text,{module:ui,exports:ui.exports,require,console,Date});
 const html=renderToStaticMarkup(React.createElement(ui.exports.L1EvaluationPanel,{demo:true}));
 for(const label of ['L1 SIMULASI','Periode L1','Trainer L1','Evaluasi materi','Evaluasi penyelenggara','Evaluasi trainer','Distribusi seluruh jawaban aspek','Tren kepuasan materi','Rincian respons'])assert.ok(html.includes(label),label);
 const pending=renderToStaticMarkup(React.createElement(ui.exports.L1EvaluationPanel,{demo:false}));assert.ok(pending.includes('Muat data L1'));assert.ok(!pending.includes('Trainer Demo'));
 console.log('PASS L1: read-only paged source, 3 trainer slots, positive 4–5 denominator, blanks, invalid date/header, filtered/empty states, row reconciliation, complete-only results, cancellation and changed source.');
})().catch(e=>{console.error(e);process.exitCode=1;});
