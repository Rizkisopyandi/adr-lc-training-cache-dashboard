import React from 'react';
import {
  Calendar,
  Database,
  Building2,
  Sliders,
  Search,
  Sparkles,
  RefreshCw,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { FilterState } from '../../types/training';
import {
  PERIOD_OPTIONS,
  SOURCE_OPTIONS,
  DEPARTMENT_OPTIONS,
} from '../../data/mockTrainingData';

interface DashboardHeaderProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onOpenViewCustomizer: () => void;
  onOpenTargetSettings: () => void;
  completedClassesCount: number;
  totalParticipantsCount: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  filters,
  onFilterChange,
  onOpenViewCustomizer,
  onOpenTargetSettings,
  completedClassesCount,
  totalParticipantsCount,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-5 space-y-4">
      {/* Top Banner & Title Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 tracking-wide uppercase">
              DEMO — DATA SIMULASI
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-mono-numbers">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              Pembaruan: 8 Nov 2026, 09:30 WIB
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Preview desain · simulasi lokal
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Training Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ADR Learning Center — Monitoring Komprehensif Eksekutif, Subdivisi, Departemen & Supervisi
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenTargetSettings}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
          >
            <Target className="w-3.5 h-3.5 text-emerald-700" />
            <span>Simulasi Target KPI</span>
          </button>

          <button
            onClick={onOpenViewCustomizer}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Atur Tampilan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar Grid */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Filter 1: Periode */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Periode Laporan
            </label>
            <select
              value={filters.period}
              onChange={(e) => onFilterChange({ ...filters, period: e.target.value })}
              className="w-full bg-transparent font-medium text-slate-800 outline-none truncate cursor-pointer text-xs"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter 2: Sumber Database */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <Database className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Sumber Database
            </label>
            <select
              value={filters.source}
              onChange={(e) => onFilterChange({ ...filters, source: e.target.value })}
              className="w-full bg-transparent font-medium text-slate-800 outline-none truncate cursor-pointer text-xs"
            >
              {SOURCE_OPTIONS.map((src) => (
                <option key={src} value={src}>
                  {src === 'Semua' ? 'Semua Sumber (PTU, PTO, Otomasi, dll)' : src}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter 3: Departemen */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Divisi / Departemen
            </label>
            <select
              value={filters.department}
              onChange={(e) => onFilterChange({ ...filters, department: e.target.value })}
              className="w-full bg-transparent font-medium text-slate-800 outline-none truncate cursor-pointer text-xs"
            >
              {DEPARTMENT_OPTIONS.map((dep) => (
                <option key={dep} value={dep}>
                  {dep === 'Semua' ? 'Semua Departemen' : dep}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter 4: Quick Search */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Cari Program / Modul
            </label>
            <input
              type="text"
              placeholder="Ketik judul modul atau kode..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full bg-transparent font-medium text-slate-800 outline-none placeholder:text-slate-400 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Filter feedback badge bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-slate-500">
        <div className="flex items-center gap-3">
          <span>
            Filter aktif menghasilkan:{' '}
            <strong className="text-slate-800 font-mono-numbers">
              {completedClassesCount}
            </strong>{' '}
            kelas selesai,{' '}
            <strong className="text-slate-800 font-mono-numbers">
              {totalParticipantsCount}
            </strong>{' '}
            kehadiran partisipan
          </span>
          {(filters.period !== 'all' ||
            filters.source !== 'Semua' ||
            filters.department !== 'Semua' ||
            filters.searchQuery !== '') && (
            <button
              onClick={() =>
                onFilterChange({
                  period: 'all',
                  source: 'Semua',
                  department: 'Semua',
                  searchQuery: '',
                })
              }
              className="text-emerald-700 hover:underline font-semibold"
            >
              Reset Semua Filter
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Semua metrik dihitung secara real-time dari dataset simulasi terpadu
        </div>
      </div>
    </div>
  );
};
