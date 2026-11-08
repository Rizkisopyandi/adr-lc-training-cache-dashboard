import { gasCall,hasGas } from './transport';
import { 
  DatabaseSourceKey, 
  ProxyResponse, 
  StatusResponseContract, 
  PreviewResponseContract,
  ValidationReport,
  ValidationItem 
} from '../types/database';
import { parsePreviewContract } from './previewContract';
import { DEFAULT_WEBAPP_URL_STORAGE_KEY } from '../config/databases';
import { DEFAULT_WEBAPP_URL } from '../config/backend';

/**
 * Mengambil URL Google Apps Script Web App yang tersimpan di localStorage
 */
export function getStoredWebAppUrl(): string {
  try {
    const saved = localStorage.getItem(DEFAULT_WEBAPP_URL_STORAGE_KEY);
    if (saved && saved.startsWith('http')) {
      return saved.trim();
    }
  } catch (e) {
    console.warn('Gagal membaca webAppUrl dari localStorage:', e);
  }
  return DEFAULT_WEBAPP_URL;
}

/**
 * Menyimpan URL Google Apps Script Web App ke localStorage
 */
export function setStoredWebAppUrl(url: string): void {
  try {
    localStorage.setItem(DEFAULT_WEBAPP_URL_STORAGE_KEY, url.trim());
  } catch (e) {
    console.error('Gagal menyimpan webAppUrl ke localStorage:', e);
  }
}

/**
 * Menilai dan memvalidasi respons JSON Apps Script sesuai Kontrak Spesifikasi PTU/Database
 */
