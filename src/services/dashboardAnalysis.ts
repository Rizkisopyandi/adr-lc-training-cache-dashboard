import {aggregate,validateCube,SOURCE_NAMES,type Bucket} from './executiveMetrics';
import {calendarError,filterEvents,jakartaToday,type CalendarEvent} from './trainingCalendar';
import type {CacheReport} from '../types/cache';

export interface AnalysisFilters {period:string;source:string;division:string}
export interface AnalysisFinding {id:string;title:string;program:string;date:string;evidence:string;source:string}
export interface AnalysisResult {
 rows:Bucket[];total:ReturnType<typeof aggregate>;periods:string[];divisions:string[];
 sources:{id:string;label:string;participants:number;classes:number;hours:number}[];
 trend:{label:string;value:number}[];categories:{label:string;value:number}[];
 events:CalendarEvent[];past:CalendarEvent[];attendance:null|{invited:number;attended:number;notRecordedPresent:number};
 calendarIssue:string;findings:AnalysisFinding[];
}
// Existing immutable report only. No credentials, new source reads, or demo fallbacks.
export function analyzeDashboard(report:CacheReport,filters:AnalysisFilters,today=jakartaToday()):AnalysisResult {
 if(!report.success||!report.snapshotId||!Array.isArray(report.sources)||!Object.keys(SOURCE_NAMES).every(key=>report.sources.some(s=>s.key===key)))throw new Error('Snapshot lima sumber belum lengkap.');
 const all=validateCube(report.executive);
 const scope=all.filter(r=>(!filters.source||r.source===filters.source)&&(!filters.division||r.division===filters.division));
 const rows=scope.filter(r=>!filters.period||r.period===filters.period);
 const sources=Object.entries(SOURCE_NAMES).filter(([id])=>!filters.source||filters.source===id).map(([id,label])=>{const metrics=aggregate(rows.filter(r=>r.source===id),'nipCount');return {id,label,participants:metrics.participants,classes:metrics.classCount,hours:metrics.participantHours};});
 const group=(items:Bucket[],key:'period'|'category')=>[...new Set(items.map(r=>r[key]))].sort().map(label=>({label:label||'Tidak terisi',value:aggregate(items.filter(r=>r[key]===label),'nipCount').participants}));
 const calendarIssue=filters.division?'Indeks agenda existing belum memuat divisi; kehadiran dan temuan agenda tidak dihitung pada filter divisi.':calendarError(report.calendar,report.snapshotId);
 const events=calendarIssue?[]:filterEvents(report.calendar!.events,filters.source,'',false).filter(e=>!filters.period||e.date.slice(0,7)===filters.period);
 // Today/upcoming sessions are excluded: no inference about their final attendance.
 const past=events.filter(e=>e.date<today),invited=past.reduce((n,e)=>n+e.invited,0),attended=past.reduce((n,e)=>n+e.attended,0);
 const findings:AnalysisFinding[]=[];
 for(const e of events){
  const source=Object.keys(e.sources).filter(id=>!filters.source||filters.source===id).map(id=>SOURCE_NAMES[id]||id).join(', ');
  if(e.date>=today){const missing=[!e.trainers.length?'trainer':'',!e.place?'tempat':'',!e.time?'waktu':''].filter(Boolean);if(missing.length)findings.push({id:e.id+'-readiness',title:'Lengkapi kesiapan jadwal',program:e.title,date:e.date,evidence:missing.join(', ')+' belum tersedia',source});}
  else if(!e.statuses.length)findings.push({id:e.id+'-status',title:'Verifikasi status pelaksanaan',program:e.title,date:e.date,evidence:'Status pelaksanaan belum terisi pada indeks agenda.',source});
 }
 return {rows,total:aggregate(rows,'nipCount'),periods:[...new Set(all.map(r=>r.period))].sort().reverse(),divisions:[...new Set(all.map(r=>r.division).filter(Boolean))].sort(),sources,trend:group(scope,'period'),categories:group(rows,'category'),events,past,attendance:calendarIssue?null:{invited,attended,notRecordedPresent:invited-attended},calendarIssue,findings};
}
