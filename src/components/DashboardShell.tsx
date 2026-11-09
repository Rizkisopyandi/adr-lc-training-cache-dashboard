import {lazy,Suspense,useState} from 'react';
import {TrainingDashboard} from './TrainingDashboard';
import type {CacheViewState} from './CachePanel';
const AnalysisDashboard=lazy(()=>import('./AnalysisDashboard').then(m=>({default:m.AnalysisDashboard})));
export function DashboardShell({view,demo}:{view:CacheViewState;demo:boolean}){
 const [tab,setTab]=useState<'analysis'|'existing'>('analysis');
 return <section aria-label="Pilihan Dashboard" className="min-w-0 space-y-4">
  <nav aria-label="Tampilan Dashboard" className="flex flex-wrap gap-2">
   <button className={'training-button '+(tab==='analysis'?'primary':'')} aria-pressed={tab==='analysis'} onClick={()=>setTab('analysis')}>Dashboard Analisis</button>
   <button className={'training-button '+(tab==='existing'?'primary':'')} aria-pressed={tab==='existing'} onClick={()=>setTab('existing')}>Ringkasan Existing</button>
  </nav>
  <div hidden={tab!=='existing'}><TrainingDashboard view={view} demo={demo}/></div>
  <div hidden={tab!=='analysis'}><Suspense fallback={<p role="status">Memuat Dashboard Analisis…</p>}><AnalysisDashboard view={view} demo={demo}/></Suspense></div>
 </section>;
}
