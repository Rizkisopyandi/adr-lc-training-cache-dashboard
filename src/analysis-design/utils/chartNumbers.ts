// Largest-remainder rounding keeps the displayed donut legend at exactly 100%.
export function percentages100(values:number[]):number[]{
 if(values.some(v=>!Number.isFinite(v)||v<0))throw new Error('Nilai komposisi tidak valid.');
 const total=values.reduce((n,v)=>n+v,0);if(!total)return values.map(()=>0);
 const exact=values.map(v=>v/total*100),rounded=exact.map(Math.floor);
 const order=exact.map((v,i)=>({i,remainder:v-rounded[i]})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
 const remaining=100-rounded.reduce((n,v)=>n+v,0);for(let i=0;i<remaining;i++)rounded[order[i].i]++;
 return rounded;
}
