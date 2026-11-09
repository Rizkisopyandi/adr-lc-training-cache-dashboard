import React from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, CornerDownRight } from 'lucide-react';
import { SupervisorFinding } from '../../types/training';

interface FindingDetailModalProps {
  finding: SupervisorFinding | null;
  onClose: () => void;
  onToggleReview: (id: string) => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  onClose,
  onToggleReview,
}) => {
  if (!finding) return null;

  const isReviewed = finding.reviewStatus === 'Ditinjau Demo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                finding.severity === 'Tinggi'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {finding.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    finding.severity === 'Tinggi'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  Prioritas {finding.severity}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{finding.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Program</span>
              <span className="font-semibold text-slate-800 truncate block">
                {finding.programTitle}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Kode Sesi</span>
              <span className="font-mono font-semibold text-slate-800">
                {finding.sessionCode}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Departemen</span>
              <span className="font-semibold text-slate-800 truncate block">
                {finding.department}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Database Sumber</span>
              <span className="font-mono font-semibold text-emerald-800">
                {finding.source}
              </span>
            </div>
          </div>

          {/* Evidence Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-slate-500" />
              Bukti Baris Data / Peserta Terkait ({finding.evidenceCount} item)
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs font-mono">
              {finding.evidenceDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-slate-700 bg-white p-2 rounded border border-slate-100"
                >
                  <span className="text-slate-400 text-[10px] w-4">{idx + 1}.</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inspector Recommendation */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Usulan Tindakan Pemeriksa (Supervisor)
            </div>
            <p className="text-amber-950 leading-relaxed">
              {finding.inspectorRecommendation}
            </p>
          </div>

          {/* Scope Note */}
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            *Catatan: Tombol di bawah hanya mengubah status tinjauan pada state demo lokal.
            Tidak melakukan penulisan ke database sumber ataupun memodifikasi data riil.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              onToggleReview(finding.id);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              isReviewed
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isReviewed ? 'Batalkan Status Ditinjau' : 'Tandai Selesai Ditinjau (Demo)'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
