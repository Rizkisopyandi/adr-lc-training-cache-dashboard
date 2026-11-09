import fs from 'node:fs';
import path from 'node:path';
import {build} from 'vite';
const root=process.cwd();
// HTML Service has no /assets routes. Build a separate in-memory single bundle;
// Vercel's normal dist retains lazy loading and is never overwritten here.
const result=await build({build:{write:false,cssCodeSplit:false,rolldownOptions:{output:{codeSplitting:false}}}});
const output=(Array.isArray(result)?result:[result]).flatMap(r=>r.output);
const assets=new Map(output.map(asset=>[asset.fileName,asset.type==='chunk'?asset.code:String(asset.source)]));
let html=assets.get('index.html');if(!html)throw new Error('HTML Apps Script tidak dihasilkan.');
function assetText(src){const value=assets.get(src.replace(/^\//,''));if(value===undefined)throw new Error('Asset Apps Script tidak tersedia: '+src);return value;}
html=html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,(_,src)=>`<script type="module">${assetText(src).replace(/<\/script/gi,'<\\/script')}</script>`);
html=html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,(_,src)=>`<style>${assetText(src)}</style>`);
html=html.replace('<head>','<head><base target="_top">');
const out=path.join(root,'apps-script');fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(path.join(root,'src/backend')))if(/\.(gs|json)$/.test(name))fs.copyFileSync(path.join(root,'src/backend',name),path.join(out,name));
fs.writeFileSync(path.join(out,'Index.html'),html);
console.log('Apps Script package built: apps-script/Index.html + 4 GS files + manifest.');
