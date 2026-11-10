type RequestLike={method?:string;headers:Record<string,any>;query?:Record<string,any>;body?:any};
type ResponseLike={status:(n:number)=>ResponseLike;json:(v:any)=>any;setHeader:(k:string,v:string)=>any};
function safeOrigin(req:RequestLike){const origin=req.headers.origin;if(!origin)return true;try{return new URL(String(origin)).host===String(req.headers.host);}catch{return false;}}
/** Compatibility endpoint: public mode has no password or session cookie. */
export async function session(req:RequestLike,res:ResponseLike){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({success:false,error:'Login tidak digunakan pada mode publik.'});
 return res.status(200).json({success:true,authenticated:true,configured:true,mode:'public'});
}
export async function gateway(req:RequestLike,res:ResponseLike){res.setHeader('Cache-Control','no-store');
 const action=String(req.query?.action||'');
 if(!['cacheStatus','cacheReport','cacheStart','getStatus','getPreview','l1Report','l1CacheStatus','l1CacheReport','l1CacheStart'].includes(action))return res.status(400).json({success:false,error:'Action tidak diizinkan.'});
 if(['cacheStart','l1CacheStart'].includes(action)&&(req.method!=='POST'||!safeOrigin(req)))return res.status(405).json({success:false,error:'Pembaruan cache memerlukan POST dari aplikasi.'});
 if(!['cacheStart','l1CacheStart'].includes(action)&&req.method!=='GET')return res.status(405).json({success:false,error:'Gunakan GET.'});
 const base=process.env.GOOGLE_APPS_SCRIPT_URL,token=process.env.ADR_API_TOKEN;
 if(!base||!token)return res.status(503).json({success:false,error:'Koneksi belum dikonfigurasi. Atur GOOGLE_APPS_SCRIPT_URL dan ADR_API_TOKEN di Vercel, lalu redeploy.'});
 try{
  const u=new URL(base);if(u.protocol!=='https:'||u.hostname!=='script.google.com'||!/^\/macros\/s\/[^/]+\/exec$/.test(u.pathname))throw new Error('URL Apps Script harus https://script.google.com/macros/s/.../exec');
  u.search='';u.searchParams.set('action',action);u.searchParams.set('token',token);
  if(action==='getStatus'||action==='getPreview'){const source=String(req.query?.source||'');if(!['ptu','pto','otomasi','staff','eksternal'].includes(source))return res.status(400).json({success:false,error:'Sumber tidak valid.'});u.searchParams.set('source',source);}
  if(action==='l1Report'){for(const key of ['row','end']){if(req.query?.[key]!==undefined){const v=String(req.query[key]);if(!/^\d{1,7}$/.test(v)||Number(v)<(key==='row'?2:1))return res.status(400).json({success:false,error:'Rentang L1 tidak valid.'});u.searchParams.set(key,v);}}}
  if(action==='cacheStart')u.searchParams.set('force',String(req.query?.force==='true'));
  const upstream=await fetch(u,{redirect:'follow',signal:AbortSignal.timeout(35000)});
  if(!upstream.ok)throw new Error(`Apps Script HTTP ${upstream.status}`);
  const raw=await upstream.text();let data:any;try{data=JSON.parse(raw);}catch{throw new Error('Apps Script mengirim halaman login/HTML. Periksa URL /exec, versi deployment dan akses endpoint API.');}
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Format respons Apps Script tidak valid.');
  if(action==='getStatus'||action==='getPreview')return res.status(200).json({proxyStatus:200,gasStatus:200,rawJson:data,rawText:JSON.stringify(data),actionSent:action,sourceSent:req.query?.source,webAppUrlMasked:'Apps Script server',error:data.success===false?data.error:undefined});
  return res.status(200).json(data);
 }catch(e:any){const reason=e.name==='TimeoutError'?'Koneksi Apps Script melewati 35 detik. Snapshot sebelumnya tetap digunakan.':e.message||'Koneksi gagal.';return res.status(502).json({success:false,error:reason});}
}
