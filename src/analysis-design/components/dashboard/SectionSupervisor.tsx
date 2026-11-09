import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Clock,
  Eye,
  Check,
  RotateCcw,
} from 'lucide-react';
import { SupervisorFinding, FindingCategory, ViewSettings } from '../../types/training';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';

interface SectionSupervisorProps {
  findings: SupervisorFinding[];
  viewSettings: ViewSettings;
  onSelectFinding: (finding: SupervisorFinding) => void;
  onToggleReview: (id: string) => void;
}

export const SectionSupervisor: React.FC<SectionSupervisorProps> = ({
  findings,
  viewSettings,
  onSelectFinding,
  onToggleReview,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Semua');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Semua');

  if (!viewSettings.showSupervisor) return null;

  // Group findings by category for horizontal bar chart
  const categories: FindingCategory[] = [
    'Kehadiran Belum Diisi',
    'Evaluasi Belum Lengkap',
    'Training Mendatang Tidak Lengkap',
    'Status Pelaksanaan Belum Jelas',
    'Konflik Data',
  ];

  const categoryColorMap: Record<FindingCategory, string> = {
    'Kehadiran Belum Diisi': '#dc2626', // Red
    'Evaluasi Belum Lengkap': '#d97706', // Amber
    'Training Mendatang Tidak Lengkap': '#0284c7', // Sky blue
    'Status Pelaksanaan Belum Jelas': '#7c3aed', // Purple
    'Konflik Data': '#b91c1c', // Crimson
  };

  const chartData = categories.map((cat) => {
    const count = findings.filter((f) => f.category === cat).length;
    return {
      id: cat,
      label: cat,
      value: count,
      displayValue: `${count} temuan`,
      color: categoryColorMap[cat],
    };
  });

  // Filtered findings for the table
  const filteredFindings = findings.filter((f) => {
    if (selectedCategoryFilter !== 'Semua' && f.category !== selectedCategoryFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'Semua' && f.reviewStatus !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  const pendingCount = findings.filter((f) => f.reviewStatus === 'Perlu Ditinjau').length;
  const reviewedCount = findings.filter((f) => f.reviewStatus === 'Ditinjau Demo').length;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Section Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-800 flex items-center justify-center font-bold text-xs border border-red-200">
            04
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Supervisor / Eksekutor — Temuan Operasional & Kualitas Data
              </h3>
              <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {pendingCount} Perlu Ditinjau
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fokus: Apa anomali atau data belum lengkap yang perlu segera diperiksa dan ditindaklanjuti?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {isExpanded ? 'Ringkas Section' : 'Perluas Section'}
          </span>
          <button className="text-slate-400 hover:text-slate-700">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-lg border border-red-200 bg-red-50/40">
              <div className="flex items-center justify-between text-xs text-red-800 font-semibold mb-1">
                <span>Temuan Belum Ditinjau</span>
                <ShieldAlert className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900 font-mono-numbers">
                {pendingCount}{' '}
                <span className="text-xs font-normal text-red-700">Item</span>
              </div>
              <div className="text-[11px] text-red-700 mt-0.5">
                Membutuhkan tindakan koreksi atau konfirmasi
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
                <span>Sudah Ditinjau (Demo)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-900 font-mono-numbers">
                {reviewedCount}{' '}
                <span className="text-xs font-normal text-emerald-700">Item</span>
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                Tercatat pada state peninjauan sesi saat ini
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
                <span>Total Temuan Terdeteksi</span>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
                {findings.length}{' '}
                <span className="text-xs font-normal text-slate-500">Item</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Dari 5 kategori aturan integritas data
              </div>
            </div>
          </div>

          {/* Interactive Chart: Findings by Category */}
          {viewSettings.showFindingsCategoryChart && (
            <div>
              <HorizontalBarChart
                title="Jumlah Temuan Berdasarkan Jenis Masalah"
                subtitle="Klik salah satu baris batang untuk memfilter tabel temuan di bawah ini"
                unit="Temuan"
                data={chartData}
                onItemClick={(item) => {
                  setSelectedCategoryFilter((prev) => (prev === item.label ? 'Semua' : item.label));
                }}
              />
            </div>
          )}

          {/* Findings Filter Bar & Action Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Temuan Operasional yang Perlu Tindakan
                </h4>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kategori:</span>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Semua">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span>Status:</span>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Perlu Ditinjau">Perlu Ditinjau</option>
                    <option value="Ditinjau Demo">Ditinjau Demo</option>
                  </select>
                </div>

                {(selectedCategoryFilter !== 'Semua' || selectedStatusFilter !== 'Semua') && (
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter('Semua');
                      setSelectedStatusFilter('Semua');
                    }}
                    className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Findings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Jenis Temuan</th>
                    <th className="px-3.5 py-2.5">Program & Sesi</th>
                    <th className="px-3.5 py-2.5 text-center">Bukti Jumlah</th>
                    <th className="px-3.5 py-2.5">Usulan Pemeriksa</th>
                    <th className="px-3.5 py-2.5 text-center">Status Tinjauan</th>
                    <th className="px-3.5 py-2.5 text-right">Aksi Demo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredFindings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada temuan yang cocok dengan filter aktif
                      </td>
                    </tr>
                  ) : (
                    filteredFindings.map((finding) => {
                      const isReviewed = finding.reviewStatus === 'Ditinjau Demo';
                      return (
                        <tr
                          key={finding.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-3.5 py-3 align-top">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                finding.severity === 'Tinggi'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {finding.category}
                            </span>
                            <div className="font-semibold text-slate-900 mt-1">
                              {finding.title}
                            </div>
                          </td>

                          <td className="px-3.5 py-3 align-top">
                            <div className="font-medium text-slate-800">
                              {finding.programTitle}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {finding.sessionCode} · {finding.department} ({finding.source})
                            </div>
                          </td>

                          <td className="px-3.5 py-3 text-center align-top font-mono-numbers font-bold text-slate-800">
                            {finding.evidenceCount} baris
                          </td>

                          <td className="px-3.5 py-3 align-top text-slate-600 max-w-xs leading-relaxed">
                            {finding.inspectorRecommendation}
                          </td>

                          <td className="px-3.5 py-3 text-center align-top">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                isReviewed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {finding.reviewStatus}
                            </span>
                          </td>

                          <td className="px-3.5 py-3 text-right align-top space-x-2">
                            <button
                              onClick={() => onSelectFinding(finding)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                              title="Buka rincian bukti temuan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Rincian</span>
                            </button>

                            <button
                              onClick={() => onToggleReview(finding.id)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1 ${
                                isReviewed
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isReviewed ? 'Batalkan' : 'Ditinjau'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1">
              <span>
                *Peringatan Tata Kelola: Tindakan "Tandai Ditinjau" hanya mencatat tinjauan supervisi secara lokal,
                bukan berarti masalah data otomatis terselesaikan di database master.
              </span>
              <span className="font-medium text-slate-600">
                Total: {filteredFindings.length} temuan ditampilkan
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
