/** One compact cube, accumulated in resumable cache batches. No personal NIP/name values. */
function meetdirMonth_(value) {
 var names=['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
 var t=String(value||'').trim().toLowerCase();return names.indexOf(t)+1;
}
function meetdirAccumulate_(job,source,row,date) {
 var f=source.fields,type=cacheValue_(row,f.type),month=meetdirMonth_(cacheValue_(row,f.month));
 if(!type)return;
 if(!month){source.meetdirInvalidMonthRows=(source.meetdirInvalidMonthRows||0)+1;return;}
 if(!date){source.meetdirFallbackYearRows=(source.meetdirFallbackYearRows||0)+1;return;}
 var category=cacheValue_(row,f.category),division=cacheValue_(row,f.division);
 var id=cacheValue_(row,(source.key==='staff'||source.key==='eksternal')?f.invitation:f.id);
 if(!id)return;
 var period=date.slice(0,4)+'-'+('0'+month).slice(-2);
 var key=JSON.stringify([period,source.key,type,category,division]);
 if(!job.meetdirBuckets[key])job.meetdirBuckets[key]={period:period,source:source.key,type:type,category:category,division:division,nipCount:0,divisionCount:0,hours:0,classes:{}};
 var b=job.meetdirBuckets[key];
 if(cacheValue_(row,f.nip)!=='')b.nipCount++;
 if(division!=='')b.divisionCount++;
 var hours=cacheNumber_(cacheValue_(row,f.duration));
 if(hours===null)source.invalidDurations++;else b.hours+=hours;
 b.classes['id:'+id]=true;
}
