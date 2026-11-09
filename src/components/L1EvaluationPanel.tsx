import {useL1Cache} from './L1CacheProvider';
import {useMemo,useState} from 'react';
import {analyzeL1,demoL1,type L1Filters} from '../services/l1Evaluation';
import {HorizontalBarChart} from '../analysis-design/components/charts/HorizontalBarChart';
import {DonutChart} from '../analysis-design/components/charts/DonutChart';
import {LineChart} from '../analysis-design/components/charts/LineChart';
const percent=(n:number|null)=>n===null?'—':n.toLocaleString('id-ID',{maximumFractionDigits:2})+'%';
export function L1EvaluationPanel({demo}:{demo:boolean}){
 const {report:cached,status,error}=useL1Cache();
 const simulated=useMemo(()=>demo?demoL1():null,[demo]);const report=demo?simulated:cached;
 const [filters,setFilters]=useState<L1Filters>({period:'',program:'',trainer:''}),[target,setTarget]=useState(''),[page,setPage]=useState(0);
 const a=useMemo(()=>report?analyzeL1(report,filters):null,[report,filters]);
 const goal=target!==''&&Number.isFinite(Number(target))&&Number(target)>=0&&Number(target)<=100?Number(target):undefined;
 const change=(key:keyof L1Filters,value:string)=>{setFilters(f=>({...f,[key]:value}));setPage(0);};
 const groups=a?[{label:'Materi',score:a.materialScore,count:a.responses},{label:'Penyelenggara',score:a.organizerScore,count:a.responses},{label:'Trainer',score:a.trainerScore,count:a.trainerResponses}]:[];
 return <div className="space-y-4" aria-label="Evaluasi L1">
  <p className="text-sm text-slate-600">Kepuasan = proporsi nilai 4–5. Rata-rata aspek memakai jumlah respons sebagai penyebut, sesuai rumus laporan existing. Nilai kosong tetap masuk penyebut dan ditampilkan terpisah.</p>
  <p className="text-xs text-slate-500">Filter L1 terpisah dari database sumber/divisi training karena belum tersedia pemetaan identitas. Jumlah respons bukan jumlah peserta unik atau tingkat pengisian; L1 mengukur reaksi peserta, bukan peningkatan kompetensi.</p>
  {demo?<p className="training-demo">L1 SIMULASI · BUKAN DATA SPREADSHEET AKTUAL</p>:<a className="training-button" href="#/database">Kelola Cache L1 di Database</a>}
  {!demo&&status?.job?.status==='running'&&<p role="status" className="text-sm">Cache L1 sedang diperbarui. Snapshot lengkap sebelumnya tetap ditampilkan.</p>}
  {!demo&&(error||status?.job?.error||status?.stale)&&<p role="alert" className="training-alert">{error||status?.job?.error||'Cache L1 perlu diperbarui melalui halaman Database.'}</p>}
  {!a&&<p role="status" className="text-sm text-slate-500">{status?'Cache L1 belum tersedia. Buka Database untuk membuat snapshot pertama.':'Memeriksa snapshot cache L1…'}</p>}
  {a&&report&&<>
   <p className="text-xs text-slate-500">Snapshot L1 {new Date(report.generatedAt).toLocaleString('id-ID')} · cache L1 terpisah dari snapshot training.</p>
   <div className="flex flex-wrap gap-3">
    <label className="grid gap-1 text-xs">Periode L1<select aria-label="Periode L1" className="border rounded p-2 max-w-full" value={filters.period} onChange={e=>change('period',e.target.value)}><option value="">Seluruh periode</option>{a.periods.map(p=><option key={p}>{p}</option>)}</select></label>
    <label className="grid gap-1 text-xs min-w-0">Materi L1<select aria-label="Materi L1" className="border rounded p-2 max-w-full sm:max-w-72" value={filters.program} onChange={e=>change('program',e.target.value)}><option value="">Semua materi</option>{a.programs.map(p=><option key={p}>{p}</option>)}</select></label>
    <label className="grid gap-1 text-xs min-w-0">Trainer L1 · hanya penilaian trainer<select aria-label="Trainer L1" className="border rounded p-2 max-w-full sm:max-w-72" value={filters.trainer} onChange={e=>change('trainer',e.target.value)}><option value="">Semua trainer</option>{a.names.map(p=><option key={p}>{p}</option>)}</select></label>
    <label className="grid gap-1 text-xs">Target L1 pribadi (%)<input aria-label="Target L1 pribadi" className="border rounded p-2 w-32" type="number" min="0" max="100" value={target} onChange={e=>setTarget(e.target.value)}/></label>
   </div>
   {target!==''&&goal===undefined&&<p role="alert" className="text-sm text-rose-700">Target harus antara 0 dan 100.</p>}
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{groups.map(g=><article key={g.label} className="border rounded-lg p-4"><p className="text-xs text-slate-500">Kepuasan {g.label}</p><strong className="block text-2xl mt-2">{percent(g.score)}</strong><p className="text-xs mt-1">{g.count.toLocaleString('id-ID')} {g.label==='Trainer'?'penilaian slot trainer':'respons formulir'}</p>{goal!==undefined&&g.score!==null&&<p className="text-xs mt-1">{g.score>=goal?'Memenuhi':'Di bawah'} target pribadi {goal}% · selisih {(g.score-goal).toLocaleString('id-ID',{maximumFractionDigits:2})} poin persentase</p>}</article>)}</div>
   {!a.responses&&<p role="status">Tidak ada respons pada filter ini.</p>}
   <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{[{title:'Evaluasi materi',rows:a.material},{title:'Evaluasi penyelenggara',rows:a.organizer},{title:'Evaluasi trainer',rows:a.trainer}].map(g=><HorizontalBarChart key={g.title} title={g.title} unit="% nilai 4–5" maxValue={100} targetLine={goal||undefined} targetLabel="pribadi" data={g.rows.filter(r=>r.value!==null).map(r=>({label:r.label,value:r.value!,displayValue:percent(r.value),sublabel:`${r.positive}/${r.responses} positif · ${r.missing} kosong/invalid`}))}/>)}<DonutChart title="Distribusi seluruh jawaban aspek" subtitle="Unit jawaban aspek; satu formulir menghasilkan beberapa jawaban. Filter trainer hanya memengaruhi aspek trainer." unit="jawaban aspek" centerLabel="Jawaban" data={a.distribution}/></div>
   <LineChart title="Tren kepuasan materi" subtitle="Seluruh bulan yang memiliki respons; mengikuti filter materi. Bulan tanpa respons tidak diplot. Filter periode dan trainer tidak membatasi konteks tren." unit="% nilai 4–5" minY={0} maxY={100} formatValue={percent} data={a.trend}/>
   <HorizontalBarChart title="Perbandingan kepuasan trainer · 15 teratas" subtitle="Selalu lihat jumlah penilaian; bukan peringkat kinerja final" unit="% nilai 4–5" maxValue={100} data={a.ranking.slice(0,15).map(r=>({...r,displayValue:percent(r.value),sublabel:`${r.responses} penilaian slot`}))}/>
   <details className="border rounded-lg p-3"><summary className="cursor-pointer text-sm font-semibold">Rincian respons per materi / tanggal</summary><div className="overflow-x-auto"><table className="text-left text-xs w-full mt-3"><thead><tr>{['Materi','Tanggal','Respons'].map(h=><th key={h} className="p-2 border-b">{h}</th>)}</tr></thead><tbody>{a.sessions.slice(page*25,(page+1)*25).map(b=><tr key={JSON.stringify([b.program,b.date])}><td className="p-2 border-b">{b.program}</td><td className="p-2 border-b whitespace-nowrap">{b.date}</td><td className="p-2 border-b">{b.responses}</td></tr>)}</tbody></table></div><div className="flex gap-3 mt-3 items-center"><button className="training-button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Sebelumnya</button><span className="text-xs">{page+1} / {Math.max(1,Math.ceil(a.sessions.length/25))}</span><button className="training-button" disabled={(page+1)*25>=a.sessions.length} onClick={()=>setPage(p=>p+1)}>Berikutnya</button></div></details>
   <p className="text-xs text-slate-500">Pemeriksaan data: {report.skipped} respons tanpa materi/tanggal valid dikeluarkan; {report.blank} baris tanpa timestamp diabaikan; {report.unnamed} slot berisi nilai tanpa nama trainer dikeluarkan dari evaluasi trainer. Respons ganda belum dapat dibedakan tanpa ID responden. Target pribadi belum merupakan KPI resmi organisasi.</p>
  </>}
 </div>;
}
