import React from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Table, 
  Eye, 
  Columns, 
  KeyRound,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { DatabaseSourceConfig, DatabaseStatusState } from '../types/database';

interface DatabaseCardProps {
  config: DatabaseSourceConfig;
  statusState: DatabaseStatusState;
  onTestApi: (key: DatabaseSourceConfig['key']) => void;
  onPreviewData: (key: DatabaseSourceConfig['key']) => void;
  isTesting: boolean;
}

export const DatabaseCard: React.FC<DatabaseCardProps> = ({
  config,
  statusState,
  onTestApi,
  onPreviewData,
  isTesting,
}) => {
  const isPtu = config.key === 'ptu';

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Belum Diuji';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = () => {
    if (isTesting || statusState.status === 'Testing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Menguji Koneksi...</span>
        </span>
      );
    }

    if (statusState.status === 'Connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{statusState.cachedAt ? 'Cache siap' : 'Connected'}</span>
        </span>
      );
    }

    if (statusState.status === 'Error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Failed / Error</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
        <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
        <span>Belum diuji</span>
      </span>
    );
  };

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-2xs transition-all flex flex-col justify-between ${
      isPtu ? 'border-emerald-300 ring-2 ring-emerald-600/10' : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Top Header Card */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
              isPtu ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-100'
            }`}>
              {config.codeName}
            </span>
            <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
              {config.category}
            </span>
          </div>

          {/* Connection Status Badge */}
          {getStatusBadge()}
        </div>

        {/* Title & Description */}
        <div className="mt-3 space-y-1">
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{config.name}</span>
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* Real Verified Metrics Grid */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              Sheet Name:
            </span>
            <strong className="text-slate-900 font-semibold font-mono">
              {statusState.sheetName || config.defaultSheetName}
            </strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Columns className="w-3.5 h-3.5 text-slate-400" />
              Jumlah Kolom:
            </span>
            <strong className={`font-mono tabular-nums font-bold ${
              statusState.columnCount > 0 ? 'text-emerald-700' : 'text-slate-400'
            }`}>
              {statusState.status === 'Connected' ? `${statusState.columnCount} Kolom` : '0 Kolom'}
            </strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Kolom {config.idColumnName}:
            </span>
            {statusState.status === 'Connected' ? (
              statusState.idColumnFound ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Ditemukan
                </span>
              ) : (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-500" />
                  Tidak Ditemukan
                </span>
              )
            ) : (
              <span className="text-slate-400 font-normal">Belum Diverifikasi</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions & Timestamp */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Diuji: {formatTime(statusState.lastTestedAt)}
          </span>
          {isPtu && (
            <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px]">
              Database PTU Utama
            </span>
          )}
        </div>

        {/* 2 Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Test API Button */}
          <button
            onClick={() => onTestApi(config.key)}
            disabled={isTesting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-md transition-colors disabled:opacity-50"
          >
            <Table className="w-3.5 h-3.5 text-slate-600" />
            <span>Test API</span>
          </button>

          {/* Preview Data Button */}
          <button
            onClick={() => onPreviewData(config.key)}
            disabled={isTesting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md transition-colors shadow-2xs disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
