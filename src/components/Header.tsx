import React from 'react';
import { 
  Database, 
  RefreshCw, 
  Link2, 
  CheckCircle2, 
  AlertCircle,
  Code2,
  Layers,
  Sparkles
} from 'lucide-react';
import { DatabaseSourceKey } from '../types/database';

interface HeaderProps {
  showDatabaseActions?: boolean;
  webAppUrl: string;
  onOpenSetWebAppModal: () => void;
  onTestAllConnections: () => void;
  isTestingAll: boolean;
  onOpenAppsScriptGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showDatabaseActions = true,
  webAppUrl,
  onOpenSetWebAppModal,
  onTestAllConnections,
  isTestingAll,
  onOpenAppsScriptGuide,
}) => {
  const isConfigured = Boolean(webAppUrl && webAppUrl.startsWith('http'));

  const maskUrl = (url: string) => {
    if (!url) return 'Belum Dikonfigurasi';
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      const parts = pathname.split('/');
      const macroIndex = parts.indexOf('s');
      if (macroIndex !== -1 && macroIndex + 1 < parts.length) {
        const id = parts[macroIndex + 1];
        return `${parsed.host}/.../${id.substring(0, 6)}...${id.substring(id.length - 4)}/exec`;
      }
      return url.length > 30 ? url.substring(0, 25) + '...' : url;
    } catch {
      return 'URL Invalid';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs select-none print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-16 py-3 sm:py-0 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight">
                <span className="hidden sm:inline">ADR LC EXECUTIVE TRAINING DASHBOARD</span><span className="sm:hidden">ADR LC Executive</span>
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hidden md:inline">
                5 Sumber Database
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Cache &amp; Monitoring Data Training
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Status WebApp URL Indicator */}
          <button
            onClick={onOpenSetWebAppModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
            }`}
            title="Klik untuk konfigurasi URL Google Apps Script Web App"
          >
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden lg:inline font-mono text-[11px] truncate max-w-[180px]">
              {maskUrl(webAppUrl)}
            </span>
            <span className="lg:hidden">URL</span>
          </button>

          {/* Test All Connections Button */}
          {showDatabaseActions && <button
            onClick={onTestAllConnections}
            disabled={isTestingAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Test All Connections</span>
          </button>}

          {/* Script Guide Button */}
          {showDatabaseActions && <button
            onClick={onOpenAppsScriptGuide}
            title="Kode Apps Script & Petunjuk Deployment"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Backend Code</span>
          </button>}
        </div>
      </div>
    </header>
  );
};
