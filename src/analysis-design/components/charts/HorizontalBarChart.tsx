import React from 'react';

interface HorizontalBarItem {
  id?: string;
  label: string;
  sublabel?: string;
  value: number;
  displayValue?: string;
  target?: number;
  color?: string;
}

interface HorizontalBarChartProps {
  title: string;
  subtitle?: string;
  unit: string;
  maxValue?: number;
  data: HorizontalBarItem[];
  targetLine?: number;
  targetLabel?: string;
  onItemClick?: (item: HorizontalBarItem) => void;
  defaultBarColor?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  title,
  subtitle,
  unit,
  maxValue,
  data,
  targetLine,
  targetLabel,
  onItemClick,
  defaultBarColor = '#059669', // Corporate Green
}) => {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
          <span>Data tidak tersedia</span>
        </div>
      </div>
    );
  }

  const max = maxValue || Math.max(...data.map((d) => d.value), targetLine || 0, 1);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {targetLine && targetLabel && (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mr-2">
              Target: {targetLine} ({targetLabel})
            </span>
          )}
          <span className="text-slate-400">Unit: {unit}</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {data.map((item, idx) => {
          const percentage = Math.min(100, Math.max(0, (item.value / max) * 100));
          const targetPercentage = targetLine ? (targetLine / max) * 100 : null;
          const barColor = item.color || defaultBarColor;
          const isAboveTarget = targetLine ? item.value >= targetLine : null;

          return (
            <div
              key={idx}
              onClick={() => onItemClick?.(item)}
              className="group cursor-pointer p-1.5 rounded hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                    {item.label}
                  </span>
                  {item.sublabel && (
                    <span className="text-slate-400 text-[11px]">({item.sublabel})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono-numbers">
                  <span className="font-bold text-slate-900">
                    {item.displayValue || item.value}
                  </span>
                  {isAboveTarget !== null && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        isAboveTarget
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-amber-700 bg-amber-50'
                      }`}
                    >
                      {isAboveTarget ? 'Capai Target' : 'Di Bawah Target'}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="relative w-full h-3 bg-slate-100 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: barColor,
                  }}
                />
                {/* Target Marker */}
                {targetPercentage !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${targetPercentage}%` }}
                    title={`Target: ${targetLine}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onItemClick && (
        <div className="mt-3 text-[11px] text-slate-400 text-right">
          Klik baris untuk memfilter temuan/rincian aspek
        </div>
      )}
    </div>
  );
};
