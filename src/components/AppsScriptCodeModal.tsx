import codeGs from '../backend/Code.gs?raw';
import serviceGs from '../backend/DatabaseService.gs?raw';
import cacheGs from '../backend/CacheEngine.gs?raw';
import meetdirGs from '../backend/MeetdirReport.gs?raw';
import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  FileCode,
  Layers
} from 'lucide-react';

interface AppsScriptCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string;
}

export const AppsScriptCodeModal: React.FC<AppsScriptCodeModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'service' | 'guide'>('code');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedService, setCopiedService] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, isCode: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedService(true);
      setTimeout(() => setCopiedService(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs font-['Inter',sans-serif]">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Kode Google Apps Script Backend (`Code.gs` &amp; `DatabaseService.gs`)
              </h3>
              <p className="text-xs text-slate-500">
                Siap disalin langsung ke editor Google Apps Script
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

        {/* Modal Navigation Tabs */}
        <details className="p-4 border-b text-xs bg-amber-50">
          <summary className="font-semibold cursor-pointer">File ketiga wajib: CacheEngine.gs &amp; aktivasi cache</summary>
          <p className="my-2">Buat CacheEngine.gs di project Executive, salin kode di bawah, lalu jalankan installExecutiveCache_ sekali dan izinkan Drive serta trigger. Setelah itu perbarui deployment aktif ke New version. Folder cache dibuat terpisah; sumber hanya dibaca.</p>
          <textarea aria-label="Kode CacheEngine.gs" readOnly value={cacheGs} className="w-full h-40 border rounded p-2 font-mono text-[10px] bg-white" onFocus={e=>e.target.select()} />
          <p className="my-2 font-semibold">File keempat: MeetdirReport.gs. Tambahkan pada project Executive yang sama, lalu perbarui cache.</p>
          <textarea aria-label="Kode MeetdirReport.gs" readOnly value={meetdirGs} className="w-full h-40 border rounded p-2 font-mono text-[10px] bg-white" onFocus={e=>e.target.select()} />
        </details>
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 pt-2 gap-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-t-md transition-colors border-b-2 ${
              activeTab === 'code'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs font-semibold'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            1. Code.gs
          </button>

          <button
            onClick={() => setActiveTab('service')}
            className={`px-3 py-1.5 rounded-t-md transition-colors border-b-2 ${
              activeTab === 'service'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs font-semibold'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            2. DatabaseService.gs
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-t-md transition-colors border-b-2 ${
              activeTab === 'guide'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs font-semibold'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            3. Petunjuk Deployment
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
          {activeTab === 'code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>File: <strong className="font-mono text-slate-900">Code.gs</strong></span>
                <button
                  onClick={() => copyToClipboard(codeGs, true)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 font-semibold"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Code.gs'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[10px] overflow-x-auto max-h-72 leading-relaxed">
                {codeGs}
              </pre>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>File: <strong className="font-mono text-slate-900">DatabaseService.gs</strong></span>
                <button
                  onClick={() => copyToClipboard(serviceGs, false)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 font-semibold"
                >
                  {copiedService ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedService ? 'Tersalin!' : 'Salin DatabaseService.gs'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-emerald-300 rounded-lg font-mono text-[10px] overflow-x-auto max-h-72 leading-relaxed">
                {serviceGs}
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3 leading-relaxed text-slate-700">
              <h4 className="font-bold text-slate-900 text-xs">Langkah Deploy Versi Baru ke Google Apps Script:</h4>
              <ol className="list-decimal list-inside space-y-2"><li>Gunakan folder apps-script dari ZIP: empat file GS, Index.html, dan appsscript.json.</li><li>Jalankan setupExecutiveAccess_ lalu atur daftar akun ADR_ALLOWED_EMAILS.</li><li>Verifikasi NIP ganda melalui ADR_NIP_COLUMN_PTU/PTO/OTOMASI.</li><li>Jalankan installExecutiveCache_. Cache dibuat di folder Drive terpisah.</li><li>Update versi deployment Executive. Untuk hosting Apps Script gunakan domain Workspace terbatas dan akun yang terdaftar.</li><li>Untuk preview AI Studio, isi GOOGLE_APPS_SCRIPT_URL dan ADR_API_TOKEN di Secrets server. Token tidak dimasukkan ke frontend.</li><li>Baca MULAI_DI_SINI.md pada ZIP untuk langkah lengkap dan pilihan deployment.</li></ol>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <a
            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
          >
            <span>Buka Google Spreadsheet PTU</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
