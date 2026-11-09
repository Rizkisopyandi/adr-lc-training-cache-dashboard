import {L1EvaluationPanel} from './L1EvaluationPanel';
import {TrainingInsightCards} from './TrainingInsightCards';

import {lazy,Suspense,useMemo,useState,type ReactNode} from 'react';

import {BarChart3,ChevronDown,GraduationCap,MessageSquare,ShieldCheck,SlidersHorizontal,Users} from 'lucide-react';

import {DonutChart} from '../analysis-design/components/charts/DonutChart';

import {LineChart} from '../analysis-design/components/charts/LineChart';

import {HorizontalBarChart} from '../analysis-design/components/charts/HorizontalBarChart';

import {analyzeDashboard,type AnalysisFilters} from '../services/dashboardAnalysis';

import {format,SOURCE_NAMES} from '../services/executiveMetrics';

import type {CacheViewState} from './CachePanel';

import './analysis-dashboard.css';

const DesignPreview=lazy(()=>import('../analysis-design/components/dashboard/DashboardView').then(m=>({default:m.DashboardView})));

const colors=['#059669','#0284c7','#7c3aed','#d97706','#64748b'];

function Metric({label,value,note}:{label:string;value:string;note:string}){return <article className="rounded-lg border border-slate-200 bg-white p-4 min-w-0"><p className="text-xs text-slate-500">{label}</p><strong className="block text-2xl font-bold text-slate-900 mt-2 break-words">{value}</strong><p className="text-xs text-slate-500 mt-1">{note}</p></article>}

function Section({id,title,subtitle,icon,children}:{id:string;title:string;subtitle:string;icon:ReactNode;children:ReactNode}){return <details id={id} open className="rounded-xl border border-slate-200 bg-white overflow-hidden"><summary className="flex items-center gap-3 p-5 cursor-pointer"><span className="text-emerald-700">{icon}</span><span className="min-w-0 flex-1"><h2 className="text-base font-bold text-slate-900">{title}</h2><span className="text-xs text-slate-500">{subtitle}</span></span><ChevronDown size={17}/></summary><div className="px-5 pb-5 space-y-4">{children}</div></details>}

