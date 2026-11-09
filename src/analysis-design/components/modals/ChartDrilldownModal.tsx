import React from 'react';
import { X, ExternalLink, CheckCircle, Info } from 'lucide-react';

interface DrilldownRecord {
  id: string;
  title: string;
  date: string;
  department: string;
  source: string;
  trainer: string;
  metric1Label: string;
  metric1Value: string | number;
  metric2Label: string;
  metric2Value: string | number;
  status: string;
}

interface ChartDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category: string;
  description?: string;
  records: DrilldownRecord[];
}

export const ChartDrilldownModal: React.FC<ChartDrilldownModalProps> = ({
  isOpen,
  onClose,
  title,
  category,
  description,
  records,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                {category}
              </span>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
            </div>
            {description && (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
            <span>Menampilkan {records.length} baris data pembentuk angka</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Data Simulasi Lokal Terverifikasi
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-2.5">Program / Sesi</th>
                  <th className="px-3.5 py-2.5">Departemen</th>
                  <th className="px-3.5 py-2.5">Sumber</th>
                  <th className="px-3.5 py-2.5">Instruktur</th>
                  <th className="px-3.5 py-2.5 text-right">
                    {records[0]?.metric1Label || 'Metrik 1'}
                  </th>
                  <th className="px-3.5 py-2.5 text-right">
                    {records[0]?.metric2Label || 'Metrik 2'}
                  </th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3.5 py-3 font-medium text-slate-900">
                      <div>{r.title}</div>
                      <div className="text-[11px] text-slate-400">{r.date}</div>
                    </td>
                    <td className="px-3.5 py-3 text-slate-600">{r.department}</td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {r.source}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-600">
                      {r.trainer || <span className="text-amber-600 italic">Belum Ditentukan</span>}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono-numbers font-medium text-slate-800">
                      {r.metric1Value}
                    </td>
                    <td className="px-3.5 py-3 text-right font-mono-numbers font-medium text-slate-800">
                      {r.metric2Value}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'Terlaksana'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'Berjalan'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : r.status === 'Mendatang'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Data ini terhubung langsung ke dataset simulasi memory-state
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white font-medium rounded-md hover:bg-slate-700 transition-colors"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
};
