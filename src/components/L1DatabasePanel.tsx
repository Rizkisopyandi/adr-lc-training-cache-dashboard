import {useL1Cache} from './L1CacheProvider';
const number=(n:number)=>n.toLocaleString('id-ID');
export function L1DatabasePanel({demo=false}:{demo?:boolean}){
 const {status:s,error,starting,refresh}=useL1Cache();const running=s?.job?.status==='running';
 return <section aria-label="Database L1" className="training-card space-y-3">
  <div><h2 className="text-lg font-bold">Database L1 · Evaluasi Training</h2><p className="text-sm text-slate-500">Spreadsheet evaluasi dibaca ke cache agregat terpisah dari lima database training.</p></div>
  {demo?<p className="training-demo">SIMULASI · Pembaruan database dinonaktifkan</p>:<button className="training-button primary" disabled={starting||running||!s} onClick={()=>void refresh()}>{starting?'Memulai…':running?'Pembaruan L1 berjalan…':'Perbarui Cache L1'}</button>}
  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm"><div><dt>Status snapshot</dt><dd className="font-semibold">{demo?'Simulasi':s?.ready?s.stale?'Tersedia · perlu diperbarui':'Siap':'Belum tersedia'}</dd></div><div><dt>Respons formulir</dt><dd>{s?.ready?number(s.responseCount):'—'}</dd></div><div><dt>Penilaian slot trainer</dt><dd>{s?.ready?number(s.trainerCount):'—'}</dd></div></dl>
  <p className="text-xs text-slate-500">Snapshot terakhir: {s?.generatedAt?new Date(s.generatedAt).toLocaleString('id-ID'):'—'} · kedaluwarsa: {s?.expiresAt?new Date(s.expiresAt).toLocaleString('id-ID'):'—'}</p>
  {s?.job&&<p role="status" className="text-sm">Proses: {s.job.status} · {number(s.job.scannedRows)} / {s.job.totalRows===null?'menunggu pembacaan pertama':number(s.job.totalRows)} baris · kegagalan berurutan: {s.job.failures}</p>}
  {(error||s?.job?.error)&&<p role="alert" className="training-alert">{error||s?.job?.error} Snapshot lengkap terakhir tetap digunakan jika tersedia.</p>}
  <p className="text-xs text-slate-500">Worker memproses 2.000 baris per menit dan dapat melanjutkan progres setelah gangguan. Snapshot baru dipakai setelah seluruh baris selesai. Masa segar 1 jam; pembaruan dimulai melalui tombol di halaman ini. Spreadsheet sumber tidak ditulis.</p>
 </section>;
}
