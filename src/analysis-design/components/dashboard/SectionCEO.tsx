import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Users,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Coins,
  FileSpreadsheet,
} from 'lucide-react';
import { CEOMetrics, formatRupiah, formatRupiahShort } from '../../utils/trainingCalculations';
import { GroupedBarChart } from '../charts/GroupedBarChart';
import { DonutChart, DonutSegment } from '../charts/DonutChart';
import { LineChart, LineDataPoint } from '../charts/LineChart';
import { ViewSettings } from '../../types/training';

interface SectionCEOProps {
  metrics: CEOMetrics;
  viewSettings: ViewSettings;
  onDrilldown: (title: string, category: string, description: string, records: any[]) => void;
}

export const SectionCEO: React.FC<SectionCEOProps> = ({
  metrics,
  viewSettings,
  onDrilldown,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [trendMetric, setTrendMetric] = useState<'biaya' | 'partisipasi'>('biaya');

  if (!viewSettings.showCEO) return null;

  // Transform for Grouped Bar: Anggaran vs Aktual
  const budgetVsActualData = metrics.programBreakdown.map((p) => ({
    label: p.programTitle,
    sublabel: p.source,
    seriesA: Math.round(p.anggaran / 1_000_000), // in Juta IDR
    seriesB: Math.round(p.biayaAktual / 1_000_000),
    id: p.programId,
  }));

  // Source colors palette for corporate enterprise
  const sourceColorMap: Record<string, string> = {
    PTU: '#059669', // Emerald
    PTO: '#0284c7', // Sky Blue
    Otomasi: '#7c3aed', // Purple
    Staff: '#ea580c', // Orange
    Eksternal: '#475569', // Slate
  };

  const donutSegments: DonutSegment[] = metrics.costBySource.map((s) => ({
    label: s.source,
    value: s.cost,
    color: sourceColorMap[s.source] || '#64748b',
    sublabel: `${s.sessionCount} kelas terlaksana`,
  }));

  // Line chart data for trend (clean metric toggle avoiding dual axes!)
  const trendData: LineDataPoint[] = metrics.monthlyTrend.map((t) => ({
    label: t.periodLabel,
    value: trendMetric === 'biaya' ? Math.round(t.biayaAktual / 1_000_000) : t.partisipasiHadir,
  }));

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Section Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200">
            01
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                CEO / Manajemen Eksekutif
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                · Pelaksanaan, Biaya Aktual, dan Varian Anggaran
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fokus: Apa program yang sudah terlaksana dan bagaimana penggunaan anggarannya?
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
          {/* KPI Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Kelas Terlaksana',
                  'CEO / Manajemen',
                  'Daftar seluruh sesi training yang berstatus Terlaksana',
                  metrics.programBreakdown.map((p) => ({
                    id: p.programId,
                    title: p.programTitle,
                    date: '2026',
                    department: p.department,
                    source: p.source,
                    trainer: 'Instruktur Terverifikasi',
                    metric1Label: 'Kelas Terlaksana',
                    metric1Value: `${p.kelasTerlaksana} Sesi`,
                    metric2Label: 'Partisipasi Hadir',
                    metric2Value: `${p.partisipasiHadir} Orang`,
                    status: 'Terlaksana',
                  }))
                )
              }
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-medium">Kelas Terlaksana</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
                {metrics.kelasTerlaksana} <span className="text-xs font-normal text-slate-500">Kelas</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Dari kelompok program filter aktif
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Partisipasi Hadir',
                  'CEO / Manajemen',
                  'Jumlah peserta yang tercatat status hadir pada sesi terlaksana',
                  metrics.programBreakdown.map((p) => ({
                    id: p.programId,
                    title: p.programTitle,
                    date: '2026',
                    department: p.department,
                    source: p.source,
                    trainer: 'Instruktur Terverifikasi',
                    metric1Label: 'Partisipasi Hadir',
                    metric1Value: `${p.partisipasiHadir} Peserta`,
                    metric2Label: 'Biaya Aktual',
                    metric2Value: formatRupiahShort(p.biayaAktual),
                    status: 'Terlaksana',
                  }))
                )
              }
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-medium">Partisipasi Hadir</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
                {metrics.partisipasiHadir}{' '}
                <span className="text-xs font-normal text-slate-500">Orang-Sesi</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Total kehadiran tercatat valid
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Biaya Aktual Kelas Terlaksana',
                  'CEO / Manajemen',
                  'Rincian serapan biaya riil pada kelas terlaksana (dibandingkan anggaran yang sama)',
                  metrics.programBreakdown.map((p) => ({
                    id: p.programId,
                    title: p.programTitle,
                    date: '2026',
                    department: p.department,
                    source: p.source,
                    trainer: 'Instruktur Terverifikasi',
                    metric1Label: 'Anggaran',
                    metric1Value: formatRupiah(p.anggaran),
                    metric2Label: 'Biaya Aktual',
                    metric2Value: formatRupiah(p.biayaAktual),
                    status: 'Terlaksana',
                  }))
                )
              }
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-medium">Biaya Aktual Selesai</span>
                <Coins className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl font-bold text-emerald-800 font-mono-numbers truncate">
                {formatRupiahShort(metrics.biayaAktual)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
                Varian: {metrics.selisihBiaya >= 0 ? '+' : ''}
                {formatRupiahShort(metrics.selisihBiaya)} (Anggaran vs Aktual)
              </div>
            </div>

            {/* Card 4 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Biaya per Partisipasi Hadir',
                  'CEO / Manajemen',
                  'Rata-rata biaya aktual dibagi total kehadiran peserta pada kelas terlaksana',
                  metrics.programBreakdown.map((p) => ({
                    id: p.programId,
                    title: p.programTitle,
                    date: '2026',
                    department: p.department,
                    source: p.source,
                    trainer: 'Instruktur Terverifikasi',
                    metric1Label: 'Biaya Aktual',
                    metric1Value: formatRupiah(p.biayaAktual),
                    metric2Label: 'Biaya/Peserta',
                    metric2Value:
                      p.partisipasiHadir > 0
                        ? formatRupiah(Math.round(p.biayaAktual / p.partisipasiHadir))
                        : 'Rp 0',
                    status: 'Terlaksana',
                  }))
                )
              }
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-medium">Biaya per Partisipasi</span>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers truncate">
                {formatRupiah(metrics.biayaPerPartisipasi)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Efisiensi biaya per orang hadir
              </div>
            </div>
          </div>

          {/* Important Regulatory Context Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="text-slate-600">
                <span className="font-semibold text-slate-800">Catatan Varian Anggaran: </span>
                Selisih anggaran ({formatRupiah(metrics.selisihBiaya)}) mencerminkan varian serapan biaya
                aktual terhadap rencana kelas yang sama, bukan merupakan keuntungan operasional.
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-900">
                <span className="font-semibold text-amber-950">Status Manfaat Finansial: </span>
                <span className="italic font-medium">Manfaat finansial (ROI/Penghematan) belum tersedia</span>
                {' '}karena data dampak moneter pasca-training belum diintegrasikan ke sistem.
              </div>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Grouped Bar Anggaran vs Aktual */}
            {viewSettings.showBudgetVsActualChart && (
              <div className="lg:col-span-2">
                <GroupedBarChart
                  title="Anggaran vs Biaya Aktual per Program"
                  subtitle="Membandingkan alokasi anggaran dengan biaya riil pada kelompok kelas terlaksana yang sama"
                  unit="Juta Rupiah (IDR)"
                  seriesAName="Anggaran (Plan)"
                  seriesBName="Biaya Aktual"
                  seriesAColor="#94a3b8"
                  seriesBColor="#059669"
                  data={budgetVsActualData}
                  formatValue={(val) => `Rp ${val.toLocaleString('id-ID',{maximumFractionDigits:1})} Jt`}
                  onItemClick={(item) => {
                    const match = metrics.programBreakdown.find((p) => p.programId === item.id);
                    if (match) {
                      onDrilldown(
                        `Rincian Anggaran: ${match.programTitle}`,
                        'CEO / Manajemen',
                        `Sesi terlaksana pada sumber ${match.source} (${match.department})`,
                        [
                          {
                            id: match.programId,
                            title: match.programTitle,
                            date: '2026',
                            department: match.department,
                            source: match.source,
                            trainer: 'Instruktur Terverifikasi',
                            metric1Label: 'Anggaran',
                            metric1Value: formatRupiah(match.anggaran),
                            metric2Label: 'Biaya Aktual',
                            metric2Value: formatRupiah(match.biayaAktual),
                            status: 'Terlaksana',
                          },
                        ]
                      );
                    }
                  }}
                />
              </div>
            )}

            {/* Chart 3: Donut Komposisi Biaya per Sumber */}
            {viewSettings.showSourceCompositionChart && (
              <div>
                <DonutChart
                  title="Komposisi Biaya Aktual per Sumber"
                  subtitle="Proporsi pengeluaran berdasarkan 5 database sumber"
                  unit="IDR"
                  data={donutSegments}
                  centerLabel="Total Biaya"
                  formatValue={(val) => formatRupiahShort(val)}
                  singleSourceFallbackTitle="Rincian Biaya Sumber Terpilih"
                  onSegmentClick={(seg) => {
                    const sourceProgs = metrics.programBreakdown.filter((p) => p.source === seg.label);
                    onDrilldown(
                      `Sumber Database: ${seg.label}`,
                      'CEO / Manajemen',
                      `Daftar seluruh program dengan sumber ${seg.label}`,
                      sourceProgs.map((p) => ({
                        id: p.programId,
                        title: p.programTitle,
                        date: '2026',
                        department: p.department,
                        source: p.source,
                        trainer: 'Instruktur Terverifikasi',
                        metric1Label: 'Biaya Aktual',
                        metric1Value: formatRupiah(p.biayaAktual),
                        metric2Label: 'Partisipasi Hadir',
                        metric2Value: `${p.partisipasiHadir} Orang`,
                        status: 'Terlaksana',
                      }))
                    );
                  }}
                />
              </div>
            )}
          </div>

          {/* Chart 2: Line Chart Tren Biaya & Partisipasi */}
          {viewSettings.showCostTrendChart && (
            <div>
              <LineChart
                title="Tren Biaya Aktual & Partisipasi Hadir"
                subtitle="Pergerakan serapan biaya dan volume kehadiran antarperiode"
                unit={trendMetric === 'biaya' ? 'Juta Rupiah (IDR)' : 'Orang'}
                data={trendData}
                lineColor="#059669"
                formatValue={(val) => (trendMetric === 'biaya' ? `Rp ${val.toLocaleString('id-ID',{maximumFractionDigits:1})} Jt` : `${val.toLocaleString('id-ID',{maximumFractionDigits:0})} org`)}
                metricToggle={{
                  activeMetric: trendMetric,
                  options: [
                    { id: 'biaya', label: 'Tampilkan Tren Biaya' },
                    { id: 'partisipasi', label: 'Tampilkan Tren Partisipasi' },
                  ],
                  onChange: (id) => setTrendMetric(id as 'biaya' | 'partisipasi'),
                }}
              />
            </div>
          )}

          {/* Table: Financial & Participation Breakdown */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Tabel Rincian Biaya dan Pelaksanaan Program
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                Data berbasis kelas yang berstatus Terlaksana
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Program Training</th>
                    <th className="px-4 py-2.5">Sumber</th>
                    <th className="px-4 py-2.5 text-center">Kelas</th>
                    <th className="px-4 py-2.5 text-center">Peserta Hadir</th>
                    <th className="px-4 py-2.5 text-right">Anggaran</th>
                    <th className="px-4 py-2.5 text-right">Biaya Aktual</th>
                    <th className="px-4 py-2.5 text-right">Selisih (Varian)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {metrics.programBreakdown.map((row) => (
                    <tr
                      key={row.programId}
                      onClick={() =>
                        onDrilldown(
                          `Rincian: ${row.programTitle}`,
                          'CEO / Manajemen',
                          `Sesi terlaksana pada sumber ${row.source} (${row.department})`,
                          [
                            {
                              id: row.programId,
                              title: row.programTitle,
                              date: '2026',
                              department: row.department,
                              source: row.source,
                              trainer: 'Instruktur Terverifikasi',
                              metric1Label: 'Anggaran',
                              metric1Value: formatRupiah(row.anggaran),
                              metric2Label: 'Biaya Aktual',
                              metric2Value: formatRupiah(row.biayaAktual),
                              status: 'Terlaksana',
                            },
                          ]
                        )
                      }
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {row.programTitle}
                        <div className="text-[11px] font-normal text-slate-400">
                          {row.department}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {row.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono-numbers">
                        {row.kelasTerlaksana}
                      </td>
                      <td className="px-4 py-3 text-center font-mono-numbers font-medium text-slate-800">
                        {row.partisipasiHadir}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-numbers text-slate-600">
                        {formatRupiah(row.anggaran)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-numbers font-bold text-emerald-800">
                        {formatRupiah(row.biayaAktual)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono-numbers font-semibold ${
                          row.selisih >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {row.selisih >= 0 ? '+' : ''}
                        {formatRupiah(row.selisih)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                    <td className="px-4 py-3 text-slate-900" colSpan={2}>
                      Total Terlaksana
                    </td>
                    <td className="px-4 py-3 text-center font-mono-numbers">
                      {metrics.kelasTerlaksana}
                    </td>
                    <td className="px-4 py-3 text-center font-mono-numbers">
                      {metrics.partisipasiHadir}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-numbers text-slate-700">
                      {formatRupiah(metrics.anggaranSamaKelas)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-numbers text-emerald-800">
                      {formatRupiah(metrics.biayaAktual)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono-numbers ${
                        metrics.selisihBiaya >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {metrics.selisihBiaya >= 0 ? '+' : ''}
                      {formatRupiah(metrics.selisihBiaya)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