export function validateStatusContract(
  sourceKey: DatabaseSourceKey,
  rawJson: any,
  proxyStatus: number,
  errorMsg?: string
): ValidationReport {
  const items: ValidationItem[] = [];
  const missingFields: string[] = [];

  // Check 1: HTTP Status Proxy
  items.push({
    field: 'HTTP Proxy Status',
    expectedDescription: 'HTTP 200 OK',
    receivedValue: `HTTP ${proxyStatus}`,
    passed: proxyStatus === 200,
    critical: true,
    errorMessage: proxyStatus !== 200 ? `HTTP Error Proxy (${proxyStatus})` : undefined,
  });

  // Check 2: Structure Object Valid
  const isObject = rawJson !== null && typeof rawJson === 'object' && !Array.isArray(rawJson);
  items.push({
    field: 'Respons JSON Object',
    expectedDescription: 'Objek JSON valid dari Apps Script',
    receivedValue: isObject ? 'Object JSON' : (typeof rawJson),
    passed: isObject,
    critical: true,
    errorMessage: !isObject ? 'Respons bukan objek JSON yang valid.' : undefined,
  });

  if (!isObject) {
    return {
      isContractValid: false,
      items,
      missingFields: ['success', 'sourceKey', 'status', 'sheetName', 'columnCount', 'idColumnFound'],
      summaryMessage: errorMsg || 'Respons Web App tidak berupa format JSON yang valid.',
    };
  }

  // Check 3: Properti `success`
  const hasSuccess = typeof rawJson.success === 'boolean';
  if (!hasSuccess) missingFields.push('success (boolean)');
  items.push({
    field: 'properti `success`',
    expectedDescription: 'true (boolean)',
    receivedValue: String(rawJson.success),
    passed: rawJson.success === true,
    critical: true,
    errorMessage: rawJson.success !== true ? 'Properti success bernilai false atau tidak boolean' : undefined,
  });

  // Check 4: Properti `sourceKey`
  const hasSourceKey = typeof rawJson.sourceKey === 'string';
  if (!hasSourceKey) missingFields.push('sourceKey (string)');
  const sourceMatches = (typeof rawJson.sourceKey === 'string' ? rawJson.sourceKey.toLowerCase() : '') === sourceKey.toLowerCase();
  items.push({
    field: 'properti `sourceKey`',
    expectedDescription: `"${sourceKey}"`,
    receivedValue: rawJson.sourceKey !== undefined ? `"${rawJson.sourceKey}"` : 'undefined',
    passed: sourceMatches,
    critical: true,
    errorMessage: !sourceMatches ? `Source key tidak cocok. Diharapkan "${sourceKey}", diterima "${rawJson.sourceKey}"` : undefined,
  });

  // Check 5: Properti `status`
  const hasStatus = typeof rawJson.status === 'string';
  if (!hasStatus) missingFields.push('status (string)');
  const isConnected = rawJson.status === 'Connected' || rawJson.status === 'connected';
  items.push({
    field: 'properti `status`',
    expectedDescription: '"Connected"',
    receivedValue: rawJson.status !== undefined ? `"${rawJson.status}"` : 'undefined',
    passed: isConnected,
    critical: true,
    errorMessage: !isConnected ? `Status tidak Connected. Nilai yang diterima: "${rawJson.status}"` : undefined,
  });

  // Check 6: Properti `sheetName`
  const hasSheetName = typeof rawJson.sheetName === 'string' && rawJson.sheetName.length > 0;
  if (!hasSheetName) missingFields.push('sheetName (string)');
  items.push({
    field: 'properti `sheetName`',
    expectedDescription: 'Nama sheet valid (cth: "DataBase")',
    receivedValue: rawJson.sheetName !== undefined ? `"${rawJson.sheetName}"` : 'undefined',
    passed: hasSheetName,
    critical: false,
    errorMessage: !hasSheetName ? 'Nama sheet kosong atau tidak ada' : undefined,
  });

  // Check 7: Properti `columnCount`
  const hasColumnCount = typeof rawJson.columnCount === 'number' && !isNaN(rawJson.columnCount) && rawJson.columnCount > 0;
  if (rawJson.columnCount === undefined) missingFields.push('columnCount (number)');
  items.push({
    field: 'properti `columnCount`',
    expectedDescription: 'Angka positif (cth: 47 untuk PTU)',
    receivedValue: rawJson.columnCount !== undefined ? rawJson.columnCount : 'undefined',
    passed: hasColumnCount,
    critical: true,
    errorMessage: !hasColumnCount ? `Jumlah kolom tidak valid (${rawJson.columnCount})` : undefined,
  });

  // Check 8: Properti `idColumnFound`
  const hasIdColumn = typeof rawJson.idColumnFound === 'boolean';
  if (!hasIdColumn) missingFields.push('idColumnFound (boolean)');
  items.push({
    field: 'properti `idColumnFound`',
    expectedDescription: 'true (ID Column terdeteksi)',
    receivedValue: String(rawJson.idColumnFound),
    passed: rawJson.idColumnFound === true,
    critical: true,
    errorMessage: rawJson.idColumnFound !== true ? 'Kolom ID (ID_Training/ID/NIP) tidak ditemukan di sheet' : undefined,
  });

  const allPassed = items.every(i => i.passed) && !errorMsg;

  let summaryMessage = 'Koneksi & Kontrak Terverifikasi Berhasil!';
  if (!allPassed) {
    if (errorMsg) {
      summaryMessage = errorMsg;
    } else if (missingFields.length > 0) {
      summaryMessage = `Format JSON tidak sesuai kontrak. Properti yang hilang/salah: ${missingFields.join(', ')}`;
    } else {
      summaryMessage = 'Validasi Kontrak Gagal: Satu atau lebih properti tidak memenuhi syarat koneksi terverifikasi.';
    }
  }

  return {
    isContractValid: allPassed,
    items,
    missingFields,
    summaryMessage,
  };
}

/**
 * Uji Koneksi Backend Diagnostik untuk satu database source
 */
