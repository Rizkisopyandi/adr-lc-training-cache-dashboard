export interface CacheSource {
  key: string; spreadsheetId: string; sheetName: string; columnCount: number; idColumnFound?: boolean;
  recordCount: number; scannedRows: number; missingNip: number; invalidDates: number;
  invalidDurations: number; statusConflicts: number; compositeClassRows: number; unresolvedClassRows: number;
  meetdirMissingClassId?:number; meetdirFallbackYearRows?:number; meetdirInvalidMonthRows?:number;
}
export interface CacheStatus {
  success: boolean; installed: boolean; ready: boolean; stale: boolean;
  snapshotId: string | null; generatedAt: string | null; expiresAt: string | null;
  sources: CacheSource[]; transportWarning?: string;
  job: null | { id: string; status: string; error: string; sources: { key: string; status: string; scannedRows: number; totalRows: number; recordCount: number }[] };
}
export interface CacheMetrics { participants: number; participantHours: number; classCount: number; uniqueEmployees: number }
export interface CacheReport {
  executive?: {version:number;buckets:import('../services/executiveMetrics').Bucket[]};
  meetdir?: MeetdirReport;
  success: boolean; snapshotId: string; generatedAt: string; expiresAt: string;
  definition: { attendance: string; date: string; hours: string; classes: string };
  sources: CacheSource[]; transportWarning?: string;
  periods: Record<string, { total: CacheMetrics; groups: { type: string; category: string; metrics: CacheMetrics }[] }>;
}
export interface MeetdirMetrics { classCount: number; participants: number; participantHours: number }
export interface MeetdirPeriod {
  mode: 'monthly'|'cumulative'; year: string; month: number;
  total: MeetdirMetrics;
  summary: { label: string; metrics: MeetdirMetrics }[];
  details: { type: string; category: string; metrics: MeetdirMetrics }[];
  typeTotals: { type: string; metrics: MeetdirMetrics }[];
}
export interface MeetdirReport {
  version: number; years: string[]; periods: Record<string,MeetdirPeriod>;
  rules: { defaultThroughMonth: number; defaultMonthlyMonth: number; [key:string]: unknown };
}
