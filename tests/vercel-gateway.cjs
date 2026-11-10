const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{transformSync}=require('esbuild');
const code=transformSync(fs.readFileSync('server/vercelGateway.ts','utf8'),{loader:'ts',format:'cjs'}).code;
const env={ADR_API_TOKEN:'TEST_ONLY_UPSTREAM_TOKEN',GOOGLE_APPS_SCRIPT_URL:'https://script.google.com/macros/s/TEST/exec'};let calls=0;
const sandbox={module:{exports:{}},exports:{},require,URL,AbortSignal,process:{env},fetch:async u=>{calls++;assert.equal(u.hostname,'script.google.com');assert.equal(u.searchParams.get('token'),env.ADR_API_TOKEN);return {ok:true,text:async()=>JSON.stringify({success:true,records:[],cacheVersion:'l1-v1'})};}};
vm.runInNewContext(code,sandbox);const {session,gateway}=sandbox.module.exports;
function response(){return {code:0,headers:{},data:null,status(n){this.code=n;return this;},setHeader(k,v){this.headers[k]=v;},json(d){this.data=d;return this;}};}
const req=(method='GET',query={})=>({method,headers:{host:'dashboard.example'},query});
(async()=>{
 let r=response();await session(req(),r);assert.equal(r.code,200);assert.equal(r.data.mode,'public');assert.equal(r.headers['Set-Cookie'],undefined);
 r=response();await session(req('POST'),r);assert.equal(r.code,405);
 for(const action of ['cacheStatus','cacheReport','l1CacheStatus','l1CacheReport','l1Report','getStatus','getPreview']){r=response();await gateway(req('GET',{action,source:'ptu',row:'2'}),r);assert.equal(r.code,200,action);assert.ok(!JSON.stringify(r.data).includes(env.ADR_API_TOKEN));assert.equal(r.headers['Cache-Control'],'no-store');}
 for(const action of ['cacheStart','l1CacheStart']){r=response();await gateway(req('GET',{action}),r);assert.equal(r.code,405);let q=req('POST',{action});q.headers.origin='https://evil.example';r=response();await gateway(q,r);assert.equal(r.code,405);q.headers.origin='https://dashboard.example';r=response();await gateway(q,r);assert.equal(r.code,200);}
 const before=calls;for(const query of [{action:'delete'},{action:'getPreview',source:'unknown'},{action:'l1Report',row:'-1'}]){r=response();await gateway(req('GET',query),r);assert.equal(r.code,400);}assert.equal(calls,before);
 r=response();await gateway(req('POST',{action:'cacheReport'}),r);assert.equal(r.code,405);
 env.ADR_API_TOKEN='';r=response();await gateway(req('GET',{action:'cacheReport'}),r);assert.equal(r.code,503);
 console.log('PASS public gateway: anonymous reads, no password/cookie, fixed secret-bearing upstream, allowlist/source/range validation, POST-only same-origin refresh, missing config fails closed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
