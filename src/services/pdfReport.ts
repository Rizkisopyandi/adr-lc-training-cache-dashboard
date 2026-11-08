// Standalone vector PDF: no external service and no screen capture clipping.
// ASCII built-in font keeps this export self-contained inside Apps Script.
import type {Metrics} from './executiveMetrics';
interface ReportSection {title:string;rows:{label:string;metrics:Metrics}[];chart?:boolean}
export function downloadPdf(meta:{title:string;period:string;basis:string;snapshot:string;generated:string;filters:string;demo:boolean},sections:ReportSection[]){
 const pages:string[]=[];let ops:string[]=[],y=540,page=0;
 const clean=(s:string)=>s.normalize('NFKD').replace(/[^\x20-\x7E]/g,' ').replace(/[\\()]/g,'\\$&');
 const text=(s:string,x:number,yy:number,size=10)=>ops.push(`BT /F1 ${size} Tf ${x} ${yy} Td (${clean(s)}) Tj ET`);
 function begin(){page++;ops=[];y=540;ops.push('0.04 0.24 0.22 rg 0 564 842 31 re f','1 1 1 rg');text('ADR LEARNING CENTER | '+meta.title,34,575,12);if(meta.demo)text('SIMULASI - BUKAN DATA AKTUAL',580,575,10);ops.push('0 0 0 rg');text(meta.period+' | '+meta.basis,34,y,11);y-=20;text(meta.filters,34,y,8);y-=20;}
 function end(){text(`Snapshot: ${meta.snapshot} | Cache: ${meta.generated}`,34,25,7);text(`Halaman ${page}`,760,25,8);pages.push(ops.join('\n'));}
 const num=(n:number)=>n.toLocaleString('id-ID',{maximumFractionDigits:2});
 begin();
 for(const section of sections){if(y<110){end();begin();}text(section.title,34,y,12);y-=24;
  const max=Math.max(1,...section.rows.map(r=>r.metrics.participants));
  for(const row of section.rows){if(y<65){end();begin();text(section.title+' (lanjutan)',34,y,12);y-=24;}
   const lines=row.label.match(/.{1,65}(\s|$)|.{1,65}/g)||[''];for(let i=0;i<lines.length;i++)text(lines[i],34,y-i*12,9);
   text(`${num(row.metrics.classCount)} kelas | ${num(row.metrics.participants)} partisipasi | ${num(row.metrics.participantHours)} jam-peserta`,400,y,9);
   y-=Math.max(20,lines.length*12+6);
   if(section.chart){ops.push('0.05 0.52 0.40 rg',`400 ${y} ${Math.max(0,row.metrics.participants/max*360)} 5 re f`,'0 0 0 rg');y-=15;}
  }y-=13;
 }end();
 const objects:string[]=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const kids:number[]=[];
 for(const content of pages){const pageId=objects.length+1,streamId=pageId+1;kids.push(pageId);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);}
 objects[1]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k=>k+' 0 R').join(' ')}] >>`;
 let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(const n of offsets.slice(1))pdf+=`${String(n).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=`ADR-Training-${meta.period.replace(/[^\w-]/g,'_')}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
