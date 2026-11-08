import type {Bucket} from './executiveMetrics';
// Explicit opt-in synthetic dataset. Never loaded when ?demo=1 is absent.
export function demoTraining(){const buckets:Bucket[]=[];for(let month=1;month<=11;month++)for(let s=0;s<5;s++)for(let d=0;d<3;d++){
 const source=['ptu','pto','otomasi','staff','eksternal'][s],type=['PTU','PTO Basic','Otomasi','Internal','Eksternal'][s],n=11+((month*7+s*13+d*3)%35),classes:Record<string,boolean>={};for(let i=0;i<2+s;i++)classes[`id:SIM-${month}-${s}-${d}-${i}`]=true;
 buckets.push({period:`2026-${String(month).padStart(2,'0')}`,source,type,category:s===3?(d%2?'Soft skill':'Hard skill'):['Teknis','Operasional','Pengembangan'][d],division:['Produksi','Quality Control','HC & Support'][d],nipCount:n,divisionCount:n-(d===2?2:0),hours:n*(2+d),classes});
 }const sources=['ptu','pto','otomasi','staff','eksternal'].map(key=>({key,sheetName:key==='staff'?'Database_2026':'DataBase',recordCount:1200,columnCount:47,idColumnFound:true,missingNip:0,invalidDates:0,invalidDurations:0,statusConflicts:0,compositeClassRows:0,unresolvedClassRows:0,scannedRows:1200,spreadsheetId:'SIMULASI'}));
 const report:any={success:true,snapshotId:'SIMULASI-TRAINING-2026',generatedAt:'2026-11-08T08:00:00Z',expiresAt:'2026-11-08T09:00:00Z',sources,periods:{},definition:{},executive:{version:3,buckets}};
 return {report,status:{success:true,installed:true,ready:true,stale:false,snapshotId:report.snapshotId,generatedAt:report.generatedAt,expiresAt:report.expiresAt,sources,job:null},error:''};
}
