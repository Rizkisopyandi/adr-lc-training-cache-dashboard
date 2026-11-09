import {gasCall} from './transport';
export const materialAspects=['Tema pelatihan','Manfaat bagi fungsi kerja','Kelengkapan materi'];
export const organizerAspects=['Layout ruangan','Suasana ruangan','Perlengkapan dan alat bantu','Pelayanan penyelenggara'];
export const trainerAspects=['Penguasaan materi','Penyampaian','Menjawab pertanyaan','Interaksi peserta','Pengaturan waktu','Aktivitas / studi kasus'];
export type L1Bucket={program:string;date:string;trainer:string;responses:number;counts:number[][]};
export type L1Report={sessions:L1Bucket[];trainers:L1Bucket[];skipped:number;blank:number;unnamed:number;generatedAt:string;end:number};
export type L1Filters={period:string;program:string;trainer:string};
function validBucket(b:any,n:number):b is L1Bucket{return b&&typeof b.program==='string'&&typeof b.trainer==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(b.date)&&Number.isSafeInteger(b.responses)&&b.responses>0&&Array.isArray(b.counts)&&b.counts.length===n&&b.counts.every((c:any)=>Array.isArray(c)&&c.length===6&&c.every((v:any)=>Number.isSafeInteger(v)&&v>=0)&&c.reduce((a:number,v:number)=>a+v,0)===b.responses);}
function merge(map:Map<string,L1Bucket>,rows:L1Bucket[]){for(const b of rows){const key=JSON.stringify([b.program,b.date,b.trainer]),old=map.get(key);if(!old)map.set(key,{...b,counts:b.counts.map(c=>[...c])});else{old.responses+=b.responses;b.counts.forEach((c,i)=>c.forEach((v,j)=>old.counts[i][j]+=v));}}}
// A partial scan is never published as the full result. Stop on cancellation or incompatible backend.
export async function loadL1(progress:(n:number,total:number)=>void,cancelled:()=>boolean,call=gasCall):Promise<L1Report>{
 const sessions=new Map<string,L1Bucket>(),trainers=new Map<string,L1Bucket>();let row=2,end:number|undefined,skipped=0,blank=0,unnamed=0,generatedAt='';
 for(let page=0;page<1000;page++){
  if(cancelled())throw new Error('Pembacaan dibatalkan.');
  const p=await call('l1Report',{row,...(end===undefined?{}:{end})});
  if(cancelled())throw new Error('Pembacaan dibatalkan.');
  if(p?.success!==true||p.version!==1)throw new Error(p?.error||'Backend L1 belum tersedia. Perbarui Apps Script dengan paket L1.');
  if(p.row!==row||!Number.isSafeInteger(p.end)||p.end<1||(end!==undefined&&p.end!==end)||!Number.isSafeInteger(p.scanned)||p.scanned!==Math.min(2000,Math.max(0,p.end-row+1))||p.nextRow!==(row+p.scanned<=p.end?row+p.scanned:null)||!Array.isArray(p.sessions)||!p.sessions.every((b:any)=>validBucket(b,7))||!Array.isArray(p.trainers)||!p.trainers.every((b:any)=>validBucket(b,6))||!['skipped','blank','unnamed'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0)||!Number.isFinite(Date.parse(p.generatedAt)))throw new Error('Kontrak data L1 tidak valid. Hasil parsial tidak ditampilkan.');
  if(p.sessions.reduce((n:number,b:L1Bucket)=>n+b.responses,0)+p.skipped+p.blank!==p.scanned)throw new Error('Jumlah respons L1 tidak cocok dengan baris yang dipindai.');
  const totalEnd:number=p.end;end=totalEnd;merge(sessions,p.sessions);merge(trainers,p.trainers);skipped+=p.skipped;blank+=p.blank;unnamed+=p.unnamed;generatedAt=p.generatedAt;progress(Math.min(totalEnd-1,row+p.scanned-2),Math.max(0,totalEnd-1));
  if(p.nextRow===null)return {sessions:[...sessions.values()],trainers:[...trainers.values()],skipped,blank,unnamed,generatedAt,end:totalEnd};
  row=p.nextRow;
 }
 throw new Error('Sumber L1 terlalu besar; hasil parsial tidak ditampilkan.');
}
export function summarizeL1(rows:L1Bucket[],labels:string[],offset=0){
 const responses=rows.reduce((n,b)=>n+b.responses,0);
 return labels.map((label,i)=>{const counts=Array.from({length:6},(_,j)=>rows.reduce((n,b)=>n+b.counts[i+offset][j],0)),positive=counts[4]+counts[5];return {label,counts,responses,positive,missing:counts[0],value:responses?100*positive/responses:null};});
}
export function analyzeL1(report:L1Report,filters:L1Filters){
 const base=(b:L1Bucket)=>(!filters.period||b.date.startsWith(filters.period))&&(!filters.program||b.program===filters.program);
 const sessions=report.sessions.filter(base),trainers=report.trainers.filter(b=>base(b)&&(!filters.trainer||b.trainer===filters.trainer));
 const material=summarizeL1(sessions,materialAspects),organizer=summarizeL1(sessions,organizerAspects,3),trainer=summarizeL1(trainers,trainerAspects);
 const average=(aspects:ReturnType<typeof summarizeL1>)=>aspects[0].responses?aspects.reduce((n,a)=>n+a.value!,0)/aspects.length:null;
 const periods=[...new Set(report.sessions.map(b=>b.date.slice(0,7)))].sort(),programs=[...new Set(report.sessions.map(b=>b.program))].sort(),names=[...new Set(report.trainers.map(b=>b.trainer))].sort();
 const distribution=Array.from({length:6},(_,j)=>({label:j?'Nilai '+j:'Kosong / tidak valid',value:[...material,...organizer,...trainer].reduce((n,a)=>n+a.counts[j],0),color:['#94a3b8','#dc2626','#ea580c','#d97706','#0284c7','#059669'][j]}));
 const ranking=[...new Set(trainers.map(b=>b.trainer))].map(name=>{const rows=trainers.filter(b=>b.trainer===name),aspects=summarizeL1(rows,trainerAspects);return {label:name,value:average(aspects)!,responses:aspects[0].responses};}).sort((a,b)=>b.value-a.value||b.responses-a.responses);
 const trend=periods.map(period=>{const rows=report.sessions.filter(b=>b.date.startsWith(period)&&(!filters.program||b.program===filters.program));return {label:period,value:average(summarizeL1(rows,materialAspects)),subvalue:rows.reduce((n,b)=>n+b.responses,0)+' respons'};}).filter((p):p is {label:string;value:number;subvalue:string}=>p.value!==null);
 return {sessions,trainers,material,organizer,trainer,materialScore:average(material),organizerScore:average(organizer),trainerScore:average(trainer),responses:sessions.reduce((n,b)=>n+b.responses,0),trainerResponses:trainers.reduce((n,b)=>n+b.responses,0),periods,programs,names,distribution,ranking,trend};
}
export function demoL1():L1Report{
 const counts=(n:number)=>Array.from({length:n},(_,i)=>i%2?[1,0,0,1,3,5]:[0,0,1,1,2,6]);
 return {sessions:[{program:'Contoh Training · SIMULASI',date:'2026-11-09',trainer:'',responses:10,counts:counts(7)}],trainers:[{program:'Contoh Training · SIMULASI',date:'2026-11-09',trainer:'Trainer Demo',responses:10,counts:counts(6)}],skipped:0,blank:0,unnamed:0,end:11,generatedAt:'2026-11-09T03:00:00Z'};
}
