export interface Bucket {period:string;source:string;type:string;category:string;division:string;nipCount:number;divisionCount:number;hours:number;classes:Record<string,boolean>}
export interface Metrics {classCount:number;participants:number;participantHours:number}
export interface Filters {start:string;end:string;basis:'nipCount'|'divisionCount';source:string;type:string;category:string;division:string}
export const SOURCE_NAMES:Record<string,string>={ptu:'PTU',pto:'PTO',otomasi:'Otomasi',staff:'Staff',eksternal:'Eksternal'};
export const format=(v:number)=>v.toLocaleString('id-ID',{maximumFractionDigits:2});
export function offsetMonth(value:string,n:number){const [y,m]=value.split('-').map(Number);const d=new Date(y,m-1+n,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
export function currentMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
export function initialFilters():Filters {const end=currentMonth();return {start:offsetMonth(end,-2),end,basis:'nipCount',source:'',type:'',category:'',division:''};}
export function matches(b:Bucket,f:Filters){return b.period>=f.start&&b.period<=f.end&&(!f.source||b.source===f.source)&&(!f.type||b.type===f.type)&&(!f.category||b.category===f.category)&&(!f.division||b.division===f.division);}
export function aggregate(rows:Bucket[],basis:Filters['basis']):Metrics {const ids=new Set<string>();let participants=0,hours=0;for(const b of rows){participants+=b[basis];hours+=b.hours;for(const id of Object.keys(b.classes))ids.add(id);}return {classCount:ids.size,participants,participantHours:Math.round(hours*100)/100};}
export function select(rows:Bucket[],f:Filters){return aggregate(rows.filter(b=>matches(b,f)),f.basis);}
export function group(rows:Bucket[],f:Filters,key:'source'|'type'|'division'|'category'|'period') {const groups=new Map<string,Bucket[]>();for(const b of rows.filter(b=>matches(b,f))){const k=b[key]||'Tidak terisi';groups.set(k,[...(groups.get(k)||[]),b]);}return [...groups].map(([label,b])=>({label,...aggregate(b,f.basis)})).sort((a,b)=>b.participants-a.participants);}
export function validateCube(value:any):Bucket[] {
 if(value?.version!==3||!Array.isArray(value.buckets))throw new Error('Cache versi lama. Pasang backend v3 dan perbarui cache melalui Database.');
 for(const b of value.buckets){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.period)||!['source','type','category','division'].every(k=>typeof b[k]==='string')||!['nipCount','divisionCount','hours'].every(k=>typeof b[k]==='number'&&Number.isFinite(b[k])&&b[k]>=0)||!b.classes||typeof b.classes!=='object'||Array.isArray(b.classes)||!Object.values(b.classes).every(v=>v===true))throw new Error('Kontrak cache training tidak valid; angka tidak ditampilkan.');}return value.buckets;
}
