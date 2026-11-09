import React, { useState } from 'react';
import { X, Target, Info, Check } from 'lucide-react';
import { TargetConfig } from '../../types/training';
import { DEFAULT_TARGET_CONFIG } from '../../data/mockTrainingData';

interface TargetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TargetConfig;
  onSave: (newConfig: TargetConfig) => void;
}

export const TargetSettingsModal: React.FC<TargetSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [localConfig, setLocalConfig] = useState<TargetConfig>(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_TARGET_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Pengaturan Target KPI (Mode Simulasi)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Perubahan target di bawah ini hanya mengubah penilaian terhadap target pada simulasi demo,
              bukan mengubah data mentah atau nilai peserta.
            </span>
          </div>

          {/* L1 Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-800">Target Kepuasan Peserta (L1)</label>
              <span className="font-mono-numbers font-bold text-emerald-700 text-sm">
                {localConfig.l1Target.toFixed(2)} / 5.00
              </span>
            </div>
            <input
              type="range"
              min="3.50"
              max="4.80"
              step="0.05"
              value={localConfig.l1Target}
              onChange={(e) =>
                setLocalConfig((prev) => ({ ...prev, l1Target: parseFloat(e.target.value) }))
              }
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Standar 3.80</span>
              <span>Default 4.25</span>
              <span>Target Tinggi 4.70</span>
            </div>
          </div>

          {/* Attendance Threshold */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-800">Ambang Minimal Kehadiran</label>
              <span className="font-mono-numbers font-bold text-emerald-700 text-sm">
                {localConfig.attendanceThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="95"
              step="5"
              value={localConfig.attendanceThreshold}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  attendanceThreshold: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>70%</span>
              <span>Target 85%</span>
              <span>95%</span>
            </div>
          </div>

          {/* Score Delta Target */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-800">Target Peningkatan Nilai (L2 Delta)</label>
              <span className="font-mono-numbers font-bold text-emerald-700 text-sm">
                +{localConfig.scoreDeltaTarget} Poin
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={localConfig.scoreDeltaTarget}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  scoreDeltaTarget: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>+5 Poin</span>
              <span>Target +15 Poin</span>
              <span>+30 Poin</span>
            </div>
          </div>

          {/* Passing Grade */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-800">Nilai Kelulusan Evaluasi (Passing Grade)</label>
              <span className="font-mono-numbers font-bold text-emerald-700 text-sm">
                {localConfig.passingGrade} / 100
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="85"
              step="5"
              value={localConfig.passingGrade}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  passingGrade: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>60 (Dasar)</span>
              <span>75 (Standar)</span>
              <span>85 (Tinggi)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Kembalikan ke Default
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Simpan Target
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
