export type DatabaseSourceKey = 'ptu' | 'pto' | 'otomasi' | 'staff' | 'eksternal';

export interface DatabaseSourceConfig {
  key: DatabaseSourceKey;
  name: string;
  codeName: string;
  description: string;
  spreadsheetId: string;
  defaultSheetName: string;
  idColumnName: string;
  category: string;
}

export interface SheetConfig {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface DatabaseConfig {
  id: string;
  name: string;
  spreadsheetId: string;
  description: string;
  category: string;
  defaultSheetName: string;
  allowedSheets: SheetConfig[];
}

export interface SheetDataResponse {
  success: boolean;
  connected: boolean;
  spreadsheetId: string;
  sheetName: string;
  fetchedAt: string;
  columns: string[];
  rows: string[][];
  totalRows: number;
  totalColumns: number;
  statusMessage: string;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  statusText: 'Terhubung' | 'Database belum terhubung' | 'Memuat...';
  lastSyncedAt: string | null;
  errorMessage?: string;
}

export interface StatusResponseContract {
  success: boolean;
  sourceKey: string;
  status: string; // 'Connected' | 'Error' | etc.
  sheetName: string;
  columnCount: number;
  idColumnFound: boolean;
  error?: string;
  rawResponse?: any;
}

export interface PreviewResponseContract {
  success: boolean;
  sourceKey: string;
  sheetName: string;
  columns: string[];
  records: string[][];
  totalRecords: number;
  sourceRows?: number[];
  spreadsheetId?: string;
  recordColumn?: string;
  idColumn?: string;
  missingIdRecordCount?: number;
  missingIdSourceRows?: number[];
  scannedRowCount?: number;
  skippedRowCount?: number;
  error?: string;
}

export interface ProxyResponse<T = any> {
  proxyStatus: number;
  proxyStatusText: string;
  gasStatus?: number;
  gasStatusText?: string;
  webAppUrlMasked: string;
  actionSent: string;
  sourceSent: string;
  rawJson: T | null;
  rawText: string;
  error?: string;
  validationResult: ValidationReport;
}

export interface ValidationItem {
  field: string;
  expectedDescription: string;
  receivedValue: any;
  passed: boolean;
  critical: boolean;
  errorMessage?: string;
}

export interface ValidationReport {
  isContractValid: boolean;
  items: ValidationItem[];
  missingFields: string[];
  summaryMessage: string;
}

export interface DatabaseStatusState {
  cachedAt?: string;
  key: DatabaseSourceKey;
  status: 'Disconnected' | 'Testing' | 'Connected' | 'Error';
  sheetName: string;
  columnCount: number;
  idColumnFound: boolean;
  lastTestedAt: string | null;
  errorMessage?: string;
  diagnosticData?: ProxyResponse<StatusResponseContract>;
}
