import { DatabaseConfig, SheetDataResponse } from '../types/database';

export async function fetchDatabases(): Promise<{ success: boolean; databases: DatabaseConfig[] }> {
  try {
    const res = await fetch('/api/databases');
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Gagal mengambil daftar database:', err);
    return { success: false, databases: [] };
  }
}

export async function fetchSheetData(databaseId: string, sheetName: string): Promise<SheetDataResponse> {
  try {
    const res = await fetch(`/api/sheets/${databaseId}/${encodeURIComponent(sheetName)}`);
    const data: SheetDataResponse = await res.json();
    return data;
  } catch (err: any) {
    console.error(`Gagal mengambil data sheet ${sheetName}:`, err);
    return {
      success: false,
      connected: false,
      statusMessage: 'Database belum terhubung',
      error: err.message || 'Gagal terhubung ke backend server aplikasi.',
      spreadsheetId: '',
      sheetName,
      fetchedAt: new Date().toISOString(),
      columns: [],
      rows: [],
      totalRows: 0,
      totalColumns: 0,
    };
  }
}
