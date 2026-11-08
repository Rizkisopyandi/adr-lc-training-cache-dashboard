import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  Code2, 
  ShieldCheck, 
  ExternalLink,
  Terminal,
  FileJson
} from 'lucide-react';
import { DatabaseSourceConfig, ProxyResponse, StatusResponseContract } from '../types/database';

interface BackendDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseSourceConfig;
  diagnosticData: ProxyResponse<StatusResponseContract> | null;
  onReTest: () => void;
  isTesting: boolean;
}

export const BackendDiagnosticModal: React.FC<BackendDiagnosticModalProps> = ({
  isOpen,
  onClose,
  config,
  diagnosticData,
  onReTest,
  isTesting,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'validation' | 'rawJson' | 'rawText'>('validation');

  if (!isOpen) return null;

  const validation = diagnosticData?.validationResult;
  const isVerified = validation?.isContractValid ?? false;

  const handleCopyJson = () => {
    const textToCopy = diagnosticData?.rawJson 
      ? JSON.stringify(diagnosticData.rawJson, null, 2) 
      : diagnosticData?.rawText || '';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden font-['Inter',sans-serif]">
        
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
              isVerified ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Diagnostik API Backend: {config.name}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  key={config.key}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Audit Real-Time Alur Frontend &rarr; Proxy `/api/gas-proxy` &rarr; Apps Script `/exec`
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7 Diagnostic Header Metrics Bar */}
        <div className="p-4 bg-slate-900 text-slate-200 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* 1. Proxy HTTP Status */}
          <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">1. HTTP Proxy</span>
            <span className={`font-mono font-bold ${diagnosticData?.proxyStatus === 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {diagnosticData?.proxyStatus ? `${diagnosticData.proxyStatus} ${diagnosticData.proxyStatusText}` : 'N/A'}
            </span>
          </div>

          {/* 2. Apps Script HTTP Status */}
          <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">2. HTTP Apps Script</span>
            <span className={`font-mono font-bold ${diagnosticData?.gasStatus === 200 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {diagnosticData?.gasStatus ? `${diagnosticData.gasStatus} ${diagnosticData.gasStatusText}` : 'N/A'}
            </span>
          </div>

          {/* 3. Action & Source Sent */}
          <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">3. Action &amp; Source</span>
            <span className="font-mono text-indigo-300 font-semibold truncate block">
              {diagnosticData?.actionSent || 'getStatus'}?source={config.key}
            </span>
          </div>

          {/* 4. Masked Web App URL */}
          <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">4. WebApp URL Masked</span>
            <span className="font-mono text-slate-300 text-[11px] truncate block" title={diagnosticData?.webAppUrlMasked}>
              {diagnosticData?.webAppUrlMasked || '(Belum diset)'}
            </span>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className={`p-3 text-xs border-b font-medium flex items-center justify-between ${
          isVerified 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {isVerified ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{validation?.summaryMessage || 'Menunggu Pengujian Diagnostik...'}</span>
          </div>

          <button
            onClick={onReTest}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-2xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Uji Ulang API</span>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 pt-2 gap-1">
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors border-b-2 ${
              activeTab === 'validation'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs font-semibold'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            1. Validasi Kontrak Properti
          </button>

          <button
            onClick={() => setActiveTab('rawJson')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors border-b-2 ${
              activeTab === 'rawJson'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs font-semibold'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            2. Raw JSON Response
          </button>

          <button
            onClick={() => setActiveTab('rawText')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors border-b-2 ${
              activeTab === 'rawText'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs font-semibold'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            3. Raw Body Text
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'validation' && (
            <div className="space-y-3">
              {/* Missing Fields Warning */}
              {validation && validation.missingFields.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Properti Hilang / Tidak Sesuai Kontrak:</span>
                  </div>
                  <p className="text-[11px] font-mono">
                    {validation.missingFields.join(', ')}
                  </p>
                </div>
              )}

              {/* Property Validation Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Properti Kontrak</th>
                      <th className="p-2.5">Ekspektasi Kontrak</th>
                      <th className="p-2.5">Nilai Diterima</th>
                      <th className="p-2.5 text-center">Hasil Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {validation?.items.map((item, idx) => (
                      <tr key={idx} className={item.passed ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/70'}>
                        <td className="p-2.5 font-semibold text-slate-800 font-mono">
                          {item.field}
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                          {item.expectedDescription}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] font-bold text-slate-900">
                          {item.receivedValue}
                        </td>
                        <td className="p-2.5 text-center">
                          {item.passed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                              <Check className="w-3 h-3 text-emerald-600" />
                              PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold text-[11px]" title={item.errorMessage}>
                              <X className="w-3 h-3 text-rose-600" />
                              FAIL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Real Error Output */}
              {diagnosticData?.error && (
                <div className="p-3 rounded-md bg-slate-900 text-rose-300 font-mono text-[11px] space-y-1">
                  <span className="text-slate-400 block font-sans text-[10px] uppercase font-bold">Pesan Error Sebenarnya dari Server/Proxy:</span>
                  <p className="whitespace-pre-wrap">{diagnosticData.error}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rawJson' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span>Respons JSON Parsed dari Apps Script Web App:</span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed">
                {diagnosticData?.rawJson 
                  ? JSON.stringify(diagnosticData.rawJson, null, 2)
                  : '(Tidak ada respons JSON yang valid)'}
              </pre>
            </div>
          )}

          {activeTab === 'rawText' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span>Respons Teks Mentah (Raw Text Response):</span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Teks</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] overflow-x-auto max-h-72 leading-relaxed">
                {diagnosticData?.rawText || '(Teks mentah kosong)'}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Key: {config.key} &bull; Expected Columns: {config.key === 'ptu' ? 47 : 'Dynamic'}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
          >
            Tutup Diagnostik
          </button>
        </div>
      </div>
    </div>
  );
};
