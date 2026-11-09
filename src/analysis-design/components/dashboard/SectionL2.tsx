import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CalendarCheck2,
  Users2,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  ClipboardList,
  Sliders,
} from 'lucide-react';
import { L2Metrics } from '../../utils/trainingCalculations';
import { GroupedBarChart } from '../charts/GroupedBarChart';
import { DonutChart, DonutSegment } from '../charts/DonutChart';
import { PairedBarChart } from '../charts/PairedBarChart';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { LineChart, LineDataPoint } from '../charts/LineChart';
import { TargetConfig, ViewSettings } from '../../types/training';

interface SectionL2Props {
  metrics: L2Metrics;
  targetConfig: TargetConfig;
  viewSettings: ViewSettings;
  onOpenTargetModal: () => void;
  onDrilldown: (title: string, category: string, description: string, records: any[]) => void;
}

export const SectionL2: React.FC<SectionL2Props> = ({
  metrics,
  targetConfig,
  viewSettings,
  onOpenTargetModal,
  onDrilldown,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!viewSettings.showL2) return null;

  // Grouped Bar for Plan vs Actual Classes
  const planVsActualClasses = metrics.programTable.map((p) => ({
    label: p.programTitle,
    sublabel: p.department,
    seriesA: p.rencana,
    seriesB: p.terlaksana,
    id: p.programId,
  }));

  // Attendance Donut Segments
  // Requirement: "Status kehadiran: Hadir, Izin, Tidak Hadir, Belum diisi. Jangan menganggap status kosong sebagai tidak hadir."
  const attendanceDonutSegments: DonutSegment[] = [
    {
      label: 'Hadir',
      value: metrics.hadirCount,
      color: '#059669', // Emerald
      sublabel: 'Mengikuti sesi pelatihan',
    },
    {
      label: 'Izin',
      value: metrics.izinCount,
      color: '#3b82f6', // Blue
      sublabel: 'Surat tugas dinas / izin resmi',
    },
    {
      label: 'Tidak Hadir (Mangkir)',
      value: metrics.tidakHadirCount,
      color: '#ef4444', // Red
      sublabel: 'Tanpa konfirmasi keterangan',
    },
    {
      label: 'Belum Diisi',
      value: metrics.belumDiisiCount,
      color: '#cbd5e1', // Slate
      sublabel: 'Presensi belum diinput oleh panitia',
    },
  ];

  // Bar chart for Delta score (change in points)
  const deltaScoreData = metrics.pairedDistribution.map((p) => ({
    label: p.programTitle,
    sublabel: `${p.validCount} psg data`,
    value: p.delta,
    displayValue: `${p.delta >= 0 ? '+' : ''}${p.delta} Poin`,
    target: targetConfig.scoreDeltaTarget,
    color: p.delta >= targetConfig.scoreDeltaTarget ? '#059669' : '#0284c7',
  }));

  // Line chart for attendance trend
  const attendanceTrendData: LineDataPoint[] = metrics.periodAttendanceTrend.map((t) => ({
    label: t.periodLabel,
    value: t.kehadiranPersen,
    subvalue: `${t.hadirCount}/${t.totalCount} orang`,
  }));

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Section Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center font-bold text-xs border border-purple-200">
            03
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Departemen — Pelaksanaan Kelas & Pembelajaran (L2 Pre-Post)
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                · Plan vs Actual, Kehadiran, & Retensi Pengetahuan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fokus: Apakah training berjalan sesuai rencana, peserta hadir, dan capaian pembelajaran tercatat?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenTargetModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-xs font-semibold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ambang Kehadiran ({targetConfig.attendanceThreshold}%)</span>
          </button>
          <button className="text-slate-400 hover:text-slate-700">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* KPI Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Rencana Kelas',
                  'Departemen — Pelaksanaan',
                  'Target alokasi kelas tahunan/kuartal yang ditetapkan pada kalender training',
                  metrics.programTable.map((p) => ({
                    id: p.programId,
                    title: p.programTitle,
                    date: '2026',
                    department: p.department,
                    source: p.source,
                    trainer: '-',
                    metric1Label: 'Rencana',
                    metric1Value: `${p.rencana} Kelas`,
                    metric2Label: 'Terlaksana',
                    metric2Value: `${p.terlaksana} Kelas`,
                    status: p.terlaksana >= p.rencana ? 'Selesai' : 'Sedang Berjalan',
                  }))
                )
              }
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="text-slate-500 text-xs font-medium mb-1">Rencana Kelas</div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
                {metrics.rencanaKelas}{' '}
                <span className="text-xs font-normal text-slate-500">Kelas</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Target alokasi rencana</div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Kelas Terlaksana',
                  'Departemen — Pelaksanaan',
                  'Jumlah kelas training yang selesai dieksekusi',
                  metrics.programTable.map((p) => ({
                    id: p.programId,
                    title: p.programTitle,
                    date: '2026',
                    department: p.department,
                    source: p.source,
                    trainer: '-',
                    metric1Label: 'Terlaksana',
                    metric1Value: `${p.terlaksana} Kelas`,
                    metric2Label: 'Rencana',
                    metric2Value: `${p.rencana} Kelas`,
                    status: 'Terlaksana',
                  }))
                )
              }
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="text-slate-500 text-xs font-medium mb-1">Kelas Terlaksana</div>
              <div className="text-2xl font-bold text-emerald-800 font-mono-numbers">
                {metrics.kelasTerlaksana}{' '}
                <span className="text-xs font-normal text-slate-500">Kelas</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
                {Math.round((metrics.kelasTerlaksana / (metrics.rencanaKelas || 1)) * 100)}% dari rencana
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Tingkat Kehadiran',
                  'Departemen — Pelaksanaan',
                  'Persentase peserta hadir dari total undangan sesi selesai (jadwal mendatang dikecualikan)',
                  [
                    {
                      id: 'att-rate',
                      title: 'Kehadiran Sesi Selesai',
                      date: '2026',
                      department: 'Semua Departemen',
                      source: 'Presensi',
                      trainer: '-',
                      metric1Label: 'Hadir',
                      metric1Value: `${metrics.hadirCount} Orang`,
                      metric2Label: 'Total Undangan',
                      metric2Value: `${metrics.totalUndanganSelesai} Orang`,
                      status: `${metrics.tingkatKehadiranPersen}% Kehadiran`,
                    },
                  ]
                )
              }
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="text-slate-500 text-xs font-medium mb-1">Tingkat Kehadiran</div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
                {metrics.tingkatKehadiranPersen}%
              </div>
              <div
                className={`text-[11px] mt-1 font-semibold ${
                  metrics.tingkatKehadiranPersen >= targetConfig.attendanceThreshold
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                {metrics.tingkatKehadiranPersen >= targetConfig.attendanceThreshold
                  ? '≥ Target Kehadiran'
                  : `< Target (${targetConfig.attendanceThreshold}%)`}
              </div>
            </div>

            {/* Card 4 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Kelengkapan Pasangan Pre-Post',
                  'Departemen — Pembelajaran L2',
                  'Proporsi peserta hadir yang menyelesaikan kedua tes (pretest dan posttest)',
                  [
                    {
                      id: 'paired-summary',
                      title: 'Kelengkapan Pasangan Ujian L2',
                      date: '2026',
                      department: 'Semua Departemen',
                      source: 'L2 Test',
                      trainer: '-',
                      metric1Label: 'Pasangan Nilai Lengkap',
                      metric1Value: `${metrics.pairedCount} Orang`,
                      metric2Label: 'Peserta Hadir',
                      metric2Value: `${metrics.hadirCount} Orang`,
                      status: `${metrics.kelengkapanPasanganPersen}% Lengkap`,
                    },
                  ]
                )
              }
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="text-slate-500 text-xs font-medium mb-1">Pasangan Nilai L2</div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
                {metrics.kelengkapanPasanganPersen}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
                {metrics.pairedCount} dari {metrics.hadirCount} peserta hadir
              </div>
            </div>

            {/* Card 5 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Perubahan Nilai Rata-Rata (Delta Poin)',
                  'Departemen — Pembelajaran L2',
                  'Kenaikan rata-rata skor posttest terhadap pretest hanya dari peserta yang memiliki pasangan nilai lengkap',
                  [
                    {
                      id: 'delta-summary',
                      title: 'Kenaikan Nilai Ujian Pembelajaran',
                      date: '2026',
                      department: 'Semua Departemen',
                      source: 'L2 Test',
                      trainer: '-',
                      metric1Label: 'Rata-rata Pretest',
                      metric1Value: `${metrics.avgPretest}`,
                      metric2Label: 'Rata-rata Posttest',
                      metric2Value: `${metrics.avgPosttest}`,
                      status: `+${metrics.deltaScore} Poin`,
                    },
                  ]
                )
              }
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="text-slate-500 text-xs font-medium mb-1">Perubahan Nilai (L2)</div>
              <div className="text-2xl font-bold text-emerald-800 font-mono-numbers">
                +{metrics.deltaScore}{' '}
                <span className="text-xs font-normal text-slate-500">Poin</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
                Pre {metrics.avgPretest} → Post {metrics.avgPosttest}
              </div>
            </div>
          </div>

          {/* Context Note on Learning & Interpretation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="text-slate-600">
                <span className="font-semibold text-slate-800">Aturan Perhitungan Nilai: </span>
                Skor kosong (tidak ikut tes) tidak dianggap nol dan tidak dimasukkan ke dalam perhitungan rata-rata.
                Jadwal mendatang dikecualikan dari denominator kehadiran.
              </div>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-900">
                <span className="font-semibold text-amber-950">Prinsip Evaluasi L2: </span>
                Kenaikan nilai mencerminkan penyerapan materi pada instrumen tes bersangkutan,
                namun tidak otomatis membuktikan peningkatan produktivitas kerja langsung di lapangan.
              </div>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Plan vs Actual Kelas */}
            {viewSettings.showPlanVsActualChart && (
              <div className="lg:col-span-2">
                <GroupedBarChart
                  title="Plan vs Actual Kelas per Program"
                  subtitle="Perbandingan target rencana kelas terhadap realisasi pelaksanaan"
                  unit="Jumlah Kelas"
                  seriesAName="Rencana Kelas"
                  seriesBName="Terlaksana"
                  seriesAColor="#94a3b8"
                  seriesBColor="#0284c7"
                  data={planVsActualClasses}
                  formatValue={(val) => `${val} kls`}
                  onItemClick={(item) => {
                    const row = metrics.programTable.find((p) => p.programId === item.id);
                    if (row) {
                      onDrilldown(
                        `Pelaksanaan: ${row.programTitle}`,
                        'Departemen — Pelaksanaan',
                        `Departemen: ${row.department} (${row.source})`,
                        [
                          {
                            id: row.programId,
                            title: row.programTitle,
                            date: '2026',
                            department: row.department,
                            source: row.source,
                            trainer: '-',
                            metric1Label: 'Rencana',
                            metric1Value: `${row.rencana} Kelas`,
                            metric2Label: 'Terlaksana',
                            metric2Value: `${row.terlaksana} Kelas`,
                            status: 'Terlaksana',
                          },
                        ]
                      );
                    }
                  }}
                />
              </div>
            )}

            {/* Chart 2: Status Kehadiran Donut */}
            {viewSettings.showAttendanceDonut && (
              <div>
                <DonutChart
                  title="Komposisi Status Kehadiran"
                  subtitle="Distribusi presensi dari sesi yang telah selesai berjalan"
                  unit="Peserta"
                  data={attendanceDonutSegments}
                  centerLabel="Undangan Selesai"
                  formatValue={(val) => `${val} Org`}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Paired Bar Pretest vs Posttest */}
            {viewSettings.showPrePostPairedChart && (
              <div>
                <PairedBarChart
                  title="Rata-rata Pretest vs Posttest per Program"
                  subtitle="Hanya membandingkan peserta yang memiliki pasangan nilai pre & post valid"
                  data={metrics.pairedDistribution}
                  passingGrade={targetConfig.passingGrade}
                  onItemClick={(item) => {
                    onDrilldown(
                      `Sebaran Pre-Post: ${item.programTitle}`,
                      'Departemen — Pembelajaran L2',
                      `Sebaran nilai peserta valid (${item.validCount} orang)`,
                      [
                        {
                          id: item.programTitle,
                          title: item.programTitle,
                          date: '2026',
                          department: 'Peserta Ujian',
                          source: 'L2 Assessment',
                          trainer: '-',
                          metric1Label: 'Pretest Rata-rata',
                          metric1Value: `${item.pretest}`,
                          metric2Label: 'Posttest Rata-rata',
                          metric2Value: `${item.posttest}`,
                          status: `+${item.delta} Poin`,
                        },
                      ]
                    );
                  }}
                />
              </div>
            )}

            {/* Chart 4: Delta Score per Program */}
            {viewSettings.showDeltaScoreChart && (
              <div>
                <HorizontalBarChart
                  title="Perubahan Nilai (Delta) per Program"
                  subtitle="Peningkatan poin posttest relatif terhadap pretest"
                  unit="Poin Peningkatan"
                  maxValue={35}
                  data={deltaScoreData}
                  targetLine={targetConfig.scoreDeltaTarget}
                  targetLabel="Target Delta"
                />
              </div>
            )}
          </div>

          {/* Chart 5: Line chart tren kehadiran */}
          {viewSettings.showAttendanceTrendChart && (
            <div>
              <LineChart
                title="Tren Tingkat Kehadiran Antarperiode"
                subtitle="Perkembangan kepatuhan kehadiran peserta training"
                unit="Persen (%)"
                data={attendanceTrendData}
                lineColor="#059669"
                minY={50}
                maxY={100}
                formatValue={(val) => `${val}%`}
              />
            </div>
          )}

          {/* Full Table: Program Execution & Learning Matrix */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Matriks Pelaksanaan Departemen & Hasil Evaluasi L2
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                Menghubungkan target rencana dengan retensi hasil belajar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Program Training</th>
                    <th className="px-3.5 py-2.5">Departemen</th>
                    <th className="px-3.5 py-2.5 text-center">Rencana</th>
                    <th className="px-3.5 py-2.5 text-center">Terlaksana</th>
                    <th className="px-3.5 py-2.5 text-center">Undangan</th>
                    <th className="px-3.5 py-2.5 text-center">Hadir</th>
                    <th className="px-3.5 py-2.5 text-center">Psg Valid</th>
                    <th className="px-3.5 py-2.5 text-center">Pretest</th>
                    <th className="px-3.5 py-2.5 text-center">Posttest</th>
                    <th className="px-3.5 py-2.5 text-center font-bold">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {metrics.programTable.map((row) => (
                    <tr
                      key={row.programId}
                      onClick={() =>
                        onDrilldown(
                          `Matriks: ${row.programTitle}`,
                          'Departemen — Pelaksanaan & L2',
                          `Departemen ${row.department} (${row.source})`,
                          [
                            {
                              id: row.programId,
                              title: row.programTitle,
                              date: '2026',
                              department: row.department,
                              source: row.source,
                              trainer: '-',
                              metric1Label: 'Kehadiran',
                              metric1Value: `${row.hadir} / ${row.undangan}`,
                              metric2Label: 'Delta Poin',
                              metric2Value: row.deltaPoin !== null ? `+${row.deltaPoin}` : '-',
                              status: 'Terlaksana',
                            },
                          ]
                        )
                      }
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {row.programTitle}
                        <div className="text-[11px] font-normal font-mono text-slate-400">
                          {row.code} · {row.source}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">{row.department}</td>
                      <td className="px-3.5 py-2.5 text-center font-mono-numbers">{row.rencana}</td>
                      <td className="px-3.5 py-2.5 text-center font-mono-numbers font-medium text-slate-800">
                        {row.terlaksana}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono-numbers text-slate-600">
                        {row.undangan}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono-numbers font-bold text-slate-800">
                        {row.hadir}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono-numbers text-blue-700 font-medium">
                        {row.pasanganValid}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono-numbers text-slate-600">
                        {row.avgPretest !== null ? row.avgPretest : '-'}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono-numbers font-semibold text-emerald-800">
                        {row.avgPosttest !== null ? row.avgPosttest : '-'}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono-numbers font-bold text-emerald-700">
                        {row.deltaPoin !== null ? `+${row.deltaPoin}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
