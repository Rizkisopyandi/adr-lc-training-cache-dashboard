import React, { useState } from 'react';
import { DEFAULT_WEBAPP_URL } from '../config/backend';
import { 
  X, 
  Link2, 
  Check, 
  Code2, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface SetWebAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveUrl: (newUrl: string) => void;
  onOpenAppsScriptGuide: () => void;
}

export const SetWebAppModal: React.FC<SetWebAppModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSaveUrl,
  onOpenAppsScriptGuide,
}) => {
  const [inputValue, setInputValue] = useState(currentUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveUrl(inputValue.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full flex flex-col overflow-hidden font-['Inter',sans-serif]">
        
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Set WebApp URL Google Apps Script
              </h3>
              <p className="text-xs text-slate-500">
                URL eksekusi `/exec` dari deployment Google Apps Script
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              URL Web App (`https://script.google.com/macros/s/.../exec`):
            </label>
            <input
              type="url"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-600 space-y-2">
            <div className="font-semibold text-slate-900 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Syarat Deployment Web App:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
              <li>Pilih jenis deployment: <strong>Web App</strong></li>
              <li>Execute as: <strong>Me (Email Anda)</strong></li>
              <li>Who has access: <strong>Sesuai panduan akses pada MULAI_DI_SINI.md</strong></li>
              <li>Pastikan URL berakhiran <strong>`/exec`</strong>, bukan `/dev`.</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onOpenAppsScriptGuide}
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lihat Kode `Code.gs` &amp; `DatabaseService.gs`</span>
            </button>

            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue(DEFAULT_WEBAPP_URL)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Gunakan URL bawaan
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleSave}
            disabled={!inputValue.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors shadow-2xs"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{savedSuccess ? 'Tersimpan!' : 'Simpan URL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
