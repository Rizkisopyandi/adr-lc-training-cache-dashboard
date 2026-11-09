import {percentages100} from '../../utils/chartNumbers';
import React, { useState } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  sublabel?: string;
}

interface DonutChartProps {
  title: string;
  subtitle?: string;
  unit: string;
  data: DonutSegment[];
  centerLabel?: string;
  formatValue?: (val: number) => string;
  singleSourceFallbackTitle?: string;
  onSegmentClick?: (segment: DonutSegment) => void;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  subtitle,
  unit,
  data,
  centerLabel,
  formatValue = (v) => v.toLocaleString('id-ID'),
  singleSourceFallbackTitle,
  onSegmentClick,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const legendPercentages = percentages100(data.map(d=>d.value));

  // Requirement: "Jangan gunakan donut jika hanya satu sumber dipilih; ganti dengan rincian nilainya."
  const activeSegments = data.filter((d) => d.value > 0);
  const isSingleSource = activeSegments.length <= 1;

  if (total === 0 || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
        <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
          <span>Tidak ada data untuk ditampilkan</span>
        </div>
      </div>
    );
  }

  // Single-source graceful fallback: Render clean tabular breakdown instead of a single 100% donut
  if (isSingleSource) {
    const single = activeSegments[0] || data[0];
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="mb-4 pb-3 border-b border-slate-100">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {singleSourceFallbackTitle || 'Rincian Nilai Tunggal Terpilih'}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-center items-center text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Sumber Terpilih: {single.label}
          </span>
          <span className="text-2xl font-bold text-emerald-800 font-mono-numbers">
            {formatValue(single.value)}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Mewakili 100% dari total yang disaring ({unit})
          </span>
          {single.sublabel && (
            <span className="text-xs text-slate-400 mt-1">{single.sublabel}</span>
          )}
        </div>
      </div>
    );
  }

  // Calculate SVG arc paths for donut
  const size = 200;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-xs text-slate-400 font-medium">Unit: {unit}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* SVG Donut Circle */}
        <div className="relative flex justify-center items-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
            {data.map((item, idx) => {
              if (item.value <= 0) return null;
              const percent = item.value / total;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += percent;

              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSegmentClick?.(item)}
                role={onSegmentClick ? "button" : undefined}
                tabIndex={onSegmentClick ? 0 : undefined}
                onKeyDown={event=>{if(onSegmentClick && (event.key === "Enter" || event.key === " ")){event.preventDefault();onSegmentClick(item);}}}
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-[11px] font-medium text-slate-500">
              {centerLabel || 'Total'}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-mono-numbers">
              {formatValue(total)}
            </span>
          </div>
        </div>

        {/* Legend with value and exact percentages (ensuring 100% total) */}
        <div className="space-y-2">
          {data.map((item, idx) => {
            const percent = legendPercentages[idx];
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSegmentClick?.(item)}
                role={onSegmentClick ? "button" : undefined}
                tabIndex={onSegmentClick ? 0 : undefined}
                onKeyDown={event=>{if(onSegmentClick && (event.key === "Enter" || event.key === " ")){event.preventDefault();onSegmentClick(item);}}}
                className={`p-1.5 rounded flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  isHovered ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono-numbers text-slate-700">
                  <span className="font-semibold">{formatValue(item.value)}</span>
                  <span className="text-slate-400 text-[11px] w-9 text-right font-normal">
                    ({percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
