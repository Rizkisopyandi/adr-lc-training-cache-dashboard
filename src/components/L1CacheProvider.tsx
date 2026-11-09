import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {gasCall} from '../services/transport';
import {demoL1,parseL1Snapshot,type L1Report} from '../services/l1Evaluation';
export type L1CacheStatus={success:boolean;cacheVersion:string;installed:boolean;ready:boolean;stale:boolean;snapshotId:string;generatedAt:string|null;expiresAt:string|null;responseCount:number;trainerCount:number;job:null|{status:string;scannedRows:number;totalRows:number|null;error:string;failures:number}};
type State={report:L1Report|null;status:L1CacheStatus|null;error:string;starting:boolean;refresh:()=>Promise<void>};
const Context=createContext<State>({report:null,status:null,error:'',starting:false,refresh:async()=>{}});
export const useL1Cache=()=>useContext(Context);
export function L1CacheProvider({children,demo=false}:{children:ReactNode;demo?:boolean}){
 const [report,setReport]=useState<L1Report|null>(()=>demo?demoL1():null),[status,setStatus]=useState<L1CacheStatus|null>(null),[error,setError]=useState(''),[starting,setStarting]=useState(false);
 const refreshRef=useRef<()=>Promise<void>>(async()=>{});
 useEffect(()=>{let stopped=false,timer:ReturnType<typeof setTimeout>|undefined,loaded='',polling=false;
  if(demo)return;
  async function poll(){if(stopped||polling)return;polling=true;try{
   const s=await gasCall('l1CacheStatus');if(stopped)return;
   if(s?.success!==true||s.cacheVersion!=='l1-v1'||typeof s.ready!=='boolean'||typeof s.snapshotId!=='string')throw new Error(s?.error||'Backend cache L1 belum tersedia. Perbarui Apps Script.');
   setStatus(s);
   if(s.ready&&s.snapshotId!==loaded){const next=parseL1Snapshot(await gasCall('l1CacheReport'),s.snapshotId);if(stopped)return;setReport(next);loaded=s.snapshotId;}
   setError('');
  }catch(e){if(!stopped)setError((e as Error).message);}finally{polling=false;if(timer)clearTimeout(timer);if(!stopped)timer=setTimeout(()=>void poll(),15000);}}
  refreshRef.current=async()=>{if(stopped)return;setStarting(true);try{const r=await gasCall('l1CacheStart');if(r?.success!==true)throw new Error(r?.error||'Cache L1 gagal dimulai');if(!stopped){setError('');if(timer)clearTimeout(timer);void poll();}}catch(e){if(!stopped)setError((e as Error).message);}finally{if(!stopped)setStarting(false);}};
  void poll();return()=>{stopped=true;if(timer)clearTimeout(timer);};
 },[demo]);
 return <Context value={{report,status,error,starting,refresh:()=>refreshRef.current()}}>{children}</Context>;
}
