export interface InsightClass {
  id:string;source:string;classId:string;date:string;program:string;type:string;category:string;batch:string;
  batchMapped:boolean;scoreMapped:boolean;statusMapped:boolean;metadataConflict:boolean;
  state:'actual'|'cancelled'|'rescheduled'|'planned'|'unknown'|'conflict';
  invited:number;attended:number;scored:number;passed:number;excellent:number;failed:number;scoreSum:number;missingScore:number;invalidScore:number;
}
export interface QualityObjective {label:string;metric:'passRate'|'attendanceRate'|'realizationRate';target:number;source?:string;type?:string;category?:string}
export interface TrainingInsights {
  version:1;ready:true;snapshotId:string;sourceGeneratedAt:string;generatedAt:string;
  warning?:string;
  mapping:{passThreshold:number|null;excellentThreshold:number|null;objectives:QualityObjective[]};
  scannedRows:number;excludedRows:number;classes:InsightClass[];
}
export interface PendingInsights {version:1;ready:false;snapshotId:string;message:string;progress?:{status:string;error?:string;scannedPages?:number;totalPages?:number}|null}
const states=['actual','cancelled','rescheduled','planned','unknown','conflict'];
const countKeys=['invited','attended','scored','passed','excellent','failed','missingScore','invalidScore'] as const;
function threshold(v:unknown):v is number|null{return v===null||(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100);}
export function parseTrainingInsights(value:unknown,snapshotId:string):TrainingInsights {
  const v=value as TrainingInsights;
  if(!v||v.version!==1||v.ready!==true||v.snapshotId!==snapshotId||!Number.isFinite(Date.parse(v.generatedAt))||!Number.isFinite(Date.parse(v.sourceGeneratedAt))||!v.mapping||!threshold(v.mapping.passThreshold)||!threshold(v.mapping.excellentThreshold)||!Array.isArray(v.mapping.objectives)||!Array.isArray(v.classes)||!Number.isSafeInteger(v.scannedRows)||v.scannedRows<0||!Number.isSafeInteger(v.excludedRows)||v.excludedRows<0||v.excludedRows>v.scannedRows)throw new Error('Indeks analisis tidak valid atau berbeda snapshot.');
  if(v.mapping.excellentThreshold!==null&&(v.mapping.passThreshold===null||v.mapping.excellentThreshold<v.mapping.passThreshold))throw new Error('Ambang nilai tidak valid.');
  for(const o of v.mapping.objectives){if(!o||typeof o.label!=='string'||!o.label.trim()||!['passRate','attendanceRate','realizationRate'].includes(o.metric)||typeof o.target!=='number'||!Number.isFinite(o.target)||o.target<0||o.target>100||!['source','type','category'].every(k=>(o as any)[k]===undefined||typeof (o as any)[k]==='string'))throw new Error('Definisi Quality Objective tidak valid.');}
  const ids=new Set<string>();let rows=0;
  for(const c of v.classes){
    if(!c||!['id','source','classId','date','program','type','category','batch'].every(k=>typeof (c as any)[k]==='string')||!c.id||ids.has(c.id)||!['ptu','pto','otomasi','staff','eksternal'].includes(c.source)||!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(c.date)||!Number.isFinite(Date.parse(c.date))||new Date(c.date).toISOString().slice(0,10)!==c.date||!['batchMapped','scoreMapped','statusMapped','metadataConflict'].every(k=>typeof (c as any)[k]==='boolean')||!states.includes(c.state)||!countKeys.every(k=>Number.isSafeInteger(c[k])&&c[k]>=0)||typeof c.scoreSum!=='number'||!Number.isFinite(c.scoreSum)||c.scoreSum<0||c.scoreSum>c.scored*100||c.invited<1||c.attended>c.invited||c.scored>c.attended||c.excellent>c.passed||(v.mapping.passThreshold!==null&&c.passed+c.failed!==c.scored)||(v.mapping.passThreshold===null&&(c.passed!==0||c.failed!==0))||(v.mapping.excellentThreshold===null&&c.excellent!==0)||(c.scoreMapped&&c.scored+c.missingScore+c.invalidScore!==c.attended)||(!c.scoreMapped&&(c.scored+c.passed+c.failed+c.missingScore+c.invalidScore+c.scoreSum!==0)))throw new Error('Agregat kelas analisis tidak valid; hasil tidak ditampilkan.');
    ids.add(c.id);rows+=c.invited;
  }
  if(rows+v.excludedRows!==v.scannedRows)throw new Error('Rekonsiliasi indeks analisis gagal.');
  return v;
}
export function insightTotals(rows:InsightClass[]){
  const sum=(key:typeof countKeys[number]|'scoreSum')=>rows.reduce((n,r)=>n+r[key],0);
  return {planned:rows.length,actual:rows.filter(r=>r.state==='actual').length,cancelled:rows.filter(r=>r.state==='cancelled').length,rescheduled:rows.filter(r=>r.state==='rescheduled').length,unknown:rows.filter(r=>r.state==='unknown'||r.state==='conflict').length,invited:sum('invited'),attended:sum('attended'),scored:sum('scored'),passed:sum('passed'),failed:sum('failed'),excellent:sum('excellent'),scoreSum:sum('scoreSum'),missing:sum('missingScore'),invalid:sum('invalidScore'),scoreMapped:rows.length>0&&rows.every(r=>r.scoreMapped),batchMapped:rows.length>0&&rows.every(r=>r.batchMapped),statusMapped:rows.length>0&&rows.every(r=>r.statusMapped)};
}
export const percent=(n:number,d:number)=>d>0?100*n/d:null;
export function objectiveResult(rows:InsightClass[],o:QualityObjective,passThreshold:number|null){
  const selected=rows.filter(r=>(!o.source||r.source===o.source)&&(!o.type||r.type===o.type)&&(!o.category||r.category===o.category)),t=insightTotals(selected);
  if(o.metric==='passRate')return {value:passThreshold!==null&&t.scoreMapped?percent(t.passed,t.scored):null,numerator:t.passed,denominator:t.scored,basis:'Lulus / peserta hadir yang dinilai'};
  if(o.metric==='realizationRate')return {value:t.statusMapped&&t.unknown===0?percent(t.actual,t.planned):null,numerator:t.actual,denominator:t.planned,basis:'Kelas terlaksana / kelas terjadwal'};
  return {value:percent(t.attended,t.invited),numerator:t.attended,denominator:t.invited,basis:'Hadir / undangan pada kelas terpilih'};
}
