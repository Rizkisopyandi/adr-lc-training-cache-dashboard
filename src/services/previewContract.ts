import type { PreviewResponseContract } from '../types/database';

// One canonical wire format. Never turn a status-only response into an empty preview.
export function parsePreviewContract(value: unknown, source: string): PreviewResponseContract {
  const data = value as PreviewResponseContract;
  const fail = (detail: string): never => { throw new Error(`Kontrak getPreview tidak valid: ${detail}. Perbarui Code.gs dan DatabaseService.gs pada backend Executive, lalu deploy New version dan periksa URL /exec.`); };
  if (!data || typeof data !== 'object' || Array.isArray(data)) return fail('respons harus berupa objek JSON');
  if (data.success !== true) throw new Error(typeof data.error === 'string' ? data.error : 'Apps Script gagal mengambil preview');
  if (data.sourceKey !== source) return fail('sourceKey tidak cocok');
  if (!Array.isArray(data.columns) || !Array.isArray(data.records)) return fail('columns dan records harus berupa array; respons getStatus tidak dapat digunakan sebagai preview');
  if (!data.columns.every(c => typeof c === 'string')) return fail('setiap header harus berupa string');
  if (!data.records.every(row => Array.isArray(row) && row.length === data.columns.length && row.every(cell => typeof cell === 'string'))) return fail('records harus berupa matriks string dengan lebar sama dengan columns');
  if (data.records.length > 10) return fail('maksimal 10 record');
  if (typeof data.sheetName !== 'string' || !data.sheetName) return fail('sheetName kosong');
  if (!Number.isInteger(data.totalRecords) || data.totalRecords < data.records.length) return fail('totalRecords tidak valid');
  if (data.sourceRows !== undefined && (!Array.isArray(data.sourceRows) || data.sourceRows.length !== data.records.length || !data.sourceRows.every(n => Number.isInteger(n) && n >= 2))) return fail('sourceRows tidak valid');
  for (const field of ['spreadsheetId', 'recordColumn', 'idColumn'] as const) {
    if (data[field] !== undefined && typeof data[field] !== 'string') return fail(field + ' harus berupa string');
  }
  for (const field of ['missingIdRecordCount', 'scannedRowCount', 'skippedRowCount'] as const) {
    if (data[field] !== undefined && (!Number.isInteger(data[field]) || data[field] < 0)) return fail(field + ' tidak valid');
  }
  if (data.missingIdSourceRows !== undefined && (!Array.isArray(data.missingIdSourceRows) || !data.missingIdSourceRows.every(n => Number.isInteger(n) && n >= 2))) return fail('missingIdSourceRows tidak valid');
  return data;
}
