import { gasCall } from '../services/transport';
import { useEffect, useRef, useState } from 'react';
import type { CacheReport, CacheStatus, CacheSource } from '../types/cache';

export interface CacheViewState { status:CacheStatus|null; report:CacheReport|null; error:string }
interface Props { webAppUrl: string; onSnapshot: (sources: CacheSource[], generatedAt: string) => void; onData?: (data:CacheViewState)=>void; hideReport?:boolean }
const names: Record<string,string> = { ptu:'PTU',pto:'PTO',otomasi:'Otomasi',staff:'Staff',eksternal:'Eksternal' };
const number = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits:2 });
export function CachePanel({ webAppUrl, onSnapshot, onData, hideReport=false }: Props) {
  const [status,setStatus]=useState<CacheStatus|null>(null);
  const [report,setReport]=useState<CacheReport|null>(null);
  const [error,setError]=useState('');
  const [period,setPeriod]=useState('all');
  const [refreshing,setRefreshing]=useState(false);
  const snapshotCallback=useRef(onSnapshot); snapshotCallback.current=onSnapshot;
  const dataCallback=useRef(onData); dataCallback.current=onData;
  useEffect(()=>{dataCallback.current?.({status,report,error});},[status,report,error]);
  const refreshAction=useRef<() => Promise<void>>(async()=>{});
  useEffect(()=>{
    let loadedSnapshot='';
    let cancelled=false, timer:ReturnType<typeof setTimeout> | undefined;
    const controller=new AbortController();
    setStatus(null);setReport(null);setError('');setPeriod('all');setRefreshing(false);
    if(!webAppUrl) return ()=>controller.abort();
    async function request(operation:string, force=false) {
      const data=await gasCall(({status:'cacheStatus',report:'cacheReport',refresh:'cacheStart'} as Record<string,string>)[operation],{webAppUrl,force});

      if(data?.success!==true)throw new Error(typeof data?.error==='string'?data.error:'Cache gagal dimuat');
      return data;
    }
    async function poll(initial=false) {
      try {
        const next:CacheStatus=await request('status');if(cancelled)return;
        setStatus(next);setError('');
        const snapshotToken=next.snapshotId+'|'+((next as any).calendarVersion||'');
        if(next.ready&&snapshotToken!==loadedSnapshot){
          const cached:CacheReport=await request('report');if(cancelled)return;
          loadedSnapshot=snapshotToken;setReport(cached);snapshotCallback.current(cached.sources,cached.generatedAt);
        }
        if(initial&&next.installed&&next.stale&&next.job?.status!=='running'&&next.job?.status!=='failed')await request('refresh');
      } catch(err:any){if(!cancelled)setError(err.message||'Koneksi cache gagal.');}
      finally{if(!cancelled)timer=setTimeout(()=>void poll(),15000);}
    }
    refreshAction.current=async()=>{
      if(cancelled)return;setRefreshing(true);
      try{await request('refresh',true);if(!cancelled)setError('');}
      catch(err:any){if(!cancelled)setError(err.message);}
      finally{if(!cancelled)setRefreshing(false);}
    };
    void poll(true);
    return ()=>{cancelled=true;controller.abort();if(timer)clearTimeout(timer);};
  },[webAppUrl]);
  const selected=report?.periods[period] || report?.periods.all;
  const warning=report?.transportWarning||status?.transportWarning;
  return <section className="bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm" aria-label="Cache dan laporan">
    <div className="p-4 bg-emerald-50 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-bold text-emerald-950">Status cache lima sumber</h2><p className="text-xs text-emerald-900 mt-1">Satu snapshot lengkap menjadi acuan Laporan Meetdir. Halaman ini memantau proses dan kesalahan sumber.</p></div>
      <button className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50" disabled={!webAppUrl||!status?.installed||status.job?.status==='running'||refreshing} onClick={()=>void refreshAction.current()}>{refreshing?'Meminta pembaruan…':'Perbarui cache'}</button>
    </div>
    <div className="p-4 space-y-3 text-xs">
      {!webAppUrl&&<p>Atur WebApp URL Executive untuk memuat cache otomatis.</p>}
      {webAppUrl&&!status&&!error&&<p role="status">Memeriksa cache tersimpan…</p>}
      {error&&<p role="alert" className="p-3 rounded bg-rose-50 text-rose-900">{error}{report?' Data terakhir tetap ditampilkan.':''}</p>}
      {status&&!status.installed&&<p className="p-3 rounded bg-amber-50 text-amber-900">Persiapan satu kali: pasang paket apps-script lengkap dan jalankan installExecutiveCache di Apps Script Executive. Lihat PANDUAN_CACHE.md pada paket.</p>}
      {status?.installed&&!report&&<p className="p-3 rounded bg-blue-50 text-blue-950">Cache pertama belum lengkap. Angka laporan akan muncul setelah seluruh sumber selesai; tidak dihitung dari 10 baris preview.</p>}
      {report&&<p>Snapshot: <strong>{new Date(report.generatedAt).toLocaleString('id-ID')}</strong> · {status?.stale?'Data terakhir tersedia; menunggu pembaruan.':'Tersedia dari cache.'} · Waktu ini adalah waktu publikasi, bukan jaminan semua sheet berubah pada detik yang sama.</p>}
      {warning&&<p role="alert" className="p-3 bg-amber-50 text-amber-950">{warning}</p>}
      {status?.job&&<div className="rounded border border-slate-200 p-3 space-y-2"><p className="font-semibold">Sinkronisasi: {status.job.status==='running'?'Berjalan bertahap':status.job.status==='failed'?'Gagal — cache sebelumnya tetap dipakai':'Selesai'}</p>
        {status.job.error&&<p className="text-rose-800">{status.job.error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">{status.job.sources.map(s=><div className="bg-slate-50 rounded p-2" key={s.key}><strong>{names[s.key]||s.key}</strong><p>{s.status==='pending'?'Menunggu':`${number(s.scannedRows)} / ${number(s.totalRows)} baris dipindai`}</p><p>{number(s.recordCount)} record · {s.status}</p></div>)}</div>
      </div>}
      {report&&hideReport&&<p>Record tersimpan: <strong>{number(report.sources.reduce((n,s)=>n+s.recordCount,0))}</strong> dari {report.sources.length} sumber. Buka <a href="#/laporan-meetdir" className="underline font-semibold text-emerald-800">Laporan Meetdir</a> untuk hasil perhitungan.</p>}
      {report&&hideReport&&<details><summary className="cursor-pointer font-semibold">Kualitas data per sumber</summary><div className="overflow-auto mt-2"><table className="w-full text-left"><thead><tr>{['Sumber','Record','NIP kosong','Tanggal invalid','Cancel/Hadir','ID kelas Meetdir kosong','Tahun tidak valid (dikeluarkan)','Bulan invalid'].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{report.sources.map(s=><tr key={s.key} className="border-t"><th scope="row" className="p-2">{names[s.key]||s.key}</th>{[s.recordCount,s.missingNip,s.invalidDates,s.statusConflicts,s.meetdirMissingClassId??0,s.meetdirFallbackYearRows??0,s.meetdirInvalidMonthRows??0].map((n,i)=><td className="p-2" key={i}>{number(n)}</td>)}</tr>)}</tbody></table></div></details>}
      {report&&selected&&!hideReport&&<>
        <div className="flex flex-wrap items-center gap-3"><label htmlFor="cache-period" className="font-semibold">Periode laporan cache</label><select id="cache-period" className="border rounded p-2 bg-white" value={report.periods[period]?period:'all'} onChange={e=>setPeriod(e.target.value)}>{Object.keys(report.periods).sort().map(p=><option key={p} value={p}>{p==='all'?'Seluruh periode tersimpan':p}</option>)}</select></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Kelas¹',selected.total.classCount],['Keikutsertaan hadir',selected.total.participants],['Jam-peserta',selected.total.participantHours],['Karyawan unik (NIP)',selected.total.uniqueEmployees]].map(([label,value])=><div className="border rounded-lg p-3" key={label}><p className="text-slate-600">{label}</p><p className="text-xl font-bold text-emerald-900 mt-1">{number(Number(value))}</p></div>)}</div>
        <p className="text-slate-600">Aturan awal: Kehadiran = Hadir; periode dari Plan Start Date/Tanggal Mulai; durasi dijumlahkan per baris peserta. Status Cancel/Hadir dilaporkan sebagai konflik dan masih mengikuti aturan Hadir laporan lama.</p>
        <p className="text-amber-900">¹ Kelas memakai ID_Training per sumber; jika tidak ada, memakai gabungan undangan + materi + tanggal + waktu. Definisi kelas ini perlu validasi sebelum laporan CEO dikunci. Total dihitung ulang dari kelas unik, bukan penjumlahan subtotal. Record dengan tanggal tidak valid belum masuk angka periode; lihat rincian kualitas data.</p>
        <div className="overflow-auto max-h-80 border rounded"><table className="w-full text-left"><thead className="bg-slate-100 sticky top-0"><tr>{['Jenis pelatihan','Kategori / batch','Kelas¹','Keikutsertaan','Jam-peserta'].map(h=><th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{selected.groups.map((g,i)=><tr key={i} className="border-t"><td className="p-2">{g.type}</td><td className="p-2">{g.category}</td><td className="p-2">{number(g.metrics.classCount)}</td><td className="p-2">{number(g.metrics.participants)}</td><td className="p-2">{number(g.metrics.participantHours)}</td></tr>)}</tbody></table></div>
        <details><summary className="cursor-pointer font-semibold">Kelengkapan &amp; kualitas data cache</summary><div className="overflow-auto mt-2"><table className="w-full text-left"><thead><tr>{['Sumber','Record','NIP kosong','Tanggal invalid','Durasi invalid','Cancel/Hadir','Kelas belum teridentifikasi'].map(h=><th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{report.sources.map(s=><tr key={s.key} className="border-t"><td className="p-2">{names[s.key]||s.key}</td>{[s.recordCount,s.missingNip,s.invalidDates,s.invalidDurations,s.statusConflicts,s.unresolvedClassRows].map((v,i)=><td key={i} className="p-2">{number(v)}</td>)}</tr>)}</tbody></table></div><p className="mt-2">Baris tanggal tidak valid tersimpan pada cache mentah, tetapi belum masuk angka periode. Karyawan unik tidak mencakup NIP kosong. Tidak ada penggabungan baris hanya karena NIP sama.</p></details>
      </>}
    </div>
  </section>;
}
