import React from 'react';
import { X, Sliders, CheckSquare, RotateCcw } from 'lucide-react';
import { ViewSettings } from '../../types/training';
import { DEFAULT_VIEW_SETTINGS } from '../../data/mockTrainingData';

interface ViewCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ViewSettings;
  onSave: (newSettings: ViewSettings) => void;
}

export const ViewCustomizerModal: React.FC<ViewCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = React.useState<ViewSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const toggle = (key: keyof ViewSettings) => {
    setLocalSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    const updated = { ...localSettings };
    (Object.keys(updated) as Array<keyof ViewSettings>).forEach((k) => {
      updated[k] = true;
    });
    setLocalSettings(updated);
  };

  const resetDefault = () => {
    setLocalSettings(DEFAULT_VIEW_SETTINGS);
  };

  const handleApply = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Atur Tampilan Dashboard</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-xs">
          <p className="text-slate-500">
            Pilih section dan komponen grafik yang ingin ditampilkan pada halaman Dashboard.
            Setelan disimpan pada sesi browser Anda.
          </p>

          {/* Section 1 */}
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <label className="flex items-center justify-between font-bold text-slate-900 cursor-pointer">
              <span>1. Section CEO / Manajemen</span>
              <input
                type="checkbox"
                checked={localSettings.showCEO}
                onChange={() => toggle('showCEO')}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </label>
            {localSettings.showCEO && (
              <div className="pl-4 space-y-1.5 pt-1 border-t border-slate-100 text-slate-600">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Grouped Bar: Anggaran vs Biaya Aktual</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showBudgetVsActualChart}
                    onChange={() => toggle('showBudgetVsActualChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Line Chart: Tren Biaya & Partisipasi</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showCostTrendChart}
                    onChange={() => toggle('showCostTrendChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Donut: Komposisi Biaya per Sumber</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showSourceCompositionChart}
                    onChange={() => toggle('showSourceCompositionChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Section 2 */}
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <label className="flex items-center justify-between font-bold text-slate-900 cursor-pointer">
              <span>2. Section Subdivisi — Evaluasi L1</span>
              <input
                type="checkbox"
                checked={localSettings.showL1}
                onChange={() => toggle('showL1')}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </label>
            {localSettings.showL1 && (
              <div className="pl-4 space-y-1.5 pt-1 border-t border-slate-100 text-slate-600">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Horizontal Bar: Skor Aspek Layanan (Materi, Trainer, dsb)</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showL1AspectsChart}
                    onChange={() => toggle('showL1AspectsChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Bar Chart: Skor L1 per Program vs Target</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showL1ProgramChart}
                    onChange={() => toggle('showL1ProgramChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Donut: Rasio Respons Evaluasi</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showL1ResponseDonut}
                    onChange={() => toggle('showL1ResponseDonut')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Line Chart: Tren L1 Antarperiode</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showL1TrendChart}
                    onChange={() => toggle('showL1TrendChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Section 3 */}
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <label className="flex items-center justify-between font-bold text-slate-900 cursor-pointer">
              <span>3. Section Departemen — Pelaksanaan & L2</span>
              <input
                type="checkbox"
                checked={localSettings.showL2}
                onChange={() => toggle('showL2')}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </label>
            {localSettings.showL2 && (
              <div className="pl-4 space-y-1.5 pt-1 border-t border-slate-100 text-slate-600">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Grouped Bar: Plan vs Actual Kelas</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showPlanVsActualChart}
                    onChange={() => toggle('showPlanVsActualChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Donut: Komposisi Status Kehadiran</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showAttendanceDonut}
                    onChange={() => toggle('showAttendanceDonut')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Paired Bar: Pretest vs Posttest Rata-rata</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showPrePostPairedChart}
                    onChange={() => toggle('showPrePostPairedChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Line Chart: Tren Kehadiran Antarperiode</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showAttendanceTrendChart}
                    onChange={() => toggle('showAttendanceTrendChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Section 4 */}
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <label className="flex items-center justify-between font-bold text-slate-900 cursor-pointer">
              <span>4. Section Supervisor / Eksekutor (Temuan Operasional)</span>
              <input
                type="checkbox"
                checked={localSettings.showSupervisor}
                onChange={() => toggle('showSupervisor')}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </label>
            {localSettings.showSupervisor && (
              <div className="pl-4 space-y-1.5 pt-1 border-t border-slate-100 text-slate-600">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Horizontal Bar: Temuan Berdasarkan Jenis</span>
                  <input
                    type="checkbox"
                    checked={localSettings.showFindingsCategoryChart}
                    onChange={() => toggle('showFindingsCategoryChart')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="text-xs text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <CheckSquare className="w-3.5 h-3.5" /> Pilih Semua
            </button>
            <button
              onClick={resetDefault}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Default
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Batal
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
            >
              Terapkan Tampilan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
