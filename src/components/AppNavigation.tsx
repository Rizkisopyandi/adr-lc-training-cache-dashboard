import { useEffect, useState } from 'react';
import { Database, FileBarChart2, ShieldCheck, LayoutDashboard, CalendarDays, ListChecks } from 'lucide-react';
export type AppPage='database'|'meetdir'|'dashboard'|'calendar'|'training';
function readPage():AppPage { return window.location.hash==='#/kalender'?'calendar':window.location.hash==='#/training'?'training':window.location.hash==='#/laporan-meetdir'?'meetdir':window.location.hash==='#/database'?'database':'dashboard'; }
export function useAppPage(){
  const [page,setPage]=useState<AppPage>(readPage);
  useEffect(()=>{const update=()=>setPage(readPage());window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  return page;
}
export function AppNavigation({page}:{page:AppPage}){
  return <aside className="lg:w-60 lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 print:hidden">
    <div className="lg:sticky lg:top-16 p-3 lg:p-5 space-y-5">
      <div className="hidden lg:block px-2 pt-3"><p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">ADR Learning Center</p><p className="text-sm font-semibold text-slate-800 mt-2">Executive workspace</p></div>
      <nav aria-label="Navigasi utama" className="flex flex-wrap lg:flex-col gap-2">
        {[{key:'dashboard',href:'#/dashboard',label:'Dashboard',Icon:LayoutDashboard},{key:'calendar',href:'#/kalender',label:'Kalender',Icon:CalendarDays},{key:'training',href:'#/training',label:'Training Hari Ini & Besok',Icon:ListChecks},{key:'meetdir',href:'#/laporan-meetdir',label:'Laporan Meetdir',Icon:FileBarChart2},{key:'database',href:'#/database',label:'Database',Icon:Database}].map(({key,href,label,Icon})=><a key={key} href={href} onClick={e=>{e.preventDefault();window.location.hash=href;}} aria-current={page===key?'page':undefined} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${page===key?'bg-emerald-700 text-white shadow-sm':'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'}`}><Icon size={18}/><span>{label}</span></a>)}
      </nav>
      <div className="hidden lg:block rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500 leading-relaxed"><ShieldCheck size={18} className="text-emerald-700 mb-2"/>Laporan memakai cache lengkap. Database sumber tetap hanya dibaca.</div>
    </div>
  </aside>;
}
