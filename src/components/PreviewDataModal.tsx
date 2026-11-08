import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Eye, 
  FileSpreadsheet, 
  RefreshCw, 
  Copy, 
  Check, 
  Table, 
  Database,
  AlertTriangle
} from 'lucide-react';
import { DatabaseSourceConfig, PreviewResponseContract } from '../types/database';
import { fetchPreviewData } from '../services/gasBridge';

interface PreviewDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseSourceConfig;
}

export const PreviewDataModal: React.FC<PreviewDataModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PreviewResponseContract | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [diagnostic, setDiagnostic] = useState('');

  const requestId = useRef(0);
  const loadPreview = async () => {
    const id = ++requestId.current;
    setPreviewData(null);
    setIsLoading(true);
    setErrorMessage(null);
    setDiagnostic('');
    const res = await fetchPreviewData(config.key, 10);
    if (id !== requestId.current) return;
    setDiagnostic(JSON.stringify({ action: res.actionSent, source: res.sourceSent, proxyStatus: res.proxyStatus, gasStatus: res.gasStatus, response: res.rawJson, rawText: res.rawText }, null, 2).slice(0, 12000));
    setIsLoading(false);

    if (!res.error && res.validationResult?.isContractValid && res.rawJson?.success) {
      setPreviewData(res.rawJson);
    } else {
      setPreviewData(null);
      setErrorMessage(res.error || res.rawJson?.error || 'Gagal mengambil data pratinjau dari Apps Script.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPreview();
    }
    return () => { requestId.current++; };
  }, [isOpen, config.key]);

  if (!isOpen) return null;

  const handleCopyTable = async () => {
    if (!previewData) return;
    const cols = previewData.columns.join('\t');
    const recs = previewData.records.map(r => r.join('\t')).join('\n');
    try { await navigator.clipboard.writeText(`${cols}\n${recs}`); }
    catch { setErrorMessage("Tidak dapat menyalin data. Izinkan akses clipboard lalu coba lagi."); return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Pratinjau Data ${config.name}`} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden font-['Inter',sans-serif]">
        
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Pratinjau Data (Max 10 Record): {config.name}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {config.codeName}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Data real dari Google Sheets via Apps Script (`getPreview`)
              </p>
            </div>
          </div>
          <button
            aria-label="Tutup pratinjau"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-600 font-mono">
            <span>Sheet: <strong className="text-slate-900">{previewData?.sheetName || config.defaultSheetName}</strong></span>
            <span>&bull;</span>
            <span>Contoh / total baris data: <strong className="text-slate-900">{previewData?.records?.length || 0} / {previewData?.totalRecords || 0}</strong></span>
            <span>&bull;</span>
            <span>Kolom: <strong className="text-slate-900">{previewData?.columns?.length || 0}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTable}
              disabled={!previewData || previewData.records.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-md transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Tersalin!' : 'Salin Data'}</span>
            </button>

            <button
              onClick={loadPreview}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {previewData && !isLoading && !errorMessage && (
          <div className="px-4 py-3 text-xs bg-amber-50 border-b border-amber-200 text-amber-950 space-y-1">
            <p>Menampilkan maksimal 10 baris pertama menurut urutan sheet, bukan 10 baris terakhir. Kolom Baris Sheet menunjukkan nomor baris aslinya.</p>
            {previewData.recordColumn && <p>Baris dihitung jika kolom {previewData.recordColumn} terisi. Nilai ID berulang tidak digabung.</p>}
            {(previewData.missingIdRecordCount ?? 0) > 0 && <p>{previewData.missingIdRecordCount} baris memiliki {previewData.idColumn || 'ID'} kosong dan tetap dihitung. Baris Sheet: {previewData.missingIdSourceRows?.join(', ')}{(previewData.missingIdRecordCount ?? 0) > (previewData.missingIdSourceRows?.length ?? 0) ? ' (daftar dibatasi)' : ''}.</p>}
            {previewData.recordColumn === undefined && <p>Backend belum mengirim rincian hitungan. Perbarui DatabaseService.gs dan deploy New version untuk audit baris.</p>}
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 overflow-y-auto flex-1 min-h-[300px] flex flex-col justify-center">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">Mengambil 10 record data dari Apps Script...</p>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-2 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Gagal Mengambil Pratinjau Data:</span>
              </div>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-rose-200/80">
                {errorMessage}
              </p>
              <details><summary className="cursor-pointer">Lihat respons untuk diagnostik</summary><pre className="mt-2 whitespace-pre-wrap break-all max-h-64 overflow-auto">{diagnostic}</pre></details>
            </div>
          ) : previewData && previewData.columns.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center font-mono text-slate-400 border-r border-slate-200">Baris Sheet</th>
                    {previewData.columns.map((col, idx) => (
                      <th key={idx} className="py-2.5 px-3.5 border-r border-slate-200 whitespace-nowrap font-semibold">
                        {col || `Kolom ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewData.records.length === 0 && <tr><td colSpan={previewData.columns.length + 1} className="p-4 text-center">Tidak ada baris yang memenuhi penanda record sumber.</td></tr>}
                  {previewData.records.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono text-slate-400 bg-slate-50/50 border-r border-slate-200 tabular-nums">
                        {previewData.sourceRows?.[rowIdx] ?? '—'}
                      </td>
                      {previewData.columns.map((_, colIdx) => {
                        const cellVal = row[colIdx] ?? '';
                        return (
                          <td key={colIdx} className="py-2 px-3.5 border-r border-slate-100 whitespace-nowrap font-mono text-slate-800 text-[12px] tabular-nums max-w-xs truncate" title={cellVal}>
                            {cellVal !== '' ? cellVal : <span className="text-slate-300 italic">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Sheet Kosong / Tidak Memiliki Record Data</p>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Database ID: {previewData?.spreadsheetId || config.spreadsheetId}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