function Unavailable({title,children}:{title:string;children:ReactNode}){return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5"><h3 className="text-sm font-semibold text-slate-700">{title}</h3><p className="text-sm text-slate-500 mt-2">{children}</p></div>}

export function AnalysisDashboard({view,demo}:{view:CacheViewState;demo:boolean}){

 const [filters,setFilters]=useState<AnalysisFilters>({period:'',source:'',division:''}),[settings,setSettings]=useState(false),[showTrend,setShowTrend]=useState(true),[showDonut,setShowDonut]=useState(true),[detail,setDetail]=useState(''),[target,setTarget]=useState(''),[showDemoDesign,setShowDemoDesign]=useState(demo);

 const analysis=useMemo(()=>{if(!view.report)return {result:null,error:''};try{return {result:analyzeDashboard(view.report,filters),error:''};}catch(e){return {result:null,error:(e as Error).message}}},[view.report,filters]);

 const a=analysis.result;

 const change=(key:keyof AnalysisFilters,value:string)=>{setFilters(f=>({...f,[key]:value}));setDetail('')};

 const drillRows=a?.rows.filter(r=>!detail||r.source===detail)||[];

 const ratio=a?.attendance?.invited?100*a.attendance.attended/a.attendance.invited:null;

 return <div className="analysis-dashboard min-w-0 space-y-5 text-slate-900">

  {demo&&<div className="training-demo">MODE PREVIEW · DATA SIMULASI · BUKAN LAPORAN AKTUAL</div>}

  {demo&&<div className="flex flex-wrap gap-2"><button className="training-button" aria-pressed={showDemoDesign} onClick={()=>setShowDemoDesign(true)}>Desain AI Studio · simulasi</button><button className="training-button" aria-pressed={!showDemoDesign} onClick={()=>setShowDemoDesign(false)}>Uji integrasi snapshot simulasi</button></div>}

  {demo&&showDemoDesign?<Suspense fallback={<p role="status">Memuat desain simulasi…</p>}><DesignPreview/></Suspense>:<>

  <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold tracking-wider uppercase text-emerald-700">ADR Learning Center</p><h1 className="text-2xl font-bold mt-1">Dashboard Analisis Training</h1><p className="text-sm text-slate-500 mt-2">Ringkasan manajemen, evaluasi, dan pemeriksaan pelaksanaan.</p></div><button className="training-button" aria-expanded={settings} onClick={()=>setSettings(s=>!s)}><SlidersHorizontal size={16}/>Atur tampilan & KPI</button></header>

  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15}/><span>{view.report?'Snapshot '+new Date(view.report.generatedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB':'Menunggu snapshot lengkap lima sumber'}</span><span>· Sumber read-only · Laporan Meetdir tetap</span></div>

  {(view.error||analysis.error||view.status?.stale)&&<div role="alert" className="training-alert">{view.error||analysis.error||'Cache perlu diperbarui. Data terakhir tetap dipakai; periksa Database.'}</div>}

  <TrainingInsightCards report={view.report}/>

  <Section id="analysis-l1" title="Subdivisi · Evaluasi L1" subtitle="Kepuasan materi, penyelenggara, dan trainer" icon={<MessageSquare size={20}/>}><L1EvaluationPanel demo={demo}/></Section>

  {!a?<Unavailable title="Data analisis belum tersedia">{analysis.error||view.error||'Menunggu cache lengkap. Tidak ada data simulasi yang dipakai sebagai pengganti data operasional.'}</Unavailable>:<>

   <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4">

    <label className="grid gap-1 text-xs text-slate-500">Periode laporan<select className="rounded border border-slate-200 p-2 text-slate-800" aria-label="Periode analisis" value={filters.period} onChange={e=>change('period',e.target.value)}><option value="">Seluruh periode</option>{a.periods.map(p=><option key={p}>{p}</option>)}</select></label>

    <label className="grid gap-1 text-xs text-slate-500">Database sumber<select className="rounded border border-slate-200 p-2 text-slate-800" aria-label="Sumber analisis" value={filters.source} onChange={e=>change('source',e.target.value)}><option value="">Semua sumber</option>{Object.entries(SOURCE_NAMES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>

    <label className="grid gap-1 text-xs text-slate-500">Divisi<select className="rounded border border-slate-200 p-2 text-slate-800" aria-label="Divisi analisis" value={filters.division} onChange={e=>change('division',e.target.value)}><option value="">Semua divisi</option>{a.divisions.map(d=><option key={d}>{d}</option>)}</select></label>

   </div>

   {settings&&<fieldset className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"><legend className="text-sm font-semibold">Tampilan & target pribadi tab ini</legend><div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={showTrend} onChange={e=>setShowTrend(e.target.checked)}/>Tren partisipasi</label><label className="flex items-center gap-2"><input type="checkbox" checked={showDonut} onChange={e=>setShowDonut(e.target.checked)}/>Komposisi sumber</label></div><label className="grid gap-1 text-xs text-slate-600">Target kehadiran (%) · opsional<input type="number" min="1" max="100" aria-label="Target kehadiran analisis" value={target} onChange={e=>setTarget(e.target.value)} className="max-w-40 rounded border border-slate-200 p-2"/></label><p className="text-xs text-slate-500">Target ini belum merupakan kebijakan organisasi. Tidak mengubah nilai, rumus, atau laporan existing.</p></fieldset>}

   {!a.rows.length&&<p role="status" className="training-alert">Tidak ada aktivitas laporan pada filter ini. Data agenda ditampilkan terpisah jika tersedia.</p>}

   <Section id="analysis-ceo" title="CEO / Manajemen" subtitle="Aktivitas training · komposisi · tren" icon={<BarChart3 size={20}/>}>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Metric label="Kelas unik laporan" value={format(a.total.classCount)} note="ID kelas unik global · bukan bukti status eksekusi"/><Metric label="Partisipasi hadir" value={format(a.total.participants)} note="NIP terisi · baris eligible laporan existing"/><Metric label="Jam peserta" value={format(a.total.participantHours)} note="SUM durasi peserta hadir · bukan jam sesi"/></div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{showDonut&&<DonutChart title="Komposisi partisipasi per sumber" subtitle="Kategori sumber saling terpisah" unit="partisipasi" data={a.sources.map((s,i)=>({label:s.label,value:s.participants,color:colors[Object.keys(SOURCE_NAMES).indexOf(s.id)]||colors[i]}))} centerLabel="Partisipasi" onSegmentClick={s=>setDetail(Object.keys(SOURCE_NAMES).find(id=>SOURCE_NAMES[id]===s.label)||'')}/>} {showTrend&&<LineChart title="Tren partisipasi" subtitle="Konteks seluruh periode; mengikuti sumber dan divisi terpilih" unit="partisipasi" data={a.trend}/>}</div>

    <div className="flex flex-wrap gap-2">{a.sources.map(s=><button key={s.id} className="training-button" aria-pressed={detail===s.id} onClick={()=>setDetail(detail===s.id?'':s.id)}>Rincian {s.label}</button>)}</div>

    <details open={!!detail} className="rounded-lg border border-slate-200 p-3"><summary className="text-sm font-semibold">Rincian pembentuk angka {SOURCE_NAMES[detail]||'seluruh sumber'}</summary><div className="overflow-x-auto"><table className="w-full text-left text-xs mt-3"><thead><tr>{['Periode','Sumber','Jenis / kategori','Divisi','Kelas','Partisipasi','Jam peserta'].map(h=><th key={h} className="p-2 border-b">{h}</th>)}</tr></thead><tbody>{drillRows.map((r,i)=><tr key={i}><td className="p-2 border-b">{r.period}</td><td className="p-2 border-b">{SOURCE_NAMES[r.source]||r.source}</td><td className="p-2 border-b">{r.type} / {r.category||'Tidak terisi'}</td><td className="p-2 border-b">{r.division||'Tidak terisi'}</td><td className="p-2 border-b">{Object.keys(r.classes).length}</td><td className="p-2 border-b">{format(r.nipCount)}</td><td className="p-2 border-b">{format(r.hours)}</td></tr>)}</tbody></table></div><p className="text-xs text-slate-500 mt-2">Kelas unik tidak selalu aditif antarbaris. Total memakai gabungan ID; tidak menjumlahkan subtotal kelas.</p></details>

    <Unavailable title="Biaya, anggaran & manfaat finansial belum tersedia">Cache existing belum menyediakan data biaya. Tidak ada angka biaya simulasi, keuntungan, atau ROI pada mode operasional.</Unavailable>

   </Section>



   <Section id="analysis-l2" title="Departemen · Pelaksanaan & L2" subtitle="Kehadiran tercatat · distribusi jenis · kesiapan evaluasi" icon={<GraduationCap size={20}/>}>

    {a.attendance?<><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Metric label="Undangan agenda lewat" value={format(a.attendance.invited)} note="Baris peserta pada jadwal sebelum hari ini; batal dikeluarkan"/><Metric label="Tercatat hadir" value={format(a.attendance.attended)} note="Sesuai waktu snapshot; bukan absensi realtime"/><Metric label="Rasio tercatat hadir" value={ratio===null?'—':format(ratio)+'%'} note="Hadir ÷ undangan jadwal lewat"/></div><DonutChart title="Kehadiran tercatat pada agenda lewat" subtitle="Tanggal mulai agenda; berbeda dari periode Filter Bulan laporan" unit="baris peserta" data={[{label:'Tercatat hadir',value:a.attendance.attended,color:'#059669'},{label:'Belum tercatat hadir',value:a.attendance.notRecordedPresent,color:'#94a3b8'}]} centerLabel="Undangan"/><p className="text-xs text-slate-500">Belum tercatat hadir mencakup izin, absen, atau status kosong yang belum dapat dipisahkan dari indeks existing. Tidak dilabeli sebagai tidak hadir. Jadwal hari ini dan mendatang tidak dihitung.</p>{target!==''&&Number(target)>0&&Number(target)<=100&&ratio!==null&&<p className="rounded-lg bg-emerald-50 text-emerald-900 p-3 text-sm">Terhadap target pribadi {target}%: {ratio>=Number(target)?'Memenuhi':'Di bawah target'}. Selisih {format(ratio-Number(target))} poin persentase.</p>}</>:<Unavailable title="Kehadiran agenda belum tersedia">{a.calendarIssue}</Unavailable>}

    <HorizontalBarChart title="Partisipasi hadir menurut kategori" unit="partisipasi" subtitle="Baris eligible laporan · mengikuti seluruh filter" data={a.categories.map(c=>({label:c.label,value:c.value}))}/>

    <Unavailable title="Pretest–posttest per departemen belum tersedia">Nilai individu dan identitas departemen belum dikirim oleh kontrak cache bagian ini. Plan vs aktual seluruh training tersedia pada kartu paling atas jika indeks rinci sudah siap. Filter bagian existing adalah Divisi, sesuai data agregat.</Unavailable>

   </Section>

   <Section id="analysis-supervisor" title="Supervisor / Eksekutor" subtitle="Pemeriksaan dari bukti agenda; tanpa penugasan otomatis" icon={<Users size={20}/>}>

    {a.calendarIssue?<Unavailable title="Temuan agenda belum tersedia">{a.calendarIssue}</Unavailable>:a.findings.length?<div className="overflow-x-auto"><table className="text-left text-xs w-full"><thead><tr>{['Pemeriksaan','Program / tanggal','Sumber','Bukti'].map(h=><th key={h} className="border-b p-2">{h}</th>)}</tr></thead><tbody>{a.findings.map(f=><tr key={f.id}><td className="border-b p-2">{f.title}</td><td className="border-b p-2">{f.program}<br/>{f.date}</td><td className="border-b p-2">{f.source}</td><td className="border-b p-2">{f.evidence}</td></tr>)}</tbody></table></div>:<p className="text-sm text-slate-500">Tidak ditemukan temuan kesiapan/status kosong pada cakupan indeks agenda yang dipilih. Ini bukan pemeriksaan kelengkapan seluruh database.</p>}

    <p className="text-xs text-slate-500">Temuan dibatasi pada field yang benar-benar tersedia di indeks agenda. Nilai L2 kosong dan rincian status kehadiran tidak dapat didiagnosis dari agregat. Tidak ada data sumber yang ditulis.</p>

   </Section>

  </>}

  </>}

 </div>;

}