export async function testGasConnection(
  sourceKey: DatabaseSourceKey,
  overrideUrl?: string
): Promise<ProxyResponse<StatusResponseContract>> {
  const url = overrideUrl || getStoredWebAppUrl();

  try {
    const proxyUrl = `/api/gas-proxy?action=getStatus&source=${encodeURIComponent(sourceKey)}&webAppUrl=${encodeURIComponent(url)}`;
    const res = hasGas() ? await (async()=>{const parsed=new URL(proxyUrl,location.origin);const action=parsed.searchParams.get('action')!;const rawJson=await gasCall(action,{source:sourceKey});return new Response(JSON.stringify({proxyStatus:200,gasStatus:200,rawJson,rawText:JSON.stringify(rawJson),actionSent:action,sourceSent:sourceKey,webAppUrlMasked:'Apps Script native',error:rawJson.success===false?rawJson.error:undefined}),{status:200});})() : await fetch(proxyUrl);
    
    if (!res.ok) {
      const errText = await res.text();
      const report = validateStatusContract(sourceKey, null, res.status, `HTTP Error Proxy ${res.status}`);
      return {
        proxyStatus: res.status,
        proxyStatusText: res.statusText,
        gasStatus: 0,
        gasStatusText: 'Failed',
        webAppUrlMasked: url.length > 25 ? url.substring(0, 20) + '...' : url,
        actionSent: 'getStatus',
        sourceSent: sourceKey,
        rawJson: null,
        rawText: errText,
        error: `Proxy Server Error HTTP ${res.status}: ${res.statusText}`,
        validationResult: report,
      };
    }

    const data: ProxyResponse<StatusResponseContract> = await res.json();
    const validationReport = validateStatusContract(sourceKey, data.rawJson, data.proxyStatus, data.error);

    return {
      ...data,
      validationResult: validationReport,
    };
  } catch (err: any) {
    const report = validateStatusContract(sourceKey, null, 0, err.message);
    return {
      proxyStatus: 0,
      proxyStatusText: 'Network Error',
      gasStatus: 0,
      gasStatusText: 'Failed',
      webAppUrlMasked: url.length > 25 ? url.substring(0, 20) + '...' : url,
      actionSent: 'getStatus',
      sourceSent: sourceKey,
      rawJson: null,
      rawText: '',
      error: `Network Connection Error: ${err.message || String(err)}`,
      validationResult: report,
    };
  }
}

/**
 * Ambil Pratinjau Data (Preview Data - Max 10 Records) dari Google Apps Script
 */
export async function fetchPreviewData(
  sourceKey: DatabaseSourceKey,
  limit: number = 10,
  overrideUrl?: string
): Promise<ProxyResponse<PreviewResponseContract>> {
  const url = overrideUrl || getStoredWebAppUrl();

  try {
    const proxyUrl = `/api/gas-proxy?action=getPreview&source=${encodeURIComponent(sourceKey)}&limit=${limit}&webAppUrl=${encodeURIComponent(url)}`;
    const res = hasGas() ? await (async()=>{const parsed=new URL(proxyUrl,location.origin);const action=parsed.searchParams.get('action')!;const rawJson=await gasCall(action,{source:sourceKey});return new Response(JSON.stringify({proxyStatus:200,gasStatus:200,rawJson,rawText:JSON.stringify(rawJson),actionSent:action,sourceSent:sourceKey,webAppUrlMasked:'Apps Script native',error:rawJson.success===false?rawJson.error:undefined}),{status:200});})() : await fetch(proxyUrl);
    
    if (!res.ok) {
      const errText = await res.text();
      return {
        proxyStatus: res.status,
        proxyStatusText: res.statusText,
        gasStatus: 0,
        gasStatusText: 'Failed',
        webAppUrlMasked: url,
        actionSent: 'getPreview',
        sourceSent: sourceKey,
        rawJson: null,
        rawText: errText,
        error: `Proxy Server Error HTTP ${res.status}: ${res.statusText}`,
        validationResult: {
          isContractValid: false,
          items: [],
          missingFields: [],
          summaryMessage: `Gagal mengambil preview data: HTTP ${res.status}`,
        },
      };
    }

    const data: ProxyResponse<PreviewResponseContract> = await res.json();
    try {
      if (data.error) throw new Error(data.error);
      if (data.gasStatus && (data.gasStatus < 200 || data.gasStatus >= 300)) throw new Error(`Apps Script HTTP ${data.gasStatus}`);
      data.rawJson = parsePreviewContract(data.rawJson, sourceKey);
      data.validationResult = { isContractValid: true, items: [], missingFields: [], summaryMessage: 'Kontrak preview valid' };
    } catch (err: any) {
      data.error = err.message;
      data.validationResult = { isContractValid: false, items: [], missingFields: [], summaryMessage: err.message };
    }
    return data;
  } catch (err: any) {
    return {
      proxyStatus: 0,
      proxyStatusText: 'Network Error',
      gasStatus: 0,
      gasStatusText: 'Failed',
      webAppUrlMasked: url,
      actionSent: 'getPreview',
      sourceSent: sourceKey,
      rawJson: null,
      rawText: '',
      error: `Network Connection Error: ${err.message}`,
      validationResult: {
        isContractValid: false,
        items: [],
        missingFields: [],
        summaryMessage: `Network Error: ${err.message}`,
      },
    };
  }
}
