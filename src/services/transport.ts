export function hasGas(){return !!(window as any).google?.script?.run;}
export async function gasCall(action:string,params:Record<string,unknown>={}) : Promise<any>{
 if(hasGas())return new Promise((resolve,reject)=>{let done=false;const timer=setTimeout(()=>{done=true;reject(new Error('Koneksi melewati 40 detik. Cache terakhir tetap tersedia.'));},40000);(window as any).google.script.run.withSuccessHandler((data:any)=>{clearTimeout(timer);if(!done)resolve(data);}).withFailureHandler((e:any)=>{clearTimeout(timer);if(!done)reject(new Error(e.message||'Apps Script gagal'));}).executiveRpc(action,params);});
 const q=new URLSearchParams({action,...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)]))});
 const response=await fetch('/api/executive?'+q,{method:action==='cacheStart'?'POST':'GET',signal:AbortSignal.timeout(40000)});
 if(response.status===401)window.dispatchEvent(new Event('adr-session-expired'));
 const data=await response.json();if(!response.ok)throw new Error(data.error||'Server gagal');return data;
}
