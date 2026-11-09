import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Star,
  Target,
  FileCheck2,
  TrendingUp,
  Sliders,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { L1Metrics } from '../../utils/trainingCalculations';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { DonutChart, DonutSegment } from '../charts/DonutChart';
import { LineChart, LineDataPoint } from '../charts/LineChart';
import { TargetConfig, ViewSettings } from '../../types/training';

interface SectionL1Props {
  metrics: L1Metrics;
  targetConfig: TargetConfig;
  viewSettings: ViewSettings;
  onOpenTargetModal: () => void;
  onDrilldown: (title: string, category: string, description: string, records: any[]) => void;
}

export const SectionL1: React.FC<SectionL1Props> = ({
  metrics,
  targetConfig,
  viewSettings,
  onOpenTargetModal,
  onDrilldown,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!viewSettings.showL1) return null;

  // Horizontal bar data for L1 Aspects
  const aspectData = [
    {
      label: 'Materi Pelatihan',
      sublabel: 'Relevansi & Kelengkapan Modul',
      value: metrics.aspectScores.materi,
      displayValue: `${metrics.aspectScores.materi} / 5.00`,
      color: metrics.aspectScores.materi >= targetConfig.l1Target ? '#059669' : '#d97706',
    },
    {
      label: 'Instruktur / Trainer',
      sublabel: 'Penguasaan Materi & Interaksi',
      value: metrics.aspectScores.trainer,
      displayValue: `${metrics.aspectScores.trainer} / 5.00`,
      color: metrics.aspectScores.trainer >= targetConfig.l1Target ? '#059669' : '#d97706',
    },
    {
      label: 'Fasilitas & Lab',
      sublabel: 'Kenyamanan Ruang & Alat Praktik',
      value: metrics.aspectScores.fasilitas,
      displayValue: `${metrics.aspectScores.fasilitas} / 5.00`,
      color: metrics.aspectScores.fasilitas >= targetConfig.l1Target ? '#059669' : '#d97706',
    },
    {
      label: 'Penyelenggaraan Panitia',
      sublabel: 'Ketepatan Waktu & Layanan Admin',
      value: metrics.aspectScores.penyelenggaraan,
      displayValue: `${metrics.aspectScores.penyelenggaraan} / 5.00`,
      color: metrics.aspectScores.penyelenggaraan >= targetConfig.l1Target ? '#059669' : '#d97706',
    },
  ];

  // Horizontal bar data for Programs L1 scores
  const programL1Data = metrics.programScores.map((p) => ({
    label: p.programTitle,
    sublabel: `${p.source} · ${p.responseCount} respons`,
    value: p.score,
    displayValue: `${p.score}`,
    color: p.score >= targetConfig.l1Target ? '#059669' : '#e11d48',
  }));

  // Donut chart for evaluation responses (Respons Valid vs Belum Ada Respons)
  const responseDonutSegments: DonutSegment[] = [
    {
      label: 'Respons Valid',
      value: metrics.responsValid,
      color: '#059669', // Emerald
      sublabel: 'Kuesioner lengkap',
    },
    {
      label: 'Belum Ada Respons',
      value: metrics.belumAdaRespons,
      color: '#cbd5e1', // Slate light
      sublabel: 'Menunggu pengisian peserta',
    },
  ];

  // Line chart data for L1 Period trend
  const l1TrendData: LineDataPoint[] = metrics.periodTrend.map((t) => ({
    label: t.periodLabel,
    value: t.score,
    subvalue: `${t.responseCount} respons`,
  }));

  const isTargetAchieved = metrics.gapScore >= 0;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Section Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-xs border border-blue-200">
            02
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Subdivisi — Evaluasi Reaksi (Level 1 Kirkpatrick)
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                · Kepuasan Peserta & Mutu Layanan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fokus: Bagaimana respons peserta dan aspek layanan training apa yang perlu ditingkatkan?
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
            <span>Ubah Target L1 ({targetConfig.l1Target.toFixed(2)})</span>
          </button>
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
                  'Skor L1 Rata-Rata Tertimbang',
                  'Subdivisi — Evaluasi L1',
                  'Dihitung dengan pembobotan jumlah respons per peserta valid (bukan rata-rata dari rata-rata)',
                  metrics.programScores.map((p) => ({
                    id: p.programTitle,
                    title: p.programTitle,
                    date: '2026',
                    department: p.source,
                    source: p.source,
                    trainer: 'Instruktur',
                    metric1Label: 'Rata-rata Skor L1',
                    metric1Value: `${p.score} / 5.00`,
                    metric2Label: 'Jumlah Respons',
                    metric2Value: `${p.responseCount} Orang`,
                    status: p.score >= targetConfig.l1Target ? 'Capai Target' : 'Di Bawah Target',
                  }))
                )
              }
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-medium">Skor L1 Rata-Rata Tertimbang</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
                {metrics.weightedScore.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">/ 5.00</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Berdasarkan pembobotan {metrics.responsValid} respons peserta
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={onOpenTargetModal}
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-medium">Target Mutu L1</span>
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
                {targetConfig.l1Target.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">/ 5.00</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                Klik untuk simulasi batas target
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Cakupan Respons L1',
                  'Subdivisi — Evaluasi L1',
                  'Persentase peserta hadir yang telah melengkapi kuesioner evaluasi L1',
                  [
                    {
                      id: 'resp-summary',
                      title: 'Ringkasan Partisipasi Kuesioner',
                      date: '2026',
                      department: 'Semua Departemen',
                      source: 'L1 Form',
                      trainer: '-',
                      metric1Label: 'Peserta Hadir (Wajib)',
                      metric1Value: `${metrics.totalHadir} Orang`,
                      metric2Label: 'Respons Valid Masuk',
                      metric2Value: `${metrics.responsValid} Form`,
                      status: `${metrics.cakupanPersen}% Selesai`,
                    },
                  ]
                )
              }
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-medium">Cakupan Respons</span>
                <FileCheck2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono-numbers">
                {metrics.cakupanPersen}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono-numbers">
                {metrics.responsValid} dari {metrics.totalHadir} peserta wajib isi
              </div>
            </div>

            {/* Card 4 */}
            <div
              onClick={() =>
                onDrilldown(
                  'Gap Skor L1 terhadap Target',
                  'Subdivisi — Evaluasi L1',
                  'Selisih capaian aktual rata-rata terhadap target KPI mutu L1',
                  [
                    {
                      id: 'gap-summary',
                      title: 'Analisis Gap Mutu Pelatihan',
                      date: '2026',
                      department: 'ADR Learning Center',
                      source: 'L1 Benchmark',
                      trainer: '-',
                      metric1Label: 'Skor Aktual',
                      metric1Value: `${metrics.weightedScore.toFixed(2)}`,
                      metric2Label: 'Target KPI',
                      metric2Value: `${targetConfig.l1Target.toFixed(2)}`,
                      status: isTargetAchieved ? 'Capai Target' : 'Di Bawah Target',
                    },
                  ]
                )
              }
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all hover:border-emerald-300"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-medium">Gap terhadap Target</span>
                <TrendingUp
                  className={`w-4 h-4 ${isTargetAchieved ? 'text-emerald-600' : 'text-red-500'}`}
                />
              </div>
              <div
                className={`text-2xl font-bold font-mono-numbers ${
                  isTargetAchieved ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {metrics.gapScore >= 0 ? `+${metrics.gapScore.toFixed(2)}` : metrics.gapScore.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Status: {isTargetAchieved ? 'Memenuhi Standar Mutu' : 'Perlu Perbaikan Aspek Terkait'}
              </div>
            </div>
          </div>

          {/* Integration & Instrumentation Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="text-slate-600">
              <span className="font-semibold text-slate-800">Catatan Integrasi L1: </span>
              Aspek evaluasi di bawah (Materi, Trainer, Fasilitas, Penyelenggaraan) disajikan sebagai
              struktur standar demo dan siap disesuaikan saat spreadsheet kuesioner L1 asli diintegrasikan via Codex.
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Skor Aspek L1 */}
            {viewSettings.showL1AspectsChart && (
              <div>
                <HorizontalBarChart
                  title="Skor Evaluasi per Aspek Layanan"
                  subtitle="Nilai rata-rata tertimbang berdasarkan kepuasan peserta"
                  unit="Skala 1.00 - 5.00"
                  maxValue={5.0}
                  data={aspectData}
                  targetLine={targetConfig.l1Target}
                  targetLabel="Standar Mutu"
                  onItemClick={(item) => {
                    onDrilldown(
                      `Rincian Aspek: ${item.label}`,
                      'Subdivisi — Evaluasi L1',
                      `Analisis tanggapan untuk aspek ${item.label}`,
                      [
                        {
                          id: item.label,
                          title: item.label,
                          date: '2026',
                          department: 'ADR Learning Center',
                          source: 'Kuesioner L1',
                          trainer: '-',
                          metric1Label: 'Skor Aspek',
                          metric1Value: `${item.value} / 5.00`,
                          metric2Label: 'Target Standar',
                          metric2Value: `${targetConfig.l1Target} / 5.00`,
                          status: item.value >= targetConfig.l1Target ? 'Memenuhi' : 'Perlu Perbaikan',
                        },
                      ]
                    );
                  }}
                />
              </div>
            )}

            {/* Chart 2: Skor L1 per Program */}
            {viewSettings.showL1ProgramChart && (
              <div>
                <HorizontalBarChart
                  title="Skor L1 per Program Training vs Target"
                  subtitle="Pencapaian skor kepuasan tiap program terhadap garis target"
                  unit="Skala 1.00 - 5.00"
                  maxValue={5.0}
                  data={programL1Data}
                  targetLine={targetConfig.l1Target}
                  targetLabel="Target L1"
                  onItemClick={(item) => {
                    onDrilldown(
                      `Evaluasi Program: ${item.label}`,
                      'Subdivisi — Evaluasi L1',
                      'Rincian perolehan skor kepuasan peserta',
                      [
                        {
                          id: item.label,
                          title: item.label,
                          date: '2026',
                          department: 'Pelatihan Terlaksana',
                          source: item.sublabel || 'L1',
                          trainer: '-',
                          metric1Label: 'Rata-rata Skor',
                          metric1Value: `${item.value} / 5.00`,
                          metric2Label: 'Garis Target',
                          metric2Value: `${targetConfig.l1Target}`,
                          status: item.value >= targetConfig.l1Target ? 'Tercapai' : 'Di Bawah Target',
                        },
                      ]
                    );
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Donut Respons Evaluasi */}
            {viewSettings.showL1ResponseDonut && (
              <div>
                <DonutChart
                  title="Tingkat Kelengkapan Respons Evaluasi L1"
                  subtitle="Rasio pengisian form oleh peserta yang hadir pada kelas selesai"
                  unit="Peserta Wajib Isi"
                  data={responseDonutSegments}
                  centerLabel="Peserta Hadir"
                  formatValue={(val) => `${val} Orang`}
                  onSegmentClick={(seg) => {
                    onDrilldown(
                      `Status Pengisian Form L1: ${seg.label}`,
                      'Subdivisi — Evaluasi L1',
                      `Daftar peserta dengan status ${seg.label}`,
                      [
                        {
                          id: seg.label,
                          title: `Kategori: ${seg.label}`,
                          date: '2026',
                          department: 'ADR Learning Center',
                          source: 'Kuesioner L1',
                          trainer: '-',
                          metric1Label: 'Jumlah Peserta',
                          metric1Value: `${seg.value} Orang`,
                          metric2Label: 'Persentase',
                          metric2Value: `${metrics.totalHadir > 0 ? Math.round((seg.value / metrics.totalHadir) * 100) : 0}%`,
                          status: seg.label === 'Respons Valid' ? 'Lengkap' : 'Menunggu',
                        },
                      ]
                    );
                  }}
                />
              </div>
            )}

            {/* Chart 4: Line Chart Tren L1 Antarperiode */}
            {viewSettings.showL1TrendChart && (
              <div>
                <LineChart
                  title="Tren Skor L1 Antarperiode"
                  subtitle="Konsistensi mutu layanan pelatihan pada skala dan instrumen yang sama"
                  unit="Skor (1.00 - 5.00)"
                  data={l1TrendData}
                  lineColor="#0284c7"
                  minY={3.0}
                  maxY={5.0}
                  formatValue={(val) => val.toFixed(2)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
